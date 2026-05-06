import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { invalidateFeatureFlags } from "@/lib/featureFlags";

export function FeatureFlagsManager() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<any[]>([]);
  const load = async () => {
    const { data } = await supabase.from("feature_flags").select("*").order("key");
    setFlags(data || []);
  };
  useEffect(() => { load(); }, []);

  const toggle = async (id: string, enabled: boolean, key: string) => {
    const { error } = await supabase.from("feature_flags").update({ enabled }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: enabled ? `Enabled ${key}` : `Disabled ${key}` });
    invalidateFeatureFlags();
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Toggle major features on or off without redeploying.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {flags.map((f) => (
          <div key={f.id} className="flex items-center justify-between border rounded-md p-3">
            <div className="min-w-0 mr-3">
              <p className="font-medium font-mono text-sm">{f.key}</p>
              {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
            </div>
            <Switch checked={f.enabled} onCheckedChange={(v) => toggle(f.id, v, f.key)} />
          </div>
        ))}
        {flags.length === 0 && <p className="text-sm text-muted-foreground">No flags defined.</p>}
      </CardContent>
    </Card>
  );
}