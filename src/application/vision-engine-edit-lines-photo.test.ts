import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DetectionResult, DisplayDetectionResult } from "@chrisgawbill/vision-engine";
import { representativeEditLinesExtraction } from "../game-config/fixtures/edit-lines-defense-even-strength";
import {
  processEditLinesPhotoWithVisionEngine,
  runEditLinesVisionEnginePipeline,
} from "./vision-engine-edit-lines-photo";

const extractWithVisionEngine = vi.hoisted(() => vi.fn());
const isolateDisplay = vi.hoisted(() => vi.fn());
const detectContentFrame = vi.hoisted(() => vi.fn());

vi.mock("./vision-engine", () => ({ extractWithVisionEngine, isolateDisplay, detectContentFrame }));

const engineOptions = { provider: { name: "fixture", recognize: vi.fn() }, detector: { name: "fixture", detect: vi.fn() } };

const ambiguousIsolation = {
  status: "ambiguous",
  confidence: { score: 0.2, certainty: "uncertain", reasons: ["Two candidate regions scored too closely"] },
  diagnostics: { stage: "components", working: { width: 512, height: 288 }, maskRatio: 0.5, candidateCount: 2, reason: "fixture" },
} as DisplayDetectionResult;

const missingIsolation = {
  status: "missing",
  confidence: { score: 0, certainty: "missing", reasons: ["fixture"] },
  diagnostics: { stage: "threshold", working: { width: 512, height: 288 }, maskRatio: 0, candidateCount: 0, reason: "fixture" },
} as DisplayDetectionResult;

function fullPipelineResult() {
  return { ...representativeEditLinesExtraction, records: [], fields: {}, data: {}, valid: true };
}

