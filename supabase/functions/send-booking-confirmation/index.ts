import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  booking_id: string;
  client_id: string;
  photographer_id: string;
  service_title: string;
  booking_date: string;
  total_amount: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      booking_id,
      client_id,
      photographer_id,
      service_title,
      booking_date,
      total_amount,
    }: BookingConfirmationRequest = await req.json();

    console.log("Sending booking confirmation for:", booking_id);

    // Create notifications for both client and photographer
    const notifications = [
      {
        user_id: client_id,
        title: "Booking Confirmed",
        message: `Your booking for "${service_title}" on ${new Date(booking_date).toLocaleDateString()} has been confirmed. Total amount: $${total_amount}`,
        type: "booking",
        related_id: booking_id,
        related_type: "booking",
        action_url: "/dashboard/bookings",
      },
      {
        user_id: photographer_id,
        title: "New Booking",
        message: `You have a new booking for "${service_title}" on ${new Date(booking_date).toLocaleDateString()}. Amount: $${total_amount}`,
        type: "booking",
        related_id: booking_id,
        related_type: "booking",
        action_url: "/dashboard/bookings",
      },
    ];

    const { error: notifError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifError) {
      console.error("Error creating notifications:", notifError);
      throw notifError;
    }

    console.log("Booking confirmation notifications sent successfully");

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-confirmation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
