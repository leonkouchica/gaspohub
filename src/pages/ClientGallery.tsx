import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";
import { DashboardSkeleton as PageSkeleton } from "@/components/PageSkeleton";

export default function ClientGallery() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);

  const load = async () => {
    if (!id) return;
    const { data: g } = await supabase.from("galleries").select("*").eq("id", id).maybeSingle();
    setGallery(g);
    const { data: imgs } = await supabase.from("gallery_images").select("*").eq("gallery_id", id).order("position");
    setImages(imgs || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const isClient = user?.id === gallery?.client_id;
  const isOwner = user?.id === gallery?.photographer_id;

  const toggle = async (imgId: string, field: "is_favorite" | "is_approved", value: boolean) => {
    if (!isClient) return;
    const patch: any = { [field]: value };
    const { error } = await supabase.from("gallery_images").update(patch).eq("id", imgId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setImages((arr) => arr.map((i) => i.id === imgId ? { ...i, [field]: value } : i));
  };

  const approveAll = async () => {
    if (!isClient || !gallery) return;
    const { error } = await supabase.from("galleries").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", gallery.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("notifications").insert({
      user_id: gallery.photographer_id, type: "gallery_approved",
      title: "Gallery approved", message: `${gallery.title} was approved by your client.`,
      related_id: gallery.id, related_type: "gallery",
    });
    toast({ title: "Gallery approved" });
    load();
  };

  if (loading) return <PageSkeleton />;
  if (!gallery) return <div className="container mx-auto px-6 py-8">Gallery not found.</div>;

  const favCount = images.filter((i) => i.is_favorite).length;

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <SEO title={gallery.title} description="Review and favorite images from your shoot." />
      <Button asChild variant="ghost" size="sm"><Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link></Button>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <CardTitle>{gallery.title}</CardTitle>
              <CardDescription>{gallery.message}</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Badge>{gallery.status}</Badge>
              <Badge variant="secondary">{favCount} favorites</Badge>
              {isClient && gallery.status === "delivered" && (
                <Button onClick={approveAll}><Check className="h-4 w-4 mr-2" />Approve gallery</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? <p className="text-muted-foreground">No images yet.</p> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="relative group border rounded-md overflow-hidden">
                  <img src={img.image_url} alt={img.caption || ""} loading="lazy" className="w-full aspect-square object-cover" />
                  {isClient && (
                    <div className="absolute inset-x-0 bottom-0 flex justify-between p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                      <Button size="sm" variant={img.is_favorite ? "default" : "secondary"} onClick={() => toggle(img.id, "is_favorite", !img.is_favorite)}>
                        <Heart className={`h-4 w-4 ${img.is_favorite ? "fill-current" : ""}`} />
                      </Button>
                      <Button size="sm" variant={img.is_approved ? "default" : "secondary"} onClick={() => toggle(img.id, "is_approved", !img.is_approved)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {(img.is_favorite || img.is_approved) && (
                    <div className="absolute top-2 left-2 flex gap-1">
                      {img.is_favorite && <Badge>★</Badge>}
                      {img.is_approved && <Badge variant="secondary">✓</Badge>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {isOwner && <p className="mt-4 text-xs text-muted-foreground">Viewing as photographer (read-only).</p>}
        </CardContent>
      </Card>
    </div>
  );
}
