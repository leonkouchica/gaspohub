import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Search, Calendar, CheckCircle, Users, Shield, Star, Zap } from "lucide-react";

const About = () => {
  const howItWorks = [
    {
      step: 1,
      icon: Search,
      title: "Discover Photographers",
      description: "Browse our curated network of talented photographers. Filter by specialty, location, and style to find your perfect match.",
    },
    {
      step: 2,
      icon: Calendar,
      title: "Book a Session",
      description: "Choose a service, pick a date from the photographer's availability, and secure your booking with easy online payment.",
    },
    {
      step: 3,
      icon: Camera,
      title: "Capture the Moment",
      description: "Meet with your photographer and enjoy a professional photoshoot tailored to your vision and needs.",
    },
    {
      step: 4,
      icon: CheckCircle,
      title: "Receive Your Photos",
      description: "Get your beautifully edited photos delivered digitally. Purchase prints or products from the shop if desired.",
    },
  ];

  const values = [
    {
      icon: Users,
      title: "Community First",
      description: "We empower photographers to grow their business while connecting clients with exceptional talent.",
    },
    {
      icon: Shield,
      title: "Trust & Safety",
      description: "Secure payments, verified photographers, and our dispute resolution ensure peace of mind for everyone.",
    },
    {
      icon: Star,
      title: "Quality Excellence",
      description: "We curate only the best photographers who meet our high standards for creativity and professionalism.",
    },
    {
      icon: Zap,
      title: "Seamless Experience",
      description: "From discovery to delivery, our platform makes booking photography services effortless and enjoyable.",
    },
  ];

  return (
    <>
      <SEO
        title="About Us"
        description="Learn about GASPOHUB - the premier photography marketplace connecting talented photographers with clients. Discover our mission, values, and how our platform works."
        keywords="about gaspohub, photography marketplace, photographer platform, photography booking, about us"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Camera className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="text-primary">GASPOHUB</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We're on a mission to democratize professional photography by creating the most 
              trusted marketplace that connects talented photographers with people who want to 
              capture life's most precious moments.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  GASPOHUB was born from a simple observation: finding the right photographer 
                  shouldn't be complicated. Whether you're planning a wedding, launching a product, 
                  or just want beautiful family portraits, everyone deserves access to exceptional 
                  photography.
                </p>
                <p>
                  We built this platform to bridge the gap between talented photographers looking 
                  to grow their business and clients seeking professional photography services. 
                  Our marketplace eliminates the friction of traditional booking by providing 
                  transparent pricing, verified reviews, and secure transactions.
                </p>
                <p>
                  Today, GASPOHUB hosts hundreds of photographers across various specialties, 
                  from wedding and portrait photography to commercial and event coverage. We're 
                  proud to have facilitated thousands of successful photo sessions and continue 
                  to grow our community every day.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-primary mb-2">500+</div>
                  <div className="text-sm text-muted-foreground">Photographers</div>
                </CardContent>
              </Card>
              <Card className="bg-secondary/5 border-secondary/20">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-secondary-foreground mb-2">10K+</div>
                  <div className="text-sm text-muted-foreground">Sessions Booked</div>
                </CardContent>
              </Card>
              <Card className="bg-accent/5 border-accent/20">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold text-accent-foreground mb-2">50+</div>
                  <div className="text-sm text-muted-foreground">Cities Covered</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl font-bold mb-2">4.9★</div>
                  <div className="text-sm text-muted-foreground">Average Rating</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Booking a professional photographer has never been easier. Follow these simple 
              steps to capture your perfect moments.
            </p>
          </div>

          {/* Infographic Steps */}
          <div className="relative">
            {/* Connection Line (Desktop) */}
            <div className="hidden md:block absolute top-24 left-[12.5%] right-[12.5%] h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full" />
            
            <div className="grid md:grid-cols-4 gap-8">
              {howItWorks.map((item) => (
                <div key={item.step} className="relative">
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6 text-center">
                      {/* Step Number */}
                      <div className="relative z-10 w-12 h-12 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {item.step}
                      </div>
                      
                      {/* Icon */}
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-8 w-8 text-primary" />
                      </div>
                      
                      <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do at GASPOHUB.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <Card key={value.title} className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're looking to book a photographer or join our platform as a professional, 
            we'd love to have you in our community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/photographers">Find Photographers</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth">Join as Photographer</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
