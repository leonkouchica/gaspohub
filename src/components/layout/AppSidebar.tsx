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
  Package
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
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Photographers", url: "/photographers", icon: Users },
  { title: "Services", url: "/services", icon: Camera },
  { title: "My Bookings", url: "/bookings", icon: Calendar },
  { title: "Shop", url: "/shop", icon: ShoppingBag },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Profile", url: "/profile", icon: User },
];

const adminNavigationItems = [
  { title: "Analytics", url: "/dashboard/admin?tab=analytics", icon: BarChart3 },
  { title: "Users", url: "/dashboard/admin?tab=users", icon: Users },
  { title: "Photographers", url: "/dashboard/admin?tab=photographers", icon: Camera },
  { title: "Bookings", url: "/dashboard/admin?tab=bookings", icon: Calendar },
  { title: "Orders", url: "/dashboard/admin?tab=orders", icon: ShoppingBag },
  { title: "Products", url: "/dashboard/admin?tab=products", icon: Package },
  { title: "Reviews", url: "/dashboard/admin?tab=reviews", icon: MessageSquare },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
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
        {!isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => (
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}