import { describe, expect, it } from "vitest";
import { paymentMethodIds, paymentMethodLabel } from "@/lib/payment-methods";

describe("payment methods", () => {
  it("accepts JazzCash, Easypaisa, Raast and local bank transfer", () => {
    expect(paymentMethodIds).toEqual(
      expect.arrayContaining(["jazzcash", "easypaisa", "raast", "bank_transfer"]),
    );
  });
  it("still accepts Binance Pay and USDT", () => {
    expect(paymentMethodIds).toEqual(
      expect.arrayContaining(["binance_pay", "usdt_trc20", "usdt_bep20"]),
    );
  });
  it("labels local methods for display", () => {
    expect(paymentMethodLabel("easypaisa")).toBe("Easypaisa");
    expect(paymentMethodLabel("bank_transfer")).toBe("Local bank transfer");
  });
});
