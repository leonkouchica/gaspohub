import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  id: string; // product_id
  title: string;
  price: number;
  quantity: number;
  image: string | null;
  is_digital: boolean;
  photographer_id: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_KEY = "cart";

function readLocal(): CartItem[] {
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function fetchProductsByIds(ids: string[]) {
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("products")
    .select("id, title, price, images, is_digital, photographer_id")
    .in("id", ids);
  return data || [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => readLocal());
  const hydratedUserRef = useRef<string | null>(null);

  // Persist to localStorage for guests as a fallback
  useEffect(() => {
    if (!user) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
    }
  }, [items, user]);

  // On login: merge local cart into DB, then load from DB
  useEffect(() => {
    if (!user) {
      hydratedUserRef.current = null;
      return;
    }
    if (hydratedUserRef.current === user.id) return;
    hydratedUserRef.current = user.id;

    (async () => {
      try {
        const localItems = readLocal();

        // Merge local guest items into DB (upsert with quantity bump)
        if (localItems.length > 0) {
          for (const li of localItems) {
            const { data: existing } = await supabase
              .from("cart_items")
              .select("id, quantity")
              .eq("user_id", user.id)
              .eq("product_id", li.id)
              .maybeSingle();

            if (existing) {
              await supabase
                .from("cart_items")
                .update({ quantity: existing.quantity + li.quantity })
                .eq("id", existing.id);
            } else {
              await supabase.from("cart_items").insert({
                user_id: user.id,
                product_id: li.id,
                quantity: li.quantity,
              });
            }
          }
          localStorage.removeItem(LOCAL_KEY);
        }

        // Load full cart from DB
        const { data: rows } = await supabase
          .from("cart_items")
          .select("product_id, quantity")
          .eq("user_id", user.id);

        const productIds = (rows || []).map((r) => r.product_id);
        const products = await fetchProductsByIds(productIds);

        const merged: CartItem[] = (rows || [])
          .map((r) => {
            const p = products.find((pp) => pp.id === r.product_id);
            if (!p) return null;
            return {
              id: p.id,
              title: p.title,
              price: Number(p.price),
              quantity: r.quantity,
              image: p.images?.[0] ?? null,
              is_digital: !!p.is_digital,
              photographer_id: p.photographer_id,
            } as CartItem;
          })
          .filter((x): x is CartItem => x !== null);

        setItems(merged);
      } catch (err) {
        console.error("Cart hydration failed:", err);
      }
    })();
  }, [user]);

  const addItem = (item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const next = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...prev, { ...item, quantity: 1 }];

      toast({
        title: existing ? "Item already in cart" : "Added to cart",
        description: existing ? "Quantity updated" : item.title,
      });

      // Sync to DB
      if (user) {
        (async () => {
          const newQty = existing ? existing.quantity + 1 : 1;
          const { data: row } = await supabase
            .from("cart_items")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", item.id)
            .maybeSingle();
          if (row) {
            await supabase.from("cart_items").update({ quantity: newQty }).eq("id", row.id);
          } else {
            await supabase.from("cart_items").insert({
              user_id: user.id,
              product_id: item.id,
              quantity: 1,
            });
          }
        })();
      }

      return next;
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Removed from cart" });
    if (user) {
      supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", id)
        .then(({ error }) => {
          if (error) console.error("Cart remove failed:", error);
        });
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    if (user) {
      supabase
        .from("cart_items")
        .update({ quantity })
        .eq("user_id", user.id)
        .eq("product_id", id)
        .then(({ error }) => {
          if (error) console.error("Cart update failed:", error);
        });
    }
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem(LOCAL_KEY);
    if (user) {
      supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .then(({ error }) => {
          if (error) console.error("Cart clear failed:", error);
        });
    }
  };

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
