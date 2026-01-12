import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { AppLayout } from "@/components/layout/AppLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Photographers from "./pages/Photographers";
import PhotographerProfile from "./pages/PhotographerProfile";
import Services from "./pages/Services";
import BookService from "./pages/BookService";
import Bookings from "./pages/Bookings";
import Messages from "./pages/Messages";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import PaymentSettings from "./pages/PaymentSettings";
import Products from "./pages/Products";
import Payouts from "./pages/Payouts";
import OrderTracking from "./pages/OrderTracking";
import Availability from "./pages/Availability";
import PhotographerOnboarding from "./pages/PhotographerOnboarding";
import PhotographerAnalytics from "./pages/PhotographerAnalytics";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";
import DigitalDownload from "./pages/DigitalDownload";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import PortfolioManagement from "./pages/PortfolioManagement";
import Favorites from "./pages/Favorites";
import Install from "./pages/Install";
import About from "./pages/About";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="photographers" element={<Photographers />} />
                <Route path="photographers/:userId" element={<PhotographerProfile />} />
                <Route path="services" element={<Services />} />
                <Route path="shop" element={<Shop />} />
                <Route path="cart" element={<Cart />} />
                <Route path="search" element={<Search />} />
                <Route path="about" element={<About />} />
              </Route>
              
              {/* Install PWA Route */}
              <Route path="/install" element={<Install />} />
              
              {/* Auth Route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Index />} />
                <Route path="book/:photographerId/:serviceId" element={<BookService />} />
                <Route path="bookings" element={<Bookings />} />
                <Route path="messages" element={<Messages />} />
                <Route path="profile" element={<Profile />} />
                <Route path="payment-settings" element={<PaymentSettings />} />
                <Route path="products" element={<Products />} />
                <Route path="payouts" element={<Payouts />} />
                <Route path="orders" element={<Orders />} />
                <Route path="order-tracking" element={<OrderTracking />} />
                <Route path="availability" element={<Availability />} />
                <Route path="onboarding" element={<PhotographerOnboarding />} />
                <Route path="analytics" element={<PhotographerAnalytics />} />
                <Route path="admin" element={<Admin />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="download" element={<DigitalDownload />} />
                <Route path="portfolio" element={<PortfolioManagement />} />
                <Route path="favorites" element={<Favorites />} />
              </Route>
              
              {/* Protected checkout */}
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              
              {/* Protected booking route */}
              <Route path="/book/:photographerId/:serviceId" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<BookService />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