describe("Edit Lines photo application flow", () => {
  beforeEach(() => {
    extractWithVisionEngine.mockReset();
    isolateDisplay.mockReset();
    detectContentFrame.mockReset();
  });

  it("resolves geometry-aware pairing regions against the isolated display when isolation succeeds", async () => {
    const isolation = {
      status: "known",
      confidence: { score: 0.9, certainty: "known", reasons: ["fixture"] },
      geometry: {
        source: { topLeft: { x: 0, y: 0 }, topRight: { x: 1, y: 0 }, bottomRight: { x: 1, y: 1 }, bottomLeft: { x: 0, y: 1 } },
        display: { width: 640, height: 360 },
        sourceToDisplay: [1, 0, 0, 0, 1, 0, 0, 0, 1],
        displayToSource: [1, 0, 0, 0, 1, 0, 0, 0, 1],
      },
      image: { buffer: Buffer.from("warped-display") },
      diagnostics: { stage: "complete", working: { width: 512, height: 288 }, maskRatio: 0.5, candidateCount: 1, reason: "fixture" },
    } as DisplayDetectionResult;
    isolateDisplay.mockResolvedValue(isolation);
    extractWithVisionEngine.mockResolvedValue(fullPipelineResult());

    const sourcePhoto = new File(["fixture-photo"], "edit-lines.jpg", { type: "image/jpeg" });
    const outcome = await runEditLinesVisionEnginePipeline(sourcePhoto, engineOptions);

    expect(outcome.isolation.status).toBe("known");
    expect(outcome.displayFrame).toBe("isolated");
    expect(outcome.lineup.pairings).toHaveLength(3);
    expect(outcome.lineup.pairings[0].left.name.value).toBe("C. MAKAR");
    expect(outcome.lineup.pairings[1].chemistryOrImpact.status).toBe("missing");

    expect(detectContentFrame).not.toHaveBeenCalled();
    expect(extractWithVisionEngine).toHaveBeenCalledWith(
      expect.objectContaining({
        image: isolation.image!.buffer,
        regions: expect.arrayContaining([
          expect.objectContaining({ region: expect.objectContaining({ id: "pairing-1" }) }),
          expect.objectContaining({ region: expect.objectContaining({ id: "pairing-2" }) }),
          expect.objectContaining({ region: expect.objectContaining({ id: "pairing-3" }) }),
        ]),
      }),
    );
  });

  it("falls back to content-bounds detection and resolves pairing regions against the detected region when isolation is ambiguous", async () => {
    isolateDisplay.mockResolvedValue(ambiguousIsolation);
    detectContentFrame.mockResolvedValue({
      status: "known",
      regions: [{ region: { id: "content", bounds: { x: 40, y: 20, width: 1000, height: 600 } }, confidence: { score: 0.9, certainty: "known", reasons: ["fixture"] } }],
    } as DetectionResult);
    extractWithVisionEngine.mockResolvedValue(fullPipelineResult());

    const sourcePhoto = new File(["fixture-photo"], "edit-lines.jpg", { type: "image/jpeg" });
    const outcome = await runEditLinesVisionEnginePipeline(sourcePhoto, engineOptions);

    expect(outcome.isolation.status).toBe("ambiguous");
    expect(outcome.displayFrame).toBe("content-bounds");
    expect(outcome.lineup.pairings).toHaveLength(3);
    expect(outcome.lineup.pairings[0].left.name.value).toBe("C. MAKAR");

    expect(detectContentFrame).toHaveBeenCalledWith(expect.any(Buffer), engineOptions.detector);
    const call = extractWithVisionEngine.mock.calls[0]![0] as { image: Buffer; regions: { region: { id: string; bounds: { x: number; y: number } } }[] };
    expect(call.image).toBeInstanceOf(Buffer);
    // Every pairing region is offset by the detected content region's own (x, y),
    // not assumed to start at the source photo's origin.
    for (const region of call.regions) {
      expect(region.region.bounds.x).toBe(40);
      expect(region.region.bounds.y).toBeGreaterThanOrEqual(20);
    }
  });

  it("returns an explicit not-found status, with the typed lineup contract still intact, when no usable frame is detected at all", async () => {
    isolateDisplay.mockResolvedValue(missingIsolation);
    detectContentFrame.mockResolvedValue({ status: "missing", regions: [] } as DetectionResult);

    const sourcePhoto = new File(["fixture-photo"], "edit-lines.jpg", { type: "image/jpeg" });
    const outcome = await runEditLinesVisionEnginePipeline(sourcePhoto, engineOptions);

    expect(outcome.isolation.status).toBe("missing");
    expect(outcome.displayFrame).toBe("not-found");
    expect(outcome.result).toBeUndefined();
    expect(outcome.lineup.pairings).toHaveLength(3);
    expect(outcome.lineup.pairings[0].left.name.status).toBe("missing");
    expect(outcome.lineup.pairings[2].chemistryOrImpact.status).toBe("missing");
    expect(extractWithVisionEngine).not.toHaveBeenCalled();
  });

  it("maps one submitted photo through Vision Engine into typed lineup data", async () => {
    isolateDisplay.mockResolvedValue(missingIsolation);
    detectContentFrame.mockResolvedValue({
      status: "known",
      regions: [{ region: { id: "content", bounds: { x: 0, y: 0, width: 1000, height: 600 } }, confidence: { score: 0.9, certainty: "known", reasons: ["fixture"] } }],
    } as DetectionResult);
    extractWithVisionEngine.mockResolvedValue(fullPipelineResult());
    const sourcePhoto = new File(["fixture-photo"], "edit-lines.jpg", { type: "image/jpeg" });

    const lineup = await processEditLinesPhotoWithVisionEngine(
      { sourcePhoto, workflow: "edit-lines-defense-even-strength" },
      engineOptions,
    );

    expect(lineup.pairings).toHaveLength(3);
    expect(lineup.pairings[0].left.name.value).toBe("C. MAKAR");
    expect(lineup.pairings[1].chemistryOrImpact.status).toBe("missing");
    expect(extractWithVisionEngine).toHaveBeenCalledWith(expect.objectContaining({ image: expect.any(Buffer) }));
  });
});
