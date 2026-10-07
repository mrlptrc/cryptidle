import { writeFileSync, mkdirSync } from 'node:fs';
import {classes,createCharacter,equipment,getStats,regions,settleHunt,startHunt} from '../packages/game-core/src/index.js';
import type {Item} from '../packages/shared/src/index.js';
const results=[];
for(const cl of classes){
  let c=createCharacter({id:`balance-${cl.id}`,userId:'simulation',name:cl.name,classId:cl.id,now:0});
  const items:Item[]=[];let firstUpgrade:number|null=null,region2:number|null=null,boss:number|null=null;
  c=startHunt(c,items,'hollow',0);
  for(let minute=1;minute<=120;minute++){
    const r=settleHunt(c,items,minute*60_000);c=r.character;
    for(const [index,id] of r.drops.entries()){
      const definition=equipment.find(d=>d.id===id)!;const old=items.find(i=>i.equipped&&equipment.find(d=>d.id===i.definitionId)!.slot===definition.slot);
      const score=(def:typeof definition)=>def.stats.attack*3+def.stats.defense*2+def.stats.hp*.2+def.stats.speed*30;
      const upgrade=!old||score(definition)>score(equipment.find(d=>d.id===old.definitionId)!);
      if(upgrade&&old)old.equipped=false;
      items.push({id:`${minute}-${index}`,definitionId:id,ownerId:c.id,equipped:upgrade,listed:false});
      if(upgrade){firstUpgrade??=minute;c=startHunt(c,items,c.regionId,minute*60_000);}
    }
    if(c.level>=3)boss??=minute;
    if(c.level>=5){region2??=minute;if(c.regionId==='hollow')c=startHunt(c,items,'marsh',minute*60_000);}
    if(c.level>=10&&c.regionId==='marsh')c=startHunt(c,items,'crypt',minute*60_000);
    // Normal player buys 10 potions when depleted; no implicit free consumables.
    if(c.potions<2&&c.gold>=80){c.gold-=80;c.potions+=10;}
  }
  results.push({class:cl.name,firstUpgradeMinutes:firstUpgrade,secondRegionMinutes:region2,bossEligibleMinutes:boss,levelAfter120Minutes:c.level,kills:c.kills,defeats:c.defeats,gold:c.gold,stats:getStats(c,items),regions:regions.length});
}
const report={method:'Deterministic seeded simulation; settle each minute, equip score upgrades, buy potions with earned gold, move at unlock. Not playtesting.',results};
mkdirSync('docs/evidence',{recursive:true});writeFileSync('docs/evidence/balance.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
