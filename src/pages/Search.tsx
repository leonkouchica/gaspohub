import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEO } from "@/components/SEO";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { PhotographerCard } from "@/components/PhotographerCard";
import { ServiceCard } from "@/components/ServiceCard";
import { ProductCard } from "@/components/ProductCard";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    photographers: [],
    services: [],
    products: [],
  });

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);

    const searchTerm = `%${searchQuery}%`;

    // Search photographers
    const photographersPromise = supabase
      .from("photographer_profiles")
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          avatar_url,
          bio,
          location
        )
      `)
      .eq("is_approved", true)
      .or(`profiles.first_name.ilike.${searchTerm},profiles.last_name.ilike.${searchTerm},profiles.bio.ilike.${searchTerm},profiles.location.ilike.${searchTerm}`);

    // Search services
    const servicesPromise = supabase
      .from("services")
      .select(`
        *,
        profiles:photographer_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("is_active", true)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm}`);

    // Search products
    const productsPromise = supabase
      .from("products")
      .select(`
        *,
        profiles:photographer_id (
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq("is_active", true)
      .or(`title.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`);

    const [photographersRes, servicesRes, productsRes] = await Promise.all([
      photographersPromise,
      servicesPromise,
      productsPromise,
    ]);

    setResults({
      photographers: photographersRes.data || [],
      services: servicesRes.data || [],
      products: productsRes.data || [],
    });

    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  const totalResults =
    results.photographers.length +
    results.services.length +
    results.products.length;

  return (
    <>
      <SEO 
        title={query ? `Search: ${query}` : "Search"}
        description="Search for photographers, photography services, and products on SnapConnect."
        keywords="search photographers, find photography services, photography products"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Search</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <Input
            type="text"
            placeholder="Search photographers, services, or products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SearchIcon className="h-4 w-4" />
            )}
          </Button>
        </form>

        {searchParams.get("q") && (
          <>
            <div className="mb-4">
              <p className="text-muted-foreground">
                {loading
                  ? "Searching..."
                  : `Found ${totalResults} result${totalResults !== 1 ? "s" : ""} for "${searchParams.get("q")}"`}
              </p>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">
                  All ({totalResults})
                </TabsTrigger>
                <TabsTrigger value="photographers">
                  Photographers ({results.photographers.length})
                </TabsTrigger>
                <TabsTrigger value="services">
                  Services ({results.services.length})
                </TabsTrigger>
                <TabsTrigger value="products">
                  Products ({results.products.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-8 mt-6">
                {results.photographers.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Photographers</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.photographers.map((photographer: any) => (
                        <PhotographerCard
                          key={photographer.id}
                          photographer={photographer}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {results.services.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Services</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.services.map((service: any) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                  </div>
                )}

                {results.products.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Products</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                )}

                {totalResults === 0 && !loading && (
                  <div className="text-center py-12">
                    <SearchIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-lg text-muted-foreground">
                      No results found
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Try adjusting your search terms
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photographers" className="mt-6">
                {results.photographers.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.photographers.map((photographer: any) => (
                      <PhotographerCard
                        key={photographer.id}
                        photographer={photographer}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No photographers found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="services" className="mt-6">
                {results.services.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.services.map((service: any) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No services found
                  </div>
                )}
              </TabsContent>

              <TabsContent value="products" className="mt-6">
                {results.products.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.products.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No products found
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
      </div>
    </>
  );
}
