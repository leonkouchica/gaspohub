import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Clock, DollarSign, MapPin, Camera, CheckCircle, CreditCard, Loader2, AlertCircle } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { getActiveTaxRates, calcTax, type TaxRate } from "@/lib/tax";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface PaymentGateway {
  id: string;
  gateway_name: string;
  display_name: string;
  is_active: boolean;
  test_mode: boolean;
  settings: Record<string, any>;
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

  // Payment state
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Tax state
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [selectedTaxRateId, setSelectedTaxRateId] = useState<string>("");

  const form = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
  });

  useEffect(() => {
    if (photographerId) {
      fetchData();
    }
    fetchPaymentGateways();
    getActiveTaxRates().then((rates) => setTaxRates(rates));
  }, [photographerId, serviceId]);

  const fetchPaymentGateways = async () => {
    const { data, error } = await supabase
      .from('payment_gateway_settings')
      .select('*')
      .eq('is_active', true)
      .order('display_name');

    if (!error && data) {
      setPaymentGateways(data as unknown as PaymentGateway[]);
      if (data.length > 0) {
        setSelectedGateway((data[0] as any).gateway_name);
      }
    }
  };

  const fetchData = async () => {
    try {
      // Check if this is a sample photographer
      const sampleData = photographerId ? buildSamplePhotographerData(photographerId) : null;
      if (sampleData) {
        setPhotographer(sampleData.photographer);
        setServices(sampleData.services);
        setIsSamplePhotographer(true);

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

      const { data: photographerData, error: photographerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', photographerId)
        .single();

      if (photographerError) throw photographerError;

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('photographer_id', photographerId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      setPhotographer(photographerData);
      setServices(servicesData || []);

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

  const getGatewayIcon = (name: string) => {
    switch (name) {
      case 'stripe': return '💳';
      case 'paystack': return '🏦';
      case 'flutterwave': return '🦋';
      case 'manual': return '📝';
      default: return '💰';
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
    setPaymentResult(null);

    try {
      // 1. Compute tax
      const taxRate = taxRates.find((r) => r.id === selectedTaxRateId);
      const subtotal = selectedService.price;
      const { tax, total } = taxRate ? calcTax(subtotal, taxRate.rate_percent) : { tax: 0, total: subtotal };

      // 2. Create the booking
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .insert({
          client_id: user.id,
          photographer_id: photographerId,
          service_id: selectedService.id,
          booking_date: data.booking_date.toISOString(),
          job_details: data.job_details,
          total_amount: total,
          tax_amount: tax,
          tax_rate_id: taxRate?.id ?? null,
          payment_status: selectedGateway ? 'processing' : 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Process payment if a gateway is selected
      if (selectedGateway) {
        try {
          const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
            'process-booking-payment',
            {
              body: {
                bookingId: bookingData.id,
                amount: total,
                currency: 'USD',
                gateway: selectedGateway,
                customerEmail: user.email,
                metadata: {
                  service: selectedService.title,
                  photographer: `${photographer?.first_name} ${photographer?.last_name}`,
                  date: format(data.booking_date, "PPP"),
                  tax_amount: tax,
                  tax_rate: taxRate?.label,
                }
              }
            }
          );

          if (paymentError) throw paymentError;

          setPaymentResult(paymentData);

          if (paymentData?.success) {
            // Update booking payment status
            await supabase
              .from('bookings')
              .update({
                payment_status: paymentData.status === 'completed' ? 'paid' : 'pending',
              })
              .eq('id', bookingData.id);
          } else {
            // Payment failed, update status
            await supabase
              .from('bookings')
              .update({ payment_status: 'failed' })
              .eq('id', bookingData.id);
          }
        } catch (paymentErr) {
          console.error('Payment processing error:', paymentErr);
          // Booking still created, payment can be retried
          await supabase
            .from('bookings')
            .update({ payment_status: 'pending' })
            .eq('id', bookingData.id);
        }
      }

      // 3. Send notifications
      await createNotification({
        user_id: photographerId!,
        title: "New Booking Request",
        message: `You have a new booking request for ${selectedService.title} on ${format(data.booking_date, "PPP")}`,
        type: "booking",
        related_id: bookingData.id,
        related_type: "booking",
        action_url: "/dashboard/bookings",
      });

      await createNotification({
        user_id: user.id,
        title: "Booking Submitted",
        message: `Your booking for ${selectedService.title} has been submitted and is pending confirmation.`,
        type: "booking",
        related_id: bookingData.id,
        related_type: "booking",
        action_url: "/dashboard/bookings",
      });

      // 4. Send booking confirmation
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
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-primary" />
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
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Payment is processed via your selected payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Your booking request is sent to the photographer</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>You receive a confirmation with booking details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
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
        <div className="mb-6 p-4 rounded-lg bg-accent/50 border border-accent">
          <p className="text-sm text-accent-foreground">
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

                  {/* Payment Method Selection */}
                  {!isSamplePhotographer && (
                    <div>
                      <Label className="text-base font-medium mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Method
                      </Label>
                      {paymentGateways.length === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                          <AlertCircle className="h-4 w-4" />
                          <span>No payment methods available. Your booking will be created with pending payment status.</span>
                        </div>
                      ) : (
                        <RadioGroup
                          value={selectedGateway}
                          onValueChange={setSelectedGateway}
                          className="space-y-2"
                        >
                          {paymentGateways.map((gateway) => (
                            <div
                              key={gateway.id}
                              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                selectedGateway === gateway.gateway_name
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <RadioGroupItem value={gateway.gateway_name} id={`booking-${gateway.gateway_name}`} />
                              <Label
                                htmlFor={`booking-${gateway.gateway_name}`}
                                className="flex-1 cursor-pointer flex items-center gap-3"
                              >
                                <span className="text-lg">{getGatewayIcon(gateway.gateway_name)}</span>
                                <div>
                                  <div className="font-medium text-sm">{gateway.display_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {gateway.gateway_name === 'stripe' && 'Credit card, Apple Pay, Google Pay'}
                                    {gateway.gateway_name === 'paystack' && 'Cards, bank transfer, USSD'}
                                    {gateway.gateway_name === 'flutterwave' && 'Cards, mobile money, bank'}
                                    {gateway.gateway_name === 'manual' && 'Bank transfer or cash payment'}
                                  </div>
                                </div>
                                {gateway.test_mode && (
                                  <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded">
                                    Test
                                  </span>
                                )}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  )}

                  {/* Price Summary */}
                  {selectedService && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      {taxRates.length > 0 && (
                        <div className="mb-3">
                          <Label className="text-sm">Tax region</Label>
                          <Select value={selectedTaxRateId} onValueChange={setSelectedTaxRateId}>
                            <SelectTrigger><SelectValue placeholder="No tax" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">No tax</SelectItem>
                              {taxRates.map((r) => (
                                <SelectItem key={r.id} value={r.id}>{r.label} ({r.rate_percent}%)</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      {(() => {
                        const tr = taxRates.find((r) => r.id === selectedTaxRateId);
                        const { tax, total } = tr ? calcTax(selectedService.price, tr.rate_percent) : { tax: 0, total: selectedService.price };
                        return (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>${selectedService.price.toFixed(2)}</span></div>
                            {tr && <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Tax ({tr.rate_percent}%)</span><span>${tax.toFixed(2)}</span></div>}
                            <div className="flex items-center justify-between pt-1 border-t"><span className="font-medium">Total</span><span className="text-xl font-bold text-primary">${total.toFixed(2)}</span></div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={submitting || !selectedService}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : selectedGateway ? (
                      `Pay $${selectedService?.price || 0} & Book Now`
                    ) : (
                      "Book Now"
                    )}
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
