# AssistantGM Backlog

Build one vertical slice at a time. Do not pull future work forward unless required by the current ticket.

## AG-5A — Integrate latest Vision Engine phone-photo pipeline

### Goal

Close the perception gap discovered in AG-5 by upgrading AssistantGM to the first published Vision Engine release that includes the newer phone-photo capabilities, then prove those capabilities against the real NHL 27 Edit Lines capture before moving on to correction/advice UI.

This ticket is integration work, not a new AssistantGM perception implementation.

### Dependency

Requires a published `@chrisgawbill/vision-engine` release containing the completed VE-16 geometry-aware extraction and VE-20 display isolation / perspective normalization APIs.

### Scope

- update AssistantGM from its current Vision Engine package version to the published release containing VE-16 through VE-20
- update the lockfile and verify the package root exposes the required public APIs
- integrate `DisplayIsolationDetector` into the Edit Lines photo-processing path
- use the normalized display image/geometry as the basis for the existing Defense / Even Strength extraction flow
- update the Edit Lines extraction configuration to use Vision Engine spatial extraction primitives where they reduce brittle full-image/manual-region assumptions
- keep all display isolation, perspective normalization, OCR, and generic spatial extraction inside Vision Engine
- preserve the AG-5 typed lineup result and confidence/missing/ambiguous behavior
- rerun the representative real NHL 27 phone-photo trial
- document:
  - whether the TV/display was isolated successfully
  - whether perspective normalization improved the usable image
  - which player/pairing fields were recognized correctly
  - which fields remain missing/uncertain
  - any new generic Vision Engine blocker revealed by the real photo
- keep automated tests deterministic with mocked/legal-safe inputs rather than committing proprietary NHL imagery

### Constraints

- do not copy VE-16/VE-20 implementation into AssistantGM
- do not add AssistantGM-specific image-processing algorithms
- do not work around a generic engine failure with hard-coded source-photo coordinates
- do not start AG-6 correction UI until this integration path produces the best available structured lineup from the real photo
- do not add recommendation or persistence logic
- if a new generic perception limitation appears, document it as a narrowly scoped Vision Engine follow-up rather than expanding this ticket

### Acceptance Criteria

- AssistantGM uses the published Vision Engine release containing VE-16 and VE-20 rather than the older package version
- the real Edit Lines phone photo passes through display isolation/perspective normalization before lineup extraction when detection succeeds
- spatial extraction uses Vision Engine public APIs rather than AssistantGM CV logic
- the application still returns the existing typed three-pairing lineup contract
- missing/uncertain fields remain explicit; no values are fabricated to make the trial pass
- the real-photo trial result is documented clearly enough to decide whether AG-6 can proceed or another engine ticket is required
- typecheck, tests, and production build pass

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