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
      // Show sample data when database is empty
      const samplePhotographers = [
        {
          id: '1',
          profiles: {
            id: '1',
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
            location: 'New York, NY'
          },
          photographer_profiles: {
            specialties: ['Wedding', 'Portrait', 'Engagement'],
            is_approved: true
          },
          services_count: 5
        },
        {
          id: '2',
          profiles: {
            id: '2',
            first_name: 'Sarah',
            last_name: 'Smith',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face',
            location: 'Los Angeles, CA'
          },
          photographer_profiles: {
            specialties: ['Event', 'Corporate', 'Concert'],
            is_approved: true
          },
          services_count: 8
        },
        {
          id: '3',
          profiles: {
            id: '3',
            first_name: 'Mike',
            last_name: 'Johnson',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            location: 'Denver, CO'
          },
          photographer_profiles: {
            specialties: ['Nature', 'Adventure', 'Engagement'],
            is_approved: true
          },
          services_count: 3
        },
        {
          id: '4',
          profiles: {
            id: '4',
            first_name: 'Emma',
            last_name: 'Wilson',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
            location: 'Miami, FL'
          },
          photographer_profiles: {
            specialties: ['Fashion', 'Commercial', 'Beauty'],
            is_approved: true
          },
          services_count: 6
        },
        {
          id: '5',
          profiles: {
            id: '5',
            first_name: 'David',
            last_name: 'Brown',
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
            location: 'Chicago, IL'
          },
          photographer_profiles: {
            specialties: ['Documentary', 'Street', 'Family'],
            is_approved: true
          },
          services_count: 4
        }
      ];
      setFeaturedPhotographers(samplePhotographers);
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
      // Show sample services when database is empty
      const sampleServices = [
        {
          id: '1',
          title: 'Wedding Photography Package',
          description: 'Complete wedding day coverage including ceremony, reception, and getting ready shots. Includes 500+ edited photos.',
          price: 2500,
          photographer_id: '1',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
          }
        },
        {
          id: '2',
          title: 'Engagement Session',
          description: 'Romantic engagement photoshoot at location of your choice. Perfect for save-the-dates.',
          price: 450,
          photographer_id: '1',
          profiles: {
            first_name: 'John',
            last_name: 'Doe',
            avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face'
          }
        },
        {
          id: '3',
          title: 'Corporate Event Coverage',
          description: 'Professional documentation of your corporate event, conference, or business gathering.',
          price: 800,
          photographer_id: '2',
          profiles: {
            first_name: 'Sarah',
            last_name: 'Smith',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'
          }
        },
        {
          id: '4',
          title: 'Adventure Engagement Session',
          description: 'Outdoor adventure engagement shoot in stunning natural locations for adventurous couples.',
          price: 650,
          photographer_id: '3',
          profiles: {
            first_name: 'Mike',
            last_name: 'Johnson',
            avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face'
          }
        },
        {
          id: '5',
          title: 'Fashion Portfolio Shoot',
          description: 'Professional fashion photography for models, actors, and influencers. Studio or location options.',
          price: 750,
          photographer_id: '4',
          profiles: {
            first_name: 'Emma',
            last_name: 'Wilson',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
          }
        },
        {
          id: '6',
          title: 'Family Portrait Session',
          description: 'Natural, candid family photography session. Multiple outfit changes and locations included.',
          price: 400,
          photographer_id: '5',
          profiles: {
            first_name: 'David',
            last_name: 'Brown',
            avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face'
          }
        },
        {
          id: '7',
          title: 'Brand Photography Session',
          description: 'Commercial photography for businesses, products, and marketing materials with multiple setups.',
          price: 950,
          photographer_id: '4',
          profiles: {
            first_name: 'Emma',
            last_name: 'Wilson',
            avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face'
          }
        },
        {
          id: '8',
          title: 'Concert Photography',
          description: 'High-energy concert and music event photography. Experienced with low-light environments.',
          price: 600,
          photographer_id: '2',
          profiles: {
            first_name: 'Sarah',
            last_name: 'Smith',
            avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face'
          }
        }
      ];
      setFeaturedServices(sampleServices);
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
                <Button asChild size="lg" variant="outline">
                  <Link to="/photographers">Browse Photographers</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" variant="secondary">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/photographers">Find Photographers</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;