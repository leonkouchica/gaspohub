import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Subscribes the logged-in user to realtime DB notifications and surfaces
 * a toast for each new notification. Browser push (Web Push API) requires
 * a VAPID server, so we ship the in-app toast + DB feed only.
 */
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as { title: string; message: string; action_url?: string | null };
          toast(n.title, {
            description: n.message,
            action: n.action_url
              ? {
                  label: "View",
                  onClick: () => {
                    window.location.href = n.action_url!;
                  },
                }
              : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}