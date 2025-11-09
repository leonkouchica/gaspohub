import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Camera, User, Clock, CheckCircle } from "lucide-react";

const STEPS = [
  { id: 1, title: "Profile Info", icon: User },
  { id: 2, title: "Portfolio", icon: Camera },
  { id: 3, title: "Availability", icon: Clock },
  { id: 4, title: "Complete", icon: CheckCircle },
];

export default function PhotographerOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [gear, setGear] = useState<string[]>([]);
  const [gearInput, setGearInput] = useState("");

  // Step 2: Portfolio
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [portfolioInput, setPortfolioInput] = useState("");

  // Step 3: Availability
  const [availabilityNotes, setAvailabilityNotes] = useState("");

  const addSpecialty = () => {
    if (specialtyInput.trim()) {
      setSpecialties([...specialties, specialtyInput.trim()]);
      setSpecialtyInput("");
    }
  };

  const addGear = () => {
    if (gearInput.trim()) {
      setGear([...gear, gearInput.trim()]);
      setGearInput("");
    }
  };

  const addPortfolio = () => {
    if (portfolioInput.trim()) {
      setPortfolioUrls([...portfolioUrls, portfolioInput.trim()]);
      setPortfolioInput("");
    }
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create photographer profile
      const { error: profileError } = await supabase
        .from("photographer_profiles")
        .insert({
          user_id: user.id,
          specialties,
          gear,
          portfolio_images: portfolioUrls,
          is_approved: false,
        });

      if (profileError) throw profileError;

      // Add photographer role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: user.id,
          role: "photographer",
        });

      if (roleError) throw roleError;

      toast.success("Photographer profile created! Awaiting admin approval.");
      navigate("/profile");
    } catch (error: any) {
      toast.error(error.message || "Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Become a Photographer</h1>
        <p className="text-muted-foreground">Complete your profile to start offering services</p>
      </div>

      <div className="mb-8">
        <Progress value={progress} className="mb-4" />
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    isComplete
                      ? "bg-primary text-primary-foreground"
                      : isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-center">{step.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
          <CardDescription>
            {currentStep === 1 && "Tell us about your photography expertise"}
            {currentStep === 2 && "Showcase your best work"}
            {currentStep === 3 && "Set your availability preferences"}
            {currentStep === 4 && "Review and submit your application"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label>Specialties</Label>
                <div className="flex gap-2">
                  <Input
                    value={specialtyInput}
                    onChange={(e) => setSpecialtyInput(e.target.value)}
                    placeholder="e.g., Wedding Photography"
                    onKeyPress={(e) => e.key === "Enter" && addSpecialty()}
                  />
                  <Button type="button" onClick={addSpecialty}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {specialties.map((specialty, idx) => (
                    <Badge key={idx} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Photography Gear</Label>
                <div className="flex gap-2">
                  <Input
                    value={gearInput}
                    onChange={(e) => setGearInput(e.target.value)}
                    placeholder="e.g., Canon EOS R5"
                    onKeyPress={(e) => e.key === "Enter" && addGear()}
                  />
                  <Button type="button" onClick={addGear}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {gear.map((item, idx) => (
                    <Badge key={idx} variant="outline">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <div className="space-y-2">
              <Label>Portfolio Images (URLs)</Label>
              <div className="flex gap-2">
                <Input
                  value={portfolioInput}
                  onChange={(e) => setPortfolioInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  onKeyPress={(e) => e.key === "Enter" && addPortfolio()}
                />
                <Button type="button" onClick={addPortfolio}>
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4">
                {portfolioUrls.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={url} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-2">
              <Label>Availability Notes</Label>
              <Textarea
                value={availabilityNotes}
                onChange={(e) => setAvailabilityNotes(e.target.value)}
                placeholder="Describe your general availability (e.g., Weekends preferred, travel radius, etc.)"
                rows={5}
              />
              <p className="text-sm text-muted-foreground">
                You can set specific availability slots later from your dashboard
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Profile Summary</h3>
                <p className="text-sm">
                  <strong>Specialties:</strong> {specialties.join(", ") || "None"}
                </p>
                <p className="text-sm">
                  <strong>Gear:</strong> {gear.join(", ") || "None"}
                </p>
                <p className="text-sm">
                  <strong>Portfolio Images:</strong> {portfolioUrls.length}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Once submitted, your profile will be reviewed by our admin team. You'll be notified when approved!
              </p>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            <Button onClick={handleNext} disabled={loading}>
              {currentStep === 4 ? "Submit Application" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
