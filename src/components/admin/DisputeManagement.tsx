import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertTriangle, CheckCircle, Clock, DollarSign, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { createNotification } from '@/lib/notifications';

interface DisputeBooking {
  id: string;
  booking_date: string;
  total_amount: number;
  status: string;
  refund_status: string | null;
  refund_amount: number | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  client_id: string;
  photographer_id: string;
  client_profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  photographer_profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  services?: {
    title: string;
  };
}

export function DisputeManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<DisputeBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<DisputeBooking | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*, services(title)')
        .or('status.eq.cancelled,refund_status.neq.none')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (bookingsData) {
        const clientIds = bookingsData.map((b) => b.client_id);
        const photographerIds = bookingsData.map((b) => b.photographer_id);

        const { data: clientProfiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', clientIds);

        const { data: photographerProfiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', photographerIds);

        const enrichedData = bookingsData.map((booking) => ({
          ...booking,
          client_profile: clientProfiles?.find((p) => p.id === booking.client_id),
          photographer_profile: photographerProfiles?.find((p) => p.id === booking.photographer_id),
        }));

        setDisputes(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load disputes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRefund = async (status: 'approved' | 'rejected') => {
    if (!selectedDispute) return;

    try {
      const updateData: {
        refund_status: string;
        refunded_at: string | null;
        refund_amount?: number;
      } = {
        refund_status: status,
        refunded_at: status === 'approved' ? new Date().toISOString() : null,
      };

      if (status === 'approved' && refundAmount) {
        updateData.refund_amount = parseFloat(refundAmount);
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', selectedDispute.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user!.id,
        action_type: status === 'approved' ? 'refund_approved' : 'refund_rejected',
        target_user_id: selectedDispute.client_id,
        target_resource_id: selectedDispute.id,
        details: {
          refund_amount: refundAmount || null,
          resolution_note: resolutionNote,
        },
      });

      // Notify client
      await createNotification({
        user_id: selectedDispute.client_id,
        title: status === 'approved' ? 'Refund Approved' : 'Refund Request Update',
        message:
          status === 'approved'
            ? `Your refund of $${refundAmount} has been approved and will be processed shortly.`
            : `Your refund request has been reviewed. ${resolutionNote || 'Please contact support for more information.'}`,
        type: 'payment',
        related_id: selectedDispute.id,
        related_type: 'booking',
      });

      toast({
        title: 'Success',
        description: `Refund ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      });

      setDialogOpen(false);
      setSelectedDispute(null);
      setRefundAmount('');
      setResolutionNote('');
      fetchDisputes();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (refundStatus: string | null) => {
    switch (refundStatus) {
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-success text-success-foreground flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="secondary">None</Badge>;
    }
  };

  if (loading) {
    return <p className="text-muted-foreground">Loading disputes...</p>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Disputes & Refunds
          </CardTitle>
          <CardDescription>
            Manage booking cancellations and refund requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-muted-foreground">No disputes or refund requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Photographer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Refund Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell className="font-mono text-xs">
                      {dispute.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {dispute.client_profile?.first_name}{' '}
                          {dispute.client_profile?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dispute.client_profile?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {dispute.photographer_profile?.first_name}{' '}
                          {dispute.photographer_profile?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {dispute.photographer_profile?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{dispute.services?.title || 'N/A'}</TableCell>
                    <TableCell className="font-medium">
                      ${dispute.total_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={dispute.status === 'cancelled' ? 'destructive' : 'secondary'}
                      >
                        {dispute.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(dispute.refund_status)}</TableCell>
                    <TableCell>
                      <Dialog open={dialogOpen && selectedDispute?.id === dispute.id} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) {
                          setSelectedDispute(null);
                          setRefundAmount('');
                          setResolutionNote('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDispute(dispute);
                              setRefundAmount(dispute.total_amount.toString());
                              setDialogOpen(true);
                            }}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Process
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Process Refund Request</DialogTitle>
                            <DialogDescription>
                              Review and process the refund for booking #{dispute.id.slice(0, 8)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Client</p>
                                <p className="font-medium">
                                  {dispute.client_profile?.first_name}{' '}
                                  {dispute.client_profile?.last_name}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Original Amount</p>
                                <p className="font-medium">${dispute.total_amount.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Booking Date</p>
                                <p className="font-medium">
                                  {format(new Date(dispute.booking_date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Cancelled</p>
                                <p className="font-medium">
                                  {dispute.cancelled_at
                                    ? format(new Date(dispute.cancelled_at), 'MMM d, yyyy')
                                    : 'N/A'}
                                </p>
                              </div>
                            </div>
                            {dispute.cancellation_reason && (
                              <div>
                                <p className="text-muted-foreground text-sm mb-1">
                                  Cancellation Reason
                                </p>
                                <p className="text-sm bg-muted p-2 rounded">
                                  {dispute.cancellation_reason}
                                </p>
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label htmlFor="refundAmount">Refund Amount ($)</Label>
                              <Input
                                id="refundAmount"
                                type="number"
                                step="0.01"
                                value={refundAmount}
                                onChange={(e) => setRefundAmount(e.target.value)}
                                max={dispute.total_amount}
                              />
                              <p className="text-xs text-muted-foreground">
                                Maximum: ${dispute.total_amount.toFixed(2)}
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="resolutionNote">Resolution Note</Label>
                              <Textarea
                                id="resolutionNote"
                                placeholder="Add notes about the resolution..."
                                value={resolutionNote}
                                onChange={(e) => setResolutionNote(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter className="gap-2">
                            <Button
                              variant="destructive"
                              onClick={() => handleProcessRefund('rejected')}
                            >
                              Reject Refund
                            </Button>
                            <Button onClick={() => handleProcessRefund('approved')}>
                              Approve Refund
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
