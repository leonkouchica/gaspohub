import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEO } from "@/components/SEO";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FileText, PenLine, Plus } from "lucide-react";
import { toast } from "sonner";

interface Contract {
  id: string;
  booking_id: string;
  client_id: string;
  photographer_id: string;
  title: string;
  body: string;
  status: string;
  client_signed_at: string | null;
  client_signature: string | null;
  photographer_signed_at: string | null;
  photographer_signature: string | null;
  created_at: string;
}

const TEMPLATE = `This Service Agreement is entered into between the Photographer and the Client for the photography services described in the related booking.

1. Scope: The Photographer agrees to deliver the agreed services and deliverables described in the booking.
2. Payment: The Client agrees to the total amount and payment schedule as listed in the booking.
3. Cancellation: Cancellations follow the platform's cancellation and refund policy.
4. Usage rights: The Client receives a personal-use license for delivered images unless otherwise agreed.
5. Liability: Liability is limited to the total amount of the booking.

By signing below, both parties agree to the terms above.`;

export default function Contracts() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [bookings, setBookings] = useState<{ id: string; client_id: string; photographer_id: string; job_details: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingId, setBookingId] = useState("");
  const [title, setTitle] = useState("Service Agreement");
  const [body, setBody] = useState(TEMPLATE);
  const [open, setOpen] = useState(false);
  const [signing, setSigning] = useState<Contract | null>(null);
  const [signature, setSignature] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("contracts" as any)
      .select("*")
      .or(`client_id.eq.${user.id},photographer_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setContracts((data as any) || []);
    const { data: bks } = await supabase
      .from("bookings")
      .select("id, client_id, photographer_id, job_details")
      .eq("photographer_id", user.id);
    setBookings(bks || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user || !bookingId) return toast.error("Pick a booking");
    const bk = bookings.find((b) => b.id === bookingId);
    if (!bk) return;
    const { error } = await supabase.from("contracts" as any).insert({
      booking_id: bookingId,
      client_id: bk.client_id,
      photographer_id: bk.photographer_id,
      title,
      body,
      status: "sent",
    });
    if (error) return toast.error(error.message);
    toast.success("Contract sent");
    setOpen(false); setBookingId(""); setBody(TEMPLATE);
    load();
  };

  const sign = async () => {
    if (!signing || !signature.trim() || !user) return;
    const isClient = signing.client_id === user.id;
    const patch: any = isClient
      ? { client_signed_at: new Date().toISOString(), client_signature: signature }
      : { photographer_signed_at: new Date().toISOString(), photographer_signature: signature };
    const fullySigned = isClient
      ? !!signing.photographer_signed_at
      : !!signing.client_signed_at;
    if (fullySigned) patch.status = "signed";
    const { error } = await supabase.from("contracts" as any).update(patch).eq("id", signing.id);
    if (error) return toast.error(error.message);
    toast.success("Signed");
    setSigning(null); setSignature("");
    load();
  };

  return (
    <>
      <SEO title="Contracts" description="View and sign service contracts for your bookings." />
      <div className="container mx-auto p-6 space-y-4">
        <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Contracts" }]} />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />Contracts</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New contract</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>New contract</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Booking</Label>
                  <Select value={bookingId} onValueChange={setBookingId}>
                    <SelectTrigger><SelectValue placeholder="Select a booking" /></SelectTrigger>
                    <SelectContent>
                      {bookings.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.id.slice(0, 8)} — {b.job_details?.slice(0, 40) || "Booking"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div><Label>Body</Label><Textarea rows={10} value={body} onChange={(e) => setBody(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={create}>Send for signature</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? <p className="text-muted-foreground">Loading…</p> : contracts.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No contracts yet</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => {
              const isClient = c.client_id === user?.id;
              const mineSigned = isClient ? !!c.client_signed_at : !!c.photographer_signed_at;
              return (
                <Card key={c.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{c.title}</CardTitle>
                        <CardDescription>Booking {c.booking_id.slice(0, 8)} • {new Date(c.created_at).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge variant={c.status === "signed" ? "default" : "secondary"}>{c.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <pre className="text-sm whitespace-pre-wrap font-sans bg-muted p-3 rounded">{c.body}</pre>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>Client: {c.client_signed_at ? `Signed ${new Date(c.client_signed_at).toLocaleString()}` : "Unsigned"}</span>
                      <span>Photographer: {c.photographer_signed_at ? `Signed ${new Date(c.photographer_signed_at).toLocaleString()}` : "Unsigned"}</span>
                    </div>
                    {!mineSigned && (
                      <Button onClick={() => setSigning(c)} size="sm"><PenLine className="h-4 w-4 mr-2" />Sign</Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!signing} onOpenChange={(o) => !o && setSigning(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Sign contract</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Type your full legal name to sign. By signing, you agree to the terms above.</p>
              <Input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Full name" />
            </div>
            <DialogFooter><Button onClick={sign} disabled={!signature.trim()}>Sign now</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}