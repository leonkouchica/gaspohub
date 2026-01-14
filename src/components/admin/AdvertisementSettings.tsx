import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, ExternalLink, Image } from "lucide-react";

interface AdvertBanner {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
  link_text: string | null;
  is_active: boolean;
  display_pages: string[];
  created_at: string;
  updated_at: string;
}

const PAGE_OPTIONS = [
  { value: "home", label: "Home Page" },
  { value: "photographers", label: "Photographers Page" },
  { value: "services", label: "Services Page" },
];

export const AdvertisementSettings = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<AdvertBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<AdvertBanner | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image_url: "",
    link_url: "",
    link_text: "Learn More",
    is_active: true,
    display_pages: ["home", "photographers", "services"],
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("advertisement_banners")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBanners(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (banner?: AdvertBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        title: banner.title,
        description: banner.description || "",
        image_url: banner.image_url,
        link_url: banner.link_url || "",
        link_text: banner.link_text || "Learn More",
        is_active: banner.is_active,
        display_pages: banner.display_pages || ["home", "photographers", "services"],
      });
    } else {
      setEditingBanner(null);
      setFormData({
        title: "",
        description: "",
        image_url: "",
        link_url: "",
        link_text: "Learn More",
        is_active: true,
        display_pages: ["home", "photographers", "services"],
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.image_url) {
      toast({
        title: "Validation Error",
        description: "Title and Image URL are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingBanner) {
        const { error } = await supabase
          .from("advertisement_banners")
          .update({
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            link_text: formData.link_text || "Learn More",
            is_active: formData.is_active,
            display_pages: formData.display_pages,
          })
          .eq("id", editingBanner.id);

        if (error) throw error;
        toast({ title: "Success", description: "Banner updated successfully" });
      } else {
        const { error } = await supabase
          .from("advertisement_banners")
          .insert({
            title: formData.title,
            description: formData.description || null,
            image_url: formData.image_url,
            link_url: formData.link_url || null,
            link_text: formData.link_text || "Learn More",
            is_active: formData.is_active,
            display_pages: formData.display_pages,
          });

        if (error) throw error;
        toast({ title: "Success", description: "Banner created successfully" });
      }

      setDialogOpen(false);
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this banner?")) return;

    try {
      const { error } = await supabase
        .from("advertisement_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Success", description: "Banner deleted successfully" });
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("advertisement_banners")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Success",
        description: `Banner ${isActive ? "activated" : "deactivated"} successfully`,
      });
      fetchBanners();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePageToggle = (page: string) => {
    setFormData((prev) => ({
      ...prev,
      display_pages: prev.display_pages.includes(page)
        ? prev.display_pages.filter((p) => p !== page)
        : [...prev.display_pages, page],
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading banners...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Advertisement Banners
              </CardTitle>
              <CardDescription>
                Manage advertisement banners displayed across the platform
              </CardDescription>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingBanner ? "Edit Banner" : "Create New Banner"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure the advertisement banner settings
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="e.g., Upgrade Your Photography Gear"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Optional description text"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="image_url">Image URL *</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) =>
                        setFormData({ ...formData, image_url: e.target.value })
                      }
                      placeholder="https://example.com/image.jpg"
                    />
                    {formData.image_url && (
                      <div className="mt-2 rounded-lg overflow-hidden border">
                        <img
                          src={formData.image_url}
                          alt="Preview"
                          className="w-full h-24 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="link_url">Link URL</Label>
                      <Input
                        id="link_url"
                        value={formData.link_url}
                        onChange={(e) =>
                          setFormData({ ...formData, link_url: e.target.value })
                        }
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="link_text">Link Text</Label>
                      <Input
                        id="link_text"
                        value={formData.link_text}
                        onChange={(e) =>
                          setFormData({ ...formData, link_text: e.target.value })
                        }
                        placeholder="Learn More"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Display on Pages</Label>
                    <div className="flex flex-wrap gap-4">
                      {PAGE_OPTIONS.map((page) => (
                        <div key={page.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={page.value}
                            checked={formData.display_pages.includes(page.value)}
                            onCheckedChange={() => handlePageToggle(page.value)}
                          />
                          <label
                            htmlFor={page.value}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {page.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>
                    {editingBanner ? "Update" : "Create"} Banner
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No banners configured. Click "Add Banner" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.map((banner) => (
                  <TableRow key={banner.id}>
                    <TableCell>
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-24 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{banner.title}</p>
                        {banner.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {banner.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {banner.display_pages?.map((page) => (
                          <Badge key={page} variant="secondary" className="text-xs">
                            {page}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={(checked) =>
                          handleToggleActive(banner.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {banner.link_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a
                              href={banner.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(banner)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(banner.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
