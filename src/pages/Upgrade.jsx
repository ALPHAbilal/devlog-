import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers';
import LogoMinimal from '../components/LogoMinimal';
import { ArrowLeft, Mail, Zap, CheckCircle } from 'lucide-react';
import { fadeInUp, staggerContainer, staggerItem } from '@/shared/lib';

export default function Upgrade() {
  const navigate = useNavigate();
  const { user, trialStatus } = useAuth();
  
  const benefits = [
    'Continue building your second brain',
    'Never lose a solution again', 
    'All your documentation stays intact',
    'Full access to all features',
    '6-layer data protection',
    'Priority support'
  ];

  return (
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Header */}
      <header className="border-b border-dark-secondary/20">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMinimal size={32} />
            <h1 className="text-xl font-semibold">Devlog</h1>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-20">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 
                       rounded-full text-sm font-medium mb-6"
          >
            <Zap size={16} />
            Your trial has ended
          </motion.div>
          
          <motion.h2 
            variants={fadeInUp}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Ready to Continue Your Journey?
          </motion.h2>
          
          <motion.p 
            variants={fadeInUp}
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto"
          >
            Your documentation is safe and waiting for you. Upgrade to continue building your developer knowledge base.
          </motion.p>
        </motion.div>

        {/* Benefits */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-4 mb-12"
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              className="flex items-center gap-3 p-4 bg-dark-secondary/30 rounded-lg"
            >
              <CheckCircle className="text-accent-green flex-shrink-0" size={20} />
              <span>{benefit}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-dark-secondary/50 rounded-lg p-8 text-center"
        >
          <h3 className="text-2xl font-semibold mb-4">
            Continue with Manual Activation
          </h3>
          
          <p className="text-text-secondary mb-6">
            Since we're in early access, we handle subscriptions manually to ensure the best experience for our users.
          </p>

          <div className="space-y-4">
            <a
              href={`mailto:alphabmu04@gmail.com?subject=Devlog Subscription Request&body=Hi,%0A%0AI'd like to continue using Devlog after my trial.%0A%0AMy email: ${user?.email || 'your-email@example.com'}%0AUser ID: ${user?.id || 'your-user-id'}%0A%0AThank you!`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-accent-green text-dark-primary 
                       rounded-lg font-medium hover:bg-accent-green/90 transition-colors"
            >
              <Mail size={20} />
              Email for Activation
            </a>
            
            <p className="text-sm text-text-secondary/70">
              We'll activate your account within 24 hours
            </p>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-text-secondary"
        >
          <p className="mb-2">
            Questions? Contact us at{' '}
            <a href="mailto:alphabmu04@gmail.com" className="text-accent-green hover:underline">
              alphabmu04@gmail.com
            </a>
          </p>
          <p className="text-sm">
            We're building something special together. Thank you for being an early adopter.
          </p>
        </motion.div>
      </main>
    </div>
  );
}