export type ClassId = 'warrior' | 'mage' | 'priest';
export type Slot = 'weapon' | 'head' | 'chest' | 'accessory';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';
export interface Stats { hp:number; attack:number; defense:number; speed:number }
export interface EquipmentDefinition { id:string; name:string; slot:Slot; rarity:Rarity; regionId:string; stats:Stats; sellPrice:number; icon:string }
export interface SkillDefinition { id:string; name:string; classId:ClassId; description:string; damage:number; heal:number; protection:number; speed:number; icon:string }
export interface ClassDefinition { id:ClassId; name:string; description:string; stats:Stats; skills:string[] }
export interface MonsterDefinition { id:string; name:string; stats:Stats; xp:number; gold:number }
export interface RegionDefinition { id:string; name:string; description:string; minLevel:number; monsters:MonsterDefinition[] }
export interface Item { id:string; definitionId:string; ownerId:string; equipped:boolean; listed:boolean }
export interface RewardSummary { xp:number; gold:number; items:string[]; combats:number; defeats:number; potionsUsed:number; elapsedMs:number; capped:boolean }
export interface Encounter { sequence:number; monsterId:string; durationMs:number; remainingMs:number; monsterMaxHp:number; monsterHp:number; victory:boolean; hpAfter:number; potionsUsed:number; xp:number; gold:number; drop:string|null }
export interface Character { id:string; userId:string; name:string; classId:ClassId; level:number; xp:number; gold:number; hp:number; potions:number; skin:0|1; kills:number; defeats:number; regionId:string|null; skills:string[]; potionThreshold:number; lastSettledAt:number; huntSeed:number; huntSequence?:number; encounter:Encounter|null; bossCooldownUntil:number; stats?:Stats }
export interface Listing { id:string; item:Item; definition:EquipmentDefinition; price:number; sellerId:string; sellerName:string; createdAt:number }
export type Preparation = 'balanced'|'attack'|'guard';
export interface BossMember { characterId:string; name:string; classId:ClassId; skin:0|1; ready:boolean; preparation:Preparation; stats:Stats; skills:string[] }
export interface BossRoom { id:string; code:string; leaderId:string; status:'waiting'|'running'|'won'|'lost'; members:BossMember[]; startedAt:number|null; endsAt:number|null; bossHp:number; bossMaxHp:number; victory:boolean|null; rewardGold:number; rewardXp:number; log:string[] }
export interface ChatMessage { id:string; characterId:string; name:string; text:string; createdAt:number }
export interface PlayerPresence { id:string; name:string; classId:ClassId; skin:0|1; regionId:string|null }
export interface GameState { character:Character|null; items:Item[]; summary:RewardSummary|null; room:BossRoom|null; serverTime:number }
