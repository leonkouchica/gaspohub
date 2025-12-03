import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photographerId: string;
  bookingId?: string;
  orderId?: string;
}

export const ReviewDialog = ({
  open,
  onOpenChange,
  photographerId,
  bookingId,
  orderId,
}: ReviewDialogProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast({
        title: "Invalid submission",
        description: "Please select a rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data: reviewData, error } = await supabase.from("reviews").insert({
        photographer_id: photographerId,
        reviewer_id: user.id,
        rating,
        comment: comment.trim() || null,
        booking_id: bookingId || null,
        order_id: orderId || null,
        is_public: true,
        is_approved: null, // Pending moderation
      }).select().single();

      if (error) throw error;

      // Notify the photographer about the new review
      await createNotification({
        user_id: photographerId,
        title: "New Review Received",
        message: `You received a ${rating}-star review. It will be visible once approved by moderators.`,
        type: "review",
        related_id: reviewData.id,
        related_type: "review",
      });

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback! It will be visible after moderation.",
      });

      onOpenChange(false);
      setRating(0);
      setComment("");
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a Review</DialogTitle>
          <DialogDescription>
            Share your experience with this photographer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8",
                      (hoveredRating || rating) >= star
                        ? "fill-warning text-warning"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about working with this photographer..."
              rows={4}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || rating === 0}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
