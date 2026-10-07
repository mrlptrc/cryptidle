import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { fromNodeHeaders } from 'better-auth/node';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { z } from 'zod';
import { classes, regions, equipment, skills, config } from '@cryptidle/game-core';
import type { Character, PlayerPresence } from '@cryptidle/shared';
import { prisma, atomic, json, type Tx } from './db.js';
import { state, create, action, market, boss, insist, GameError, load, definition, finishBoss } from './game.js';
import type { WebSocket } from 'ws';

const uuid=z.string().uuid();
const schemas={
 character:z.object({name:z.string().trim().min(3).max(20).regex(/^[\p{L}\p{N}_ -]+$/u),classId:z.enum(['warrior','mage','priest'])}),
 hunt:z.object({regionId:z.string().max(60).nullable()}),
 build:z.object({rules:z.array(z.object({skillId:z.string().max(60),condition:z.discriminatedUnion('type',[z.object({type:z.literal('always')}),z.object({type:z.enum(['hp_below','enemy_hp_above']),value:z.number().min(.05).max(.95)})])})).max(config.hotbarSlots).refine(a=>new Set(a.map(r=>r.skillId)).size===a.length),potionThreshold:z.number().min(0).max(1)}),
 equip:z.object({itemId:uuid,equip:z.boolean()}),sell:z.object({itemId:uuid}),
 potions:z.object({quantity:z.number().int().min(1).max(100)}),skin:z.object({skin:z.union([z.literal(0),z.literal(1)])}),
 list:z.object({itemId:uuid,price:z.number().int().min(1).max(1000000)}),
 join:z.object({code:z.string().trim().min(4).max(12)}),ready:z.object({ready:z.boolean(),preparation:z.enum(['balanced','attack','guard'])}),
 empty:z.object({}),chat:z.object({text:z.string().trim().min(1).max(300)})
};
export async function createApp(options:{now?:()=>number;logger?:boolean}={}) {
 const now=options.now||Date.now;
 const origin=process.env.APP_ORIGIN||'http://localhost:5173';
 const secret=process.env.BETTER_AUTH_SECRET;
 if(!secret||secret.length<32) throw new Error('BETTER_AUTH_SECRET must contain at least 32 characters');
 const auth=betterAuth({database:prismaAdapter(prisma,{provider:'postgresql'}),baseURL:origin,secret,trustedOrigins:[origin],
  emailAndPassword:{enabled:true,minPasswordLength:10,maxPasswordLength:128},
  advanced:{useSecureCookies:process.env.NODE_ENV==='production',defaultCookieAttributes:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}},
  session:{expiresIn:60*60*24*7,updateAge:60*60*24},rateLimit:{enabled:true,window:60,max:30}
 });
 const app=Fastify({logger:options.logger??false,bodyLimit:16384,trustProxy:process.env.TRUST_PROXY==='true'});
 await app.register(rateLimit,{max:180,timeWindow:'1 minute'});
 await app.register(websocket,{options:{maxPayload:1024}});
 const peers=new Map<WebSocket,{userId:string;player:PlayerPresence;headers:Parameters<typeof fromNodeHeaders>[0];alive:boolean}>();
 const broadcast=(message:unknown)=>{const data=JSON.stringify(message);for(const socket of peers.keys())if(socket.readyState===1)socket.send(data);};
 async function presence(){
  for(const [socket,peer] of peers){
   const session=await auth.api.getSession({headers:fromNodeHeaders(peer.headers)});
   if(!session){socket.close();peers.delete(socket);continue;}
   const row=await prisma.character.findUnique({where:{userId:peer.userId}});
   if(!row){socket.close();peers.delete(socket);continue;}
   const c=row.data as unknown as Character;peer.player={id:c.id,name:c.name,classId:c.classId,skin:c.skin,regionId:c.regionId};
  }
  broadcast({type:'presence',players:[...new Map([...peers.values()].map(p=>[p.player.id,p.player])).values()]});
 }
 app.setErrorHandler((error,request,reply)=>{
  if(error instanceof z.ZodError)return reply.code(400).send({error:'Dados inválidos',details:error.issues.map(i=>i.path.join('.')+': '+i.message)});
  if(error instanceof GameError)return reply.code(error.statusCode).send({error:error.message});
  if(error instanceof Error && 'statusCode' in error && typeof error.statusCode==='number'&&error.statusCode<500)return reply.code(error.statusCode).send({error:error.message});
  // Never log request bodies, cookies, credentials or Prisma argument dumps.
  app.log.error({code:error instanceof Error && 'code' in error?error.code:'INTERNAL',route:request.routeOptions.url},'Request failed');
  return reply.code(500).send({error:'Falha interna. Tente novamente com a mesma chave da operação.'});
 });
 app.addHook('onRequest',async(request,reply)=>{
  reply.header('X-Content-Type-Options','nosniff').header('Referrer-Policy','same-origin').header('X-Frame-Options','DENY');
  if(request.url.startsWith('/api/'))reply.header('Cache-Control','no-store');
  if(request.method==='POST')insist(request.headers.origin===origin,'Origem não permitida',403);
 });
 app.route({method:['GET','POST'],url:'/api/auth/*',handler:async(request,reply)=>{
  const response=await auth.handler(new Request(new URL(request.url,origin),{method:request.method,headers:fromNodeHeaders(request.headers),...(request.body?{body:JSON.stringify(request.body)}:{})}));
  reply.code(response.status);response.headers.forEach((value,key)=>{if(key!=='set-cookie')reply.header(key,value);});
  const cookies=response.headers.getSetCookie();if(cookies.length)reply.header('set-cookie',cookies);
  return reply.send(await response.text());
 }});
 const authenticate=async(headers: Parameters<typeof fromNodeHeaders>[0])=>{const session=await auth.api.getSession({headers:fromNodeHeaders(headers)});insist(session,'Entre na sua conta',401);return session.user.id;};
 const mutation=(path:string,schema:z.ZodType,fn:(tx:Tx,userId:string,data:Record<string,unknown>,time:number)=>Promise<unknown>,limit=60)=>{
  app.post(path,{config:{rateLimit:{max:limit,timeWindow:'1 minute'}}},async(request)=>{
   const userId=await authenticate(request.headers);const body=schema.parse(request.body||{}) as Record<string,unknown>;
   const key=uuid.parse(request.headers['idempotency-key']);
   const hash=createHash('sha256').update(request.url+'\n'+JSON.stringify(body)).digest('hex');
   const result=await atomic(async tx=>{
    const prior=await tx.idempotency.findUnique({where:{userId_key:{userId,key}}});
    if(prior){insist(prior.hash===hash,'Chave de idempotência reutilizada com dados diferentes',409);return prior.response;}
    const data={...body,...(request.params as Record<string,string>)};
    const response=await fn(tx,userId,data,now());
    await tx.idempotency.create({data:{userId,key,hash,response:json(response)}});return response;
   });
   if(path==='/api/chat')broadcast({type:'chat',message:(result as {message:unknown}).message});else broadcast({type:'refresh'});
   void presence().catch(()=>{});
   return result;
  });
 };
 app.get('/api/health',async()=>{await prisma.$queryRaw`SELECT 1`;return {ok:true};});
 app.get('/api/content',async()=>({classes,regions,equipment,skills,config}));
 app.get('/api/state',async request=>{const uid=await authenticate(request.headers);return atomic(tx=>state(tx,uid,now()));});
 mutation('/api/character',schemas.character,async(tx,uid,b,t)=>{await create(tx,uid,b.name as string,b.classId as Character['classId'],t);return state(tx,uid,t);});
 for(const kind of ['hunt','build','equip','sell','potions','skin'] as const)mutation('/api/'+kind,schemas[kind],(tx,uid,b,t)=>action(tx,uid,kind,b,t));
 mutation('/api/market',schemas.list,(tx,uid,b,t)=>market(tx,uid,'list',b,t));
 mutation('/api/market/:id/buy',schemas.empty,(tx,uid,b,t)=>{uuid.parse(b.id);return market(tx,uid,'buy',b,t);});
 mutation('/api/market/:id/cancel',schemas.empty,(tx,uid,b,t)=>{uuid.parse(b.id);return market(tx,uid,'cancel',b,t);});
 app.get('/api/market',async request=>{
  await authenticate(request.headers);const query=z.object({name:z.string().max(100).optional(),rarity:z.enum(['common','uncommon','rare','epic']).optional(),slot:z.enum(['weapon','head','chest','accessory']).optional()}).parse(request.query);
  const defs=equipment.filter(d=>(!query.name||d.name.toLocaleLowerCase().includes(query.name.toLocaleLowerCase()))&&(!query.rarity||d.rarity===query.rarity)&&(!query.slot||d.slot===query.slot));
  const listings=await prisma.marketListing.findMany({where:{item:{definitionId:{in:defs.map(d=>d.id)}}},include:{item:{include:{owner:{select:{name:true}}}}},orderBy:{createdAt:'desc'},take:200});
  return {listings:listings.map(l=>({id:l.id,item:{id:l.item.id,definitionId:l.item.definitionId,ownerId:l.item.ownerId,equipped:l.item.equipped,listed:l.item.listed},definition:definition(l.item.definitionId),price:l.price,sellerId:l.sellerId,sellerName:l.item.owner.name,createdAt:l.createdAt.getTime()}))};
 });
 for(const kind of ['create','join','ready','start','leave'] as const)mutation('/api/boss/'+kind,kind==='join'?schemas.join:kind==='ready'?schemas.ready:schemas.empty,(tx,uid,b,t)=>boss(tx,uid,kind,b,t));
 app.get('/api/boss',async request=>{const uid=await authenticate(request.headers);return atomic(async tx=>{const row=await tx.character.findUnique({where:{userId:uid}});return {room:row?.roomId?await finishBoss(tx,row.roomId,now()):null};});});
 app.get('/api/ranking',async request=>{await authenticate(request.headers);return {characters:await prisma.character.findMany({select:{id:true,name:true,classId:true,level:true,xp:true},orderBy:[{level:'desc'},{xp:'desc'},{name:'asc'}],take:100})};});
 app.get('/api/chat',async request=>{await authenticate(request.headers);const messages=await prisma.chatMessage.findMany({orderBy:{createdAt:'desc'},take:100});return {messages:messages.reverse().map(m=>({...m,createdAt:m.createdAt.getTime()}))};});
 mutation('/api/chat',schemas.chat,async(tx,uid,b,t)=>{
  const {c}=await load(tx,uid);const latest=await tx.chatMessage.findFirst({where:{characterId:c.id},orderBy:{createdAt:'desc'}});insist(!latest||t-latest.createdAt.getTime()>=1500,'Espere um pouco antes da próxima mensagem',429);
  const message=await tx.chatMessage.create({data:{characterId:c.id,name:c.name,text:b.text as string,createdAt:new Date(t)}});
  const oldest=await tx.chatMessage.findMany({orderBy:{createdAt:'desc'},skip:100,select:{id:true}});if(oldest.length)await tx.chatMessage.deleteMany({where:{id:{in:oldest.map(m=>m.id)}}});
  return {message:{...message,createdAt:message.createdAt.getTime()}};
 },20);
 app.get('/api/ws',{websocket:true,preValidation:async request=>{insist(request.headers.origin===origin,'Origem não permitida',403);await authenticate(request.headers);}},(socket,request)=>{
  let closed=false;socket.on('close',()=>{closed=true;peers.delete(socket);void presence().catch(()=>{});});socket.on('error',()=>{peers.delete(socket);});
  socket.on('pong',()=>{const peer=peers.get(socket);if(peer)peer.alive=true;});
  void (async()=>{const userId=await authenticate(request.headers);const row=await prisma.character.findUnique({where:{userId}});if(!row||closed){socket.close();return;}const c=row.data as unknown as Character;peers.set(socket,{userId,headers:request.headers,alive:true,player:{id:c.id,name:c.name,classId:c.classId,skin:c.skin,regionId:c.regionId}});await presence();})().catch(()=>socket.close());
 });
 const refresh=setInterval(()=>{broadcast({type:'refresh'});for(const [socket,peer] of peers){if(!peer.alive){socket.terminate();peers.delete(socket);continue;}peer.alive=false;socket.ping();}void presence().catch(()=>{});},5000);refresh.unref();
 app.addHook('onClose',async()=>{clearInterval(refresh);for(const socket of peers.keys())socket.close();});
 if(process.env.WEB_DIST){await app.register(fastifyStatic,{root:resolve(process.env.WEB_DIST)});app.setNotFoundHandler((request,reply)=>request.url.startsWith('/api/')?reply.code(404).send({error:'Rota não encontrada'}):reply.sendFile('index.html'));}
 return app;
}
