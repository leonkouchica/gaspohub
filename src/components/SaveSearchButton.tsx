import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bookmark } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function SaveSearchButton({ criteria }: { criteria: Record<string, any> }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [freq, setFreq] = useState("daily");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) {
      toast({ title: "Sign in to save searches", variant: "destructive" });
      return;
    }
    if (!name.trim()) { toast({ title: "Name your search", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id, name: name.trim(), criteria, alert_frequency: freq,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    trackEvent("save_search_clicked", { criteria });
    toast({ title: "Search saved", description: "Manage it in Saved Searches." });
    setOpen(false); setName("");
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Bookmark className="h-4 w-4 mr-2" />Save search
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save this search</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wedding photographers in Lagos" /></div>
            <div>
              <Label>Alert frequency</Label>
              <Select value={freq} onValueChange={setFreq}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant">Instant</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="off">No emails</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Email alerts are stubbed until the alert worker is connected.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>Save search</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}