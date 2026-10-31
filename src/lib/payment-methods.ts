export const paymentMethods = [
  { id: "jazzcash", label: "JazzCash", setting: "jazzcash_account", local: true },
  { id: "easypaisa", label: "Easypaisa", setting: "easypaisa_account", local: true },
  { id: "raast", label: "Raast", setting: "raast_id", local: true },
  { id: "bank_transfer", label: "Local bank transfer", setting: "bank_transfer_details", local: true },
  { id: "binance_pay", label: "Binance Pay", setting: "binance_pay_id", local: false },
  { id: "usdt_trc20", label: "USDT · TRC20", setting: "usdt_trc20_address", local: false },
  { id: "usdt_bep20", label: "USDT · BEP20", setting: "usdt_bep20_address", local: false },
] as const;
export type PaymentMethodId = (typeof paymentMethods)[number]["id"];
export const paymentMethodIds = paymentMethods.map((m) => m.id) as [PaymentMethodId, ...PaymentMethodId[]];
export const paymentMethodLabel = (id: string) => paymentMethods.find((m) => m.id === id)?.label ?? id;
