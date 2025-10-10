import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Calendar, Camera, ShoppingBag, Users, TrendingUp, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";

interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  totalSpent: number;
  favoritePhotographers: number;
}

interface RecentBooking {
  id: string;
  booking_date: string;
  status: string;
  total_amount: number;
  services: {
    title: string;
  };
  profiles: {
    first_name: string;
    last_name: string;
  };
}

interface TrendingService {
  id: string;
  title: string;
  price: number;
  photographer_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    upcomingBookings: 0,
    totalSpent: 0,
    favoritePhotographers: 0,
  });
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [trendingServices, setTrendingServices] = useState<TrendingService[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch user's bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch related data for each booking
      const bookingsWithData = await Promise.all(
        (bookings || []).map(async (booking) => {
          const { data: serviceData } = await supabase
            .from('services')
            .select('title')
            .eq('id', booking.service_id)
            .single();

          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name')
            .eq('id', booking.photographer_id)
            .single();

          return {
            ...booking,
            services: serviceData || { title: '' },
            profiles: profileData || { first_name: '', last_name: '' }
          };
        })
      );

      // Calculate stats
      const now = new Date();
      const totalBookings = bookingsWithData.length;
      const upcomingBookings = bookingsWithData.filter(booking => 
        new Date(booking.booking_date) > now && booking.status !== 'cancelled'
      ).length;
      const totalSpent = bookingsWithData.reduce((sum, booking) => 
        sum + (booking.total_amount || 0), 0
      );

      setStats({
        totalBookings,
        upcomingBookings,
        totalSpent,
        favoritePhotographers: 0, // TODO: implement favorites
      });

      setRecentBookings(bookingsWithData.slice(0, 5));

      // Fetch trending services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .limit(4);

      if (servicesData) {
        const servicesWithProfiles = await Promise.all(
          servicesData.map(async (service) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('first_name, last_name, avatar_url')
              .eq('id', service.photographer_id)
              .single();

            return {
              ...service,
              profiles: profileData || {
                first_name: '',
                last_name: '',
                avatar_url: ''
              }
            };
          })
        );
        setTrendingServices(servicesWithProfiles);
      }
    } catch (error) {
      toast({
        title: "Error loading dashboard",
        description: "Failed to fetch your dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumbs />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.user_metadata?.first_name || user?.email?.split('@')[0]}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your photography bookings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">Scheduled sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalSpent}</div>
            <p className="text-xs text-muted-foreground">All time spending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photographers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoritePhotographers}</div>
            <p className="text-xs text-muted-foreground">In your network</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Bookings
                <Button asChild variant="outline" size="sm">
                  <Link to="/bookings">View All</Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by browsing photographers and their services
                  </p>
                  <Button asChild>
                    <Link to="/photographers">Find Photographers</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{booking.services?.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          with {booking.profiles?.first_name} {booking.profiles?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <StatusBadge variant={getStatusVariant(booking.status)}>
                          {booking.status}
                        </StatusBadge>
                        <p className="text-sm font-medium mt-1">
                          ${booking.total_amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Trending */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" size="lg">
                <Link to="/photographers">
                  <Camera className="mr-2 h-4 w-4" />
                  Find Photographers
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/services">
                  <Calendar className="mr-2 h-4 w-4" />
                  Browse Services
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/shop">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Visit Shop
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full" size="lg">
                <Link to="/bookings">
                  <Clock className="mr-2 h-4 w-4" />
                  My Bookings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Trending Services Widget */}
          {trendingServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Trending Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingServices.map((service) => (
                  <div key={service.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={service.profiles?.avatar_url} />
                      <AvatarFallback>
                        {service.profiles?.first_name?.[0]}
                        {service.profiles?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{service.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        by {service.profiles?.first_name} {service.profiles?.last_name}
                      </p>
                      <p className="text-sm font-semibold text-primary mt-1">
                        ${service.price}
                      </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/book/${service.photographer_id}/${service.id}`}>
                        Book
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;