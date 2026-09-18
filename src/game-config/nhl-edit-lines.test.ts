import { describe, expect, it } from "vitest";
import type { ExtractedField, PipelineResult } from "@chrisgawbill/vision-engine";
import { mapNhl27EditLines, nhl27EditLinesConfiguration } from "./nhl-edit-lines";

const known = (value: unknown, score = 0.96): ExtractedField => ({
  value,
  status: "known",
  source: "mock-vision-engine",
  confidence: { score, certainty: "known", reasons: ["Deterministic test fixture"] },
});

const ambiguous = (reason: string): ExtractedField => ({
  status: "ambiguous",
  confidence: { score: 0.42, certainty: "uncertain", reasons: [reason] },
  reason,
});

const result: Pick<PipelineResult, "records"> = {
  records: [
    {
      region: { id: "defense-pairing-1", bounds: { x: 0, y: 0, width: 1, height: 1 } },
      recognition: { text: "fixture", provider: "mock" },
      data: {},
      valid: true,
      issues: [],
      fields: {
        "LD.name": known("M. Schaefer"),
        "LD.position": known("LD"),
        "LD.overall": known(84),
        "RD.name": ambiguous("Player name is obscured by glare"),
        "RD.position": known("RD"),
        "RD.overall": known(82),
      },
    },
  ],
};

describe("NHL 27 Edit Lines configuration", () => {
  it("defines semantic regions without fixed source-image coordinates", () => {
    expect(nhl27EditLinesConfiguration.contentMayOccupyPartOfSourceImage).toBe(true);
    expect(nhl27EditLinesConfiguration.regions.map(({ id }) => id)).toEqual([
      "forward-line-1",
      "forward-line-2",
      "forward-line-3",
      "defense-pairing-1",
      "defense-pairing-2",
      "defense-pairing-3",
    ]);
  });

  it("maps generic records and preserves confidence, ambiguity, and missing values", () => {
    const editLines = mapNhl27EditLines(result);
    const pairing = editLines.defensePairings[0];

    expect(pairing.players.LD?.name.value).toBe("M. Schaefer");
    expect(pairing.players.LD?.position.value).toBe("LD");
    expect(pairing.players.LD?.overall.confidence.score).toBe(0.96);
    expect(pairing.players.RD?.name.status).toBe("ambiguous");
    expect(pairing.players.RD?.name.confidence.score).toBe(0.42);
    expect(editLines.forwardLines[0].players.LW?.name.status).toBe("missing");
  });
});
