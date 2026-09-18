import { describe, expect, it } from "vitest";
import { MAX_PHOTO_BYTES, validatePhoto } from "./photo-capture";

describe("photo validation", () => {
  it("accepts supported image types within the size limit", () => {
    expect(validatePhoto(new File([new Uint8Array(1)], "photo.webp", { type: "image/webp" }))).toBeUndefined();
  });

  it("rejects unsupported and oversized files", () => {
    expect(validatePhoto(new File(["text"], "notes.txt", { type: "text/plain" }))).toContain("JPEG");
    expect(validatePhoto(new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], "large.jpg", { type: "image/jpeg" }))).toContain("20 MB");
  });
});
