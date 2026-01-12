import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, User, Clock, CheckCircle, Briefcase, Image, X, Plus, DollarSign, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, title: "Profile Info", icon: User },
  { id: 2, title: "Specialties & Gear", icon: Camera },
  { id: 3, title: "Services", icon: Briefcase },
  { id: 4, title: "Portfolio", icon: Image },
  { id: 5, title: "Complete", icon: CheckCircle },
];

interface ServiceForm {
  title: string;
  description: string;
  price: string;
  duration_hours: string;
}

const emptyService: ServiceForm = {
  title: "",
  description: "",
  price: "",
  duration_hours: "",
};

export default function PhotographerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Step 1: Profile Info
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Specialties & Gear
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [gear, setGear] = useState<string[]>([]);
  const [gearInput, setGearInput] = useState("");

  // Step 3: Services
  const [services, setServices] = useState<ServiceForm[]>([{ ...emptyService }]);

  // Step 4: Portfolio
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [portfolioInput, setPortfolioInput] = useState("");

  const addSpecialty = () => {
    if (specialtyInput.trim() && !specialties.includes(specialtyInput.trim())) {
      setSpecialties([...specialties, specialtyInput.trim()]);
      setSpecialtyInput("");
    }
  };

  const removeSpecialty = (index: number) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const addGear = () => {
    if (gearInput.trim() && !gear.includes(gearInput.trim())) {
      setGear([...gear, gearInput.trim()]);
      setGearInput("");
    }
  };

  const removeGear = (index: number) => {
    setGear(gear.filter((_, i) => i !== index));
  };

  const addPortfolio = () => {
    if (portfolioInput.trim() && !portfolioUrls.includes(portfolioInput.trim())) {
      setPortfolioUrls([...portfolioUrls, portfolioInput.trim()]);
      setPortfolioInput("");
    }
  };

  const removePortfolio = (index: number) => {
    setPortfolioUrls(portfolioUrls.filter((_, i) => i !== index));
  };

  const handlePortfolioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('portfolio')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('portfolio')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setPortfolioUrls([...portfolioUrls, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };

  const addService = () => {
    setServices([...services, { ...emptyService }]);
  };

  const removeService = (index: number) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const updateService = (index: number, field: keyof ServiceForm, value: string) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!bio.trim()) {
          toast.error("Please add a bio to introduce yourself");
          return false;
        }
        if (!location.trim()) {
          toast.error("Please add your location");
          return false;
        }
        return true;
      case 2:
        if (specialties.length === 0) {
          toast.error("Please add at least one specialty");
          return false;
        }
        return true;
      case 3:
        const validServices = services.filter(s => s.title.trim() && s.price);
        if (validServices.length === 0) {
          toast.error("Please add at least one service with title and price");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (!user) {
      toast.error("Please sign in to continue");
      return;
    }

    setLoading(true);
    try {
      // 1. Update user profile with bio, location, phone
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          bio,
          location,
          phone,
        })
        .eq("id", user.id);

      if (profileUpdateError) throw profileUpdateError;

      // 2. Create photographer profile
      const { error: photographerError } = await supabase
        .from("photographer_profiles")
        .insert({
          user_id: user.id,
          specialties,
          gear,
          portfolio_images: portfolioUrls,
          is_approved: false,
        });

      if (photographerError) throw photographerError;

      // 3. Add photographer role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "photographer",
        });

      if (roleError && !roleError.message.includes("duplicate")) {
        throw roleError;
      }

      // 4. Create services
      const validServices = services.filter(s => s.title.trim() && s.price);
      if (validServices.length > 0) {
        const servicesToInsert = validServices.map(s => ({
          photographer_id: user.id,
          title: s.title.trim(),
          description: s.description.trim() || null,
          price: parseFloat(s.price) || 0,
          duration_hours: parseInt(s.duration_hours) || null,
          is_active: true,
        }));

        const { error: servicesError } = await supabase
          .from("services")
          .insert(servicesToInsert);

        if (servicesError) throw servicesError;
      }

      toast.success("Photographer profile created! Your profile is pending admin approval.");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  if (!user) {
    return (
      <div className="container mx-auto py-8 max-w-3xl text-center">
        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
        <p className="text-muted-foreground mb-4">You need to be signed in to become a photographer.</p>
        <Button onClick={() => navigate("/auth")}>Sign In</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Become a Photographer</h1>
        <p className="text-muted-foreground">Complete your profile to start offering photography services</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <Progress value={progress} className="mb-4" />
        <div className="flex justify-between overflow-x-auto pb-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-col items-center min-w-[60px]">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-center whitespace-nowrap">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Tell us about yourself and where you're located"}
            {currentStep === 2 && "What type of photography do you specialize in?"}
            {currentStep === 3 && "Add the services you offer to clients"}
            {currentStep === 4 && "Showcase your best work"}
            {currentStep === 5 && "Review and submit your application"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Profile Info */}
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio *</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell potential clients about yourself, your experience, and your photography style..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">This will be displayed on your public profile</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., New York, NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Specialties & Gear */}
          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label>Specialties *</Label>
                <div className="flex gap-2">
                  <Input
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    placeholder="e.g., Wedding, Portrait, Events"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
                  />
                  <Button type="button" onClick={addSpecialty} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary" className="pr-1">
                      {specialty}
                      <button
                        onClick={() => removeSpecialty(idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Suggested: Wedding, Portrait, Events, Commercial, Product, Fashion, Landscape, Sports
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Photography Gear (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={gearInput}
                    onChange={(e) => setGearInput(e.target.value)}
                    placeholder="e.g., Canon EOS R5, 85mm f/1.4"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addGear())}
                  />
                  <Button type="button" onClick={addGear} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {gear.map((item, idx) => (
                    <Badge key={idx} variant="outline" className="pr-1">
                      {item}
                      <button
                        onClick={() => removeGear(idx)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Services */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add the photography services you offer. You can add more later from your dashboard.
              </p>
              
              {services.map((service, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Service {index + 1}</h4>
                      {services.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeService(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Service Title *</Label>
                      <Input
                        value={service.title}
                        onChange={(e) => updateService(index, "title", e.target.value)}
                        placeholder="e.g., Wedding Photography Package"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={service.description}
                        onChange={(e) => updateService(index, "description", e.target.value)}
                        placeholder="Describe what's included in this service..."
                        rows={2}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Price ($) *</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={service.price}
                            onChange={(e) => updateService(index, "price", e.target.value)}
                            placeholder="0"
                            className="pl-9"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Duration (hours)</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={service.duration_hours}
                            onChange={(e) => updateService(index, "duration_hours", e.target.value)}
                            placeholder="0"
                            className="pl-9"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              <Button type="button" variant="outline" onClick={addService} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Another Service
              </Button>
            </div>
          )}

          {/* Step 4: Portfolio */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Upload Portfolio Images</Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePortfolioFileUpload}
                    className="hidden"
                    id="portfolio-upload"
                    disabled={uploadingImages}
                  />
                  <label htmlFor="portfolio-upload" className="cursor-pointer">
                    {uploadingImages ? (
                      <div className="flex flex-col items-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Image className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload images or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG up to 10MB each
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Or add image URLs</Label>
                <div className="flex gap-2">
                  <Input
                    value={portfolioInput}
                    onChange={(e) => setPortfolioInput(e.target.value)}
                    placeholder="https://example.com/your-photo.jpg"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addPortfolio())}
                  />
                  <Button type="button" onClick={addPortfolio} variant="secondary">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {portfolioUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {portfolioUrls.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <img
                        src={url}
                        alt={`Portfolio ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <button
                        onClick={() => removePortfolio(idx)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Tip: Add your best 4-8 images that showcase your work. You can add more later.
              </p>
            </div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Profile Summary</h3>
                <div className="grid gap-2 text-sm">
                  <p><strong>Location:</strong> {location}</p>
                  <p><strong>Bio:</strong> {bio}</p>
                  {phone && <p><strong>Phone:</strong> {phone}</p>}
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Specialties & Gear</h3>
                <div className="flex flex-wrap gap-1">
                  {specialties.map((s, i) => (
                    <Badge key={i} variant="secondary">{s}</Badge>
                  ))}
                </div>
                {gear.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {gear.map((g, i) => (
                      <Badge key={i} variant="outline">{g}</Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-3">
                <h3 className="font-semibold">Services ({services.filter(s => s.title && s.price).length})</h3>
                {services.filter(s => s.title && s.price).map((s, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium">{s.title}</span> - ${s.price}
                    {s.duration_hours && <span className="text-muted-foreground"> ({s.duration_hours}h)</span>}
                  </div>
                ))}
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Portfolio Images: {portfolioUrls.length}</h3>
                {portfolioUrls.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {portfolioUrls.slice(0, 4).map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Portfolio ${i + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ))}
                    {portfolioUrls.length > 4 && (
                      <div className="w-16 h-16 bg-muted-foreground/20 rounded flex items-center justify-center text-sm">
                        +{portfolioUrls.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Note:</strong> Once submitted, your profile will be reviewed by our admin team. 
                  You'll receive a notification when approved and can then start accepting bookings!
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || loading}
            >
              Previous
            </Button>
            <Button onClick={handleNext} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {currentStep === STEPS.length ? "Submit Application" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
