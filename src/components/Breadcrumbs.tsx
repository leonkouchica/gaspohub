import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path: string;
}

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const getBreadcrumbLabel = (segment: string): string => {
    // Custom labels for specific routes
    const labels: { [key: string]: string } = {
      photographers: "Photographers",
      services: "Services",
      shop: "Shop",
      bookings: "My Bookings",
      messages: "Messages",
      profile: "Profile",
      dashboard: "Dashboard",
      auth: "Sign In",
      book: "Book Service",
    };

    return labels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { label: "Home", path: "/" },
    ...pathnames.map((segment, index) => ({
      label: getBreadcrumbLabel(segment),
      path: `/${pathnames.slice(0, index + 1).join("/")}`,
    })),
  ];

  // Don't show breadcrumbs on home page or if only one item
  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        
        return (
          <div key={breadcrumb.path} className="flex items-center gap-2">
            {index === 0 && <Home className="h-3.5 w-3.5" />}
            
            {isLast ? (
              <span className="font-medium text-foreground">
                {breadcrumb.label}
              </span>
            ) : (
              <>
                <Link
                  to={breadcrumb.path}
                  className="hover:text-foreground transition-colors"
                >
                  {breadcrumb.label}
                </Link>
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
};
