import {
  DisplayIsolationDetector,
  extractScreenshot,
  normalizeImage,
  type DetectionProvider,
  type DetectionResult,
  type DisplayDetectionResult,
  type DisplayIsolationOptions,
  type PipelineRequest,
  type PipelineResult,
} from "@chrisgawbill/vision-engine";

export type VisionEngineRequest = PipelineRequest;
export type VisionEngineResult = PipelineResult;
export type DisplayIsolationResult = DisplayDetectionResult;
export type ContentFrameDetectionResult = DetectionResult;

export function extractWithVisionEngine(
  request: VisionEngineRequest,
): Promise<VisionEngineResult> {
  return extractScreenshot(request);
}

/**
 * Runs Vision Engine's display isolation / perspective normalization
 * (VE-20) against an untouched source photo. Returns the full detection
 * result (status, confidence, geometry, and the warped display image when
 * successful) so callers can decide how to proceed when isolation is
 * ambiguous or missing rather than having that decision made for them.
 */
export async function isolateDisplay(
  image: Buffer,
  options?: DisplayIsolationOptions,
): Promise<DisplayIsolationResult> {
  const normalized = await normalizeImage(image);
  return new DisplayIsolationDetector(options).detectDisplay(normalized);
}

/**
 * Runs a detection provider's plain content-bounds detection (e.g.
 * `ContentBoundsDetector`) against an untouched source photo. Used as the
 * fallback frame source when display isolation itself is missing or
 * ambiguous, so pairing regions are still resolved against engine-detected
 * bounds rather than an assumed full-image frame.
 */
export async function detectContentFrame(
  image: Buffer,
  detector: DetectionProvider,
): Promise<ContentFrameDetectionResult> {
  const normalized = await normalizeImage(image);
  return detector.detect(normalized);
}
