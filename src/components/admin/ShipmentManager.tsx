import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Shipment {
  id: string;
  order_id: string;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

const STATUSES = ["pending", "label_created", "shipped", "in_transit", "delivered", "returned"];

export function ShipmentManager() {
  const [items, setItems] = useState<Shipment[]>([]);
  const [orderId, setOrderId] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");

  const load = async () => {
    const { data } = await supabase.from("shipments" as any).select("*").order("created_at", { ascending: false });
    setItems((data as any) || []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!orderId) return toast.error("Order ID required");
    const trackingUrl = tracking && carrier
      ? `https://www.google.com/search?q=${encodeURIComponent(carrier + " " + tracking)}`
      : null;
    const { error } = await supabase.from("shipments" as any).insert({
      order_id: orderId,
      carrier,
      tracking_number: tracking,
      tracking_url: trackingUrl,
      status: tracking ? "shipped" : "pending",
      shipped_at: tracking ? new Date().toISOString() : null,
    });
    if (error) return toast.error(error.message);
    toast.success("Shipment created");
    setOrderId(""); setCarrier(""); setTracking("");
    load();
  };

  const setStatus = async (s: Shipment, status: string) => {
    const patch: any = { status };
    if (status === "delivered") patch.delivered_at = new Date().toISOString();
    if (status === "shipped" && !s.shipped_at) patch.shipped_at = new Date().toISOString();
    await supabase.from("shipments" as any).update(patch).eq("id", s.id);
    load();
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Create shipment</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div><Label>Order ID</Label><Input value={orderId} onChange={(e) => setOrderId(e.target.value)} /></div>
            <div><Label>Carrier</Label><Input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="DHL, UPS, FedEx..." /></div>
            <div><Label>Tracking number</Label><Input value={tracking} onChange={(e) => setTracking(e.target.value)} /></div>
          </div>
          <Button onClick={create}>Create shipment</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Shipments</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Order</TableHead><TableHead>Carrier</TableHead><TableHead>Tracking</TableHead>
              <TableHead>Status</TableHead><TableHead>Update</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.order_id.slice(0, 8)}</TableCell>
                  <TableCell>{s.carrier || "—"}</TableCell>
                  <TableCell>{s.tracking_url ? <a className="underline" href={s.tracking_url} target="_blank" rel="noreferrer">{s.tracking_number}</a> : s.tracking_number || "—"}</TableCell>
                  <TableCell><Badge>{s.status}</Badge></TableCell>
                  <TableCell>
                    <Select value={s.status} onValueChange={(v) => setStatus(s, v)}>
                      <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No shipments</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}