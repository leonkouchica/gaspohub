import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  images: string[] | null;
  is_digital: boolean;
  inventory_count: number;
  photographer_id: string;
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [category]);

  const fetchProducts = async () => {
    try {
      let query = supabase.from("products").select("*").eq("is_active", true);

      if (category !== "all") {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
      fetchFavorites(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (allProducts: Product[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favData } = await supabase
        .from("favorites")
        .select("item_id")
        .eq("user_id", user.id)
        .eq("item_type", "product");

      if (favData) {
        const favIds = favData.map((f) => f.item_id);
        const favProducts = allProducts.filter((p) => favIds.includes(p.id));
        setFavorites(favProducts);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayProducts = showFavorites ? favorites : filteredProducts;

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Photography Shop</h1>
        <p className="text-lg text-muted-foreground">
          Browse and purchase prints, presets, and other photography products
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="prints">Prints</SelectItem>
            <SelectItem value="presets">Presets</SelectItem>
            <SelectItem value="courses">Courses</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showFavorites ? "default" : "outline"}
          onClick={() => setShowFavorites(!showFavorites)}
        >
          <Heart className={`h-4 w-4 mr-2 ${showFavorites ? "fill-current" : ""}`} />
          Favorites ({favorites.length})
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : displayProducts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {showFavorites ? "No favorite products yet" : "No products found"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
