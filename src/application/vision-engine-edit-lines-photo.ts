import { extractWithVisionEngine, type VisionEngineRequest, type VisionEngineResult } from "./vision-engine";
import type { EditLinesPhotoRequest } from "./process-edit-lines-photo";

export function processEditLinesPhotoWithVisionEngine(
  request: EditLinesPhotoRequest,
  engineRequest: Omit<VisionEngineRequest, "image">,
): Promise<VisionEngineResult> {
  return request.sourcePhoto.arrayBuffer().then((bytes) =>
    extractWithVisionEngine({ ...engineRequest, image: Buffer.from(bytes) }),
  );
}
