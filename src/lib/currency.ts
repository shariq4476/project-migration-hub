export const currencies = [
  { code: "USD", label: "US Dollar" },
  { code: "PKR", label: "Pakistani Rupee" },
  { code: "INR", label: "Indian Rupee" },
  { code: "BDT", label: "Bangladeshi Taka" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
] as const;
export type CurrencyCode = (typeof currencies)[number]["code"];
export type Active = { code: string; rate: number };

const USD: Active = { code: "USD", rate: 1 };
let active: Active = USD;

/** The currency prices are currently shown in. Server rendering always uses USD. */
export const activeCurrency = () => active;
export const setActiveCurrency = (next: Active) => {
  active = next.rate > 0 ? next : USD;
};

export function formatMoney(usdAmount: number, cur: Active = USD) {
  const value = usdAmount * cur.rate;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: cur.code,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${cur.code} ${Math.round(value).toLocaleString("en-US")}`;
  }
}
