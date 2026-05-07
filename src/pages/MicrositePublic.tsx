import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { SEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Camera, Globe, Instagram, Mail } from "lucide-react";

export default function MicrositePublic() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [m, setM] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data } = await supabase.from("microsites").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      setM(data);
      if (data) {
        const [{ data: svc }, { data: port }] = await Promise.all([
          supabase.from("services").select("*").eq("photographer_id", data.photographer_id).eq("is_active", true).limit(6),
          supabase.from("portfolio_items").select("*").eq("photographer_id", data.photographer_id).eq("status", "approved").limit(12),
        ]);
        setServices(svc || []);
        setPortfolio(port || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <PageSkeleton />;
  if (!m) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Camera className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Microsite not found</h1>
          <Button asChild variant="link"><Link to="/">Go home</Link></Button>
        </div>
      </div>
    );
  }

  const accent = m.theme_color || "#6366f1";

  return (
    <div className="min-h-screen bg-background">
      <SEO title={m.headline || "Photographer"} description={(m.about || "").slice(0, 150)} />
      <header
        className="relative h-[60vh] min-h-[400px] flex items-end"
        style={{
          backgroundImage: m.hero_image_url ? `linear-gradient(to bottom, transparent, rgba(0,0,0,0.7)), url(${m.hero_image_url})` : `linear-gradient(135deg, ${accent}, hsl(var(--background)))`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-6 py-10 text-white">
          <h1 className="text-4xl md:text-6xl font-bold drop-shadow">{m.headline}</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-12 max-w-4xl">
        {m.about && (
          <section>
            <h2 className="text-2xl font-semibold mb-3" style={{ color: accent }}>About</h2>
            <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{m.about}</p>
          </section>
        )}

        {portfolio.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: accent }}>Portfolio</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {portfolio.map((p) => (
                <img key={p.id} src={p.image_url} alt={p.caption || ""} loading="lazy" className="w-full aspect-square object-cover rounded-md" />
              ))}
            </div>
          </section>
        )}

        {services.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4" style={{ color: accent }}>Services</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {services.map((s) => (
                <div key={s.id} className="border rounded-md p-4">
                  <p className="font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                  <p className="mt-2 font-medium">${s.price}</p>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild style={{ backgroundColor: accent, color: "#fff" }}>
                <Link to={`/photographers/${m.photographer_id}`}>Book me</Link>
              </Button>
            </div>
          </section>
        )}

        <section className="border-t pt-6 flex flex-wrap gap-4 text-sm">
          {m.contact_email && <a href={`mailto:${m.contact_email}`} className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{m.contact_email}</a>}
          {m.instagram && <a href={`https://instagram.com/${m.instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2"><Instagram className="h-4 w-4" />{m.instagram}</a>}
          {m.website && <a href={m.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2"><Globe className="h-4 w-4" />Website</a>}
        </section>
      </main>
    </div>
  );
}
