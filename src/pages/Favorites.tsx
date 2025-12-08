import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Heart, Camera, ShoppingBag, Briefcase, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface FavoriteItem {
  id: string;
  item_id: string;
  item_type: string;
  created_at: string;
}

interface Photographer {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  location: string | null;
  specialties: string[] | null;
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
  category: string | null;
}

interface Service {
  id: string;
  title: string;
  price: number;
  description: string | null;
  duration_hours: number | null;
  photographer_id: string;
}

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [photographers, setPhotographers] = useState<Photographer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data: favs, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;
      setFavorites(favs || []);

      // Fetch details for each type
      const photographerIds = favs?.filter(f => f.item_type === "photographer").map(f => f.item_id) || [];
      const productIds = favs?.filter(f => f.item_type === "product").map(f => f.item_id) || [];
      const serviceIds = favs?.filter(f => f.item_type === "service").map(f => f.item_id) || [];

      await Promise.all([
        fetchPhotographers(photographerIds),
        fetchProducts(productIds),
        fetchServices(serviceIds),
      ]);
    } catch (error: any) {
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotographers = async (ids: string[]) => {
    if (ids.length === 0) {
      setPhotographers([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, avatar_url, location")
      .in("id", ids);

    const { data: photographerProfiles } = await supabase
      .from("photographer_profiles")
      .select("user_id, specialties")
      .in("user_id", ids);

    const combined = profiles?.map(p => ({
      user_id: p.id,
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      location: p.location,
      specialties: photographerProfiles?.find(pp => pp.user_id === p.id)?.specialties || null,
    })) || [];

    setPhotographers(combined);
  };

  const fetchProducts = async (ids: string[]) => {
    if (ids.length === 0) {
      setProducts([]);
      return;
    }

    const { data } = await supabase
      .from("products")
      .select("id, title, price, images, category")
      .in("id", ids);

    setProducts(data || []);
  };

  const fetchServices = async (ids: string[]) => {
    if (ids.length === 0) {
      setServices([]);
      return;
    }

    const { data } = await supabase
      .from("services")
      .select("id, title, price, description, duration_hours, photographer_id")
      .in("id", ids);

    setServices(data || []);
  };

  const removeFavorite = async (itemType: string, itemId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user?.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId);

      if (error) throw error;

      toast.success("Removed from favorites");
      fetchFavorites();
    } catch (error: any) {
      toast.error("Failed to remove favorite");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Heart className="h-8 w-8 text-primary fill-primary" />
        <h1 className="text-3xl font-bold">My Favorites</h1>
      </div>

      {favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">You haven't saved any favorites yet.</p>
            <div className="flex justify-center gap-4">
              <Button asChild variant="outline">
                <Link to="/photographers">Browse Photographers</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/shop">Browse Shop</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="photographers" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="photographers" className="gap-2">
              <Camera className="h-4 w-4" />
              Photographers ({photographers.length})
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Services ({services.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photographers">
            {photographers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No favorite photographers yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {photographers.map((photographer) => (
                  <Card key={photographer.user_id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {photographer.avatar_url ? (
                            <img
                              src={photographer.avatar_url}
                              alt={`${photographer.first_name} ${photographer.last_name}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Camera className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {photographer.first_name} {photographer.last_name}
                          </h3>
                          {photographer.location && (
                            <p className="text-sm text-muted-foreground">{photographer.location}</p>
                          )}
                          {photographer.specialties && photographer.specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {photographer.specialties.slice(0, 2).map((s) => (
                                <span
                                  key={s}
                                  className="text-xs bg-secondary px-2 py-0.5 rounded"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button asChild variant="default" size="sm" className="flex-1">
                          <Link to={`/photographers/${photographer.user_id}`}>View Profile</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFavorite("photographer", photographer.user_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products">
            {products.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No favorite products yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <ShoppingBag className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold truncate">{product.title}</h3>
                      {product.category && (
                        <p className="text-sm text-muted-foreground">{product.category}</p>
                      )}
                      <p className="text-lg font-bold text-primary mt-2">
                        ${product.price.toFixed(2)}
                      </p>
                      <div className="flex gap-2 mt-4">
                        <Button asChild variant="default" size="sm" className="flex-1">
                          <Link to="/shop">View in Shop</Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFavorite("product", product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="services">
            {services.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No favorite services yet.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service) => (
                  <Card key={service.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">
                          ${service.price.toFixed(2)}
                        </span>
                        {service.duration_hours && (
                          <span className="text-sm text-muted-foreground">
                            {service.duration_hours}h
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button asChild variant="default" size="sm" className="flex-1">
                          <Link to={`/dashboard/book/${service.photographer_id}/${service.id}`}>
                            Book Now
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFavorite("service", service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
