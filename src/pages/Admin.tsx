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
import { Shield, Users, Camera, ShoppingCart, CheckCircle, XCircle, Clock } from "lucide-react";
import { Navigate } from "react-router-dom";

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

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [photographers, setPhotographers] = useState<PendingPhotographer[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

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
      ]);
    } finally {
      setLoading(false);
    }
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
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Role ${action === 'add' ? 'added' : 'removed'} successfully`,
      });
      fetchUsers();
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
      const { error } = await supabase
        .from('photographer_profiles')
        .update({ is_approved: approved })
        .eq('id', photographerId);

      if (error) throw error;

      // If approving, add photographer role
      if (approved) {
        const photographer = photographers.find(p => p.id === photographerId);
        if (photographer) {
          await supabase
            .from('user_roles')
            .insert({ user_id: photographer.user_id, role: 'photographer' });
        }
      }

      toast({
        title: "Success",
        description: `Photographer ${approved ? 'approved' : 'rejected'} successfully`,
      });
      fetchPhotographers();
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      fetchOrders();
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

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="photographers" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Photographers
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
};

export default Admin;