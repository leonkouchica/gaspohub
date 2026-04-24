import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { SEO } from "@/components/SEO";
import { MapPin, Camera, Star, Clock, DollarSign, Image as ImageIcon, MessageSquare, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { useFavorites } from "@/hooks/useFavorites";
import { SocialShare } from "@/components/SocialShare";
import { 
  samplePhotographers, 
  sampleServices, 
  sampleReviews,
  getSamplePhotographerByUserId,
  getSampleServicesByPhotographerId,
  getSampleReviewsByPhotographerId 
} from "@/data/sampleData";

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

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_id: string;
  is_public: boolean;
  reviewer_profile: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

// Build sample photographers data from shared data
const buildSamplePhotographerData = (userId: string) => {
  const photographer = getSamplePhotographerByUserId(userId);
  if (!photographer) return null;
  
  const services = getSampleServicesByPhotographerId(userId).map(s => ({
    id: s.id,
    title: s.title,
    description: s.description,
    price: s.price,
    duration_hours: s.duration_hours,
    is_active: s.is_active ?? true
  }));
  
  const reviews = getSampleReviewsByPhotographerId(userId);
  
  return {
    profile: {
      photographer_profiles: {
        id: photographer.id,
        specialties: photographer.specialties,
        gear: photographer.gear,
        portfolio_images: photographer.portfolio_images,
        is_approved: photographer.is_approved
      },
      first_name: photographer.profiles.first_name,
      last_name: photographer.profiles.last_name,
      bio: photographer.profiles.bio,
      avatar_url: photographer.profiles.avatar_url,
      location: photographer.profiles.location,
      phone: photographer.profiles.phone || ""
    },
    services,
    reviews
  };
};

const PhotographerProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { isFavorite, loading: favoriteLoading, toggleFavorite } = useFavorites("photographer", userId || "");
  const [photographer, setPhotographer] = useState<PhotographerData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchPhotographerData();
    }
  }, [userId]);

  const fetchPhotographerData = async () => {
    try {
      // Check if this is a sample photographer first
      const sampleData = userId ? buildSamplePhotographerData(userId) : null;
      if (sampleData) {
        setPhotographer(sampleData.profile);
        setServices(sampleData.services);
        setReviews(sampleData.reviews);
        const avgRating = sampleData.reviews.length > 0
          ? sampleData.reviews.reduce((sum, r) => sum + r.rating, 0) / sampleData.reviews.length
          : 0;
        setAverageRating(avgRating);
        setLoading(false);
        return;
      }

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
        setReviews([]);
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

      // Fetch reviews - using separate queries to avoid relationship issues
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('photographer_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;

      // Fetch reviewer profiles separately
      const transformedReviews = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: reviewerProfile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', review.reviewer_id)
            .single();

          return {
            ...review,
            reviewer_profile: reviewerProfile || { first_name: '', last_name: '', avatar_url: '' }
          };
        })
      );

      // Calculate average rating
      const avgRating = transformedReviews && transformedReviews.length > 0 
        ? transformedReviews.reduce((sum, review) => sum + review.rating, 0) / transformedReviews.length
        : 0;

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
      setReviews(transformedReviews);
      setAverageRating(avgRating);
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

  const handleSendMessage = async () => {
    if (!user || !photographer) {
      toast({
        title: "Authentication required",
        description: "Please log in to send a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: userId,
          subject: `Inquiry about photography services`,
          content: `Hi ${photographer.first_name}, I'm interested in your photography services. Could we discuss the details?`
        });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "Your message has been sent to the photographer",
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Could not send your message. Please try again.",
        variant: "destructive",
      });
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

  const photographerName = `${photographer.first_name} ${photographer.last_name}`;
  
  return (
    <>
      <SEO 
        title={`${photographerName} - Photographer`}
        description={photographer.bio || `View ${photographerName}'s portfolio, services, and reviews. Book your photography session today.`}
        keywords={`${photographerName}, photographer, ${photographer.photographer_profiles?.specialties?.join(', ') || 'photography'}`}
      />
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
                  <span className="font-medium">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
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
                <Button variant="outline" onClick={handleSendMessage}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                  {isFavorite ? "Saved" : "Save"}
                </Button>
                <SocialShare
                  title={`${photographer?.first_name} ${photographer?.last_name} - Photographer`}
                  description={photographer?.bio || "Check out this photographer's profile"}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="services" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            
            {/* Services Tab */}
            <TabsContent value="services">
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
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Portfolio Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {photographer?.photographer_profiles.portfolio_images && 
                   photographer.photographer_profiles.portfolio_images.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {photographer.photographer_profiles.portfolio_images.map((image, index) => (
                        <AspectRatio key={index} ratio={4/3} className="overflow-hidden rounded-lg">
                          <img 
                            src={image} 
                            alt={`Portfolio image ${index + 1}`}
                            loading="lazy"
                            decoding="async"
                            className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                          />
                        </AspectRatio>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No portfolio images available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Client Reviews ({reviews.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12">
                      <Star className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarImage src={review.reviewer_profile?.avatar_url} />
                              <AvatarFallback>
                                {review.reviewer_profile?.first_name?.[0]}
                                {review.reviewer_profile?.last_name?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-medium">
                                    {review.reviewer_profile?.first_name} {review.reviewer_profile?.last_name}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star 
                                        key={i} 
                                        className={`h-4 w-4 ${
                                          i < review.rating 
                                            ? 'fill-primary text-primary' 
                                            : 'fill-muted text-muted'
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(review.created_at), "MMM d, yyyy")}
                                </p>
                              </div>
                              {review.comment && (
                                <p className="text-muted-foreground">{review.comment}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
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
    </>
  );
};

export default PhotographerProfile;