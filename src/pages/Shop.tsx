import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Search, DollarSign, Package, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductWithPhotographer {
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
}

const Shop = () => {
  const [products, setProducts] = useState<ProductWithPhotographer[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithPhotographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      const productsWithPhotographers = await Promise.all(
        (data || []).map(async (product) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', product.photographer_id)
            .single();

          return {
            ...product,
            profiles: profileData || {
              first_name: '',
              last_name: '',
              avatar_url: ''
            }
          };
        })
      );

      setProducts(productsWithPhotographers);
    } catch (error) {
      toast({
        title: "Error loading products",
        description: "Failed to fetch shop products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  };

  const addToCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
    
    toast({
      title: "Added to cart",
      description: "Product has been added to your cart",
    });
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Photography Shop</h1>
            <p className="text-muted-foreground">
              Discover prints, equipment, and digital products from talented photographers
            </p>
          </div>
          
          {getCartCount() > 0 && (
            <Button asChild>
              <Link to="/cart">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart ({getCartCount()})
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            {searchTerm || categoryFilter !== "all" 
              ? "Try adjusting your search criteria" 
              : "No products are available at the moment"
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted/50 relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                
                {product.is_digital && (
                  <Badge className="absolute top-2 right-2" variant="secondary">
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
                      <AvatarFallback className="text-xs">
                        {product.profiles?.first_name?.[0]}
                        {product.profiles?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">
                      by {product.profiles?.first_name} {product.profiles?.last_name}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={() => addToCart(product.id)}
                      size="sm" 
                      className="flex-1"
                      disabled={!product.is_digital && product.inventory_count === 0}
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      {!product.is_digital && product.inventory_count === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/photographers/${product.photographer_id}`}>
                        <User className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;