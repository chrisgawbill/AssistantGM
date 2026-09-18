import { describe, expect, it } from "vitest";
import { nhlRosterPlayerListScreen, mapNhlRosterPlayer } from "./nhl-roster-player-list";
import { representativeNhlRosterExtraction } from "./fixtures/nhl-roster-player-list";

describe("NHL roster player-list screen", () => {
  it("defines a small vision-engine extraction configuration", () => {
    expect(nhlRosterPlayerListScreen.regions[0].extraction.fields.map(({ name }) => name)).toEqual([
      "playerName",
      "position",
      "overall",
    ]);
  });

  it("maps representative generic extraction output into typed NHL data", () => {
    const player = mapNhlRosterPlayer(representativeNhlRosterExtraction);

    expect(player.name.value).toBe("Connor McDavid");
    expect(player.position.value).toBe("C");
    expect(player.overall.value).toBe(97);
    expect(player.overall.confidence.score).toBe(0.98);
  });
});
