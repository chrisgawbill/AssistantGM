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

## AG-3A — Align merged AG-3 implementation with Edit Lines

### Goal

Reconcile the already-merged AG-3 implementation with the actual first product target: **NHL 27 Franchise Mode → Edit Lines → Defense / Even Strength**, photographed from a phone.

The current merged implementation still models a generic roster-player list. Replace that scaffold with the smallest real Edit Lines domain/configuration shape needed by AG-4 through AG-7.

### Scope

- replace/retire the current `nhl-roster-player-list` configuration and fixture naming
- define the first supported view as `edit-lines-defense-even-strength`
- model three defensive pairings with explicit left/right defense slots
- for each visible player slot, support the first reliable fields:
  - player name
  - displayed position/side
  - overall
- support the visible pairing chemistry/line-impact value when available, preserving missing/uncertain state when it is not
- preserve Vision Engine confidence/status metadata through the mapping
- keep screen/view identity and NHL terminology in AssistantGM
- remove the assumption that the source image itself is a fixed 1920×1080 clean screenshot
- keep automated tests deterministic using mocked/generic Vision Engine output
- document any real-phone-photo perception gap as a Vision Engine requirement instead of implementing generic CV here

### Constraints

- no OCR, perspective correction, display detection, image cleanup, or generic geometry algorithms in AssistantGM
- no lineup optimization yet
- no automatic screen classification
- do not expand to forwards, power play, penalty kill, or every visible side panel in this ticket
- the real camera photo may be used manually during development but should not be committed as a public test fixture

### Acceptance Criteria

- the first typed screen model represents three Defense / Even Strength pairings rather than a generic player list
- each pairing preserves slot identity and player-field confidence/uncertainty
- no fixed full-source 1920×1080 assumption remains in AssistantGM's domain/configuration contract
- deterministic tests map generic engine output into the Edit Lines model
- obsolete roster-player-list naming/configuration is removed or clearly retired
- any blocker caused by camera-photo perception is documented for Vision Engine rather than duplicated locally

---

## AG-4 — Phone photo capture / upload workflow

### Goal

Let a user take or select a **phone photo of the NHL 27 Edit Lines screen**, preview it, and submit the original image into the AssistantGM processing boundary.

This ticket proves the product input experience; it does not need to make OCR accurate by itself.

### Scope

- add a mobile-friendly photo input that can use the device camera where the browser supports it
- keep normal file/photo selection as a fallback
- preview the selected photo before processing
- validate supported file type and reasonable input size
- explicitly treat the selected workflow as `edit-lines-defense-even-strength`; automatic screen detection is not required
- submit the untouched source photo to an application-layer `processEditLinesPhoto` boundary
- route perception through the existing Vision Engine integration rather than provider internals
- show clear idle, selected, processing, and failure states
- allow the user to replace/retry the photo

### Constraints

- do not crop/rectify the TV screen with custom AssistantGM CV code
- do not implement automatic screen classification
- do not add persistence or recommendation logic
- do not require a native mobile app; prove the flow in the existing web app first
- do not commit proprietary NHL 27 images as automated fixtures

### Acceptance Criteria

- a phone user can invoke camera/photo selection from the web UI where supported
- a selected image is previewed and can be replaced
- invalid/oversized input fails clearly
- the original image reaches the application processing boundary
- UI code does not import OCR/provider internals
- processing failures are recoverable and do not crash the page
- deterministic UI/application tests do not require real OCR or NHL imagery

---

## AG-5 — Edit Lines photo → structured lineup

### Goal

Process one real-world Edit Lines phone photo into the typed Defense / Even Strength lineup created in AG-3A.

This is the first end-to-end perception proof: **photo → Vision Engine → AssistantGM lineup data**.

### Scope

- implement the application use case that sends the photo through the Vision Engine integration
- use the AG-3A Edit Lines configuration/mapping
- return three defensive pairings with left/right player slots
- map the first proven visible fields:
  - player name
  - displayed position/side
  - overall
  - pairing chemistry/impact value when reliably extractable
- preserve confidence/status/source information for every recognized value
- keep raw provider payloads out of AssistantGM domain/UI contracts
- manually evaluate at least one real phone photo of the Edit Lines screen
- if the real photo exposes a generic perception requirement (display isolation, perspective correction, spatial extraction, stronger detection, etc.), document/create the narrow Vision Engine follow-up rather than implementing it in AssistantGM
- render a simple read-only structured lineup result sufficient to inspect whether extraction worked

### Constraints

- no user correction UI yet
- no recommendation logic yet
- no persistence
- do not silently manufacture missing players/values
- do not bypass Vision Engine with AssistantGM-specific OCR/CV
- do not expand to every Edit Lines tab/view

### Acceptance Criteria

- one application call can turn a submitted Edit Lines photo into the typed lineup result
- pairings/slots remain structurally identifiable even when some fields are missing
- confidence/missing/ambiguous/invalid values remain explicit
- the UI displays structured lineup data rather than raw OCR text
- one real phone-photo trial and its outcome are documented
- any generic perception blocker is isolated as a Vision Engine requirement
- automated tests remain deterministic and legally safe

---

## AG-6 — Edit Lines verification and correction

### Goal

