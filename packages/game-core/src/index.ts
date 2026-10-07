import type { BossMember, Character, ClassDefinition, ClassId, Encounter, EquipmentDefinition, Item, Rarity, RegionDefinition, RewardSummary, SkillDefinition, Slot, Stats } from '@cryptidle/shared';
export * from '@cryptidle/shared';

export const config = { offlineCapMs:8*60*60*1000, maxLevel:20, potionPrice:8, potionHealFraction:0.55, initialGold:60, initialPotions:10, skinKills:50, bossMinLevel:3, bossCooldownMs:15*60*1000, bossDurationMs:60_000, bossGold:180, bossXp:250, marketMaxPrice:1_000_000, inventoryLimit:200, encounterMinMs:18_000, defeatRecoveryMs:30_000 } as const;
export const classes:ClassDefinition[] = [
  {id:'warrior',name:'Guerreiro',description:'Aço e resistência. Protege o grupo e suporta combates longos.',stats:{hp:130,attack:16,defense:9,speed:1},skills:['cleave','bulwark','rush']},
  {id:'mage',name:'Mago',description:'Magia arcana e ataques velozes. Alto dano, armadura frágil.',stats:{hp:88,attack:23,defense:4,speed:1.12},skills:['firebolt','barrier','haste']},
  {id:'priest',name:'Sacerdote',description:'Luz nas ruínas. Cura, proteção e dano sagrado.',stats:{hp:105,attack:17,defense:6,speed:1.03},skills:['smite','renew','ward']},
];
export const skills:SkillDefinition[] = [
  {id:'cleave',name:'Cutilada',classId:'warrior',description:'+25% de dano por encontro.',damage:.25,heal:0,protection:0,speed:0,icon:'cleave'},
  {id:'bulwark',name:'Baluarte',classId:'warrior',description:'Reduz dano recebido em 25%. Protege aliados no boss.',damage:0,heal:0,protection:.25,speed:0,icon:'bulwark'},
  {id:'rush',name:'Investida',classId:'warrior',description:'+20% de velocidade e +10% de dano.',damage:.1,heal:0,protection:0,speed:.2,icon:'rush'},
  {id:'firebolt',name:'Chama arcana',classId:'mage',description:'+40% de dano por encontro.',damage:.4,heal:0,protection:0,speed:0,icon:'firebolt'},
  {id:'barrier',name:'Barreira',classId:'mage',description:'Reduz dano recebido em 30%.',damage:0,heal:0,protection:.3,speed:0,icon:'barrier'},
  {id:'haste',name:'Celeridade',classId:'mage',description:'+35% de velocidade.',damage:0,heal:0,protection:0,speed:.35,icon:'haste'},
  {id:'smite',name:'Juízo',classId:'priest',description:'+30% de dano sagrado.',damage:.3,heal:0,protection:0,speed:0,icon:'smite'},
  {id:'renew',name:'Renovar',classId:'priest',description:'Recupera 28% do HP por encontro; cura o grupo no boss.',damage:0,heal:.28,protection:0,speed:0,icon:'renew'},
  {id:'ward',name:'Santuário',classId:'priest',description:'Reduz dano recebido em 30%.',damage:0,heal:0,protection:.3,speed:0,icon:'ward'},
];
export const regions:RegionDefinition[] = [
  {id:'hollow',name:'Bosque das Cinzas',description:'Sob as folhas mortas, a primeira ameaça desperta.',minLevel:1,monsters:[
    {id:'rat',name:'Rato da cripta',stats:{hp:64,attack:9,defense:2,speed:.9},xp:18,gold:7},
    {id:'slime',name:'Lodo espectral',stats:{hp:78,attack:8,defense:3,speed:.7},xp:20,gold:8},
    {id:'bat',name:'Morcego sombrio',stats:{hp:56,attack:10,defense:1,speed:1.15},xp:18,gold:7}]},
  {id:'marsh',name:'Pântano dos Sussurros',description:'Lanternas afogadas iluminam caminhos esquecidos.',minLevel:5,monsters:[
    {id:'skeleton',name:'Sentinela de ossos',stats:{hp:170,attack:24,defense:10,speed:.9},xp:48,gold:18},
    {id:'wisp',name:'Fogo errante',stats:{hp:135,attack:27,defense:7,speed:1.3},xp:45,gold:17},
    {id:'spider',name:'Viúva do brejo',stats:{hp:155,attack:25,defense:8,speed:1.15},xp:46,gold:18}]},
  {id:'crypt',name:'Cripta do Eclipse',description:'A pedra guarda ecos de um reino que não descansou.',minLevel:10,monsters:[
    {id:'knight',name:'Cavaleiro vazio',stats:{hp:330,attack:46,defense:22,speed:.9},xp:105,gold:38},
    {id:'shade',name:'Sombra faminta',stats:{hp:270,attack:49,defense:17,speed:1.3},xp:98,gold:35},
    {id:'golem',name:'Gárgula de obsidiana',stats:{hp:380,attack:43,defense:26,speed:.8},xp:115,gold:40}]},
];
const equipmentNames = [
 ['Lâmina de vigília','Capuz do andarilho','Cota de cinzas','Talismã de âmbar','Machado do espinheiro','Anel do crepúsculo','Elmo do guardião','Manto da primeira chama'],
 ['Espada do brejo','Coroa de junco','Peitoral afogado','Selo dos sussurros','Cajado da névoa','Pingente lunar','Máscara espectral','Vestes do oráculo'],
 ['Gume do eclipse','Elmo do rei vazio','Armadura de obsidiana','Coração da cripta','Cetro da noite','Anel da eternidade','Diadema das almas','Manto do eclipse'],
];
const slots:Slot[]=['weapon','head','chest','accessory','weapon','accessory','head','chest'];
const rarities:Rarity[]=['common','common','uncommon','uncommon','rare','rare','epic','epic'];
export const equipment:EquipmentDefinition[]=regions.flatMap((region,tier)=>equipmentNames[tier].map((name,i)=>{
  const power=(tier+1)*(i<2?1:i<4?1.5:i<6?2:2.8);
  const slot=slots[i];
  return {id:`${region.id}-${i}`,name,slot,rarity:rarities[i],regionId:region.id,stats:{hp:Math.round((slot==='chest'?20:slot==='head'?10:4)*power),attack:Math.round((slot==='weapon'?6:slot==='accessory'?3:1)*power),defense:Math.round((slot==='chest'?4:slot==='head'?3:1)*power),speed:slot==='accessory'?Number((.04*power).toFixed(2)):0},sellPrice:Math.round(10*power),icon:slot};
}));

