import { useNavigate } from 'react-router-dom';
import LogoMinimal from '../components/LogoMinimal';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-text-secondary mb-8">Last updated: {lastUpdated}</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-text-secondary leading-relaxed">
              At Devlog ("we", "our", or "us"), we take your privacy seriously. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our 
              developer knowledge management platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Email address (for authentication)</li>
              <li>Display name (optional)</li>
              <li>GitHub profile information (if using GitHub SSO)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Usage Data</h3>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Documents created and modified</li>
              <li>Search queries (stored locally only)</li>
              <li>Feature usage analytics (anonymized)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Technical Data</h3>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address (for security purposes)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-text-secondary mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Provide and maintain our service</li>
              <li>Authenticate your account</li>
              <li>Sync your data across devices (Pro/Team plans)</li>
              <li>Send important service updates</li>
              <li>Improve our platform based on usage patterns</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              Your documents and code snippets are:
            </p>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Encrypted at rest using AES-256 encryption</li>
              <li>Transmitted over SSL/TLS connections</li>
              <li>Stored in SOC2-compliant data centers</li>
              <li>Backed up regularly with encryption</li>
              <li>Never used to train AI models</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
            <p className="text-text-secondary leading-relaxed mb-4">
              We do not sell, trade, or rent your personal information. We may share data only:
            </p>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>With service providers who help us operate our platform (under strict confidentiality)</li>
              <li>In aggregated, anonymized form for analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="text-text-secondary mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-text-secondary space-y-2">
              <li>Access your personal data</li>
              <li>Export all your documents and data</li>
              <li>Delete your account and all associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-text-secondary leading-relaxed">
              We retain your data as long as your account is active. Upon account deletion, 
              we permanently delete your data within 30 days, except where required by law 
              to retain it longer.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p className="text-text-secondary leading-relaxed">
              If you have questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <ul className="list-none text-text-secondary mt-4">
              <li>Email: privacy@devlog.app</li>
              <li>Address: Devlog, Inc., San Francisco, CA</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Changes to This Policy</h2>
            <p className="text-text-secondary leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes via email or through the platform. Your continued use of Devlog 
              after such modifications constitutes acceptance of the updated policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}