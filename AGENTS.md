# Cryptidle — agent working agreement

## Scope and source of truth
This file defines the shared workflow for coding agents in this repository.
Follow applicable higher-priority instructions and the owner's current request.
Read narrower directory instructions before editing their files.

Read these files before starting a delivery:
- docs/v3/GAME_RULES.md — approved product decisions and pending proposals.
- docs/v3/DELIVERY_PLAN.md — scope, dependencies, and acceptance criteria.
- docs/v3/PROGRESS.md — last recorded state, blockers, and next action.
- Relevant source code, tests, package scripts, and technical guides.

Product decisions belong in GAME_RULES; stage definitions in DELIVERY_PLAN;
execution evidence in PROGRESS. Link to them instead of duplicating their contents.
Treat historical reports as evidence of a past run, not proof of the current revision.
If documents conflict, preserve evidence, identify the conflict, and use the owner's
latest explicit decision. Do not silently promote proposals into approved rules.

## Start every task
1. Inspect cwd, git status, branch, remotes, and applicable instructions.
2. Preserve uncommitted changes and work from other sessions.
3. Identify the stage or feature explicitly authorized by the owner.
4. Read the relevant implementation before diagnosing or changing behavior.
5. Record a short plan and acceptance criteria. For a new feature, record its scope
   under the relevant delivery without silently authorizing unrelated work.
6. Make routine technical decisions autonomously. Ask only when a material product
   decision, destructive operation, or access limitation actually blocks progress.

## Implementation
- Deliver working increments rather than a report alone.
- Keep game rules separate from rendering and transport.
- Server time and server state govern combat, rewards, cooldowns, ownership, and gold.
- Never grant rewards from animation callbacks or trust client-provided outcomes.
- Preserve persistent data. Version and migrate serialized character data when changing
  its structure; retain compatibility or document a safe migration path.
- Validate input, authorization, and transaction invariants at the server boundary.
- A global database lock is not by itself proof of correctness.
- Keep changes scoped; do not replace frameworks or refactor unrelated systems.
- Do not fabricate assets, measurements, test results, or deployment status.
- Keep secrets out of source, logs, screenshots, reports, and browser bundles.
- Write repository documentation in English; preserve the existing game UI language
  unless localization is explicitly requested.
- Check existing assets and provenance before replacing art. Concept boards are not
  production-ready animation sheets.

## Verification
Use scripts from the current package.json, not remembered commands.
Run checks relevant to the changes and required delivery gates.
Add regression tests for real risks, especially authorization, economy, persistence,
concurrency, offline settlement, and reconnect behavior.
Use a disposable, project-owned database ending in _test for destructive suites.
A listening local PostgreSQL port is not permission to use that database.
Do not weaken tests or mark blocked tests as passing to complete a stage.
Record exact revision, commands, results, and limitations.
Build success does not establish runtime correctness or visual quality.
Inspect screenshots or the running UI for visual claims.

## Git and external actions
Use a focused branch and coherent commits. Never discard others' work.
No force pushes, destructive cleanup, merge, production deployment, paid provisioning,
or deletion of player data without explicit authorization for that action.
A feature request authorizes implementation, not unrelated operations.
Push a branch and open a review PR when requested or authorized in the current task.
Do not send messages to other people without explicit authorization.

## Completion and handoff
Update PROGRESS with verified outcomes, remaining gates, and the next concrete step.
Update technical documents when behavior changes; keep planned features labeled planned.
Report:
- Branch, commits, PR, and tested SHA when available.
- Changes and their purpose.
- Commands/tests actually executed and results.
- Checks not executed and why.
- Pending product decisions and risks.
- Whether this delivery meets its acceptance criteria.

Do not automatically start the next stage. A blocked check is a blocker, not success.
When tools are missing, complete independent work and state the smallest external
action needed to unblock the remaining work.
