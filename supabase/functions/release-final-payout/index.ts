import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReleasePayoutRequest {
  bookingId: string;
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

    // Get the authorization header to identify the admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the user is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin status
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin');
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { bookingId, adminNotes }: ReleasePayoutRequest = await req.json();

    if (!bookingId) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: bookingId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} releasing final payout for booking ${bookingId}`);

    // Get booking details
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

    // Validate booking state
    if (booking.final_payment_released) {
      return new Response(
        JSON.stringify({ error: 'Final payment has already been released' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (booking.status !== 'client_confirmed') {
      return new Response(
        JSON.stringify({ error: 'Booking must be confirmed by the client before releasing final payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!booking.evidence_urls || booking.evidence_urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Photographer must submit evidence before final payment can be released' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the pending payout
    const { data: pendingPayout, error: payoutFetchError } = await supabase
      .from('payouts')
      .select('*')
      .eq('booking_id', bookingId)
      .eq('payout_type', 'final')
      .eq('status', 'pending')
      .single();

    if (payoutFetchError || !pendingPayout) {
      return new Response(
        JSON.stringify({ error: 'No pending final payout found for this booking' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const transactionId = `final_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Use locked escrow amount if available, otherwise fall back to existing payout amount
    const releaseAmount = booking.escrow_final_amount != null
      ? Number(booking.escrow_final_amount)
      : Number(pendingPayout.amount);

    // Update the payout to completed
    const { error: payoutUpdateError } = await supabase
      .from('payouts')
      .update({
        status: 'completed',
        amount: releaseAmount,
        transaction_reference: transactionId,
        completed_at: new Date().toISOString(),
        released_at: new Date().toISOString(),
        released_by: user.id,
        notes: `${pendingPayout.notes || ''}\n\nAdmin release notes: ${adminNotes || 'Approved'}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', pendingPayout.id);

    if (payoutUpdateError) {
      console.error('Failed to update payout:', payoutUpdateError);
      throw payoutUpdateError;
    }

    // Update the booking
    const { error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        final_payment_released: true,
        status: 'paid',
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        admin_review_notes: adminNotes,
        admin_reviewed_at: new Date().toISOString(),
        admin_reviewed_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId);

    if (bookingUpdateError) {
      console.error('Failed to update booking:', bookingUpdateError);
    }

    // Log admin action
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'final_payout_released',
      target_resource_id: bookingId,
      details: {
        payout_id: pendingPayout.id,
        amount: pendingPayout.amount,
        photographer_id: booking.photographer_id,
        notes: adminNotes
      }
    });

    // Notify photographer
    await supabase.from('notifications').insert({
      user_id: booking.photographer_id,
      title: 'Final Payment Released!',
      message: `Your final payment of $${Number(pendingPayout.amount).toFixed(2)} has been released. Thank you for completing the job!`,
      type: 'payment',
      related_id: bookingId,
      related_type: 'booking',
      action_url: '/dashboard/payouts'
    });

    // Notify client that job is fully completed
    await supabase.from('notifications').insert({
      user_id: booking.client_id,
      title: 'Booking Completed',
      message: 'Your photography session has been completed and all payments have been processed.',
      type: 'booking',
      related_id: bookingId,
      related_type: 'booking',
      action_url: '/dashboard/bookings'
    });

    console.log('Final payout released successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Final payout released successfully',
        payout: {
          id: pendingPayout.id,
          amount: pendingPayout.amount,
          transactionId
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Final payout release error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
