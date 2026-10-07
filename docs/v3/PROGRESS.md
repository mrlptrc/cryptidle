# Cryptidle V3 — progress

## Import status
Snapshot prepared on 2026-10-07 from the owner's relayed implementation report.
This file has NOT been independently verified against the current branch or CI.
Merge with newer repository records; do not overwrite newer evidence.

## Update — 2026-10-07 (art kit import, before Stage 3)
- Authorized task: integrate cryptidle-art-kit per assets/IMPORT_INSTRUCTIONS.md and assets/AGENTS.md.
- Branch / commit: feat/v3-art-kit-import (stacked on feat/v3-stage2-auto-combat), commit 0b48ca8.
- Changes: kit copied without overwriting anything (no path collisions); 11 image hashes verified; assets/PILOT_INTEGRATION.md added (inspection results, runtime status, missing-art inventory, Warrior/Bat pilot plan); root AGENTS.md now points to assets/AGENTS.md. No runtime file changed.
- Commands: sha256 check against art-kit.manifest.json (11/11 match); pnpm validate:assets passed.
- Blocker: git push failed twice with GitHub "Internal Server Error" (request 5FCC:1B6A8D:24551E:2C3758:6AC660C5), so there is no PR yet.
- Pending owner decisions: approve the Warrior model; confirm 192×192 frames vs runtime 112×144; region↔background mapping (the kit's "swamp" is runtime citadel.png).
- Next concrete action: retry `git push -u origin feat/v3-art-kit-import` and open the PR against feat/v3-stage2-auto-combat.

## Update — 2026-10-07 (Stage 2 implementation)
- Authorized task: Stage 2, automatic combat and 24h offline.
- Branch / commit: feat/v3-stage2-auto-combat (stacked on feat/v3-stage1-baseline); code commit 1f7acd1. PR https://github.com/mrlptrc/cryptidle/pull/3 (base: Stage 1 branch).
- Changes:
  - game-core: deterministic per-round combat. A 3-slot hotbar is evaluated in priority order with conditions (`chooseSkill`). Per-skill cooldowns and buff durations; one potion per encounter at the threshold.
  - Combat events are stored on the encounter; the server returns only rounds already resolved (`visibleEvents`). The summary counts skill uses.
  - Character.data versioned (`dataVersion: 2`, `automation`). `migrateCharacter` runs on every load and is idempotent. Old characters keep their progress, and their skills become `always` rules (heals become `hp_below 60%`).
  - Offline cap 8h → 24h (`config.offlineCapMs`). The server default now follows game-core; env samples and compose were updated to 24.
  - API: `POST /api/build` takes `{rules:[{skillId,condition}],potionThreshold}`, validated by zod and the class check.
  - UI: hotbar editor in the skills modal; live hotbar (ready/cooldown, last round) in the side panel; skill uses in the return summary.
- Commands and actual results (local):
  - pnpm lint: pass
  - pnpm typecheck: pass
  - pnpm test: 18/18 pass. New tests cover priority/conditions/cooldown, priority changes outcome, invalid rules, legacy migration, no future-event leak, and 24h bounded cost for every class (< 2 s each).
  - pnpm build: pass
  - tsx scripts/simulate.ts: same milestones as before (all classes reach level 20 in 120 min, 0 defeats). balance.json was not updated.
- Integration tests updated (24h cap, new build payload, new legacy-migration/validation test). Not run locally because Docker still returns HTTP 500; they rely on CI.
- Checks not executed: integration/E2E locally; visual/console inspection of the new hotbar.
- Pending decisions: confirm or replace the provisional automation defaults (GAME_RULES "Decision updates"); resource system yes/no.
- CI on PR #3 (tested SHA 60ed54642b42d8bc169aa04b999386605b1b055a, run https://github.com/mrlptrc/cryptidle/actions/runs/37638792276): unit 18/18, integration 16/16, Playwright journey 1/1, all pass.
- The first CI run (1b02672) failed the integration assertion that enemy HP drops within 5 s. Cause: with per-round events, HP only changed at round boundaries. Fixed in 60ed546 by interpolating within the current round (never below 1 before the kill resolves), with a unit test added.
- Next concrete action: the owner reviews the hotbar UI in the browser and decides on the provisional automation defaults; then review/merge #2 and #3 in order.

## Update — 2026-10-07 (Stage 1 verification via CI)
- Date and authorized task: 2026-10-07, merge agent kit and resume Stage 1 outstanding verification.
- Branch / commit / tested SHA: feat/v3-stage1-baseline; docs commit 69b354b; tested SHA 69b354b5a118235945e3be474ee2f382d8edf4c2.
- Changes: agent kit (AGENTS.md, CLAUDE.md, docs/v3 rules/plan/progress) committed; BASELINE_AUDIT updated with CI evidence.
- Commands and actual results (GitHub Actions, isolated postgres:17.6 service, database cryptidle_test):
  - unit: 12/12 passed
  - pnpm test:integration: 15/15 passed (includes abandoned-room regression, concurrent purchase, cancel vs purchase, rollback, cross-owner authorization, two-tab/no duplicate rewards, boss restart with single reward)
  - Playwright journey 'two real accounts hunt, equip, trade, chat and complete the same boss': 1 passed
- CI / PR / artifact links: PR https://github.com/mrlptrc/cryptidle/pull/2; runs https://github.com/mrlptrc/cryptidle/actions/runs/37634209248 (pull_request) and https://github.com/mrlptrc/cryptidle/actions/runs/37634201641 (push).
- Checks not executed: visual and browser console inspection (no browser session in this environment); local Docker still returns HTTP 500. The E2E journey does not explicitly cover potions purchase, region switching beyond the first region, or concurrent purchase from two browser tabs; these are covered only at API/integration level.
- Pending decisions: none blocking Stage 1.
- Next concrete action: owner (or a session with a browser) runs the app locally and inspects the hunt, inventory, market and boss screens plus console; then mark the visual gate and close Stage 1.

Gates now satisfied by the CI run above: PostgreSQL integration; marketplace concurrency/rollback; authorization and duplicate settlement; two-account E2E; persistent reward recovery (boss restart). Remaining: visual/console inspection; Stage 2 readiness sign-off by owner.

## Current authorized delivery
Stage 2 — automatic combat and 24h offline. Authorized by the owner on 2026-10-07.
Stage 1 closed by the owner's authorization, except the visual/console gate, which carries over.
Status: IMPLEMENTED, awaiting CI and owner review; do not begin Stage 3 automatically.

## Last reported Git state
- Branch: feat/v3-stage1-baseline
- Base: origin/main at 6a2674e
- Reported code commit: ede5a69
- A subsequent documentation commit was reported; SHA not supplied.
- PR: https://github.com/mrlptrc/cryptidle/pull/2
- Merge not authorized by this document.

## Reported changes
- Corrected speed multiplier symbol and singular/plural presentation.
- Rounded attack/defense display without changing rules.
- Rejected joining an abandoned waiting boss room with no leader.
- Added a regression test for that room; it had not run.
- Added docs/v3 documentation and README updates.

## Reported checks — not rerun by this package
| Check | Reported result |
| --- | --- |
| pnpm lint | Passed |
| pnpm typecheck | Passed |
| pnpm test | 12/12 passed |
| pnpm build | Passed |
| pnpm validate:assets | Passed, 11 spritesheets |
| CDK synthesis and infrastructure test | Passed |
| PostgreSQL integration | Not run; 15 tests reported |
| Playwright E2E / two-account journey | Not run |
| Visual and browser console inspection | Not performed |

Exact tested SHA was not supplied for all checks; confirm it before closing the stage.

## Blocker
Local Docker Engine returned HTTP 500. PostgreSQL on port 5432 was not project-owned
and was intentionally not used. No production or unrelated database may be used.

## Next action
Inspect the latest PR revision and CI configuration/executions.
If missing, add isolated PostgreSQL integration and Playwright jobs using disposable
_test databases, migrations, health checks, and sanitized failure artifacts.
Run required gates, inspect results, and record URLs plus the tested SHA.

## Remaining gates
- [ ] PostgreSQL integration passes, including new room regression.
- [ ] Marketplace concurrency and rollback invariants verified.
- [ ] Authorization and duplicate-settlement checks verified.
- [ ] Two-account E2E journey completed.
- [ ] Persistent activity/reward recovery verified.
- [ ] Visual/console inspection completed or clearly identified as remaining.
- [ ] Audit updated with evidence and unresolved risks.
- [ ] Stage 2 readiness explicitly reported to owner.

## Known risks / future work
- Global advisory lock contention is unmeasured.
- Character.data needs versioned migration when its structure changes.
- Idempotency records have no reported retention policy.
- Polling and WebSocket notifications can trigger overlapping state requests.
- Read-only code inspection is not runtime verification.

## Update format for the next agent
Append or replace stale status with:
- Date and authorized task:
- Branch / commit / tested SHA:
- Changes:
- Commands and actual results:
- CI / PR / artifact links:
- Checks not executed:
- Pending decisions:
- Next concrete action:
Preserve useful historical evidence; never convert "blocked" into "passed".
