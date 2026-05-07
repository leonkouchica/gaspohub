import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Criteria { q?: string; specialty?: string; location?: string; radiusKm?: string }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: searches } = await supa
    .from("saved_searches")
    .select("*, profiles:user_id(email, first_name)")
    .eq("is_paused", false);

  const { data: emailCfg } = await supa.from("email_settings").select("*").eq("is_enabled", true).maybeSingle();
  const now = new Date();

  let dispatched = 0;

  for (const s of searches ?? []) {
    // Frequency gating
    const last = s.last_alert_at ? new Date(s.last_alert_at) : null;
    const minHours = s.alert_frequency === "instant" ? 0 : s.alert_frequency === "weekly" ? 24 * 7 : 24;
    if (last && (now.getTime() - last.getTime()) / 36e5 < minHours) continue;

    const c: Criteria = (s.criteria as any) || {};
    let q = supa.from("photographer_profiles").select("user_id, latitude, longitude, specialties, profiles:user_id(first_name, last_name, location)").eq("is_approved", true);
    if (c.specialty && c.specialty !== "all") q = q.contains("specialties", [c.specialty]);
    // Only check photographers added since last alert
    if (last) q = q.gte("created_at", last.toISOString());
    const { data: matches } = await q.limit(20);

    let filtered = matches ?? [];
    if (c.q) {
      const term = c.q.toLowerCase();
      filtered = filtered.filter((p: any) =>
        `${p.profiles?.first_name ?? ""} ${p.profiles?.last_name ?? ""}`.toLowerCase().includes(term)
      );
    }
    if (c.location && c.location !== "all") {
      filtered = filtered.filter((p: any) => p.profiles?.location === c.location);
    }

    if (filtered.length === 0) continue;

    // Log the alert
    await supa.from("saved_search_alerts").insert({
      saved_search_id: s.id,
      matched_count: filtered.length,
      payload: { sample: filtered.slice(0, 5).map((p: any) => p.user_id) },
    });

    // In-app notification
    await supa.from("notifications").insert({
      user_id: s.user_id,
      type: "saved_search_alert",
      title: `${filtered.length} new match${filtered.length === 1 ? "" : "es"} for "${s.name}"`,
      message: `New photographers match your saved search.`,
      action_url: "/photographers",
      related_id: s.id,
      related_type: "saved_search",
    });

    // Optional email
    const recipientEmail = (s.profiles as any)?.email;
    if (emailCfg?.api_key && recipientEmail) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { "Authorization": `Bearer ${emailCfg.api_key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: `${emailCfg.from_name} <${emailCfg.from_email}>`,
            to: recipientEmail,
            subject: `${filtered.length} new photographer${filtered.length === 1 ? "" : "s"} for "${s.name}"`,
            html: `<p>Hi ${(s.profiles as any)?.first_name ?? "there"},</p><p>${filtered.length} new photographer${filtered.length === 1 ? "" : "s"} match your saved search "<b>${s.name}</b>".</p><p><a href="${Deno.env.get("PUBLIC_SITE_URL") ?? "https://gaspohub.lovable.app"}/photographers">Browse them now</a>.</p>`,
          }),
        });
      } catch (_) { /* best effort */ }
    }

    await supa.from("saved_searches").update({ last_alert_at: now.toISOString() }).eq("id", s.id);
    dispatched++;
  }

  return new Response(JSON.stringify({ checked: searches?.length ?? 0, dispatched }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
