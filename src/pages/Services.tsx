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
import { ServiceCard } from "@/components/ServiceCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Search, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceWithPhotographer {
  id: string;
  title: string;
  description: string;
  price: number;
  duration_hours: number;
  photographer_id: string;
  profiles: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    location: string;
  };
  photographer_profiles: {
    specialties: string[];
  };
}

const Services = () => {
  const [services, setServices] = useState<ServiceWithPhotographer[]>([]);
  const [filteredServices, setFilteredServices] = useState<ServiceWithPhotographer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    filterServices();
  }, [services, searchTerm, priceFilter]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Fetch profiles and photographer_profiles for each service
      const servicesWithData = await Promise.all(
        (data || []).map(async (service) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url, location')
            .eq('id', service.photographer_id)
            .single();

          const { data: photographerProfileData } = await supabase
            .from('photographer_profiles')
            .select('specialties')
            .eq('user_id', service.photographer_id)
            .single();

          return {
            ...service,
            profiles: profileData || {
              first_name: '',
              last_name: '',
              avatar_url: '',
              location: ''
            },
            photographer_profiles: photographerProfileData || {
              specialties: []
            }
          };
        })
      );

      setServices(servicesWithData);
    } catch (error) {
      toast({
        title: "Error loading services",
        description: "Failed to fetch photography services",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterServices = () => {
    let filtered = services;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(service =>
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${service.profiles?.first_name} ${service.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price filter
    if (priceFilter !== "all") {
      switch (priceFilter) {
        case "under-100":
          filtered = filtered.filter(service => service.price < 100);
          break;
        case "100-300":
          filtered = filtered.filter(service => service.price >= 100 && service.price <= 300);
          break;
        case "300-500":
          filtered = filtered.filter(service => service.price >= 300 && service.price <= 500);
          break;
        case "over-500":
          filtered = filtered.filter(service => service.price > 500);
          break;
      }
    }

    setFilteredServices(filtered);
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
          </div>
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-16" />
              </div>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 flex-1" />
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
      <Breadcrumbs />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Photography Services</h1>
        <p className="text-muted-foreground">
          Find the perfect photography service for your needs
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services or photographers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Price range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All prices</SelectItem>
                <SelectItem value="under-100">Under $100</SelectItem>
                <SelectItem value="100-300">$100 - $300</SelectItem>
                <SelectItem value="300-500">$300 - $500</SelectItem>
                <SelectItem value="over-500">Over $500</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-12">
          <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No services found</h3>
          <p className="text-muted-foreground">
            {searchTerm || priceFilter !== "all" 
              ? "Try adjusting your search criteria" 
              : "No photography services are available at the moment"
            }
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Services;