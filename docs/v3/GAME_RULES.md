# Cryptidle V3 — game rules

Decision snapshot: 2026-10-07.
This document separates owner-approved decisions from design proposals.
Preserve newer approved decisions when importing this snapshot.

## Approved decisions
- Dark fantasy multiplayer idle RPG, initially for playing with friends.
- Combat, skills, and bosses are fully automatic.
- The hotbar displays/configures skills, priorities, and cooldowns; no manual skill
  execution or reflex mechanics are required.
- Combat automation uses rules and priorities; no runtime LLM is required.
- Four base classes: Warrior, Mage, Archer, and Priest.
- Two specializations per base class; no free class mixing in V3.
- Specialization switching has a moderate gold cost and preserves progression.
- Every class must be viable for solo progression.
- Long-term grind with friends, with goals across sessions, days, and weeks.
- One host key opens a boss expedition for the group; participants must meet requirements.
- V3 supports up to 24 hours of offline progress.
- V3 is the first production release, including infrastructure and operational readiness.
- Art draws inspiration from Ragnarok and Tree of Savior with original Cryptidle identity.

## Proposed details — require a decision before implementation
| Area | Proposal / open question |
| --- | --- |
| Warrior | Knight / Berserker |
| Mage | Elementalist / Warlock |
| Archer | Marksman / Hunter |
| Priest | Hierophant / Exorcist |
| Specializations | Unlock level, gold cost, switch restrictions, and saved loadouts |
| Automation | Allowed conditions, priority ties, resource rules, cooldown behavior |
| Party | Two to four players |
| Key | Atomic consumption on start; none on pre-start cancellation; spent on defeat |
| Expedition recovery | Resume after server restart; no extra key charge |
| Rewards | Individual loot, rare direct drops plus guaranteed victory material |
| Binding | Tradable equipment; character-bound boss guarantee material |
| Content | Two initial expeditions and six rarities |
| Codex | Monsters, equipment, bosses; bonus limits and acquisition rules |
| Offline | Exact cap/reset semantics, overflow behavior, and event accounting |
| Balance | Drop rates, progression curve, region gates, and expected milestone times |

Technical integrity is mandatory regardless of pending balance choices:
no duplicate rewards, unauthorized transfers, negative balances, or lost committed items.

## Current implementation baseline
The owner relayed a Stage 1 report on 2026-10-07. It reports:
- Three existing classes; Archer and specializations are future work.
- Offline cap remains 8h; changing it belongs to Stage 2.
- No configurable priority system or V3 hotbar yet.
- Character state is stored in Character.data JSON.
- Economic actions reportedly use a PostgreSQL advisory transaction lock.
- Integration and E2E verification were blocked; read code and current CI before
  treating behavior as verified.

Detailed implementation evidence belongs in BASELINE_AUDIT.md, maintained by the
implementation agent. This package does not replace that audit.

## Deferred
Free class hybrids, PvP, guilds, pets, sockets/gems, relics, full alchemy,
and failure-based enchanting are not part of Stage 1.
Do not add them to V3 implementation scope without a recorded owner decision.

## Decision updates
For new decisions record date, owner instruction, affected rule, and implementation stage.
For balance experiments label values provisional and record simulation/playtest evidence.

### 2026-10-07 — Stage 2 provisional automation defaults (NOT owner-approved)
Owner instruction: "sim, pode seguir para a etapa 2" (start Stage 2). The four open
automation questions were not answered, so these defaults were implemented as
provisional and must be confirmed or changed by the owner:
- Conditions: `always`, `hp_below(x)`, `enemy_hp_above(x)`; x in 5–95 %.
  UI offers 30/50/70 % (own HP) and 30/50/80 % (enemy HP).
- Hotbar: up to 3 slots, one rule per skill; slot order is priority.
  Tie rule: the first eligible slot wins. One skill per combat round, plus the basic attack.
- Cooldowns are counted in combat rounds (1 round = 3.2 s of encounter time) and reset
  at the start of every encounter. They do not carry between encounters, offline time,
  or region changes, which keeps offline and online settlement identical.
- Resources: none yet (cooldowns only). A resource system stays an open question.
- Offline cap: 24 h, measured from the last server settlement. Any unsettled time
  beyond the cap is discarded; `OFFLINE_CAP_HOURS` may only lower it.
- Bosses still use the first two hotbar skills as passive bonuses; boss automation
  is Stage 5 scope.
- Skill numbers are provisional balance values (simulation:
  all classes reach the same 120-minute milestones as before the change).
