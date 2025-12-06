import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, Save, AlertCircle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EmailSettingsData {
  id: string;
  provider: string;
  api_key: string | null;
  from_email: string;
  from_name: string;
  is_enabled: boolean;
}

export const EmailSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('email_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setSettings(data as EmailSettingsData);
      }
    } catch (error: any) {
      console.error('Error fetching email settings:', error);
      toast({
        title: "Error",
        description: "Failed to load email settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_settings')
        .update({
          api_key: settings.api_key,
          from_email: settings.from_email,
          from_name: settings.from_name,
          is_enabled: settings.is_enabled,
          updated_at: new Date().toISOString(),
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email settings saved successfully",
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

  const updateSettings = (key: keyof EmailSettingsData, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure email notifications for order confirmations and booking updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              To send emails, you need a Resend account. Get your API key at{" "}
              <a 
                href="https://resend.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1"
              >
                resend.com/api-keys <ExternalLink className="h-3 w-3" />
              </a>
              . Don't forget to verify your domain at{" "}
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline font-medium inline-flex items-center gap-1"
              >
                resend.com/domains <ExternalLink className="h-3 w-3" />
              </a>
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Turn on to send order and booking confirmation emails
              </p>
            </div>
            <Switch
              checked={settings?.is_enabled || false}
              onCheckedChange={(checked) => updateSettings('is_enabled', checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">Resend API Key</Label>
            <Input
              id="api_key"
              type="password"
              placeholder="re_xxxxxxxxxx"
              value={settings?.api_key || ''}
              onChange={(e) => updateSettings('api_key', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your API key is stored securely and only accessible by admins
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="from_name">From Name</Label>
              <Input
                id="from_name"
                placeholder="Your Company"
                value={settings?.from_name || ''}
                onChange={(e) => updateSettings('from_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from_email">From Email</Label>
              <Input
                id="from_email"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={settings?.from_email || ''}
                onChange={(e) => updateSettings('from_email', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Use onboarding@resend.dev for testing or verify your domain first
              </p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Email Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Types</CardTitle>
          <CardDescription>
            The following emails will be sent when enabled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium">Order Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  Sent to customers when they place an order
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium">Booking Confirmation</p>
                <p className="text-sm text-muted-foreground">
                  Sent to clients and photographers when a booking is made
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
              <div>
                <p className="font-medium">Booking Status Updates</p>
                <p className="text-sm text-muted-foreground">
                  Sent when a booking is confirmed, cancelled, or completed
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
