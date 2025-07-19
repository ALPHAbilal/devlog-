import { Zap, Link2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '../utils/animations';

const steps = [
  {
    icon: <Zap className="text-accent-green" size={32} />,
    number: "01",
    title: "Capture in seconds",
    description: "Paste that Stack Overflow answer. Save that ChatGPT explanation. It\'s instantly stored.",
    visual: "// Error: Cannot read property 'map' of undefined\n// Solution: Check if array exists first\nitems?.map(item => ...)"
  },
  {
    icon: <Link2 className="text-accent-green" size={32} />,
    number: "02", 
    title: "Connect naturally",
    description: "Link related solutions with [[brackets]]. Your knowledge becomes interconnected.",
    visual: "Fixed auth bug → [[JWT Token Guide]]\nSee also: [[Session Management]]"
  },
  {
    icon: <Search className="text-accent-green" size={32} />,
    number: "03",
    title: "Find instantly",
    description: "Search 'auth error' and find that fix from 6 months ago in seconds.",
    visual: "🔍 'auth error'\n\n✓ JWT Token Expired Fix\n✓ OAuth Redirect Solution\n✓ Session Timeout Handler"
  }
];

export default function HowItWorksSimple() {
  return (
    <section className="py-16 md:py-20 px-4 md:px-6 bg-dark-secondary/10">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How it actually works
          </h2>
          <p className="text-lg text-text-secondary">
            No complex setup. No learning curve. Just three simple steps.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="relative"
              variants={staggerItem}
            >
              {/* Connection line for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-full w-full h-[2px] bg-gradient-to-r from-accent-green/20 to-transparent" />
              )}
              
              <div className="text-center">
                {/* Step number */}
                <div className="text-5xl font-bold text-dark-secondary/30 mb-4">
                  {step.number}
                </div>
                
                {/* Icon */}
                <motion.div 
                  className="inline-flex items-center justify-center w-16 h-16 bg-dark-secondary/50 rounded-lg mb-4"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {step.icon}
                </motion.div>
                
                {/* Title */}
                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                
                {/* Description */}
                <p className="text-text-secondary text-sm mb-4">{step.description}</p>
                
                {/* Visual Example */}
                <div className="bg-dark-secondary/30 rounded-lg p-4 text-left">
                  <pre className="text-xs text-accent-green font-mono whitespace-pre-wrap">
                    {step.visual}
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <p className="text-lg text-text-secondary mb-2">
            That\'s it. No complex workflows. No steep learning curve.
          </p>
          <p className="text-xl font-semibold text-accent-green">
            Just capture, connect, and find.
          </p>
        </motion.div>
      </div>
    </section>
  );
}