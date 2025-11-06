import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CreditCard, Building, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PaymentSettings = () => {
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [paystackEnabled, setPaystackEnabled] = useState(false);
  const { toast } = useToast();

  const handleConnectStripe = () => {
    toast({
      title: "Coming Soon",
      description: "Stripe integration will be available once you set up your account",
    });
  };

  const handleConnectPaystack = () => {
    toast({
      title: "Coming Soon",
      description: "Paystack integration will be available once you set up your account",
    });
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payment Settings</h1>
        <p className="text-muted-foreground">
          Configure your payment processing options
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Gateway Status */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Gateway Status</CardTitle>
              <CardDescription>
                Connect your payment processing accounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stripe */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Stripe</h3>
                      <Badge variant={stripeEnabled ? "default" : "secondary"}>
                        {stripeEnabled ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Accept credit cards, debit cards, and digital wallets
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConnectStripe}
                  variant={stripeEnabled ? "outline" : "default"}
                  size="sm"
                >
                  {stripeEnabled ? "Manage" : "Connect"}
                </Button>
              </div>

              <Separator />

              {/* Paystack */}
              <div className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Paystack</h3>
                      <Badge variant={paystackEnabled ? "default" : "secondary"}>
                        {paystackEnabled ? "Connected" : "Not Connected"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Accept payments from customers in Africa
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConnectPaystack}
                  variant={paystackEnabled ? "outline" : "default"}
                  size="sm"
                >
                  {paystackEnabled ? "Manage" : "Connect"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commission Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Settings</CardTitle>
              <CardDescription>
                Platform commission rates for your transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="service_commission">Service Bookings</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="service_commission"
                      type="number"
                      defaultValue="15"
                      disabled
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Platform fee for service bookings
                  </p>
                </div>

                <div>
                  <Label htmlFor="product_commission">Product Sales</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      id="product_commission"
                      type="number"
                      defaultValue="10"
                      disabled
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Platform fee for product sales
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Commission rates are set by the platform</p>
                  <p>These rates help maintain and improve the platform services.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Getting Started</h4>
                <p className="text-muted-foreground">
                  To start accepting payments, you'll need to:
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Create a Stripe or Paystack account</li>
                  <li>Complete account verification</li>
                  <li>Connect your account here</li>
                </ol>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Payment Processing</h4>
                <p className="text-muted-foreground">
                  Payments are processed securely through your chosen gateway.
                  Funds are transferred according to your gateway's payout schedule.
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Need Help?</h4>
                <p className="text-muted-foreground mb-2">
                  Contact our support team for assistance with payment setup.
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentSettings;
