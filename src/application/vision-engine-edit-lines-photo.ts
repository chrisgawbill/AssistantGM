import {
  detectContentFrame,
  extractWithVisionEngine,
  isolateDisplay,
  type DisplayIsolationResult,
  type VisionEngineRequest,
  type VisionEngineResult,
} from "./vision-engine";
import type { EditLinesPhotoRequest } from "./process-edit-lines-photo";
import {
  editLinesDefenseEvenStrengthRegions,
  mapEditLinesDefenseEvenStrength,
} from "../game-config/edit-lines-defense-even-strength";
import type { EditLinesDefenseEvenStrength } from "../domain/player";

export type EditLinesVisionEngineOptions = Omit<VisionEngineRequest, "image" | "regions">;

/**
 * Which engine-detected frame (if any) pairing regions were resolved
 * against: Vision Engine's perspective-normalized display, a plain
 * content-bounds region detected on the untouched source photo, or no
 * usable frame at all.
 */
export type EditLinesDisplayFrame = "isolated" | "content-bounds" | "not-found";

export type EditLinesPipelineOutcome = {
  /** The display isolation / perspective normalization outcome for the source photo (VE-20). */
  isolation: DisplayIsolationResult;
  /** Which detected frame, if any, pairing regions were actually resolved against. */
  displayFrame: EditLinesDisplayFrame;
  /**
   * The Vision Engine pipeline result the lineup was mapped from. Absent
   * only when `displayFrame` is "not-found": recognition is deliberately
   * never run against an unresolved frame.
   */
  result?: VisionEngineResult;
  lineup: EditLinesDefenseEvenStrength;
};

/**
 * Runs one submitted Edit Lines photo through Vision Engine: the untouched
 * source photo is first passed through display isolation / perspective
 * normalization. When that succeeds, geometry-aware pairing regions are
 * resolved against the normalized display and extracted directly.
 *
 * When isolation fails or is ambiguous, pairing-region assumptions are never
 * applied to an unresolved display. Instead, the caller-supplied fallback
 * detector's plain content-bounds detection runs against the untouched
 * source photo, and pairing regions are resolved against *that* detected
 * frame instead. If even that finds nothing usable, the outcome says so
 * explicitly via `displayFrame: "not-found"` rather than silently returning
 * an unexplained set of missing fields.
 */
export async function runEditLinesVisionEnginePipeline(
  sourcePhoto: File,
  engineOptions: EditLinesVisionEngineOptions,
): Promise<EditLinesPipelineOutcome> {
  const bytes = await sourcePhoto.arrayBuffer();
  const image = Buffer.from(bytes);

  const isolation = await isolateDisplay(image);

  if (isolation.status === "known" && isolation.geometry && isolation.image) {
    const regions = editLinesDefenseEvenStrengthRegions(isolation.geometry.display);
    const result = await extractWithVisionEngine({
      ...engineOptions,
      image: isolation.image.buffer,
      regions,
    });
    return { isolation, displayFrame: "isolated", result, lineup: mapEditLinesDefenseEvenStrength(result) };
  }

  const contentFrame = engineOptions.detector ? await detectPrimaryFrame(image, engineOptions.detector) : undefined;

  if (contentFrame) {
    const regions = editLinesDefenseEvenStrengthRegions(contentFrame);
    const result = await extractWithVisionEngine({ ...engineOptions, image, regions });
    return { isolation, displayFrame: "content-bounds", result, lineup: mapEditLinesDefenseEvenStrength(result) };
  }

  return {
    isolation,
    displayFrame: "not-found",
    lineup: mapEditLinesDefenseEvenStrength({ regions: {} }),
  };
}

/** Detectors may omit `status`; infer it from the reported regions rather than inventing one. */
async function detectPrimaryFrame(
  image: Buffer,
  detector: NonNullable<EditLinesVisionEngineOptions["detector"]>,
): Promise<{ x: number; y: number; width: number; height: number } | undefined> {
  const detection = await detectContentFrame(image, detector);
  const status = detection.status ?? (detection.regions.length > 0 ? "known" : "missing");
  if (status !== "known") return undefined;
  return detection.regions[0]?.region.bounds;
}

export function processEditLinesPhotoWithVisionEngine(
  request: EditLinesPhotoRequest,
  engineOptions: EditLinesVisionEngineOptions,
): Promise<EditLinesDefenseEvenStrength> {
  return runEditLinesVisionEnginePipeline(request.sourcePhoto, engineOptions).then(
    ({ lineup }) => lineup,
  );
}
