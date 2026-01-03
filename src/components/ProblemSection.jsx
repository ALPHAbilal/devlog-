import { useState, useRef } from 'react';
import { MessageSquare, Search, BookOpen, Brain } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useScrollAnimation } from '@/shared/hooks';
import { fadeInUp, problemCardContainer, problemCardItem, iconFloat } from '@/shared/lib';

const problems = [
  {
    icon: <BookOpen size={24} />,
    title: 'No time to document',
    description: 'You solve problems daily but never capture the solutions properly',
    opacity: 0.9
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'Knowledge scattered everywhere',
    description: 'Solutions in Slack, notes in Notion, code in GitHub - nothing connected',
    opacity: 0.7
  },
  {
    icon: <Brain size={24} />,
    title: 'Context evaporates',
    description: 'Three months later, you can\'t remember why that solution worked',
    opacity: 0.5
  },
  {
    icon: <Search size={24} />,
    title: 'Can\'t find what you wrote',
    description: 'You documented it somewhere, but good luck finding it when you need it',
    opacity: 0.3
  }
];

function ProblemCard({ problem, index }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  
  // Mouse position for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse position to rotation values
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);
  
  const handleMouseMove = (e) => {
    if (!cardRef.current || !isHovered) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Normalize mouse position to -0.5 to 0.5
    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;
    
    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
    
    // Update CSS variables for glow effect
    const percentX = ((e.clientX - rect.left) / rect.width) * 100;
    const percentY = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--mouse-x', `${percentX}%`);
    cardRef.current.style.setProperty('--mouse-y', `${percentY}%`);
  };
  
  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      className="problem-card-wrapper"
      variants={problemCardItem}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      custom={index}
    >
      {/* Gradient orbs */}
      <div className="gradient-orb" style={{ opacity: problem.opacity * 0.3 }} />
      
      <motion.div 
        className="problem-card"
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
        }}
      >
        {/* Card glow effect */}
        <div className="card-glow" style={{ opacity: problem.opacity * 0.2 }} />
        
        {/* Animated gradient border */}
        <div className={`card-border-gradient ${isHovered ? 'card-border-gradient-animated' : ''}`} style={{ opacity: problem.opacity * 0.5 }} />
        
        {/* Card content */}
        <div className="card-content">
          <div className="flex items-start gap-4">
            <motion.div 
              className="icon-wrapper"
              variants={iconFloat}
              initial="rest"
              whileHover="hover"
            >
              <div className="icon-glow" style={{ opacity: problem.opacity * 0.4 }} />
              <span style={{ color: `rgba(255, 255, 255, ${problem.opacity})` }}>
                {problem.icon}
              </span>
            </motion.div>
            
            <div className="text-content flex-1">
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {problem.title}
              </h3>
              <p className="text-text-secondary">
                {problem.description}
              </p>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="card-indicator" style={{ 
            background: `linear-gradient(to right, rgba(255, 255, 255, ${problem.opacity * 0.1}), rgba(255, 255, 255, ${problem.opacity * 0.05}))` 
          }} />
        </div>
        
        {/* Noise texture */}
        <div 
          className="card-noise"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Cfilter id="noise"%3E%3CfeTurbulence baseFrequency="0.9" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="0.03"/%3E%3C/svg%3E")'
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default function ProblemSection() {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section 
      id="problem-section" 
      className="px-4 md:px-6 overflow-hidden gradient-problem relative" 
      ref={ref}
    >
      {/* Subtle noise texture overlay for premium feel */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Cfilter id="noise"%3E%3CfeTurbulence baseFrequency="0.9" numOctaves="4" /%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)"/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat',
          mixBlendMode: 'overlay'
        }}
      />
      
      <div className="max-w-6xl mx-auto relative py-16 md:py-20">
        <motion.div 
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">
            The documentation problem
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl mx-auto px-2">
            You're too busy coding to document properly. And when you do, 
            it's scattered across tools that weren't built for developers.
          </p>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16"
          variants={problemCardContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {problems.map((problem, index) => (
            <ProblemCard key={index} problem={problem} index={index} />
          ))}
        </motion.div>

        {/* The shift to solution */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-green/10 
                          text-accent-green rounded-full text-sm font-medium mb-6"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <span className="text-accent-green">●</span>
            There's a better way
          </motion.div>
          
          <h3 className="text-3xl font-bold mb-4">
            Documentation that{' '}
            <motion.span 
              className="text-accent-green inline-block"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
            >
              actually works
            </motion.span>
          </h3>
          
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            DevLog makes documenting as natural as coding. Capture solutions in context, 
            connect related concepts, and build a searchable knowledge base that grows with you.
          </p>
        </motion.div>
      </div>

    </section>
  );
}