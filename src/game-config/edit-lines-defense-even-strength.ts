import {
  assessConfidence,
  type BoundingBox,
  type ExtractedField,
  type ExtractionFieldConfig,
  type PipelineRegionRequest,
  type PipelineResult,
  type SpatialSource,
} from "@chrisgawbill/vision-engine";
import type {
  DefenseSide,
  EditLinesDefenseEvenStrength,
  EditLinesDefensePairing,
  EditLinesDefensePlayer,
  PairingImpact,
  PlayerField,
} from "../domain/player";

export const editLinesDefenseEvenStrengthScreen = {
  id: "edit-lines-defense-even-strength",
  label: "NHL 27 Franchise Mode Edit Lines — Defense / Even Strength",
  pairingIds: ["pairing-1", "pairing-2", "pairing-3"] as const,
} as const;

/**
 * Pixel frame Edit Lines regions are resolved against: either the Vision
 * Engine display-isolation output (`DisplayDetectionResult.geometry.display`,
 * origin implicitly (0,0) once the source photo's game display has been
 * isolated and perspective-normalized) or an engine-detected content-bounds
 * region on the untouched source photo (`x`/`y` give that region's offset
 * within the source photo). Nothing here is a hard-coded source-photo pixel
 * coordinate — the frame always comes from engine detection output.
 */
export type DisplayFrame = { x?: number; y?: number; width: number; height: number };

type FractionalBounds = {
  xFraction: number;
  yFraction: number;
  widthFraction: number;
  heightFraction: number;
};

/**
 * Real screen layout of the NHL 27 Franchise Mode Edit Lines / Defense /
 * Even Strength screen, expressed as fractions of the full game display (the
 * detected frame — never a source-photo pixel coordinate). The three pairing
 * rows sit in the left-middle of the screen, below a header/player banner
 * and above a button bar; a strategy panel occupies the right side of the
 * screen and is not part of any pairing row. Calibrated against a reference
 * 3840x2160 screenshot of this screen and padded slightly for perspective /
 * scale tolerance without overlapping adjacent cards or rows.
 */
const PAIRING_ROW_COUNT = 3;
/** Top of the first pairing row, as a fraction of the full display height. */
const PAIRING_ROWS_TOP_FRACTION = 0.386;
/** Vertical distance from one pairing row's top to the next row's top. */
const PAIRING_ROW_PITCH_FRACTION = 0.132;
/** Height of one pairing row's card area (leaves a gap before the next row's top). */
const PAIRING_ROW_HEIGHT_FRACTION = 0.122;

/** Left/right player card x-position and width, as fractions of the full display width. */
const LEFT_CARD_X_FRACTION = 0.066;
const RIGHT_CARD_X_FRACTION = 0.201;
const CARD_WIDTH_FRACTION = 0.133;

/** Line-impact value ("+2"/"-1" over "OVR"), as fractions of the full display. */
const IMPACT_X_FRACTION = 0.465;
const IMPACT_WIDTH_FRACTION = 0.05;
/** Impact band covers only the numeric value and its "OVR" label, not the meter bar beneath it. */
const IMPACT_HEIGHT_FRACTION = 0.62;

/**
 * Name / side-overall bands, relative to a player card. The side/overall
 * line ("LD | 89 OVR") is one centered text line — splitting it at the card
 * midpoint cuts through the digits, so it is read as a single spatial field
 * and split by pattern in the mapper instead. The trait icon row beneath it
 * is deliberately excluded.
 */
const NAME_BAND: FractionalBounds = { xFraction: 0, yFraction: 0, widthFraction: 1, heightFraction: 0.36 };
const SIDE_OVERALL_BAND: FractionalBounds = { xFraction: 0, yFraction: 0.38, widthFraction: 1, heightFraction: 0.37 };

function nestedBounds(container: BoundingBox, box: FractionalBounds): BoundingBox {
  const x = container.x + Math.round(box.xFraction * container.width);
  const y = container.y + Math.round(box.yFraction * container.height);
  const width = Math.max(1, Math.min(Math.round(box.widthFraction * container.width), container.x + container.width - x));
  const height = Math.max(1, Math.min(Math.round(box.heightFraction * container.height), container.y + container.height - y));
  return { x, y, width, height };
}

/**
 * One box positioned by fixed x/width fractions of the full frame width, at
 * the top of a pairing row's own crop. These bounds are relative to that
 * row's cropped image (origin (0,0) at the row's own top-left), which spans
 * the full frame width — so the frame's x/width fractions apply directly
 * with no extra offset.
 */
