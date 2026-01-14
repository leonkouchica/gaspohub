import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BookingPaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  gateway: string;
  customerEmail: string;
}

// Escrow configuration
const INITIAL_RELEASE_PERCENTAGE = 0.60; // 60% released immediately
const HELD_PERCENTAGE = 0.40; // 40% held in escrow
const COMMISSION_RATE = 0.10; // 10% platform commission on total

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, amount, currency, gateway, customerEmail }: BookingPaymentRequest = await req.json();

    console.log(`Processing escrow payment for booking ${bookingId}:`, { amount, currency, gateway, customerEmail });

    // Validate required fields
    if (!bookingId || !amount || !gateway) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bookingId, amount, gateway' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, services(title)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get gateway settings
    const { data: gatewaySettings, error: gatewayError } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .eq('gateway_name', gateway)
      .eq('is_active', true)
      .maybeSingle();

    if (gatewayError || !gatewaySettings) {
      console.error('Gateway not found or inactive:', gatewayError);
      return new Response(
        JSON.stringify({ error: `Payment gateway "${gateway}" is not available` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simulate payment processing (in production, integrate with actual gateway)
    let paymentResult;
    const transactionId = `${gateway}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (gatewaySettings.test_mode) {
      paymentResult = {
        success: true,
        transactionId,
        status: 'completed',
        gateway,
        message: 'Payment processed successfully (test mode)',
      };
    } else {
      // Would integrate with real payment gateway here
      paymentResult = {
        success: false,
        error: `${gateway} live mode requires API keys to be configured`,
      };
    }

    if (!paymentResult.success) {
      return new Response(
        JSON.stringify(paymentResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate escrow amounts
    const totalAmount = Number(amount);
    const commissionRate = booking.commission_rate || (COMMISSION_RATE * 100);
    const commissionAmount = totalAmount * (commissionRate / 100);
    const initialRelease = totalAmount * INITIAL_RELEASE_PERCENTAGE;
    const heldAmount = totalAmount * HELD_PERCENTAGE;
    const finalRelease = heldAmount - commissionAmount;

    console.log('Escrow breakdown:', {
      totalAmount,
      commissionRate: `${commissionRate}%`,
      commissionAmount,
      initialRelease: `${INITIAL_RELEASE_PERCENTAGE * 100}% = $${initialRelease}`,
      heldAmount: `${HELD_PERCENTAGE * 100}% = $${heldAmount}`,
      finalRelease: `$${finalRelease} (after commission)`
    });

    // Update booking with payment status and escrow info
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'escrowed',
        status: 'accepted',
        initial_payment_released: true,
        final_payment_released: false,
        commission_rate: commissionRate,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      throw updateError;
    }

    // Create initial payout record for photographer (60%)
    const { error: payoutError } = await supabase
      .from('payouts')
      .insert({
        photographer_id: booking.photographer_id,
        booking_id: bookingId,
        amount: initialRelease,
        payout_type: 'initial',
        status: 'completed',
        payment_method: gateway,
        transaction_reference: transactionId,
        completed_at: new Date().toISOString(),
        released_at: new Date().toISOString(),
        notes: `Initial 60% release for booking. Total: $${totalAmount}, Commission rate: ${commissionRate}%`
      });

    if (payoutError) {
      console.error('Failed to create initial payout:', payoutError);
    }

    // Create pending payout record for final release (40% - commission)
    const { error: pendingPayoutError } = await supabase
      .from('payouts')
      .insert({
        photographer_id: booking.photographer_id,
        booking_id: bookingId,
        amount: finalRelease,
        payout_type: 'final',
        status: 'pending',
        notes: `Final release pending job completion. Held: $${heldAmount}, Commission: $${commissionAmount}`
      });

    if (pendingPayoutError) {
      console.error('Failed to create pending payout:', pendingPayoutError);
    }

    // Create notifications
    // Notify photographer about initial payment
    await supabase.from('notifications').insert({
      user_id: booking.photographer_id,
      title: 'Payment Received - Initial Release',
      message: `You've received $${initialRelease.toFixed(2)} (60%) for your booking. The remaining $${heldAmount.toFixed(2)} will be released after job completion.`,
      type: 'payment',
      related_id: bookingId,
      related_type: 'booking',
      action_url: '/dashboard/payouts'
    });

    // Notify client about successful payment
    await supabase.from('notifications').insert({
      user_id: booking.client_id,
      title: 'Payment Successful',
      message: `Your payment of $${totalAmount.toFixed(2)} for ${booking.services?.title || 'your booking'} has been processed.`,
      type: 'payment',
      related_id: bookingId,
      related_type: 'booking',
      action_url: '/dashboard/bookings'
    });

    console.log('Escrow payment processed successfully');

    return new Response(
      JSON.stringify({
        ...paymentResult,
        escrow: {
          totalAmount,
          initialRelease,
          heldAmount,
          commissionRate,
          commissionAmount,
          finalRelease,
          message: `60% ($${initialRelease.toFixed(2)}) released to photographer. 40% ($${heldAmount.toFixed(2)}) held until job completion.`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Booking payment processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
