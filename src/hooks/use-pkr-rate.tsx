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

/** Live USD→PKR rate. Used only where a buyer must send a rupee amount (JazzCash / Easypaisa / bank). */
export function usePkrRate() {
  return useQuery(pkrRateQuery).data?.rate;
}
