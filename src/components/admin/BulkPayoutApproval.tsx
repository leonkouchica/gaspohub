import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function BulkPayoutApproval() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const load = async () => {
    const { data } = await supabase.from("payouts").select("*").eq("status", "pending").order("created_at", { ascending: false });
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

  const toggle = (id: string) => {
    setSelected((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const selectAll = () => setSelected(new Set(items.map((i) => i.id)));
  const clear = () => setSelected(new Set());

  const approveSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Approve ${selected.size} payouts?`)) return;
    const batchId = crypto.randomUUID();
    const ids = Array.from(selected);
    const { error } = await supabase.from("payouts").update({
      status: "approved", approval_batch_id: batchId, approved_at: new Date().toISOString(), approved_by: user!.id,
    }).in("id", ids);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("admin_audit_log").insert({
      admin_user_id: user!.id, action_type: "payouts_bulk_approved",
      details: { batch_id: batchId, count: ids.length, payout_ids: ids },
    });
    toast({ title: `Approved ${ids.length} payouts`, description: `Batch ${batchId.slice(0, 8)}` });
    clear(); load();
  };

  const total = items.filter((i) => selected.has(i.id)).reduce((s, i) => s + Number(i.amount), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Payout Approval</CardTitle>
        <CardDescription>Select multiple pending payouts and approve them in one batch.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={selectAll}>Select all ({items.length})</Button>
            <Button size="sm" variant="outline" onClick={clear} disabled={selected.size === 0}>Clear</Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{selected.size} selected • ${total.toLocaleString()}</span>
            <Button onClick={approveSelected} disabled={selected.size === 0}>Approve selected</Button>
          </div>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead className="w-8"></TableHead><TableHead>Photographer</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Created</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((p) => {
              const prof = profiles[p.photographer_id];
              return (
                <TableRow key={p.id}>
                  <TableCell><Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} /></TableCell>
                  <TableCell>{prof ? `${prof.first_name || ""} ${prof.last_name || ""}`.trim() || prof.email : p.photographer_id.slice(0, 8)}</TableCell>
                  <TableCell>{p.payout_type}</TableCell>
                  <TableCell>${Number(p.amount).toLocaleString()}</TableCell>
                  <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="secondary">{p.status}</Badge></TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-6">No pending payouts.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}