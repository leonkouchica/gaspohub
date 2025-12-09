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
import { ReviewDialog } from "@/components/ReviewDialog";
import { Calendar, Clock, DollarSign, MessageSquare, MapPin, Filter, Star, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, startOfDay } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { createNotification } from "@/lib/notifications";
import { generateInvoicePDF } from "@/lib/invoice";

interface BookingWithDetails {
  id: string;
  booking_date: string;
  status: string;
  total_amount: number;
  job_details: string;
  payment_status: string;
  created_at: string;
  photographer_id: string;
  services: {
    title: string;
    duration_hours: number;
  };
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    location: string;
  };
}

const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
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
        .eq('client_id', user?.id)
        .order('booking_date', { ascending: false });

      if (error) throw error;

      const bookingsWithData = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: serviceData } = await supabase
            .from('services')
            .select('title, duration_hours')
            .eq('id', booking.service_id)
            .single();

          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, location')
            .eq('id', booking.photographer_id)
            .single();

          return {
            ...booking,
            services: serviceData || { title: '', duration_hours: 0 },
            profiles: profileData || { first_name: '', last_name: '', avatar_url: '', location: '' }
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

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    // Filter by date
    const today = startOfDay(new Date());
    switch (dateFilter) {
      case "upcoming":
        filtered = filtered.filter(booking => 
          isAfter(new Date(booking.booking_date), today)
        );
        break;
      case "past":
        filtered = filtered.filter(booking => 
          isBefore(new Date(booking.booking_date), today)
        );
        break;
      case "today":
        filtered = filtered.filter(booking => {
          const bookingDate = startOfDay(new Date(booking.booking_date));
          return bookingDate.getTime() === today.getTime();
        });
        break;
      default:
        // "all" - no date filtering
        break;
    }

    setFilteredBookings(filtered);
  };

  useEffect(() => {
    filterBookings();
  }, [statusFilter, dateFilter, bookings]);

  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancellationReason.trim()) {
      toast({
        title: "Cancellation reason required",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancellationReason,
          cancelled_at: new Date().toISOString(),
          cancelled_by: user?.id,
          refund_status: 'pending'
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Notify photographer about the cancellation
      await createNotification({
        user_id: selectedBooking.photographer_id,
        title: "Booking Cancelled",
        message: `A booking for ${selectedBooking.services?.title} on ${format(new Date(selectedBooking.booking_date), "PPP")} has been cancelled.`,
        type: "booking",
        related_id: selectedBooking.id,
        related_type: "booking",
        action_url: "/dashboard/bookings",
      });

      toast({
        title: "Booking cancelled",
        description: "Your booking has been cancelled. Refund will be processed shortly.",
      });

      setCancelDialogOpen(false);
      setCancellationReason("");
      setSelectedBooking(null);
      fetchBookings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking",
        variant: "destructive",
      });
    }
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

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumbs />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">
          Manage your photography sessions and appointments
        </p>
      </div>

      {/* Filter Controls */}
      <div className="bg-card rounded-lg p-6 mb-8 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="past">Past</SelectItem>
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
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {renderBookingsList(filteredBookings)}
        </TabsContent>
        
        <TabsContent value="upcoming">
          {renderBookingsList(filteredBookings.filter(b => 
            isAfter(new Date(b.booking_date), startOfDay(new Date()))
          ))}
        </TabsContent>
        
        <TabsContent value="past">
          {renderBookingsList(filteredBookings.filter(b => 
            isBefore(new Date(b.booking_date), startOfDay(new Date()))
          ))}
        </TabsContent>
        
        <TabsContent value="pending">
          {renderBookingsList(filteredBookings.filter(b => b.status === 'pending'))}
        </TabsContent>
      </Tabs>

      {selectedBooking && (
        <>
          <ReviewDialog
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            photographerId={selectedBooking.photographer_id}
            bookingId={selectedBooking.id}
          />
          
          <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Please provide a reason for cancelling this booking. This action cannot be undone, but you may be eligible for a refund.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <Textarea
                placeholder="Reason for cancellation..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="min-h-[100px]"
              />
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setCancellationReason("");
                  setSelectedBooking(null);
                }}>
                  Keep Booking
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    handleCancelBooking();
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancel Booking
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );

  function renderBookingsList(bookingsToShow: BookingWithDetails[]) {
    if (bookingsToShow.length === 0) {
      return (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              {bookings.length === 0 
                ? "Start by browsing photographers and their services"
                : "Try adjusting your filters to see more bookings"
              }
            </p>
            {bookings.length === 0 && (
              <Button asChild>
                <Link to="/photographers">Find Photographers</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {bookingsToShow.map((booking) => (
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
                {/* Photographer Info */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Avatar>
                    <AvatarImage src={booking.profiles?.avatar_url} />
                    <AvatarFallback>
                      {booking.profiles?.first_name?.[0]}
                      {booking.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">
                      {booking.profiles?.first_name} {booking.profiles?.last_name}
                    </p>
                    {booking.profiles?.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {booking.profiles.location}
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Details */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">
                        {format(new Date(booking.booking_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  {booking.services?.duration_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-medium">
                          {booking.services.duration_hours} hour{booking.services.duration_hours !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">${booking.total_amount}</p>
                    </div>
                  </div>
                </div>

                {booking.job_details && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Job Details</p>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg">{booking.job_details}</p>
                  </div>
                )}

                <Separator />

                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/messages?booking=${booking.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Photographer
                    </Link>
                  </Button>
                  
                  {booking.status === 'pending' && (
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setCancelDialogOpen(true);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}
                  
                  {(booking.status === 'completed' || booking.status === 'confirmed') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        generateInvoicePDF({
                          invoiceNumber: `BK-${booking.id.slice(0, 8).toUpperCase()}`,
                          date: format(new Date(booking.created_at), "MMM d, yyyy"),
                          customerName: user?.email?.split('@')[0] || 'Customer',
                          customerEmail: user?.email || '',
                          items: [{
                            name: booking.services?.title || 'Photography Service',
                            quantity: 1,
                            unitPrice: booking.total_amount,
                            total: booking.total_amount
                          }],
                          subtotal: booking.total_amount,
                          total: booking.total_amount,
                          notes: booking.job_details || `Photography session on ${format(new Date(booking.booking_date), "PPP")} with ${booking.profiles?.first_name} ${booking.profiles?.last_name}`
                        });
                        toast({
                          title: "Invoice Downloaded",
                          description: "Your booking invoice has been generated"
                        });
                      }}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Download Invoice
                    </Button>
                  )}
                  
                  {booking.status === 'completed' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedBooking(booking);
                        setReviewDialogOpen(true);
                      }}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Leave Review
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
        ))}
      </div>
    );
  }
};

export default Bookings;