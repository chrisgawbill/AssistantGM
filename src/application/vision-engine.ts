import {
  extractScreenshot,
  type PipelineRequest,
  type PipelineResult,
} from "@chrisgawbill/vision-engine";

export type VisionEngineRequest = PipelineRequest;
export type VisionEngineResult = PipelineResult;

export function extractWithVisionEngine(
  request: VisionEngineRequest,
): Promise<VisionEngineResult> {
  return extractScreenshot(request);
}
