import type { ExtractedField, PipelineResult } from "@chrisgawbill/vision-engine";

const known = (value: unknown): ExtractedField => ({
  value,
  status: "known",
  source: "fixture-ocr",
  confidence: { score: 0.98, certainty: "known", reasons: ["Fixture recognition"] },
});

const missing = (): ExtractedField => ({
  status: "missing",
  source: "fixture-ocr",
  confidence: { score: 0, certainty: "missing", reasons: ["Fixture omits pairing impact"] },
  reason: "No pairing impact was recognized",
});

// Names use the game's own "Initial. Surname" display shape (e.g. "C. MAKAR"),
// matching what the real screen shows and what game-config validation expects.
const pairing = (leftName: string, leftOverall: number, leftSide: string, rightName: string, rightOverall: number, rightSide: string, impact: ExtractedField) => ({
  fields: {
    leftPlayerName: known(leftName),
    leftSideOverallLine: known(`${leftSide} | ${leftOverall} OVR`),
    rightPlayerName: known(rightName),
    rightSideOverallLine: known(`${rightSide} | ${rightOverall} OVR`),
    chemistryOrImpact: impact,
  },
});

export const representativeEditLinesExtraction: Pick<PipelineResult, "regions"> = {
  regions: {
    "pairing-1": {
      region: { id: "pairing-1", bounds: { x: 1, y: 1, width: 1, height: 1 } },
      recognition: { text: "fixture", provider: "fixture-ocr" },
      ...pairing("C. MAKAR", 94, "LD", "D. TOEWS", 91, "RD", known("+2")),
      valid: true,
      issues: [],
    },
    "pairing-2": {
      region: { id: "pairing-2", bounds: { x: 1, y: 1, width: 1, height: 1 } },
      recognition: { text: "fixture", provider: "fixture-ocr" },
      ...pairing("B. BYRAM", 92, "LD", "J. MANSON", 89, "RD", missing()),
      valid: true,
      issues: [],
    },
    "pairing-3": {
      region: { id: "pairing-3", bounds: { x: 1, y: 1, width: 1, height: 1 } },
      recognition: { text: "fixture", provider: "fixture-ocr" },
      ...pairing("S. GIRARD", 92, "LD", "E. JOHNSON", 89, "RD", known(0)),
      valid: true,
      issues: [],
    },
  },
};
