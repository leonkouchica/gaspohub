import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SEO } from "@/components/SEO";
import { Package, Truck, CheckCircle, Clock, MapPin, ShoppingBag, CreditCard, CircleDot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    title: string;
    images: string[];
  };
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  shipping_address: any;
  order_items: OrderItem[];
}

const TRACKING_STEPS = [
  { key: "pending", label: "Order Placed", icon: CreditCard, description: "Your order has been received" },
  { key: "paid", label: "Payment Confirmed", icon: CheckCircle, description: "Payment has been verified" },
  { key: "processing", label: "Processing", icon: Package, description: "Your order is being prepared" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
  { key: "delivered", label: "Delivered", icon: CheckCircle, description: "Your order has been delivered" },
];

const OrderTracking = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (title, images)
          )
        `)
        .eq('client_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(ordersData || []);
      if (ordersData && ordersData.length > 0) {
        setSelectedOrder(ordersData[0]);
      }
    } catch (error) {
      toast({
        title: "Error loading orders",
        description: "Failed to fetch your orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    const idx = TRACKING_STEPS.findIndex(s => s.key === status);
    return idx === -1 ? 0 : idx;
  };

  const getStatusColor = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'delivered': return 'default';
      case 'shipped': return 'default';
      case 'processing': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const getEstimatedDelivery = (order: Order) => {
    const created = new Date(order.created_at);
    const estimated = new Date(created);
    estimated.setDate(estimated.getDate() + 7);
    return format(estimated, "MMM d, yyyy");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Order Tracking"
        description="Track your orders and view shipping details."
      />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Order Tracking</h1>
          <p className="text-muted-foreground">
            Track your orders and view delivery status
          </p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-4">
                Start shopping to see your orders here
              </p>
              <Button onClick={() => window.location.href = '/shop'}>
                Browse Shop
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Orders List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Your Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="space-y-1">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                          selectedOrder?.id === order.id ? 'bg-muted' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </span>
                          <Badge variant={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                          <span className="font-medium">${order.total_amount}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(order.order_items?.length || 0)} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Details */}
            <div className="lg:col-span-2">
              {selectedOrder && (
                <div className="space-y-6">
                  {/* Tracking Timeline */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                        </CardTitle>
                        <Badge variant={getStatusColor(selectedOrder.status)} className="text-sm">
                          {selectedOrder.status}
                        </Badge>
                      </div>
                      {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                        <p className="text-sm text-muted-foreground">
                          Estimated delivery: {getEstimatedDelivery(selectedOrder)}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent>
                      {selectedOrder.status === 'cancelled' ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                            <Package className="h-6 w-6 text-destructive" />
                          </div>
                          <p className="font-medium text-destructive">Order Cancelled</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            This order has been cancelled. Contact support for more details.
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          {TRACKING_STEPS.map((step, index) => {
                            const currentStepIdx = getStepIndex(selectedOrder.status);
                            const isComplete = index <= currentStepIdx;
                            const isCurrent = index === currentStepIdx;
                            const StepIcon = step.icon;

                            return (
                              <div key={step.key} className="flex gap-4 pb-8 last:pb-0">
                                {/* Timeline line and dot */}
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                                      isComplete
                                        ? 'bg-primary border-primary text-primary-foreground'
                                        : 'bg-background border-muted-foreground/30 text-muted-foreground'
                                    } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                                  >
                                    {isCurrent ? (
                                      <CircleDot className="h-5 w-5" />
                                    ) : (
                                      <StepIcon className="h-5 w-5" />
                                    )}
                                  </div>
                                  {index < TRACKING_STEPS.length - 1 && (
                                    <div
                                      className={`w-0.5 flex-1 min-h-[24px] ${
                                        isComplete && index < currentStepIdx
                                          ? 'bg-primary'
                                          : 'bg-muted-foreground/20'
                                      }`}
                                    />
                                  )}
                                </div>

                                {/* Step content */}
                                <div className="pt-1.5 pb-2">
                                  <p className={`font-medium ${isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {step.label}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {step.description}
                                  </p>
                                  {isCurrent && (
                                    <p className="text-xs text-primary mt-1 font-medium">
                                      Current status • Updated {format(new Date(selectedOrder.updated_at), "MMM d, h:mm a")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Shipping Address */}
                  {selectedOrder.shipping_address && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MapPin className="h-4 w-4" />
                          Shipping Address
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm space-y-1">
                          <p>{selectedOrder.shipping_address.street}</p>
                          <p>
                            {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                          </p>
                          <p>{selectedOrder.shipping_address.country}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Order Items */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Order Items</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedOrder.order_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                          <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            {item.products?.images?.[0] ? (
                              <img
                                src={item.products.images[0]}
                                alt={item.products?.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.products?.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity} × ${item.unit_price}
                            </p>
                          </div>
                          <div className="font-medium text-sm">${item.total_price}</div>
                        </div>
                      ))}

                      <Separator />

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-muted-foreground">
                          Ordered on {format(new Date(selectedOrder.created_at), "PPP")}
                        </span>
                        <span className="text-lg font-bold text-primary">
                          ${selectedOrder.total_amount}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderTracking;
