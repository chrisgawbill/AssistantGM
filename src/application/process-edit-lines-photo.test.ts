import { describe, expect, it, vi } from "vitest";
import { EDIT_LINES_WORKFLOW, processEditLinesPhoto } from "./process-edit-lines-photo";

describe("processEditLinesPhoto", () => {
  it("submits the untouched source photo with the explicit workflow", async () => {
    const photo = new File(["photo"], "edit-lines.jpg", { type: "image/jpeg" });
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await processEditLinesPhoto({ sourcePhoto: photo, workflow: EDIT_LINES_WORKFLOW });

    expect(fetchMock).toHaveBeenCalledWith("/api/edit-lines-photo", expect.objectContaining({ method: "POST" }));
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("photo")).toBe(photo);
    expect(body.get("workflow")).toBe(EDIT_LINES_WORKFLOW);
    vi.unstubAllGlobals();
  });
});
