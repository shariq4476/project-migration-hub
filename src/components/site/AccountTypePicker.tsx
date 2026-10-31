import { ShoppingBag, Store } from "lucide-react";
import type { AccountType } from "@/hooks/use-account-type";

const options = [
  { value: "buyer", label: "I want to buy", hint: "Browse, make offers, bid and buy websites.", icon: ShoppingBag },
  { value: "seller", label: "I want to sell", hint: "List your websites for sale.", icon: Store },
] as const;

export function AccountTypePicker({
  value,
  onChange,
}: {
  value: AccountType;
  onChange: (v: AccountType) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-heading">Account type</legend>
      <div className="grid grid-cols-2 gap-3">
        {options.map((o) => {
          const active = value === o.value;
          return (
            <label
              key={o.value}
              className={`cursor-pointer rounded-lg border p-3 text-sm transition-colors ${
                active ? "border-primary bg-success-soft" : "bg-card hover:border-muted-foreground"
              }`}
            >
              <input
                type="radio"
                name="account_type"
                value={o.value}
                checked={active}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <o.icon className={`mb-2 h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
              <span className="block font-semibold text-heading">{o.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{o.hint}</span>
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">You can switch any time in your account settings.</p>
    </fieldset>
  );
}
