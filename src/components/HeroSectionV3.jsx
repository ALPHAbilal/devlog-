import { ArrowRight, ChevronDown, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { textReveal, buttonHover, staggerContainer, staggerItem, gradientShift } from '../utils/animations';

export default function HeroSectionV3() {
  const navigate = useNavigate();

  const scrollToDemo = () => {
    const demoSection = document.getElementById('problem-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center py-20 overflow-hidden">
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(circle at 20% 50%, #10b98120 0%, transparent 50%), radial-gradient(circle at 80% 80%, #10b98115 0%, transparent 50%)",
          backgroundSize: "100% 100%",
        }}
        animate={gradientShift.animate}
      />
      
      <div className="max-w-4xl mx-auto px-4 md:px-6 w-full text-center relative z-10">
        {/* Main content - single column, centered */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.h1 
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight"
            variants={textReveal}
          >
            <motion.span variants={staggerItem}>
              The Developer Knowledge Base
            </motion.span>
            <br />
            <motion.span variants={staggerItem}>
              That Remembers
            </motion.span>
            <br />
            <motion.span 
              className="text-accent-green inline-block"
              variants={staggerItem}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Why Your Code Works
            </motion.span>
          </motion.h1>
        </motion.div>
        
        <motion.p 
          className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
        >
          Build your personal developer documentation with code snippet management, 
          AI conversation preservation, and offline-first architecture. Never lose a solution again.
        </motion.p>

        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
        >
          <motion.button
            onClick={() => navigate('/auth')}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 
                     bg-accent-green text-dark-primary rounded-lg font-medium text-lg
                     shadow-lg shadow-accent-green/20 relative overflow-hidden"
            variants={buttonHover}
            initial="rest"
            whileHover="hover"
            whileTap="tap"
          >
            <motion.span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6, ease: "linear" }}
            />
            <span className="relative z-10">Start Documenting Today</span>
            <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
          </motion.button>
          
          <motion.button
            onClick={scrollToDemo}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 
                     border border-dark-secondary text-text-primary rounded-lg text-lg
                     hover:border-accent-green/50 transition-all relative overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span>See How It Works</span>
            <motion.div
              animate={{ y: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <ChevronDown size={20} />
            </motion.div>
          </motion.button>
        </motion.div>

        <motion.div 
          className="flex items-center justify-center gap-6 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Clock size={16} />
            <span>2-minute setup</span>
          </motion.div>
          <div>•</div>
          <motion.div whileHover={{ scale: 1.05 }}>
            Free 14-day trial
          </motion.div>
          <div>•</div>
          <motion.div whileHover={{ scale: 1.05 }}>
            No credit card required
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}