import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Share2, Facebook, Twitter, Linkedin, Mail, Copy } from "lucide-react";
import { toast } from "sonner";

interface SocialShareProps {
  title: string;
  description?: string;
  url?: string;
}

export function SocialShare({ title, description = "", url }: SocialShareProps) {
  const shareUrl = url || window.location.href;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:text-blue-600",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:text-sky-500",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: "hover:text-blue-700",
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      color: "hover:text-red-600",
    },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Share this</h4>
          <div className="grid grid-cols-4 gap-2">
            {shareLinks.map((link) => {
              const Icon = link.icon;
              return (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center p-2 rounded-lg hover:bg-accent transition-colors ${link.color}`}
                  title={link.name}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs mt-1">{link.name}</span>
                </a>
              );
            })}
          </div>
          <Button variant="outline" className="w-full" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
