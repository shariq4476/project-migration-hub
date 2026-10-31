import { describe, expect, it } from "vitest";
import { formatPkr } from "@/hooks/use-pkr-rate";

describe("rupee prices", () => {
  it("formats rupees rounded to whole numbers", () => {
    expect(formatPkr(36500 * 276.5)).toBe("Rs 10,092,250");
  });
});