Let the user verify/correct the recognized defensive pairings before AssistantGM uses them for advice.

The review experience should resemble a lineup, not a generic key/value form.

### Scope

- display the captured photo alongside or readily accessible from the recognized lineup
- render three defensive pairings with distinct left/right player slots
- make recognized player name, position/side, overall, and proven pairing chemistry values editable
- visually emphasize uncertain, missing, ambiguous, or invalid values
- validate corrections against the AssistantGM Edit Lines domain schema
- preserve the difference between recognized values and user-confirmed values
- submit a fully reviewed/confirmed lineup to the application layer
- allow confirmation when optional fields remain unavailable, as long as required advice inputs are explicit

### Constraints

- do not persist franchise state yet
- do not generate advice from unconfirmed recognition values
- do not expose provider-native data in the UI
- keep correction/domain rules outside presentation components where practical

### Acceptance Criteria

- the user can correct individual player slots without editing an opaque raw payload
- uncertain fields are obvious
- invalid corrections are rejected clearly
- the photo remains available as visual reference during review
- confirmation produces a typed, provider-independent Edit Lines lineup
- tests cover corrections and confidence/status transitions

---

## AG-7 — First immediate Edit Lines advice

### Goal

Complete the first product magic trick:

**take photo → recognize lineup → verify → receive one useful, explainable AssistantGM observation/recommendation immediately.**

Persistence is not required before advice.

### Scope

- create one small deterministic domain advice service for the confirmed Defense / Even Strength lineup
- use only fields proven reliable by AG-5/AG-6
- start with an explainable rule such as:
  - flag a confirmed left/right slot-position mismatch when present, otherwise
  - identify a confirmed negative-chemistry pairing as the first pairing to review
- return the evidence used by the rule
- return an explicit insufficient-data/no-obvious-issue state when the rule cannot make a supported recommendation
- present the advice directly after lineup confirmation

### Constraints

- do not claim to have globally optimized the lineup
- do not invent hidden player attributes, chemistry formulas, morale, or game mechanics
- do not use an LLM to replace deterministic domain evidence in the first rule
- UI presents advice; domain/application code owns the rule
- missing data must not produce fabricated advice

### Acceptance Criteria

- a confirmed single Edit Lines scan can produce advice without saved franchise history
- every recommendation/observation includes the concrete pairing/slot evidence that caused it
- unsupported cases return insufficient-data/no-obvious-issue rather than guessing
- the rule is deterministic and domain-tested
- the complete first loop is demonstrable: photo → structured lineup → correction → advice

---

## AG-8 — Persist confirmed franchise lineup state

### Goal

Save confirmed Edit Lines data so future scans and recommendations can build a persistent picture of the user's franchise.

### Scope

- choose the smallest persistence implementation appropriate to the current web MVP
- define a narrow repository interface at the application/data boundary
- persist the confirmed Defense / Even Strength lineup, screen/view identity, and capture/confirmation timestamp
- load the latest confirmed lineup
- define replacement/history behavior explicitly for a newly confirmed scan of the same view
- store normalized AssistantGM domain data; keep raw OCR/provider blobs out unless a concrete debugging requirement justifies specific metadata
- keep advice logic independent of storage implementation

### Constraints

- no accounts/multi-user system unless already required by deployment
- no large database abstraction
- no recommendation rules inside persistence code
- do not persist unconfirmed recognition as canonical franchise state

### Acceptance Criteria

- confirmed lineup state survives the chosen persistence boundary
- the latest confirmed Defense / Even Strength lineup can be loaded
- recognition/provider internals are not the persisted domain contract
- replacement/history behavior is deterministic and tested
- AG-7 advice can operate on confirmed data regardless of whether it came directly from review or was loaded from storage

---

## AG-9 — Second Edit Lines view: Forwards / Even Strength

### Goal

Prove the architecture generalizes within the same NHL 27 Edit Lines family before adding a completely different Franchise Mode screen.

Use **Forwards / Even Strength** as the second view.

### Scope

- add a `edit-lines-forwards-even-strength` game configuration/domain mapping
- model the visible forward lines and their LW/C/RW slots using the same patterns established for defense
- reuse the same phone photo intake and Vision Engine integration
- reuse the same confidence, review/correction, and confirmation approach
- extend advice only where the already-proven deterministic rule generalizes cleanly; otherwise return structured confirmed data without inventing a new optimizer
- persist the confirmed forward-line state through the AG-8 repository boundary
- document any new generic Vision Engine requirement exposed by the denser three-player line layout

### Constraints

- no copy-pasted perception pipeline
- no automatic tab/screen classification yet
- no special teams in this ticket
- no full roster optimizer
- generic image/perception improvements still belong in Vision Engine

### Acceptance Criteria

- the app can process and review a Forwards / Even Strength phone photo through the existing workflow
- line/slot semantics are game configuration/domain concerns, not Vision Engine concepts
- the second view primarily adds configuration/mapping rather than a second processing architecture
- existing Defense flow remains intact
- shared intake, confirmation, persistence, and applicable advice behavior are reused
- tests prove the architecture handles both Edit Lines views

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

**Phone photo -> trustworthy Edit Lines data -> user confirmation -> immediate explainable advice -> persistent franchise state.**

Prove that loop before expanding the platform.