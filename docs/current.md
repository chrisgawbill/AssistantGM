# Current Work

This file is temporary handoff context for the active ticket only.

## Active Ticket

AG-5 — Edit Lines photo → structured lineup (implemented)

## Decisions

- Application boundary returns typed Defense / Even Strength lineup, not PipelineResult.
- Missing engine fields map to explicit missing values; no AssistantGM OCR/CV added.

## Files Touched

- Application photo flow, API route, lineup mapping/UI, deterministic tests.
- `docs/nhl-edit-lines-trial.md`

## Verification

- Local `tsc --noEmit`, Vitest: 10 passed, Next build passed.
- `pnpm` unavailable in workspace; equivalent local binaries used.

## Blockers

- Real phone photo needs Vision Engine display isolation and perspective-aware spatial extraction.

## Next Action

Vision Engine follow-up for generic phone-photo perception; no AssistantGM-specific workaround.

## Reset Rule

After a ticket is complete, reset this file to the empty template above. Do not accumulate project history here; Git history, `docs/architecture.md`, and `docs/backlog.md` are the source of truth.
