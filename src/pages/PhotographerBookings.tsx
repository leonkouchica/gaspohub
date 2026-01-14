import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SEO } from "@/components/SEO";
import { EvidenceUpload } from "@/components/photographer/EvidenceUpload";
import { 
  Calendar, 
  Clock, 
  DollarSign, 
  MessageSquare, 
  MapPin, 
  Filter,
  CheckCircle,
  AlertCircle,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PhotographerBooking {
  id: string;
  booking_date: string;
  status: string;
  total_amount: number;
  job_details: string;
  payment_status: string;
  created_at: string;
  client_id: string;
  initial_payment_released: boolean;
  final_payment_released: boolean;
  commission_rate: number;
  evidence_urls: string[];
  evidence_notes: string;
  evidence_submitted_at: string;
  services: {
    title: string;
    duration_hours: number;
  };
  client_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    email: string;
  };
}

const PhotographerBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<PhotographerBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<PhotographerBooking[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<PhotographerBooking | null>(null);
  const [evidenceDialogOpen, setEvidenceDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('photographer_id', user?.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      const bookingsWithData = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: serviceData } = await supabase
            .from('services')
            .select('title, duration_hours')
            .eq('id', booking.service_id)
            .single();

          const { data: clientData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, email')
            .eq('id', booking.client_id)
            .single();

          return {
            ...booking,
            services: serviceData || { title: '', duration_hours: 0 },
            client_profile: clientData || { first_name: '', last_name: '', avatar_url: '', email: '' }
          };
        })
      );

      setBookings(bookingsWithData);
      setFilteredBookings(bookingsWithData);
    } catch (error) {
      toast({
        title: "Error loading bookings",
        description: "Failed to fetch your bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBookings = () => {
    let filtered = [...bookings];

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  useEffect(() => {
    filterBookings();
  }, [statusFilter, bookings]);

  const handleConfirmBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking confirmed",
        description: "The booking has been confirmed successfully",
      });

      fetchBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm booking",
        variant: "destructive",
      });
    }
  };

  const calculateEarnings = (booking: PhotographerBooking) => {
    const total = Number(booking.total_amount);
    const commissionRate = Number(booking.commission_rate) || 10;
    const commission = total * (commissionRate / 100);
    const initialRelease = total * 0.60;
    const finalRelease = (total * 0.40) - commission;
    const totalEarnings = total - commission;
    
    return {
      total,
      commissionRate,
      commission,
      initialRelease,
      finalRelease,
      totalEarnings
    };
  };

  const openEvidenceDialog = (booking: PhotographerBooking) => {
    setSelectedBooking(booking);
    setEvidenceDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    awaitingPayout: bookings.filter(b => 
      b.status === 'completed' && 
      b.payment_status === 'paid' && 
      !b.final_payment_released
    ).length,
    totalEarnings: bookings
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, b) => sum + calculateEarnings(b).totalEarnings, 0)
  };

  return (
    <>
      <SEO 
        title="My Bookings - Photographer"
        description="Manage your photography session bookings and job completions."
      />
      <div className="container mx-auto px-6 py-8">
        <Breadcrumbs />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground">
            Manage your photography sessions and submit completion evidence
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.confirmed}</p>
                  <p className="text-sm text-muted-foreground">Confirmed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.awaitingPayout}</p>
                  <p className="text-sm text-muted-foreground">Awaiting Payout</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">${stats.totalEarnings.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="bg-card rounded-lg p-6 mb-8 shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-muted-foreground">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </div>

        {/* Bookings Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderBookingsList(filteredBookings)}
          </TabsContent>
          
          <TabsContent value="pending">
            {renderBookingsList(filteredBookings.filter(b => b.status === 'pending'))}
          </TabsContent>
          
          <TabsContent value="active">
            {renderBookingsList(filteredBookings.filter(b => b.status === 'confirmed'))}
          </TabsContent>
          
          <TabsContent value="completed">
            {renderBookingsList(filteredBookings.filter(b => b.status === 'completed'))}
          </TabsContent>
        </Tabs>

        {/* Evidence Upload Dialog */}
        <Dialog open={evidenceDialogOpen} onOpenChange={setEvidenceDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Submit Job Completion Evidence</DialogTitle>
            </DialogHeader>
            {selectedBooking && (
              <EvidenceUpload
                bookingId={selectedBooking.id}
                photographerId={user?.id || ''}
                existingEvidence={selectedBooking.evidence_urls || []}
                existingNotes={selectedBooking.evidence_notes || ''}
                isSubmitted={!!selectedBooking.evidence_submitted_at}
                onEvidenceSubmitted={() => {
                  setEvidenceDialogOpen(false);
                  fetchBookings();
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );

  function renderBookingsList(bookingsToShow: PhotographerBooking[]) {
    if (bookingsToShow.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {bookings.length === 0 
                ? "You haven't received any bookings yet"
                : "Try adjusting your filters to see more bookings"
              }
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {bookingsToShow.map((booking) => {
          const earnings = calculateEarnings(booking);
          const isPast = isBefore(new Date(booking.booking_date), startOfDay(new Date()));
          const canSubmitEvidence = 
            (booking.status === 'accepted' || booking.status === 'in_progress') && 
            isPast && 
            (booking.payment_status === 'escrowed' || booking.payment_status === 'partial_paid') &&
            !booking.evidence_submitted_at;
          const evidenceSubmitted = !!booking.evidence_submitted_at;
          const awaitingFinalPayout = 
            booking.status === 'completed' && 
            !booking.final_payment_released;

          return (
            <Card key={booking.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{booking.services?.title}</CardTitle>
                    <p className="text-muted-foreground">
                      Booked on {format(new Date(booking.created_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge variant={getStatusVariant(booking.status)}>
                      {booking.status}
                    </StatusBadge>
                    <StatusBadge variant={getStatusVariant(booking.payment_status)}>
                      {booking.payment_status}
                    </StatusBadge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Client Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={booking.client_profile?.avatar_url} />
                    <AvatarFallback>
                      {booking.client_profile?.first_name?.[0]}
                      {booking.client_profile?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {booking.client_profile?.first_name} {booking.client_profile?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{booking.client_profile?.email}</p>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {format(new Date(booking.booking_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {booking.services?.duration_hours} hour{booking.services?.duration_hours !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-medium">${earnings.total}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Your Earnings</p>
                      <p className="font-medium text-green-600">${earnings.totalEarnings.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Escrow Status */}
                {booking.payment_status === 'paid' && (
                  <div className="p-4 bg-muted/30 rounded-lg border">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Payment Status
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Initial Release (60%)</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${earnings.initialRelease.toFixed(2)}</span>
                          {booking.initial_payment_released ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Final Release (40% - {earnings.commissionRate}% commission)</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">${earnings.finalRelease.toFixed(2)}</span>
                          {booking.final_payment_released ? (
                            <Badge className="bg-green-100 text-green-800">Paid</Badge>
                          ) : evidenceSubmitted ? (
                            <Badge variant="secondary">Under Review</Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {booking.job_details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Job Details</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{booking.job_details}</p>
                  </div>
                )}

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/messages?booking=${booking.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Client
                    </Link>
                  </Button>
                  
                  {booking.status === 'pending' && (
                    <Button 
                      size="sm"
                      onClick={() => handleConfirmBooking(booking.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </Button>
                  )}
                  
                  {canSubmitEvidence && (
                    <Button 
                      size="sm"
                      onClick={() => openEvidenceDialog(booking)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Submit Evidence & Complete
                    </Button>
                  )}

                  {evidenceSubmitted && awaitingFinalPayout && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Evidence submitted - Awaiting admin review
                    </Badge>
                  )}

                  {booking.final_payment_released && (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Fully Paid
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }
};

export default PhotographerBookings;