function rowLocalBox(frameWidth: number, rowHeight: number, xFraction: number, widthFraction: number, heightFraction = 1): BoundingBox {
  const x = Math.round(xFraction * frameWidth);
  const width = Math.max(1, Math.min(Math.round(widthFraction * frameWidth), frameWidth - x));
  const height = Math.max(1, Math.round(heightFraction * rowHeight));
  return { x, y: 0, width, height };
}

/**
 * The three pairing rows' real, fixed positions within the frame (not an
 * even three-way split of the whole screen — the rows occupy only the
 * left-middle of it).
 */
function pairingRowTop(frame: DisplayFrame, index: number): { y: number; height: number } {
  const offsetY = frame.y ?? 0;
  const y = offsetY + Math.round((PAIRING_ROWS_TOP_FRACTION + index * PAIRING_ROW_PITCH_FRACTION) * frame.height);
  const height = Math.max(1, Math.round(PAIRING_ROW_HEIGHT_FRACTION * frame.height));
  return { y, height };
}

/**
 * `unit: "token"` rather than `"line"`: the OCR provider's own line
 * segmentation groups an entire visual row of the game UI (multiple
 * side-by-side cards) into one wide "line", which never fits inside a single
 * card's narrower spatial bounds. Per-word tokens are small enough to be
 * fully contained by (and therefore attributed to) the correct field box.
 */
function playerFieldConfigs(side: "left" | "right", playerBox: BoundingBox): ExtractionFieldConfig[] {
  const spatial = (box: BoundingBox): SpatialSource => ({ unit: "token", bounds: box });
  return [
    {
      name: `${side}PlayerName`,
      type: "string",
      source: spatial(nestedBounds(playerBox, NAME_BAND)),
    },
    {
      // "LD | 89 OVR" as a single centered line; split into side + overall in the mapper.
      name: `${side}SideOverallLine`,
      type: "string",
      source: spatial(nestedBounds(playerBox, SIDE_OVERALL_BAND)),
    },
  ];
}

/**
 * Builds the three pairing regions for one Edit Lines Defense / Even Strength
 * screen against an engine-detected frame's pixel bounds (a normalized
 * display, or a content-bounds region on the untouched source photo). Every
 * bound is derived from fractions of that frame (or of a region nested
 * within it) using this screen's real layout, never from an assumed
 * source-photo resolution.
 */
export function editLinesDefenseEvenStrengthRegions(frame: DisplayFrame): readonly PipelineRegionRequest[] {
  return editLinesDefenseEvenStrengthScreen.pairingIds.map((id, index) => {
    const row = pairingRowTop(frame, index);
    const regionBounds: BoundingBox = {
      x: frame.x ?? 0,
      y: row.y,
      width: frame.width,
      height: row.height,
    };
    const leftBox = rowLocalBox(frame.width, row.height, LEFT_CARD_X_FRACTION, CARD_WIDTH_FRACTION);
    const rightBox = rowLocalBox(frame.width, row.height, RIGHT_CARD_X_FRACTION, CARD_WIDTH_FRACTION);
    const impactBox = rowLocalBox(frame.width, row.height, IMPACT_X_FRACTION, IMPACT_WIDTH_FRACTION, IMPACT_HEIGHT_FRACTION);

    return {
      region: { id, bounds: regionBounds },
      extraction: {
        fields: [
          ...playerFieldConfigs("left", leftBox),
          ...playerFieldConfigs("right", rightBox),
          // Raw text only — matched against IMPACT_PATTERN in the mapper so
          // recognized-but-unparseable text is reported as ambiguous, not
          // silently treated the same as no text at all.
          { name: "chemistryOrImpact", type: "string", source: { unit: "token", bounds: impactBox } },
        ],
      },
    } satisfies PipelineRegionRequest;
  });
}

const sides: Record<string, DefenseSide> = {
  LD: "LD",
  LEFT: "LD",
  RD: "RD",
  RIGHT: "RD",
};

/** "LD | 89 OVR" (or "RD | 90 OVR", etc.) — captures the side and the overall rating. */
const SIDE_OVERALL_PATTERN = /\b(LD|RD)\b\s*\|?\s*(\d{2,3})\s*OVR\b/i;

