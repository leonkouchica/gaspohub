import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function DigitalDownload() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
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

    if (orderItems && (orderItems as any).orders.client_id === user.id) {
      setProduct((orderItems as any).products);
      setVerified(true);
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!product?.digital_file_url) return;

    setDownloading(true);
    try {
      // Check if the file is stored in Supabase storage
      const isSupabaseStorage = product.digital_file_url.includes('/storage/v1/object/public/');

      if (isSupabaseStorage) {
        // Extract bucket and path from the public URL
        const urlParts = product.digital_file_url.split('/storage/v1/object/public/');
        if (urlParts.length === 2) {
          const pathAfterPublic = urlParts[1];
          const slashIndex = pathAfterPublic.indexOf('/');
          const bucket = pathAfterPublic.substring(0, slashIndex);
          const filePath = pathAfterPublic.substring(slashIndex + 1);

          // Generate a signed URL for secure, time-limited download
          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(filePath, 300); // 5-minute expiry

          if (signedError || !signedData?.signedUrl) {
            throw new Error("Failed to generate secure download link");
          }

          window.open(signedData.signedUrl, "_blank");
          toast({
            title: "Download started",
            description: `Downloading ${product.title}. Link expires in 5 minutes.`,
          });
          return;
        }
      }

      // Fallback: open URL directly for external URLs
      window.open(product.digital_file_url, "_blank");
      toast({
        title: "Download started",
        description: `Downloading ${product.title}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not generate download link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
            <p className="text-muted-foreground">Verifying purchase...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verified || !product) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Invalid download link</h3>
            <p className="text-muted-foreground">
              This download link is invalid or you don't have access to this product.
            </p>
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

          <Button
            onClick={handleDownload}
            className="w-full"
            size="lg"
            disabled={downloading}
          >
            {downloading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating secure link...
              </>
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                Download File
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Each download generates a secure, time-limited link. This link is unique to your purchase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
