import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, Camera, ShoppingCart, CheckCircle, XCircle, Clock, Calendar, Package, MessageSquare, Eye, EyeOff, TrendingUp, DollarSign, BarChart3, Star, CreditCard, Mail, AlertTriangle, Image, Wallet, RefreshCw } from "lucide-react";
import { DisputeManagement } from "@/components/admin/DisputeManagement";
import { RefundManagement } from "@/components/admin/RefundManagement";
import { PaymentGatewaySettings } from "@/components/admin/PaymentGatewaySettings";
import { EmailSettings } from "@/components/admin/EmailSettings";
import { AdvertisementSettings } from "@/components/admin/AdvertisementSettings";
import { PayoutReleasePanel } from "@/components/admin/PayoutReleasePanel";
import { Navigate, useSearchParams } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { createNotification } from "@/lib/notifications";
interface UserWithRoles {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: string[];
}

interface PendingPhotographer {
  id: string;
  user_id: string;
  specialties: string[];
  is_approved: boolean;
  created_at: string;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

interface AdminOrder {
  id: string;
  total_amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  order_items: {
    quantity: number;
    products: {
      title: string;
    };
  }[];
}

interface AdminBooking {
  id: string;
  booking_date: string;
  total_amount: number;
  commission_rate: number;
  status: string;
  payment_status: string;
  initial_payment_released: boolean;
  final_payment_released: boolean;
  created_at: string;
  client_profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  photographer_profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  services: {
    title: string;
  };
}

interface AdminProduct {
  id: string;
  title: string;
  price: number;
  is_active: boolean;
  is_digital: boolean;
  category: string | null;
  created_at: string;
  profiles: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  is_public: boolean;
  is_approved: boolean | null;
  moderation_notes: string | null;
  moderated_at: string | null;
  created_at: string;
  reviewer_id: string;
  photographer_id: string;
  reviewer_profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
  photographer_profile: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

interface AnalyticsData {
  totalRevenue: number;
  totalCommission: number;
  totalUsers: number;
  totalBookings: number;
  totalOrders: number;
  monthlyRevenue: { month: string; revenue: number; commission: number }[];
  userGrowth: { month: string; users: number }[];
  bookingStats: { status: string; count: number }[];
  orderStats: { status: string; count: number }[];
}

interface AuditLog {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_user_id: string | null;
  target_resource_id: string | null;
  details: any;
  created_at: string;
  admin_profile?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [photographers, setPhotographers] = useState<PendingPhotographer[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const currentTab = searchParams.get('tab') || 'analytics';

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) throw error;
      setIsAdmin(data);
      if (data) {
        fetchAllData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsAdmin(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsers(),
        fetchPhotographers(),
        fetchOrders(),
        fetchBookings(),
        fetchProducts(),
        fetchReviews(),
        fetchAuditLogs(),
      ]);
      calculateAnalytics();
    } finally {
      setLoading(false);
    }
  };

