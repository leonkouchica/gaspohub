import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck } from "lucide-react";

export function VerificationQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase.from("photographer_verifications")
      .select("*").order("created_at", { ascending: false });
    setItems(data || []);
    const ids = (data || []).map((d: any) => d.photographer_id);
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, email, first_name, last_name").in("id", ids);
      const map: Record<string, any> = {};
      (ps || []).forEach((p: any) => (map[p.id] = p));
      setProfiles(map);
    }
  };
  useEffect(() => { load(); }, []);

  const decide = async (item: any, status: "approved" | "rejected") => {
    const { error } = await supabase.from("photographer_verifications").update({
      status, reviewer_id: user!.id, reviewer_notes: notes[item.id] || null, reviewed_at: new Date().toISOString(),
    }).eq("id", item.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    if (status === "approved") {
      await supabase.from("photographer_profiles")
        .update({ is_verified: true, verified_at: new Date().toISOString() })
        .eq("user_id", item.photographer_id);
    }
    await supabase.from("admin_audit_log").insert({
      admin_user_id: user!.id, action_type: `verification_${status}`,
      target_user_id: item.photographer_id, target_resource_id: item.id,
    });
    toast({ title: `Marked ${status}` });
    load();
  };

  const pending = items.filter((i) => i.status === "pending");
  const reviewed = items.filter((i) => i.status !== "pending");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Verification Queue</CardTitle>
        <CardDescription>{pending.length} pending • {reviewed.length} reviewed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {[...pending, ...reviewed].map((item) => {
          const p = profiles[item.photographer_id];
          const name = p ? `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email : item.photographer_id;
          return (
            <div key={item.id} className="border rounded-md p-4 space-y-3">
              <div className="flex justify-between items-start gap-2 flex-wrap">
                <div>
                  <p className="font-medium">{item.full_name} <span className="text-muted-foreground text-sm">({name})</span></p>
                  <p className="text-xs text-muted-foreground">{item.document_type} • Submitted {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <Badge variant={item.status === "approved" ? "default" : item.status === "rejected" ? "destructive" : "secondary"}>{item.status}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">Documents: {item.document_urls?.length || 0}{item.selfie_url ? " + selfie" : ""}</div>
              {item.reviewer_notes && <div className="text-sm">Notes: {item.reviewer_notes}</div>}
              {item.status === "pending" && (
                <>
                  <Textarea rows={2} placeholder="Reviewer notes (required for rejection)" value={notes[item.id] || ""} onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => decide(item, "approved")}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => decide(item, "rejected")}>Reject</Button>
                  </div>
                </>
              )}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No verification submissions yet.</p>}
      </CardContent>
    </Card>
  );
}