import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, Upload, X } from "lucide-react";

interface Props {
  bookingId: string;
  role: "client" | "photographer";
  /** Disable button if dispute already exists or status not eligible */
  disabled?: boolean;
  onCreated?: () => void;
  triggerVariant?: "default" | "outline" | "destructive" | "secondary";
}

const REASONS = [
  "Work not delivered",
  "Quality issues",
  "No-show",
  "Payment issue",
  "Behavior / professionalism",
  "Other",
];

export function RaiseDisputeDialog({ bookingId, role, disabled, onCreated, triggerVariant = "outline" }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [existing, setExisting] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.from("disputes")
      .select("id,status").eq("booking_id", bookingId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setExisting(data ?? null));
  }, [open, bookingId]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []);
    const valid = list.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        toast({ title: "File too large", description: `${f.name} exceeds 10MB`, variant: "destructive" });
        return false;
      }
      return true;
    });
    setFiles((p) => [...p, ...valid]);
  };

  const submit = async () => {
    if (!user) return;
    if (!reason || description.trim().length < 5) {
      toast({ title: "Add details", description: "Please provide a brief description (min 5 chars).", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // Create dispute first to get id
      const { data: dispute, error: dErr } = await supabase
        .from("disputes")
        .insert({
          booking_id: bookingId,
          raised_by: user.id,
          raised_by_role: role,
          reason,
          description,
          evidence_urls: [],
        })
        .select("id")
        .single();
      if (dErr || !dispute) throw dErr ?? new Error("Failed to create dispute");

      // Upload evidence under {userId}/disputes/{disputeId}/...
      const urls: string[] = [];
      for (const f of files) {
        const ext = f.name.split(".").pop();
        const path = `${user.id}/disputes/${dispute.id}/${Date.now()}_${Math.random().toString(36).slice(2, 9)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("evidence").upload(path, f);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from("evidence").createSignedUrl(path, 60 * 60 * 24 * 365);
        urls.push(signed?.signedUrl ?? path);
      }
      if (urls.length > 0) {
        await supabase.from("disputes").update({ evidence_urls: urls }).eq("id", dispute.id);
      }

      toast({ title: "Dispute submitted", description: "An admin will review your case shortly." });
      setOpen(false);
      setReason(REASONS[0]);
      setDescription("");
      setFiles([]);
      onCreated?.();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to submit", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" disabled={disabled}>
          <AlertTriangle className="h-4 w-4 mr-1" /> Raise Dispute
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise a dispute</DialogTitle>
          <DialogDescription>
            Describe the issue and attach supporting evidence. An admin will review and decide.
          </DialogDescription>
        </DialogHeader>

        {existing ? (
          <div className="rounded-md border bg-muted p-3 text-sm">
            A dispute already exists for this booking (status: <strong>{existing.status}</strong>).
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                rows={4}
                placeholder="Explain what happened…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Evidence (images / PDFs, up to 10MB each)</Label>
              <Input type="file" multiple accept="image/*,application/pdf" onChange={onPick} />
              {files.length > 0 && (
                <ul className="space-y-1 text-sm">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between rounded border px-2 py-1">
                      <span className="truncate">{f.name}</span>
                      <Button size="icon" variant="ghost" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>Cancel</Button>
          {!existing && (
            <Button onClick={submit} disabled={uploading}>
              {uploading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting…</> : <><Upload className="h-4 w-4 mr-1" /> Submit dispute</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}