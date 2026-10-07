# Cryptidle V3 — delivery plan

Execute one authorized delivery at a time. A listed stage is a roadmap, not permission
to implement every stage. A stage is complete only when its acceptance gates pass.

## 1. Baseline audit and stabilization — current
Dependencies: current checkout and access to an isolated verification environment.
Scope: inspect existing systems; fix confirmed defects; document approved/pending rules;
validate the current two-account journey.
Exclude: new classes, 24h cap, new key economy, art overhaul, AWS provisioning.
Data: preserve existing data; any required corrective migration must be reviewed.
Acceptance:
- BASELINE_AUDIT.md distinguishes verified, read-only, partial, and blocked findings.
- Relevant static checks, unit tests, PostgreSQL integration, and E2E pass on identified revisions.
- Two-account journey covers registration, hunt, rewards, equipment, potions,
  region change, reload, multiple tabs, listing/purchase, purchase concurrency,
  expedition, and persistent-state recovery.
- Visual/console inspection status is explicit.
- No known unresolved critical integrity defect.
Current blocker: PostgreSQL integration and browser journey have not been confirmed
in the latest owner-provided report. CI may resolve this without local Docker.

## 2. Automatic combat and 24h offline
Dependency: Stage 1 integrity gates.
Scope: priorities, bounded condition vocabulary, cooldowns/resources, automatic skill
execution, hotbar status/configuration, offline settlement and return summary.
Exclude: manual combat requirements, runtime LLM, specializations.
Data: version Character.data; migrate existing characters safely.
Acceptance: deterministic tests of priority/resource decisions; offline/online accounting
consistent with documented rules; no duplicate settlement across tabs/reconnects;
bounded processing cost for 24h; old characters remain playable.
Pending: conditions, ties, cooldown persistence, cap semantics.

## 3. Classes and specializations
Dependency: combat model and approved specialization rules.
Scope: Archer, four base classes, two specializations each, switching and loadouts.
Exclude: free class mixing.
Data: defaults for existing classes/characters and versioned loadouts.
Acceptance: all specializations can progress solo; distinct strategies demonstrated;
switching preserves progression and cannot duplicate resources.
Pending: names, unlock level, cost and activity restrictions.

## 4. Loot, materials, keys, Codex, and economy
Dependency: rules and class model.
Scope: region resources, equipment effects, key fragments, initial recipes,
Codex and marketplace support for approved tradable items.
Exclude: unrestricted crafting expansion, gems, relics, full alchemy.
Data: item versions, ownership/binding, stacks and recipe transactions as needed.
Acceptance: concurrent operations preserve gold/items; region resources have uses;
simulations show progress without rare drops; source/sink model documented.
Pending: rarities, drop tables, binding, Codex eligibility and bonuses.

## 5. Cooperative expeditions
Dependency: combat, key economy, approved participation/reward rules.
Scope: proposed entry and advanced expeditions; automatic phases; ready/start flow;
recovery; personal rewards and victory material.
Data: persisted participants, encounter version, state, key consumption and reward identity.
Acceptance: eligible group can disconnect and return to one consistent result;
restart preserves expedition; key charged once; rewards granted once.
Pending: group size, defeat/cancellation rules, disconnect and retry details.

## 6. Art, animation, and UI
Dependency: asset format and combat events. Art production can begin earlier.
Scope: validate Warrior/monster reference pair, then launch classes/specializations,
monsters/bosses, icons, environments, and core HUD.
Exclude: claiming concept boards are complete animation sheets.
Data: version asset metadata without changing game rewards.
Acceptance: aligned frames, genuine transparency, readable silhouettes and combat;
no launch placeholders in completed scope; usable core desktop/mobile flows;
real screenshots and animation inspection.
Pending: final asset inventory and visual acceptance reference.

## 7. Balance and friend playtest
Dependency: integrated gameplay and representative visuals.
Scope: simulations and real playtests; class viability; keys, gold sinks, rare loot,
inventory growth, group advantage, and alternative-account abuse.
Data: version balance settings and document any conversion needs.
Acceptance: no known progression dead ends; viable classes; milestone targets supported
by evidence; no strategy dominates all activities.
Pending: target progression curve and expected group size.

## 8. AWS staging
Dependency: stable candidate, deployment review and owner authorization for costs.
Scope: review existing IaC; CI, ECR, EC2, PostgreSQL persistence, HTTPS, OIDC,
secrets, logs, alerts, backups, restore, migrations and application rollback.
Staging and production must have isolated data and secrets.
Acceptance: real URL tested by multiple accounts; restart preserves state; backup
restored; deployment procedure and cost assumptions documented; load test performed.
CDK synthesis alone does not validate deployment.
Pending: AWS account/region/domain, budget and expected concurrency.

## 9. Production release
Dependency: staging gates and explicit production authorization.
Scope: tagged candidate, backup, migrations, immutable image deployment, smoke tests,
monitoring and first-days follow-up.
Data: explicitly decide handling of test data; never reset automatically.
Acceptance: real production journey passes, backups and logs operational, recovery
procedure ready, release revision and remaining limitations recorded.
No automatic expansion into new features during stabilization.

## Cross-cutting follow-up
- Measure global lock contention before replacing the lock.
- Define safe idempotency retention before deleting records.
- Coalesce polling/WebSocket refreshes without losing state.
- Maintain schema compatibility for persisted JSON.
- Record evidence per tested commit; a historical green build is not a current gate.
