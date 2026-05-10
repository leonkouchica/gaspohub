import { useEffect, useState } from "react";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { SEO } from "@/components/SEO";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff } from "lucide-react";

export default function TwoFactor() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState<string>("");
  const [qr, setQr] = useState<string>("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_two_factor" as any).select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }: any) => { if (data) { setEnabled(!!data.is_enabled); setBackupCodes(data.backup_codes || []); } setLoading(false); });
  }, [user]);

  const startSetup = async () => {
    if (!user) return;
    const totp = new OTPAuth.TOTP({ issuer: "GaspoHub", label: user.email || user.id, algorithm: "SHA1", digits: 6, period: 30, secret: new OTPAuth.Secret({ size: 20 }) });
    const sec = totp.secret.base32;
    setSecret(sec);
    const url = totp.toString();
    const dataUrl = await QRCode.toDataURL(url);
    setQr(dataUrl);
  };

  const verifyAndEnable = async () => {
    if (!user || !secret) return;
    const totp = new OTPAuth.TOTP({ issuer: "GaspoHub", label: user.email || user.id, secret: OTPAuth.Secret.fromBase32(secret) });
    const delta = totp.validate({ token: code.trim(), window: 1 });
    if (delta === null) return toast.error("Invalid code");
    const codes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10).toUpperCase());
    const { error } = await supabase.from("user_two_factor" as any).upsert({
      user_id: user.id, method: "totp", secret, is_enabled: true, backup_codes: codes, last_verified_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    setEnabled(true); setBackupCodes(codes); setQr(""); setSecret(""); setCode("");
    toast.success("Two-factor authentication enabled");
  };

  const disable = async () => {
    if (!user) return;
    const { error } = await supabase.from("user_two_factor" as any).update({ is_enabled: false, secret: null }).eq("user_id", user.id);
    if (error) return toast.error(error.message);
    setEnabled(false); setBackupCodes([]); toast.success("Two-factor disabled");
  };

  return (
    <>
      <SEO title="Two-Factor Authentication" description="Secure your account with TOTP-based 2FA." />
      <div className="container mx-auto p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">Two-Factor Authentication</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {enabled ? <ShieldCheck className="text-green-500" /> : <ShieldOff className="text-muted-foreground" />}
              Status: <Badge variant={enabled ? "default" : "secondary"}>{enabled ? "Enabled" : "Disabled"}</Badge>
            </CardTitle>
            <CardDescription>Use an authenticator app like Google Authenticator, Authy or 1Password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p>Loading…</p> : enabled ? (
              <>
                {backupCodes.length > 0 && (
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm font-medium mb-2">Backup codes (store securely):</p>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      {backupCodes.map((c) => <div key={c}>{c}</div>)}
                    </div>
                  </div>
                )}
                <Button variant="destructive" onClick={disable}>Disable 2FA</Button>
              </>
            ) : qr ? (
              <>
                <img src={qr} alt="2FA QR code" className="mx-auto" />
                <p className="text-xs text-muted-foreground break-all">Or enter this secret: <code>{secret}</code></p>
                <div>
                  <Label htmlFor="code">Enter the 6-digit code from your app</Label>
                  <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
                </div>
                <Button onClick={verifyAndEnable}>Verify & Enable</Button>
              </>
            ) : (
              <Button onClick={startSetup}>Set up 2FA</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}