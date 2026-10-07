# Claude entry point — Cryptidle

Read and follow the shared repository instructions in:
@AGENTS.md

Then read:
- docs/v3/GAME_RULES.md
- docs/v3/DELIVERY_PLAN.md
- docs/v3/PROGRESS.md

These files provide persistent context; the owner's current message specifies the
work authorized for this session. Read applicable nested instructions and relevant
source files before editing.

If the owner says "continue", resume the current authorized delivery recorded in
PROGRESS. If it is complete and no next delivery was authorized, report readiness
and ask which delivery to start. Do not infer permission to deploy or merge.

At session start, briefly state the current delivery and the next concrete action.
At session end, update PROGRESS so another session can resume without this chat.

Do not copy the roadmap or game rules into this file. Do not store credentials,
session tokens, or machine-specific secrets in persistent instructions.

This file is repository context, not a guarantee that every tool automatically loads
all referenced documents. Explicitly read the required documents when necessary.
