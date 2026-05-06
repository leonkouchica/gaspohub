import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export function NotificationTemplatesManager() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, any>>({});

  const load = async () => {
    const { data } = await supabase.from("notification_templates").select("*").order("event_key");
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, field: string, value: any) => setEdits((e) => ({ ...e, [id]: { ...e[id], [field]: value } }));
  const save = async (item: any) => {
    const patch = edits[item.id]; if (!patch) return;
    const { error } = await supabase.from("notification_templates").update(patch).eq("id", item.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Template saved" });
    setEdits((e) => { const n = { ...e }; delete n[item.id]; return n; });
    load();
  };
  const toggle = async (id: string, is_enabled: boolean) => {
    await supabase.from("notification_templates").update({ is_enabled }).eq("id", id);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Templates</CardTitle>
        <CardDescription>Reminder & event templates. Variables use {"{{name}}"} syntax.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((t) => {
          const e = edits[t.id] || {};
          return (
            <div key={t.id} className="border rounded-md p-3 space-y-2">
              <div className="flex justify-between gap-2">
                <div className="text-sm">
                  <p className="font-mono font-medium">{t.event_key}</p>
                  <p className="text-xs text-muted-foreground">{t.channel}</p>
                </div>
                <Switch checked={t.is_enabled} onCheckedChange={(v) => toggle(t.id, v)} />
              </div>
              <Input placeholder="Subject" defaultValue={t.subject || ""} onChange={(ev) => update(t.id, "subject", ev.target.value)} />
              <Textarea rows={2} defaultValue={t.body} onChange={(ev) => update(t.id, "body", ev.target.value)} />
              {Object.keys(e).length > 0 && <Button size="sm" onClick={() => save(t)}>Save</Button>}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}