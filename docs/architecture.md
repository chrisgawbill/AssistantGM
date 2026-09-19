# AssistantGM Architecture

## Purpose

AssistantGM is the product layer that turns recognized game screenshots into useful franchise-management information and recommendations.

It is the first consumer of the private `vision-engine` repository, but it must not duplicate generic perception capabilities that belong there.

## Product Boundary

AssistantGM owns:

- game-specific configuration and screen definitions
- NHL/franchise-domain models
- roster, lineup, morale, chemistry, contract, and franchise-state interpretation
- user correction / confirmation flows
- persistence of recognized franchise data
- recommendation and optimization logic
- application orchestration
- web/mobile product UI
- future live-assistant and AR experiences

AssistantGM does **not** own generic OCR, image preprocessing, confidence plumbing, or provider-specific computer-vision implementation. Those belong in `vision-engine` when they are reusable.

## First End-to-End Workflow

The first useful vertical slice is:

1. User takes or selects a phone photo of an NHL 27 Franchise Mode screen.
2. The user-selected workflow determines the game-specific screen configuration (currently `edit-lines-defense-even-strength`); automatic screen classification is deferred.
3. AssistantGM sends the untouched source photo plus generic extraction configuration to `vision-engine`.
4. `vision-engine` returns normalized structured fields with confidence / uncertainty metadata.
5. AssistantGM maps those generic fields into NHL/franchise-domain models.
6. User can verify or correct low-confidence values.
7. Confirmed data is stored as franchise state.
8. AssistantGM can later use that state for roster/lineup recommendations.

The MVP should prove this path before live video or AR work begins.

### Input Assumption

The primary input is a handheld phone photo of a TV/monitor, not a clean game screenshot. Configuration and domain contracts must not assume that:

- the game UI fills the entire source image
- the display is square to the camera
- absolute source-pixel coordinates (e.g. a fixed 1920×1080 frame) are stable between photos
- lighting, glare, crop, perspective, rotation, or display artifacts are consistent

Display isolation, perspective normalization, and spatial extraction are `vision-engine` responsibilities. When a real photo exposes a generic perception gap, document it as a narrow `vision-engine` follow-up rather than adding CV to AssistantGM or hard-coding source-photo coordinates.

### Current Slice: Edit Lines — Defense / Even Strength

- view id: `edit-lines-defense-even-strength`
- three defensive pairings, each with explicit left/right defense slots
- per slot: player name, displayed position/side, overall
- per pairing: chemistry/line-impact value when available
- every value keeps its confidence/status; missing or ambiguous values stay explicit
- flow: `POST /api/edit-lines-photo` → application `processEditLinesPhoto` boundary → `vision-engine` wrapper → `game-config` mapping → typed lineup
- raw provider payloads stay out of domain and UI contracts; UI never imports OCR/provider internals

Real-photo trial results are recorded in `docs/nhl-edit-lines-trial.md`.

## Initial Technology Stack

### Application

- Next.js
- React
- TypeScript
- Next.js App Router
- pnpm

### Validation / State

- Zod for runtime schemas
- Zustand only if client state becomes complex enough to justify it

### Persistence

Use the simplest persistence needed for the current milestone. Do not introduce a large data layer before persistent franchise state is actually required.

When durable multi-user data becomes necessary, prefer PostgreSQL with Drizzle or Prisma. Authentication/storage services may be introduced later if they reduce implementation complexity.

### Testing

- Vitest for unit/domain tests
- React Testing Library where component behavior needs coverage
- Playwright only when real end-to-end flows justify it
- automated tests use deterministic mocked/generic `vision-engine` output; never commit proprietary NHL 27 imagery as fixtures (real photos are for manual evaluation only)

### Shared Engine

`vision-engine` is consumed as a private dependency. AssistantGM should depend on stable exported contracts rather than provider internals.

## Application Layers

### `game-config`

Describes game-specific screens and extraction expectations.

Examples:

- supported screen identifiers
- expected fields
- region definitions
- mappings from generic extracted values to domain concepts
- validation hints

This layer may contain NHL/game-specific knowledge.

### `domain`

Pure franchise-management concepts and rules.

Expected models may include:

- Franchise
- Player
- Roster
- Lineup
- Contract
- Morale
- Chemistry
- Team state

Domain code should not know about React, HTTP, OCR providers, or image-processing implementation.

### `application`

Coordinates use cases such as:

- process screenshot
- confirm extracted data
- update franchise state
- generate lineup advice
- optimize roster

This layer may call `vision-engine`, persistence, and domain services, but should keep those dependencies behind narrow interfaces.

### `data`

Persistence adapters and repository implementations.

Keep this thin. Do not put domain rules into database code.

### `ui`

Next.js routes, React components, capture/upload flows, verification UI, and recommendation presentation.

UI should call application-layer use cases rather than embedding domain or recognition logic directly in components.

## Dependency Direction

Prefer this direction:

`UI -> Application -> Domain`

`Application -> vision-engine`

`Application -> Data adapters`

`Game config -> Domain mapping / vision-engine configuration`

Avoid reverse dependencies. In particular, `vision-engine` must never import AssistantGM.

## Recognition Contract

AssistantGM should treat recognition output as uncertain external input.

Never assume OCR/vision results are correct just because a provider returned them. Keep confidence metadata attached long enough for the UI/application layer to decide whether user confirmation is required.

A failed or incomplete recognition result should remain explicit rather than being silently converted into invented/default franchise data.

## Build Strategy

Build vertically instead of attempting the entire franchise assistant at once.

Recommended progression:

1. app/repo structure
2. `vision-engine` dependency boundary
3. one NHL screen configuration
4. screenshot upload
5. structured extraction
6. review/correction UI
7. persisted franchise state
8. first explainable recommendation
9. additional screens and domain intelligence
10. live camera assistance
11. AR presentation when proven useful

## Deferred Work

Do not add these until earlier vertical slices prove the need:

- continuous live-video recognition
- ARKit / ARCore integration
- real-time tracking
- large multi-provider orchestration systems
- GraphQL
- microservices
- event buses
- generalized plugin systems
- cross-game abstraction beyond what a second real game requires

## Core Rule

AssistantGM should contain the intelligence that makes the product an NHL franchise assistant. Generic image-understanding machinery belongs in `vision-engine`; product meaning belongs here.