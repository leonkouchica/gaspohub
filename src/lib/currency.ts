import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate_to_usd: number;
  is_active: boolean;
}

const STORAGE_KEY = "gaspohub.currency";
let cache: CurrencyRate[] | null = null;
const listeners = new Set<() => void>();

export async function loadRates(force = false): Promise<CurrencyRate[]> {
  if (cache && !force) return cache;
  const { data } = await supabase.from("currency_rates").select("*").eq("is_active", true);
  cache = (data as CurrencyRate[]) ?? [];
  listeners.forEach((cb) => cb());
  return cache;
}

export function getSelectedCurrency(): string {
  return (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) || "USD";
}

export function setSelectedCurrency(code: string) {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, code);
  listeners.forEach((cb) => cb());
}

export function convertFromUSD(amountUsd: number, code: string): number {
  const rate = cache?.find((r) => r.code === code)?.rate_to_usd ?? 1;
  return amountUsd * rate;
}

export function formatPrice(amountUsd: number, code?: string) {
  const target = code || getSelectedCurrency();
  const rate = cache?.find((r) => r.code === target);
  const symbol = rate?.symbol ?? "$";
  const value = amountUsd * (rate?.rate_to_usd ?? 1);
  return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function useCurrency() {
  const [rates, setRates] = useState<CurrencyRate[]>(cache ?? []);
  const [selected, setSel] = useState<string>(getSelectedCurrency());
  useEffect(() => {
    let mounted = true;
    loadRates().then((r) => mounted && setRates(r));
    const cb = () => {
      if (!mounted) return;
      setRates(cache ?? []);
      setSel(getSelectedCurrency());
    };
    listeners.add(cb);
    return () => {
      mounted = false;
      listeners.delete(cb);
    };
  }, []);
  return {
    rates,
    selected,
    setSelected: setSelectedCurrency,
    format: (usd: number, code?: string) => formatPrice(usd, code ?? selected),
    convert: (usd: number, code?: string) => convertFromUSD(usd, code ?? selected),
  };
}