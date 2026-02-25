import { useState, useEffect } from "react";
import { OrdersSkeleton } from "@/components/PageSkeleton";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, Download, ShoppingBag, FileText } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { generateInvoicePDF } from "@/lib/invoice";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: string;
    title: string;
    is_digital: boolean;
    digital_file_url: string | null;
    images: string[] | null;
  };
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  } | null;
  items: OrderItem[];
}

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", user?.id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: itemsData } = await supabase
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

          const itemsWithProducts = await Promise.all(
            (itemsData || []).map(async (item) => {
              const { data: product } = await supabase
                .from("products")
                .select("id, title, is_digital, digital_file_url, images")
                .eq("id", item.product_id)
                .single();

              return { ...item, product };
            })
          );

          return {
            ...order,
            shipping_address: order.shipping_address as Order["shipping_address"],
            items: itemsWithProducts,
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "cancelled":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const handleDownload = (item: OrderItem) => {
    if (item.product?.digital_file_url) {
      window.open(item.product.digital_file_url, "_blank");
      toast({
        title: "Download started",
        description: `Downloading ${item.product.title}`,
      });
    }
  };

  const handleDownloadInvoice = async (order: Order) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user?.id)
        .single();

      generateInvoicePDF({
        invoiceNumber: order.id.slice(0, 8).toUpperCase(),
        date: format(new Date(order.created_at), 'MMM d, yyyy'),
        customerName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Customer' : 'Customer',
        customerEmail: profile?.email || user?.email || '',
        items: order.items.map(item => ({
          name: item.product?.title || 'Product',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.total_price,
        })),
        subtotal: order.total_amount,
        total: order.total_amount,
        shippingAddress: order.shipping_address || undefined,
        notes: 'Thank you for your purchase! If you have any questions, please contact our support team.',
      });

      toast({
        title: "Invoice Downloaded",
        description: "Your invoice has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <OrdersSkeleton />;
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12">
        <Card className="max-w-lg mx-auto text-center">
          <CardContent className="pt-12 pb-8">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders. Browse our shop to find amazing products!
            </p>
            <Button asChild>
              <Link to="/shop">Browse Shop</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <SEO 
        title="Order History" 
        description="View and manage your order history. Download invoices and track your purchases."
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Order History</h1>
        <p className="text-muted-foreground">View and track your orders</p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Placed on {format(new Date(order.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(order.status || "pending")}>
                    {order.status || "pending"}
                  </Badge>
                  <span className="font-bold text-lg">
                    ${order.total_amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product?.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${item.total_price.toFixed(2)}</p>
                      {item.product?.is_digital && item.product?.digital_file_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(item)}
                          className="mt-1"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Separator />
                <div className="flex items-center justify-between">
                  {order.shipping_address && (
                    <div>
                      <h4 className="font-medium mb-1">Shipping Address</h4>
                      <p className="text-sm text-muted-foreground">
                        {order.shipping_address.street}, {order.shipping_address.city},{" "}
                        {order.shipping_address.state} {order.shipping_address.zip},{" "}
                        {order.shipping_address.country}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadInvoice(order)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
