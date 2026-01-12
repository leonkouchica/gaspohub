import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

const TermsOfService = () => {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read the Terms of Service for GASPOHUB photography marketplace. Understand your rights and responsibilities when using our platform."
        keywords="terms of service, terms and conditions, user agreement, gaspohub terms"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: January 2026
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By accessing or using GASPOHUB ("the Platform"), you agree to be bound by these Terms of Service. 
                If you do not agree to these terms, please do not use our services. These terms apply to all users, 
                including photographers, clients, and visitors.
              </p>

              <h2>2. Description of Service</h2>
              <p>
                GASPOHUB is an online marketplace that connects professional photographers with clients seeking 
                photography services. We provide a platform for:
              </p>
              <ul>
                <li>Photographers to showcase their portfolios and offer services</li>
                <li>Clients to discover, book, and pay for photography services</li>
                <li>Purchase of photography products including prints and digital downloads</li>
                <li>Communication between photographers and clients</li>
              </ul>

              <h2>3. User Accounts</h2>
              <p>
                To access certain features, you must create an account. You agree to:
              </p>
              <ul>
                <li>Provide accurate and complete information during registration</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>

              <h2>4. Photographer Terms</h2>
              <p>
                Photographers using the platform agree to:
              </p>
              <ul>
                <li>Provide accurate information about their services, pricing, and availability</li>
                <li>Maintain professional standards in all client interactions</li>
                <li>Deliver services as described in their listings</li>
                <li>Pay applicable platform commissions on completed bookings</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>

              <h2>5. Client Terms</h2>
              <p>
                Clients using the platform agree to:
              </p>
              <ul>
                <li>Provide accurate booking information</li>
                <li>Make payments as required for bookings</li>
                <li>Treat photographers with respect and professionalism</li>
                <li>Comply with cancellation and rescheduling policies</li>
              </ul>

              <h2>6. Payments and Fees</h2>
              <p>
                All payments are processed through our secure payment partners. By making a payment, you agree to:
              </p>
              <ul>
                <li>Pay the full amount for booked services</li>
                <li>Accept the photographer's cancellation and refund policies</li>
                <li>Platform fees and commissions as disclosed during transactions</li>
              </ul>

              <h2>7. Cancellations and Refunds</h2>
              <p>
                Cancellation policies are set by individual photographers and displayed before booking. 
                Refunds are subject to:
              </p>
              <ul>
                <li>The photographer's stated cancellation policy</li>
                <li>Timing of the cancellation request</li>
                <li>Platform dispute resolution procedures</li>
              </ul>

              <h2>8. Intellectual Property</h2>
              <p>
                All content on the platform, including logos, designs, and text, is owned by GASPOHUB or its 
                licensors. Photographers retain rights to their portfolio images. Clients receive usage rights 
                as specified in their booking agreements.
              </p>

              <h2>9. Prohibited Conduct</h2>
              <p>
                Users may not:
              </p>
              <ul>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Harass, threaten, or harm other users</li>
                <li>Submit false or misleading information</li>
                <li>Attempt to circumvent platform fees</li>
                <li>Use the platform for unauthorized commercial purposes</li>
              </ul>

              <h2>10. Limitation of Liability</h2>
              <p>
                GASPOHUB is a marketplace platform and is not responsible for the actions of photographers 
                or clients. We provide tools for dispute resolution but do not guarantee outcomes. Our liability 
                is limited to the fees paid to us for platform services.
              </p>

              <h2>11. Dispute Resolution</h2>
              <p>
                In case of disputes between photographers and clients, we encourage direct communication first. 
                If unresolved, users may submit disputes through our platform for mediation. Our decisions on 
                disputes are final.
              </p>

              <h2>12. Modifications to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Users will be notified of significant 
                changes. Continued use of the platform after changes constitutes acceptance of the new terms.
              </p>

              <h2>13. Termination</h2>
              <p>
                We may suspend or terminate accounts that violate these terms. Users may close their accounts 
                at any time, subject to completing any pending transactions.
              </p>

              <h2>14. Contact Information</h2>
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <p>
                Email: legal@gaspohub.com<br />
                Address: GASPOHUB Headquarters
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default TermsOfService;
