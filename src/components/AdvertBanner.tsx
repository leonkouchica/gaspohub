import { X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AdvertBannerProps {
  className?: string;
}

export const AdvertBanner = ({ className = "" }: AdvertBannerProps) => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

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
        href="#" 
        className="block w-full"
        onClick={(e) => e.preventDefault()}
      >
        <div className="relative aspect-[4/1] md:aspect-[6/1] w-full">
          <img
            src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&h=300&fit=crop"
            alt="Advertisement - Professional Photography Equipment"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent flex items-center">
            <div className="p-6 md:p-8 max-w-xl">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Sponsored</p>
              <h3 className="text-lg md:text-2xl font-bold text-foreground mb-2">
                Upgrade Your Photography Gear
              </h3>
              <p className="text-sm text-muted-foreground hidden md:block">
                Discover premium cameras, lenses, and accessories. Special offers for GASPOHUB members.
              </p>
              <span className="inline-block mt-3 text-sm font-medium text-primary hover:underline">
                Learn More →
              </span>
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};
