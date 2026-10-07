# Cryptidle V3 Delivery Plan

Each stage ends with a PR reviewed by the owner; no stage starts automatically. Numbers (levels, prices, rates, durations) are decided per stage, never assumed.

## Stage 1 — Audit, rules and stabilization
- **Goal:** verified picture of the current base; fix confirmed defects.
- **Dependencies:** none.
- **Scope:** `docs/v3/*`, small fixes to existing systems, tests for real defects.
- **Exclusions:** new systems, offline cap change, art replacement.
- **Planned migrations:** none.
- **Done when:** audit complete; confirmed defects fixed; lint/typecheck/build/unit pass; integration and E2E pass on a disposable DB.
- **Required tests:** existing suites plus a regression test per integrity defect.
- **Pending decisions:** none blocking.

## Stage 2 — Configurable automatic combat and 24 h offline
- **Goal:** deterministic combat with skill hotbar, priorities and cooldowns; offline up to 24 h.
- **Dependencies:** Stage 1.
- **Scope:** rule engine in `game-core`, combat event model for the client, hotbar UI, offline simulation performance.
- **Exclusions:** new classes, new loot.
- **Planned migrations:** versioned automation rules inside `Character.data`, with a data migration for existing characters.
- **Done when:** same inputs give the same outcome; a 24 h settle fits a time budget; chunked and single settles yield identical rewards.
- **Required tests:** chunking-invariance property tests, 24 h benchmark, reload/two-tab integration.
- **Pending decisions:** rule-condition vocabulary; cooldown/priority semantics; whether encounters stay precomputed.

## Stage 3 — Four classes and specializations
- **Goal:** add Archer; two specializations per class; gold respec preserving progress.
- **Dependencies:** Stage 2.
- **Scope:** class/spec content, unlock point, respec flow.
- **Exclusions:** hybrid classes.
- **Planned migrations:** widen `ClassId`; add `specializationId`.
- **Done when:** every class/spec progresses solo through all regions in simulation.
- **Required tests:** `pnpm simulate` per spec; respec atomicity.
- **Pending decisions:** spec names, unlock level, respec cost.

## Stage 4 — Loot, materials, keys, Codex and economy
- **Goal:** desirable drops, materials, boss keys, Codex.
- **Dependencies:** Stage 3.
- **Scope:** rarity tiers, bound vs tradeable items, key items, Codex tracking, gold sinks.
- **Exclusions:** sockets, failable enchanting, full alchemy.
- **Planned migrations:** item binding/rarity, material stacks, Codex table, DB CHECK constraints on balances.
- **Done when:** no value can be duplicated or created via market, reload or concurrency.
- **Required tests:** concurrency and conservation tests per economic operation.
- **Pending decisions:** number of rarities, drop rates, key sources, binding rules.

## Stage 5 — Cooperative expeditions
- **Goal:** key-gated expeditions with requirements and individual rewards.
- **Dependencies:** Stages 2 and 4.
- **Scope:** key lifecycle, requirement checks, automatic boss combat, restart resume.
- **Exclusions:** guilds, PvP.
- **Planned migrations:** normalize `BossRoom`; expedition definitions.
- **Done when:** keys and rewards each applied exactly once; restart-safe.
- **Required tests:** restart, cancel, defeat and concurrent-start integration tests.
- **Pending decisions:** key consumption on cancel/defeat, group size, number of expeditions, guarantee material.

## Stage 6 — Art, animations and interface
- **Goal:** consistent visual identity; animated classes and monsters.
- **Dependencies:** art production may run in parallel once the sprite sheet format and combat event set are fixed (Stage 2). **Integration** depends on validated sprites and combat events.
- **Scope:** sprite sheets, UI polish, hotbar visuals.
- **Exclusions:** copying third-party code, assets or content.
- **Planned migrations:** none.
- **Done when:** `pnpm validate:assets` passes for all actors; browser console clean.
- **Required tests:** asset validator, Playwright visual smoke.
- **Pending decisions:** final art direction approval.

## Stage 7 — Balance and friend playtests
- **Goal:** tuned days-to-weeks progression.
- **Dependencies:** Stages 2–6.
- **Scope:** simulation, telemetry, playtests.
- **Planned migrations:** content-only, if any.
- **Done when:** target progression curves met in simulation and playtest.
- **Required tests:** simulation reports.
- **Pending decisions:** target time-to-level, boss difficulty.

## Stage 8 — AWS and staging
- **Goal:** staging that mirrors production.
- **Dependencies:** Stage 7.
- **Scope:** CDK deploy, backup/restore drill, monitoring, idempotency-table retention.
- **Exclusions:** paid resources without owner approval.
- **Done when:** restore drill and rollback verified in staging.
- **Required tests:** smoke and load tests against staging.
- **Pending decisions:** budget, region, domain.

## Stage 9 — Production and follow-up
- **Goal:** release and operate.
- **Dependencies:** Stage 8.
- **Scope:** launch, runbook, incident review.
- **Done when:** friends playing on production with verified backups.
- **Pending decisions:** launch date.
