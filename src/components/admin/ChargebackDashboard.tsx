import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { AlertTriangle, ShieldCheck } from "lucide-react";

interface Chargeback {
  id: string;
  booking_id: string | null;
  order_id: string | null;
  amount: number;
  currency: string;
  reason: string | null;
  status: string;
  gateway: string | null;
  gateway_reference: string | null;
  risk_score: number | null;
  flagged_reason: string | null;
  notes: string | null;
  created_at: string;
}

export function ChargebackDashboard() {
  const [items, setItems] = useState<Chargeback[]>([]);
  const [bookingId, setBookingId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const load = async () => {
    const { data } = await supabase.from("chargebacks" as any).select("*").order("created_at", { ascending: false });
    setItems((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const flag = async () => {
    if (!amount) return toast.error("Amount required");
    const { error } = await supabase.from("chargebacks" as any).insert({
      booking_id: bookingId || null,
      amount: parseFloat(amount),
      reason,
      status: "open",
    });
    if (error) return toast.error(error.message);
    toast.success("Chargeback recorded");
    setBookingId(""); setAmount(""); setReason("");
    load();
  };

  const resolve = async (id: string, status: "resolved" | "lost") => {
    const user = (await supabase.auth.getUser()).data.user;
    await supabase.from("chargebacks" as any).update({
      status,
      resolved_at: new Date().toISOString(),
      resolved_by: user?.id,
    }).eq("id", id);
    load();
  };

  const open = items.filter((c) => c.status === "open").length;
  const totalLoss = items.filter((c) => c.status === "lost").reduce((s, c) => s + Number(c.amount), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Open cases</p><p className="text-2xl font-bold">{open}</p></div><AlertTriangle className="h-6 w-6 text-yellow-500" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total cases</p><p className="text-2xl font-bold">{items.length}</p></div><ShieldCheck className="h-6 w-6 text-primary" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Confirmed loss</p><p className="text-2xl font-bold">${totalLoss.toFixed(2)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Flag a chargeback</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div><Label>Booking ID (optional)</Label><Input value={bookingId} onChange={(e) => setBookingId(e.target.value)} /></div>
            <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
            <div><Label>Reason</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
          </div>
          <Button onClick={flag}>Record case</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cases</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Reason</TableHead>
              <TableHead>Status</TableHead><TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{c.currency} {Number(c.amount).toFixed(2)}</TableCell>
                  <TableCell>{c.reason || "—"}</TableCell>
                  <TableCell><Badge variant={c.status === "open" ? "destructive" : "secondary"}>{c.status}</Badge></TableCell>
                  <TableCell className="space-x-2">
                    {c.status === "open" && (<>
                      <Button size="sm" variant="outline" onClick={() => resolve(c.id, "resolved")}>Won</Button>
                      <Button size="sm" variant="destructive" onClick={() => resolve(c.id, "lost")}>Lost</Button>
                    </>)}
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No chargebacks</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}