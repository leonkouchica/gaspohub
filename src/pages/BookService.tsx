import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, DollarSign, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface ServiceWithPhotographer {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_hours: number;
  photographer_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    location: string;
  };
}

const BookService = () => {
  const { photographerId, serviceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [service, setService] = useState<ServiceWithPhotographer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [jobDetails, setJobDetails] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchService();
  }, [serviceId, photographerId]);

  const fetchService = async () => {
    try {
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .eq('photographer_id', photographerId)
        .single();

      if (serviceError) throw serviceError;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, location')
        .eq('id', photographerId)
        .single();

      setService({
        ...serviceData,
        profiles: profileData || {
          first_name: '',
          last_name: '',
          avatar_url: '',
          location: ''
        }
      });
    } catch (error) {
      toast({
        title: "Error loading service",
        description: "Could not load service details",
        variant: "destructive",
      });
      navigate('/services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !service || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          photographer_id: photographerId,
          service_id: serviceId,
          booking_date: selectedDate.toISOString(),
          total_amount: service.price,
          job_details: jobDetails,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Booking submitted!",
        description: "Your booking request has been sent to the photographer",
      });
      
      navigate('/bookings');
    } catch (error) {
      toast({
        title: "Booking failed",
        description: "Could not submit your booking request",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading service...</p>
        </div>
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Service</h1>
        <p className="text-muted-foreground">
          Complete your booking details below
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Service & Photographer Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{service.title}</h3>
                <p className="text-muted-foreground text-sm">{service.description}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="font-semibold">${service.price}</span>
              </div>
              
              {service.duration_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {service.duration_hours} hour{service.duration_hours !== 1 ? 's' : ''}
                  </span>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Photographer</h4>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={service.profiles?.avatar_url} />
                    <AvatarFallback>
                      {service.profiles?.first_name?.[0]}
                      {service.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {service.profiles?.first_name} {service.profiles?.last_name}
                    </p>
                    {service.profiles?.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {service.profiles.location}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="date">Select Date</Label>
                  <div className="mt-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                      className="rounded-md border"
                    />
                  </div>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {format(selectedDate, "PPP")}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="details">Job Details (Optional)</Label>
                  <Textarea
                    id="details"
                    placeholder="Describe your photography needs, preferred style, location requirements, etc."
                    value={jobDetails}
                    onChange={(e) => setJobDetails(e.target.value)}
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      ${service.price}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!selectedDate || submitting}
                      className="flex-1"
                    >
                      {submitting ? "Submitting..." : "Submit Booking Request"}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookService;