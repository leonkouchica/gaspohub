import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";

interface Pin {
  id: string;
  user_id: string;
  name: string;
  location?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_verified?: boolean;
}

/**
 * Lightweight mock map UI. Uses a deterministic projection of lat/lng (or hashed
 * fallback) onto a styled grid container. Designed to be swapped for Leaflet/Mapbox later.
 */
export function MockMap({ pins, radiusKm }: { pins: Pin[]; radiusKm?: number }) {
  const positioned = useMemo(() => {
    return pins.map((p, i) => {
      let x: number, y: number;
      if (typeof p.latitude === "number" && typeof p.longitude === "number") {
        x = ((p.longitude + 180) / 360) * 100;
        y = ((90 - p.latitude) / 180) * 100;
      } else {
        // hash to stable position
        const h = p.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        x = 10 + (h % 80);
        y = 10 + ((h * 7) % 80);
      }
      return { ...p, x, y };
    });
  }, [pins]);

  return (
    <Card className="relative overflow-hidden h-[500px] bg-gradient-to-br from-muted/40 to-muted/10 border">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--border)/0.4) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)/0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute top-3 left-3 z-10">
        <Badge variant="secondary">Map preview {radiusKm ? `• ${radiusKm} km radius` : ""}</Badge>
      </div>
      <div className="absolute bottom-3 right-3 z-10 text-xs text-muted-foreground bg-background/70 backdrop-blur px-2 py-1 rounded">
        Mock map — production will use a real provider
      </div>
      {positioned.map((p) => (
        <Link
          key={p.id}
          to={`/photographers/${p.user_id}`}
          className="absolute -translate-x-1/2 -translate-y-full group z-20"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
        >
          <div className="flex flex-col items-center">
            <div className="bg-primary text-primary-foreground rounded-full p-1.5 shadow-md group-hover:scale-110 transition-transform">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="mt-1 px-2 py-0.5 bg-background border rounded text-xs whitespace-nowrap shadow opacity-0 group-hover:opacity-100 transition-opacity">
              {p.name}{p.is_verified ? " ✓" : ""}
              {p.location ? ` • ${p.location}` : ""}
            </div>
          </div>
        </Link>
      ))}
      {positioned.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          No photographers in this area
        </div>
      )}
    </Card>
  );
}