import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/ProductCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShoppingCart, Search, Package } from "lucide-react";
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
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [cart, setCart] = useState<{[key: string]: number}>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, categoryFilter, priceFilter, sortBy]);

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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }

    // Price filter
    if (priceFilter !== "all") {
      switch (priceFilter) {
        case "under-50":
          filtered = filtered.filter(product => product.price < 50);
          break;
        case "50-100":
          filtered = filtered.filter(product => product.price >= 50 && product.price <= 100);
          break;
        case "100-200":
          filtered = filtered.filter(product => product.price >= 100 && product.price <= 200);
          break;
        case "over-200":
          filtered = filtered.filter(product => product.price > 200);
          break;
      }
    }

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        filtered = [...filtered].sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "featured":
      default:
        // Keep original order
        break;
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

  const LoadingSkeleton = () => (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="aspect-square w-full" />
            <CardContent className="p-4">
              <div className="space-y-3">
                <div>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumbs />
      
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
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

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Price range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All prices</SelectItem>
                <SelectItem value="under-50">Under $50</SelectItem>
                <SelectItem value="50-100">$50 - $100</SelectItem>
                <SelectItem value="100-200">$100 - $200</SelectItem>
                <SelectItem value="over-200">Over $200</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name-asc">Name: A to Z</SelectItem>
                <SelectItem value="name-desc">Name: Z to A</SelectItem>
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
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={addToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;