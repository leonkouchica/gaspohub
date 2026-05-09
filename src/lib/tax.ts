import { supabase } from "@/integrations/supabase/client";

export interface TaxRate {
  id: string;
  country_code: string;
  region_code: string | null;
  label: string;
  rate_percent: number;
  is_active: boolean;
}

export async function getActiveTaxRates(): Promise<TaxRate[]> {
  const { data } = await supabase
    .from("tax_rates" as any)
    .select("*")
    .eq("is_active", true);
  return (data as any) || [];
}

export async function findTaxRate(country: string, region?: string | null): Promise<TaxRate | null> {
  const rates = await getActiveTaxRates();
  return (
    rates.find(
      (r) =>
        r.country_code.toUpperCase() === country.toUpperCase() &&
        (region ? r.region_code?.toUpperCase() === region.toUpperCase() : !r.region_code)
    ) ||
    rates.find((r) => r.country_code.toUpperCase() === country.toUpperCase() && !r.region_code) ||
    null
  );
}

export function calcTax(subtotal: number, ratePercent: number) {
  const tax = +(subtotal * (ratePercent / 100)).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);
  return { tax, total };
}