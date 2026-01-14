import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileImage, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface EvidenceUploadProps {
  bookingId: string;
  photographerId: string;
  existingEvidence?: string[];
  existingNotes?: string;
  isSubmitted?: boolean;
  onEvidenceSubmitted?: () => void;
}

export const EvidenceUpload = ({
  bookingId,
  photographerId,
  existingEvidence = [],
  existingNotes = "",
  isSubmitted = false,
  onEvidenceSubmitted
}: EvidenceUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(existingEvidence);
  const [notes, setNotes] = useState(existingNotes);
  const [submitted, setSubmitted] = useState(isSubmitted);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (user?.id !== photographerId) {
      toast({
        title: "Unauthorized",
        description: "Only the assigned photographer can upload evidence",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
          toast({
            title: "Invalid file type",
            description: "Please upload images or PDF files only",
            variant: "destructive",
          });
          continue;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: "Files must be under 10MB",
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${photographerId}/${bookingId}/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(fileName, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: "Upload failed",
            description: `Failed to upload ${file.name}`,
            variant: "destructive",
          });
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('evidence')
          .getPublicUrl(fileName);

        uploadedUrls.push(urlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        setEvidenceUrls(prev => [...prev, ...uploadedUrls]);
        toast({
          title: "Files uploaded",
          description: `${uploadedUrls.length} file(s) uploaded successfully`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading files",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeEvidence = (index: number) => {
    setEvidenceUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (evidenceUrls.length === 0) {
      toast({
        title: "Evidence required",
        description: "Please upload at least one piece of evidence (e.g., gallery link screenshot, delivery confirmation)",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'completed',
          evidence_urls: evidenceUrls,
          evidence_notes: notes,
          evidence_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Get booking details for notification
      const { data: booking } = await supabase
        .from('bookings')
        .select('client_id, services(title)')
        .eq('id', bookingId)
        .single();

      // Notify client
      if (booking?.client_id) {
        await supabase.from('notifications').insert({
          user_id: booking.client_id,
          title: 'Job Completed',
          message: `Your photographer has marked the job for ${(booking.services as any)?.title || 'your booking'} as complete. Evidence has been submitted for review.`,
          type: 'booking',
          related_id: bookingId,
          related_type: 'booking',
          action_url: '/dashboard/bookings'
        });
      }

      setSubmitted(true);
      toast({
        title: "Evidence submitted!",
        description: "Your evidence has been submitted. An admin will review and release your final payment.",
      });

      onEvidenceSubmitted?.();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit evidence",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Evidence Submitted</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your evidence is being reviewed. Final payment will be released after admin approval.
              </p>
            </div>
          </div>
          {evidenceUrls.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Submitted files:</p>
              <div className="flex flex-wrap gap-2">
                {evidenceUrls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <FileImage className="h-3 w-3" />
                    Evidence {index + 1}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit Completion Evidence
        </CardTitle>
        <CardDescription>
          Upload proof of job completion to receive your final payment (remaining 40% less commission)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Evidence Files</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Upload screenshots, gallery links, or delivery confirmations (images or PDFs, max 10MB each)
          </p>
          
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="evidence-upload"
            />
            <label
              htmlFor="evidence-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                  <span className="text-sm text-muted-foreground">Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        {evidenceUrls.length > 0 && (
          <div>
            <Label>Uploaded Files ({evidenceUrls.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {evidenceUrls.map((url, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 py-1 px-2"
                >
                  <FileImage className="h-3 w-3" />
                  <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    File {index + 1}
                  </a>
                  <button
                    onClick={() => removeEvidence(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="evidence-notes">Additional Notes</Label>
          <Textarea
            id="evidence-notes"
            placeholder="Add any notes about the delivery (e.g., gallery link, delivery date, special instructions followed)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || evidenceUrls.length === 0}
          className="w-full"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Complete & Submit Evidence
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
