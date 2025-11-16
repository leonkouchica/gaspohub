import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, Clock, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Payout {
  id: string;
  amount: number;
  payout_type: string;
  status: string;
  payment_method: string | null;
  transaction_reference: string | null;
  notes: string | null;
  released_at: string | null;
  completed_at: string | null;
  created_at: string;
  booking_id: string | null;
  order_id: string | null;
}

export default function Payouts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    if (user) {
      fetchPayouts();
    }
  }, [user]);

  const fetchPayouts = async () => {
    try {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .eq("photographer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPayouts(data || []);
      calculateStats(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading payouts",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (payoutData: Payout[]) => {
    const pending = payoutData
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const processing = payoutData
      .filter((p) => p.status === "processing")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const completed = payoutData
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const totalEarnings = payoutData.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    );

    setStats({ pending, processing, completed, totalEarnings });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      pending: "outline",
      processing: "secondary",
      completed: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getPayoutTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      initial: "Initial Payment",
      final: "Final Payment",
      order_commission: "Order Commission",
    };
    return labels[type] || type;
  };

  const filterByStatus = (status: string) => {
    if (status === "all") return payouts;
    return payouts.filter((p) => p.status === status);
  };

  if (loading) {
    return <div className="container py-8">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Payouts</h1>
        <p className="text-muted-foreground">
          Track your earnings and payment history
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalEarnings.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.pending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.processing.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.completed.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Payouts</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        {["all", "pending", "processing", "completed", "failed"].map(
          (status) => (
            <TabsContent key={status} value={status} className="space-y-4">
              {filterByStatus(status).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No payouts found</p>
                    <p className="text-muted-foreground">
                      {status === "all"
                        ? "You don't have any payouts yet"
                        : `No ${status} payouts`}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filterByStatus(status).map((payout) => (
                  <Card key={payout.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {getPayoutTypeLabel(payout.payout_type)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Created: {format(new Date(payout.created_at), "PPP")}
                          </p>
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Amount:</span>
                        <span className="font-bold text-xl">
                          ${Number(payout.amount).toFixed(2)}
                        </span>
                      </div>

                      {payout.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Payment Method:
                          </span>
                          <span className="font-medium">
                            {payout.payment_method}
                          </span>
                        </div>
                      )}

                      {payout.transaction_reference && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Reference:
                          </span>
                          <span className="font-mono text-sm">
                            {payout.transaction_reference}
                          </span>
                        </div>
                      )}

                      {payout.released_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Released:
                          </span>
                          <span className="text-sm">
                            {format(new Date(payout.released_at), "PPP")}
                          </span>
                        </div>
                      )}

                      {payout.completed_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Completed:
                          </span>
                          <span className="text-sm">
                            {format(new Date(payout.completed_at), "PPP")}
                          </span>
                        </div>
                      )}

                      {payout.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">
                            Notes: {payout.notes}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
