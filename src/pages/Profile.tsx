import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { User, Mail, Phone, MapPin, Edit, Save, X, Camera, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio: string;
  location: string;
  phone: string;
}

interface UserRole {
  role: string;
}

interface PhotographerProfile {
  specialties: string[];
  gear: string[];
  portfolio_images: string[];
  social_links: any;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [photographerProfile, setPhotographerProfile] = useState<PhotographerProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newGear, setNewGear] = useState("");
  const [newPortfolioImage, setNewPortfolioImage] = useState("");
  const { toast } = useToast();

  const isPhotographer = roles.some(r => r.role === 'photographer');

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRoles();
    }
  }, [user]);

  useEffect(() => {
    if (isPhotographer) {
      fetchPhotographerProfile();
    }
  }, [isPhotographer]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      toast({
        title: "Error loading profile",
        description: "Failed to fetch profile information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id);

      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchPhotographerProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('photographer_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setPhotographerProfile(data);
      } else {
        // Create default photographer profile
        setPhotographerProfile({
          specialties: [],
          gear: [],
          portfolio_images: [],
          social_links: {}
        });
      }
    } catch (error) {
      console.error('Error fetching photographer profile:', error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          bio: profile.bio,
          location: profile.location,
          phone: profile.phone,
        })
        .eq('id', user?.id);

      if (error) throw error;

      setEditing(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update your profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    fetchProfile(); // Reset to original values
  };

  const handleSavePortfolio = async () => {
    if (!photographerProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('photographer_profiles')
        .upsert({
          user_id: user?.id,
          specialties: photographerProfile.specialties,
          gear: photographerProfile.gear,
          portfolio_images: photographerProfile.portfolio_images,
          social_links: photographerProfile.social_links,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setEditingPortfolio(false);
      toast({
        title: "Portfolio updated",
        description: "Your portfolio has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update your portfolio",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && photographerProfile) {
      setPhotographerProfile({
        ...photographerProfile,
        specialties: [...photographerProfile.specialties, newSpecialty.trim()]
      });
      setNewSpecialty("");
    }
  };

  const removeSpecialty = (index: number) => {
    if (photographerProfile) {
      setPhotographerProfile({
        ...photographerProfile,
        specialties: photographerProfile.specialties.filter((_, i) => i !== index)
      });
    }
  };

  const addGear = () => {
    if (newGear.trim() && photographerProfile) {
      setPhotographerProfile({
        ...photographerProfile,
        gear: [...photographerProfile.gear, newGear.trim()]
      });
      setNewGear("");
    }
  };

  const removeGear = (index: number) => {
    if (photographerProfile) {
      setPhotographerProfile({
        ...photographerProfile,
        gear: photographerProfile.gear.filter((_, i) => i !== index)
      });
    }
  };

  const addPortfolioImage = () => {
    if (newPortfolioImage.trim() && photographerProfile) {
      setPhotographerProfile({
        ...photographerProfile,
        portfolio_images: [...photographerProfile.portfolio_images, newPortfolioImage.trim()]
      });
      setNewPortfolioImage("");
    }
  };

  const removePortfolioImage = (index: number) => {
    if (photographerProfile) {
      setPhotographerProfile({
        ...photographerProfile,
        portfolio_images: photographerProfile.portfolio_images.filter((_, i) => i !== index)
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out",
      });
    } catch (error) {
      toast({
        title: "Sign out failed",
        description: "Could not sign you out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container mx-auto px-6 py-8">
      <Breadcrumbs />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
                {!editing ? (
                  <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-xl">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  {roles.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {roles.map((role, index) => (
                        <Badge key={index} variant="outline">
                          {role.role}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  {editing ? (
                    <Input
                      id="first_name"
                      value={profile.first_name || ""}
                      onChange={(e) => setProfile(prev => prev ? {...prev, first_name: e.target.value} : null)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-sm">{profile.first_name || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  {editing ? (
                    <Input
                      id="last_name"
                      value={profile.last_name || ""}
                      onChange={(e) => setProfile(prev => prev ? {...prev, last_name: e.target.value} : null)}
                      className="mt-2"
                    />
                  ) : (
                    <p className="mt-2 text-sm">{profile.last_name || "Not provided"}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{profile.email}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                {editing ? (
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ""}
                    onChange={(e) => setProfile(prev => prev ? {...prev, phone: e.target.value} : null)}
                    className="mt-2"
                    placeholder="Your phone number"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{profile.phone || "Not provided"}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                {editing ? (
                  <Input
                    id="location"
                    value={profile.location || ""}
                    onChange={(e) => setProfile(prev => prev ? {...prev, location: e.target.value} : null)}
                    className="mt-2"
                    placeholder="Your city or region"
                  />
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{profile.location || "Not provided"}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                {editing ? (
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                    className="mt-2"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <p className="mt-2 text-sm whitespace-pre-wrap">
                    {profile.bio || "No bio provided"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Actions */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSignOut}
                variant="destructive" 
                className="w-full"
              >
                Sign Out
              </Button>
              
              <div className="text-xs text-muted-foreground">
                <p>Need help? Contact support at help@gaspohub.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Photographer Portfolio Section */}
      {isPhotographer && photographerProfile && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Photographer Portfolio
                </CardTitle>
                {!editingPortfolio ? (
                  <Button onClick={() => setEditingPortfolio(true)} variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Portfolio
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSavePortfolio} size="sm" disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button onClick={() => setEditingPortfolio(false)} variant="outline" size="sm">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Specialties */}
              <div>
                <Label>Specialties</Label>
                {editingPortfolio ? (
                  <div className="mt-2 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add specialty (e.g., Wedding, Portrait)"
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      />
                      <Button onClick={addSpecialty} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {photographerProfile.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="gap-2">
                          {specialty}
                          <button onClick={() => removeSpecialty(index)} className="hover:text-destructive">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {photographerProfile.specialties.length > 0 ? (
                      photographerProfile.specialties.map((specialty, index) => (
                        <Badge key={index} variant="secondary">{specialty}</Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No specialties added</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Gear */}
              <div>
                <Label>Equipment & Gear</Label>
                {editingPortfolio ? (
                  <div className="mt-2 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add equipment (e.g., Canon EOS R5)"
                        value={newGear}
                        onChange={(e) => setNewGear(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGear())}
                      />
                      <Button onClick={addGear} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {photographerProfile.gear.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <span className="text-sm">{item}</span>
                          <Button 
                            onClick={() => removeGear(index)} 
                            size="sm" 
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {photographerProfile.gear.length > 0 ? (
                      photographerProfile.gear.map((item, index) => (
                        <div key={index} className="text-sm p-2 bg-muted rounded">
                          {item}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No equipment listed</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Portfolio Images */}
              <div>
                <Label>Portfolio Images (URLs)</Label>
                {editingPortfolio ? (
                  <div className="mt-2 space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add image URL"
                        value={newPortfolioImage}
                        onChange={(e) => setNewPortfolioImage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPortfolioImage())}
                      />
                      <Button onClick={addPortfolioImage} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photographerProfile.portfolio_images.map((url, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={url} 
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <Button
                            onClick={() => removePortfolioImage(index)}
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {photographerProfile.portfolio_images.length > 0 ? (
                      photographerProfile.portfolio_images.map((url, index) => (
                        <img 
                          key={index}
                          src={url} 
                          alt={`Portfolio ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground col-span-full">No portfolio images added</p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;