import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Camera, ShoppingCart, Calendar, CreditCard, User, MessageCircle, HelpCircle } from "lucide-react";
import { useState } from "react";

const HelpCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      icon: Camera,
      title: "For Photographers",
      description: "Learn how to set up your profile, manage bookings, and grow your business.",
      link: "#photographers",
    },
    {
      icon: User,
      title: "For Clients",
      description: "Find answers about booking sessions, payments, and working with photographers.",
      link: "#clients",
    },
    {
      icon: ShoppingCart,
      title: "Shop & Orders",
      description: "Questions about purchasing prints, digital downloads, and order tracking.",
      link: "#orders",
    },
    {
      icon: CreditCard,
      title: "Payments & Refunds",
      description: "Information about payment methods, refunds, and payout schedules.",
      link: "#payments",
    },
  ];

  const faqs = [
    {
      category: "Getting Started",
      questions: [
        {
          question: "How do I create an account?",
          answer: "Click 'Get Started' or 'Sign In' in the navigation bar. You can sign up using your email address or Google account. Once registered, you can complete your profile and start exploring photographers.",
        },
        {
          question: "How do I book a photographer?",
          answer: "Browse our photographers, select one that matches your needs, choose a service, pick an available date from their calendar, and complete the booking with secure payment. You'll receive a confirmation email with all the details.",
        },
        {
          question: "Is GASPOHUB free to use?",
          answer: "Creating an account and browsing photographers is completely free. You only pay when you book a service or purchase products. Photographers pay a small commission on completed bookings.",
        },
      ],
    },
    {
      category: "Bookings",
      questions: [
        {
          question: "How do I reschedule a booking?",
          answer: "Go to your Dashboard > Bookings, find the booking you want to reschedule, and click 'Reschedule'. You can message the photographer to coordinate a new date. Rescheduling policies vary by photographer.",
        },
        {
          question: "What is the cancellation policy?",
          answer: "Cancellation policies are set by individual photographers. Generally, cancellations made 48+ hours before the session receive a full refund. Check the specific photographer's terms before booking.",
        },
        {
          question: "How do I communicate with my photographer?",
          answer: "Use the Messages section in your dashboard to communicate directly with your photographer. You can discuss details, share inspiration, and coordinate logistics.",
        },
      ],
    },
    {
      category: "Payments",
      questions: [
        {
          question: "What payment methods are accepted?",
          answer: "We accept major credit/debit cards, and various local payment methods depending on your region. All payments are processed securely through our payment partners.",
        },
        {
          question: "How do refunds work?",
          answer: "Refund eligibility depends on the cancellation timing and the photographer's policy. Approved refunds are processed within 5-10 business days to your original payment method.",
        },
        {
          question: "When do photographers get paid?",
          answer: "Photographers receive their earnings after the session is completed and marked as done. The initial payment is released upon confirmation, and any remaining balance after final delivery.",
        },
      ],
    },
    {
      category: "For Photographers",
      questions: [
        {
          question: "How do I become a photographer on GASPOHUB?",
          answer: "Sign up for an account, then go to Dashboard > Onboarding to complete your photographer profile. Add your portfolio, set your services and pricing, and submit for approval.",
        },
        {
          question: "What commission does GASPOHUB charge?",
          answer: "We charge a competitive commission on completed bookings to cover platform maintenance, payment processing, and customer support. The exact rate is shown during onboarding.",
        },
        {
          question: "How do I set my availability?",
          answer: "Go to Dashboard > Availability to manage your calendar. Block off dates you're unavailable, and clients will only be able to book your open slots.",
        },
      ],
    },
  ];

  const filteredFaqs = searchQuery
    ? faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
               q.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(category => category.questions.length > 0)
    : faqs;

  return (
    <>
      <SEO
        title="Help Center"
        description="Get help with GASPOHUB - find answers to frequently asked questions about bookings, payments, and using our photography marketplace."
        keywords="help center, FAQ, support, gaspohub help, photography booking help"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-muted-foreground mb-8">
              Search our knowledge base or browse categories below to find answers.
            </p>
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for answers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.title} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <category.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{category.title}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No results found for "{searchQuery}"</p>
              <Button variant="outline" onClick={() => setSearchQuery("")}>Clear Search</Button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8">
              {filteredFaqs.map((category) => (
                <Card key={category.category}>
                  <CardHeader>
                    <CardTitle className="text-lg">{category.category}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-12">
        <div className="container mx-auto px-6 text-center">
          <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button asChild>
            <Link to="/contact">Contact Support</Link>
          </Button>
        </div>
      </section>
    </>
  );
};

export default HelpCenter;
