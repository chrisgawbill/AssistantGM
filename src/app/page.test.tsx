import { describe, expect, it } from "vitest";
import Home from "./page";

describe("landing route", () => {
  it("renders the AssistantGM heading", () => {
    const page = Home();

    expect(page.props.children[0].props.children).toBe("AssistantGM");
  });
});
