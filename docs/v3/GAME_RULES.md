# Cryptidle V3 Game Rules

Core loop: **choose a region → hunt automatically → earn XP, gold, equipment and materials → improve the build → take on harder content with friends.**
The player decides build, region, equipment, group and automation rules; the character executes. "Combat AI" means deterministic rules and priorities — no LLM at runtime.

## 1. Approved decisions

1. Everything is automatic, including skills and bosses.
2. A hotbar to view and configure skills, priorities and cooldowns.
3. No content requires manual skill execution or reflexes.
4. Four base classes: Warrior, Mage, Archer, Priest.
5. Progression through specialization.
6. Two specializations per class.
7. No free class combination in this version.
8. Changing specialization costs a moderate amount of gold and preserves progress.
9. Long grind with friends, with goals spanning days and weeks.
10. Every class must be able to progress solo.
11. A host key opens the boss for the group.
12. Participants must meet the expedition requirements.
13. Offline progress of up to 24 h in V3.
14. V3 is the first production release, with infrastructure and operations prepared.

Out of scope for V3: gems/sockets, relics, pets, guilds, PvP, hybrid classes, full alchemy, failable enchanting.

## 2. Pending proposals (not approved — no numbers are final)

- Specializations: Warrior → Knight / Berserker; Mage → Elementalist / Warlock; Archer → Marksman / Hunter; Priest → Hierophant / Exorcist.
- Group size 2–4.
- Key consumed when the expedition starts; cancelling before start does not consume it; defeat consumes it.
- Expedition resumes after a server restart.
- Individual rewards; equipment tradeable; boss guarantee material bound to the character.
- Two initial expeditions.
- Rare direct drop plus guaranteed material per victory.
- Six rarities.
- Initial Codex for monsters, equipment and bosses.

Technical guarantees (atomic operations, rewards granted exactly once) are required regardless of the final gameplay numbers.

## 3. Current behavior verified in code (as of Stage 1)

Source: `packages/game-core/src/index.ts`, `apps/server/src/game.ts`.

- Classes: Warrior, Mage, Priest; 3 skills each, 2 active. Skills are passive multipliers (damage, heal, protection, speed) — no cooldowns or priorities.
- Regions: Bosque das Cinzas (lvl 1), Pântano dos Sussurros (lvl 5), Cripta do Eclipse (lvl 10); 3 monsters each.
- Level cap 20; `xpForLevel(l) = 75·(l−1)²`.
- Each encounter is resolved up front from a seeded RNG (outcome hidden from the client) and lasts ≥ 18 s; a defeat adds 30 s of recovery and costs up to 3 gold.
- Potions: 8 gold each, heal 55 % of max HP, at most one per encounter, used when projected HP falls under the configured threshold.
- Drops: 22 % per victory (first kill guaranteed); rarities common/uncommon/rare/epic. Inventory limit 200; overflow drops are converted to gold.
- Offline cap: **8 h** (`config.offlineCapMs`); the `OFFLINE_CAP_HOURS` env var can only lower it.
- Changing equipment or build first settles elapsed time, then restarts the current encounter.
- Market: list unequipped items, buy, cancel. Every mutation runs under a global PostgreSQL advisory lock and an idempotency key.
- Boss: level ≥ 3, 2–4 players, all ready, leader starts; outcome simulated at start, resolves after 60 s; each member is rewarded once (`BossReward` primary key); 15 min cooldown. No key item.

## 4. Required changes for V3

| Change | Stage |
| --- | --- |
| Configurable automatic combat: hotbar, priorities, cooldowns, deterministic rule engine, combat event stream | 2 |
| Offline cap from 8 h to **24 h** — the approved V3 target, but it belongs to Stage 2 together with performance and balance validation of 24 h simulations. **Not changed in Stage 1.** | 2 |
| Archer class; two specializations per class; gold-cost respec | 3 |
| Loot/rarity rework, materials, keys, Codex, economy sinks | 4 |
| Key-gated cooperative expeditions with requirements | 5 |
| Final art, animations and interface | 6 |
| Balance and friend playtests | 7 |