  const logAdminAction = async (actionType: string, targetUserId?: string, targetResourceId?: string, details?: any) => {
    try {
      await supabase.from('admin_audit_log').insert({
        admin_user_id: user!.id,
        action_type: actionType,
        target_user_id: targetUserId || null,
        target_resource_id: targetResourceId || null,
        details: details || null,
      });
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const { data: logs, error } = await supabase
        .from('admin_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (logs) {
        const adminIds = [...new Set(logs.map(log => log.admin_user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, first_name, last_name')
          .in('id', adminIds);

        const enrichedLogs = logs.map(log => {
          const profile = profiles?.find(p => p.id === log.admin_user_id);
          return {
            ...log,
            admin_profile: profile || { email: 'Unknown', first_name: null, last_name: null }
          };
        });

        setAuditLogs(enrichedLogs);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const calculateAnalytics = () => {
    // Calculate total revenue and commission
    const bookingRevenue = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
    const bookingCommission = bookings.reduce((sum, b) => sum + Number(b.total_amount) * (Number(b.commission_rate) || 15) / 100, 0);
    const orderRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const orderCommission = orders.reduce((sum, o) => sum + Number(o.commission_amount), 0);

    // Monthly revenue data (last 6 months)
    const monthlyData: Record<string, { revenue: number; commission: number }> = {};
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return d.toISOString().substring(0, 7);
    }).reverse();

    last6Months.forEach(month => {
      monthlyData[month] = { revenue: 0, commission: 0 };
    });

    bookings.forEach(b => {
      const month = b.created_at.substring(0, 7);
      if (monthlyData[month]) {
        monthlyData[month].revenue += Number(b.total_amount);
        monthlyData[month].commission += Number(b.total_amount) * (Number(b.commission_rate) || 15) / 100;
      }
    });

    orders.forEach(o => {
      const month = o.created_at.substring(0, 7);
      if (monthlyData[month]) {
        monthlyData[month].revenue += Number(o.total_amount);
        monthlyData[month].commission += Number(o.commission_amount);
      }
    });

    const monthlyRevenue = Object.entries(monthlyData).map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      revenue: data.revenue,
      commission: data.commission,
    }));

    // User growth data
    const userGrowthData: Record<string, number> = {};
    last6Months.forEach(month => {
      userGrowthData[month] = 0;
    });

    users.forEach(u => {
      const month = u.created_at.substring(0, 7);
      if (userGrowthData[month] !== undefined) {
        userGrowthData[month]++;
      }
    });

    let cumulative = 0;
    const userGrowth = Object.entries(userGrowthData).map(([month, count]) => {
      cumulative += count;
      return {
        month: new Date(month + '-01').toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        users: cumulative,
      };
    });

    // Booking and order stats by status
    const bookingStatMap: Record<string, number> = {};
    bookings.forEach(b => {
      bookingStatMap[b.status] = (bookingStatMap[b.status] || 0) + 1;
    });

    const orderStatMap: Record<string, number> = {};
    orders.forEach(o => {
      orderStatMap[o.status] = (orderStatMap[o.status] || 0) + 1;
    });

    setAnalytics({
      totalRevenue: bookingRevenue + orderRevenue,
      totalCommission: bookingCommission + orderCommission,
      totalUsers: users.length,
      totalBookings: bookings.length,
      totalOrders: orders.length,
      monthlyRevenue,
      userGrowth,
      bookingStats: Object.entries(bookingStatMap).map(([status, count]) => ({ status, count })),
      orderStats: Object.entries(orderStatMap).map(([status, count]) => ({ status, count })),
    });
  };

  const fetchUsers = async () => {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) throw profilesError;

    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) throw rolesError;

    const usersWithRoles = profiles.map(profile => ({
      ...profile,
      roles: userRoles
        .filter(ur => ur.user_id === profile.id)
        .map(ur => ur.role)
    }));

