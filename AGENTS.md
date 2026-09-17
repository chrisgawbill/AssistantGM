# AGENTS.md

## Mission

Build AssistantGM as a focused NHL franchise-management assistant. Keep product/domain intelligence here and generic reusable perception in the private `vision-engine` dependency.

## Working Model

The PM agent is the brain. Coding and QA agents execute bounded work and should spend minimal tokens on planning, architecture speculation, or commentary.

For each backlog ticket:

1. PM reads `docs/architecture.md`, this file, and the current ticket.
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