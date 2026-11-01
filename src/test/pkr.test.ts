import { describe, expect, it } from "vitest";
import { formatPkr } from "@/hooks/use-pkr-rate";
import { formatMoney, setActiveCurrency } from "@/lib/currency";
import { usd, usdExact } from "@/lib/listings";

describe("rupee prices", () => {
  it("formats rupees rounded to whole numbers", () => {
    expect(formatPkr(36500 * 276.5)).toBe("Rs 10,092,250");
  });
  it("defaults to US dollars", () => {
    setActiveCurrency({ code: "USD", rate: 1 });
    expect(usd(1000)).toBe("$1,000");
  });
  it("converts prices with the live rate of the chosen currency", () => {
    expect(formatMoney(100, { code: "PKR", rate: 280 })).toContain("28,000");
  });
  it("keeps payment amounts in exact dollars whatever the currency", () => {
    setActiveCurrency({ code: "EUR", rate: 0.9 });
    expect(usdExact(1000)).toBe("$1,000");
    setActiveCurrency({ code: "USD", rate: 1 });
  });
});
