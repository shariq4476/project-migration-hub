import { describe, expect, it } from "vitest";
import { permittedActions, safeReturnPath } from "@/lib/workflow";
describe("private deal permissions", () => {
  it("only an admin verifies submitted payments", () => {
    expect(permittedActions("payment_submitted", "buyer")).not.toContain("verify_payment");
    expect(permittedActions("payment_submitted", "seller")).not.toContain("verify_payment");
    expect(permittedActions("payment_submitted", "admin")).toContain("verify_payment");
  });
  it("only a buyer approves a delivered transfer", () => {
    expect(permittedActions("delivered", "buyer")).toContain("approve");
    expect(permittedActions("delivered", "seller")).not.toContain("approve");
  });
  it("payouts require completion and cannot be paid twice", () => {
    expect(permittedActions("agreement", "admin")).not.toContain("mark_paid");
    expect(permittedActions("completed", "admin")).toContain("mark_paid");
    expect(permittedActions("completed", "admin", true)).not.toContain("mark_paid");
  });
  it("blocks off-site sign-in redirects", () => {
    expect(safeReturnPath("//evil.example")).toBe("/dashboard");
    expect(safeReturnPath("/\\evil.example")).toBe("/dashboard");
    expect(safeReturnPath("/sell")).toBe("/sell");
  });
});
