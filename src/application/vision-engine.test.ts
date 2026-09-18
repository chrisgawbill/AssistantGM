import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PipelineResult } from "@chrisgawbill/vision-engine";
import { extractWithVisionEngine } from "./vision-engine";

const extractScreenshot = vi.hoisted(() => vi.fn());

vi.mock("@chrisgawbill/vision-engine", () => ({ extractScreenshot }));

describe("vision-engine boundary", () => {
  beforeEach(() => extractScreenshot.mockReset());

  it("delegates to the public package API and preserves the result", async () => {
    const request = {
      image: Buffer.from("fixture"),
      provider: { name: "fixture", recognize: vi.fn() },
      regions: [],
    };
    const result = { fields: {}, data: {}, records: [], regions: {}, valid: true } as PipelineResult;
    extractScreenshot.mockResolvedValue(result);

    await expect(extractWithVisionEngine(request)).resolves.toBe(result);
    expect(extractScreenshot).toHaveBeenCalledWith(request);
  });
});
