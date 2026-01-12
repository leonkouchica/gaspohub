import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Read GASPOHUB's Privacy Policy to understand how we collect, use, and protect your personal information on our photography marketplace."
        keywords="privacy policy, data protection, personal information, gaspohub privacy"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
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
              <h2>1. Introduction</h2>
              <p>
                At GASPOHUB, we are committed to protecting your privacy and ensuring the security of your 
                personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard 
                your information when you use our platform.
              </p>

              <h2>2. Information We Collect</h2>
              <h3>2.1 Information You Provide</h3>
              <ul>
                <li><strong>Account Information:</strong> Name, email address, phone number, and password when you create an account</li>
                <li><strong>Profile Information:</strong> Bio, location, profile photo, and portfolio images (for photographers)</li>
                <li><strong>Payment Information:</strong> Billing address and payment details (processed securely by our payment partners)</li>
                <li><strong>Communications:</strong> Messages exchanged through our platform, support inquiries, and feedback</li>
              </ul>

              <h3>2.2 Information Collected Automatically</h3>
              <ul>
                <li><strong>Usage Data:</strong> Pages visited, features used, search queries, and interaction patterns</li>
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers, and IP address</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies, and analytics cookies</li>
              </ul>

              <h2>3. How We Use Your Information</h2>
              <p>We use the collected information to:</p>
              <ul>
                <li>Provide, maintain, and improve our services</li>
                <li>Process bookings and payments</li>
                <li>Facilitate communication between photographers and clients</li>
                <li>Send transactional notifications and updates</li>
                <li>Personalize your experience on the platform</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
                <li>Send marketing communications (with your consent)</li>
              </ul>

              <h2>4. Information Sharing</h2>
              <p>We may share your information with:</p>
              <ul>
                <li><strong>Other Users:</strong> Profile information is visible to other platform users as necessary for bookings</li>
                <li><strong>Service Providers:</strong> Third-party vendors who assist with payment processing, email delivery, and analytics</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              </ul>
              <p>We do not sell your personal information to third parties for marketing purposes.</p>

              <h2>5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your information, including:
              </p>
              <ul>
                <li>Encryption of data in transit and at rest</li>
                <li>Secure payment processing through certified partners</li>
                <li>Regular security assessments and monitoring</li>
                <li>Access controls and authentication measures</li>
              </ul>
              <p>
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee 
                absolute security of your data.
              </p>

              <h2>6. Your Rights and Choices</h2>
              <p>You have the right to:</p>
              <ul>
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Cookie Preferences:</strong> Manage cookie settings in your browser</li>
              </ul>

              <h2>7. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar technologies to enhance your experience. Types of cookies we use:
              </p>
              <ul>
                <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us understand how users interact with our platform</li>
                <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
              </ul>
              <p>
                You can control cookies through your browser settings, though some features may not work properly 
                if cookies are disabled.
              </p>

              <h2>8. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide services. 
                After account deletion, we may retain certain information as required by law or for legitimate 
                business purposes (such as fraud prevention).
              </p>

              <h2>9. Children's Privacy</h2>
              <p>
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect 
                personal information from children. If we become aware of such collection, we will take steps to 
                delete the information.
              </p>

              <h2>10. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your own. We ensure 
                appropriate safeguards are in place to protect your information in accordance with this policy.
              </p>

              <h2>11. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of significant changes 
                by posting the new policy on this page and updating the "Last updated" date. Your continued use 
                of the platform after changes constitutes acceptance.
              </p>

              <h2>12. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p>
                Email: privacy@gaspohub.com<br />
                Address: GASPOHUB Headquarters
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
};

export default PrivacyPolicy;
