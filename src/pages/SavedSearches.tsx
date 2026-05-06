import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useFeatureFlag } from "@/lib/featureFlags";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { Trash2, Pause, Play, Search } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  criteria: any;
  alert_frequency: string;
  is_paused: boolean;
  last_alert_at: string | null;
  created_at: string;
}

export default function SavedSearches() {
  const { user } = useAuth();
  const { toast } = useToast();
  const enabled = useFeatureFlag("saved_searches", true);
  const [items, setItems] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const togglePause = async (s: SavedSearch) => {
    await supabase.from("saved_searches").update({ is_paused: !s.is_paused }).eq("id", s.id);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this saved search?")) return;
    await supabase.from("saved_searches").delete().eq("id", id);
    load();
  };

  if (!enabled) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card><CardContent className="py-10 text-center text-muted-foreground">Saved searches are currently disabled.</CardContent></Card>
      </div>
    );
  }
  if (loading) return <DashboardSkeleton />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Saved Searches</h1>
          <p className="text-muted-foreground">Get notified when new photographers match your criteria.</p>
        </div>
        <Button asChild><Link to="/photographers"><Search className="h-4 w-4 mr-2" />New Search</Link></Button>
      </div>

      {items.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No saved searches yet.</p>
          <Button asChild><Link to="/photographers">Browse photographers</Link></Button>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{s.name}</CardTitle>
                    <CardDescription>
                      {Object.entries(s.criteria || {})
                        .filter(([, v]) => v)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" • ") || "No filters"}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.is_paused ? "secondary" : "default"}>{s.is_paused ? "Paused" : s.alert_frequency}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-0">
                <p className="text-xs text-muted-foreground">
                  {s.last_alert_at ? `Last alert ${new Date(s.last_alert_at).toLocaleDateString()}` : "No alerts yet"}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/photographers?${new URLSearchParams(s.criteria || {}).toString()}`}>Run</Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => togglePause(s)}>
                    {s.is_paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}