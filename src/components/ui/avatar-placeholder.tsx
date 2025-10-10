import { User, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarPlaceholderProps {
  className?: string;
  type?: "user" | "photographer";
}

export const AvatarPlaceholder = ({ 
  className, 
  type = "user" 
}: AvatarPlaceholderProps) => {
  const Icon = type === "photographer" ? Camera : User;
  
  return (
    <div 
      className={cn(
        "flex items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20",
        className
      )}
    >
      <Icon className="h-1/2 w-1/2 text-primary/60" />
    </div>
  );
};
