import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface TaxRow {
  id: string;
  country_code: string;
  region_code: string | null;
  label: string;
  rate_percent: number;
  is_active: boolean;
}

export function TaxRatesManager() {
  const [rows, setRows] = useState<TaxRow[]>([]);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [label, setLabel] = useState("");
  const [rate, setRate] = useState("0");

  const load = async () => {
    const { data } = await supabase.from("tax_rates" as any).select("*").order("country_code");
    setRows((data as any) || []);
  };

  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!country || !label) return toast.error("Country and label required");
    const { error } = await supabase.from("tax_rates" as any).insert({
      country_code: country.toUpperCase(),
      region_code: region ? region.toUpperCase() : null,
      label,
      rate_percent: parseFloat(rate) || 0,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Tax rate added");
    setCountry(""); setRegion(""); setLabel(""); setRate("0");
    load();
  };

  const toggle = async (r: TaxRow) => {
    await supabase.from("tax_rates" as any).update({ is_active: !r.is_active }).eq("id", r.id);
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("tax_rates" as any).delete().eq("id", id);
    load();
  };

  return (
    <Card>
      <CardHeader><CardTitle>Tax / VAT Rates</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-5">
          <div><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="US" maxLength={2} /></div>
          <div><Label>Region</Label><Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="CA (opt.)" /></div>
          <div className="sm:col-span-2"><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="VAT" /></div>
          <div><Label>Rate %</Label><Input type="number" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
        </div>
        <Button onClick={add}>Add rate</Button>
        <Table>
          <TableHeader><TableRow>
            <TableHead>Country</TableHead><TableHead>Region</TableHead><TableHead>Label</TableHead>
            <TableHead>Rate</TableHead><TableHead>Active</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.country_code}</TableCell>
                <TableCell>{r.region_code || "—"}</TableCell>
                <TableCell>{r.label}</TableCell>
                <TableCell>{r.rate_percent}%</TableCell>
                <TableCell><Switch checked={r.is_active} onCheckedChange={() => toggle(r)} /></TableCell>
                <TableCell><Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No tax rates configured</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}