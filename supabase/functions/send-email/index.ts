import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  type: 'order_confirmation' | 'booking_confirmation' | 'booking_update';
  data: {
    customerName?: string;
    orderId?: string;
    orderTotal?: number;
    items?: { title: string; quantity: number; price: number }[];
    bookingId?: string;
    serviceName?: string;
    bookingDate?: string;
    photographerName?: string;
    clientName?: string;
    status?: string;
    totalAmount?: number;
  };
}

const getOrderConfirmationHtml = (data: EmailRequest['data'], fromName: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.customerName || 'Customer'},</p>
      <p>Thank you for your order! Here are your order details:</p>
      <p><strong>Order ID:</strong> ${data.orderId}</p>
      ${data.items?.map(item => `
        <div class="order-item">
          <span>${item.title} × ${item.quantity}</span>
          <span>$${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join('') || ''}
      <div class="total">Total: $${data.orderTotal?.toFixed(2) || '0.00'}</div>
      <p style="margin-top: 30px;">We'll notify you when your order ships.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const getBookingConfirmationHtml = (data: EmailRequest['data'], fromName: string, isClient: boolean) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .detail { padding: 10px 0; border-bottom: 1px solid #eee; }
    .detail strong { color: #333; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isClient ? 'Booking Confirmed!' : 'New Booking Received!'}</h1>
    </div>
    <div class="content">
      <p>Hi ${isClient ? data.clientName : data.photographerName},</p>
      <p>${isClient ? 'Your booking has been confirmed!' : 'You have received a new booking!'}</p>
      <div class="detail"><strong>Service:</strong> ${data.serviceName}</div>
      <div class="detail"><strong>Date:</strong> ${new Date(data.bookingDate || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <div class="detail"><strong>${isClient ? 'Photographer' : 'Client'}:</strong> ${isClient ? data.photographerName : data.clientName}</div>
      <div class="detail"><strong>Total Amount:</strong> $${data.totalAmount?.toFixed(2) || '0.00'}</div>
      <p style="margin-top: 30px;">${isClient ? 'We look forward to your session!' : 'Please review the booking details in your dashboard.'}</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

const getBookingUpdateHtml = (data: EmailRequest['data'], fromName: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .status { display: inline-block; padding: 8px 16px; border-radius: 20px; background: #e0f2fe; color: #0369a1; font-weight: 600; text-transform: capitalize; }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Booking Status Update</h1>
    </div>
    <div class="content">
      <p>Hi ${data.clientName || data.photographerName},</p>
      <p>Your booking for <strong>${data.serviceName}</strong> has been updated:</p>
      <p style="margin: 20px 0;"><span class="status">${data.status}</span></p>
      <p><strong>Date:</strong> ${new Date(data.bookingDate || '').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p style="margin-top: 30px;">Check your dashboard for more details.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${fromName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get email settings from database
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Email settings not configured' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    if (!emailSettings.is_enabled) {
      console.log('Email notifications are disabled');
      return new Response(
        JSON.stringify({ message: 'Email notifications are disabled' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    if (!emailSettings.api_key) {
      console.error('Resend API key not configured');
      return new Response(
        JSON.stringify({ error: 'Resend API key not configured' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const resend = new Resend(emailSettings.api_key);
    const { to, subject, type, data }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to ${to}`);

    let html: string;
    switch (type) {
      case 'order_confirmation':
        html = getOrderConfirmationHtml(data, emailSettings.from_name);
        break;
      case 'booking_confirmation':
        html = getBookingConfirmationHtml(data, emailSettings.from_name, !!data.clientName);
        break;
      case 'booking_update':
        html = getBookingUpdateHtml(data, emailSettings.from_name);
        break;
      default:
        throw new Error('Invalid email type');
    }

    const emailResponse = await resend.emails.send({
      from: `${emailSettings.from_name} <${emailSettings.from_email}>`,
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Error in send-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
