import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MapPin, Camera, Star, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotographerData {
  photographer_profiles: {
    id: string;
    specialties: string[];
    gear: string[];
    portfolio_images: string[];
    is_approved: boolean;
  };
  first_name: string;
  last_name: string;
  bio: string;
  avatar_url: string;
  location: string;
  phone: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_hours: number;
  is_active: boolean;
}

const PhotographerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [photographer, setPhotographer] = useState<PhotographerData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPhotographerData();
    }
  }, [userId]);

  const fetchPhotographerData = async () => {
    try {
      // Fetch photographer profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setPhotographer(null);
        setServices([]);
        return;
      }

      // Fetch photographer_profiles data
      const { data: photographerProfileData, error: photographerError } = await supabase
        .from('photographer_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_approved', true)
        .maybeSingle();

      if (photographerError) throw photographerError;

      // Fetch photographer services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('photographer_id', userId)
        .eq('is_active', true);

      if (servicesError) throw servicesError;

      setPhotographer({
        ...profileData,
        photographer_profiles: photographerProfileData || {
          id: '',
          specialties: [],
          gear: [],
          portfolio_images: [],
          is_approved: false
        }
      });
      setServices(servicesData || []);
    } catch (error) {
      toast({
        title: "Error loading photographer",
        description: "Failed to fetch photographer information",
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
          <p className="text-muted-foreground">Loading photographer profile...</p>
        </div>
      </div>
    );
  }

  if (!photographer || !photographer.photographer_profiles) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center py-12">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Photographer not found</h3>
          <p className="text-muted-foreground mb-4">
            This photographer profile doesn't exist or is not approved yet.
          </p>
          <Button asChild>
            <Link to="/photographers">Back to Photographers</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header Section */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32 mx-auto md:mx-0">
              <AvatarImage src={photographer.avatar_url} />
              <AvatarFallback className="text-2xl">
                {photographer.first_name?.[0]}{photographer.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">
                {photographer.first_name} {photographer.last_name}
              </h1>
              
              {photographer.location && (
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{photographer.location}</span>
                </div>
              )}
              
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">4.8</span>
                  <span className="text-sm text-muted-foreground">(24 reviews)</span>
                </div>
                <Badge variant="outline">Verified</Badge>
              </div>
              
              {photographer.bio && (
                <p className="text-muted-foreground mb-4">{photographer.bio}</p>
              )}
              
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <Button asChild>
                  <Link to={`/book/${userId}`}>Book Service</Link>
                </Button>
                <Button variant="outline">Send Message</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Services */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Services Offered
              </CardTitle>
            </CardHeader>
            <CardContent>
              {services.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No services available at the moment.
                </p>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{service.title}</h3>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-lg font-bold text-primary">
                            <DollarSign className="h-4 w-4" />
                            {service.price}
                          </div>
                          {service.duration_hours && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {service.duration_hours}h
                            </div>
                          )}
                        </div>
                      </div>
                      {service.description && (
                        <p className="text-muted-foreground text-sm mb-3">
                          {service.description}
                        </p>
                      )}
                      <Button asChild size="sm">
                        <Link to={`/book/${userId}/${service.id}`}>
                          Book This Service
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Specialties */}
          {photographer.photographer_profiles.specialties && 
           photographer.photographer_profiles.specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Specialties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {photographer.photographer_profiles.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Equipment */}
          {photographer.photographer_profiles.gear && 
           photographer.photographer_profiles.gear.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {photographer.photographer_profiles.gear.map((item, index) => (
                    <div key={index} className="text-sm text-muted-foreground">
                      • {item}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {photographer.phone && (
                <div className="text-sm">
                  <span className="font-medium">Phone:</span> {photographer.phone}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Response time:</span> Usually within 2 hours
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PhotographerProfile;