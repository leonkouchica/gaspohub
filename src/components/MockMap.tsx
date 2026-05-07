import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons (Leaflet + bundlers issue)
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

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
  const withCoords = useMemo(
    () => pins.filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number"),
    [pins]
  );
  const center: [number, number] = withCoords.length
    ? [
        withCoords.reduce((s, p) => s + (p.latitude as number), 0) / withCoords.length,
        withCoords.reduce((s, p) => s + (p.longitude as number), 0) / withCoords.length,
      ]
    : [9.082, 8.6753]; // Default: Nigeria center

  // Fallback hashed positions (only for pins with no coords) — kept for legacy usage
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
    <Card className="relative overflow-hidden h-[500px] border">
      <div className="absolute top-3 left-3 z-[1000]">
        <Badge variant="secondary">
          {withCoords.length} photographer{withCoords.length === 1 ? "" : "s"} on map
          {radiusKm ? ` • ${radiusKm} km radius` : ""}
        </Badge>
      </div>
      <MapContainer
        center={center}
        zoom={withCoords.length ? 6 : 4}
        scrollWheelZoom
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {radiusKm && withCoords.length > 0 && (
          <Circle
            center={[withCoords[0].latitude as number, withCoords[0].longitude as number]}
            radius={radiusKm * 1000}
            pathOptions={{ color: "hsl(var(--primary))", fillOpacity: 0.05 }}
          />
        )}
        {withCoords.map((p) => (
          <Marker key={p.id} position={[p.latitude as number, p.longitude as number]}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{p.name}{p.is_verified ? " ✓" : ""}</p>
                {p.location && <p className="text-xs text-muted-foreground">{p.location}</p>}
                <Link to={`/photographers/${p.user_id}`} className="text-primary text-sm underline">
                  View profile
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {withCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-background/80 z-[999]">
          <div className="text-center">
            <MapPin className="h-8 w-8 mx-auto mb-2" />
            No photographers with map coordinates yet.
          </div>
        </div>
      )}
    </Card>
  );
}