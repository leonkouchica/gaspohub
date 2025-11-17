import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DigitalDownload() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    verifyPurchase();
  }, []);

  const verifyPurchase = async () => {
    const orderId = searchParams.get("order");
    const productId = searchParams.get("product");

    if (!orderId || !productId || !user) {
      setLoading(false);
      return;
    }

    // Verify user purchased this product
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("*, orders(*), products(*)")
      .eq("order_id", orderId)
      .eq("product_id", productId)
      .single();

    if (orderItems && orderItems.orders.client_id === user.id) {
      setProduct(orderItems.products);
      setVerified(true);
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (product?.digital_file_url) {
      window.open(product.digital_file_url, "_blank");
      toast({
        title: "Download started",
        description: "Your file is being downloaded",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Verifying purchase...</p>
      </div>
    );
  }

  if (!verified || !product) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-lg text-muted-foreground">Invalid download link</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <CardTitle>Purchase Verified</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">{product.title}</h3>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>

          <Button onClick={handleDownload} className="w-full" size="lg">
            <Download className="h-5 w-5 mr-2" />
            Download File
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This download link is unique to your purchase. Keep it safe and don't share it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
