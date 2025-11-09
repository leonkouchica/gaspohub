import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

type FavoriteType = "photographer" | "product" | "service";

export function useFavorites(itemType: FavoriteType, itemId: string) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && itemId) {
      checkFavorite();
    }
  }, [user, itemId, itemType]);

  const checkFavorite = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("item_type", itemType)
        .eq("item_id", itemId)
        .maybeSingle();

      if (error) throw error;
      setIsFavorite(!!data);
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("Please sign in to save favorites");
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", user.id)
          .eq("item_type", itemType)
          .eq("item_id", itemId);

        if (error) throw error;
        setIsFavorite(false);
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: user.id,
          item_type: itemType,
          item_id: itemId,
        });

        if (error) throw error;
        setIsFavorite(true);
        toast.success("Added to favorites");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    } finally {
      setLoading(false);
    }
  };

  return { isFavorite, loading, toggleFavorite };
}
