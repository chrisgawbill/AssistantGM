"use client";

import { useEffect, useState } from "react";
import {
  EDIT_LINES_WORKFLOW,
  processEditLinesPhoto,
  type EditLinesPhotoProcessor,
} from "../application/process-edit-lines-photo";

export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validatePhoto(file: File): string | undefined {
  if (!PHOTO_TYPES.has(file.type)) return "Choose a JPEG, PNG, or WebP photo.";
  if (file.size > MAX_PHOTO_BYTES) return "Choose a photo smaller than 20 MB.";
}

type PhotoCaptureProps = { processPhoto?: EditLinesPhotoProcessor };
type CaptureState = "idle" | "selected" | "processing" | "failure";

export function PhotoCapture({ processPhoto = processEditLinesPhoto }: PhotoCaptureProps) {
  const [photo, setPhoto] = useState<File>();
  const [preview, setPreview] = useState<string>();
  const [error, setError] = useState<string>();
  const [state, setState] = useState<CaptureState>("idle");

  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);

  function choosePhoto(file?: File) {
    if (!file) return;
    const validationError = validatePhoto(file);
    if (validationError) {
      setPhoto(undefined);
      setPreview(undefined);
      setError(validationError);
      setState("failure");
      return;
    }
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setError(undefined);
    setState("selected");
  }

  function clearPhoto() {
    setPhoto(undefined);
    setPreview(undefined);
    setError(undefined);
    setState("idle");
  }

  async function submit() {
    if (!photo) return;
    setState("processing");
    setError(undefined);
    try {
      await processPhoto({ sourcePhoto: photo, workflow: EDIT_LINES_WORKFLOW });
      setState("selected");
    } catch {
      setError("We could not process that photo. Try again or choose another photo.");
      setState("failure");
    }
  }

  return (
    <section aria-labelledby="photo-capture-title">
      <h2 id="photo-capture-title">Edit Lines photo</h2>
      <p>Defense / Even Strength is the selected workflow.</p>
      <label htmlFor="edit-lines-photo">Take a photo or choose one</label>
      <input
        id="edit-lines-photo"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={(event) => choosePhoto(event.target.files?.[0])}
      />
      {state === "idle" && <p>Use your phone camera where supported, or select a photo from your device.</p>}
      {preview && <img src={preview} alt="Selected Edit Lines photo preview" />}
      {photo && state !== "processing" && (
        <button type="button" onClick={clearPhoto}>
          Replace photo
        </button>
      )}
      {photo && state === "selected" && (
        <button type="button" onClick={submit}>
          Process photo
        </button>
      )}
      {state === "processing" && <p role="status">Processing photo…</p>}
      {error && (
        <p role="alert">
          {error} {photo && <button type="button" onClick={submit}>Retry</button>}
        </p>
      )}
    </section>
  );
}
