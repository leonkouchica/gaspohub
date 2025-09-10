import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, DollarSign, MapPin, Camera } from "lucide-react";
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
      // Fetch photographer data
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
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to book a service",
        variant: "destructive",
      });
      return;
    }

    if (!selectedService) {
      toast({
        title: "Service required",
        description: "Please select a service to book",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          photographer_id: photographerId,
          service_id: selectedService.id,
          booking_date: data.booking_date.toISOString(),
          job_details: data.job_details,
          total_amount: selectedService.price,
        });

      if (error) throw error;

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

  return (
    <div className="container mx-auto px-6 py-8">
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