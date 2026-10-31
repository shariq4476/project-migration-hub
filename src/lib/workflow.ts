export const dealStages = [
  "agreement",
  "payment_submitted",
  "payment_verified",
  "transferring",
  "delivered",
  "completed",
  "disputed",
  "refunded",
  "cancelled",
] as const;
export type DealStage = (typeof dealStages)[number];
export type DealAction =
  | "submit_payment"
  | "verify_payment"
  | "reject_payment"
  | "start_transfer"
  | "mark_delivered"
  | "approve"
  | "dispute"
  | "resolve_complete"
  | "resolve_refund"
  | "cancel"
  | "mark_paid";
export const stageLabels: Record<DealStage, string> = {
  agreement: "Awaiting payment",
  payment_submitted: "Payment under review",
  payment_verified: "Payment verified",
  transferring: "Transfer in progress",
  delivered: "Awaiting buyer approval",
  completed: "Completed",
  disputed: "Disputed",
  refunded: "Refunded",
  cancelled: "Cancelled",
};
export function permittedActions(
  stage: DealStage,
  role: "buyer" | "seller" | "admin",
  paid = false,
): DealAction[] {
  if (role === "admin") {
    if (stage === "payment_submitted") return ["verify_payment", "reject_payment"];
    if (stage === "disputed") return ["resolve_complete", "resolve_refund"];
    if (stage === "completed" && !paid) return ["mark_paid"];
    if (stage === "agreement") return ["cancel"];
    return [];
  }
  if (stage === "agreement") return role === "buyer" ? ["submit_payment", "cancel"] : ["cancel"];
  if (stage === "payment_verified")
    return role === "seller" ? ["start_transfer", "mark_delivered", "dispute"] : ["dispute"];
  if (stage === "transferring")
    return role === "seller" ? ["mark_delivered", "dispute"] : ["dispute"];
  if (stage === "delivered") return role === "buyer" ? ["approve", "dispute"] : ["dispute"];
  return [];
}
export function safeReturnPath(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\r\n]/.test(value) &&
    !value.startsWith("/auth")
    ? value
    : "/dashboard";
}
