import { createServerFn } from "@tanstack/react-start";

export type FxRate = { rate: number; source: string; fetchedAt: string };

async function fromCoinbase(): Promise<number> {
  const r = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD");
  if (!r.ok) throw new Error(`Coinbase ${r.status}`);
  const j = (await r.json()) as { data?: { rates?: Record<string, string> } };
  const v = Number(j.data?.rates?.["PKR"]);
  if (!Number.isFinite(v) || v <= 0) throw new Error("No PKR rate");
  return v;
}
async function fromOpenEr(): Promise<number> {
  const r = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!r.ok) throw new Error(`open.er-api ${r.status}`);
  const j = (await r.json()) as { rates?: Record<string, number> };
  const v = Number(j.rates?.["PKR"]);
  if (!Number.isFinite(v) || v <= 0) throw new Error("No PKR rate");
  return v;
}

export const getUsdPkrRate = createServerFn({ method: "GET" }).handler(async (): Promise<FxRate> => {
  try {
    return { rate: await fromCoinbase(), source: "live", fetchedAt: new Date().toISOString() };
  } catch {
    return { rate: await fromOpenEr(), source: "daily", fetchedAt: new Date().toISOString() };
  }
});
