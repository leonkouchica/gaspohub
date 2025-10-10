import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Star } from "lucide-react";
import { AvatarPlaceholder } from "@/components/ui/avatar-placeholder";

interface PhotographerCardProps {
  photographer: {
    id: string;
    user_id: string;
    specialties: string[];
    profiles: {
      first_name: string;
      last_name: string;
      bio: string;
      avatar_url: string;
      location: string;
    };
  };
}

export const PhotographerCard = ({ photographer }: PhotographerCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-primary/20">
            <AvatarImage src={photographer.profiles?.avatar_url} />
            <AvatarFallback>
              <AvatarPlaceholder className="h-12 w-12" type="photographer" />
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
            <Star className="h-4 w-4 fill-primary text-primary" />
            <span className="text-sm font-medium">4.8</span>
            <span className="text-xs text-muted-foreground">(24 reviews)</span>
          </div>
          
          <Button asChild size="sm" className="shadow-sm hover:shadow-md transition-shadow">
            <Link to={`/photographers/${photographer.user_id}`}>
              View Profile
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};