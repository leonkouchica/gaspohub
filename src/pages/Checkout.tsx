import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, MapPin, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createNotification } from "@/lib/notifications";
import { findTaxRate, calcTax, type TaxRate } from "@/lib/tax";

interface PaymentGateway {
  id: string;
  gateway_name: string;
  display_name: string;
  is_active: boolean;
  test_mode: boolean;
  settings: Record<string, any>;
}

export default function Checkout() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string>("");
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });
  const [taxRate, setTaxRate] = useState<TaxRate | null>(null);

  const hasPhysicalItems = items.some((item) => !item.is_digital);
  const commissionRate = 0.15;
  const commissionAmount = totalPrice * commissionRate;
  const { tax: taxAmount, total: grandTotal } = calcTax(totalPrice, taxRate?.rate_percent || 0);

  useEffect(() => {
    fetchPaymentGateways();
  }, []);

  useEffect(() => {
    if (shippingAddress.country) {
      findTaxRate(shippingAddress.country, shippingAddress.state).then(setTaxRate);
    } else {
      setTaxRate(null);
    }
  }, [shippingAddress.country, shippingAddress.state]);

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

  const getGatewayIcon = (name: string) => {
    switch (name) {
      case 'stripe': return '💳';
      case 'paystack': return '🏦';
      case 'flutterwave': return '🦋';
      case 'manual': return '📝';
      default: return '💰';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to checkout",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to your cart before checking out",
        variant: "destructive",
      });
      return;
    }

    if (!selectedGateway) {
      toast({
        title: "Select payment method",
        description: "Please select a payment method to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setPaymentResult(null);

    try {
      // Create order first
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          client_id: user.id,
          total_amount: grandTotal,
          commission_amount: commissionAmount,
          shipping_address: hasPhysicalItems ? shippingAddress : null,
          status: "pending",
          tax_amount: taxAmount,
          tax_rate_id: taxRate?.id ?? null,
        } as any)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Process payment
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'process-payment',
        {
          body: {
            orderId: order.id,
            amount: grandTotal,
            currency: 'USD',
            gateway: selectedGateway,
            customerEmail: user.email,
            metadata: {
              items: items.map(i => ({ id: i.id, title: i.title, quantity: i.quantity }))
            }
          }
        }
      );

      if (paymentError) throw paymentError;

      setPaymentResult(paymentData);

      if (paymentData.success) {
        // Create notifications for photographers
        const photographerIds = [...new Set(items.map((item) => item.photographer_id))];
        for (const photographerId of photographerIds) {
          await createNotification({
            user_id: photographerId,
            title: "New Order Received",
            message: `You have received a new order #${order.id.slice(0, 8)}`,
            type: "payment",
            related_id: order.id,
            related_type: "order",
            action_url: "/dashboard",
          });
        }

        // Notify client
        await createNotification({
          user_id: user.id,
          title: "Order Placed",
          message: `Your order #${order.id.slice(0, 8)} has been placed successfully`,
          type: "payment",
          related_id: order.id,
          related_type: "order",
          action_url: "/dashboard/orders",
        });

        clearCart();
        toast({
          title: "Order placed!",
          description: paymentData.message || "Your order has been placed successfully",
        });

        // Delay navigation for manual payments to show instructions
        if (selectedGateway === 'manual') {
          setTimeout(() => navigate("/dashboard/orders"), 3000);
        } else {
          navigate("/dashboard/orders");
        }
      } else {
        toast({
          title: "Payment failed",
          description: paymentData.error || "There was an error processing your payment",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "There was an error processing your order",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => navigate("/shop")}>Go to Shop</Button>
      </div>
    );
  }

  // Show payment result for manual payments
  if (paymentResult?.success && selectedGateway === 'manual') {
    return (
      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle>Order Placed Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">{paymentResult.message}</p>
            <div className="bg-muted p-4 rounded-lg text-left">
              <h4 className="font-semibold mb-2">Payment Instructions:</h4>
              <p className="text-sm">{paymentResult.instructions}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Transaction ID: {paymentResult.transactionId}
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate("/dashboard/orders")} className="w-full">
              View My Orders
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="Checkout"
        description="Complete your purchase securely."
      />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            {hasPhysicalItems && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={shippingAddress.street}
                      onChange={(e) =>
                        setShippingAddress({ ...shippingAddress, street: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, city: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, state: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input
                        id="zip"
                        value={shippingAddress.zip}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, zip: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={shippingAddress.country}
                        onChange={(e) =>
                          setShippingAddress({ ...shippingAddress, country: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentGateways.length === 0 ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>No payment methods available. Please contact support.</span>
                  </div>
                ) : (
                  <RadioGroup
                    value={selectedGateway}
                    onValueChange={setSelectedGateway}
                    className="space-y-3"
                  >
                    {paymentGateways.map((gateway) => (
                      <div
                        key={gateway.id}
                        className={`flex items-center space-x-3 p-4 rounded-lg border transition-colors ${
                          selectedGateway === gateway.gateway_name
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value={gateway.gateway_name} id={gateway.gateway_name} />
                        <Label
                          htmlFor={gateway.gateway_name}
                          className="flex-1 cursor-pointer flex items-center gap-3"
                        >
                          <span className="text-xl">{getGatewayIcon(gateway.gateway_name)}</span>
                          <div>
                            <div className="font-medium">{gateway.display_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {gateway.gateway_name === 'stripe' && 'Credit card, Apple Pay, Google Pay'}
                              {gateway.gateway_name === 'paystack' && 'Cards, bank transfer, USSD'}
                              {gateway.gateway_name === 'flutterwave' && 'Cards, mobile money, bank'}
                              {gateway.gateway_name === 'manual' && 'Bank transfer or cash payment'}
                            </div>
                          </div>
                          {gateway.test_mode && (
                            <span className="ml-auto text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded">
                              Test Mode
                            </span>
                          )}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.title} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || paymentGateways.length === 0}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay $${totalPrice.toFixed(2)}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
      </div>
    </>
  );
}
