import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Action = 'accept' | 'start_work' | 'mark_complete' | 'client_confirm' | 'cancel' | 'dispute';

interface RequestBody {
  bookingId: string;
  action: Action;
  reason?: string;
}

// Map action -> { from[], to, role, timestampField }
const TRANSITIONS: Record<Action, { from: string[]; to: string; role: 'photographer' | 'client' | 'either' | 'admin'; ts?: string }> = {
  accept:         { from: ['requested'],         to: 'accepted',         role: 'photographer', ts: undefined },
  start_work:     { from: ['accepted'],          to: 'work_started',     role: 'photographer', ts: 'work_started_at' },
  mark_complete:  { from: ['work_started'],      to: 'complete',         role: 'photographer', ts: 'work_completed_at' },
  client_confirm: { from: ['complete'],          to: 'client_confirmed', role: 'client',       ts: 'client_confirmed_at' },
  cancel:         { from: ['requested', 'accepted'], to: 'cancelled',    role: 'either',       ts: 'cancelled_at' },
  dispute:        { from: ['work_started', 'complete', 'client_confirmed'], to: 'disputed', role: 'either' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body: RequestBody = await req.json();
    const rule = TRANSITIONS[body.action];
    if (!body.bookingId || !rule) {
      return new Response(JSON.stringify({ error: 'Invalid bookingId or action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: booking, error: bErr } = await supabase
      .from('bookings').select('*').eq('id', body.bookingId).single();
    if (bErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Authorize
    const isPhotographer = user.id === booking.photographer_id;
    const isClient = user.id === booking.client_id;
    const { data: isAdmin } = await supabase.rpc('is_admin');

    let allowed = false;
    if (isAdmin) allowed = true;
    else if (rule.role === 'photographer' && isPhotographer) allowed = true;
    else if (rule.role === 'client' && isClient) allowed = true;
    else if (rule.role === 'either' && (isPhotographer || isClient)) allowed = true;
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Not authorized for this transition' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!rule.from.includes(booking.status)) {
      return new Response(JSON.stringify({ error: `Cannot ${body.action} from status "${booking.status}"` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const update: Record<string, unknown> = { status: rule.to, updated_at: new Date().toISOString() };
    if (rule.ts) update[rule.ts] = new Date().toISOString();
    if (body.action === 'cancel') {
      update.cancelled_by = user.id;
      update.cancellation_reason = body.reason ?? null;
    }

    const { error: updErr } = await supabase.from('bookings').update(update).eq('id', body.bookingId);
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Notifications
    const notifyUserId = isPhotographer ? booking.client_id : booking.photographer_id;
    const titles: Record<Action, string> = {
      accept: 'Booking accepted',
      start_work: 'Photographer started work',
      mark_complete: 'Photographer marked job complete',
      client_confirm: 'Client confirmed completion',
      cancel: 'Booking cancelled',
      dispute: 'Booking disputed',
    };
    await supabase.from('notifications').insert({
      user_id: notifyUserId,
      title: titles[body.action],
      message: `Booking moved to "${rule.to}".`,
      type: 'booking',
      related_id: body.bookingId,
      related_type: 'booking',
      action_url: '/dashboard/bookings',
    });

    return new Response(JSON.stringify({ success: true, status: rule.to }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal server error', details: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});