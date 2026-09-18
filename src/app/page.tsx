import React from "react";
import { PhotoCapture } from "../components/photo-capture";

export default function Home() {
  return (
    <main>
      <h1>AssistantGM</h1>
      <p>Your NHL franchise-management assistant.</p>
      <PhotoCapture />
    </main>
  );
}