export function xpForLevel(level:number):number { return 75*(Math.max(1,Math.min(config.maxLevel,level))-1)**2; }
export function levelForXp(xp:number):number { return Math.min(config.maxLevel,Math.floor(Math.sqrt(Math.max(0,xp)/75))+1); }
export function createCharacter(input:{id:string;userId:string;name:string;classId:ClassId;now:number;seed?:number}):Character {
  const c=classes.find(c=>c.id===input.classId); if(!c)throw new Error('Classe inválida');
  let seed=input.seed; if(seed===undefined){seed=2166136261;for(const ch of input.id)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;}
  return {...input,level:1,xp:0,gold:config.initialGold,hp:c.stats.hp,potions:config.initialPotions,skin:0,kills:0,defeats:0,regionId:null,skills:c.skills.slice(0,2),potionThreshold:.4,lastSettledAt:input.now,huntSeed:seed,encounter:null,bossCooldownUntil:0};
}
export function getStats(c:Character,items:Item[]):Stats {
  const base=classes.find(x=>x.id===c.classId)!.stats;
  const stats={hp:base.hp+(c.level-1)*12,attack:base.attack+(c.level-1)*3,defense:base.defense+(c.level-1)*1.5,speed:base.speed+(c.level-1)*.012};
  for(const item of items.filter(i=>i.equipped&&!i.listed&&i.ownerId===c.id)) {
    const def=equipment.find(d=>d.id===item.definitionId);if(def)for(const key of Object.keys(stats) as (keyof Stats)[])stats[key]+=def.stats[key];
  }
  return stats;
}
function random(c:Character):number { c.huntSeed=(Math.imul(c.huntSeed,1664525)+1013904223)>>>0;return c.huntSeed/4294967296; }
function effects(c:{classId:ClassId;skills:string[]}) {
  return skills.filter(s=>s.classId===c.classId&&c.skills.includes(s.id)).slice(0,2).reduce((a,s)=>({damage:a.damage+s.damage,heal:a.heal+s.heal,protection:a.protection+s.protection,speed:a.speed+s.speed}),{damage:0,heal:0,protection:0,speed:0});
}
function encounter(c:Character,items:Item[]):Encounter {
  const region=regions.find(r=>r.id===c.regionId)!;
  const monster=region.monsters[Math.floor(random(c)*region.monsters.length)];
  const s=getStats(c,items),e=effects(c);
  const playerDps=Math.max(1,s.attack*(1+e.damage)-monster.stats.defense*.5)*s.speed*(1+e.speed);
  const enemyDps=Math.max(1,monster.stats.attack-s.defense*.65)*monster.stats.speed*(1-Math.min(.65,e.protection));
  const rounds=monster.stats.hp/playerDps;
  const damage=Math.ceil(enemyDps*rounds);
  const initial=Math.min(s.hp,Math.max(1,c.hp)+s.hp*.12+s.hp*e.heal);
  const needsPotion=c.potionThreshold>0&&(initial-damage)/s.hp<c.potionThreshold;
  const potionsUsed=needsPotion&&c.potions>0?1:0;
  const remaining=Math.min(s.hp,initial+potionsUsed*s.hp*config.potionHealFraction)-damage;
  const victory=remaining>0;
  const dropRoll=random(c), rarityRoll=random(c);
  const pool=equipment.filter(d=>d.regionId===region.id&&d.rarity===(rarityRoll<.6?'common':rarityRoll<.88?'uncommon':rarityRoll<.98?'rare':'epic'));
  const drop=victory&&(c.kills===0||dropRoll<.22)?pool[Math.floor(random(c)*pool.length)].id:null;
  const durationMs=Math.max(config.encounterMinMs,Math.min(90_000,Math.round((rounds*3200+6500)/100)*100))+(victory?0:config.defeatRecoveryMs);
  return {monsterId:monster.id,durationMs,remainingMs:durationMs,victory,hpAfter:victory?Math.max(1,Math.round(remaining)):Math.round(s.hp*.75),potionsUsed,xp:victory?monster.xp:0,gold:victory?monster.gold:0,drop};
}
export function startHunt(character:Character,items:Item[],regionId:string|null,now:number):Character {
  const c=structuredClone(character);
  if(regionId!==null){const r=regions.find(r=>r.id===regionId);if(!r||c.level<r.minLevel)throw new Error('Região indisponível');}
  c.regionId=regionId;c.lastSettledAt=now;c.encounter=regionId?encounter(c,items):null;return c;
}
export function settleHunt(character:Character,items:Item[],now:number,options:{offlineCapMs?:number}={}):{character:Character;summary:RewardSummary;drops:string[]} {
  const c=structuredClone(character);const elapsed=Math.max(0,now-c.lastSettledAt);
  const cap=Math.min(config.offlineCapMs,Math.max(0,options.offlineCapMs??config.offlineCapMs));
  const summary:RewardSummary={xp:0,gold:0,items:[],combats:0,defeats:0,potionsUsed:0,elapsedMs:Math.min(elapsed,cap),capped:elapsed>cap};
  if(now<c.lastSettledAt)return {character:c,summary:{...summary,elapsedMs:0},drops:[]};
  c.lastSettledAt=now;
  if(!c.regionId)return {character:c,summary:{...summary,elapsedMs:0,capped:false},drops:[]};
  let available=Math.min(elapsed,cap);
  while(available>0) {
    c.encounter??=encounter(c,items);
    const fight=c.encounter;
    if(available<fight.remainingMs){fight.remainingMs-=available;break;}
    available-=fight.remainingMs;summary.combats++;
    c.potions-=fight.potionsUsed;summary.potionsUsed+=fight.potionsUsed;c.hp=fight.hpAfter;
    if(fight.victory){c.kills++;c.xp+=fight.xp;c.gold+=fight.gold;summary.xp+=fight.xp;summary.gold+=fight.gold;
      if(fight.drop){if(items.length+summary.items.length<config.inventoryLimit)summary.items.push(fight.drop);else{const value=equipment.find(d=>d.id===fight.drop)!.sellPrice;c.gold+=value;summary.gold+=value;}}
    }else{c.defeats++;summary.defeats++;const loss=Math.min(c.gold,3);c.gold-=loss;summary.gold-=loss;}
    const level=levelForXp(c.xp);if(level>c.level){c.level=level;c.hp=getStats(c,items).hp;}
    c.encounter=null;
    // Build next snapshot even on an exact boundary: chunking never changes RNG or stats.
    c.encounter=encounter(c,items);
  }
  return {character:c,summary,drops:summary.items};
}
export function simulateBoss(members:BossMember[]):{victory:boolean;durationMs:number;bossMaxHp:number;log:string[];rewardXp:number;rewardGold:number} {
  if(members.length<2||members.length>4)throw new Error('Expedição exige 2 a 4 aventureiros');
  const bossMaxHp=900*members.length;
  let damage=0,healing=0,protection=0,durability=0;
  const log:string[]=[];
  for(const m of members){const e=effects(m);const mult=m.preparation==='attack'?1.18:m.preparation==='guard'?.9:1;
    const contribution=Math.max(1,m.stats.attack*(1+e.damage)-5)*m.stats.speed*(1+e.speed)*30*mult;
    damage+=contribution;healing+=m.stats.hp*e.heal*4+(m.classId==='priest'?m.stats.hp*.8:0);
    protection+=m.classId==='warrior'?.12:0;durability+=m.stats.hp+m.stats.defense*8+(m.preparation==='guard'?m.stats.hp*.5:0);
    log.push(`${m.name}: ${Math.round(contribution)} de dano${m.classId==='warrior'?', protegeu o grupo':m.classId==='priest'?', restaurou os aliados':''}.`);
  }
  const incoming=members.length*350*(1-Math.min(.45,protection));
  const victory=damage>=bossMaxHp&&durability+healing>=incoming;
  log.push(victory?'O Guardião do Eclipse caiu. A cidade respira novamente.':'O Guardião resistiu. O grupo recuou em segurança.');
  return {victory,durationMs:config.bossDurationMs,bossMaxHp,log,rewardXp:victory?config.bossXp:40,rewardGold:victory?config.bossGold:20};
}
