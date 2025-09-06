import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Camera, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotographerProfile {
  id: string;
  user_id: string;
  specialties: string[];
  gear: string[];
  portfolio_images: string[];
  is_approved: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    bio: string;
    avatar_url: string;
    location: string;
  };
}

const Photographers = () => {
  const [photographers, setPhotographers] = useState<PhotographerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotographers();
  }, []);

  const fetchPhotographers = async () => {
    try {
      const { data, error } = await supabase
        .from('photographer_profiles')
        .select('*')
        .eq('is_approved', true);

      if (error) throw error;

      // Fetch profiles for each photographer
      const photographersWithProfiles = await Promise.all(
        (data || []).map(async (profile) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, bio, avatar_url, location')
            .eq('id', profile.user_id)
            .single();

          return {
            ...profile,
            profiles: profileData || {
              first_name: '',
              last_name: '',
              bio: '',
              avatar_url: '',
              location: ''
            }
          };
        })
      );

      setPhotographers(photographersWithProfiles);
    } catch (error) {
      toast({
        title: "Error loading photographers",
        description: "Failed to fetch photographer profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-64">
          <p className="text-muted-foreground">Loading photographers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Photographers</h1>
        <p className="text-muted-foreground">
          Discover talented photographers and book their services
        </p>
      </div>

      {photographers.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No photographers found</h3>
          <p className="text-muted-foreground">
            Be the first photographer to join our platform!
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photographers.map((photographer) => (
            <Card key={photographer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={photographer.profiles?.avatar_url} />
                    <AvatarFallback>
                      {photographer.profiles?.first_name?.[0]}
                      {photographer.profiles?.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">
                      {photographer.profiles?.first_name} {photographer.profiles?.last_name}
                    </CardTitle>
                    {photographer.profiles?.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {photographer.profiles.location}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {photographer.profiles?.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {photographer.profiles.bio}
                  </p>
                )}
                
                {photographer.specialties && photographer.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Specialties:</p>
                    <div className="flex flex-wrap gap-1">
                      {photographer.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {photographer.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{photographer.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">4.8</span>
                    <span className="text-xs text-muted-foreground">(24 reviews)</span>
                  </div>
                  
                  <Button asChild size="sm">
                    <Link to={`/photographers/${photographer.user_id}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Photographers;