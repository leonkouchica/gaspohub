import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface AdvertBannerProps {
  className?: string;
  page?: "home" | "photographers" | "services";
}

interface BannerData {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
}

export const AdvertBanner = ({ className = "", page = "home" }: AdvertBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [banner, setBanner] = useState<BannerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const { data, error } = await supabase
          .from("advertisement_banners")
          .select("id, title, description, image_url, link_url, link_text")
          .eq("is_active", true)
          .contains("display_pages", [page])
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching banner:", error);
          return;
        }

        setBanner(data);
      } catch (error) {
        console.error("Error fetching banner:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [page]);

  if (loading || !isVisible || !banner) return null;

  const handleClick = (e: React.MouseEvent) => {
    if (!banner.link_url || banner.link_url === "#") {
      e.preventDefault();
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-lg border border-border bg-muted/30 ${className}`}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-10 h-8 w-8 bg-background/80 hover:bg-background"
        onClick={() => setIsVisible(false)}
        aria-label="Close advertisement"
      >
        <X className="h-4 w-4" />
      </Button>
      
      <a 
        href={banner.link_url || "#"} 
        className="block w-full"
        onClick={handleClick}
        target={banner.link_url && banner.link_url !== "#" ? "_blank" : undefined}
        rel={banner.link_url && banner.link_url !== "#" ? "noopener noreferrer" : undefined}
      >
        <div className="relative aspect-[4/1] md:aspect-[6/1] w-full">
          <img
            src={banner.image_url}
            alt={`Advertisement - ${banner.title}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent flex items-center">
            <div className="p-6 md:p-8 max-w-xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sponsored</p>
              <h3 className="text-lg md:text-2xl font-bold text-foreground mb-2">
                {banner.title}
              </h3>
              {banner.description && (
                <p className="text-sm text-muted-foreground hidden md:block">
                  {banner.description}
                </p>
              )}
              <span className="inline-block mt-3 text-sm font-medium text-primary hover:underline">
                {banner.link_text || "Learn More"} →
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};