    setUsers(usersWithRoles);
  };

  const fetchPhotographers = async () => {
    const { data: photographerProfiles, error } = await supabase
      .from('photographer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (photographerProfiles) {
      const profileIds = photographerProfiles.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, avatar_url')
        .in('id', profileIds);

      const enrichedData = photographerProfiles.map(photographer => {
        const profile = profiles?.find(p => p.id === photographer.user_id);
        return {
          ...photographer,
          profiles: profile || { email: '', first_name: null, last_name: null, avatar_url: null }
        };
      });

      setPhotographers(enrichedData);
    }
  };

  const fetchOrders = async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          products (
            title
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    if (ordersData) {
      const clientIds = ordersData.map(o => o.client_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', clientIds);

      const enrichedData = ordersData.map(order => {
        const profile = profiles?.find(p => p.id === order.client_id);
        return {
          ...order,
          profiles: profile || { email: '', first_name: null, last_name: null }
        };
      });

      setOrders(enrichedData);
    }
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'photographer' | 'client', action: 'add' | 'remove') => {
    // Add confirmation for admin role
    if (role === 'admin' && action === 'add') {
      const confirmed = window.confirm(
        '⚠️ WARNING: You are about to grant admin privileges. This will give the user full access to all platform data and settings. Are you sure?'
      );
      if (!confirmed) return;
    }

    try {
      if (action === 'add') {
        // Check if role already exists to prevent duplicate key errors
        const { data: existing } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', userId)
          .eq('role', role)
          .maybeSingle();

        if (existing) {
          toast({
            title: "Info",
            description: "User already has this role",
          });
          return;
        }

        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
        if (error) throw error;

        // Log the action
        await logAdminAction('role_added', userId, undefined, { role });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;

        // Log the action
        await logAdminAction('role_removed', userId, undefined, { role });
      }

      toast({
        title: "Success",
        description: `Role ${action === 'add' ? 'added' : 'removed'} successfully`,
      });
      fetchUsers();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePhotographerApproval = async (photographerId: string, approved: boolean) => {
    try {
      const photographer = photographers.find(p => p.id === photographerId);
      
      const { error } = await supabase
        .from('photographer_profiles')
        .update({ is_approved: approved })
        .eq('id', photographerId);

      if (error) throw error;

      // If approving, add photographer role (check if exists first)
      if (approved && photographer) {
        const { data: existing } = await supabase
          .from('user_roles')
          .select('id')
          .eq('user_id', photographer.user_id)
          .eq('role', 'photographer')
          .maybeSingle();

        if (!existing) {
          await supabase
            .from('user_roles')
            .insert({ user_id: photographer.user_id, role: 'photographer' });
        }

        // Log the action
        await logAdminAction('photographer_approved', photographer.user_id, photographerId);
        
        // Send notification to photographer
        await createNotification({
          user_id: photographer.user_id,
          title: "Application Approved!",
          message: "Congratulations! Your photographer application has been approved. You can now start offering services.",
          type: "approval",
          action_url: "/dashboard",
        });
      } else if (photographer) {
        await logAdminAction('photographer_rejected', photographer.user_id, photographerId);
        
        // Send notification for rejection
        await createNotification({
          user_id: photographer.user_id,
          title: "Application Status Update",
          message: "Your photographer application was not approved at this time. Please contact support for more information.",
          type: "approval",
          action_url: "/dashboard/onboarding",
        });
      }

      toast({
        title: "Success",
        description: `Photographer ${approved ? 'approved' : 'rejected'} successfully`,
      });
      fetchPhotographers();
      fetchUsers();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchBookings = async () => {
    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (title)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (bookingsData) {
      const clientIds = bookingsData.map(b => b.client_id);
      const photographerIds = bookingsData.map(b => b.photographer_id);
      
      const { data: clientProfiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', clientIds);

      const { data: photographerProfiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', photographerIds);

      const enrichedData = bookingsData.map(booking => {
        const clientProfile = clientProfiles?.find(p => p.id === booking.client_id);
        const photographerProfile = photographerProfiles?.find(p => p.id === booking.photographer_id);
        return {
          ...booking,
          client_profile: clientProfile || { email: '', first_name: null, last_name: null },
          photographer_profile: photographerProfile || { email: '', first_name: null, last_name: null }
        };
      });

      setBookings(enrichedData);
    }
  };

  const fetchProducts = async () => {
    const { data: productsData, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (productsData) {
      const photographerIds = productsData.map(p => p.photographer_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', photographerIds);

      const enrichedData = productsData.map(product => {
        const profile = profiles?.find(p => p.id === product.photographer_id);
        return {
          ...product,
          profiles: profile || { email: '', first_name: null, last_name: null }
        };
      });

      setProducts(enrichedData);
    }
  };

  const fetchReviews = async () => {
    const { data: reviewsData, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (reviewsData) {
      const reviewerIds = reviewsData.map(r => r.reviewer_id);
      const photographerIds = reviewsData.map(r => r.photographer_id);
      
      const { data: reviewerProfiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', reviewerIds);

      const { data: photographerProfiles } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name')
        .in('id', photographerIds);

      const enrichedData = reviewsData.map(review => {
        const reviewerProfile = reviewerProfiles?.find(p => p.id === review.reviewer_id);
        const photographerProfile = photographerProfiles?.find(p => p.id === review.photographer_id);
        return {
          ...review,
          reviewer_profile: reviewerProfile || { email: '', first_name: null, last_name: null },
          photographer_profile: photographerProfile || { email: '', first_name: null, last_name: null }
        };
      });

      setReviews(enrichedData);
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      await logAdminAction('order_status_changed', undefined, orderId, { status });

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      fetchOrders();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleBookingStatusChange = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      await logAdminAction('booking_status_changed', undefined, bookingId, { status });

      toast({
        title: "Success",
        description: "Booking status updated successfully",
      });
      fetchBookings();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePaymentRelease = async (bookingId: string, paymentType: 'initial' | 'final') => {
    const confirmed = window.confirm(
      `Release ${paymentType} payment? This will create a payout record and mark the payment as released.`
    );
    
    if (!confirmed) return;

    try {
      // Get booking details
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*, services(title)')
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Calculate payout amount
      const commissionRate = Number(booking.commission_rate) || 15;
      const totalAmount = Number(booking.total_amount);
      const platformCommission = (totalAmount * commissionRate) / 100;
      const photographerAmount = totalAmount - platformCommission;
      
      // For initial payment, release 50%, for final release remaining 50%
      const payoutAmount = photographerAmount * 0.5;

      // Create payout record
      const { error: payoutError } = await supabase
        .from('payouts')
        .insert({
          photographer_id: booking.photographer_id,
          booking_id: bookingId,
          amount: payoutAmount,
          payout_type: paymentType,
          status: 'processing',
          released_by: user!.id,
          released_at: new Date().toISOString(),
          notes: `${paymentType === 'initial' ? 'Initial' : 'Final'} payment for booking: ${booking.services?.title || 'Service'}`,
        });

      if (payoutError) throw payoutError;

      // Update booking
      const field = paymentType === 'initial' ? 'initial_payment_released' : 'final_payment_released';
      const { error } = await supabase
        .from('bookings')
        .update({ [field]: true })
        .eq('id', bookingId);

      if (error) throw error;

      await logAdminAction('payment_released', booking.photographer_id, bookingId, { 
        paymentType, 
        amount: payoutAmount 
      });

      toast({
        title: "Success",
        description: `${paymentType === 'initial' ? 'Initial' : 'Final'} payment of $${payoutAmount.toFixed(2)} released`,
      });
      fetchBookings();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProductVisibility = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId);

      if (error) throw error;

      await logAdminAction('product_visibility_changed', undefined, productId, { isActive });

      toast({
        title: "Success",
        description: `Product ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
      fetchProducts();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReviewVisibility = async (reviewId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ is_public: isPublic })
        .eq('id', reviewId);

      if (error) throw error;

      await logAdminAction('review_visibility_changed', undefined, reviewId, { isPublic });

      toast({
        title: "Success",
        description: `Review ${isPublic ? 'made public' : 'hidden'} successfully`,
      });
      fetchReviews();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReviewModeration = async (reviewId: string, approved: boolean, notes?: string) => {
    try {
      const review = reviews.find(r => r.id === reviewId);
      
      const { error } = await supabase
        .from('reviews')
        .update({ 
          is_approved: approved,
          moderation_notes: notes || null,
          moderated_at: new Date().toISOString(),
          moderator_id: user!.id,
          is_public: approved, // Auto-set visibility based on approval
        })
        .eq('id', reviewId);

      if (error) throw error;

      await logAdminAction(
        approved ? 'review_approved' : 'review_rejected', 
        review?.reviewer_id, 
        reviewId, 
        { approved, notes }
      );

      // Notify the reviewer
      if (review) {
        await createNotification({
          user_id: review.reviewer_id,
          title: approved ? "Review Approved" : "Review Not Approved",
          message: approved 
            ? "Your review has been approved and is now visible to others."
            : "Your review was not approved. Please ensure it follows our community guidelines.",
          type: "review",
          related_id: reviewId,
          related_type: "review",
        });
      }

      toast({
        title: "Success",
        description: `Review ${approved ? 'approved' : 'rejected'} successfully`,
      });
      fetchReviews();
      fetchAuditLogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isAdmin === null || loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isAdmin === false) {
    return <Navigate to="/" replace />;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "secondary",
      completed: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumbs />
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage users, photographers, and orders across the platform
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => setSearchParams({ tab: value })} className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="photographers" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photographers
          </TabsTrigger>
          <TabsTrigger value="bookings" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bookings
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Products
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reviews
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Disputes
          </TabsTrigger>
          <TabsTrigger value="refunds" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refunds
          </TabsTrigger>
          <TabsTrigger value="advertisements" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Ads
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">From all transactions</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">${analytics.totalCommission.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">Total earnings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">Registered users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalBookings}</div>
                    <p className="text-xs text-muted-foreground">Service bookings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalOrders}</div>
                    <p className="text-xs text-muted-foreground">Product orders</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue & Commission Trend</CardTitle>
                    <CardDescription>Last 6 months revenue and platform commission</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                        <Legend />
                        <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" name="Revenue" strokeWidth={2} />
                        <Line type="monotone" dataKey="commission" stroke="hsl(var(--chart-2))" name="Commission" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                    <CardDescription>Cumulative user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="hsl(var(--chart-1))" name="Total Users" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Booking Status Distribution</CardTitle>
                    <CardDescription>Current status of all bookings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.bookingStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--primary))" name="Bookings" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Status Distribution</CardTitle>
                    <CardDescription>Current status of all orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.orderStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="hsl(var(--chart-2))" name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View all users and manage their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {user.first_name?.[0] || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.first_name && user.last_name
                                ? `${user.first_name} ${user.last_name}`
                                : "No name"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles.map((role) => (
                            <Badge key={role} variant="secondary">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {!user.roles.includes('admin') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'admin', 'add')}
                            >
                              Make Admin
                            </Button>
                          )}
                          {!user.roles.includes('photographer') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'photographer', 'add')}
                            >
                              Add Photographer
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photographers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Photographer Approval</CardTitle>
              <CardDescription>
                Review and approve photographer applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Photographer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {photographers.map((photographer) => (
                    <TableRow key={photographer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={photographer.profiles.avatar_url || undefined} />
                            <AvatarFallback>
                              {photographer.profiles.first_name?.[0] || 
                               photographer.profiles.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {photographer.profiles.first_name && photographer.profiles.last_name
                                ? `${photographer.profiles.first_name} ${photographer.profiles.last_name}`
                                : "No name"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{photographer.profiles.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {photographer.specialties?.slice(0, 3).map((specialty, idx) => (
                            <Badge key={idx} variant="outline">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {photographer.is_approved ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(photographer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {!photographer.is_approved ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handlePhotographerApproval(photographer.id, true)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handlePhotographerApproval(photographer.id, false)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orders Management</CardTitle>
              <CardDescription>
                View and manage all orders and commissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {order.profiles.first_name && order.profiles.last_name
                              ? `${order.profiles.first_name} ${order.profiles.last_name}`
                              : "No name"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.profiles.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {order.order_items.length} item(s)
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-primary font-medium">
                        ${order.commission_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => handleOrderStatusChange(order.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bookings Management</CardTitle>
              <CardDescription>
                View all bookings and manage payment releases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Booking ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Photographer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-sm">
                        {booking.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {booking.client_profile.first_name && booking.client_profile.last_name
                              ? `${booking.client_profile.first_name} ${booking.client_profile.last_name}`
                              : "No name"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.client_profile.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {booking.photographer_profile.first_name && booking.photographer_profile.last_name
                              ? `${booking.photographer_profile.first_name} ${booking.photographer_profile.last_name}`
                              : "No name"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {booking.services.title}
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${booking.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={booking.initial_payment_released ? "default" : "outline"} className="text-xs">
                            Initial: {booking.initial_payment_released ? "Released" : "Pending"}
                          </Badge>
                          <Badge variant={booking.final_payment_released ? "default" : "outline"} className="text-xs">
                            Final: {booking.final_payment_released ? "Released" : "Pending"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Select
                            value={booking.status}
                            onValueChange={(value) => handleBookingStatusChange(booking.id, value)}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="confirmed">Confirmed</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="flex gap-1">
                            {!booking.initial_payment_released && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => handlePaymentRelease(booking.id, 'initial')}
                              >
                                Release Initial
                              </Button>
                            )}
                            {!booking.final_payment_released && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7"
                                onClick={() => handlePaymentRelease(booking.id, 'final')}
                              >
                                Release Final
                              </Button>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Moderation</CardTitle>
              <CardDescription>
                Manage product visibility and approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Photographer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="font-medium">{product.title}</div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {product.profiles.first_name && product.profiles.last_name
                              ? `${product.profiles.first_name} ${product.profiles.last_name}`
                              : "No name"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.profiles.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${product.price.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category || "Uncategorized"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_digital ? "default" : "secondary"}>
                          {product.is_digital ? "Digital" : "Physical"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.is_active ? (
                          <Badge variant="default">
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(product.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {product.is_active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleProductVisibility(product.id, false)}
                            >
                              <EyeOff className="h-4 w-4 mr-1" />
                              Hide
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleProductVisibility(product.id, true)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Review Moderation</CardTitle>
              <CardDescription>
                Approve or reject reviews before they become publicly visible
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Photographer</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {review.reviewer_profile.first_name && review.reviewer_profile.last_name
                              ? `${review.reviewer_profile.first_name} ${review.reviewer_profile.last_name}`
                              : "No name"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {review.reviewer_profile.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {review.photographer_profile.first_name && review.photographer_profile.last_name
                              ? `${review.photographer_profile.first_name} ${review.photographer_profile.last_name}`
                              : "No name"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{review.rating}</span>
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm">
                          {review.comment || "No comment"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {review.is_approved === null ? (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        ) : review.is_approved ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {review.is_public ? (
                          <Badge variant="secondary">
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Hidden
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(review.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {review.is_approved === null ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="text-xs h-7"
                                onClick={() => handleReviewModeration(review.id, true)}
                              >
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs h-7"
                                onClick={() => handleReviewModeration(review.id, false)}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              {review.is_public ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={() => handleReviewVisibility(review.id, false)}
                                >
                                  <EyeOff className="h-3 w-3 mr-1" />
                                  Hide
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs h-7"
                                  onClick={() => handleReviewVisibility(review.id, true)}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Show
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {reviews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No reviews found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Admin Audit Log</CardTitle>
              <CardDescription>
                Track all administrative actions performed on the platform (last 100 entries)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {log.admin_profile?.first_name && log.admin_profile?.last_name
                              ? `${log.admin_profile.first_name} ${log.admin_profile.last_name}`
                              : log.admin_profile?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.admin_profile?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {log.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs text-sm">
                          {log.details ? (
                            <pre className="text-xs bg-muted p-2 rounded">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          ) : (
                            <span className="text-muted-foreground">No additional details</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{new Date(log.created_at).toLocaleDateString()}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {auditLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No audit log entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <PaymentGatewaySettings />
        </TabsContent>

        <TabsContent value="email">
          <EmailSettings />
        </TabsContent>

        <TabsContent value="disputes">
          <DisputeManagement />
        </TabsContent>

        <TabsContent value="refunds">
          <RefundManagement />
        </TabsContent>

        <TabsContent value="advertisements">
          <AdvertisementSettings />
        </TabsContent>

        <TabsContent value="payouts">
          <PayoutReleasePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;