import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  Camera, 
  Users, 
  Calendar, 
  ShoppingBag, 
  User,
  MessageSquare,
  Home,
  Shield,
  BarChart3,
  Package,
  CreditCard,
  Clock,
  DollarSign,
  Bell,
  Image as ImageIcon,
  Heart,
  Briefcase,
  Wallet,
  Search,
  FileText,
  ShieldCheck,
  Flag,
  CheckSquare,
  Images,
  Globe,
  Truck,
  AlertTriangle,
  Receipt
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Photographers", url: "/photographers", icon: Users },
  { title: "Services", url: "/services", icon: Camera },
  { title: "My Bookings", url: "/dashboard/bookings", icon: Calendar },
  { title: "Contracts", url: "/dashboard/contracts", icon: FileText },
  { title: "Saved Searches", url: "/dashboard/saved-searches", icon: Search },
  { title: "My Quotes", url: "/dashboard/quotes", icon: FileText },
  { title: "Shop", url: "/shop", icon: ShoppingBag },
  { title: "My Orders", url: "/dashboard/orders", icon: Package },
  { title: "Favorites", url: "/dashboard/favorites", icon: Heart },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Profile", url: "/dashboard/profile", icon: User },
];

const photographerNavigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Portfolio", url: "/dashboard/portfolio", icon: ImageIcon },
  { title: "Photographers", url: "/photographers", icon: Users },
  { title: "Services", url: "/services", icon: Camera },
  { title: "Quote Requests", url: "/dashboard/quotes", icon: FileText },
  { title: "Verification", url: "/dashboard/verification", icon: ShieldCheck },
  { title: "Client Bookings", url: "/dashboard/bookings", icon: Calendar },
  { title: "My Jobs", url: "/dashboard/photographer-bookings", icon: Briefcase },
  { title: "Galleries", url: "/dashboard/galleries", icon: Images },
  { title: "Microsite", url: "/dashboard/microsite", icon: Globe },
  { title: "Contracts", url: "/dashboard/contracts", icon: FileText },
  { title: "Availability", url: "/dashboard/availability", icon: Clock },
  { title: "My Products", url: "/dashboard/products", icon: Package },
  { title: "Shop", url: "/shop", icon: ShoppingBag },
  { title: "My Orders", url: "/dashboard/orders", icon: Package },
  { title: "Favorites", url: "/dashboard/favorites", icon: Heart },
  { title: "Messages", url: "/dashboard/messages", icon: MessageSquare },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  { title: "Profile", url: "/dashboard/profile", icon: User },
  { title: "Payouts", url: "/dashboard/payouts", icon: Wallet },
  { title: "Payments", url: "/dashboard/payment-settings", icon: CreditCard },
];

const adminNavigationItems = [
  { title: "Analytics", url: "/dashboard/admin?tab=analytics", icon: BarChart3 },
  { title: "Users", url: "/dashboard/admin?tab=users", icon: Users },
  { title: "Photographers", url: "/dashboard/admin?tab=photographers", icon: Camera },
  { title: "Verification Queue", url: "/dashboard/admin?tab=verification", icon: ShieldCheck },
  { title: "Portfolio Moderation", url: "/dashboard/admin?tab=moderation", icon: CheckSquare },
  { title: "Bookings", url: "/dashboard/admin?tab=bookings", icon: Calendar },
  { title: "Orders", url: "/dashboard/admin?tab=orders", icon: ShoppingBag },
  { title: "Products", url: "/dashboard/admin?tab=products", icon: Package },
  { title: "Reviews", url: "/dashboard/admin?tab=reviews", icon: MessageSquare },
  { title: "Refunds", url: "/dashboard/admin?tab=refunds", icon: DollarSign },
  { title: "Payouts", url: "/dashboard/admin?tab=payouts", icon: Wallet },
  { title: "Bulk Payouts", url: "/dashboard/admin?tab=bulk-payouts", icon: Wallet },
  { title: "Disputes", url: "/dashboard/admin?tab=disputes", icon: Shield },
  { title: "Email Settings", url: "/dashboard/admin?tab=email", icon: MessageSquare },
  { title: "Ad Banners", url: "/dashboard/admin?tab=ads", icon: ImageIcon },
  { title: "Payment Gateway", url: "/dashboard/admin?tab=payment-gateway", icon: CreditCard },
  { title: "Currencies", url: "/dashboard/admin?tab=currencies", icon: DollarSign },
  { title: "Tax Rates", url: "/dashboard/admin?tab=tax", icon: Receipt },
  { title: "Chargebacks", url: "/dashboard/admin?tab=chargebacks", icon: AlertTriangle },
  { title: "Shipments", url: "/dashboard/admin?tab=shipments", icon: Truck },
  { title: "Notif. Templates", url: "/dashboard/admin?tab=templates", icon: Bell },
  { title: "Feature Flags", url: "/dashboard/admin?tab=flags", icon: Flag },
  { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPhotographer, setIsPhotographer] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      checkPhotographerStatus();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data } = await supabase.rpc('is_admin');
      setIsAdmin(data || false);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const checkPhotographerStatus = async () => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .eq('role', 'photographer')
        .single();
      setIsPhotographer(!!data);
    } catch (error) {
      setIsPhotographer(false);
    }
  };

  const isActive = (path: string) => {
    if (path === "/") return currentPath === path;
    return currentPath.startsWith(path);
  };

  const getNavClass = (path: string) => {
    return isActive(path) 
      ? "bg-primary text-primary-foreground font-medium" 
      : "hover:bg-accent hover:text-accent-foreground";
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"}>
      <SidebarContent>
        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavigationItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {(isPhotographer ? photographerNavigationItems : navigationItems).map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={getNavClass(item.url)}>
                        <item.icon className="h-4 w-4" />
                        {state !== "collapsed" && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}