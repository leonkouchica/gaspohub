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

// Sample photographer data for demo
const samplePhotographersData: Record<string, {
  profile: PhotographerData;
  services: Service[];
  reviews: Review[];
}> = {
  "sample-user-1": {
    profile: {
      photographer_profiles: {
        id: "sample-1",
        specialties: ["Wedding", "Portrait", "Events"],
        gear: ["Canon EOS R5", "Sony A7 IV", "85mm f/1.4", "24-70mm f/2.8"],
        portfolio_images: [
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
          "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
          "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
          "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800"
        ],
        is_approved: true
      },
      first_name: "Sarah",
      last_name: "Johnson",
      bio: "Award-winning wedding and portrait photographer with 10+ years of experience capturing life's most precious moments. I believe in creating timeless images that tell your unique story.",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
      location: "New York, NY",
      phone: "+1 (555) 123-4567"
    },
    services: [
      { id: "s1", title: "Wedding Photography", description: "Full-day wedding coverage including ceremony, reception, and portraits", price: 2500, duration_hours: 8, is_active: true },
      { id: "s2", title: "Engagement Session", description: "1-2 hour session at location of your choice", price: 350, duration_hours: 2, is_active: true },
      { id: "s3", title: "Portrait Session", description: "Individual or family portrait session", price: 250, duration_hours: 1, is_active: true }
    ],
    reviews: [
      { id: "r1", rating: 5, comment: "Sarah captured our wedding beautifully! Every photo tells a story.", created_at: "2024-12-15T10:00:00Z", reviewer_id: "rev1", is_public: true, reviewer_profile: { first_name: "Emily", last_name: "Davis", avatar_url: "" } },
      { id: "r2", rating: 5, comment: "Professional, creative, and so easy to work with. Highly recommend!", created_at: "2024-11-20T10:00:00Z", reviewer_id: "rev2", is_public: true, reviewer_profile: { first_name: "Michael", last_name: "Brown", avatar_url: "" } }
    ]
  },
  "sample-user-2": {
    profile: {
      photographer_profiles: {
        id: "sample-2",
        specialties: ["Commercial", "Product", "Fashion"],
        gear: ["Nikon Z9", "Phase One", "Profoto Lighting"],
        portfolio_images: [
          "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800",
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800",
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800"
        ],
        is_approved: true
      },
      first_name: "Michael",
      last_name: "Chen",
      bio: "Commercial photographer specializing in product and fashion photography for top brands worldwide. Creating images that sell.",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      location: "Los Angeles, CA",
      phone: "+1 (555) 234-5678"
    },
    services: [
      { id: "s4", title: "Product Photography", description: "Professional product shots for e-commerce and marketing", price: 500, duration_hours: 4, is_active: true },
      { id: "s5", title: "Fashion Shoot", description: "Full fashion photography session with styling consultation", price: 1500, duration_hours: 6, is_active: true }
    ],
    reviews: [
      { id: "r3", rating: 5, comment: "Michael's product photos increased our conversion rate by 40%!", created_at: "2024-12-01T10:00:00Z", reviewer_id: "rev3", is_public: true, reviewer_profile: { first_name: "Lisa", last_name: "Wang", avatar_url: "" } }
    ]
  },
  "sample-user-3": {
    profile: {
      photographer_profiles: {
        id: "sample-3",
        specialties: ["Landscape", "Nature", "Travel"],
        gear: ["Sony A1", "DJI Mavic 3", "16-35mm f/2.8"],
        portfolio_images: [
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
          "https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800",
          "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800"
        ],
        is_approved: true
      },
      first_name: "Emma",
      last_name: "Williams",
      bio: "Nature and landscape photographer documenting Earth's most beautiful places and wildlife. Available for travel assignments worldwide.",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      location: "Denver, CO",
      phone: "+1 (555) 345-6789"
    },
    services: [
      { id: "s6", title: "Landscape Print", description: "High-quality landscape print with custom sizing", price: 200, duration_hours: 0, is_active: true },
      { id: "s7", title: "Photography Workshop", description: "Half-day landscape photography workshop", price: 300, duration_hours: 4, is_active: true }
    ],
    reviews: [
      { id: "r4", rating: 5, comment: "Emma's workshop was incredible! Learned so much about composition.", created_at: "2024-11-15T10:00:00Z", reviewer_id: "rev4", is_public: true, reviewer_profile: { first_name: "John", last_name: "Smith", avatar_url: "" } }
    ]
  },
  "sample-user-4": {
    profile: {
      photographer_profiles: {
        id: "sample-4",
        specialties: ["Wedding", "Engagement", "Family"],
        gear: ["Canon R6 II", "85mm f/1.2", "35mm f/1.4"],
        portfolio_images: [
          "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
          "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=800",
          "https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800",
          "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800"
        ],
        is_approved: true
      },
      first_name: "David",
      last_name: "Martinez",
      bio: "Passionate about capturing authentic emotions and creating timeless wedding memories for couples.",
      avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      location: "Miami, FL",
      phone: "+1 (555) 456-7890"
    },
    services: [
      { id: "s8", title: "Wedding Package", description: "Complete wedding day coverage", price: 3000, duration_hours: 10, is_active: true },
      { id: "s9", title: "Elopement Package", description: "Intimate ceremony coverage", price: 1200, duration_hours: 4, is_active: true }
    ],
    reviews: [
      { id: "r5", rating: 5, comment: "David made us feel so comfortable. Our wedding photos are perfect!", created_at: "2024-12-10T10:00:00Z", reviewer_id: "rev5", is_public: true, reviewer_profile: { first_name: "Maria", last_name: "Garcia", avatar_url: "" } }
    ]
  },
  "sample-user-5": {
    profile: {
      photographer_profiles: {
        id: "sample-5",
        specialties: ["Portrait", "Headshot", "Corporate"],
        gear: ["Sony A7R V", "Profoto B10", "70-200mm f/2.8"],
        portfolio_images: [
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
          "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800",
          "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=800"
        ],
        is_approved: true
      },
      first_name: "Jessica",
      last_name: "Taylor",
      bio: "Professional headshot and corporate portrait photographer helping individuals and businesses shine.",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
      location: "Chicago, IL",
      phone: "+1 (555) 567-8901"
    },
    services: [
      { id: "s10", title: "Professional Headshot", description: "Studio headshot session with retouching", price: 200, duration_hours: 1, is_active: true },
      { id: "s11", title: "Corporate Team Photos", description: "On-site team photography session", price: 800, duration_hours: 3, is_active: true }
    ],
    reviews: [
      { id: "r6", rating: 5, comment: "Got my LinkedIn photo done. Already received compliments!", created_at: "2024-11-25T10:00:00Z", reviewer_id: "rev6", is_public: true, reviewer_profile: { first_name: "Robert", last_name: "Johnson", avatar_url: "" } }
    ]
  },
  "sample-user-6": {
    profile: {
      photographer_profiles: {
        id: "sample-6",
        specialties: ["Sports", "Action", "Events"],
        gear: ["Canon EOS R3", "400mm f/2.8", "70-200mm f/2.8"],
        portfolio_images: [
          "https://images.unsplash.com/photo-1461896836934- voices-photographer?w=800",
          "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
          "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800",
          "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800"
        ],
        is_approved: true
      },
      first_name: "James",
      last_name: "Anderson",
      bio: "Sports and action photographer capturing the intensity and emotion of athletic moments.",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      location: "Boston, MA",
      phone: "+1 (555) 678-9012"
    },
    services: [
      { id: "s12", title: "Sports Event Coverage", description: "Full event coverage with action shots", price: 600, duration_hours: 4, is_active: true },
      { id: "s13", title: "Athlete Portfolio", description: "Action portfolio session for athletes", price: 400, duration_hours: 2, is_active: true }
    ],
    reviews: [
      { id: "r7", rating: 5, comment: "James captured amazing shots of my marathon. True professional!", created_at: "2024-12-05T10:00:00Z", reviewer_id: "rev7", is_public: true, reviewer_profile: { first_name: "Tom", last_name: "Wilson", avatar_url: "" } }
    ]
  }
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
      if (userId && samplePhotographersData[userId]) {
        const sampleData = samplePhotographersData[userId];
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