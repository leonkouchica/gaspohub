import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, Loader2, Scale, ShieldAlert, ExternalLink, Lock, Download, ZoomIn, FileText, File as FileIcon } from "lucide-react";
import { format } from "date-fns";
import {
  validateResolvePayload,
  canTransitionDisputeStatus,
  isTerminalStatus,
  type DisputeStatus,
  type Resolution as SharedResolution,
} from "@/lib/disputeResolution";

type Resolution = SharedResolution;

interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  raised_by_role: "client" | "photographer";
  reason: string;
  description: string | null;
  evidence_urls: string[];
  status: string;
  admin_notes: string | null;
  resolution: string | null;
  resolution_amount: number | null;
  resolved_at: string | null;
  created_at: string;
  bookings?: {
    id: string;
    booking_date: string;
    total_amount: number;
    status: string;
    escrow_initial_amount: number | null;
    escrow_final_amount: number | null;
    escrow_locked_at: string | null;
    final_payment_released: boolean | null;
    client_id: string;
    photographer_id: string;
    services?: { title: string };
  };
  client?: { first_name: string | null; last_name: string | null; email: string };
  photographer?: { first_name: string | null; last_name: string | null; email: string };
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  under_review: "default",
  resolved_refund: "secondary",
  resolved_partial: "secondary",
  resolved_release: "secondary",
  closed: "outline",
};

