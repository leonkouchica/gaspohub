import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingCart, DollarSign, Package, User } from "lucide-react";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    description: string;
    price: number;
    category: string;
    images: string[];
    is_digital: boolean;
    inventory_count: number;
    photographer_id: string;
    profiles: {
      first_name: string;
      last_name: string;
      avatar_url: string;
    };
  };
  onAddToCart: (productId: string) => void;
}

export const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="aspect-square bg-muted/50 relative overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        
        {product.is_digital && (
          <Badge className="absolute top-2 right-2 shadow-sm" variant="secondary">
            Digital
          </Badge>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold line-clamp-1">{product.title}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="font-bold text-lg">{product.price}</span>
            </div>
            
            {product.category && (
              <Badge variant="outline" className="text-xs">
                {product.category}
              </Badge>
            )}
          </div>

          {/* Photographer Info */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarImage src={product.profiles?.avatar_url} />
              <AvatarFallback>
                <AvatarPlaceholder className="h-6 w-6" type="photographer" />
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground">
              by {product.profiles?.first_name} {product.profiles?.last_name}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => onAddToCart(product.id)}
              size="sm" 
              className="flex-1 shadow-sm hover:shadow-md transition-shadow"
              disabled={!product.is_digital && product.inventory_count === 0}
            >
              <ShoppingCart className="h-3 w-3 mr-1" />
              {!product.is_digital && product.inventory_count === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <Button asChild variant="outline" size="sm" className="hover:bg-accent transition-colors">
              <Link to={`/photographers/${product.photographer_id}`}>
                <User className="h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};