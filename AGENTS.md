# AGENTS.md

## Mission

Build AssistantGM as a focused NHL franchise-management assistant. Keep product/domain intelligence here and generic reusable perception in the private `vision-engine` dependency.

## Context Protocol

Optimize for fresh-context AI development.

PM reads, in order:

1. `AGENTS.md`
2. `docs/project.yaml`
3. `docs/architecture.md`
4. `docs/current.md`
5. only the active ticket in `docs/backlog.md`

Coding subagents receive only the active ticket, `docs/project.yaml`, explicitly relevant architecture sections, and the files/directories in scope. They must not scan the full backlog or repository unless the PM explicitly asks them to investigate something broader.

QA agents receive only acceptance criteria, verification commands, and the minimum changed-file context needed to verify behavior.

`docs/current.md` is temporary active-ticket state, not project history. Keep it tiny: ticket, decisions, files touched, verification, blockers, next action. Reset it when the ticket completes. Git history, architecture, and backlog remain the source of truth.

Do not create long handoff summaries when these files already contain the needed state.

## Working Model

The PM agent is the brain. Coding and QA agents execute bounded work and should spend minimal tokens on planning, architecture speculation, or commentary.

For each backlog ticket:

1. PM loads the context defined above.
2. PM identifies the smallest implementation that satisfies acceptance criteria.
3. PM dispatches narrowly scoped coding work.
4. Coding agents implement without redesigning unrelated areas.
5. PM/QA verifies acceptance criteria.
6. Fix only concrete failures. Maximum 3 defect cycles before escalating.
7. Keep outputs concise and avoid raw-log dumps.

## Core Rules

- Prefer targeted edits over rewrites.
- Do not overengineer for hypothetical future games, platforms, or AR features.
- Keep React/UI code free of domain rules where practical.
- Keep persistence code free of product decision logic.
- Keep game-specific interpretation out of `vision-engine`.
- Do not duplicate OCR, preprocessing, confidence, or generic extraction logic that belongs in `vision-engine`.
- Treat recognition output as uncertain input; preserve confidence/error information.
- Never silently invent missing player/franchise values.
- User correction is part of the recognition workflow, not an edge case.
- Add dependencies only for a concrete ticket need.
- Prefer established libraries over hand-built infrastructure where they clearly reduce complexity.
- Use current external documentation only when needed for the active dependency/API; do not preload large documentation sets into context.
- Avoid GraphQL, microservices, plugin frameworks, and generalized multi-game systems until a real requirement exists.

## Technology Defaults

Unless a ticket explicitly changes them:

- Next.js
- React
- TypeScript
- App Router
- pnpm
- Zod
- Vitest

Add Zustand, a database ORM, Playwright, auth, or heavier infrastructure only when the current feature actually needs them.

## Architecture Boundaries

Follow `docs/architecture.md`.

Expected initial source areas:

- `app` — Next.js routes/layouts
- `components` — reusable product UI
- `game-config` — NHL/game screen definitions and mappings
- `domain` — pure franchise models/rules
- `application` — use-case orchestration
- `data` — persistence adapters
- `lib` — small app-local utilities/integrations

`vision-engine` owns generic image/perception functionality. AssistantGM owns what recognized information means to the NHL franchise-management product.

## Ticket Discipline

Work one ticket at a time. Do not implement future backlog items opportunistically unless the current acceptance criteria require them.

When a ticket leaves a choice unspecified, choose the simplest approach consistent with `docs/architecture.md`.

## Subagent Guidance

Coding agents should receive:

- exact goal
- relevant files/directories
- acceptance criteria
- constraints

They should implement rather than spend tokens proposing alternatives unless blocked by a genuine ambiguity.

QA agents should verify observable acceptance criteria and return concise PASS/FAIL evidence. On failure, send the coding agent only the failing assertion/context needed to repair it.

## Verification

- Run the narrowest relevant checks first.
- Run ticket-required build/typecheck/test commands before PASS.
- Test domain behavior at the domain/application layer rather than through UI when possible.
- Avoid external paid model/API calls in normal automated tests.
- Use small deterministic fixtures for recognition integration tests.

## Completion Output

On PASS, return only:

1. what changed,
2. verification performed,
3. concrete blocker/follow-up relevant to the next ticket, if any.

No tutorial-style explanation unless requested.