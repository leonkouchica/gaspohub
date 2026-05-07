import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Send, Trash2, Upload } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/PageSkeleton";

interface Booking { id: string; client_id: string; job_details: string | null; }
interface Gallery {
  id: string; booking_id: string; client_id: string; title: string; message: string | null;
  status: string; cover_image_url: string | null; delivered_at: string | null;
}

export default function PhotographerGalleries() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ booking_id: "", title: "Your Gallery", message: "" });
  const [active, setActive] = useState<Gallery | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: gal } = await supabase.from("galleries").select("*").eq("photographer_id", user.id).order("created_at", { ascending: false });
    setGalleries(gal || []);
    const { data: bk } = await supabase.from("bookings").select("id, client_id, job_details").eq("photographer_id", user.id);
    setBookings(bk || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  const loadImages = async (g: Gallery) => {
    setActive(g);
    const { data } = await supabase.from("gallery_images").select("*").eq("gallery_id", g.id).order("position");
    setImages(data || []);
  };

  const createGallery = async () => {
    if (!user || !form.booking_id) return;
    const bk = bookings.find((b) => b.id === form.booking_id);
    if (!bk) return;
    const { data, error } = await supabase.from("galleries").insert({
      photographer_id: user.id,
      client_id: bk.client_id,
      booking_id: bk.id,
      title: form.title,
      message: form.message || null,
    }).select().single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setOpenCreate(false);
    setForm({ booking_id: "", title: "Your Gallery", message: "" });
    setGalleries((g) => [data as any, ...g]);
    loadImages(data as any);
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || !active || !user) return;
    setUploading(true);
    try {
      let pos = images.length;
      for (const file of Array.from(files)) {
        const path = `${user.id}/${active.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("gallery-images").upload(path, file);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("gallery-images").getPublicUrl(path);
        const { data: row } = await supabase.from("gallery_images").insert({
          gallery_id: active.id,
          image_url: pub.publicUrl,
          position: pos++,
        }).select().single();
        if (row) setImages((arr) => [...arr, row]);
      }
      toast({ title: "Uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally { setUploading(false); }
  };

  const deliverGallery = async () => {
    if (!active) return;
    const { error } = await supabase.from("galleries").update({
      status: "delivered", delivered_at: new Date().toISOString(),
      cover_image_url: images[0]?.image_url || null,
    }).eq("id", active.id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    await supabase.from("notifications").insert({
      user_id: active.client_id, type: "gallery_delivered",
      title: "Your gallery is ready", message: `${active.title} has been delivered for review.`,
      action_url: `/dashboard/galleries/${active.id}`, related_id: active.id, related_type: "gallery",
    });
    toast({ title: "Delivered to client" });
    load();
  };

  const removeImage = async (id: string) => {
    await supabase.from("gallery_images").delete().eq("id", id);
    setImages((arr) => arr.filter((i) => i.id !== id));
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      <SEO title="My Galleries" description="Deliver shoot galleries to your clients for proofing." />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gallery Proofing</h1>
          <p className="text-muted-foreground">Deliver galleries and let clients pick favorites.</p>
        </div>
        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New gallery</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create gallery</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Booking</Label>
                <select className="w-full border rounded-md px-3 py-2 bg-background" value={form.booking_id} onChange={(e) => setForm({ ...form, booking_id: e.target.value })}>
                  <option value="">Select…</option>
                  {bookings.map((b) => (<option key={b.id} value={b.id}>{b.id.slice(0, 8)} — {b.job_details?.slice(0, 50) || "Booking"}</option>))}
                </select>
              </div>
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>Message to client</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            </div>
            <DialogFooter><Button onClick={createGallery} disabled={!form.booking_id}>Create</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Galleries</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {galleries.length === 0 && <p className="text-sm text-muted-foreground">No galleries yet.</p>}
            {galleries.map((g) => (
              <button key={g.id} onClick={() => loadImages(g)} className={`w-full text-left p-3 rounded-md border hover:bg-muted/50 ${active?.id === g.id ? "bg-muted" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">{g.title}</span>
                  <Badge variant={g.status === "approved" ? "default" : g.status === "delivered" ? "secondary" : "outline"}>{g.status}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{active?.title || "Select a gallery"}</CardTitle>
            {active && <CardDescription>Status: {active.status} • {images.length} image{images.length === 1 ? "" : "s"}</CardDescription>}
          </CardHeader>
          <CardContent>
            {!active ? <p className="text-muted-foreground">Pick a gallery to manage.</p> : (
              <>
                <div className="flex gap-2 flex-wrap mb-4">
                  <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted">
                    <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Add images"}
                    <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => uploadImages(e.target.files)} disabled={uploading} />
                  </label>
                  {active.status === "draft" && (
                    <Button onClick={deliverGallery} disabled={images.length === 0}><Send className="h-4 w-4 mr-2" />Deliver to client</Button>
                  )}
                  <Button asChild variant="outline"><Link to={`/dashboard/galleries/${active.id}`}>Preview as client</Link></Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative group border rounded-md overflow-hidden">
                      <img src={img.image_url} alt={img.caption || ""} loading="lazy" className="w-full aspect-square object-cover" />
                      {img.is_favorite && <Badge className="absolute top-2 left-2">★ Favorite</Badge>}
                      {img.is_approved && <Badge variant="secondary" className="absolute top-2 right-2">Approved</Badge>}
                      <button onClick={() => removeImage(img.id)} className="absolute bottom-2 right-2 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4 text-destructive" /></button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
