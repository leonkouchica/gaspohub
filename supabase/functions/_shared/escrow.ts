// Pure helpers extracted from process-booking-payment for unit testing.
// Keep in sync with the constants in process-booking-payment/index.ts.

export const INITIAL_RELEASE_PERCENTAGE = 0.60;
export const HELD_PERCENTAGE = 0.40;
export const DEFAULT_COMMISSION_RATE_PCT = 10; // 10%

export interface EscrowBreakdown {
  totalAmount: number;
  commissionRate: number; // percent
  commissionAmount: number;
  initialRelease: number;
  heldAmount: number;
  finalRelease: number;
}

export function computeEscrow(totalAmount: number, commissionRatePct?: number | null): EscrowBreakdown {
  const commissionRate = commissionRatePct ?? DEFAULT_COMMISSION_RATE_PCT;
  const commissionAmount = totalAmount * (commissionRate / 100);
  const initialRelease = totalAmount * INITIAL_RELEASE_PERCENTAGE;
  const heldAmount = totalAmount * HELD_PERCENTAGE;
  const finalRelease = heldAmount - commissionAmount;
  return { totalAmount, commissionRate, commissionAmount, initialRelease, heldAmount, finalRelease };
}

export function fnUrl(name: string): string {
  const base = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  if (!base) throw new Error("Missing VITE_SUPABASE_URL / SUPABASE_URL env var");
  return `${base}/functions/v1/${name}`;
}

export function anonKey(): string {
  const key = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  if (!key) throw new Error("Missing VITE_SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY env var");
  return key;
}