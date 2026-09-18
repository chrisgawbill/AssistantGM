import { NextResponse } from "next/server";
import { EDIT_LINES_WORKFLOW, type EditLinesPhotoRequest } from "../../../application/process-edit-lines-photo";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData();
  const photo = form.get("photo");
  const workflow = form.get("workflow");
  if (!(photo instanceof File) || workflow !== EDIT_LINES_WORKFLOW) {
    return NextResponse.json({ error: "Invalid Edit Lines photo request" }, { status: 400 });
  }

  const [{ ContentBoundsDetector, TesseractOcrProvider }, { processEditLinesPhotoWithVisionEngine }] = await Promise.all([
    import("@chrisgawbill/vision-engine"),
    import("../../../application/vision-engine-edit-lines-photo"),
  ]);
  const result = await processEditLinesPhotoWithVisionEngine(
    { sourcePhoto: photo, workflow } satisfies EditLinesPhotoRequest,
    { provider: new TesseractOcrProvider(), detector: new ContentBoundsDetector() },
  );
  return NextResponse.json(result);
}
