import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, DollarSign, MapPin } from "lucide-react";

interface ServiceCardProps {
  service: {
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
  };
}

export const ServiceCard = ({ service }: ServiceCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg line-clamp-1">{service.title}</CardTitle>
          <div className="flex items-center gap-1 text-lg font-bold text-primary">
            <DollarSign className="h-4 w-4" />
            {service.price}
          </div>
        </div>
        
        {service.duration_hours && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            {service.duration_hours} hour{service.duration_hours !== 1 ? 's' : ''}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {service.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {service.description}
          </p>
        )}
        
        {/* Photographer Info */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-8 w-8">
            <AvatarImage src={service.profiles?.avatar_url} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {service.profiles?.first_name?.[0]}
              {service.profiles?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {service.profiles?.first_name} {service.profiles?.last_name}
            </p>
            {service.profiles?.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {service.profiles.location}
              </div>
            )}
          </div>
        </div>
        
        {/* Specialties */}
        {service.photographer_profiles?.specialties && service.photographer_profiles.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {service.photographer_profiles.specialties.slice(0, 2).map((specialty, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {specialty}
              </Badge>
            ))}
            {service.photographer_profiles.specialties.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{service.photographer_profiles.specialties.length - 2}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1 shadow-sm">
            <Link to={`/book/${service.photographer_id}/${service.id}`}>
              Book Now
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/photographers/${service.photographer_id}`}>
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};