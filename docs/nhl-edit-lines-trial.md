# NHL 27 Edit Lines phone-photo trial

The supplied handheld phone photo was used for manual evaluation only and is
not committed to the repository. It shows the TV/game display occupying most,
but not all, of the source image with mild perspective, glare, and display
compression.

Player names and the large line/player cards were readable by inspection. The
small chemistry labels, bottom controls, and some position/overall text are
more likely to be low-confidence or ambiguous. This is a concrete perception
requirement for `vision-engine`: locate the game-display content within a
larger phone photo and expose uncertainty for small text affected by glare and
perspective. AssistantGM does not implement that preprocessing or detection;
the Edit Lines mapping keeps those values missing or ambiguous when returned
that way.

AG-5 outcome: the application path produced the typed three-pairing lineup
shape and preserved missing values, but the current generic detector exposed
only a display/content region and did not provide reliable pairing regions or
field extraction for this photo. The narrow Vision Engine follow-up is
display isolation plus perspective-aware spatial extraction for Edit Lines
regions; no AssistantGM OCR/CV was added.

## AG-5A trial (Vision Engine 0.4.0)

Inputs were used for manual evaluation only and are not committed. The trial
command is `pnpm edit-lines-trial <path>`. Fields are scored across 21 values:
per pairing, name, side, and overall for each of two slots, plus the line
impact.

| Input | Display isolation | Frame used | Correct `known` | Wrong `known` | Ambiguous / missing |
|---|---|---|---|---|---|
| NHL 26 Defense / Even Strength phone photo of a TV (545x563, right edge of the display clipped): **official trial photo** | `ambiguous` | content bounds (almost the whole photo) | 0 | 0 | 21 |
| Clean full-frame 3840x2160 screenshot, same screen (control) | `ambiguous` (no border, as expected) | content bounds (full frame) | 11 | 0 | 10 |
| NHL 26 Forwards phone photo (negative control, wrong view) | `ambiguous` | content bounds | 0 | 0 | 21 |
| Non-display photo (circuit board) | `known` at 0.91 (false positive) | isolated | 0 | 0 | 21 |

Findings:

- **Display isolation:** it did not succeed on any real NHL photo. On the
  official photo the display runs off the right edge of the frame, and the
  detector declines the whole image. Perspective normalization was therefore
  never applied to a real NHL photo, so whether it improves the usable image
  is unproven.
- **Layout and extraction:** these work on a full, unclipped 16:9 frame. The
  control extracted 11 of 21 fields correctly and reported no wrong value as
  `known`. Every remaining miss was an OCR misread inside a correctly placed
  box, for example `© LSLAVIN`, overall `30` for `90`, `NIKISHIN A.`, and an
  impact with its sign dropped. Game-config validation (name shape, overall
  40-99, signed impact) turns these into `ambiguous` and keeps the raw value.
- **Official photo:** it produced no usable values but no fabricated ones
  either. The fallback frame is a clipped, non-16:9 slice of the display, so
  the full-screen layout fractions cannot align with it. This is not fixable
  in AssistantGM without hard-coding photo coordinates.
- **Wrong view:** the Forwards screen produced no confident defense values.

New generic Vision Engine blockers (recorded in the vision-engine backlog):

- **VE-25:** isolate a photographed display that is partially out of frame.
  This is the blocker for useful extraction from casual phone photos.
- **VE-23 (added evidence):** confident display detections on photos that
  contain no display at all.

Decision input for AG-6: the typed lineup contract is stable, and it is safe on
every input tested (no fabricated or wrong `known` values). It is useful on a
full-frame capture of the screen. On a clipped real phone photo, every value
comes back `ambiguous` or `missing` until VE-25 lands.
