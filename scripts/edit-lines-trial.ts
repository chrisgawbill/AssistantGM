// Dev-only trial script. Runs a local Edit Lines photo through the same
// application path used by the /api/edit-lines-photo route
// (processEditLinesPhoto -> processEditLinesPhotoWithVisionEngine) and prints
// the display-isolation outcome plus the resulting typed lineup.
//
// It reads the image path given on the command line, keeps it entirely in
// memory, and never writes it (or a copy of it) anywhere in the repo.
//
// Usage:
//   pnpm tsx scripts/edit-lines-trial.ts <path-to-photo>

import { readFile } from "node:fs/promises";
import { ContentBoundsDetector, TesseractOcrProvider } from "@chrisgawbill/vision-engine";
import { runEditLinesVisionEnginePipeline } from "../src/application/vision-engine-edit-lines-photo";
import type { PlayerField } from "../src/domain/player";

function fieldSummary(label: string, field: PlayerField<unknown>): string {
  const value = field.value === undefined ? "(none)" : String(field.value);
  return `    ${label}: value=${value} status=${field.status} confidence=${field.confidence.score.toFixed(2)}${
    field.reason ? ` reason="${field.reason}"` : ""
  }`;
}

async function main(): Promise<void> {
  const photoPath = process.argv[2];
  if (!photoPath) {
    console.error("Usage: pnpm tsx scripts/edit-lines-trial.ts <path-to-photo>");
    process.exitCode = 1;
    return;
  }

  const bytes = await readFile(photoPath);
  const sourcePhoto = new File([bytes], "edit-lines-trial.jpg", { type: "image/jpeg" });

  const { isolation, displayFrame, lineup } = await runEditLinesVisionEnginePipeline(sourcePhoto, {
    provider: new TesseractOcrProvider(),
    detector: new ContentBoundsDetector(),
  });

  console.log("Display isolation outcome");
  console.log(`  status: ${isolation.status}`);
  console.log(
    `  confidence: score=${isolation.confidence.score.toFixed(2)} certainty=${isolation.confidence.certainty}`,
  );
  console.log(`  reasons: ${isolation.confidence.reasons.join("; ")}`);
  if (isolation.geometry) {
    const { display, source } = isolation.geometry;
    console.log(`  normalized display: ${display.width}x${display.height}`);
    console.log(
      `  source quadrilateral: topLeft=(${source.topLeft.x},${source.topLeft.y}) topRight=(${source.topRight.x},${source.topRight.y}) bottomRight=(${source.bottomRight.x},${source.bottomRight.y}) bottomLeft=(${source.bottomLeft.x},${source.bottomLeft.y})`,
    );
  } else {
    console.log("  geometry: (none — isolation did not resolve a display)");
  }
  console.log(`  pairing regions resolved against: ${displayFrame}`);

  console.log("\nLineup");
  lineup.pairings.forEach((pairing, index) => {
    console.log(`  Pairing ${index + 1}`);
    console.log("    Left player:");
    console.log(fieldSummary("name", pairing.left.name));
    console.log(fieldSummary("displayedSide", pairing.left.displayedSide));
    console.log(fieldSummary("overall", pairing.left.overall));
    console.log("    Right player:");
    console.log(fieldSummary("name", pairing.right.name));
    console.log(fieldSummary("displayedSide", pairing.right.displayedSide));
    console.log(fieldSummary("overall", pairing.right.overall));
    console.log(fieldSummary("chemistryOrImpact", pairing.chemistryOrImpact));
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
