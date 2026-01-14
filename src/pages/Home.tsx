import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Camera, Users, ShoppingBag, Star, Search, ArrowRight, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";
import { samplePhotographers, sampleServices } from "@/data/sampleData";
import { AdvertBanner } from "@/components/AdvertBanner";

interface FeaturedPhotographer {
  id: string;
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
    location: string;
  };
  photographer_profiles: {
    specialties: string[];
    is_approved: boolean;
  };
  services_count: number;
}

interface FeaturedService {
  id: string;
  title: string;
  description: string;
  price: number;
  photographer_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

const Home = () => {
  const { user } = useAuth();
  const [featuredPhotographers, setFeaturedPhotographers] = useState<FeaturedPhotographer[]>([]);
  const [featuredServices, setFeaturedServices] = useState<FeaturedService[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFeaturedData();
  }, []);

  const fetchFeaturedData = async () => {
    // Fetch featured photographers
    const { data: photographerData } = await supabase
      .from('photographer_profiles')
      .select('*')
      .eq('is_approved', true)
      .limit(6);

    if (photographerData && photographerData.length > 0) {
      const photographersWithCount = await Promise.all(
        photographerData.map(async (photographer) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, location')
            .eq('id', photographer.user_id)
            .single();

          const { count } = await supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('photographer_id', photographer.user_id)
            .eq('is_active', true);

          return {
            id: photographer.user_id,
            profiles: profileData || {
              id: '',
              first_name: '',
              last_name: '',
              avatar_url: '',
              location: ''
            },
            photographer_profiles: photographer,
            services_count: count || 0
          };
        })
      );
      setFeaturedPhotographers(photographersWithCount);
    } else {
      // Show sample data when database is empty - map to the expected format
      const mappedSamplePhotographers = samplePhotographers.map(p => ({
        id: p.user_id,
        profiles: {
          id: p.profiles.id,
          first_name: p.profiles.first_name,
          last_name: p.profiles.last_name,
          avatar_url: p.profiles.avatar_url,
          location: p.profiles.location
        },
        photographer_profiles: {
          specialties: p.specialties,
          is_approved: p.is_approved
        },
        services_count: p.services_count
      }));
      setFeaturedPhotographers(mappedSamplePhotographers);
    }

    // Fetch featured services
    const { data: servicesData } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .limit(8);

    if (servicesData && servicesData.length > 0) {
      const servicesWithProfiles = await Promise.all(
        servicesData.map(async (service) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', service.photographer_id)
            .single();

          return {
            ...service,
            profiles: profileData || {
              first_name: '',
              last_name: '',
              avatar_url: ''
            }
          };
        })
      );
      setFeaturedServices(servicesWithProfiles);
    } else {
      // Show sample services when database is empty - map to the expected format
      const mappedSampleServices = sampleServices.map(s => ({
        id: s.id,
        title: s.title,
        description: s.description,
        price: s.price,
        photographer_id: s.photographer_id,
        profiles: {
          first_name: s.profiles.first_name,
          last_name: s.profiles.last_name,
          avatar_url: s.profiles.avatar_url
        }
      }));
      setFeaturedServices(mappedSampleServices);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/dashboard/search?q=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <div className="min-h-screen">
      <SEO 
        title="Find & Book Professional Photographers"
        description="Connect with talented photographers for weddings, portraits, events and more. Browse portfolios, book sessions, and shop prints on PhotoPro Marketplace."
        keywords="photography, photographers, book photographer, wedding photography, portrait photography, photo prints, photography marketplace"
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect
            <span className="block text-primary">Photography Partner</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with talented photographers for weddings, portraits, events, and more. 
            Discover unique prints and equipment in our marketplace.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search photographers, services, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg"
              />
              <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2">
                Search
              </Button>
            </div>
          </form>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="text-lg px-8">
              <Link to="/photographers">
                <Users className="mr-2 h-5 w-5" />
                Browse Photographers
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-lg px-8">
              <Link to="/services">
                <Camera className="mr-2 h-5 w-5" />
                Explore Services
              </Link>
            </Button>
            {!user && (
              <Button asChild variant="secondary" size="lg" className="text-lg px-8">
                <Link to="/auth">
                  Join GASPOHUB
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{featuredPhotographers.length}+</div>
              <p className="text-muted-foreground">Professional Photographers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{featuredServices.length}+</div>
              <p className="text-muted-foreground">Photography Services</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1000+</div>
              <p className="text-muted-foreground">Happy Clients</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Photographers */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Photographers</h2>
              <p className="text-muted-foreground">Discover our top-rated photography professionals</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/photographers">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPhotographers.slice(0, 6).map((photographer) => (
              <Card key={photographer.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={photographer.profiles?.avatar_url} />
                      <AvatarFallback className="text-lg">
                        {photographer.profiles?.first_name?.[0]}
                        {photographer.profiles?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {photographer.profiles?.first_name} {photographer.profiles?.last_name}
                      </h3>
                      {photographer.profiles?.location && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {photographer.profiles.location}
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {photographer.services_count} service{photographer.services_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {photographer.photographer_profiles?.specialties && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {photographer.photographer_profiles.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <Button asChild className="w-full">
                    <Link to={`/photographers/${photographer.id}`}>
                      View Profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Popular Services</h2>
              <p className="text-muted-foreground">Most booked photography services this month</p>
            </div>
            <Button asChild variant="outline">
              <Link to="/services">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.slice(0, 8).map((service) => (
              <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-1">{service.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={service.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {service.profiles?.first_name?.[0]}
                        {service.profiles?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {service.profiles?.first_name} {service.profiles?.last_name}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">${service.price}</span>
                    <Button size="sm" asChild>
                      <Link to={user ? `/book/${service.photographer_id}/${service.id}` : "/auth"}>
                        {user ? "Book Now" : "Sign Up to Book"}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Become a Photographer CTA */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <Badge className="w-fit mb-4" variant="secondary">For Photographers</Badge>
                <h2 className="text-3xl font-bold mb-4">Share Your Talent with the World</h2>
                <p className="text-muted-foreground mb-6">
                  Join our community of professional photographers. Create your profile, 
                  list your services, and start connecting with clients looking for your unique skills.
                </p>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Set your own prices and availability</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Showcase your portfolio to thousands of clients</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Receive bookings and manage your business</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <span>Sell prints and digital products</span>
                  </li>
                </ul>
                <Button asChild size="lg" className="w-fit">
                  <Link to={user ? "/dashboard/onboarding" : "/auth"}>
                    <Camera className="mr-2 h-5 w-5" />
                    {user ? "Become a Photographer" : "Get Started"}
                  </Link>
                </Button>
              </div>
              <div className="hidden md:block bg-gradient-to-br from-primary/20 to-accent/20 p-8">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="space-y-4">
                    <div className="aspect-[4/3] rounded-lg bg-muted overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400" 
                        alt="Photography"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-square rounded-lg bg-muted overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=400" 
                        alt="Photography"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="aspect-square rounded-lg bg-muted overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400" 
                        alt="Camera"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="aspect-[4/3] rounded-lg bg-muted overflow-hidden">
                      <img 
                        src="https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400" 
                        alt="Photography session"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of satisfied clients who found their perfect photographer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/auth">Sign Up Now</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10">
                  <Link to="/photographers">Browse Photographers</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 hover:bg-primary-foreground/10">
                  <Link to="/photographers">Find Photographers</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Advertisement Banner */}
      <section className="py-8">
        <div className="container mx-auto px-6">
          <AdvertBanner page="home" />
        </div>
      </section>
    </div>
  );
};

export default Home;