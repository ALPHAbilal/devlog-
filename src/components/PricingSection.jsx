import { useState, useRef, useLayoutEffect } from 'react';
import { Check, X, Zap, Users, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { fadeInUp, staggerContainer, staggerItem, buttonHover } from '../utils/animations';

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [dimensions, setDimensions] = useState({ monthly: 0, annual: 0 });
  const monthlyRef = useRef(null);
  const annualRef = useRef(null);
  const { ref, isInView } = useScrollAnimation();

  const plans = [
    {
      name: 'Personal',
      icon: <Users size={24} />,
      description: 'For individual developers',
      price: {
        monthly: 9,
        annual: 7
      },
      features: [
        { text: 'Unlimited documents', included: true },
        { text: '2 GB total storage', included: true },
        { text: 'All 8 block types (Text, Code, Math, etc.)', included: true },
        { text: 'Markdown editing with live preview', included: true },
        { text: 'Document linking ([[links]] & @mentions)', included: true },
        { text: 'Advanced search across all content', included: true },
        { text: 'Export to JSON format', included: true },
        { text: 'Cloud sync with Supabase', included: true },
        { text: '30-day version history', included: true },
        { text: 'Email support', included: true }
      ],
      cta: 'Start 14-Day Trial',
      ctaVariant: 'primary',
      popular: true,
      savingText: 'Save 22%'
    },
    {
      name: 'Professional',
      icon: <Building2 size={24} />,
      description: 'For power users & freelancers',
      price: {
        monthly: 19,
        annual: 15
      },
      features: [
        { text: 'Everything in Personal', included: true },
        { text: '10 GB total storage', included: true },
        { text: 'Unlimited version history', included: true },
        { text: 'Priority support', included: true },
        { text: 'Bulk import/export operations', included: true },
        { text: 'Advanced AI conversation blocks', included: true },
        { text: 'File tree visualization blocks', included: true },
        { text: 'Custom tags and collections', included: true },
        { text: 'Offline mode with sync', included: true },
        { text: 'Early access to new features', included: true }
      ],
      cta: 'Start 14-Day Trial',
      ctaVariant: 'secondary',
      popular: false,
      savingText: 'Save 21%'
    }
  ];

  // Measure button dimensions on mount and when content changes
  useLayoutEffect(() => {
    const measureButtons = () => {
      if (monthlyRef.current && annualRef.current) {
        setDimensions({
          monthly: monthlyRef.current.offsetWidth,
          annual: annualRef.current.offsetWidth
        });
      }
    };

    measureButtons();
    
    // Set up ResizeObserver for dynamic content changes
    const resizeObserver = new ResizeObserver(measureButtons);
    if (monthlyRef.current) resizeObserver.observe(monthlyRef.current);
    if (annualRef.current) resizeObserver.observe(annualRef.current);
    
    return () => resizeObserver.disconnect();
  }, [billingPeriod]); // Re-measure when billing period changes

  const handlePlanClick = (planName, cta) => {
    if (cta === 'Contact Sales') {
      window.location.href = 'mailto:sales@devlog.app?subject=Team Plan Inquiry';
    } else {
      window.location.href = '/auth';
    }
  };

  return (
    <section id="pricing" className="py-20 px-6 bg-dark-secondary/20" ref={ref}>
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-3xl font-bold mb-4">
            Simple Pricing, Powerful Features
          </h3>
          <p className="text-text-secondary text-lg mb-8">
            Start free and upgrade as you grow. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-dark-secondary rounded-lg relative">
            <motion.div
              className="absolute h-[calc(100%-8px)] bg-accent-green rounded-md"
              initial={false}
              animate={{
                x: billingPeriod === 'monthly' ? 4 : dimensions.monthly + 4,
                width: billingPeriod === 'monthly' ? dimensions.monthly : dimensions.annual
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ top: '4px' }}
            />
            <button
              ref={monthlyRef}
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md transition-all relative z-10 ${
                billingPeriod === 'monthly'
                  ? 'text-dark-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={billingPeriod === 'monthly'}
            >
              Monthly
            </button>
            <button
              ref={annualRef}
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-md transition-all relative z-10 flex items-center ${
                billingPeriod === 'annual'
                  ? 'text-dark-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={billingPeriod === 'annual'}
            >
              Annual
              <AnimatePresence mode="wait">
                {billingPeriod === 'annual' && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="ml-2 text-xs bg-dark-primary/20 px-2 py-0.5 rounded"
                  >
                    Save 22%
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div 
          className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative bg-dark-secondary rounded-lg border transition-all hover:border-accent-green/30 ${
                plan.popular
                  ? 'border-accent-green shadow-lg shadow-accent-green/10'
                  : 'border-dark-secondary/50'
              }`}
              variants={staggerItem}
            >
              {plan.popular && (
                <motion.div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 z-10"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-accent-green text-dark-primary text-sm font-medium px-3 py-1 rounded">
                    Most Popular
                  </div>
                </motion.div>
              )}

              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-accent-green">{plan.icon}</div>
                  <h4 className="text-xl font-semibold">{plan.name}</h4>
                </div>
                <p className="text-text-secondary text-sm mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={billingPeriod}
                        className="text-4xl font-bold"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        ${plan.price[billingPeriod]}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-text-secondary">
                      /month
                    </span>
                  </div>
                  <AnimatePresence>
                    {billingPeriod === 'annual' && plan.savingText && (
                      <motion.div 
                        className="text-accent-green text-sm mt-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {plan.savingText}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  onClick={() => handlePlanClick(plan.name, plan.cta)}
                  className={`w-full py-3 rounded font-medium relative overflow-hidden ${
                    plan.ctaVariant === 'primary'
                      ? 'bg-accent-green text-dark-primary'
                      : 'bg-dark-primary text-text-primary border border-dark-primary hover:border-accent-green/50'
                  }`}
                  variants={buttonHover}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  {plan.ctaVariant === 'primary' && (
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      initial={{ x: "-100%" }}
                      whileHover={{ x: "100%" }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10">{plan.cta}</span>
                </motion.button>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                      ) : (
                        <X size={16} className="text-text-secondary/30 mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included ? 'text-text-primary' : 'text-text-secondary/50'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ or Additional Info */}
        <div className="text-center">
          <p className="text-text-secondary mb-4">
            All plans include automatic backups, SSL encryption, and regular updates.
          </p>
          <p className="text-sm text-text-secondary/70">
            Questions? <a href="#" className="text-accent-green hover:underline">Check our FAQ</a> or{' '}
            <a href="mailto:support@devlog.app" className="text-accent-green hover:underline">
              contact support
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}