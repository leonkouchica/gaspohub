import { supabase } from "@/integrations/supabase/client";

export type AnalyticsEvent =
  | "photographer_search_performed"
  | "photographer_profile_viewed"
  | "save_search_clicked"
  | "quote_request_started"
  | "quote_request_submitted"
  | "booking_started"
  | "booking_completed"
  | "checkout_abandoned"
  | "payment_completed"
  | "gallery_viewed"
  | "favorites_selected"
  | "review_submitted"
  | "verification_submitted"
  | "portfolio_uploaded";

function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = sessionStorage.getItem("gaspohub.session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("gaspohub.session_id", id);
  }
  return id;
}

export async function trackEvent(event: AnalyticsEvent | string, properties: Record<string, any> = {}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("analytics_events").insert({
      user_id: user?.id ?? null,
      session_id: getSessionId(),
      event_name: event,
      properties,
    });
  } catch (e) {
    // analytics is best-effort
  }
}