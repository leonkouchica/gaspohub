import { Link } from "react-router-dom";
import { Camera, Mail, Phone, MapPin } from "lucide-react";
export const PublicFooter = () => {
  return <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 font-bold text-xl mb-4">
              <Camera className="h-6 w-6 text-primary" />
              <span>GASPOHUB</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your premier destination for professional photography services. 
              Connect with talented photographers for all your visual needs.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>hello@gaspohub.com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/photographers" className="block text-sm text-muted-foreground hover:text-primary">
                Find Photographers
              </Link>
              <Link to="/services" className="block text-sm text-muted-foreground hover:text-primary">
                Browse Services
              </Link>
              <Link to="/shop" className="block text-sm text-muted-foreground hover:text-primary">
                Shop Products
              </Link>
              <Link to="/about" className="block text-sm text-muted-foreground hover:text-primary">
                About Us
              </Link>
              <Link to="/auth" className="block text-sm text-muted-foreground hover:text-primary">
                Join Now
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Popular Categories</h3>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Wedding Photography</div>
              <div className="text-sm text-muted-foreground">Portrait Sessions</div>
              <div className="text-sm text-muted-foreground">Event Photography</div>
              <div className="text-sm text-muted-foreground">Commercial Shoots</div>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Help Center</div>
              <div className="text-sm text-muted-foreground">Terms of Service</div>
              <div className="text-sm text-muted-foreground">Privacy Policy</div>
              <div className="text-sm text-muted-foreground">Contact Us</div>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">© GASPOHUB. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};