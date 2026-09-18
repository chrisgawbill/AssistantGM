import { describe, expect, it } from "vitest";
import {
  editLinesDefenseEvenStrengthScreen,
  mapEditLinesDefenseEvenStrength,
} from "./edit-lines-defense-even-strength";
import { representativeEditLinesExtraction } from "./fixtures/edit-lines-defense-even-strength";

describe("Edit Lines defense / even-strength screen", () => {
  it("defines three logical pairing regions without source-image dimensions", () => {
    expect(editLinesDefenseEvenStrengthScreen.id).toBe("edit-lines-defense-even-strength");
    expect(editLinesDefenseEvenStrengthScreen.regions.map(({ id }) => id)).toEqual([
      "pairing-1",
      "pairing-2",
      "pairing-3",
    ]);
    expect(JSON.stringify(editLinesDefenseEvenStrengthScreen)).not.toMatch(/1920|1080/);
  });

  it("maps generic region output into three typed pairings", () => {
    const lineup = mapEditLinesDefenseEvenStrength(representativeEditLinesExtraction);

    expect(lineup.pairings).toHaveLength(3);
    expect(lineup.pairings[0].left.name.value).toBe("Cale Makar");
    expect(lineup.pairings[0].left.displayedSide.value).toBe("LD");
    expect(lineup.pairings[0].right.overall.value).toBe(91);
    expect(lineup.pairings[0].chemistryOrImpact.value).toBe("Elite");
    expect(lineup.pairings[0].left.name.confidence.score).toBe(0.98);
  });

  it("preserves missing metadata for unavailable pairing impact", () => {
    const impact = mapEditLinesDefenseEvenStrength(representativeEditLinesExtraction).pairings[1].chemistryOrImpact;

    expect(impact.status).toBe("missing");
    expect(impact.value).toBeUndefined();
    expect(impact.reason).toContain("No pairing impact");
    expect(impact.confidence.certainty).toBe("missing");
  });

  it("keeps all three pairing slots when a region or field is missing", () => {
    const lineup = mapEditLinesDefenseEvenStrength({ regions: {} });

    expect(lineup.pairings).toHaveLength(3);
    expect(lineup.pairings[2].left.name.status).toBe("missing");
    expect(lineup.pairings[2].right.overall.status).toBe("missing");
    expect(lineup.pairings[2].chemistryOrImpact.status).toBe("missing");
  });
});
