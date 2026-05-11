import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Check, ArrowLeft, Download, Settings } from "lucide-react";
import { SEO } from "@/components/SEO";
import { DashboardSkeleton as PageSkeleton } from "@/components/PageSkeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function ClientGallery() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    const { data: g } = await supabase.from("galleries").select("*").eq("id", id).maybeSingle();
    setGallery(g);
    const { data: imgs } = await supabase.from("gallery_images").select("*").eq("gallery_id", id).order("position");
    setImages(imgs || []);
    const { data: s } = await supabase.from("gallery_settings" as any).select("*").eq("gallery_id", id).maybeSingle();
    setSettings(s || { gallery_id: id, watermark_enabled: true, watermark_text: "", download_limit: 0, download_count: 0, allow_downloads: true });
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]);

  const isClient = user?.id === gallery?.client_id;
  const isOwner = user?.id === gallery?.photographer_id;

  const saveSettings = async () => {
    const payload: any = { gallery_id: id, watermark_enabled: settings.watermark_enabled, watermark_text: settings.watermark_text, download_limit: settings.download_limit, allow_downloads: settings.allow_downloads };
    const { error } = await supabase.from("gallery_settings" as any).upsert(payload, { onConflict: "gallery_id" });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Settings saved" });
    setSettingsOpen(false);
  };

  const downloadImage = async (img: any) => {
    const { data, error } = await supabase.rpc("record_gallery_download" as any, { _gallery_id: id, _image_id: img.id });
    if (error) return toast({ title: "Download failed", description: error.message, variant: "destructive" });
    const res = data as any;
    if (!res?.ok) {
      const map: Record<string, string> = {
        forbidden: "You are not allowed to download this gallery",
        downloads_disabled: "Downloads are disabled for this gallery",
        limit_reached: "Download limit reached",
        gallery_not_found: "Gallery not found",
      };
      return toast({ title: map[res?.error] || "Download blocked", variant: "destructive" });
    }
    setSettings({ ...settings, download_count: (settings.download_count || 0) + 1 });
    const a = document.createElement("a"); a.href = img.image_url; a.download = `image-${img.id}.jpg`; a.target = "_blank"; a.click();
    if (typeof res.remaining === "number") toast({ title: `Downloaded — ${res.remaining} left` });
  };

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
              {isOwner && (
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild><Button size="sm" variant="outline"><Settings className="h-4 w-4 mr-1" />Proofing</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Proofing settings</DialogTitle></DialogHeader>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><Label>Watermark images</Label><Switch checked={!!settings?.watermark_enabled} onCheckedChange={(v) => setSettings({ ...settings, watermark_enabled: v })} /></div>
                      <div><Label>Watermark text</Label><Input value={settings?.watermark_text || ""} onChange={(e) => setSettings({ ...settings, watermark_text: e.target.value })} placeholder="© Studio Name" /></div>
                      <div className="flex items-center justify-between"><Label>Allow downloads</Label><Switch checked={!!settings?.allow_downloads} onCheckedChange={(v) => setSettings({ ...settings, allow_downloads: v })} /></div>
                      <div><Label>Download limit (0 = unlimited)</Label><Input type="number" min={0} value={settings?.download_limit ?? 0} onChange={(e) => setSettings({ ...settings, download_limit: Number(e.target.value) })} /></div>
                      <p className="text-xs text-muted-foreground">Used: {settings?.download_count ?? 0}</p>
                    </div>
                    <DialogFooter><Button onClick={saveSettings}>Save</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
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
                  {settings?.watermark_enabled && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/60 text-xl font-bold rotate-[-30deg] select-none drop-shadow-lg">
                        {settings.watermark_text || "PROOF"}
                      </span>
                    </div>
                  )}
                  {isClient && (
                    <div className="absolute inset-x-0 bottom-0 flex justify-between p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition">
                      <Button size="sm" variant={img.is_favorite ? "default" : "secondary"} onClick={() => toggle(img.id, "is_favorite", !img.is_favorite)}>
                        <Heart className={`h-4 w-4 ${img.is_favorite ? "fill-current" : ""}`} />
                      </Button>
                      <Button size="sm" variant={img.is_approved ? "default" : "secondary"} onClick={() => toggle(img.id, "is_approved", !img.is_approved)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      {settings?.allow_downloads && (
                        <Button size="sm" variant="secondary" onClick={() => downloadImage(img)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
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
