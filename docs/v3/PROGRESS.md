# V3 Progress

## Current stage
Stage 1 — Audit, rules and stabilization (branch `feat/v3-stage1-baseline`).

## Done
- Baseline audit: `docs/v3/BASELINE_AUDIT.md`. Rules: `docs/v3/GAME_RULES.md`. Plan: `docs/v3/DELIVERY_PLAN.md`.
- Fixed: the speed stat suffix showed a literal `?` instead of `×`.
- Fixed: singular/plural for minutes, seconds, items, combats, defeats, potions and resolved encounters; attack/defense display is rounded.
- Fixed: a waiting boss room left by every member stayed joinable with no leader and could never start; joining now rejects it. Regression test added in `apps/server/test/integration.test.ts`.

## Pending
- Run the PostgreSQL integration suite and the Playwright two-account journey (Stage 1 validation items 1–13).
- Browser visual and console inspection.

## Blockers
- The Docker engine on the audit machine returns HTTP 500, so no disposable PostgreSQL was available.

## Commands actually executed
- `pnpm lint` — pass
- `pnpm typecheck` — pass
- `pnpm test` — 12/12 pass
- `pnpm build` — pass
- `pnpm validate:assets` — pass (11 sheets)
- `pnpm infra:synth` — pass; `infra/test.ts` — 1 test ran
- `docker version` — failed (engine HTTP 500)

## Next concrete step
Start a disposable PostgreSQL whose database name ends in `_test`, then:
`DATABASE_URL=postgresql://…/cryptidle_test pnpm db:migrate && pnpm test:integration && pnpm test:e2e`.
