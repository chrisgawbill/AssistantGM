import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DisplayDetectionResult, NormalizedImage, PipelineResult } from "@chrisgawbill/vision-engine";
import { extractWithVisionEngine, isolateDisplay } from "./vision-engine";

const extractScreenshot = vi.hoisted(() => vi.fn());
const normalizeImage = vi.hoisted(() => vi.fn());
const detectDisplay = vi.hoisted(() => vi.fn());
const DisplayIsolationDetector = vi.hoisted(() =>
  vi.fn().mockImplementation(function DisplayIsolationDetectorMock(this: { detectDisplay: typeof detectDisplay }) {
    this.detectDisplay = detectDisplay;
  }),
);

vi.mock("@chrisgawbill/vision-engine", () => ({ extractScreenshot, normalizeImage, DisplayIsolationDetector }));

describe("vision-engine boundary", () => {
  beforeEach(() => {
    extractScreenshot.mockReset();
    normalizeImage.mockReset();
    detectDisplay.mockReset();
    DisplayIsolationDetector.mockClear();
  });

  it("delegates extraction to the public package API and preserves the result", async () => {
    const request = {
      image: Buffer.from("fixture"),
      provider: { name: "fixture", recognize: vi.fn() },
      regions: [],
    };
    const result = {
      fields: {},
      data: {},
      records: [],
      regions: {},
      valid: true,
      diagnostics: { recognitionImage: { origin: "source", width: 1, height: 1 } },
    } as PipelineResult;
    extractScreenshot.mockResolvedValue(result);

    await expect(extractWithVisionEngine(request)).resolves.toBe(result);
    expect(extractScreenshot).toHaveBeenCalledWith(request);
  });

  it("normalizes the image and delegates display isolation to the public package API", async () => {
    const image = Buffer.from("source-photo");
    const normalized = { buffer: image, metadata: {} } as NormalizedImage;
    const detection = { status: "known" } as DisplayDetectionResult;
    normalizeImage.mockResolvedValue(normalized);
    detectDisplay.mockResolvedValue(detection);

    await expect(isolateDisplay(image)).resolves.toBe(detection);

    expect(normalizeImage).toHaveBeenCalledWith(image);
    expect(DisplayIsolationDetector).toHaveBeenCalledWith(undefined);
    expect(detectDisplay).toHaveBeenCalledWith(normalized);
  });
});
