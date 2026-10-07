import type { Automation, AutomationRule, BossMember, Character, CombatEvent, RuleCondition, ClassDefinition, ClassId, Encounter, EquipmentDefinition, Item, Rarity, RegionDefinition, RewardSummary, SkillDefinition, Slot, Stats } from '@cryptidle/shared';
export * from '@cryptidle/shared';

export const config = { offlineCapMs:24*60*60*1000, roundMs:3200, maxRounds:40, hotbarSlots:3, maxLevel:20, potionPrice:8, potionHealFraction:0.55, initialGold:60, initialPotions:10, skinKills:50, bossMinLevel:3, bossCooldownMs:15*60*1000, bossDurationMs:60_000, bossGold:180, bossXp:250, marketMaxPrice:1_000_000, inventoryLimit:200, encounterMinMs:18_000, defeatRecoveryMs:30_000 } as const;
export const classes:ClassDefinition[] = [
  {id:'warrior',name:'Guerreiro',description:'Aço e resistência. Protege o grupo e suporta combates longos.',stats:{hp:130,attack:16,defense:9,speed:1},skills:['cleave','bulwark','rush']},
  {id:'mage',name:'Mago',description:'Magia arcana e ataques velozes. Alto dano, armadura frágil.',stats:{hp:88,attack:23,defense:4,speed:1.12},skills:['firebolt','barrier','haste']},
  {id:'priest',name:'Sacerdote',description:'Luz nas ruínas. Cura, proteção e dano sagrado.',stats:{hp:105,attack:17,defense:6,speed:1.03},skills:['smite','renew','ward']},
];
export const skills:SkillDefinition[] = [
  {id:'cleave',name:'Cutilada',classId:'warrior',description:'+25% de dano por encontro.',damage:.25,heal:0,protection:0,speed:0,icon:'cleave',cooldownRounds:3,durationRounds:0},
  {id:'bulwark',name:'Baluarte',classId:'warrior',description:'Reduz dano recebido em 25%. Protege aliados no boss.',damage:0,heal:0,protection:.25,speed:0,icon:'bulwark',cooldownRounds:4,durationRounds:3},
  {id:'rush',name:'Investida',classId:'warrior',description:'+20% de velocidade e +10% de dano.',damage:.1,heal:0,protection:0,speed:.2,icon:'rush',cooldownRounds:4,durationRounds:3},
  {id:'firebolt',name:'Chama arcana',classId:'mage',description:'+40% de dano por encontro.',damage:.4,heal:0,protection:0,speed:0,icon:'firebolt',cooldownRounds:3,durationRounds:0},
  {id:'barrier',name:'Barreira',classId:'mage',description:'Reduz dano recebido em 30%.',damage:0,heal:0,protection:.3,speed:0,icon:'barrier',cooldownRounds:4,durationRounds:3},
  {id:'haste',name:'Celeridade',classId:'mage',description:'+35% de velocidade.',damage:0,heal:0,protection:0,speed:.35,icon:'haste',cooldownRounds:4,durationRounds:3},
  {id:'smite',name:'Juízo',classId:'priest',description:'+30% de dano sagrado.',damage:.3,heal:0,protection:0,speed:0,icon:'smite',cooldownRounds:3,durationRounds:0},
  {id:'renew',name:'Renovar',classId:'priest',description:'Recupera 28% do HP por encontro; cura o grupo no boss.',damage:0,heal:.28,protection:0,speed:0,icon:'renew',cooldownRounds:4,durationRounds:0},
  {id:'ward',name:'Santuário',classId:'priest',description:'Reduz dano recebido em 30%.',damage:0,heal:0,protection:.3,speed:0,icon:'ward',cooldownRounds:4,durationRounds:3},
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
export const CHARACTER_DATA_VERSION=2;
/** Healing skills default to a low-HP trigger; everything else fires whenever ready. */
export const defaultCondition=(skillId:string):RuleCondition=>skills.find(s=>s.id===skillId)?.heal?{type:'hp_below',value:.6}:{type:'always'};
/** Keeps only known class skills, first occurrence wins, at most `hotbarSlots` rules. Order is priority. */
export function validRules(classId:ClassId,rules:AutomationRule[]):AutomationRule[] {
  const seen=new Set<string>();
  return rules.filter(r=>skills.some(s=>s.id===r.skillId&&s.classId===classId)&&!seen.has(r.skillId)&&Boolean(seen.add(r.skillId))).slice(0,config.hotbarSlots);
}
export function setAutomation(c:Character,rules:AutomationRule[]):Character {
  const valid=validRules(c.classId,rules);
  return {...c,automation:{version:1,rules:valid} satisfies Automation,skills:valid.map(r=>r.skillId)};
}
/** Upgrades Character.data saved by older versions. Idempotent. */
export function migrateCharacter(c:Character):Character {
  if((c.dataVersion??1)>=CHARACTER_DATA_VERSION&&c.automation)return c;
  const rules=c.automation?.rules??c.skills.map(skillId=>({skillId,condition:defaultCondition(skillId)}));
  return {...setAutomation(c,rules),dataVersion:CHARACTER_DATA_VERSION};
}
/** First rule (hotbar order) whose skill is off cooldown and whose condition holds. */
export function chooseSkill(rules:AutomationRule[],ready:(skillId:string)=>boolean,context:{heroHpRatio:number;foeHpRatio:number}):string|null {
  for(const {skillId,condition:k} of rules){
    if(!ready(skillId))continue;
    if(k.type==='always'||(k.type==='hp_below'&&context.heroHpRatio<k.value)||(k.type==='enemy_hp_above'&&context.foeHpRatio>k.value))return skillId;
  }
  return null;
}
/** Events already resolved at the encounter's current progress; never reveals future rounds. */
export function visibleEvents(fight:Encounter):CombatEvent[] { const elapsed=fight.durationMs-fight.remainingMs; return (fight.events??[]).filter(e=>e.atMs<=elapsed); }
function hpAt(fight:Encounter):number {
  if(!fight.events?.length)return Math.max(1,Math.ceil(fight.monsterMaxHp*fight.remainingMs/fight.durationMs));
  const seen=visibleEvents(fight);return Math.max(1,seen.length?seen[seen.length-1].foeHp:fight.monsterMaxHp);
}
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
  const created:Character={...input,level:1,xp:0,gold:config.initialGold,hp:c.stats.hp,potions:config.initialPotions,skin:0,kills:0,defeats:0,regionId:null,skills:c.skills.slice(0,2),potionThreshold:.4,lastSettledAt:input.now,huntSeed:seed,huntSequence:0,encounter:null,bossCooldownUntil:0};
  return migrateCharacter(created);
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
  const s=getStats(c,items);
  const rules=c.automation?.rules??c.skills.map(skillId=>({skillId,condition:defaultCondition(skillId)}));
  const base=Math.max(1,s.attack-monster.stats.defense*.5)*s.speed;
  const foeBase=Math.max(1,monster.stats.attack-s.defense*.65)*monster.stats.speed;
  let hero=Math.min(s.hp,Math.max(1,c.hp)+s.hp*.12),foe=monster.stats.hp,potionsUsed=0,victory=false;
  let haste=0,hasteLeft=0,guard=0,guardLeft=0;
  const cooldown:Record<string,number>={};const log:Omit<CombatEvent,'atMs'>[]=[];
  for(let round=1;round<=config.maxRounds;round++){
    const skillId=chooseSkill(rules,id=>!(cooldown[id]>0),{heroHpRatio:hero/s.hp,foeHpRatio:foe/monster.stats.hp});
    let dealt=0,healed=0,taken=0,potion=false;
    if(skillId){const k=skills.find(x=>x.id===skillId)!;cooldown[skillId]=k.cooldownRounds;
      if(k.damage)dealt+=base*k.damage*k.cooldownRounds;
      if(k.speed){haste=k.speed;hasteLeft=k.durationRounds;}
      if(k.protection){guard=k.protection;guardLeft=k.durationRounds;}
      if(k.heal){const h=Math.min(s.hp-hero,s.hp*k.heal);hero+=h;healed+=h;}
    }
    dealt+=base*(1+(hasteLeft>0?haste:0));foe=Math.max(0,foe-dealt);
    if(foe>0){
      taken=foeBase*(1-Math.min(.65,guardLeft>0?guard:0));hero-=taken;
      // One potion per encounter, drunk as soon as HP crosses the configured threshold.
      if(potionsUsed===0&&c.potions>0&&c.potionThreshold>0&&hero/s.hp<c.potionThreshold){const h=Math.min(s.hp,hero+s.hp*config.potionHealFraction)-hero;hero+=h;healed+=h;potionsUsed=1;potion=true;}
    }
    for(const id of Object.keys(cooldown))cooldown[id]--;
    if(hasteLeft>0)hasteLeft--;if(guardLeft>0)guardLeft--;
    log.push({round,skillId,dealt:Math.round(dealt),taken:Math.round(taken),healed:Math.round(healed),potion,heroHp:Math.max(0,Math.round(hero)),foeHp:Math.ceil(foe)});
    if(foe<=0){victory=true;break;}
    if(hero<=0)break;
  }
  const dropRoll=random(c), rarityRoll=random(c);
  const pool=equipment.filter(d=>d.regionId===region.id&&d.rarity===(rarityRoll<.6?'common':rarityRoll<.88?'uncommon':rarityRoll<.98?'rare':'epic'));
  const drop=victory&&(c.kills===0||dropRoll<.22)?pool[Math.floor(random(c)*pool.length)].id:null;
  const fightMs=Math.max(config.encounterMinMs,Math.min(90_000,Math.round((log.length*config.roundMs+6500)/100)*100));
  const events=log.map(e=>({...e,atMs:Math.round(e.round*fightMs/log.length)}));
  const durationMs=fightMs+(victory?0:config.defeatRecoveryMs);
  c.huntSequence=(c.huntSequence??c.kills+c.defeats)+1;
  return {sequence:c.huntSequence,monsterId:monster.id,durationMs,remainingMs:durationMs,monsterMaxHp:monster.stats.hp,monsterHp:monster.stats.hp,victory,hpAfter:victory?Math.max(1,Math.round(hero)):Math.round(s.hp*.75),potionsUsed,xp:victory?monster.xp:0,gold:victory?monster.gold:0,drop,events};
}
export function startHunt(character:Character,items:Item[],regionId:string|null,now:number):Character {
  const c=structuredClone(character);
  if(regionId!==null){const r=regions.find(r=>r.id===regionId);if(!r||c.level<r.minLevel)throw new Error('Região indisponível');}
  c.regionId=regionId;c.lastSettledAt=now;c.encounter=regionId?encounter(c,items):null;return c;
}
export function settleHunt(character:Character,items:Item[],now:number,options:{offlineCapMs?:number}={}):{character:Character;summary:RewardSummary;drops:string[]} {
  const c=migrateCharacter(structuredClone(character));const elapsed=Math.max(0,now-c.lastSettledAt);
  const cap=Math.min(config.offlineCapMs,Math.max(0,options.offlineCapMs??config.offlineCapMs));
  const summary:RewardSummary={xp:0,gold:0,items:[],combats:0,defeats:0,potionsUsed:0,skillUses:{},elapsedMs:Math.min(elapsed,cap),capped:elapsed>cap};
  if(now<c.lastSettledAt)return {character:c,summary:{...summary,elapsedMs:0},drops:[]};
  c.lastSettledAt=now;
  if(!c.regionId)return {character:c,summary:{...summary,elapsedMs:0,capped:false},drops:[]};
  if(c.encounter){const monster=regions.find(r=>r.id===c.regionId)?.monsters.find(m=>m.id===c.encounter?.monsterId);const maxHp=c.encounter.monsterMaxHp||monster?.stats.hp||1;c.huntSequence??=c.kills+c.defeats+1;c.encounter.sequence||=c.huntSequence;c.encounter.monsterMaxHp=maxHp;c.encounter.monsterHp||=Math.max(1,Math.ceil(maxHp*c.encounter.remainingMs/c.encounter.durationMs));}
  let available=Math.min(elapsed,cap);
  while(available>0) {
    c.encounter??=encounter(c,items);
    const fight=c.encounter;
    if(available<fight.remainingMs){fight.remainingMs-=available;fight.monsterHp=hpAt(fight);break;}
    available-=fight.remainingMs;summary.combats++;
    for(const e of fight.events??[])if(e.skillId)summary.skillUses![e.skillId]=(summary.skillUses![e.skillId]??0)+1;
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
