import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function render(template: string, vars: Record<string, any>) {
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => String(vars[k] ?? ""));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supa = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const now = new Date().toISOString();
  const { data: due, error } = await supa
    .from("scheduled_reminders")
    .select("*")
    .eq("status", "pending")
    .lte("send_at", now)
    .limit(100);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }

  let sent = 0, skipped = 0, failed = 0;

  // Pull active email settings once
  const { data: emailCfg } = await supa.from("email_settings").select("*").eq("is_enabled", true).maybeSingle();

  for (const r of due ?? []) {
    try {
      // Load template
      const { data: tpl } = await supa
        .from("notification_templates")
        .select("*")
        .eq("event_key", r.event_key)
        .eq("is_enabled", true)
        .maybeSingle();
      if (!tpl) {
        await supa.from("scheduled_reminders").update({ status: "skipped", sent_at: now }).eq("id", r.id);
        skipped++; continue;
      }

      const vars = (r.payload as Record<string, any>) || {};
      const subject = render(tpl.subject || "", vars);
      const body = render(tpl.body || "", vars);

      // In-app notification (always)
      await supa.from("notifications").insert({
        user_id: r.user_id,
        type: r.event_key,
        title: subject || r.event_key,
        message: body,
        related_id: r.booking_id,
        related_type: "booking",
      });

      // Optional email if configured
      if (tpl.channel === "email" && emailCfg?.api_key && vars.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${emailCfg.api_key}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `${emailCfg.from_name} <${emailCfg.from_email}>`,
              to: vars.email,
              subject,
              html: body.replace(/\n/g, "<br/>"),
            }),
          });
        } catch (_) { /* best effort */ }
      }

      await supa.from("scheduled_reminders").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", r.id);
      sent++;
    } catch (e) {
      failed++;
      await supa.from("scheduled_reminders").update({ status: "failed", sent_at: new Date().toISOString() }).eq("id", r.id);
    }
  }

  return new Response(JSON.stringify({ processed: due?.length ?? 0, sent, skipped, failed }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
