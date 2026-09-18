import { describe, expect, it, vi } from "vitest";
import { representativeEditLinesExtraction } from "../game-config/fixtures/edit-lines-defense-even-strength";
import { processEditLinesPhotoWithVisionEngine } from "./vision-engine-edit-lines-photo";

const extractWithVisionEngine = vi.hoisted(() => vi.fn());

vi.mock("./vision-engine", () => ({ extractWithVisionEngine }));

describe("Edit Lines photo application flow", () => {
  it("maps one submitted photo through Vision Engine into typed lineup data", async () => {
    extractWithVisionEngine.mockResolvedValue({
      ...representativeEditLinesExtraction,
      records: [],
      fields: {},
      data: {},
      valid: true,
    });
    const sourcePhoto = new File(["fixture-photo"], "edit-lines.jpg", { type: "image/jpeg" });

    const lineup = await processEditLinesPhotoWithVisionEngine(
      { sourcePhoto, workflow: "edit-lines-defense-even-strength" },
      { provider: { name: "fixture", recognize: vi.fn() }, detector: { name: "fixture", detect: vi.fn() } },
    );

    expect(lineup.pairings).toHaveLength(3);
    expect(lineup.pairings[0].left.name.value).toBe("Cale Makar");
    expect(lineup.pairings[1].chemistryOrImpact.status).toBe("missing");
    expect(extractWithVisionEngine).toHaveBeenCalledWith(expect.objectContaining({ image: expect.any(Buffer) }));
  });
});
