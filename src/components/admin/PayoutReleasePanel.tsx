import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  Eye, 
  FileImage, 
  ExternalLink,
  Loader2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";

interface PendingPayout {
  id: string;
  booking_id: string;
  photographer_id: string;
  total_amount: number;
  pending_amount: number;
  commission_rate: number;
  booking_date: string;
  evidence_urls: string[];
  evidence_notes: string;
  evidence_submitted_at: string;
  service_title: string;
  photographer_profile: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url: string;
  };
  client_profile: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const PayoutReleasePanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<PendingPayout | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    fetchPendingPayouts();
  }, []);

  const fetchPendingPayouts = async () => {
    setLoading(true);
    try {
      // Get bookings awaiting final payout release
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          photographer_id,
          client_id,
          total_amount,
          commission_rate,
          booking_date,
          evidence_urls,
          evidence_notes,
          evidence_submitted_at,
          services(title)
        `)
        .eq('status', 'completed')
        .in('payment_status', ['escrowed', 'partial_paid'])
        .eq('final_payment_released', false)
        .not('evidence_urls', 'is', null)
        .order('evidence_submitted_at', { ascending: true });

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        setPendingPayouts([]);
        return;
      }

      // Get pending payout amounts
      const bookingIds = bookings.map(b => b.id);
      const { data: payouts } = await supabase
        .from('payouts')
        .select('booking_id, amount')
        .in('booking_id', bookingIds)
        .eq('payout_type', 'final')
        .eq('status', 'pending');

      // Get profiles
      const photographerIds = [...new Set(bookings.map(b => b.photographer_id))];
      const clientIds = [...new Set(bookings.map(b => b.client_id))];

      const { data: photographerProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', photographerIds);

      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', clientIds);

      const enrichedPayouts: PendingPayout[] = bookings.map(booking => {
        const payout = payouts?.find(p => p.booking_id === booking.id);
        const photographerProfile = photographerProfiles?.find(p => p.id === booking.photographer_id);
        const clientProfile = clientProfiles?.find(p => p.id === booking.client_id);

        return {
          id: booking.id,
          booking_id: booking.id,
          photographer_id: booking.photographer_id,
          total_amount: Number(booking.total_amount),
          pending_amount: payout ? Number(payout.amount) : 0,
          commission_rate: Number(booking.commission_rate) || 10,
          booking_date: booking.booking_date,
          evidence_urls: booking.evidence_urls || [],
          evidence_notes: booking.evidence_notes || '',
          evidence_submitted_at: booking.evidence_submitted_at,
          service_title: (booking.services as any)?.title || 'Unknown Service',
          photographer_profile: photographerProfile || { first_name: '', last_name: '', email: '', avatar_url: '' },
          client_profile: clientProfile || { first_name: '', last_name: '', email: '' }
        };
      });

      setPendingPayouts(enrichedPayouts);
    } catch (error: any) {
      console.error('Error fetching pending payouts:', error);
      toast({
        title: "Error",
        description: "Failed to load pending payouts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (payout: PendingPayout) => {
    setSelectedPayout(payout);
    setAdminNotes("");
    setReviewDialogOpen(true);
  };

  const handleReleasePayout = async () => {
    if (!selectedPayout) return;

    setReleasing(selectedPayout.id);
    try {
      const { data, error } = await supabase.functions.invoke('release-final-payout', {
        body: {
          bookingId: selectedPayout.booking_id,
          adminNotes
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Payout Released",
        description: `$${selectedPayout.pending_amount.toFixed(2)} has been released to the photographer.`,
      });

      setReviewDialogOpen(false);
      setSelectedPayout(null);
      fetchPendingPayouts();
    } catch (error: any) {
      console.error('Release error:', error);
      toast({
        title: "Release Failed",
        description: error.message || "Failed to release payout",
        variant: "destructive",
      });
    } finally {
      setReleasing(null);
    }
  };

  const calculateEscrowBreakdown = (totalAmount: number, commissionRate: number) => {
    const initialRelease = totalAmount * 0.60;
    const heldAmount = totalAmount * 0.40;
    const commission = totalAmount * (commissionRate / 100);
    const finalRelease = heldAmount - commission;
    return { initialRelease, heldAmount, commission, finalRelease };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payout Release Management</h2>
          <p className="text-muted-foreground">
            Review completed jobs and release final payments to photographers
          </p>
        </div>
        <Button variant="outline" onClick={fetchPendingPayouts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Reviews</p>
                <p className="text-2xl font-bold">{pendingPayouts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
                <p className="text-2xl font-bold">
                  ${pendingPayouts.reduce((sum, p) => sum + p.pending_amount, 0).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Commission</p>
                <p className="text-2xl font-bold">
                  {pendingPayouts.length > 0 
                    ? (pendingPayouts.reduce((sum, p) => sum + p.commission_rate, 0) / pendingPayouts.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payouts Table */}
      {pendingPayouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground">
              No pending payouts requiring review at this time.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Pending Final Payouts</CardTitle>
            <CardDescription>
              Review evidence and release remaining 40% (minus commission) to photographers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photographer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Booking Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Final Payout</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayouts.map((payout) => {
                  const breakdown = calculateEscrowBreakdown(payout.total_amount, payout.commission_rate);
                  return (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={payout.photographer_profile.avatar_url} />
                            <AvatarFallback>
                              {payout.photographer_profile.first_name?.[0]}
                              {payout.photographer_profile.last_name?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {payout.photographer_profile.first_name} {payout.photographer_profile.last_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {payout.photographer_profile.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{payout.service_title}</span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payout.booking_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">${payout.total_amount.toFixed(2)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <span className="font-bold text-green-600">
                            ${breakdown.finalRelease.toFixed(2)}
                          </span>
                          <p className="text-xs text-muted-foreground">
                            (40% - {payout.commission_rate}% commission)
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <FileImage className="h-3 w-3" />
                          {payout.evidence_urls.length} file(s)
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleReview(payout)}
                          disabled={releasing === payout.id}
                        >
                          {releasing === payout.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Evidence & Release Payout</DialogTitle>
            <DialogDescription>
              Review the submitted evidence before releasing the final payment
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-6">
              {/* Escrow Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Escrow Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const breakdown = calculateEscrowBreakdown(
                      selectedPayout.total_amount,
                      selectedPayout.commission_rate
                    );
                    return (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-bold">${selectedPayout.total_amount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Initial Release (60%)</p>
                          <p className="font-medium text-green-600">
                            ${breakdown.initialRelease.toFixed(2)} ✓
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Held Amount (40%)</p>
                          <p className="font-medium">${breakdown.heldAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            Platform Commission ({selectedPayout.commission_rate}%)
                          </p>
                          <p className="font-medium text-amber-600">
                            -${breakdown.commission.toFixed(2)}
                          </p>
                        </div>
                        <div className="col-span-2 pt-2 border-t">
                          <p className="text-muted-foreground">Final Release Amount</p>
                          <p className="text-xl font-bold text-green-600">
                            ${breakdown.finalRelease.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Evidence Files */}
              <div>
                <Label className="mb-2 block">Submitted Evidence</Label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedPayout.evidence_urls.map((url, index) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <FileImage className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm flex-1">Evidence {index + 1}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Photographer Notes */}
              {selectedPayout.evidence_notes && (
                <div>
                  <Label className="mb-2 block">Photographer's Notes</Label>
                  <p className="text-sm p-3 bg-muted rounded-lg">
                    {selectedPayout.evidence_notes}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <Label htmlFor="admin-notes" className="mb-2 block">Admin Review Notes (Optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Add any notes about this payout release..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReleasePayout}
              disabled={releasing !== null}
              className="bg-green-600 hover:bg-green-700"
            >
              {releasing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Releasing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Release Payout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
