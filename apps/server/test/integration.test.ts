import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/app.js';
import { prisma, json } from '../src/db.js';
import { equipment, xpForLevel, getStats, settleHunt } from '@cryptidle/game-core';
import type { Character, GameState } from '@cryptidle/shared';

const enabled=Boolean(process.env.DATABASE_URL);
describe.skipIf(!enabled)('PostgreSQL economy and real authentication',()=>{
 let app:Awaited<ReturnType<typeof createApp>>;
 let time=Date.now();const origin='http://localhost:5173';
 const users:{cookie:string;id:string}[]=[];
 const request=(cookie:string,path:string,body:unknown={},key=randomUUID())=>app.inject({method:'POST',url:path,headers:{cookie,origin,'idempotency-key':key},payload:body});
 const state=async(index:number)=>(await app.inject({url:'/api/state',headers:{cookie:users[index].cookie}})).json<GameState>();
 async function fixture(index:number,updates:Partial<Character>){const row=await prisma.character.findUniqueOrThrow({where:{id:users[index].id}});const c={...row.data as unknown as Character,...updates};await prisma.character.update({where:{id:c.id},data:{data:json(c),gold:c.gold,xp:c.xp,level:c.level}});}
 async function item(index:number,definitionId=equipment[0].id){return prisma.item.create({data:{definitionId,ownerId:users[index].id}});}
 beforeAll(async()=>{
  const database=new URL(process.env.DATABASE_URL!).pathname;
  if(!database.endsWith('_test'))throw new Error('Integration tests require a disposable DATABASE_URL ending in _test');
  process.env.APP_ORIGIN=origin;process.env.BETTER_AUTH_SECRET='test-only-secret-never-use-in-production-123456';
  app=await createApp({now:()=>time});
  await prisma.$executeRawUnsafe('TRUNCATE "BossReward", "BossRoom", "Idempotency", "Audit", "ChatMessage", "MarketListing", "Item", "Character", "Session", "Account", "Verification", "User" CASCADE');
  for(let i=0;i<3;i++){
   const signup=await app.inject({method:'POST',url:'/api/auth/sign-up/email',headers:{origin},payload:{name:`Tester ${i}`,email:`tester${i}@example.test`,password:'Only-For-Tests-12345'}});
   expect(signup.statusCode,signup.body).toBe(200);
   const cookie=signup.cookies.map(c=>`${c.name}=${c.value}`).join('; ');
   const created=await request(cookie,'/api/character',{name:`Adventurer${i}`,classId:['warrior','priest','mage'][i]});expect(created.statusCode,created.body).toBe(200);
   users.push({cookie,id:created.json<GameState>().character!.id});
  }
 },30000);
 afterAll(async()=>{if(app)await app.close();await prisma.$disconnect();});
 it('authenticates securely and rejects absent sessions, foreign origins and cross-owner items',async()=>{
  expect((await app.inject({url:'/api/state'})).statusCode).toBe(401);
  expect((await app.inject({method:'POST',url:'/api/auth/sign-in/email',headers:{origin:'https://evil.example'},payload:{email:'tester0@example.test',password:'Only-For-Tests-12345'}})).statusCode).toBe(403);
  expect((await app.inject({method:'POST',url:'/api/auth/sign-in/email',payload:{email:'tester0@example.test',password:'Only-For-Tests-12345'}})).statusCode).toBe(403);
  expect((await app.inject({method:'POST',url:'/api/hunt',headers:{cookie:users[0].cookie,origin:'https://evil.example','idempotency-key':randomUUID()},payload:{regionId:'hollow'}})).statusCode).toBe(403);
  const foreign=await item(1);expect((await request(users[0].cookie,'/api/equip',{itemId:foreign.id,equip:true})).statusCode).toBe(404);
 });
 it('starts hunt, persists drops, handles two tabs and repeats without reward duplication',async()=>{
  const start=await request(users[0].cookie,'/api/hunt',{regionId:'hollow'});expect(start.statusCode,start.body).toBe(200);expect(start.json<GameState>().character!.huntSeed).toBe(0);
  const initial=start.json<GameState>().character!.encounter!;expect(initial.sequence).toBe(1);expect(initial.monsterHp).toBe(initial.monsterMaxHp);expect(initial.drop).toBeNull();expect(initial.xp).toBe(0);expect(initial.gold).toBe(0);
  time+=5000;const active=(await state(0)).character!.encounter!;expect(active.sequence).toBe(initial.sequence);expect(active.monsterHp).toBeLessThan(initial.monsterHp);expect(active.monsterHp).toBeGreaterThan(0);
  const old=await state(0);time+=600000;
  const [a,b]=await Promise.all([state(0),state(0)]);
  expect(a.character!.xp).toBe(b.character!.xp);expect(a.character!.xp).toBeGreaterThan(old.character!.xp);
  expect(a.summary!.combats+b.summary!.combats).toBeGreaterThan(0);expect([a.summary!.combats,b.summary!.combats]).toContain(0);
  expect(a.items.length).toBeGreaterThan(0);
  const key=randomUUID();const picked=a.items[0];
  const first=await request(users[0].cookie,'/api/equip',{itemId:picked.id,equip:true},key);
  const repeat=await request(users[0].cookie,'/api/equip',{itemId:picked.id,equip:true},key);
  expect(first.statusCode,first.body).toBe(200);expect(repeat.json()).toEqual(first.json());
  expect((await request(users[0].cookie,'/api/equip',{itemId:picked.id,equip:false},key)).statusCode).toBe(409);
 });
 it('caps offline at eight hours and liquidates before region/build changes',async()=>{
  time+=24*3600000;const result=await state(0);expect(result.summary!.elapsedMs).toBe(8*3600000);expect(result.summary!.capped).toBe(true);
  const before=result.character!.xp;time+=120000;
  const changed=await request(users[0].cookie,'/api/build',{skills:['cleave'],potionThreshold:.5});expect(changed.statusCode,changed.body).toBe(200);expect(changed.json<GameState>().character!.xp).toBeGreaterThanOrEqual(before);
  const stopped=await request(users[0].cookie,'/api/hunt',{regionId:null});expect(stopped.statusCode).toBe(200);
  const xp=stopped.json<GameState>().character!.xp;time+=3600000;expect((await state(0)).character!.xp).toBe(xp);
 });
 it('settles elapsed time with the old equipment before activating new stats',async()=>{
  const strong=await item(0,equipment.find(e=>e.regionId==='crypt'&&e.slot==='weapon')!.id);
  await request(users[0].cookie,'/api/hunt',{regionId:'hollow'});
  const row=await prisma.character.findUniqueOrThrow({where:{id:users[0].id}});const items=await prisma.item.findMany({where:{ownerId:row.id}});
  time+=120000;const expected=settleHunt(row.data as unknown as Character,items,time);
  const swapped=await request(users[0].cookie,'/api/equip',{itemId:strong.id,equip:true});expect(swapped.statusCode,swapped.body).toBe(200);
  const result=swapped.json<GameState>();expect(result.character!.xp).toBe(expected.character.xp);expect(result.character!.gold).toBe(expected.character.gold);expect(result.summary!.combats).toBe(expected.summary.combats);
  expect(result.items.find(i=>i.id===strong.id)!.equipped).toBe(true);await request(users[0].cookie,'/api/hunt',{regionId:null});
 });
 it('locks listed items and allows exactly one concurrent purchase with gold conservation',async()=>{
  await fixture(1,{gold:1000});await fixture(2,{gold:1000});const sale=await item(0);
  const before=(await state(0)).character!.gold;expect((await request(users[0].cookie,'/api/market',{itemId:sale.id,price:120})).statusCode).toBe(200);
  const listing=await prisma.marketListing.findUniqueOrThrow({where:{itemId:sale.id}});
  expect((await request(users[0].cookie,'/api/equip',{itemId:sale.id,equip:true})).statusCode).toBe(400);
  expect((await request(users[0].cookie,'/api/sell',{itemId:sale.id})).statusCode).toBe(400);
  expect((await request(users[0].cookie,`/api/market/${listing.id}/buy`)).statusCode).toBe(400);
  const results=await Promise.all([request(users[1].cookie,`/api/market/${listing.id}/buy`),request(users[2].cookie,`/api/market/${listing.id}/buy`)]);
  expect(results.map(r=>r.statusCode).sort()).toEqual([200,409]);
  const current=await prisma.item.findUniqueOrThrow({where:{id:sale.id}});expect([users[1].id,users[2].id]).toContain(current.ownerId);
  expect((await state(0)).character!.gold).toBe(before+120);
  expect((await state(1)).character!.gold+(await state(2)).character!.gold).toBe(1880);
  expect(await prisma.audit.count({where:{kind:'market_purchase'}})).toBe(1);
 });
 it('serializes cancellation against purchase',async()=>{
  const sale=await item(0);await request(users[0].cookie,'/api/market',{itemId:sale.id,price:10});const listing=await prisma.marketListing.findUniqueOrThrow({where:{itemId:sale.id}});
  const results=await Promise.all([request(users[1].cookie,`/api/market/${listing.id}/buy`),request(users[0].cookie,`/api/market/${listing.id}/cancel`)]);
  expect(results.map(r=>r.statusCode).sort()).toEqual([200,409]);
  expect(await prisma.marketListing.findUnique({where:{id:listing.id}})).toBeNull();expect((await prisma.item.findUniqueOrThrow({where:{id:sale.id}})).listed).toBe(false);
 });
 it('rejects invalid prices and balances, preserving gold and ownership',async()=>{
  const sale=await item(0);expect((await request(users[0].cookie,'/api/market',{itemId:sale.id,price:-1})).statusCode).toBe(400);
  await request(users[0].cookie,'/api/market',{itemId:sale.id,price:1000000});const listing=await prisma.marketListing.findUniqueOrThrow({where:{itemId:sale.id}});const before=(await state(1)).character!.gold;
  expect((await request(users[1].cookie,`/api/market/${listing.id}/buy`)).statusCode).toBe(400);expect((await state(1)).character!.gold).toBe(before);expect((await prisma.item.findUniqueOrThrow({where:{id:sale.id}})).ownerId).toBe(users[0].id);
 });
 it('rolls back a database failure after gold mutation',async()=>{
  const before=await prisma.character.findUniqueOrThrow({where:{id:users[0].id}});
  await expect(prisma.$transaction(async tx=>{await tx.character.update({where:{id:before.id},data:{gold:before.gold+50,data:json({...before.data as unknown as Character,gold:before.gold+50})}});await tx.item.create({data:{definitionId:equipment[0].id,ownerId:'missing-owner'}});})).rejects.toThrow();
  expect((await prisma.character.findUniqueOrThrow({where:{id:before.id}})).gold).toBe(before.gold);
 });
 it('database rejects an orphan listed item even outside game code',async()=>{
  await expect(prisma.item.create({data:{definitionId:equipment[0].id,ownerId:users[0].id,listed:true}})).rejects.toThrow();
  await expect(prisma.item.create({data:{definitionId:equipment[0].id,ownerId:users[0].id,equipped:true}})).rejects.toThrow();
 });
 it('persists boss across server restart and grants each reward once',async()=>{
  for(const index of [0,1]){await fixture(index,{level:10,xp:xpForLevel(10),regionId:null,encounter:null,bossCooldownUntil:0});const c=(await state(index)).character!;await fixture(index,{hp:getStats(c,[]).hp});}
  const create=await request(users[0].cookie,'/api/boss/create');expect(create.statusCode,create.body).toBe(200);const code=create.json<GameState>().room!.code;
  const joined=await request(users[1].cookie,'/api/boss/join',{code});expect(joined.statusCode,joined.body).toBe(200);
  for(const index of [0,1])expect((await request(users[index].cookie,'/api/boss/ready',{ready:true,preparation:'balanced'})).statusCode).toBe(200);
  expect((await request(users[1].cookie,'/api/boss/start')).statusCode).toBe(403);
  const started=await request(users[0].cookie,'/api/boss/start');expect(started.statusCode,started.body).toBe(200);expect(started.json<GameState>().room!.status).toBe('running');
  expect((await request(users[0].cookie,'/api/hunt',{regionId:'hollow'})).statusCode).toBe(400);
  await app.close();app=await createApp({now:()=>time});time+=120000;
  const [a,b]=await Promise.all([state(0),state(1)]);expect(a.room!.status).toBe('won');expect(a.room).toEqual(b.room);
  const gold=a.character!.gold;expect((await state(0)).character!.gold).toBe(gold);
  expect(await prisma.bossReward.count({where:{roomId:a.room!.id}})).toBe(2);
 });
 it('retains limited chat, rate limits repeat chat and exposes rankings',async()=>{
  const sent=await request(users[0].cookie,'/api/chat',{text:'Olá aventureiros!'});expect(sent.statusCode,sent.body).toBe(200);
  expect((await request(users[0].cookie,'/api/chat',{text:'spam'})).statusCode).toBe(429);
  expect((await app.inject({url:'/api/chat',headers:{cookie:users[1].cookie}})).json().messages).toHaveLength(1);
  expect((await app.inject({url:'/api/ranking',headers:{cookie:users[1].cookie}})).json().characters).toHaveLength(3);
 });
 it('authenticates websocket presence, delivers chat and handles reconnects',async()=>{
  const ws=await app.injectWS('/api/ws',{socket:{remoteAddress:'127.0.0.1'},headers:{cookie:users[1].cookie,origin}});
  const presence=await new Promise<{type:string;players:unknown[]}>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Missing presence')),3000);ws.once('message',raw=>{clearTimeout(timer);resolve(JSON.parse(raw.toString()));});});
  expect(presence.type).toBe('presence');expect(presence.players.length).toBeGreaterThan(0);
  time+=2000;const receive=new Promise<{type:string;message?:{text:string}}>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Missing chat')),3000);ws.on('message',raw=>{const message=JSON.parse(raw.toString());if(message.type==='chat'){clearTimeout(timer);resolve(message);}});});
  await request(users[0].cookie,'/api/chat',{text:'O portal está aberto.'});expect((await receive).message!.text).toBe('O portal está aberto.');ws.close();
  const reconnect=await app.injectWS('/api/ws',{socket:{remoteAddress:'127.0.0.1'},headers:{cookie:users[1].cookie,origin}});reconnect.close();
 });
 it('logs out and invalidates the persistent session',async()=>{
  const out=await app.inject({method:'POST',url:'/api/auth/sign-out',headers:{cookie:users[2].cookie,origin},payload:{}});expect(out.statusCode,out.body).toBe(200);
  expect((await app.inject({url:'/api/state',headers:{cookie:users[2].cookie}})).statusCode).toBe(401);
 });
 it('rejects purchase into a full inventory without transferring value',async()=>{
  const count=await prisma.item.count({where:{ownerId:users[0].id}});await prisma.item.createMany({data:Array.from({length:200-count},()=>({definitionId:equipment[0].id,ownerId:users[0].id}))});
  const sale=await item(1);await request(users[1].cookie,'/api/market',{itemId:sale.id,price:1});const listing=await prisma.marketListing.findUniqueOrThrow({where:{itemId:sale.id}});const gold=(await state(0)).character!.gold;
  expect((await request(users[0].cookie,`/api/market/${listing.id}/buy`)).statusCode).toBe(400);expect((await state(0)).character!.gold).toBe(gold);expect((await prisma.item.findUniqueOrThrow({where:{id:sale.id}})).ownerId).toBe(users[1].id);
 });
});

