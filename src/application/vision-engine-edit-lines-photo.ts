import { extractWithVisionEngine, type VisionEngineRequest, type VisionEngineResult } from "./vision-engine";
import type { EditLinesPhotoRequest } from "./process-edit-lines-photo";
import { mapEditLinesDefenseEvenStrength } from "../game-config/edit-lines-defense-even-strength";
import type { EditLinesDefenseEvenStrength } from "../domain/player";

export function processEditLinesPhotoWithVisionEngine(
  request: EditLinesPhotoRequest,
  engineRequest: Omit<VisionEngineRequest, "image">,
): Promise<EditLinesDefenseEvenStrength> {
  return request.sourcePhoto.arrayBuffer().then((bytes) =>
    extractWithVisionEngine({ ...engineRequest, image: Buffer.from(bytes) }).then((result: VisionEngineResult) =>
      mapEditLinesDefenseEvenStrength(result),
    ),
  );
}
