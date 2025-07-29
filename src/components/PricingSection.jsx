import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Check, X, Zap, Users, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Removed useScrollAnimation - using whileInView instead
import { fadeInUp, staggerContainer, staggerItem, buttonHover } from '../utils/animations';

export default function PricingSection() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [dimensions, setDimensions] = useState({ monthly: 0, annual: 0 });
  const monthlyRef = useRef(null);
  const annualRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const plans = [
    {
      name: 'Personal',
      icon: <Users size={24} />,
      description: 'For developers preserving their coding journey',
      price: {
        monthly: 9,
        annual: 7
      },
      features: [
        { 
          text: 'Never lose AI insights again', 
          included: true,
          description: 'Save every ChatGPT & Claude solution permanently. Find that React optimization from 3 months ago in seconds.',
          jobStory: 'When my ChatGPT solutions disappear after closing the tab'
        },
        { 
          text: 'Time travel through your knowledge', 
          included: true,
          description: 'Git-style version control shows exactly when and why you made critical decisions.',
          jobStory: 'When I can\'t explain past architecture choices'
        },
        { 
          text: 'Works everywhere you do', 
          included: true,
          description: 'Code on planes, trains, anywhere. Everything syncs when you\'re back online.',
          jobStory: 'When WiFi drops during critical work'
        },
        { 
          text: 'Save 4 hours every week', 
          included: true,
          description: 'Stop hunting through Slack, browser history, and screenshots. Everything\'s in one searchable place.',
          value: '$200+ monthly value'
        }
      ],
      cta: 'Start 14-Day Trial',
      ctaVariant: 'primary',
      popular: false,
      savingText: 'Save 22%',
      badge: 'Perfect for side projects'
    },
    {
      name: 'Professional',
      icon: <Building2 size={24} />,
      description: 'For teams building shared knowledge',
      price: {
        monthly: 19,
        annual: 15
      },
      features: [
        { 
          text: 'Everything in Personal', 
          included: true
        },
        { 
          text: 'Turn your team into a knowledge powerhouse', 
          included: true,
          description: 'Share documented solutions with secure links. Perfect for onboarding new devs 60% faster.',
          jobStory: 'When knowledge is trapped in individual silos'
        },
        { 
          text: 'Ship with confidence', 
          included: true,
          description: 'Branch your docs like code. Test ideas without breaking main documentation.',
          jobStory: 'When experimenting might break existing docs'
        },
        { 
          text: 'Capture $10K+ of team insights', 
          included: true,
          description: '5 team seats to preserve everyone\'s AI conversations and critical decisions.',
          value: 'ROI in first month'
        },
        { 
          text: 'No vendor lock-in', 
          included: true,
          description: 'Export everything as JSON anytime. Your knowledge stays yours forever.',
          jobStory: 'When switching tools means losing history'
        }
      ],
      cta: 'Start 14-Day Trial',
      ctaVariant: 'secondary',
      popular: true,
      savingText: 'Save 21%',
      badge: 'Most teams choose this',
      upgradeReason: 'Need to share with your team?'
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
    <section id="pricing" className="py-16 md:py-20 px-4 md:px-6 gradient-pricing relative">
      {/* Noise overlay for premium texture */}
      <div className="noise-overlay" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div 
          className="text-center mb-8 md:mb-12"
          initial={isMobile ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            Turn AI Conversations Into Permanent Team Knowledge
          </h3>
          <p className="text-text-secondary text-base md:text-lg mb-2">
            Don't lose another $100 ChatGPT solution. Capture every insight permanently.
          </p>
          <p className="text-accent-green text-sm mb-6 md:mb-8">
            Join 10,000+ developers who save 4 hours every week
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center p-1 bg-dark-secondary rounded-lg relative text-sm md:text-base">
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
          className="fluid-grid-pricing mb-8 md:mb-12"
          variants={isMobile ? {} : staggerContainer}
          initial={isMobile ? { opacity: 1 } : "hidden"}
          whileInView={isMobile ? {} : "visible"}
          viewport={{ once: true, amount: 0.1 }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-lg border transition-all hover:border-accent-green/30 ${
                plan.popular
                  ? 'border-accent-green shadow-lg shadow-accent-green/10 pricing-card-popular'
                  : 'border-dark-secondary/50 pricing-card-gradient'
              } glass-overlay`}
              variants={isMobile ? {} : staggerItem}
              style={isMobile ? { opacity: 1 } : {}}
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

              <div className="p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                  <div className="text-accent-green">{plan.icon}</div>
                  <h4 className="text-lg md:text-xl font-semibold">{plan.name}</h4>
                </div>
                <p className="text-text-secondary text-xs md:text-sm mb-4 md:mb-6">{plan.description}</p>

                <div className="mb-4 md:mb-6">
                  <div className="flex items-baseline gap-1">
                    <AnimatePresence mode="wait">
                      <motion.span 
                        key={billingPeriod}
                        className="text-3xl md:text-4xl font-bold"
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
                  {plan.badge && (
                    <div className="text-xs text-text-secondary mt-2">
                      {plan.badge}
                    </div>
                  )}
                </div>

                <motion.button
                  onClick={() => handlePlanClick(plan.name, plan.cta)}
                  className={`w-full py-2.5 md:py-3 rounded font-medium relative overflow-hidden text-sm md:text-base ${
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
                
                {plan.upgradeReason && (
                  <p className="text-xs text-center text-accent-green mt-3">
                    {plan.upgradeReason}
                  </p>
                )}

                <div className="mt-4 md:mt-6 space-y-2 md:space-y-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="group">
                      <div className="flex items-start gap-3">
                        {feature.included ? (
                          <Check size={16} className="text-accent-green mt-0.5 flex-shrink-0" />
                        ) : (
                          <X size={16} className="text-text-secondary/30 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <span
                            className={`text-xs md:text-sm ${
                              feature.included ? 'text-text-primary' : 'text-text-secondary/50'
                            }`}
                          >
                            {feature.text}
                          </span>
                          {feature.description && (
                            <p className="text-[11px] md:text-xs text-text-secondary/70 mt-1 leading-relaxed">
                              {feature.description}
                            </p>
                          )}
                          {feature.value && (
                            <p className="text-[10px] md:text-[11px] text-accent-green/80 mt-1 font-medium">
                              = {feature.value}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Signals and Additional Info */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4 text-sm text-text-secondary">
            <span className="flex items-center gap-1">
              <Check size={16} className="text-accent-green" />
              14-day free trial
            </span>
            <span className="flex items-center gap-1">
              <Check size={16} className="text-accent-green" />
              No credit card
            </span>
            <span className="flex items-center gap-1">
              <Check size={16} className="text-accent-green" />
              Cancel anytime
            </span>
          </div>
          
          <p className="text-text-secondary mb-4">
            100% user-supported. No ads. Your data stays yours.
          </p>
          
          <p className="text-sm text-text-secondary/70">
            <a href="mailto:support@devlog.app" className="text-accent-green hover:underline">
              Get help in minutes
            </a>
            {' '}or{' '}
            <button className="text-accent-green hover:underline">
              calculate your ROI
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}