import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type FeatureFlagKey =
  | "saved_searches"
  | "quote_requests"
  | "map_discovery"
  | "booking_modes"
  | "verification_badges"
  | "photographer_metrics"
  | "automated_reminders"
  | "multi_currency"
  | "flexible_deposits"
  | "mobile_money_payouts"
  | "bulk_payouts"
  | "portfolio_moderation"
  | "voice_notes"
  | "gallery_proofing"
  | "microsites";

let cache: Record<string, boolean> | null = null;
let inflight: Promise<Record<string, boolean>> | null = null;
const listeners = new Set<(flags: Record<string, boolean>) => void>();

export async function loadFeatureFlags(force = false) {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase.from("feature_flags").select("key, enabled");
    if (error) {
      inflight = null;
      return {};
    }
    const map: Record<string, boolean> = {};
    (data ?? []).forEach((f: any) => (map[f.key] = !!f.enabled));
    cache = map;
    inflight = null;
    listeners.forEach((cb) => cb(map));
    return map;
  })();
  return inflight;
}

export function invalidateFeatureFlags() {
  cache = null;
  loadFeatureFlags(true);
}

export function useFeatureFlag(key: FeatureFlagKey, defaultValue = false): boolean {
  const [enabled, setEnabled] = useState<boolean>(cache?.[key] ?? defaultValue);
  useEffect(() => {
    let mounted = true;
    loadFeatureFlags().then((flags) => {
      if (mounted) setEnabled(flags[key] ?? defaultValue);
    });
    const cb = (flags: Record<string, boolean>) => {
      if (mounted) setEnabled(flags[key] ?? defaultValue);
    };
    listeners.add(cb);
    return () => {
      mounted = false;
      listeners.delete(cb);
    };
  }, [key, defaultValue]);
  return enabled;
}

export function useFeatureFlags(): { flags: Record<string, boolean>; loading: boolean } {
  const [flags, setFlags] = useState<Record<string, boolean>>(cache ?? {});
  const [loading, setLoading] = useState(!cache);
  useEffect(() => {
    let mounted = true;
    loadFeatureFlags().then((f) => {
      if (mounted) {
        setFlags(f);
        setLoading(false);
      }
    });
    const cb = (f: Record<string, boolean>) => mounted && setFlags(f);
    listeners.add(cb);
    return () => {
      mounted = false;
      listeners.delete(cb);
    };
  }, []);
  return { flags, loading };
}