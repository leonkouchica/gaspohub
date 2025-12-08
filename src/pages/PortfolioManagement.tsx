import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Upload, Trash2, GripVertical, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PortfolioManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      fetchPortfolioImages();
    }
  }, [user]);

  const fetchPortfolioImages = async () => {
    try {
      const { data, error } = await supabase
        .from("photographer_profiles")
        .select("portfolio_images")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (error) throw error;
      setImages(data?.portfolio_images || []);
    } catch (error) {
      toast({
        title: "Error loading portfolio",
        description: "Failed to fetch your portfolio images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds 10MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("portfolio")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("portfolio")
          .getPublicUrl(fileName);

        newImages.push(publicUrl);
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];
        await saveImages(updatedImages);
        setImages(updatedImages);
        toast({
          title: "Upload successful",
          description: `${newImages.length} image(s) added to your portfolio`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    await saveImages(updatedImages);
    setImages(updatedImages);
    toast({
      title: "Image removed",
      description: "The image has been removed from your portfolio",
    });
  };

  const saveImages = async (imagesToSave: string[]) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("photographer_profiles")
        .update({ portfolio_images: imagesToSave })
        .eq("user_id", user?.id);

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    setImages(newImages);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex !== null) {
      await saveImages(images);
    }
    setDraggedIndex(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumbs />

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Portfolio Management</h1>
        <p className="text-muted-foreground">
          Upload and arrange your portfolio images. Drag to reorder.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Your Portfolio ({images.length} images)
          </CardTitle>
          <CardDescription>
            Upload high-quality images to showcase your work. Max 10MB per image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Upload Button */}
          <div className="mb-6">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="portfolio-upload"
              disabled={uploading}
            />
            <label htmlFor="portfolio-upload">
              <Button asChild disabled={uploading}>
                <span className="cursor-pointer">
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Images
                    </>
                  )}
                </span>
              </Button>
            </label>
            {saving && (
              <span className="ml-4 text-sm text-muted-foreground">
                Saving changes...
              </span>
            )}
          </div>

          {/* Portfolio Grid */}
          {images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No portfolio images yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your best work to attract clients
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "relative group cursor-move rounded-lg overflow-hidden border",
                    draggedIndex === index && "opacity-50 ring-2 ring-primary"
                  )}
                >
                  <AspectRatio ratio={4 / 3}>
                    <img
                      src={image}
                      alt={`Portfolio image ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div className="absolute top-2 left-2">
                      <GripVertical className="h-5 w-5 text-white" />
                    </div>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Image number */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioManagement;
