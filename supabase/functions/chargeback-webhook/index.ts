import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Generic chargeback / dispute webhook ingestion.
 * Accepts payloads from Stripe / Paystack / Flutterwave; stores raw event,
 * then upserts a row in `chargebacks`. No signature verification yet —
 * gateway-specific signing keys can be added per provider via secrets.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: corsHeaders });

  const url = new URL(req.url);
  const gateway = (url.searchParams.get("gateway") || "unknown").toLowerCase();

  let payload: any = {};
  try { payload = await req.json(); } catch { /* keep empty */ }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // 1. Log raw event
  const { data: evt } = await supabase
    .from("chargeback_webhook_events")
    .insert({ gateway, event_type: payload?.type || payload?.event || null, payload })
    .select("id")
    .single();

  // 2. Extract a chargeback row from common shapes
  let amount = 0; let currency = "USD"; let reference: string | null = null; let reason: string | null = null;
  if (gateway === "stripe") {
    const d = payload?.data?.object || {};
    amount = (d.amount || 0) / 100;
    currency = (d.currency || "usd").toUpperCase();
    reference = d.id || d.charge || null;
    reason = d.reason || null;
  } else if (gateway === "paystack") {
    const d = payload?.data || {};
    amount = (d.amount || 0) / 100;
    currency = d.currency || "NGN";
    reference = d.reference || d.id || null;
    reason = d.category || d.reason || null;
  } else if (gateway === "flutterwave") {
    const d = payload?.data || {};
    amount = d.amount || 0;
    currency = d.currency || "USD";
    reference = d.tx_ref || d.flw_ref || null;
    reason = d.comment || null;
  }

  let chargebackId: string | null = null;
  if (reference) {
    const { data: cb } = await supabase
      .from("chargebacks")
      .insert({ gateway, gateway_reference: reference, amount, currency, reason, status: "open", flagged_reason: "webhook" })
      .select("id")
      .single();
    chargebackId = cb?.id ?? null;
  }

  if (evt?.id) {
    await supabase.from("chargeback_webhook_events").update({ processed: true, chargeback_id: chargebackId }).eq("id", evt.id);
  }

  return new Response(JSON.stringify({ ok: true, chargeback_id: chargebackId }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});