export function DisputeManagement() {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState<Resolution>("close_no_action");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, bookings(*, services(title))")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const all = (data ?? []) as unknown as Dispute[];
      const userIds = Array.from(new Set(all.flatMap((d) => [d.bookings?.client_id, d.bookings?.photographer_id]).filter(Boolean) as string[]));
      const { data: profiles } = await supabase.from("profiles").select("id, first_name, last_name, email").in("id", userIds);
      const map = new Map(profiles?.map((p) => [p.id, p]) ?? []);
      const enriched = all.map((d) => ({
        ...d,
        client: d.bookings?.client_id ? map.get(d.bookings.client_id) as Dispute["client"] : undefined,
        photographer: d.bookings?.photographer_id ? map.get(d.bookings.photographer_id) as Dispute["photographer"] : undefined,
      }));
      setDisputes(enriched);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to load", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const open = (d: Dispute) => {
    setSelected(d);
    setResolution("close_no_action");
    setAmount(d.bookings?.total_amount ? String(d.bookings.total_amount) : "");
    setNotes("");
    setValidationError(null);
  };

  const markUnderReview = async (d: Dispute) => {
    // Guard against illegal status transitions (e.g. terminal -> open/under_review).
    const transition = canTransitionDisputeStatus(
      d.status as DisputeStatus,
      "under_review",
    );
    if (transition !== true) {
      toast({
        title: "Invalid transition",
        description: `Cannot move dispute from ${d.status} back to under_review.`,
        variant: "destructive",
      });
      return;
    }
    if (d.status !== "open") return;
    const { error } = await supabase.from("disputes").update({ status: "under_review" }).eq("id", d.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchDisputes();
    }
  };

  const ERROR_MESSAGES: Record<string, string> = {
    missing_fields: "Resolution is required.",
    unknown_resolution: "Pick a valid resolution outcome.",
    invalid_partial_amount: "Enter a refund amount greater than 0 and no more than the booking total.",
    already_resolved: "This dispute is already resolved and cannot be edited.",
    cannot_reopen: "A resolved dispute cannot be reopened.",
  };

  const computeValidationError = (): string | null => {
    if (!selected) return null;
    const total = Number(selected.bookings?.total_amount ?? 0);
    const err = validateResolvePayload({
      disputeId: selected.id,
      resolution,
      resolutionAmount: resolution === "refund_partial" ? parseFloat(amount) : undefined,
      total,
      currentStatus: selected.status as DisputeStatus,
    });
    return err ? ERROR_MESSAGES[err.code] ?? "Invalid input." : null;
  };

  // Re-validate as inputs change so the Apply button stays in sync.
  useEffect(() => {
    if (!selected) return;
    setValidationError(computeValidationError());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, resolution, amount]);

  const submit = async () => {
    if (!selected) return;
    const err = computeValidationError();
    if (err) {
      setValidationError(err);
      toast({ title: "Cannot save", description: err, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        disputeId: selected.id,
        resolution,
        adminNotes: notes,
      };
      if (resolution === "refund_partial") body.resolutionAmount = parseFloat(amount);
      const { data, error } = await supabase.functions.invoke("resolve-dispute", { body });
      if (error || (data && (data as { error?: string }).error)) {
        throw new Error(error?.message || (data as { error?: string }).error || "Failed to resolve");
      }
      toast({ title: "Dispute resolved", description: `Outcome: ${resolution.replace(/_/g, " ")}` });
      setSelected(null);
      fetchDisputes();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : String(e), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-muted-foreground">Loading disputes…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-warning" /> Disputes
        </CardTitle>
        <CardDescription>Review evidence and decide on escrow disbursement.</CardDescription>
      </CardHeader>
      <CardContent>
        {disputes.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">No disputes filed.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Raised by</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Escrow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disputes.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono text-xs">{d.booking_id.slice(0, 8)}</TableCell>
                  <TableCell>{d.bookings?.services?.title ?? "—"}</TableCell>
                  <TableCell className="capitalize">{d.raised_by_role}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{d.reason}</TableCell>
                  <TableCell>${Number(d.bookings?.total_amount ?? 0).toFixed(2)}</TableCell>
                  <TableCell>
                    {d.bookings?.escrow_locked_at ? (
                      <Badge variant="secondary" className="gap-1"><Lock className="h-3 w-3" /> Locked</Badge>
                    ) : (
                      <Badge variant="outline">Unlocked</Badge>
                    )}
                  </TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[d.status] ?? "outline"}>{d.status}</Badge></TableCell>
                  <TableCell className="text-xs">{format(new Date(d.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => open(d)}>Review</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-warning" /> Review dispute
                </DialogTitle>
                <DialogDescription>
                  Booking #{selected.booking_id.slice(0, 8)} — raised by {selected.raised_by_role}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Client</p>
                    <p className="font-medium">{selected.client?.first_name} {selected.client?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{selected.client?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Photographer</p>
                    <p className="font-medium">{selected.photographer?.first_name} {selected.photographer?.last_name}</p>
                    <p className="text-xs text-muted-foreground">{selected.photographer?.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-medium">${Number(selected.bookings?.total_amount ?? 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Final escrow</p>
                    <p className="font-medium">${Number(selected.bookings?.escrow_final_amount ?? 0).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reason</p>
                  <p className="font-medium">{selected.reason}</p>
                </div>
                {selected.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm bg-muted p-3 rounded">{selected.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Evidence ({selected.evidence_urls.length})</p>
                  {selected.evidence_urls.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No evidence attached.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {selected.evidence_urls.map((u, i) => (
                        <a key={i} href={u} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded border px-2 py-1 text-sm hover:bg-muted">
                          <ExternalLink className="h-4 w-4" /> Evidence #{i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {!isTerminalStatus(selected.status as DisputeStatus) && (
                  <>
                    {selected.status === "open" && (
                      <Button variant="secondary" size="sm" onClick={() => markUnderReview(selected)}>
                        Mark under review
                      </Button>
                    )}

                    <div className="space-y-2">
                      <Label>Resolution</Label>
                      <Select value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="refund_full">Full refund to client (cancel booking)</SelectItem>
                          <SelectItem value="refund_partial">Partial refund + release remainder</SelectItem>
                          <SelectItem value="release_to_photographer">Release escrow to photographer</SelectItem>
                          <SelectItem value="close_no_action">Close — no financial action</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {resolution === "refund_partial" && (
                      <div className="space-y-2">
                        <Label>Refund amount ($)</Label>
                        <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} max={selected.bookings?.total_amount ?? undefined} />
                        <p className="text-xs text-muted-foreground">Max ${Number(selected.bookings?.total_amount ?? 0).toFixed(2)}.</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Admin notes</Label>
                      <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes / message to parties" />
                    </div>

                    {validationError && (
                      <div
                        role="alert"
                        className="rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      >
                        {validationError}
                      </div>
                    )}
                  </>
                )}

                {selected.resolution && (
                  <div className="rounded border bg-muted p-3 text-sm">
                    <p className="font-medium mb-1">Resolved</p>
                    <p>Outcome: {selected.resolution}</p>
                    {selected.resolution_amount != null && <p>Amount: ${Number(selected.resolution_amount).toFixed(2)}</p>}
                    {selected.admin_notes && <p className="mt-1">Notes: {selected.admin_notes}</p>}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
                {!isTerminalStatus(selected.status as DisputeStatus) && (
                  <Button onClick={submit} disabled={submitting || !!validationError}>
                    {submitting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Applying…</> : "Apply resolution"}
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
