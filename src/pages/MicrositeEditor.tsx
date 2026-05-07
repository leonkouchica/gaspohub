import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SEO } from "@/components/SEO";
import { PageSkeleton } from "@/components/PageSkeleton";
import { ExternalLink, Upload } from "lucide-react";

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export default function MicrositeEditor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [m, setM] = useState<any>({
    slug: "", headline: "", about: "", hero_image_url: "", theme_color: "#6366f1",
    contact_email: "", instagram: "", website: "", is_published: false,
  });

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("microsites").select("*").eq("photographer_id", user.id).maybeSingle();
      if (data) setM(data);
      else {
        const { data: prof } = await supabase.from("profiles").select("first_name, last_name, email").eq("id", user.id).maybeSingle();
        const name = `${prof?.first_name || ""} ${prof?.last_name || ""}`.trim();
        setM((s: any) => ({ ...s, slug: slugify(name) || user.id.slice(0, 8), headline: name || "Photographer", contact_email: prof?.email || "" }));
      }
      setLoading(false);
    })();
  }, [user]);

  const upload = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("microsite-assets").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    const { data } = supabase.storage.from("microsite-assets").getPublicUrl(path);
    setM((s: any) => ({ ...s, hero_image_url: data.publicUrl }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const slug = slugify(m.slug);
    if (!slug) { toast({ title: "Slug required", variant: "destructive" }); setSaving(false); return; }
    const payload = { ...m, slug, photographer_id: user.id };
    const { error } = await supabase.from("microsites").upsert(payload, { onConflict: "photographer_id" });
    setSaving(false);
    if (error) { toast({ title: "Save failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Microsite saved" });
  };

  if (loading) return <PageSkeleton />;

  const publicUrl = `${window.location.origin}/m/${m.slug}`;

  return (
    <div className="container mx-auto px-6 py-8 max-w-3xl space-y-6">
      <SEO title="Microsite editor" description="Customize your public photographer microsite." />
      <div>
        <h1 className="text-3xl font-bold">Your Microsite</h1>
        <p className="text-muted-foreground">A public landing page just for you.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Public URL</CardTitle>
          <CardDescription>Share this link with prospective clients.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 items-center">
          <code className="px-3 py-2 bg-muted rounded text-sm break-all">{publicUrl}</code>
          {m.is_published && <Button asChild variant="outline" size="sm"><a href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />Open</a></Button>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Content</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Slug (URL)</Label><Input value={m.slug} onChange={(e) => setM({ ...m, slug: e.target.value })} placeholder="your-name" /></div>
          <div><Label>Headline</Label><Input value={m.headline || ""} onChange={(e) => setM({ ...m, headline: e.target.value })} /></div>
          <div><Label>About</Label><Textarea rows={5} value={m.about || ""} onChange={(e) => setM({ ...m, about: e.target.value })} /></div>
          <div>
            <Label>Hero image</Label>
            <div className="flex items-center gap-3">
              {m.hero_image_url && <img src={m.hero_image_url} alt="" className="h-16 w-24 object-cover rounded border" />}
              <label className="inline-flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted">
                <Upload className="h-4 w-4" /> Upload
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Theme color</Label><Input type="color" value={m.theme_color || "#6366f1"} onChange={(e) => setM({ ...m, theme_color: e.target.value })} /></div>
            <div><Label>Contact email</Label><Input type="email" value={m.contact_email || ""} onChange={(e) => setM({ ...m, contact_email: e.target.value })} /></div>
            <div><Label>Instagram</Label><Input value={m.instagram || ""} onChange={(e) => setM({ ...m, instagram: e.target.value })} placeholder="@handle" /></div>
            <div><Label>Website</Label><Input value={m.website || ""} onChange={(e) => setM({ ...m, website: e.target.value })} /></div>
          </div>
          <div className="flex items-center justify-between border rounded-md p-3">
            <div><p className="font-medium">Published</p><p className="text-xs text-muted-foreground">Visible to anyone with the link.</p></div>
            <Switch checked={!!m.is_published} onCheckedChange={(v) => setM({ ...m, is_published: v })} />
          </div>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save microsite"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
