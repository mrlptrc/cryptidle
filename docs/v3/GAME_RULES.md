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
