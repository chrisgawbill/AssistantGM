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

## AG-3 — NHL 27 Edit Lines configuration

### Goal

Define AssistantGM's first real game-specific ingestion target: a **phone camera photo of the NHL 27 Franchise Mode "Edit Lines" screen**.

AssistantGM should define what the visible Edit Lines data means. `vision-engine` remains responsible for generic perception and must not learn NHL/player/lineup semantics.

### Input Assumption

The primary input is **not** a clean game screenshot. It is a handheld phone photo of a TV/monitor displaying NHL 27's Edit Lines screen.

The configuration must therefore avoid assuming that:

- the game UI fills the entire input image
- the display is perfectly square to the camera
- absolute pixel coordinates are stable between photos
- lighting, glare, crop, perspective, rotation, or display artifacts are identical between captures

For the first workflow, AssistantGM may already know the user is scanning the Edit Lines screen. Automatic screen classification is not required by this ticket.

### Scope

- define `edit-lines` as the first supported NHL 27 Franchise Mode screen type
- identify the smallest useful visible structures from that screen, starting with the normal forward lines and/or defense pairings actually visible in the chosen capture
- define typed AssistantGM concepts for the visible structure, such as line/pairing, slot, player reference, and only the player attributes actually shown and needed by the first workflow
- define game-specific mapping/configuration that translates generic Vision Engine region/record/field output into those AssistantGM concepts
- preserve recognition confidence/uncertainty during the mapping
- use at least one representative real phone-camera photo during development/manual evaluation to expose real capture problems
- keep deterministic automated tests based on legally safe fixtures or mocked generic Vision Engine output rather than depending on a proprietary game screenshot being committed to the public repository
- document any concrete perception failure discovered from the real camera photo so it can become a narrowly scoped `vision-engine` requirement instead of being reimplemented in AssistantGM

Start with a small useful subset of the Edit Lines screen rather than every line type, tab, attribute, or visible value.

### Constraints

- do not hard-code generic OCR, image cleanup, perspective correction, detection, or geometry algorithms in AssistantGM
- do not require automatic recognition that the image is an Edit Lines screen
- do not design the full lineup optimizer in this ticket
- do not assume a fixed camera position or fixed source-image pixel coordinates
- NHL 27 labels and domain mappings belong here; reusable perception fixes belong in `vision-engine`

### Acceptance Criteria

- `edit-lines` has a clear typed game configuration/domain mapping separate from UI code
- NHL-specific line/player terminology remains in AssistantGM
- representative generic Vision Engine output maps deterministically into typed Edit Lines data
- confidence/missing/ambiguous values remain explicit through the mapping
- the design supports a phone photo whose TV/game content occupies only part of the source image
- no generic recognition/preprocessing implementation is duplicated from `vision-engine`
- at least one real phone-photo trial is documented with any engine limitations discovered
- automated tests pass without requiring copyrighted NHL 27 imagery in the public repository

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