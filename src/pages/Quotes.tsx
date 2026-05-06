import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { useCurrency } from "@/lib/currency";
import { FileText } from "lucide-react";

export default function Quotes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { format } = useCurrency();
  const [tab, setTab] = useState("incoming");
  const [incoming, setIncoming] = useState<any[]>([]);
  const [outgoing, setOutgoing] = useState<any[]>([]);
  const [responses, setResponses] = useState<Record<string, any[]>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [respondTo, setRespondTo] = useState<any | null>(null);
  const [respPrice, setRespPrice] = useState("");
  const [respMsg, setRespMsg] = useState("");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: inData }, { data: outData }] = await Promise.all([
      supabase.from("quote_requests").select("*").eq("photographer_id", user.id).order("created_at", { ascending: false }),
      supabase.from("quote_requests").select("*").eq("client_id", user.id).order("created_at", { ascending: false }),
    ]);
    setIncoming(inData || []);
    setOutgoing(outData || []);
    const all = [...(inData || []), ...(outData || [])];
    const ids = all.map((q) => q.id);
    if (ids.length) {
      const { data: rs } = await supabase.from("quote_responses").select("*").in("quote_request_id", ids);
      const grp: Record<string, any[]> = {};
      (rs || []).forEach((r: any) => { (grp[r.quote_request_id] ||= []).push(r); });
      setResponses(grp);
    }
    const userIds = Array.from(new Set(all.flatMap((q) => [q.client_id, q.photographer_id])));
    if (userIds.length) {
      const { data: ps } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds);
      const map: Record<string, any> = {};
      (ps || []).forEach((p: any) => (map[p.id] = p));
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("quote_requests").update({ status }).eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Quote ${status}` }); load(); }
  };

  const sendResponse = async () => {
    if (!respondTo || !user) return;
    const price = parseFloat(respPrice);
    if (isNaN(price) || price <= 0) {
      toast({ title: "Enter a valid price", variant: "destructive" }); return;
    }
    const { error } = await supabase.from("quote_responses").insert({
      quote_request_id: respondTo.id, photographer_id: user.id, price, message: respMsg, status: "sent",
    });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("quote_requests").update({ status: "responded" }).eq("id", respondTo.id);
    toast({ title: "Quote sent" });
    setRespondTo(null); setRespPrice(""); setRespMsg(""); load();
  };

  if (loading) return <DashboardSkeleton />;

  const renderList = (items: any[], side: "incoming" | "outgoing") => (
    items.length === 0 ? (
      <Card><CardContent className="py-10 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mx-auto mb-2" />
        No {side} quote requests yet.
      </CardContent></Card>
    ) : (
      <div className="space-y-3">
        {items.map((q) => {
          const counterId = side === "incoming" ? q.client_id : q.photographer_id;
          const cp = profiles[counterId];
          const cpName = cp ? `${cp.first_name || ""} ${cp.last_name || ""}`.trim() || cp.email : "Unknown";
          const rs = responses[q.id] || [];
          return (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-lg">{q.shoot_type}</CardTitle>
                    <CardDescription>
                      {side === "incoming" ? "From" : "To"} {cpName}
                      {q.location ? ` • ${q.location}` : ""}
                      {q.preferred_date ? ` • ${new Date(q.preferred_date).toLocaleDateString()}` : ""}
                    </CardDescription>
                  </div>
                  <Badge variant={q.status === "accepted" ? "default" : q.status === "declined" ? "destructive" : "secondary"}>{q.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground">
                  {q.duration_hours && <div>Duration: {q.duration_hours}h</div>}
                  {q.party_size && <div>People: {q.party_size}</div>}
                  {q.budget && <div>Budget: {format(Number(q.budget))}</div>}
                  {q.deliverables && <div className="col-span-full">Deliverables: {q.deliverables}</div>}
                  {q.special_requirements && <div className="col-span-full">Notes: {q.special_requirements}</div>}
                </div>
                {rs.length > 0 && (
                  <div className="border rounded-md p-3 bg-muted/30 space-y-2">
                    <p className="text-xs font-medium uppercase text-muted-foreground">Quotes ({rs.length})</p>
                    {rs.map((r) => (
                      <div key={r.id} className="flex justify-between text-sm">
                        <span>{format(Number(r.price))} — {r.message || "No message"}</span>
                        <Badge variant="outline">{r.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap pt-2">
                  {side === "incoming" && q.status === "pending" && (
                    <>
                      <Button size="sm" onClick={() => setRespondTo(q)}>Send quote</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(q.id, "declined")}>Decline</Button>
                    </>
                  )}
                  {side === "outgoing" && q.status === "responded" && (
                    <Button size="sm" onClick={() => updateStatus(q.id, "accepted")}>Accept</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    )
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6">Quotes</h1>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="incoming">Incoming ({incoming.length})</TabsTrigger>
          <TabsTrigger value="outgoing">My Requests ({outgoing.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="incoming" className="mt-4">{renderList(incoming, "incoming")}</TabsContent>
        <TabsContent value="outgoing" className="mt-4">{renderList(outgoing, "outgoing")}</TabsContent>
      </Tabs>

      <Dialog open={!!respondTo} onOpenChange={(o) => !o && setRespondTo(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Respond to quote</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Price (USD)</Label><Input type="number" value={respPrice} onChange={(e) => setRespPrice(e.target.value)} /></div>
            <div><Label>Message</Label><Textarea rows={3} value={respMsg} onChange={(e) => setRespMsg(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondTo(null)}>Cancel</Button>
            <Button onClick={sendResponse}>Send quote</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}