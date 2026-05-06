import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function CurrencyManager() {
  const { toast } = useToast();
  const [rates, setRates] = useState<any[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const load = async () => {
    const { data } = await supabase.from("currency_rates").select("*").order("code");
    setRates(data || []);
  };
  useEffect(() => { load(); }, []);

  const save = async (code: string) => {
    const v = parseFloat(edits[code]);
    if (isNaN(v) || v <= 0) { toast({ title: "Invalid rate", variant: "destructive" }); return; }
    const { error } = await supabase.from("currency_rates").update({ rate_to_usd: v, updated_at: new Date().toISOString() }).eq("code", code);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved" });
    setEdits((e) => { const n = { ...e }; delete n[code]; return n; });
    load();
  };
  const toggle = async (code: string, is_active: boolean) => {
    await supabase.from("currency_rates").update({ is_active }).eq("code", code);
    load();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currencies & FX Rates</CardTitle>
        <CardDescription>Static admin-managed exchange rates (1 USD = X).</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Symbol</TableHead><TableHead>Rate to USD</TableHead><TableHead>Active</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rates.map((r) => (
              <TableRow key={r.code}>
                <TableCell className="font-mono">{r.code}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.symbol}</TableCell>
                <TableCell>
                  <Input type="number" step="0.0001" value={edits[r.code] ?? r.rate_to_usd} onChange={(e) => setEdits({ ...edits, [r.code]: e.target.value })} className="w-32" />
                </TableCell>
                <TableCell><Switch checked={r.is_active} onCheckedChange={(v) => toggle(r.code, v)} /></TableCell>
                <TableCell>{edits[r.code] !== undefined && <Button size="sm" onClick={() => save(r.code)}>Save</Button>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}