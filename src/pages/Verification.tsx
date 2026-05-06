import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { ShieldCheck } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export default function Verification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState<any | null>(null);
  const [fullName, setFullName] = useState("");
  const [docType, setDocType] = useState("national_id");
  const [files, setFiles] = useState<FileList | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from("photographer_verifications")
      .select("*").eq("photographer_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
    setSubmission(data || null);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const upload = async (file: File, prefix: string) => {
    const path = `${user!.id}/${prefix}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("evidence").upload(path, file);
    if (error) throw error;
    return path;
  };

  const submit = async () => {
    if (!user) return;
    if (!fullName.trim() || !files || files.length === 0) {
      toast({ title: "Add your name and at least one document", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      const docPaths: string[] = [];
      for (const f of Array.from(files)) docPaths.push(await upload(f, "doc"));
      const selfiePath = selfie ? await upload(selfie, "selfie") : null;
      const { error } = await supabase.from("photographer_verifications").insert({
        photographer_id: user.id, full_name: fullName, document_type: docType, document_urls: docPaths, selfie_url: selfiePath, status: "pending",
      });
      if (error) throw error;
      trackEvent("verification_submitted");
      toast({ title: "Submitted", description: "We'll review and notify you." });
      load();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  if (loading) return <DashboardSkeleton />;

  const canResubmit = !submission || submission.status === "rejected";

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><ShieldCheck className="h-7 w-7" />Photographer Verification</h1>
      <p className="text-muted-foreground mb-6">Verified photographers earn a trust badge and rank higher in search.</p>

      {submission && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Latest submission
              <Badge variant={submission.status === "approved" ? "default" : submission.status === "rejected" ? "destructive" : "secondary"}>
                {submission.status}
              </Badge>
            </CardTitle>
            <CardDescription>Submitted {new Date(submission.created_at).toLocaleDateString()}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>Document type: {submission.document_type}</p>
            <p>Files: {submission.document_urls?.length || 0}</p>
            {submission.reviewer_notes && <p className="mt-2">Reviewer notes: {submission.reviewer_notes}</p>}
          </CardContent>
        </Card>
      )}

      {canResubmit ? (
        <Card>
          <CardHeader><CardTitle>Submit verification</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Legal full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
            <div>
              <Label>Document type</Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="national_id">National ID</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">Driver's License</SelectItem>
                  <SelectItem value="business_registration">Business Registration</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Document images (front & back)</Label><Input type="file" accept="image/*,application/pdf" multiple onChange={(e) => setFiles(e.target.files)} /></div>
            <div><Label>Selfie holding ID (optional but recommended)</Label><Input type="file" accept="image/*" onChange={(e) => setSelfie(e.target.files?.[0] || null)} /></div>
            <Button onClick={submit} disabled={submitting} className="w-full">{submitting ? "Uploading…" : "Submit for review"}</Button>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="py-6 text-center text-muted-foreground">
          Your submission is {submission?.status}. You cannot resubmit unless rejected.
        </CardContent></Card>
      )}
    </div>
  );
}