/**
 * Displayed-name shape: a single initial, a period, and a surname (which may
 * itself be several capitalized words, e.g. "VAN RIEMSDYK", and may contain
 * apostrophes or hyphens, e.g. "O'REILLY"). `\p{Lu}` (Unicode uppercase
 * letter, requires the `u` flag) accepts accented capitals like "Ö" that
 * `[A-Z]` would reject. This is game-specific validation of what the game's
 * name display looks like, not an OCR correction — a value that doesn't fit
 * this shape (a misread, or words in the wrong order) is reported as
 * ambiguous with the raw recognized text kept, never reordered or guessed at.
 */
const PLAYER_NAME_PATTERN = /^\p{Lu}\.\s\p{Lu}[\p{Lu}'\-\s]*$/u;

/** Plausible NHL 27 overall rating range; a parsed value outside it is reported as ambiguous. */
const OVERALL_MIN = 40;
const OVERALL_MAX = 99;

/** A signed line-impact value, e.g. "+2" or "-1". */
const IMPACT_PATTERN = /[+-]\d+/;

function missingField(name: string): ExtractedField {
  return {
    status: "missing",
    confidence: { score: 0, certainty: "missing", reasons: [`${name} was not recognized`] },
    reason: `${name} was not recognized`,
  };
}

/**
 * Vision Engine's `assessConfidence` decides *what a confidence assessment
 * looks like* for a given status; it does not itself decide when a
 * successfully-parsed value is too low-confidence to trust as "known" (that
 * decision has no engine-exported contract). This threshold makes that
 * game-config-level decision explicit, and reuses `assessConfidence` to
 * recompute a consistent assessment once a field is downgraded. 0.5 aligns
 * with the engine's own scale: `assessConfidence` already caps every
 * non-"known" status at a score of 0.49, so anything below 0.5 is already at
 * or below the engine's own "uncertain" ceiling.
 */
const MINIMUM_KNOWN_CONFIDENCE = 0.5;

function withConfidenceGate<T>(field: ExtractedField & { value: T }): PlayerField<T> {
  if (field.confidence.score >= MINIMUM_KNOWN_CONFIDENCE) return field;
  return {
    ...field,
    status: "ambiguous",
    confidence: assessConfidence(field.confidence.score, "ambiguous", [
      `Confidence ${field.confidence.score.toFixed(2)} fell below the ${MINIMUM_KNOWN_CONFIDENCE} known-confidence threshold`,
    ]),
    reason: "Confidence is too low to treat this value as known",
  };
}

/** A field derived from parsing another field's raw text; never fabricates a value on a pattern mismatch. */
function derivedField<T>(base: ExtractedField, value: T | undefined, invalidReason: string): PlayerField<T> {
  if (value === undefined) {
    return { ...base, status: "invalid", value: undefined, reason: invalidReason };
  }
  return withConfidenceGate({ ...base, value });
}

/**
 * Splits one recognized "LD | 89 OVR"-style line into its side and overall
 * values. Both derived fields carry the source line's own confidence and
 * status; a pattern mismatch is reported as explicitly `ambiguous` rather
 * than silently discarded or guessed at.
 */
function sideOverallFields(line: ExtractedField): {
  displayedSide: PlayerField<DefenseSide>;
  overall: PlayerField<number>;
} {
  if (line.status !== "known") {
    return { displayedSide: line as PlayerField<DefenseSide>, overall: line as PlayerField<number> };
  }
  const text = typeof line.value === "string" ? line.value.trim() : "";
  const match = SIDE_OVERALL_PATTERN.exec(text);
  if (!match) {
    const mismatch: ExtractedField = {
      ...line,
      value: undefined,
      status: "ambiguous",
      confidence: assessConfidence(line.confidence.score, "ambiguous", [
        `"${text}" did not match the expected "LD|RD | ## OVR" pattern`,
      ]),
      reason: `"${text}" did not match the expected "LD|RD | ## OVR" pattern`,
    };
    return { displayedSide: mismatch as PlayerField<DefenseSide>, overall: mismatch as PlayerField<number> };
  }
  const mappedSide = sides[match[1]!.toUpperCase()];
  const overallValue = Number(match[2]);
  return {
    displayedSide: derivedField(line, mappedSide, `"${text}" does not contain a recognized defense side`),
    overall: overallRatingField(line, Number.isInteger(overallValue) ? overallValue : undefined, text),
  };
}

/**
 * A parsed overall rating is only accepted as `known` when it falls within
 * the plausible NHL 27 range; an implausible read (e.g. "30", from a
 * misread "90") is reported as `ambiguous` with the parsed number kept
 * as-is — never corrected toward a "more plausible" value.
 */
function overallRatingField(line: ExtractedField, overallValue: number | undefined, sourceText: string): PlayerField<number> {
  if (overallValue === undefined) {
    return { ...line, status: "invalid", value: undefined, reason: `Cannot parse an overall rating from "${sourceText}"` };
  }
  if (overallValue < OVERALL_MIN || overallValue > OVERALL_MAX) {
    return {
      ...line,
      value: overallValue,
      status: "ambiguous",
      confidence: assessConfidence(line.confidence.score, "ambiguous", [
        `${overallValue} is outside the plausible ${OVERALL_MIN}-${OVERALL_MAX} overall rating range`,
      ]),
      reason: `${overallValue} is outside the plausible ${OVERALL_MIN}-${OVERALL_MAX} overall rating range`,
    };
  }
  return withConfidenceGate({ ...line, value: overallValue });
}

/**
 * A player name is only accepted as `known` when it fits the game's own
 * "Initial. Surname" display shape; a misread (e.g. a stray icon glyph
 * fused onto the name) or a garbled/reordered read (e.g. surname before
 * initial) is reported as `ambiguous` with the raw recognized text kept —
 * never reordered or corrected into the expected shape.
 */
function playerNameField(field: ExtractedField): PlayerField<string> {
  if (field.status !== "known") return field as PlayerField<string>;
  if (typeof field.value !== "string" || field.value.trim().length === 0) {
    return {
      ...field,
      status: "invalid",
      value: undefined,
      reason: "Value is not valid for an Edit Lines defense field",
    };
  }
  const text = field.value.trim();
  if (!PLAYER_NAME_PATTERN.test(text)) {
    return {
      ...field,
      value: text,
      status: "ambiguous",
      confidence: assessConfidence(field.confidence.score, "ambiguous", [
        `"${text}" did not match the expected "Initial. Surname" name shape`,
      ]),
      reason: `"${text}" did not match the expected "Initial. Surname" name shape`,
    };
  }
  return withConfidenceGate({ ...field, value: text });
}

/**
 * Recognized-but-unparseable impact text (e.g. "2" with its sign dropped by
 * OCR) is reported as `ambiguous`, not `missing` — `missing` is reserved for
 * when no text was recognized in the impact region at all. The raw text is
 * kept as the value rather than discarded, since `PairingImpact` allows a
 * plain string.
 */
function impactField(field: ExtractedField): PlayerField<PairingImpact> {
  if (field.status !== "known") return field as PlayerField<PairingImpact>;
  if (typeof field.value === "number" && Number.isFinite(field.value)) {
    return withConfidenceGate({ ...field, value: field.value });
  }
  if (typeof field.value !== "string" || field.value.trim().length === 0) {
    return {
      ...field,
      status: "invalid",
      value: undefined,
      reason: "Value is not valid for an Edit Lines defense field",
    };
  }
  const text = field.value.trim();
  const match = IMPACT_PATTERN.exec(text);
  if (!match) {
    return {
      ...field,
      value: text,
      status: "ambiguous",
      confidence: assessConfidence(field.confidence.score, "ambiguous", [
        `"${text}" did not match the expected impact pattern`,
      ]),
      reason: `"${text}" did not match the expected impact pattern`,
    };
  }
  return withConfidenceGate({ ...field, value: match[0] });
}

function player(fields: Record<string, ExtractedField>, side: "left" | "right"): EditLinesDefensePlayer {
  const field = (name: string) => fields[name] ?? missingField(name);
  const { displayedSide, overall } = sideOverallFields(field(`${side}SideOverallLine`));
  return {
    name: playerNameField(field(`${side}PlayerName`)),
    displayedSide,
    overall,
  };
}

function pairing(fields: Record<string, ExtractedField>): EditLinesDefensePairing {
  const impact = fields.chemistryOrImpact ?? missingField("chemistryOrImpact");
  return {
    left: player(fields, "left"),
    right: player(fields, "right"),
    chemistryOrImpact: impactField(impact),
  };
}

export function mapEditLinesDefenseEvenStrength(
  result: Pick<PipelineResult, "regions">,
): EditLinesDefenseEvenStrength {
  return {
    pairings: [
      pairing(result.regions["pairing-1"]?.fields ?? {}),
      pairing(result.regions["pairing-2"]?.fields ?? {}),
      pairing(result.regions["pairing-3"]?.fields ?? {}),
    ],
  };
}
