import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CreditCard, Building, DollarSign, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const PaymentSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Payment settings state
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [paystackAccountId, setPaystackAccountId] = useState("");
  
  // Commission data
  const [avgCommissionRate, setAvgCommissionRate] = useState(15);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPaymentSettings();
      fetchCommissionData();
    }
  }, [user]);

  const fetchPaymentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_settings')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setBankName(data.bank_name || "");
        setAccountNumber(data.account_number || "");
        setAccountName(data.account_name || "");
        setStripeAccountId(data.stripe_account_id || "");
        setPaystackAccountId(data.paystack_account_id || "");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionData = async () => {
    try {
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, commission_rate')
        .eq('photographer_id', user!.id);

      if (bookings && bookings.length > 0) {
        const avgRate = bookings.reduce((sum, b) => sum + (Number(b.commission_rate) || 15), 0) / bookings.length;
        const total = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
        const earnings = total - (total * (avgRate / 100));
        
        setAvgCommissionRate(Math.round(avgRate));
        setTotalEarnings(earnings);
      }
    } catch (error: any) {
      console.error('Error fetching commission data:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('payment_settings')
        .upsert({
          user_id: user.id,
          bank_name: bankName,
          account_number: accountNumber,
          account_name: accountName,
          stripe_account_id: stripeAccountId,
          paystack_account_id: paystackAccountId,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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
              {/* Bank Account Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Bank Account Details</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="bank_name">Bank Name</Label>
                    <Input
                      id="bank_name"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter your bank name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_number">Account Number</Label>
                    <Input
                      id="account_number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="Enter your account number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Enter account holder name"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Gateway IDs */}
              <div className="space-y-4">
                <h3 className="font-semibold">Payment Gateway Accounts</h3>
                
                {/* Stripe */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">Stripe</h4>
                        <Badge variant={stripeAccountId ? "default" : "secondary"}>
                          {stripeAccountId ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                      <Input
                        value={stripeAccountId}
                        onChange={(e) => setStripeAccountId(e.target.value)}
                        placeholder="Enter your Stripe Account ID"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Connect your Stripe account to accept card payments
                      </p>
                    </div>
                  </div>
                </div>

                {/* Paystack */}
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">Paystack</h4>
                        <Badge variant={paystackAccountId ? "default" : "secondary"}>
                          {paystackAccountId ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                      <Input
                        value={paystackAccountId}
                        onChange={(e) => setPaystackAccountId(e.target.value)}
                        placeholder="Enter your Paystack Account ID"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Connect your Paystack account for payments in Africa
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Payment Settings"}
              </Button>
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
                  <Label>Your Avg. Commission Rate</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      type="number"
                      value={avgCommissionRate}
                      disabled
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Average platform fee across your bookings
                  </p>
                </div>

                <div>
                  <Label>Total Earnings (After Commission)</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={`$${totalEarnings.toFixed(2)}`}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your total earnings after platform commission
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Commission rates are set by the platform</p>
                  <p>These rates help maintain and improve the platform services. Standard rate is 15% for services.</p>
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
