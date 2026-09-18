import type { VisionEngineResult } from "./vision-engine";

export const EDIT_LINES_WORKFLOW = "edit-lines-defense-even-strength" as const;

export type EditLinesPhotoRequest = {
  sourcePhoto: File;
  workflow: typeof EDIT_LINES_WORKFLOW;
};

export type EditLinesPhotoProcessor = (request: EditLinesPhotoRequest) => Promise<VisionEngineResult>;

export async function processEditLinesPhoto(
  request: EditLinesPhotoRequest,
): Promise<VisionEngineResult> {
  const form = new FormData();
  form.set("photo", request.sourcePhoto);
  form.set("workflow", request.workflow);
  const response = await fetch("/api/edit-lines-photo", { method: "POST", body: form });
  if (!response.ok) throw new Error("Edit Lines photo processing failed");
  return response.json() as Promise<VisionEngineResult>;
}
