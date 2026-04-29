import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'evidence';
const EXPIRES_IN = 300; // 5 minutes

interface Body {
  disputeId: string;
  url: string; // stored evidence URL or storage object path
  download?: boolean;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Accepts either:
 *  - a raw object path inside the evidence bucket ("userId/disputes/x/file.jpg")
 *  - a public URL: ".../storage/v1/object/public/evidence/<path>"
 *  - a signed URL: ".../storage/v1/object/sign/evidence/<path>?token=..."
 * Returns the object path, or null if it cannot be parsed for THIS bucket.
 */
function extractObjectPath(input: string): string | null {
  if (!input) return null;
  if (!/^https?:\/\//i.test(input)) {
    // Treat as raw path; strip any leading bucket prefix.
    return input.replace(/^\/+/, '').replace(new RegExp(`^${BUCKET}/`), '');
  }
  try {
    const u = new URL(input);
    const marker = `/storage/v1/object/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    let rest = u.pathname.slice(idx + marker.length); // e.g. "sign/evidence/foo.jpg" or "public/evidence/foo.jpg"
    rest = rest.replace(/^(sign|public|authenticated)\//, '');
    if (!rest.startsWith(`${BUCKET}/`)) return null;
    return decodeURIComponent(rest.slice(BUCKET.length + 1));
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Invalid token' }, 401);

    // Admin gate — only admins may mint signed evidence URLs.
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return json({ error: 'Admin only' }, 403);

    let body: Body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }
    if (!body?.disputeId || typeof body.url !== 'string' || !body.url) {
      return json({ error: 'disputeId and url required' }, 400);
    }

    const { data: dispute, error: dErr } = await supabase
      .from('disputes')
      .select('id, evidence_urls')
      .eq('id', body.disputeId)
      .maybeSingle();
    if (dErr) return json({ error: dErr.message }, 500);
    if (!dispute) return json({ error: 'Dispute not found' }, 404);

    const stored = (dispute.evidence_urls ?? []) as string[];
    // The submitted URL must be one we issued for this dispute.
    const matchesStored = stored.some((s) => s === body.url);
    if (!matchesStored) return json({ error: 'Evidence not associated with this dispute' }, 403);

    const objectPath = extractObjectPath(body.url);
    if (!objectPath) return json({ error: 'Unsupported evidence URL format' }, 400);

    const fileName = objectPath.split('/').pop() || 'evidence';
    const { data: signed, error: signErr } = await supabase
      .storage
      .from(BUCKET)
      .createSignedUrl(objectPath, EXPIRES_IN, body.download ? { download: fileName } : undefined);
    if (signErr || !signed) return json({ error: signErr?.message ?? 'Failed to sign URL' }, 500);

    return json({
      url: signed.signedUrl,
      expiresIn: EXPIRES_IN,
      expiresAt: new Date(Date.now() + EXPIRES_IN * 1000).toISOString(),
      fileName,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
