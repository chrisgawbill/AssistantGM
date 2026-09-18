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

const pairing = (leftName: string, leftSide: string, rightName: string, rightSide: string, impact: ExtractedField) => ({
  fields: {
    leftPlayerName: known(leftName),
    leftDisplayedSide: known(leftSide),
    leftOverall: known(leftName === "Cale Makar" ? 94 : 92),
    rightPlayerName: known(rightName),
    rightDisplayedSide: known(rightSide),
    rightOverall: known(rightName === "Devon Toews" ? 91 : 89),
    chemistryOrImpact: impact,
  },
});

export const representativeEditLinesExtraction: Pick<PipelineResult, "regions"> = {
  regions: {
    "pairing-1": {
      region: { id: "pairing-1", bounds: { x: 1, y: 1, width: 1, height: 1 } },
      recognition: { text: "fixture", provider: "fixture-ocr" },
      ...pairing("Cale Makar", "LD", "Devon Toews", "RD", known("Elite")),
      valid: true,
      issues: [],
    },
    "pairing-2": {
      region: { id: "pairing-2", bounds: { x: 1, y: 1, width: 1, height: 1 } },
      recognition: { text: "fixture", provider: "fixture-ocr" },
      ...pairing("Bowen Byram", "LD", "Josh Manson", "RD", missing()),
      valid: true,
      issues: [],
    },
    "pairing-3": {
      region: { id: "pairing-3", bounds: { x: 1, y: 1, width: 1, height: 1 } },
      recognition: { text: "fixture", provider: "fixture-ocr" },
      ...pairing("Samuel Girard", "LD", "Erik Johnson", "RD", known(0)),
      valid: true,
      issues: [],
    },
  },
};
