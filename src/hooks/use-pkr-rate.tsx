import { queryOptions, useQuery } from "@tanstack/react-query";
import { getUsdPkrRate } from "@/lib/fx.functions";

export const pkrRateQuery = queryOptions({
  queryKey: ["fx", "usd-pkr"],
  queryFn: () => getUsdPkrRate(),
  staleTime: 60_000,
  refetchInterval: 60_000,
});

export const formatPkr = (amount: number) =>
  `Rs ${Math.round(amount).toLocaleString("en-PK")}`;

export function usePkrRate() {
  return useQuery(pkrRateQuery).data?.rate;
}

/** Shows the live rupee equivalent of a dollar amount, or nothing while the rate loads. */
export function Pkr({ usd, className }: { usd: number; className?: string }) {
  const rate = usePkrRate();
  if (!rate) return null;
  return <span className={className ?? "text-xs text-muted-foreground"}>≈ {formatPkr(usd * rate)}</span>;
}
