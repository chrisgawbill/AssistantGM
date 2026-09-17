# AssistantGM Backlog

Build one vertical slice at a time. Do not pull future work forward unless required by the current ticket.

## AG-1 — Repository and application structure

### Goal

Create the minimal Next.js/TypeScript application structure needed for AssistantGM without implementing product features yet.

### Scope

- initialize Next.js with App Router and TypeScript
- use pnpm
- add basic lint/typecheck/test scripts
- add Vitest
- establish folders consistent with `docs/architecture.md`
- add a minimal landing route proving the app builds/runs
- add a smoke test
- document local commands in README

Expected initial structure:

```text
src/
  app/
  components/
  game-config/
  domain/
  application/
  data/
  lib/
```

Do not add empty abstractions merely to populate every folder; `.gitkeep` or concise README notes are fine where needed.

### Acceptance Criteria

- `pnpm install` succeeds
- development server starts
- production build succeeds
- typecheck succeeds
- tests succeed
- folder boundaries are present and align with `docs/architecture.md`
- no OCR, screenshot parsing, persistence, auth, AR, or recommendation logic is implemented

---

## AG-2 — Vision Engine dependency boundary

### Goal

Establish how AssistantGM consumes the private `vision-engine` package without coupling the app to provider internals.

### Scope

- add the private dependency using the agreed package/repository mechanism
- create a narrow AssistantGM integration wrapper
- expose only the engine contracts needed by the product
- add a deterministic mocked/smoke integration test
- document required local/CI authentication without committing secrets

### Acceptance Criteria

- AssistantGM can import the intended public `vision-engine` API
- product code does not import internal engine paths
- tests do not require paid/external recognition calls
- repository contains no tokens/secrets

### Dependency

Requires the relevant `vision-engine` package/export ticket to be complete.

---

## AG-3 — First NHL screen configuration

### Goal

Define one concrete NHL franchise-mode screen that AssistantGM can ask `vision-engine` to extract.

### Scope

- choose one initial roster/player-list screen
- define its expected fields using game-specific configuration
- map generic extracted fields to AssistantGM domain terminology
- add fixture-driven tests for the configuration/mapping

Start with a small useful set of fields rather than every visible value.

### Acceptance Criteria

- screen configuration is separate from UI code
- NHL-specific labels/mappings remain in AssistantGM
- generic recognition behavior is not duplicated from `vision-engine`
- tests prove representative generic extraction output maps into typed AssistantGM data

---

## AG-4 — Screenshot upload workflow

### Goal

Allow a user to choose an image and send it through the first configured recognition flow.

### Scope

- simple screenshot upload/select UI
- image preview
- basic client/server input validation
- call the application-layer process-screenshot use case
- use the `vision-engine` integration boundary
- display loading, success, and failure states

### Acceptance Criteria

- supported image can be selected and previewed
- invalid input fails clearly
- UI does not directly call recognition provider internals
- recognition failures do not crash the page

---

## AG-5 — Structured extraction result

### Goal

Turn recognition output into a typed AssistantGM representation for the first NHL screen.

### Scope

- application use case maps generic engine output through the game configuration
- define the minimum domain model needed for the first screen
- preserve confidence/uncertainty metadata
- show extracted values in a readable review surface

### Acceptance Criteria

- no silent defaults for missing recognition values
- low-confidence/missing values remain explicit
- domain mapping is covered by deterministic tests
- UI renders structured values rather than raw OCR/provider payloads

---

## AG-6 — Review and correction flow

### Goal

Let the user correct recognized values before AssistantGM accepts them as franchise state.

### Scope

- editable review UI
- visually identify values that need confirmation
- validate corrected values
- separate raw recognition output from confirmed product data
- submit a confirmed result to the application layer

### Acceptance Criteria

- user can correct extracted values
- uncertain fields are discoverable
- invalid corrections are rejected clearly
- confirmed data no longer depends on the recognition provider payload shape

---

## AG-7 — Persist franchise state

### Goal

Store confirmed screenshot-derived data so the user can build a franchise record over time.

### Scope

- choose the smallest persistence implementation that satisfies the product need
- add repository interfaces at the application/domain boundary
- persist confirmed first-screen data
- load existing franchise state
- define replacement/merge behavior explicitly

### Acceptance Criteria

- confirmed data survives the intended persistence boundary
- recognition output is not persisted as opaque provider blobs when normalized data is sufficient
- persistence code contains no recommendation/domain decision logic
- tests cover save/load behavior

---

## AG-8 — First explainable AssistantGM recommendation

### Goal

Use confirmed franchise data to produce one small, understandable management recommendation.

### Scope

Pick a recommendation that can be explained from available data without requiring a large optimization engine.

- implement domain-level recommendation rule/service
- include the evidence/reason for the recommendation
- present it clearly in the UI
- distinguish insufficient-data state from a recommendation

### Acceptance Criteria

- recommendation logic is deterministic and domain-tested
- UI does not contain the rule itself
- recommendation includes an explanation tied to known data
- missing data does not produce fabricated advice

---

## AG-9 — Additional screen ingestion

### Goal

Prove the architecture handles a second NHL franchise screen without redesigning the recognition stack.

### Scope

- add a second game screen configuration
- reuse the existing engine/integration workflow
- map new information into existing or minimally extended domain state
- update review/correction flow as necessary

### Acceptance Criteria

- no copy-pasted recognition pipeline
- second screen primarily requires configuration/domain mapping, not engine redesign
- shared behavior remains tested

---

## Later Backlog

Only detail these after the screenshot workflow is reliable:

- lineup/roster optimization
- morale and chemistry-aware recommendations
- contract/cap management
- trade/depth analysis
- franchise timeline/history
- automatic screen classification where useful
- live camera recognition
- real-time AssistantGM hints
- React Native/mobile client if web capture is insufficient
- ARKit/ARCore presentation layer

## Product Guardrail

The near-term milestone is not “build an AI GM.” It is:

**Screenshot -> trustworthy structured franchise data -> user confirmation -> one useful explainable recommendation.**

Prove that loop before expanding the platform.