import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createNotification } from '@/lib/notifications';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Bell,
} from 'lucide-react';
import { format } from 'date-fns';

interface RefundBooking {
  id: string;
  booking_date: string;
  total_amount: number;
  status: string;
  refund_status: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  client_id: string;
  photographer_id: string;
  payment_status: string | null;
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
  services?: { title: string };
}

const refundStatusConfig = {
  pending: { label: 'Pending', icon: Clock, className: 'bg-amber-100 text-amber-800 border-amber-200' },
  approved: { label: 'Approved', icon: CheckCircle, className: 'bg-green-100 text-green-800 border-green-200' },
  rejected: { label: 'Rejected', icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20' },
  processed: { label: 'Processed', icon: CheckCircle, className: 'bg-primary/10 text-primary border-primary/20' },
  none: { label: 'No Refund', icon: AlertCircle, className: 'bg-muted text-muted-foreground border-border' },
};

function RefundStatusBadge({ status }: { status: string | null }) {
  const key = (status || 'none') as keyof typeof refundStatusConfig;
  const config = refundStatusConfig[key] ?? refundStatusConfig.none;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${config.className}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function RefundManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<RefundBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState<RefundBooking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [notifyClient, setNotifyClient] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, services(title)')
        .or('refund_status.eq.pending,refund_status.eq.approved,refund_status.eq.rejected,refund_status.eq.processed')
        .order('cancelled_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const clientIds = [...new Set(data.map((b) => b.client_id))];
        const photographerIds = [...new Set(data.map((b) => b.photographer_id))];

        const [{ data: clientProfiles }, { data: photographerProfiles }] = await Promise.all([
          supabase.from('profiles').select('id, email, first_name, last_name').in('id', clientIds),
          supabase.from('profiles').select('id, email, first_name, last_name').in('id', photographerIds),
        ]);

        setRefunds(
          data.map((booking) => ({
            ...booking,
            client_profile: clientProfiles?.find((p) => p.id === booking.client_id),
            photographer_profile: photographerProfiles?.find((p) => p.id === booking.photographer_id),
          }))
        );
      }
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to load refunds', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (refund: RefundBooking) => {
    setSelectedRefund(refund);
    setRefundAmount(refund.refund_amount?.toString() ?? refund.total_amount.toString());
    setAdminNote('');
    setNotifyClient(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedRefund(null);
    setRefundAmount('');
    setAdminNote('');
  };

  const handleAction = async (action: 'approved' | 'rejected' | 'processed') => {
    if (!selectedRefund || !user) return;
    setProcessing(true);

    try {
      const now = new Date().toISOString();
      const updateData: Record<string, unknown> = {
        refund_status: action,
      };
      if (action === 'approved' || action === 'processed') {
        updateData.refund_amount = parseFloat(refundAmount) || selectedRefund.total_amount;
        updateData.refunded_at = now;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', selectedRefund.id);

      if (error) throw error;

      // Audit log
      await supabase.from('admin_audit_log').insert([{
        admin_user_id: user.id,
        action_type: `refund_${action}`,
        target_user_id: selectedRefund.client_id,
        target_resource_id: selectedRefund.id,
        details: JSON.parse(JSON.stringify({
          refund_amount: updateData.refund_amount ?? null,
          admin_note: adminNote || null,
          notify_client: notifyClient,
        })),
      }]);

      // Notify client
      if (notifyClient) {
        const messages: Record<string, string> = {
          approved: `Your refund of $${Number(updateData.refund_amount).toFixed(2)} has been approved and will be processed to your original payment method shortly.`,
          rejected: `Your refund request for the booking on ${format(new Date(selectedRefund.booking_date), 'MMM d, yyyy')} has been reviewed and could not be approved. ${adminNote ? `Note: ${adminNote}` : 'Please contact support for more details.'}`,
          processed: `Your refund of $${Number(updateData.refund_amount).toFixed(2)} has been successfully processed. Please allow 3–5 business days for it to appear in your account.`,
        };

        await createNotification({
          user_id: selectedRefund.client_id,
          title: action === 'approved' ? 'Refund Approved' : action === 'processed' ? 'Refund Processed' : 'Refund Update',
          message: messages[action],
          type: 'payment',
          related_id: selectedRefund.id,
          related_type: 'booking',
          action_url: '/dashboard/bookings',
        });
      }

      toast({
        title: 'Done',
        description: `Refund ${action} successfully${notifyClient ? ' and client notified' : ''}.`,
      });

      closeDialog();
      fetchRefunds();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const pending = refunds.filter((r) => r.refund_status === 'pending');
  const approved = refunds.filter((r) => r.refund_status === 'approved');
  const processed = refunds.filter((r) => r.refund_status === 'processed');
  const rejected = refunds.filter((r) => r.refund_status === 'rejected');

  const renderTable = (items: RefundBooking[], showActions = true) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No refunds in this category</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Booking</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Refund Amt</TableHead>
            <TableHead>Cancelled</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((refund) => (
            <TableRow key={refund.id}>
              <TableCell>
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{refund.id.slice(0, 8)}</p>
                  {refund.cancellation_reason && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[180px] truncate" title={refund.cancellation_reason}>
                      "{refund.cancellation_reason}"
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">
                    {refund.client_profile?.first_name} {refund.client_profile?.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{refund.client_profile?.email}</p>
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm">{refund.services?.title || '—'}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(refund.booking_date), 'MMM d, yyyy')}
                </p>
              </TableCell>
              <TableCell className="font-medium">${refund.total_amount.toFixed(2)}</TableCell>
              <TableCell>
                {refund.refund_amount ? (
                  <span className="font-medium text-primary">${Number(refund.refund_amount).toFixed(2)}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                {refund.cancelled_at ? (
                  <span className="text-sm">{format(new Date(refund.cancelled_at), 'MMM d, yyyy')}</span>
                ) : '—'}
              </TableCell>
              <TableCell>
                <RefundStatusBadge status={refund.refund_status} />
              </TableCell>
              {showActions && (
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => openDialog(refund)}>
                    <DollarSign className="h-3.5 w-3.5 mr-1" />
                    Review
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{approved.length}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{processed.length}</p>
                <p className="text-sm text-muted-foreground">Processed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{rejected.length}</p>
                <p className="text-sm text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              Refund Management
            </CardTitle>
            <CardDescription>
              Review, approve, and mark refunds as processed. Clients are optionally notified at each step.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRefunds} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending
                {pending.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                    {pending.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
              <TabsTrigger value="processed">Processed ({processed.length})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">{renderTable(pending)}</TabsContent>
            <TabsContent value="approved">{renderTable(approved)}</TabsContent>
            <TabsContent value="processed">{renderTable(processed, false)}</TabsContent>
            <TabsContent value="rejected">{renderTable(rejected, false)}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Refund Request</DialogTitle>
            <DialogDescription>
              Booking #{selectedRefund?.id.slice(0, 8)} — {selectedRefund?.client_profile?.first_name} {selectedRefund?.client_profile?.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedRefund && (
            <div className="space-y-4 py-2">
              {/* Booking summary */}
              <div className="grid grid-cols-2 gap-3 text-sm p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedRefund.services?.title || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Booking Date</p>
                  <p className="font-medium">{format(new Date(selectedRefund.booking_date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Paid</p>
                  <p className="font-medium">${selectedRefund.total_amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Status</p>
                  <RefundStatusBadge status={selectedRefund.refund_status} />
                </div>
              </div>

              {selectedRefund.cancellation_reason && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Client's cancellation reason</p>
                  <p className="text-sm bg-muted p-3 rounded-lg italic">"{selectedRefund.cancellation_reason}"</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="refundAmt">Refund Amount ($)</Label>
                <Input
                  id="refundAmt"
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedRefund.total_amount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Maximum: ${selectedRefund.total_amount.toFixed(2)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNote">Admin Note (shown to client if rejecting)</Label>
                <Textarea
                  id="adminNote"
                  placeholder="Optional note for the client..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Notify client</p>
                    <p className="text-xs text-muted-foreground">Send an in-app notification</p>
                  </div>
                </div>
                <Switch checked={notifyClient} onCheckedChange={setNotifyClient} />
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedRefund?.refund_status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => handleAction('rejected')}
                  disabled={processing}
                  className="flex-1"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction('approved')}
                  disabled={processing}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            {selectedRefund?.refund_status === 'approved' && (
              <Button
                onClick={() => handleAction('processed')}
                disabled={processing}
                className="flex-1"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Mark as Processed
              </Button>
            )}
            {(selectedRefund?.refund_status === 'processed' || selectedRefund?.refund_status === 'rejected') && (
              <p className="text-sm text-muted-foreground text-center w-full">
                This refund has already been {selectedRefund.refund_status}.
              </p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
