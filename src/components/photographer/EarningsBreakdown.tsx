import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  CheckCircle2, 
  TrendingUp,
  DollarSign
} from "lucide-react";

interface PayoutSummary {
  totalEarned: number;
  totalPending: number;
  totalCompleted: number;
  totalCommission: number;
  initialCompleted: number;
  finalCompleted: number;
  finalPending: number;
  payoutCount: number;
}

export function EarningsBreakdown() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<PayoutSummary>({
    totalEarned: 0,
    totalPending: 0,
    totalCompleted: 0,
    totalCommission: 0,
    initialCompleted: 0,
    finalCompleted: 0,
    finalPending: 0,
    payoutCount: 0,
  });
  const [recentPayouts, setRecentPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchEarnings();
  }, [user]);

  const fetchEarnings = async () => {
    if (!user) return;
    try {
      // Fetch all payouts
      const { data: payouts } = await supabase
        .from("payouts")
        .select("*")
        .eq("photographer_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch bookings for commission data
      const { data: bookings } = await supabase
        .from("bookings")
        .select("total_amount, commission_rate, payment_status")
        .eq("photographer_id", user.id)
        .in("payment_status", ["escrowed", "partial_paid", "completed"]);

      if (payouts) {
        const completed = payouts.filter((p) => p.status === "completed");
        const pending = payouts.filter((p) => p.status === "pending");

        const totalCompleted = completed.reduce((s, p) => s + Number(p.amount), 0);
        const totalPending = pending.reduce((s, p) => s + Number(p.amount), 0);

        const initialCompleted = completed
          .filter((p) => p.payout_type === "initial")
          .reduce((s, p) => s + Number(p.amount), 0);
        const finalCompleted = completed
          .filter((p) => p.payout_type === "final")
          .reduce((s, p) => s + Number(p.amount), 0);
        const finalPending = pending
          .filter((p) => p.payout_type === "final")
          .reduce((s, p) => s + Number(p.amount), 0);

        const totalCommission = (bookings || []).reduce((s, b) => {
          const rate = Number(b.commission_rate) || 10;
          return s + Number(b.total_amount) * (rate / 100);
        }, 0);

        setSummary({
          totalEarned: totalCompleted + totalPending,
          totalPending,
          totalCompleted,
          totalCommission,
          initialCompleted,
          finalCompleted,
          finalPending,
          payoutCount: payouts.length,
        });

        setRecentPayouts(payouts.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading earnings...
        </CardContent>
      </Card>
    );
  }

  const completionPercent =
    summary.totalEarned > 0
      ? (summary.totalCompleted / summary.totalEarned) * 100
      : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Earnings Breakdown
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Top-level summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold">${summary.totalEarned.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total Earned</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-2xl font-bold text-green-600">
              ${summary.totalCompleted.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <Clock className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-500">
              ${summary.totalPending.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Payout Progress</span>
            <span className="font-medium">{completionPercent.toFixed(0)}% released</span>
          </div>
          <Progress value={completionPercent} className="h-2" />
        </div>

        <Separator />

        {/* Detailed breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Breakdown
          </h4>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-sm">Initial Releases (60%)</span>
            </div>
            <span className="font-medium text-green-600">
              ${summary.initialCompleted.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-green-600" />
              <span className="text-sm">Final Releases (40%)</span>
            </div>
            <span className="font-medium text-green-600">
              ${summary.finalCompleted.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Awaiting Release</span>
            </div>
            <span className="font-medium text-amber-500">
              ${summary.finalPending.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-t pt-3">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-destructive" />
              <span className="text-sm">Platform Commission</span>
            </div>
            <span className="font-medium text-destructive">
              -${summary.totalCommission.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Recent payouts */}
        {recentPayouts.length > 0 && (
          <>
            <Separator />
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Recent Payouts
              </h4>
              {recentPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={payout.status === "completed" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {payout.payout_type}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${Number(payout.amount).toFixed(2)}</span>
                    {payout.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 text-amber-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
