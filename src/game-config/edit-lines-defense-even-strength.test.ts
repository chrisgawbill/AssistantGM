import { describe, expect, it } from "vitest";
import type { ExtractedField } from "@chrisgawbill/vision-engine";
import {
  editLinesDefenseEvenStrengthRegions,
  editLinesDefenseEvenStrengthScreen,
  mapEditLinesDefenseEvenStrength,
} from "./edit-lines-defense-even-strength";
import { representativeEditLinesExtraction } from "./fixtures/edit-lines-defense-even-strength";

describe("Edit Lines defense / even-strength screen", () => {
  it("defines three logical pairing regions without a fixed source-image resolution", () => {
    expect(editLinesDefenseEvenStrengthScreen.id).toBe("edit-lines-defense-even-strength");
    expect(editLinesDefenseEvenStrengthScreen.pairingIds).toEqual(["pairing-1", "pairing-2", "pairing-3"]);
    expect(JSON.stringify(editLinesDefenseEvenStrengthScreen)).not.toMatch(/1920|1080/);
  });

  it("resolves pairing regions as fractions of the full game display, not absolute source-photo pixels", () => {
    const small = editLinesDefenseEvenStrengthRegions({ width: 640, height: 360 });
    const large = editLinesDefenseEvenStrengthRegions({ width: 3840, height: 2160 });

    expect(small.map((region) => region.region.id)).toEqual(["pairing-1", "pairing-2", "pairing-3"]);

    for (const [regions, display] of [
      [small, { width: 640, height: 360 }],
      [large, { width: 3840, height: 2160 }],
    ] as const) {
      for (const region of regions) {
        expect(region.region.bounds.x).toBeGreaterThanOrEqual(0);
        expect(region.region.bounds.y).toBeGreaterThanOrEqual(0);
        expect(region.region.bounds.x + region.region.bounds.width).toBeLessThanOrEqual(display.width);
        expect(region.region.bounds.y + region.region.bounds.height).toBeLessThanOrEqual(display.height);
      }
    }

    // Rows sit at their real, fixed screen position (roughly the upper-40%-to-lower-70%
    // band of the display) rather than an even three-way split of the whole frame.
    for (const regions of [small, large]) {
      const displayHeight = regions === small ? 360 : 2160;
      for (const region of regions) {
        const rowTopFraction = region.region.bounds.y / displayHeight;
        expect(rowTopFraction).toBeGreaterThan(0.3);
        expect(rowTopFraction).toBeLessThan(0.7);
      }
      // Rows do not span the whole display height the way an even three-way split would.
      expect(regions[0]!.region.bounds.height / displayHeight).toBeLessThan(0.3);
    }

    // Rows scale proportionally with the display rather than reusing fixed pixel bounds.
    const smallRowOne = small[0]!.region.bounds;
    const largeRowOne = large[0]!.region.bounds;
    expect(largeRowOne.width).toBe(3840);
    expect(smallRowOne.width).toBe(640);
    expect(largeRowOne.height).toBeGreaterThan(smallRowOne.height);

    // Every field is spatially scoped so recognized text is attributed to the right slot,
    // and no field spans the region's full width the way a naive left/right halves would.
    for (const region of small) {
      for (const field of region.extraction.fields) {
        expect(field.source).toBeDefined();
        const bounds = field.source!.bounds;
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
        expect(bounds.width).toBeLessThan(region.region.bounds.width);
      }
    }
  });

  it("places the left card, right card, and impact value at their real, non-overlapping screen positions", () => {
    const [pairingOne] = editLinesDefenseEvenStrengthRegions({ width: 3840, height: 2160 });
    const fieldSource = (name: string) =>
      pairingOne!.extraction.fields.find((field) => field.name === name)!.source!.bounds;

    const leftName = fieldSource("leftPlayerName");
    const rightName = fieldSource("rightPlayerName");
    const impact = fieldSource("chemistryOrImpact");

    // Left and right player cards sit side by side on the left of the row;
    // the line-impact value is a separate column further to the right, not
    // squeezed between them.
    expect(leftName.x).toBeLessThan(rightName.x);
    expect(leftName.x + leftName.width).toBeLessThanOrEqual(rightName.x);
    expect(impact.x).toBeGreaterThanOrEqual(rightName.x + rightName.width);

    // Neither card spans anywhere near the full row width (there is a strategy
    // panel to the right of the pairing table that must not be read into it).
    expect(leftName.width / pairingOne!.region.bounds.width).toBeLessThan(0.2);
    expect(rightName.width / pairingOne!.region.bounds.width).toBeLessThan(0.2);
  });

  it("keeps three rows summing to at most the display height regardless of remainder", () => {
    const regions = editLinesDefenseEvenStrengthRegions({ width: 3841, height: 2161 });
    for (const region of regions) {
      expect(region.region.bounds.y + region.region.bounds.height).toBeLessThanOrEqual(2161);
    }
  });

  it("offsets pairing regions by a detected content-bounds frame's own (x, y) instead of assuming it starts at the source photo's origin", () => {
    const regions = editLinesDefenseEvenStrengthRegions({ x: 100, y: 50, width: 3840, height: 2160 });

    expect(regions[0]!.region.bounds.x).toBe(100);
    expect(regions[0]!.region.bounds.y).toBeGreaterThan(50);
    // Rows stack downward within the frame, still offset by the frame's own y.
    expect(regions[1]!.region.bounds.y).toBeGreaterThan(regions[0]!.region.bounds.y);
    expect(regions[2]!.region.bounds.y + regions[2]!.region.bounds.height).toBeLessThanOrEqual(50 + 2160);

    // Field-level spatial sources stay relative to each region's own crop
    // (unaffected by the frame's offset — that offset only applies once, to
    // the region bounds used to crop from the full source photo).
    for (const region of regions) {
      for (const field of region.extraction.fields) {
        expect(field.source!.bounds.x).toBeLessThan(region.region.bounds.width);
        expect(field.source!.bounds.y).toBeLessThan(region.region.bounds.height);
      }
    }
  });

  it("maps generic region output into three typed pairings", () => {
    const lineup = mapEditLinesDefenseEvenStrength(representativeEditLinesExtraction);

    expect(lineup.pairings).toHaveLength(3);
    expect(lineup.pairings[0].left.name.value).toBe("C. MAKAR");
    expect(lineup.pairings[0].left.displayedSide.value).toBe("LD");
    expect(lineup.pairings[0].right.overall.value).toBe(91);
    expect(lineup.pairings[0].chemistryOrImpact.value).toBe("+2");
    expect(lineup.pairings[0].left.name.confidence.score).toBe(0.98);
  });

  it("preserves missing metadata for unavailable pairing impact", () => {
    const impact = mapEditLinesDefenseEvenStrength(representativeEditLinesExtraction).pairings[1].chemistryOrImpact;

    expect(impact.status).toBe("missing");
    expect(impact.value).toBeUndefined();
    expect(impact.reason).toContain("No pairing impact");
    expect(impact.confidence.certainty).toBe("missing");
  });

  it("downgrades a low-confidence recognized value to ambiguous while preserving the raw value", () => {
    const lowConfidenceName: ExtractedField = {
      value: "| BEA A Rt ee",
      status: "known",
      source: "fixture-ocr",
      confidence: { score: 0.15, certainty: "known", reasons: ["Provider confidence 0.15"] },
    };
    const lineup = mapEditLinesDefenseEvenStrength({
      regions: {
        "pairing-1": {
          region: { id: "pairing-1", bounds: { x: 0, y: 0, width: 1, height: 1 } },
          recognition: { text: "fixture", provider: "fixture-ocr" },
          fields: { leftPlayerName: lowConfidenceName },
          valid: true,
          issues: [],
        },
      },
    });

    const name = lineup.pairings[0].left.name;
    expect(name.status).toBe("ambiguous");
    expect(name.value).toBe("| BEA A Rt ee");
    expect(name.confidence.score).toBeLessThan(0.5);
  });

  it("keeps a high-confidence recognized value known", () => {
    const highConfidenceName: ExtractedField = {
      value: "C. MAKAR",
      status: "known",
      source: "fixture-ocr",
      confidence: { score: 0.95, certainty: "known", reasons: ["Provider confidence 0.95"] },
    };
    const lineup = mapEditLinesDefenseEvenStrength({
      regions: {
        "pairing-1": {
          region: { id: "pairing-1", bounds: { x: 0, y: 0, width: 1, height: 1 } },
          recognition: { text: "fixture", provider: "fixture-ocr" },
          fields: { leftPlayerName: highConfidenceName },
          valid: true,
          issues: [],
        },
      },
    });

    const name = lineup.pairings[0].left.name;
    expect(name.status).toBe("known");
    expect(name.value).toBe("C. MAKAR");
  });

  function nameFieldRegion(name: ExtractedField) {
    return {
      regions: {
        "pairing-1": {
          region: { id: "pairing-1", bounds: { x: 0, y: 0, width: 1, height: 1 } },
          recognition: { text: "fixture", provider: "fixture-ocr" },
          fields: { leftPlayerName: name },
          valid: true,
          issues: [],
        },
      },
    };
  }

  const highConfidence = (value: unknown): ExtractedField => ({
    value,
    status: "known",
    source: "fixture-ocr",
    confidence: { score: 0.95, certainty: "known", reasons: ["Provider confidence 0.95"] },
  });

  it.each([
    ["J. SLAVIN"],
    ["S. GOSTISBEHERE"],
    ["N. ÖSTLUND"],
    ["R. O'REILLY"],
    ["J. VAN RIEMSDYK"],
  ])('accepts "%s" as a known player name', (name) => {
    const lineup = mapEditLinesDefenseEvenStrength(nameFieldRegion(highConfidence(name)));
    expect(lineup.pairings[0].left.name.status).toBe("known");
    expect(lineup.pairings[0].left.name.value).toBe(name);
  });

  it.each([["© LSLAVIN"], ["NIKISHIN A."]])(
    'reports "%s" as ambiguous with the raw OCR text preserved, never reordered or corrected',
    (name) => {
      const lineup = mapEditLinesDefenseEvenStrength(nameFieldRegion(highConfidence(name)));
      const field = lineup.pairings[0].left.name;
      expect(field.status).toBe("ambiguous");
      expect(field.value).toBe(name);
    },
  );

  it("reports an out-of-range overall rating as ambiguous while keeping the parsed value", () => {
    const line: ExtractedField = {
      value: "RD | 30 OVR",
      status: "known",
      source: "fixture-ocr",
      confidence: { score: 0.9, certainty: "known", reasons: ["Provider confidence 0.9"] },
    };
    const player = mapEditLinesDefenseEvenStrength(sideOverallLineRegion(line, "right")).pairings[0].right;

    expect(player.displayedSide.status).toBe("known");
    expect(player.displayedSide.value).toBe("RD");
    expect(player.overall.status).toBe("ambiguous");
    expect(player.overall.value).toBe(30);
  });

  it("keeps an in-range overall rating known at the boundaries", () => {
    const low = mapEditLinesDefenseEvenStrength(
      sideOverallLineRegion(
        { value: "LD | 40 OVR", status: "known", source: "fixture-ocr", confidence: { score: 0.9, certainty: "known", reasons: [] } },
        "left",
      ),
    ).pairings[0].left;
    const high = mapEditLinesDefenseEvenStrength(
      sideOverallLineRegion(
        { value: "LD | 99 OVR", status: "known", source: "fixture-ocr", confidence: { score: 0.9, certainty: "known", reasons: [] } },
        "left",
      ),
    ).pairings[0].left;

    expect(low.overall.status).toBe("known");
    expect(low.overall.value).toBe(40);
    expect(high.overall.status).toBe("known");
    expect(high.overall.value).toBe(99);
  });

  function impactFieldRegion(impact: ExtractedField) {
    return {
      regions: {
        "pairing-1": {
          region: { id: "pairing-1", bounds: { x: 0, y: 0, width: 1, height: 1 } },
          recognition: { text: "fixture", provider: "fixture-ocr" },
          fields: { chemistryOrImpact: impact },
          valid: true,
          issues: [],
        },
      },
    };
  }

  it("reports non-empty impact text that fails the sign+digit pattern as ambiguous, not missing", () => {
    const impact = mapEditLinesDefenseEvenStrength(impactFieldRegion(highConfidence("2"))).pairings[0].chemistryOrImpact;

    expect(impact.status).toBe("ambiguous");
    expect(impact.value).toBe("2");
  });

  it("keeps a well-formed signed impact value known", () => {
    const impact = mapEditLinesDefenseEvenStrength(impactFieldRegion(highConfidence("+3"))).pairings[0].chemistryOrImpact;

    expect(impact.status).toBe("known");
    expect(impact.value).toBe("+3");
  });

  it("keeps truly absent impact text missing", () => {
    const impact = mapEditLinesDefenseEvenStrength(impactFieldRegion(missingField())).pairings[0].chemistryOrImpact;
    expect(impact.status).toBe("missing");
  });

  function missingField(): ExtractedField {
    return {
      status: "missing",
      confidence: { score: 0, certainty: "missing", reasons: ["No pairing impact was recognized"] },
      reason: "No pairing impact was recognized",
    };
  }

  function sideOverallLineRegion(line: ExtractedField, side: "left" | "right" = "left") {
    return {
      regions: {
        "pairing-1": {
          region: { id: "pairing-1", bounds: { x: 0, y: 0, width: 1, height: 1 } },
          recognition: { text: "fixture", provider: "fixture-ocr" },
          fields: { [`${side}SideOverallLine`]: line },
          valid: true,
          issues: [],
        },
      },
    };
  }

  it('parses a single "LD | 89 OVR" recognized line into a side and an overall rating', () => {
    const line: ExtractedField = {
      value: "LD | 89 OVR",
      status: "known",
      source: "fixture-ocr",
      confidence: { score: 0.9, certainty: "known", reasons: ["Provider confidence 0.9"] },
    };
    const player = mapEditLinesDefenseEvenStrength(sideOverallLineRegion(line)).pairings[0].left;

    expect(player.displayedSide.status).toBe("known");
    expect(player.displayedSide.value).toBe("LD");
    expect(player.overall.status).toBe("known");
    expect(player.overall.value).toBe(89);
  });

  it("keeps a side/overall pattern mismatch explicit as ambiguous rather than fabricating a value", () => {
    const line: ExtractedField = {
      value: "some unrelated recognized text",
      status: "known",
      source: "fixture-ocr",
      confidence: { score: 0.9, certainty: "known", reasons: ["Provider confidence 0.9"] },
    };
    const player = mapEditLinesDefenseEvenStrength(sideOverallLineRegion(line)).pairings[0].left;

    expect(player.displayedSide.status).toBe("ambiguous");
    expect(player.displayedSide.value).toBeUndefined();
    expect(player.overall.status).toBe("ambiguous");
    expect(player.overall.value).toBeUndefined();
  });

  it("keeps all three pairing slots when a region or field is missing", () => {
    const lineup = mapEditLinesDefenseEvenStrength({ regions: {} });

    expect(lineup.pairings).toHaveLength(3);
    expect(lineup.pairings[2].left.name.status).toBe("missing");
    expect(lineup.pairings[2].right.overall.status).toBe("missing");
    expect(lineup.pairings[2].chemistryOrImpact.status).toBe("missing");
  });
});
