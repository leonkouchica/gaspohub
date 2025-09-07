import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar, Clock, DollarSign, MessageSquare, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BookingWithDetails {
  id: string;
  booking_date: string;
  status: string;
  total_amount: number;
  job_details: string;
  payment_status: string;
  created_at: string;
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
  const [loading, setLoading] = useState(true);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">
          Manage your photography sessions and appointments
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by browsing photographers and their services
            </p>
            <Button asChild>
              <Link to="/photographers">Find Photographers</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
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
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    <Badge variant="outline" className={getPaymentStatusColor(booking.payment_status)}>
                      {booking.payment_status}
                    </Badge>
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
                    <Button variant="destructive" size="sm">
                      Cancel Booking
                    </Button>
                  )}
                  
                  {booking.status === 'completed' && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/reviews/new?booking=${booking.id}`}>
                        Leave Review
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Bookings;