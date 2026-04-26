import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Resolution = 'refund_full' | 'refund_partial' | 'release_to_photographer' | 'close_no_action';

interface Body {
  disputeId: string;
  resolution: Resolution;
  resolutionAmount?: number;
  adminNotes?: string;
  resolutionMessage?: string;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Invalid token' }, 401);

    // Verify admin
    const { data: roleRow } = await supabase
      .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    if (!roleRow) return json({ error: 'Admin only' }, 403);

    const body: Body = await req.json();
    if (!body.disputeId || !body.resolution) return json({ error: 'disputeId and resolution required' }, 400);

    const { data: dispute, error: dErr } = await supabase
      .from('disputes').select('*').eq('id', body.disputeId).single();
    if (dErr || !dispute) return json({ error: 'Dispute not found' }, 404);
    if (['resolved_refund','resolved_release','resolved_partial','closed'].includes(dispute.status)) {
      return json({ error: 'Dispute already resolved' }, 400);
    }

    const { data: booking, error: bErr } = await supabase
      .from('bookings').select('*').eq('id', dispute.booking_id).single();
    if (bErr || !booking) return json({ error: 'Booking not found' }, 404);

    const total = Number(booking.total_amount);
    let refundAmount = 0;
    let payoutAmount = 0;
    let newBookingStatus: string | null = null;
    let newDisputeStatus: 'resolved_refund' | 'resolved_release' | 'resolved_partial' | 'closed' = 'closed';

    if (body.resolution === 'refund_full') {
      refundAmount = total;
      newBookingStatus = 'cancelled';
      newDisputeStatus = 'resolved_refund';
    } else if (body.resolution === 'refund_partial') {
      const amt = Number(body.resolutionAmount ?? 0);
      if (!(amt > 0) || amt > total) return json({ error: 'Invalid partial refund amount' }, 400);
      refundAmount = amt;
      payoutAmount = Math.max(0, Number(booking.escrow_final_amount ?? 0) - amt);
      newBookingStatus = 'paid';
      newDisputeStatus = 'resolved_partial';
    } else if (body.resolution === 'release_to_photographer') {
      payoutAmount = Number(booking.escrow_final_amount ?? 0);
      newBookingStatus = 'paid';
      newDisputeStatus = 'resolved_release';
    } else if (body.resolution === 'close_no_action') {
      newDisputeStatus = 'closed';
    } else {
      return json({ error: 'Unknown resolution' }, 400);
    }

    // Apply refund record if any
    if (refundAmount > 0) {
      await supabase.from('bookings').update({
        refund_status: 'approved',
        refund_amount: refundAmount,
        refunded_at: new Date().toISOString(),
      }).eq('id', booking.id);
    }

    // Apply payout record if releasing
    if (payoutAmount > 0) {
      await supabase.from('payouts').insert({
        photographer_id: booking.photographer_id,
        booking_id: booking.id,
        amount: payoutAmount,
        payout_type: 'final',
        status: 'pending',
        notes: `Dispute resolution: ${body.resolution}`,
        released_by: user.id,
      });
      await supabase.from('bookings').update({
        final_payment_released: true,
        paid_at: new Date().toISOString(),
      }).eq('id', booking.id);
    }

    if (newBookingStatus) {
      await supabase.from('bookings').update({
        status: newBookingStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', booking.id);
    }

    // Update dispute
    await supabase.from('disputes').update({
      status: newDisputeStatus,
      resolution: body.resolution,
      resolution_amount: refundAmount || payoutAmount || null,
      admin_notes: body.adminNotes ?? null,
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', dispute.id);

    // Audit
    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action_type: 'dispute_resolved',
      target_resource_id: dispute.id,
      details: {
        resolution: body.resolution,
        refund_amount: refundAmount,
        payout_amount: payoutAmount,
        booking_id: booking.id,
      },
    });

    // Notify both parties
    const message = body.resolutionMessage ??
      `An admin resolved your dispute: ${body.resolution.replace(/_/g, ' ')}.`;
    await supabase.from('notifications').insert([
      {
        user_id: booking.client_id,
        title: 'Dispute resolved',
        message,
        type: 'dispute',
        related_id: booking.id,
        related_type: 'booking',
        action_url: '/dashboard/bookings',
      },
      {
        user_id: booking.photographer_id,
        title: 'Dispute resolved',
        message,
        type: 'dispute',
        related_id: booking.id,
        related_type: 'booking',
        action_url: '/dashboard/photographer-bookings',
      },
    ]);

    return json({ success: true, refundAmount, payoutAmount, status: newDisputeStatus });
  } catch (e) {
    return json({ error: 'Internal server error', details: e instanceof Error ? e.message : String(e) }, 500);
  }
});