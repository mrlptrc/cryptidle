import { randomBytes, randomUUID } from 'node:crypto';
import { regions, equipment, skills, config, createCharacter, getStats, settleHunt, startHunt, simulateBoss, levelForXp } from '@cryptidle/game-core';
import type { Character, Item, BossRoom, GameState, RewardSummary, ClassId, Preparation } from '@cryptidle/shared';
import { json, type Tx } from './db.js';
export class GameError extends Error { constructor(message: string, public statusCode = 400) { super(message); } }
export function insist(condition: unknown, message: string, code = 400): asserts condition { if (!condition) throw new GameError(message, code); }
export const definition = (id: string) => { const def = equipment.find(e => e.id === id); insist(def, 'Equipamento desconhecido'); return def; };
export async function save(tx: Tx, c: Character) { await tx.character.update({where:{id:c.id},data:{data:json(c),gold:c.gold,xp:c.xp,level:c.level}}); }
export async function load(tx: Tx, userId: string) { const row = await tx.character.findUnique({where:{userId}}); insist(row, 'Crie um personagem primeiro', 404); return {row, c: row.data as unknown as Character, items: await tx.item.findMany({where:{ownerId:row.id}})}; }
export async function settle(tx: Tx, c: Character, items: Item[], now: number): Promise<RewardSummary> {
 const result = settleHunt(c, items, now, {offlineCapMs:Number(process.env.OFFLINE_CAP_HOURS || 8)*3600000});
 Object.assign(c, result.character);
 for (const definitionId of result.drops) { const item = await tx.item.create({data:{id:randomUUID(),definitionId,ownerId:c.id}}); items.push(item); }
 await save(tx,c);
 return result.summary;
}
export async function finishBoss(tx: Tx, roomId: string, now: number): Promise<BossRoom|null> {
 const row = await tx.bossRoom.findUnique({where:{id:roomId}}); if (!row) return null;
 const room = row.data as unknown as BossRoom;
 if (room.status === 'running' && room.endsAt !== null && now >= room.endsAt) {
  room.status = room.victory ? 'won' : 'lost'; room.bossHp = room.victory ? 0 : Math.max(1,Math.floor(room.bossMaxHp*.15));
  for (const member of room.members) {
   const prior = await tx.bossReward.findUnique({where:{roomId_characterId:{roomId,characterId:member.characterId}}});
   if (prior) continue;
   const character = await tx.character.findUniqueOrThrow({where:{id:member.characterId}});
   const c = character.data as unknown as Character;
   c.xp += room.rewardXp; c.gold += room.rewardGold; c.level = levelForXp(c.xp);
   c.bossCooldownUntil = room.endsAt + Number(process.env.BOSS_COOLDOWN_MINUTES || 15)*60000;
   await save(tx,c);
   await tx.bossReward.create({data:{roomId,characterId:c.id}});
   await tx.audit.create({data:{kind:'boss_reward',actorId:c.id,data:json({roomId,victory:room.victory,xp:room.rewardXp,gold:room.rewardGold})}});
  }
  await tx.bossRoom.update({where:{id:roomId},data:{data:json(room)}});
 }
 if (room.status === 'running' && room.startedAt !== null && room.endsAt !== null) room.bossHp = Math.max(1, Math.round(room.bossMaxHp * (1-(now-room.startedAt)/(room.endsAt-room.startedAt))));
 if (room.status === 'running') { room.victory=null;room.rewardGold=0;room.rewardXp=0; room.log=['O grupo enfrenta o Guardião do Eclipse.']; }
 return room;
}
export async function state(tx: Tx, userId: string, now: number, summary?: RewardSummary): Promise<GameState> {
 const row = await tx.character.findUnique({where:{userId}});
 if (!row) return {character:null,items:[],summary:null,room:null,serverTime:now};
 const room = row.roomId ? await finishBoss(tx,row.roomId,now) : null;
 const {c,items} = await load(tx,userId);
 const accrued = await settle(tx,c,items,now);
 // Do not disclose future random rewards to a client that can stop/restart hunts.
 const monster=regions.find(r=>r.id===c.regionId)?.monsters.find(m=>m.id===c.encounter?.monsterId);
 const maxHp=c.encounter?.monsterMaxHp||monster?.stats.hp||1;
 const visible={...c,huntSeed:0,stats:getStats(c,items),encounter:c.encounter?{...c.encounter,sequence:c.encounter.sequence||c.kills+c.defeats+1,monsterMaxHp:maxHp,monsterHp:c.encounter.monsterHp||Math.max(1,Math.ceil(maxHp*c.encounter.remainingMs/c.encounter.durationMs)),drop:null,xp:0,gold:0,victory:false,hpAfter:c.hp,potionsUsed:0}:null};
 return {character:visible,items,summary:summary || accrued,room,serverTime:now};
}
export async function create(tx: Tx, userId: string, name: string, classId: ClassId, now: number) {
 insist(!await tx.character.findUnique({where:{userId}}),'Conta já possui personagem');
 insist(!await tx.character.findFirst({where:{name:{equals:name,mode:'insensitive'}}}),'Nome indisponível');
 const c = createCharacter({id:randomUUID(),userId,name,classId,now,seed:randomBytes(4).readUInt32LE()});
 await tx.character.create({data:{id:c.id,userId,name,classId,data:json(c),gold:c.gold,xp:c.xp,level:c.level}});
}
export async function action(tx: Tx,userId: string,kind: string,body: Record<string,unknown>,now: number) {
 const loaded = await load(tx,userId);
 if (loaded.row.roomId) await finishBoss(tx,loaded.row.roomId,now);
 const {row,c,items} = await load(tx,userId);
 const summary = await settle(tx,c,items,now);
 const roomRow = row.roomId ? await tx.bossRoom.findUnique({where:{id:row.roomId}}) : null;
 const room = roomRow?.data as unknown as BossRoom|null;
 insist(room?.status !== 'running','Aguarde o fim da expedição');
 if (kind === 'hunt') { insist(!room || room.status!=='waiting','Saia da sala antes de caçar'); insist(body.regionId===null||regions.some(r=>r.id===body.regionId&&c.level>=r.minLevel),'Região indisponível');Object.assign(c, startHunt(c,items,body.regionId as string|null,now)); }
 if (kind === 'build') {
  const chosen=body.skills as string[]; insist(chosen.every(id=>skills.some(s=>s.id===id&&s.classId===c.classId)),'Habilidade incompatível');
  c.skills=chosen; c.potionThreshold=body.potionThreshold as number; c.encounter=null;
 }
 if (kind === 'equip' || kind === 'sell') {
  const item=items.find(i=>i.id===body.itemId); insist(item,'Item não encontrado',404); insist(!item.listed,'Item anunciado está bloqueado');
  if(kind==='sell') { insist(!item.equipped,'Desequipe antes de vender'); c.gold+=definition(item.definitionId).sellPrice; await tx.item.delete({where:{id:item.id}}); }
  else { const equipped=body.equip as boolean; if(equipped) for(const other of items.filter(i=>i.equipped&&definition(i.definitionId).slot===definition(item.definitionId).slot)) await tx.item.update({where:{id:other.id},data:{equipped:false}}); await tx.item.update({where:{id:item.id},data:{equipped}}); c.encounter=null; }
 }
 if(kind==='potions') { const quantity=body.quantity as number; const cost=quantity*config.potionPrice; insist(c.gold>=cost,'Gold insuficiente'); c.gold-=cost; c.potions+=quantity; }
 if(kind==='skin') { insist(body.skin===0||c.kills>=config.skinKills,'Derrote mais monstros para desbloquear a skin'); c.skin=body.skin as 0|1; }
 if(kind==='build'||kind==='equip') { const updated=await tx.item.findMany({where:{ownerId:c.id}});c.hp=Math.min(c.hp,getStats(c,updated).hp);Object.assign(c,startHunt(c,updated,c.regionId,now)); }
 await save(tx,c);
 return state(tx,userId,now,summary);
}
export async function market(tx: Tx,userId: string,kind: 'list'|'buy'|'cancel',body:Record<string,unknown>,now:number) {
 const {c,items}=await load(tx,userId); const summary=await settle(tx,c,items,now);
 if(kind==='list') {
  const item=items.find(i=>i.id===body.itemId); insist(item,'Item não encontrado',404); insist(!item.equipped&&!item.listed,'Desequipe o item e retire qualquer anúncio existente');
  await tx.item.update({where:{id:item.id},data:{listed:true}});
  await tx.marketListing.create({data:{itemId:item.id,sellerId:c.id,price:body.price as number}});
 } else {
  const listing=await tx.marketListing.findUnique({where:{id:body.id as string},include:{item:true}}); insist(listing,'Anúncio indisponível',409);
  if(kind==='cancel') { insist(listing.sellerId===c.id,'Anúncio de outro jogador',403); await tx.marketListing.delete({where:{id:listing.id}}); await tx.item.update({where:{id:listing.itemId},data:{listed:false}}); }
  else {
   insist(listing.sellerId!==c.id,'Você não pode comprar seu anúncio'); insist(c.gold>=listing.price,'Gold insuficiente');insist(items.length<config.inventoryLimit,'Inventário cheio: venda um item antes de comprar');
   const sellerRow=await tx.character.findUniqueOrThrow({where:{id:listing.sellerId}}); const seller=sellerRow.data as unknown as Character;
   // Never overwrite unliquidated seller data with a buyer snapshot.
   seller.gold+=listing.price; c.gold-=listing.price; await save(tx,seller); await save(tx,c);
   await tx.marketListing.delete({where:{id:listing.id}});
   await tx.item.update({where:{id:listing.itemId},data:{ownerId:c.id,listed:false}});
   await tx.audit.create({data:{kind:'market_purchase',actorId:c.id,data:json({listingId:listing.id,itemId:listing.itemId,sellerId:listing.sellerId,buyerId:c.id,price:listing.price})}});
  }
 }
 return state(tx,userId,now,summary);
}
export async function boss(tx:Tx,userId:string,kind:string,body:Record<string,unknown>,now:number) {
 let loaded=await load(tx,userId);
 if(loaded.row.roomId) await finishBoss(tx,loaded.row.roomId,now);
 loaded=await load(tx,userId);
 const {c,items,row}=loaded; const summary=await settle(tx,c,items,now);
 let room=row.roomId ? (await tx.bossRoom.findUniqueOrThrow({where:{id:row.roomId}})).data as unknown as BossRoom : null;
 if(kind==='create'||kind==='join') {
  insist(!room||room.status==='won'||room.status==='lost','Você já está em uma sala');
  insist(c.level>=config.bossMinLevel,`Boss requer nível ${config.bossMinLevel}`); insist(now>=c.bossCooldownUntil,'Expedição em recarga');
  c.regionId=null;c.encounter=null;await save(tx,c);
  const member={characterId:c.id,name:c.name,classId:c.classId,skin:c.skin,ready:false,preparation:'balanced' as Preparation,stats:getStats(c,items),skills:c.skills};
  if(kind==='create') { const id=randomUUID(); room={id,code:randomUUID().slice(0,8).toUpperCase(),leaderId:c.id,status:'waiting',members:[member],startedAt:null,endsAt:null,bossHp:1,bossMaxHp:1,victory:null,rewardGold:0,rewardXp:0,log:[]}; await tx.bossRoom.create({data:{id,code:room.code,data:json(room)}}); }
  else { const found=await tx.bossRoom.findUnique({where:{code:(body.code as string).toUpperCase()}}); insist(found,'Sala não encontrada',404); room=found.data as unknown as BossRoom; insist(room.status==='waiting'&&room.members.length<4,'Sala indisponível'); room.members.push(member); }
  await tx.character.update({where:{id:c.id},data:{roomId:room.id}});
 } else {
  insist(room,'Entre em uma sala primeiro'); insist(room.status!=='running','Expedição em andamento');
  if(kind==='leave') { room.members=room.members.filter(m=>m.characterId!==c.id); if(room.leaderId===c.id) room.leaderId=room.members[0]?.characterId||''; await tx.character.update({where:{id:c.id},data:{roomId:null}}); }
  else if(kind==='ready') { insist(room.status==='waiting','Expedição encerrada'); const member=room.members.find(m=>m.characterId===c.id)!; member.ready=body.ready as boolean; member.preparation=body.preparation as Preparation; member.stats=getStats(c,items); member.skills=c.skills; }
  else if(kind==='start') {
   insist(room.leaderId===c.id,'Apenas o líder pode iniciar',403); insist(room.status==='waiting'&&room.members.length>=2&&room.members.every(m=>m.ready),'Requer 2–4 jogadores prontos');
   // Refresh every snapshot under the same transaction as start.
   for(const member of room.members) { const r=await tx.character.findUniqueOrThrow({where:{id:member.characterId}}); const current=r.data as unknown as Character; member.stats=getStats(current,await tx.item.findMany({where:{ownerId:current.id}}));member.skills=current.skills;member.skin=current.skin; }
   const result=simulateBoss(room.members);room.status='running';room.startedAt=now;room.endsAt=now+result.durationMs;room.bossMaxHp=result.bossMaxHp;room.bossHp=result.bossMaxHp;room.victory=result.victory;room.rewardGold=result.rewardGold;room.rewardXp=result.rewardXp;room.log=result.log;
  }
 }
 if(room) await tx.bossRoom.update({where:{id:room.id},data:{data:json(room)}});
 return state(tx,userId,now,summary);
}
