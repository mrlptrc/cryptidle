import {describe,it,expect} from 'vitest';
import {classes,config,createCharacter,equipment,getStats,levelForXp,regions,settleHunt,simulateBoss,startHunt,xpForLevel} from './index.js';
import type {BossMember,Character,Item} from '@cryptidle/shared';
const fresh=(classId:Character['classId']='warrior')=>createCharacter({id:'fixture-42',userId:'user-1',name:'Aventureiro',classId,now:0});
describe('authoritative encounter progression',()=>{
  it('persists server-computed enemy HP progress during an encounter',()=>{
    const started=startHunt(fresh(),[],'hollow',0);const initial=started.encounter!;
    const half=settleHunt(started,[],Math.floor(initial.durationMs/2)).character.encounter!;
    expect(half.monsterMaxHp).toBe(initial.monsterMaxHp);
    expect(half.monsterHp).toBeLessThan(initial.monsterHp);
    expect(half.monsterHp).toBeGreaterThan(0);
    const done=settleHunt(started,[],initial.durationMs).character;
    expect(done.kills+done.defeats).toBe(1);
  });
  it('fills visual encounter fields for characters saved before the contract update',()=>{
    const legacy=startHunt(fresh(),[],'hollow',0);const old=legacy.encounter!;const partial=old as Partial<typeof old>;delete partial.sequence;delete partial.monsterHp;delete partial.monsterMaxHp;
    const current=settleHunt(legacy,[],5000).character.encounter!;
    expect(current.sequence).toBe(1);expect(current.monsterMaxHp).toBeGreaterThan(0);expect(current.monsterHp).toBeLessThan(current.monsterMaxHp);
  });
  it('assigns a new sequence after restarting the same region before the prior fight ends',()=>{
    const first=startHunt(fresh(),[],'hollow',0);const partial=settleHunt(first,[],2000).character;
    const restarted=startHunt(partial,[],'hollow',2000);
    expect(restarted.encounter!.sequence).toBe(first.encounter!.sequence+1);
  });
  it('is identical with one offline settlement and many online settlements',()=>{
    const initial=startHunt(fresh(),[],'hollow',0);
    const offline=settleHunt(initial,[],3_600_000);
    let online=initial;let xp=0;let gold=0;const drops:string[]=[];
    for(let t=1000;t<=3_600_000;t+=1000){const next=settleHunt(online,[],t);online=next.character;xp+=next.summary.xp;gold+=next.summary.gold;drops.push(...next.drops);}
    expect(online).toEqual(offline.character);expect(xp).toBe(offline.summary.xp);expect(gold).toBe(offline.summary.gold);expect(drops).toEqual(offline.drops);
  });
  it('caps elapsed time at eight hours and cannot claim that interval twice',()=>{
    const c=startHunt(fresh(),[],'hollow',0);const a=settleHunt(c,[],24*3600_000);const b=settleHunt(c,[],8*3600_000);
    expect(a.summary.capped).toBe(true);expect(a.character.xp).toBe(b.character.xp);expect(a.character.lastSettledAt).toBe(24*3600_000);
    expect(settleHunt(a.character,[],24*3600_000).summary.combats).toBe(0);
    expect(a.summary.combats).toBeLessThanOrEqual(config.offlineCapMs/config.encounterMinMs);
  });
  it('ignores a backwards clock and supports configured smaller caps',()=>{
    const c=startHunt(fresh(),[],'hollow',1000);expect(settleHunt(c,[],0).character).toEqual(c);
    const r=settleHunt(c,[],3600_000,{offlineCapMs:60_000});expect(r.summary.elapsedMs).toBe(60_000);expect(r.summary.capped).toBe(true);
  });
  it('all classes solo, gain actual drops, and never create potions',()=>{
    for(const cl of classes){const c=startHunt({...fresh(cl.id),potions:0},[],'hollow',0);const r=settleHunt(c,[],300_000);
      expect(r.character.kills).toBeGreaterThan(0);expect(r.drops.length).toBeGreaterThan(0);expect(r.character.potions).toBe(0);expect(r.summary.potionsUsed).toBe(0);}
  });
  it('preserves partial encounters and consumes only available potions',()=>{
    let c=fresh('mage');c.level=10;c.hp=1;c.potions=1;c=startHunt(c,[],'crypt',0);
    const partial=settleHunt(c,[],1000);expect(partial.summary.combats).toBe(0);
    const r=settleHunt(partial.character,[],3_600_000);expect(r.character.potions).toBeGreaterThanOrEqual(0);expect(r.summary.potionsUsed).toBeLessThanOrEqual(1);
    expect(r.summary.defeats).toBeGreaterThan(0);expect(r.character.hp).toBeGreaterThan(0);
  });
  it('liquidates the previous region before switching and awards nothing while stopped',()=>{
    const initial=startHunt(fresh(),[],'hollow',0);const settled=settleHunt(initial,[],90_000);
    const stopped=startHunt(settled.character,[],null,90_000);expect(settleHunt(stopped,[],200_000).character.xp).toBe(settled.character.xp);
    expect(()=>startHunt(fresh(),[],'crypt',0)).toThrow();
  });
  it('equipment changes stats only for owned, equipped and unlisted instances',()=>{
    const c=fresh();const i:Item={id:'1',ownerId:c.id,definitionId:equipment[0].id,equipped:true,listed:false};
    expect(getStats(c,[i]).attack).toBeGreaterThan(getStats(c,[]).attack);
    expect(getStats(c,[{...i,ownerId:'someone'}])).toEqual(getStats(c,[]));expect(getStats(c,[{...i,listed:true}])).toEqual(getStats(c,[]));
  });
  it('has complete editable content and coherent progression to 20',()=>{
    expect(regions).toHaveLength(3);expect(regions.flatMap(r=>r.monsters)).toHaveLength(9);expect(equipment.length).toBeGreaterThanOrEqual(18);
    for(let level=1;level<=20;level++)expect(levelForXp(xpForLevel(level))).toBe(level);
    expect(levelForXp(1_000_000)).toBe(20);
  });
  it('boss supports any classes and preparation affects outcome',()=>{
    const members:BossMember[]=classes.map(cl=>{const c={...fresh(cl.id),level:5};return {characterId:cl.id,name:cl.name,classId:cl.id,skin:0,ready:true,preparation:'balanced',stats:getStats(c,[]),skills:c.skills};});
    expect(simulateBoss(members).victory).toBe(true);expect(simulateBoss([members[0],members[0]]).victory).toBe(true);
    expect(()=>simulateBoss([members[0]])).toThrow();expect(simulateBoss(members)).toEqual(simulateBoss(members));
  });
});
