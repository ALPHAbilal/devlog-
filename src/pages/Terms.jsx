import { useNavigate } from 'react-router-dom';
import LogoMinimal from '../components/LogoMinimal';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const navigate = useNavigate();
  const lastUpdated = 'January 9, 2025';

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-primary/80 backdrop-blur-md border-b border-dark-secondary/20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <LogoMinimal size={24} />
            <span className="font-semibold">Devlog</span>
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto prose prose-invert">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-text-secondary mb-8">Last updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-text-secondary leading-relaxed">
              By accessing or using Devlog ("Service"), you agree to be bound by these Terms of Service 
              ("Terms"). If you disagree with any part of these terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-text-secondary leading-relaxed">
              Devlog is a developer-focused knowledge management platform that allows you to capture, 
              organize, and search your code snippets, documentation, and development insights. The Service 
              includes web-based tools, APIs, and related services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>You must provide accurate and complete information during registration</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must notify us immediately of any unauthorized access</li>
              <li>You are responsible for all activities under your account</li>
              <li>One person or legal entity may not maintain more than one free account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
            <p className="text-text-secondary mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Upload malicious code or content</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to store or distribute illegal content</li>
              <li>Reverse engineer or attempt to extract the source code</li>
              <li>Use automated systems to access the Service without permission</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Content Ownership</h2>
            <h3 className="text-xl font-semibold mb-3">Your Content</h3>
            <p className="text-text-secondary leading-relaxed mb-4">
              You retain all rights to the content you upload to Devlog. By using our Service, you grant us 
              a limited license to store, backup, and display your content solely for providing the Service.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Our Content</h3>
            <p className="text-text-secondary leading-relaxed">
              The Service, including its original content, features, and functionality, is owned by Devlog, Inc. 
              and is protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Subscription Plans</h2>
            <h3 className="text-xl font-semibold mb-3">Free Plan</h3>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Limited to 100 documents</li>
              <li>5MB per document limit</li>
              <li>Local storage only</li>
              <li>Community support</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Paid Plans</h3>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Subscription fees are billed in advance</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>Price changes will be notified 30 days in advance</li>
              <li>Cancellation takes effect at the end of the billing period</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Privacy and Data Protection</h2>
            <p className="text-text-secondary leading-relaxed">
              Your use of the Service is also governed by our Privacy Policy. We are committed to protecting 
              your data and maintaining its confidentiality. We do not use your content to train AI models 
              or for any purpose other than providing the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-text-secondary leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DEVLOG SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED 
              DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Indemnification</h2>
            <p className="text-text-secondary leading-relaxed">
              You agree to indemnify and hold harmless Devlog, Inc. and its officers, directors, employees, 
              and agents from any claims, damages, or expenses arising from your use of the Service or 
              violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="text-text-secondary leading-relaxed">
              We may terminate or suspend your account immediately, without prior notice, for conduct that 
              we believe violates these Terms or is harmful to other users, us, or third parties. Upon 
              termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="text-text-secondary leading-relaxed">
              We reserve the right to modify these Terms at any time. Material changes will be notified 
              via email or through the Service. Your continued use after such modifications constitutes 
              acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="text-text-secondary leading-relaxed">
              These Terms shall be governed by the laws of the State of California, United States, 
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p className="text-text-secondary leading-relaxed">
              For questions about these Terms, please contact us at:
            </p>
            <ul className="list-none text-text-secondary mt-4">
              <li>Email: legal@devlog.app</li>
              <li>Address: Devlog, Inc., San Francisco, CA</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}