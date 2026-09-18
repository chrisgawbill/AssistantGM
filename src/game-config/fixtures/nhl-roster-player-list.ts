import type { ExtractedField, PipelineResult } from "@chrisgawbill/vision-engine";

const known = (value: unknown): ExtractedField => ({
  value,
  status: "known",
  source: "fixture-ocr",
  confidence: { score: 0.98, certainty: "known", reasons: ["Fixture recognition"] },
});

export const representativeNhlRosterExtraction: Pick<PipelineResult, "fields"> = {
  fields: {
    playerName: known("Connor McDavid"),
    position: known("Center"),
    overall: known(97),
  },
};
