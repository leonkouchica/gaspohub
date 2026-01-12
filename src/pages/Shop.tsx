import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";

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

// Sample products data for demo purposes
const sampleProducts: Product[] = [
  {
    id: "sample-product-1",
    title: "Moody Landscape Preset Pack",
    description: "Professional Lightroom presets for stunning landscape photography. 10 unique presets included.",
    price: 49,
    category: "presets",
    images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop"],
    is_digital: true,
    inventory_count: 999,
    photographer_id: "sample-user-3"
  },
  {
    id: "sample-product-2",
    title: "Golden Hour Portrait Presets",
    description: "Warm and cinematic presets perfect for portrait photography during golden hour.",
    price: 39,
    category: "presets",
    images: ["https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=400&fit=crop"],
    is_digital: true,
    inventory_count: 999,
    photographer_id: "sample-user-1"
  },
  {
    id: "sample-product-3",
    title: "Mountain Sunrise Fine Art Print",
    description: "Limited edition 24x36 inch fine art print on museum-quality paper. Signed and numbered.",
    price: 299,
    category: "prints",
    images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop"],
    is_digital: false,
    inventory_count: 50,
    photographer_id: "sample-user-3"
  },
  {
    id: "sample-product-4",
    title: "Photography Masterclass Course",
    description: "Complete online course covering composition, lighting, and post-processing. 20+ hours of content.",
    price: 199,
    category: "courses",
    images: ["https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&h=400&fit=crop"],
    is_digital: true,
    inventory_count: 999,
    photographer_id: "sample-user-2"
  },
  {
    id: "sample-product-5",
    title: "Ocean Waves Canvas Print",
    description: "Stunning 30x20 inch gallery-wrapped canvas featuring dramatic ocean waves.",
    price: 249,
    category: "prints",
    images: ["https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&h=400&fit=crop"],
    is_digital: false,
    inventory_count: 25,
    photographer_id: "sample-user-3"
  },
  {
    id: "sample-product-6",
    title: "Wedding Photography Guide eBook",
    description: "Comprehensive guide to shooting weddings like a pro. Tips, checklists, and sample contracts included.",
    price: 29,
    category: "other",
    images: ["https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=400&fit=crop"],
    is_digital: true,
    inventory_count: 999,
    photographer_id: "sample-user-1"
  }
];

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
      
      // Use sample data if no products found
      const productsToUse = (data && data.length > 0) ? data : sampleProducts;
      setProducts(productsToUse);
      fetchFavorites(productsToUse);
    } catch (error) {
      console.error("Error fetching products:", error);
      // On error, show sample products
      setProducts(sampleProducts);
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
      <SEO 
        title="Photography Shop"
        description="Browse and purchase prints, presets, courses and other photography products from professional photographers."
        keywords="photo prints, photography presets, lightroom presets, photography courses, digital downloads"
      />
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
