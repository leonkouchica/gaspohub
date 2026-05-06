import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import { FileText } from "lucide-react";

const schema = z.object({
  shoot_type: z.string().trim().min(2).max(80),
  location: z.string().trim().max(200).optional(),
  preferred_date: z.string().optional(),
  duration_hours: z.coerce.number().min(0).max(48).optional(),
  party_size: z.coerce.number().int().min(0).max(10000).optional(),
  deliverables: z.string().max(1000).optional(),
  budget: z.coerce.number().min(0).max(10_000_000).optional(),
  special_requirements: z.string().max(1000).optional(),
});

interface Props {
  photographerId: string;
  serviceId?: string;
  trigger?: React.ReactNode;
}

export function RequestQuoteDialog({ photographerId, serviceId, trigger }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({
    shoot_type: "", location: "", preferred_date: "", duration_hours: "",
    party_size: "", deliverables: "", budget: "", special_requirements: "",
  });

  const submit = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to request a quote.", variant: "destructive" });
      return;
    }
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    trackEvent("quote_request_started", { photographerId });
    const payload: any = {
      client_id: user.id,
      photographer_id: photographerId,
      service_id: serviceId ?? null,
      shoot_type: parsed.data.shoot_type,
      location: parsed.data.location || null,
      preferred_date: parsed.data.preferred_date ? new Date(parsed.data.preferred_date).toISOString() : null,
      duration_hours: parsed.data.duration_hours ?? null,
      party_size: parsed.data.party_size ?? null,
      deliverables: parsed.data.deliverables || null,
      budget: parsed.data.budget ?? null,
      special_requirements: parsed.data.special_requirements || null,
      expires_at: new Date(Date.now() + 14 * 86400 * 1000).toISOString(),
    };
    const { error } = await supabase.from("quote_requests").insert(payload);
    setSubmitting(false);
    if (error) {
      toast({ title: "Could not submit", description: error.message, variant: "destructive" });
      return;
    }
    trackEvent("quote_request_submitted", { photographerId });
    toast({ title: "Quote requested", description: "The photographer will respond shortly." });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline"><FileText className="h-4 w-4 mr-2" />Request a Quote</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Request a custom quote</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Shoot type *"><Input value={form.shoot_type} onChange={(e) => setForm({ ...form, shoot_type: e.target.value })} placeholder="e.g. Wedding, Product, Portrait" /></Field>
          <Field label="Location"><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Preferred date"><Input type="datetime-local" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} /></Field>
            <Field label="Duration (hours)"><Input type="number" min={0} value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number of people"><Input type="number" min={0} value={form.party_size} onChange={(e) => setForm({ ...form, party_size: e.target.value })} /></Field>
            <Field label="Budget"><Input type="number" min={0} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></Field>
          </div>
          <Field label="Deliverables"><Textarea rows={2} value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} placeholder="e.g. 50 edited photos, 1 highlight video" /></Field>
          <Field label="Special requirements / references"><Textarea rows={3} value={form.special_requirements} onChange={(e) => setForm({ ...form, special_requirements: e.target.value })} /></Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Sending…" : "Send request"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}