import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PhotographerCard } from "@/components/PhotographerCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Camera, Search, Filter, SortAsc } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

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
  const [filteredPhotographers, setFilteredPhotographers] = useState<PhotographerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const { toast } = useToast();

  useEffect(() => {
    fetchPhotographers();
  }, []);

  useEffect(() => {
    filterPhotographers();
  }, [photographers, searchTerm, specialtyFilter, locationFilter, sortBy]);

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

  const filterPhotographers = () => {
    let filtered = photographers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(photographer =>
        `${photographer.profiles?.first_name} ${photographer.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photographer.profiles?.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photographer.profiles?.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        photographer.specialties?.some(specialty => specialty.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Specialty filter
    if (specialtyFilter !== "all") {
      filtered = filtered.filter(photographer =>
        photographer.specialties?.includes(specialtyFilter)
      );
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(photographer =>
        photographer.profiles?.location === locationFilter
      );
    }

    // Sort photographers
    switch (sortBy) {
      case "name":
        filtered.sort((a, b) => 
          `${a.profiles?.first_name} ${a.profiles?.last_name}`.localeCompare(
            `${b.profiles?.first_name} ${b.profiles?.last_name}`
          )
        );
        break;
      case "location":
        filtered.sort((a, b) => 
          (a.profiles?.location || '').localeCompare(b.profiles?.location || '')
        );
        break;
      case "newest":
      default:
        // Sort by created_at if available, otherwise maintain original order
        break;
    }

    setFilteredPhotographers(filtered);
  };

  const getUniqueSpecialties = () => {
    const specialties = new Set<string>();
    photographers.forEach(photographer => {
      photographer.specialties?.forEach(specialty => specialties.add(specialty));
    });
    return Array.from(specialties);
  };

  const getUniqueLocations = () => {
    const locations = new Set<string>();
    photographers.forEach(photographer => {
      if (photographer.profiles?.location) {
        locations.add(photographer.profiles.location);
      }
    });
    return Array.from(locations);
  };

  const LoadingSkeleton = () => (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <Skeleton className="h-8 w-80 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-48" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-14" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <SEO 
        title="Professional Photographers"
        description="Discover talented photographers for weddings, portraits, events and more. Browse portfolios, check availability and book your session."
        keywords="professional photographers, wedding photographer, portrait photographer, event photographer, photography booking"
      />
      <Breadcrumbs />
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Professional Photographers</h1>
        <p className="text-muted-foreground">
          Discover talented photographers and book their services
        </p>
      </div>

      {/* Enhanced Search and Filter Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search photographers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                {getUniqueSpecialties().map((specialty) => (
                  <SelectItem key={specialty} value={specialty}>
                    {specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {getUniqueLocations().map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="location">Location</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Active Filters */}
          {(searchTerm || specialtyFilter !== "all" || locationFilter !== "all") && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              {searchTerm && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Search: "{searchTerm}"
                  <button
                    onClick={() => setSearchTerm("")}
                    className="ml-1 text-xs hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {specialtyFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Specialty: {specialtyFilter}
                  <button
                    onClick={() => setSpecialtyFilter("all")}
                    className="ml-1 text-xs hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {locationFilter !== "all" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Location: {locationFilter}
                  <button
                    onClick={() => setLocationFilter("all")}
                    className="ml-1 text-xs hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {filteredPhotographers.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No photographers found</h3>
          <p className="text-muted-foreground">
            {searchTerm || specialtyFilter !== "all" || locationFilter !== "all"
              ? "Try adjusting your search criteria"
              : "Be the first photographer to join our platform!"
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotographers.map((photographer) => (
            <PhotographerCard key={photographer.id} photographer={photographer} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Photographers;