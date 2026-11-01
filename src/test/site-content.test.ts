import { describe, expect, it } from "vitest";
import { defaultContent, mergeContent, textToPairs } from "@/lib/site-content";

describe("site content", () => {
  it("falls back to defaults for empty saved content", () => {
    expect(mergeContent({}).heroTitle).toBe(defaultContent.heroTitle);
  });
  it("uses admin-saved text and font", () => {
    const c = mergeContent({ heroTitle: "New title", font: "sora" });
    expect(c.heroTitle).toBe("New title");
    expect(c.font).toBe("sora");
  });
  it("ignores unknown fonts", () => {
    expect(mergeContent({ font: "comic" }).font).toBe("jakarta");
  });
  it("parses title | text lines", () => {
    expect(textToPairs("A | one\n\nB|two")).toEqual([
      { title: "A", text: "one" },
      { title: "B", text: "two" },
    ]);
  });
});
