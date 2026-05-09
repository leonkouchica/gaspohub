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
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
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
import PhotographerBookings from "./pages/PhotographerBookings";
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
import SavedSearches from "./pages/SavedSearches";
import Quotes from "./pages/Quotes";
import Verification from "./pages/Verification";
import PhotographerGalleries from "./pages/PhotographerGalleries";
import ClientGallery from "./pages/ClientGallery";
import MicrositeEditor from "./pages/MicrositeEditor";
import MicrositePublic from "./pages/MicrositePublic";
import Contracts from "./pages/Contracts";
import Install from "./pages/Install";
import About from "./pages/About";
import HelpCenter from "./pages/HelpCenter";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
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
                <Route path="help" element={<HelpCenter />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="contact" element={<Contact />} />
              </Route>

              {/* Public microsite */}
              <Route path="/m/:slug" element={<MicrositePublic />} />
              
              {/* Install PWA Route */}
              <Route path="/install" element={<Install />} />
              
              {/* Auth Route */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Dashboard />} />
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
                <Route path="photographer-bookings" element={<PhotographerBookings />} />
                <Route path="admin" element={<Admin />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="download" element={<DigitalDownload />} />
                <Route path="portfolio" element={<PortfolioManagement />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="saved-searches" element={<SavedSearches />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="verification" element={<Verification />} />
                <Route path="galleries" element={<PhotographerGalleries />} />
                <Route path="galleries/:id" element={<ClientGallery />} />
                <Route path="microsite" element={<MicrositeEditor />} />
                <Route path="contracts" element={<Contracts />} />
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
