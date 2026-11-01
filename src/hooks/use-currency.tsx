import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { getUsdRates } from "@/lib/fx.functions";
import { currencies, setActiveCurrency, type CurrencyCode } from "@/lib/currency";

export const ratesQuery = queryOptions({
  queryKey: ["fx", "usd-all"],
  queryFn: () => getUsdRates(),
  staleTime: 60_000,
  refetchInterval: 60_000,
});

const STORAGE = "clicksspot-currency";
const Ctx = createContext<{ code: CurrencyCode; rate: number; setCode: (c: CurrencyCode) => void; updatedAt?: string | undefined }>({
  code: "USD",
  rate: 1,
  setCode: () => {},
});
export const useCurrency = () => useContext(Ctx);

/** Holds the visitor's currency; remounts children when currency or live rate changes so every price re-renders. */
export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [code, setCodeState] = useState<CurrencyCode>("USD");
  const { data } = useQuery({ ...ratesQuery, enabled: code !== "USD" });
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE);
    if (saved && currencies.some((c) => c.code === saved)) setCodeState(saved as CurrencyCode);
  }, []);
  const rate = code === "USD" ? 1 : (data?.rates[code] ?? 0);
  const ready = code === "USD" || rate > 0;
  setActiveCurrency(ready ? { code, rate } : { code: "USD", rate: 1 });
  const setCode = (c: CurrencyCode) => {
    localStorage.setItem(STORAGE, c);
    setCodeState(c);
  };
  return (
    <Ctx.Provider value={{ code, rate: ready ? rate : 1, setCode, updatedAt: data?.fetchedAt }}>
      <div key={ready ? `${code}-${rate}` : "USD"} className="contents">
        {children}
      </div>
    </Ctx.Provider>
  );
}
