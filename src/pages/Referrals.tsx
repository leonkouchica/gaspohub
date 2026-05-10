import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { Copy, Gift } from "lucide-react";

export default function Referrals() {
  const { user } = useAuth();
  const [code, setCode] = useState<{ code: string; reward_percent: number } | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    let { data: c } = await supabase.from("referral_codes" as any).select("*").eq("user_id", user.id).maybeSingle();
    if (!c) {
      const newCode = (user.email?.split("@")[0] || "ref").slice(0, 6).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
      const { data: ins } = await supabase.from("referral_codes" as any).insert({ user_id: user.id, code: newCode }).select().single();
      c = ins as any;
    }
    setCode(c as any);
    const { data: r } = await supabase.from("referrals" as any).select("*").eq("referrer_id", user.id).order("created_at", { ascending: false });
    setReferrals((r as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const copy = () => {
    if (!code) return;
    const url = `${window.location.origin}/auth?ref=${code.code}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  if (loading) return <div className="p-6">Loading…</div>;

  const totalEarned = referrals.reduce((s, r) => s + Number(r.reward_amount || 0), 0);

  return (
    <>
      <SEO title="Referral Program" description="Earn rewards by inviting friends." />
      <div className="container mx-auto p-6 max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold flex items-center gap-2"><Gift className="h-7 w-7" /> Referral Program</h1>
        <Card>
          <CardHeader>
            <CardTitle>Your code</CardTitle>
            <CardDescription>Share this code or link. You earn {code?.reward_percent ?? 10}% on each referred user's first booking.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={code?.code || ""} className="font-mono text-lg" />
              <Button onClick={copy}><Copy className="h-4 w-4 mr-2" />Copy link</Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted rounded text-center"><p className="text-xs text-muted-foreground">Referrals</p><p className="text-2xl font-bold">{referrals.length}</p></div>
              <div className="p-3 bg-muted rounded text-center"><p className="text-xs text-muted-foreground">Rewarded</p><p className="text-2xl font-bold">{referrals.filter((r) => r.status === "rewarded").length}</p></div>
              <div className="p-3 bg-muted rounded text-center"><p className="text-xs text-muted-foreground">Earned</p><p className="text-2xl font-bold">${totalEarned.toFixed(2)}</p></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {referrals.length === 0 ? <p className="text-sm text-muted-foreground">No referrals yet.</p> : referrals.map((r) => (
              <div key={r.id} className="flex justify-between p-2 border rounded text-sm">
                <span>{new Date(r.created_at).toLocaleDateString()}</span>
                <Badge variant={r.status === "rewarded" ? "default" : "secondary"}>{r.status}</Badge>
                <span>${Number(r.reward_amount || 0).toFixed(2)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}