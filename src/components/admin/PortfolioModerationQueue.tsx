import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function PortfolioModerationQueue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("pending");
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase.from("portfolio_items")
      .select("*").eq("status", tab).order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const decide = async (id: string, status: "approved" | "rejected", notes?: string) => {
    const { error } = await supabase.from("portfolio_items").update({
      status, moderator_id: user!.id, moderation_notes: notes || null, moderated_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("admin_audit_log").insert({
      admin_user_id: user!.id, action_type: `portfolio_${status}`, target_resource_id: id,
    });
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Moderation</CardTitle>
        <CardDescription>Review uploaded portfolio images.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} className="mt-4">
            {items.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No items.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-md overflow-hidden">
                    <div className="aspect-square bg-muted">
                      <img src={item.image_url} alt={item.caption || "portfolio"} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                    <div className="p-3 space-y-2">
                      {item.caption && <p className="text-sm line-clamp-2">{item.caption}</p>}
                      <Badge variant="outline">{item.category || "general"}</Badge>
                      {tab === "pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => decide(item.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            const reason = prompt("Rejection reason?") || "";
                            decide(item.id, "rejected", reason);
                          }}>Reject</Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">{item.moderation_notes || "—"}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}