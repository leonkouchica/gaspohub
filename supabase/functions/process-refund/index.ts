import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  bookingId: string;
  refundAmount: number;
  adminNotes?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bookingId, refundAmount, adminNotes }: RefundRequest = await req.json();

    if (!bookingId || !refundAmount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: bookingId, refundAmount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} processing refund for booking ${bookingId}: $${refundAmount}`);

    // Get booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (booking.refund_status === 'processed') {
      return new Response(
        JSON.stringify({ error: 'Refund has already been processed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the payment gateway used for the original booking
    const { data: initialPayout } = await supabase
      .from('payouts')
      .select('payment_method, transaction_reference')
      .eq('booking_id', bookingId)
      .eq('payout_type', 'initial')
      .maybeSingle();

    const gateway = initialPayout?.payment_method || 'unknown';
    const refundTransactionId = `refund_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In production, this would call the gateway's refund API
    // e.g. Stripe: stripe.refunds.create({ payment_intent, amount })
    // For now, simulate success in test mode
    console.log(`Simulating ${gateway} refund of $${refundAmount} (transaction: ${refundTransactionId})`);

    const now = new Date().toISOString();

    // 1. Update booking refund status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        refund_status: 'processed',
        refund_amount: refundAmount,
        refunded_at: now,
        payment_status: 'refunded',
        updated_at: now,
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking:', updateError);
      throw updateError;
    }

    // 2. Cancel any pending final payouts for this booking
    const { data: pendingPayouts } = await supabase
      .from('payouts')
      .select('id, amount')
      .eq('booking_id', bookingId)
      .eq('status', 'pending');

    if (pendingPayouts && pendingPayouts.length > 0) {
      for (const payout of pendingPayouts) {
        await supabase
          .from('payouts')
          .update({
            status: 'cancelled',
            notes: `Cancelled due to refund. Refund amount: $${refundAmount}`,
            updated_at: now,
          })
          .eq('id', payout.id);
      }
      console.log(`Cancelled ${pendingPayouts.length} pending payouts`);
    }

    // 3. Create a refund payout record for audit trail
    await supabase.from('payouts').insert({
      photographer_id: booking.photographer_id,
      booking_id: bookingId,
      amount: -refundAmount,
      payout_type: 'refund',
      status: 'completed',
      payment_method: gateway,
      transaction_reference: refundTransactionId,
      completed_at: now,
      released_at: now,
      released_by: user.id,
      notes: `Refund processed by admin. ${adminNotes || ''}`.trim(),
    });

    // 4. Audit log
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'refund_processed',
      target_user_id: booking.client_id,
      target_resource_id: bookingId,
      details: {
        refund_amount: refundAmount,
        original_amount: booking.total_amount,
        gateway,
        refund_transaction_id: refundTransactionId,
        admin_notes: adminNotes,
        cancelled_payouts: pendingPayouts?.length || 0,
      },
    });

    // 5. Notify client
    await supabase.from('notifications').insert({
      user_id: booking.client_id,
      title: 'Refund Processed',
      message: `Your refund of $${Number(refundAmount).toFixed(2)} has been processed. Please allow 3–5 business days for it to appear in your account.`,
      type: 'payment',
      related_id: bookingId,
      related_type: 'booking',
      action_url: '/dashboard/bookings',
    });

    // 6. Notify photographer about the reversal
    await supabase.from('notifications').insert({
      user_id: booking.photographer_id,
      title: 'Booking Refund Issued',
      message: `A refund of $${Number(refundAmount).toFixed(2)} has been issued for a cancelled booking. Any pending payouts have been adjusted.`,
      type: 'payment',
      related_id: bookingId,
      related_type: 'booking',
      action_url: '/dashboard/payouts',
    });

    console.log('Refund processed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          bookingId,
          refundAmount,
          transactionId: refundTransactionId,
          gateway,
          cancelledPayouts: pendingPayouts?.length || 0,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Refund processing error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
