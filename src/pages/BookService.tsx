import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, DollarSign, MapPin, Camera, CheckCircle } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { 
  getSamplePhotographerByUserId,
  getSampleServicesByPhotographerId 
} from "@/data/sampleData";

const bookingSchema = z.object({
  booking_date: z.date({
    required_error: "Please select a booking date",
  }),
  job_details: z.string().min(10, "Please provide more details about your photography needs"),
});

type BookingForm = z.infer<typeof bookingSchema>;

interface ServiceData {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_hours: number;
  photographer_id: string;
}

interface PhotographerData {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  location: string;
  bio: string;
}

// Build sample photographer data from shared data
const buildSamplePhotographerData = (userId: string) => {
  const photographer = getSamplePhotographerByUserId(userId);
  if (!photographer) return null;
  
  const services = getSampleServicesByPhotographerId(userId).map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    price: s.price,
    duration_hours: s.duration_hours,
    photographer_id: s.photographer_id
  }));
  
  return {
    photographer: {
      id: photographer.user_id,
      first_name: photographer.profiles.first_name,
      last_name: photographer.profiles.last_name,
      avatar_url: photographer.profiles.avatar_url,
      location: photographer.profiles.location,
      bio: photographer.profiles.bio
    },
    services
  };
};

const BookService = () => {
  const { photographerId, serviceId } = useParams<{ photographerId: string; serviceId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [service, setService] = useState<ServiceData | null>(null);
  const [photographer, setPhotographer] = useState<PhotographerData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSamplePhotographer, setIsSamplePhotographer] = useState(false);
  const [demoBookingComplete, setDemoBookingComplete] = useState(false);

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    if (photographerId) {
      fetchData();
    }
  }, [photographerId, serviceId]);

  const fetchData = async () => {
    try {
      // Check if this is a sample photographer
      const sampleData = photographerId ? buildSamplePhotographerData(photographerId) : null;
      if (sampleData) {
        setPhotographer(sampleData.photographer);
        setServices(sampleData.services);
        setIsSamplePhotographer(true);

        // If a specific service is selected, find it
        if (serviceId) {
          const specificService = sampleData.services.find(s => s.id === serviceId);
          if (specificService) {
            setService(specificService);
            setSelectedService(specificService);
          }
        }
        setLoading(false);
        return;
      }

      // Fetch real photographer data
      const { data: photographerData, error: photographerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', photographerId)
        .single();

      if (photographerError) throw photographerError;

      // Fetch services for this photographer
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('photographer_id', photographerId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      setPhotographer(photographerData);
      setServices(servicesData || []);

      // If a specific service is selected, find it
      if (serviceId && servicesData) {
        const specificService = servicesData.find(s => s.id === serviceId);
        if (specificService) {
          setService(specificService);
          setSelectedService(specificService);
        }
      }
    } catch (error) {
      toast({
        title: "Error loading data",
        description: "Failed to fetch booking information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: BookingForm) => {
    if (!selectedService) {
      toast({
        title: "Service required",
        description: "Please select a service to book",
        variant: "destructive",
      });
      return;
    }

    // Handle demo booking for sample photographers
    if (isSamplePhotographer) {
      setSubmitting(true);
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDemoBookingComplete(true);
      setSubmitting(false);
      toast({
        title: "Demo Booking Created!",
        description: `This is a demo booking for ${selectedService.title} on ${format(data.booking_date, "PPP")}. In a real scenario, this would create an actual booking.`,
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a service",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          photographer_id: photographerId,
          service_id: selectedService.id,
          booking_date: data.booking_date.toISOString(),
          job_details: data.job_details,
          total_amount: selectedService.price,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for the photographer
      await createNotification({
        user_id: photographerId!,
        title: "New Booking Request",
        message: `You have a new booking request for ${selectedService.title} on ${format(data.booking_date, "PPP")}`,
        type: "booking",
        related_id: bookingData.id,
        related_type: "booking",
        action_url: "/dashboard/bookings",
      });

      // Create notification for the client
      await createNotification({
        user_id: user.id,
        title: "Booking Submitted",
        message: `Your booking for ${selectedService.title} has been submitted and is pending confirmation.`,
        type: "booking",
        related_id: bookingData.id,
        related_type: "booking",
        action_url: "/dashboard/bookings",
      });

      // Call edge function to send booking confirmation
      try {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            booking_id: bookingData.id,
            client_id: user.id,
            photographer_id: photographerId,
            service_title: selectedService.title,
            booking_date: data.booking_date.toISOString(),
          },
        });
      } catch (fnError) {
        console.error('Failed to send booking confirmation:', fnError);
        // Don't fail the booking if notification fails
      }

      toast({
        title: "Booking created!",
        description: "Your booking request has been submitted successfully",
      });

      navigate('/dashboard/bookings');
    } catch (error) {
      toast({
        title: "Booking failed",
        description: "Could not create your booking. Please try again.",
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
          <p className="text-muted-foreground">Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (!photographer) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Photographer not found</h3>
          <p className="text-muted-foreground mb-4">
            The photographer you're trying to book is not available.
          </p>
          <Button onClick={() => navigate('/photographers')}>
            Back to Photographers
          </Button>
        </div>
      </div>
    );
  }

  // Demo booking success screen
  if (demoBookingComplete && isSamplePhotographer) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Demo Booking Complete!</h2>
            <p className="text-muted-foreground mb-6">
              This was a demonstration of the booking flow. In a real scenario, your booking 
              with <strong>{photographer.first_name} {photographer.last_name}</strong> for{" "}
              <strong>{selectedService?.title}</strong> would be submitted and you'd receive 
              a confirmation email.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 mb-6 text-left">
              <h4 className="font-medium mb-3">What happens in a real booking:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Your booking request is sent to the photographer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You receive a confirmation email with booking details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>The photographer reviews and confirms your booking</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You can message the photographer to discuss details</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => navigate('/photographers')}>
                Explore More Photographers
              </Button>
              <Button variant="outline" onClick={() => {
                setDemoBookingComplete(false);
                form.reset();
              }}>
                Try Another Booking
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {isSamplePhotographer && (
        <div className="mb-6 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Demo Mode:</strong> This is a sample photographer. You can experience the full booking flow, 
            but no real booking will be created. Sign up and connect with real photographers to make actual bookings!
          </p>
        </div>
      )}
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Book Photography Service</h1>
        <p className="text-muted-foreground">
          Schedule your photography session with {photographer.first_name} {photographer.last_name}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Photographer Info */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={photographer.avatar_url} />
                  <AvatarFallback>
                    {photographer.first_name?.[0]}{photographer.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{photographer.first_name} {photographer.last_name}</CardTitle>
                  {photographer.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {photographer.location}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {photographer.bio && (
                <>
                  <p className="text-sm text-muted-foreground mb-4">{photographer.bio}</p>
                  <Separator className="mb-4" />
                </>
              )}
              
              {selectedService && (
                <div className="space-y-3">
                  <h4 className="font-medium">Selected Service</h4>
                  <div className="border rounded-lg p-3 bg-muted/50">
                    <h5 className="font-medium mb-2">{selectedService.title}</h5>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedService.duration_hours}h
                      </div>
                      <div className="flex items-center gap-1 font-bold text-primary">
                        <DollarSign className="h-3 w-3" />
                        {selectedService.price}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Service Selection */}
                  {!serviceId && services.length > 0 && (
                    <div>
                      <Label className="text-base font-medium mb-3 block">Select Service</Label>
                      <div className="grid gap-3">
                        {services.map((serviceOption) => (
                          <div
                            key={serviceOption.id}
                            onClick={() => setSelectedService(serviceOption)}
                            className={cn(
                              "border rounded-lg p-4 cursor-pointer transition-colors",
                              selectedService?.id === serviceOption.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:bg-muted/50"
                            )}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{serviceOption.title}</h4>
                                {serviceOption.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {serviceOption.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-lg font-bold text-primary">
                                  <DollarSign className="h-4 w-4" />
                                  {serviceOption.price}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {serviceOption.duration_hours}h
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date Selection */}
                  <FormField
                    control={form.control}
                    name="booking_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-base font-medium">Preferred Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Job Details */}
                  <FormField
                    control={form.control}
                    name="job_details"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium">
                          Tell us about your photography needs
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your event, preferred style, number of people, special requirements, etc."
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={submitting || !selectedService}
                    className="w-full"
                  >
                    {submitting ? "Creating Booking..." : "Book Now"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookService;