import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { SocialShare } from "./SocialShare";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string | null;
    price: number;
    category: string | null;
    images: string[] | null;
    is_digital: boolean;
    photographer_id: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg";
  const { isFavorite, loading, toggleFavorite } = useFavorites("product", product.id);

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <img src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
        {product.is_digital && (
          <Badge className="absolute top-2 right-2">Digital</Badge>
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">{product.title}</CardTitle>
        <CardDescription className="line-clamp-2">{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">${product.price}</span>
          {product.category && <Badge variant="outline">{product.category}</Badge>}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
        <Button variant="outline" size="icon" onClick={toggleFavorite} disabled={loading}>
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
        </Button>
        <SocialShare title={product.title} description={product.description || ""} />
      </CardFooter>
    </Card>
  );
}
