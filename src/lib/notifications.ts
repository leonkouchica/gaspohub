import { supabase } from "@/integrations/supabase/client";

export interface CreateNotificationParams {
  user_id: string;
  title: string;
  message: string;
  type: "booking" | "payment" | "review" | "message" | "system" | "approval";
  related_id?: string;
  related_type?: string;
  action_url?: string;
}

export const createNotification = async (params: CreateNotificationParams) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.user_id,
    title: params.title,
    message: params.message,
    type: params.type,
    related_id: params.related_id || null,
    related_type: params.related_type || null,
    action_url: params.action_url || null,
  });

  if (error) {
    console.error("Failed to create notification:", error);
  }
};
