import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Settings, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface PaymentGateway {
  id: string;
  gateway_name: string;
  display_name: string;
  is_active: boolean;
  test_mode: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function PaymentGatewaySettings() {
  const { toast } = useToast();
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_gateway_settings')
        .select('*')
        .order('display_name');

      if (error) throw error;
      
      // Type assertion since the table is new and types aren't updated
      setGateways((data as unknown as PaymentGateway[]) || []);
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

  const updateGateway = async (id: string, updates: Partial<PaymentGateway>) => {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('payment_gateway_settings')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setGateways(prev => 
        prev.map(g => g.id === id ? { ...g, ...updates } : g)
      );

      toast({
        title: "Success",
        description: "Payment gateway settings updated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const updateGatewaySettings = async (id: string, settingsKey: string, value: string) => {
    const gateway = gateways.find(g => g.id === id);
    if (!gateway) return;

    const newSettings = { ...gateway.settings, [settingsKey]: value };
    await updateGateway(id, { settings: newSettings });
  };

  const getGatewayIcon = (name: string) => {
    switch (name) {
      case 'stripe':
        return '💳';
      case 'paystack':
        return '🏦';
      case 'flutterwave':
        return '🦋';
      case 'manual':
        return '📝';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Gateway Settings</h2>
          <p className="text-muted-foreground">
            Configure payment providers for your platform
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          Test Mode Active
        </Badge>
      </div>

      <div className="grid gap-6">
        {gateways.map((gateway) => (
          <Card key={gateway.id} className={gateway.is_active ? "border-primary/50" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getGatewayIcon(gateway.gateway_name)}</span>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {gateway.display_name}
                      {gateway.is_active ? (
                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {gateway.gateway_name === 'stripe' && 'Accept credit cards, Apple Pay, Google Pay'}
                      {gateway.gateway_name === 'paystack' && 'Popular in Africa - cards, bank transfers, USSD'}
                      {gateway.gateway_name === 'flutterwave' && 'Pan-African payment gateway'}
                      {gateway.gateway_name === 'manual' && 'Bank transfer or cash payments'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {gateway.gateway_name !== 'manual' && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`test-${gateway.id}`} className="text-sm text-muted-foreground">
                        Test Mode
                      </Label>
                      <Switch
                        id={`test-${gateway.id}`}
                        checked={gateway.test_mode}
                        onCheckedChange={(checked) => updateGateway(gateway.id, { test_mode: checked })}
                        disabled={saving === gateway.id}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`active-${gateway.id}`} className="text-sm">
                      Enabled
                    </Label>
                    <Switch
                      id={`active-${gateway.id}`}
                      checked={gateway.is_active}
                      onCheckedChange={(checked) => updateGateway(gateway.id, { is_active: checked })}
                      disabled={saving === gateway.id}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {gateway.gateway_name === 'stripe' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Publishable Key</Label>
                      <Input
                        placeholder="pk_test_..."
                        value={gateway.settings.publishable_key || ''}
                        onChange={(e) => updateGatewaySettings(gateway.id, 'publishable_key', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your Stripe publishable key (safe for frontend)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Webhook Secret</Label>
                      <Input
                        type="password"
                        placeholder="whsec_..."
                        value={gateway.settings.webhook_secret || ''}
                        onChange={(e) => updateGatewaySettings(gateway.id, 'webhook_secret', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        For verifying webhook signatures
                      </p>
                    </div>
                  </div>
                )}

                {gateway.gateway_name === 'paystack' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Public Key</Label>
                      <Input
                        placeholder="pk_test_..."
                        value={gateway.settings.public_key || ''}
                        onChange={(e) => updateGatewaySettings(gateway.id, 'public_key', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Callback URL</Label>
                      <Input
                        placeholder="https://yoursite.com/payment/callback"
                        value={gateway.settings.callback_url || ''}
                        onChange={(e) => updateGatewaySettings(gateway.id, 'callback_url', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {gateway.gateway_name === 'flutterwave' && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Public Key</Label>
                      <Input
                        placeholder="FLWPUBK_TEST-..."
                        value={gateway.settings.public_key || ''}
                        onChange={(e) => updateGatewaySettings(gateway.id, 'public_key', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Redirect URL</Label>
                      <Input
                        placeholder="https://yoursite.com/payment/verify"
                        value={gateway.settings.redirect_url || ''}
                        onChange={(e) => updateGatewaySettings(gateway.id, 'redirect_url', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {gateway.gateway_name === 'manual' && (
                  <div className="space-y-2">
                    <Label>Payment Instructions</Label>
                    <Textarea
                      placeholder="Enter instructions for manual payment..."
                      value={gateway.settings.instructions || ''}
                      onChange={(e) => updateGatewaySettings(gateway.id, 'instructions', e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      These instructions will be shown to customers who choose manual payment
                    </p>
                  </div>
                )}

                {gateway.settings.supported_currencies && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Supported currencies:</span>
                    <div className="flex gap-1">
                      {gateway.settings.supported_currencies.map((currency: string) => (
                        <Badge key={currency} variant="outline" className="text-xs">
                          {currency}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Settings className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Need a different payment provider?</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Additional payment gateways can be integrated. Contact support to request 
            integration with other providers like PayPal, Square, or regional payment methods.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
