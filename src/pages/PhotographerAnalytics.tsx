import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Calendar, Star, TrendingUp } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

export default function PhotographerAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    completedBookings: 0,
  });
  const [bookingsByMonth, setBookingsByMonth] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Fetch bookings stats
      const { data: bookings } = await supabase
        .from("bookings")
        .select("*, services(title, price)")
        .eq("photographer_id", user.id);

      if (bookings) {
        const completed = bookings.filter((b) => b.status === "completed");
        const totalRevenue = completed.reduce((sum, b) => sum + Number(b.total_amount || 0), 0);

        setStats({
          totalBookings: bookings.length,
          totalRevenue,
          completedBookings: completed.length,
          averageRating: 0,
        });

        // Group by month
        const monthlyData = bookings.reduce((acc: any, booking) => {
          const month = new Date(booking.booking_date).toLocaleDateString("en-US", { month: "short" });
          if (!acc[month]) {
            acc[month] = { month, count: 0, revenue: 0 };
          }
          acc[month].count += 1;
          if (booking.status === "completed") {
            acc[month].revenue += Number(booking.total_amount || 0);
          }
          return acc;
        }, {});

        setBookingsByMonth(Object.values(monthlyData));

        // Service distribution
        const serviceData = bookings.reduce((acc: any, booking: any) => {
          const serviceName = booking.services?.title || "Unknown";
          if (!acc[serviceName]) {
            acc[serviceName] = { name: serviceName, value: 0 };
          }
          acc[serviceName].value += 1;
          return acc;
        }, {});

        setServiceDistribution(Object.values(serviceData));
      }

      // Fetch reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("photographer_id", user.id);

      if (reviews && reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        setStats((prev) => ({ ...prev, averageRating: avgRating }));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container py-8">Loading analytics...</div>;
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Track your performance and grow your business</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From completed bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">{stats.completedBookings} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Out of 5 stars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalBookings > 0 ? ((stats.completedBookings / stats.totalBookings) * 100).toFixed(0) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Bookings completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Bookings</CardTitle>
            <CardDescription>Number of bookings per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Distribution</CardTitle>
            <CardDescription>Bookings by service type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={serviceDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {serviceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
