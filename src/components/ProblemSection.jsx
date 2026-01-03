import { useState, useRef } from 'react';
import { MessageSquare, Search, BookOpen, Brain } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useScrollAnimation } from '@/shared/hooks';
import { fadeInUp, problemCardContainer, problemCardItem, iconFloat } from '@/shared/lib';

const problems = [
  {
    id: '01',
    icon: <BookOpen size={24} />,
    title: 'No time to document',
    description: 'You solve problems daily but never capture the solutions properly',
    opacity: 0.9,
    tag: 'time_sink'
  },
  {
    id: '02',
    icon: <MessageSquare size={24} />,
    title: 'Knowledge scattered everywhere',
    description: 'Solutions in Slack, notes in Notion, code in GitHub - nothing connected',
    opacity: 0.7,
    tag: 'entropy'
  },
  {
    id: '03',
    icon: <Brain size={24} />,
    title: 'Context evaporates',
    description: 'Three months later, you can\'t remember why that solution worked',
    opacity: 0.5,
    tag: 'memory_leak'
  },
  {
    id: '04',
    icon: <Search size={24} />,
    title: 'Can\'t find what you wrote',
    description: 'You documented it somewhere, but good luck finding it when you need it',
    opacity: 0.3,
    tag: 'access_denied'
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
      style={{ perspective: 1000 }}
    >
      <motion.div 
        className="problem-card group"
        style={{
          rotateX: isHovered ? rotateX : 0,
          rotateY: isHovered ? rotateY : 0,
          background: 'rgba(22, 27, 34, 0.4)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(45, 51, 59, 0.5)',
          borderRadius: '16px',
        }}
        whileHover={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}
      >
        {/* Monospace Indicator */}
        <div className="absolute top-4 right-6 font-['JetBrains_Mono',_monospace] text-[11px] text-slate-500 opacity-50 select-none">
          // {problem.tag}
        </div>

        {/* Card Content */}
        <div className="card-content flex flex-col h-full">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              {problem.icon}
            </div>
            
            <div className="text-content flex-1 pt-1">
              <div className="text-[12px] font-['JetBrains_Mono',_monospace] text-emerald-500/60 mb-1">
                ERROR_{problem.id}
              </div>
              <h3 className="text-[20px] font-medium text-white leading-tight tracking-tight mb-2 font-['Arial',_sans-serif]">
                {problem.title}
              </h3>
              <p className="text-[15px] text-slate-400 leading-relaxed font-['Arial',_sans-serif]">
                {problem.description}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProblemSection() {
  const { ref, isInView } = useScrollAnimation();

  return (
    <section 
      id="problem-section" 
      className="px-4 md:px-6 overflow-hidden relative bg-[#0d1117]" 
      style={{ paddingTop: '100px', paddingBottom: '100px' }}
      ref={ref}
    >
      {/* Subtle Noise Texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="max-w-6xl mx-auto relative">
        {/* Heading Zone - Matching Hero UI */}
        <motion.div 
          className="text-center mb-16 md:mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/20 bg-red-500/10 mb-8">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-500 text-[13px] font-['JetBrains_Mono',_monospace]">System Leakage</span>
          </div>

          <h2 
            className="text-white mb-6"
            style={{
              fontSize: 'clamp(40px, 6vw, 72px)',
              lineHeight: '1.1',
              letterSpacing: '-1.44px',
              fontWeight: 400,
              fontFamily: 'Arial, sans-serif'
            }}
          >
            The Documentation <br className="hidden md:block" />
            <span className="text-slate-500">Infrastructure Problem</span>
          </h2>
          
          <p 
            className="text-slate-400 mx-auto"
            style={{
              fontSize: '18px',
              lineHeight: '1.6',
              maxWidth: '640px',
              fontFamily: 'Arial, sans-serif'
            }}
          >
            Your context is evaporating in real-time. Documentation shouldn't be 
            a chore—it should be a byproduct of your workflow.
          </p>
        </motion.div>

        {/* Problems Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-24"
          variants={problemCardContainer}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {problems.map((problem, index) => (
            <ProblemCard key={index} problem={problem} index={index} />
          ))}
        </motion.div>

        {/* Transition to solution */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <div className="flex flex-col items-center">
            <div className="w-px h-24 bg-gradient-to-b from-transparent via-slate-700 to-emerald-500 mb-8" />
            
            <div
              className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] mb-8"
            >
               <span className="text-emerald-500 text-[14px] font-['JetBrains_Mono',_monospace]">LOG: SOLUTION_FOUND</span>
            </div>
            
            <h3 
              className="text-white mb-6"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                lineHeight: '1.1',
                fontWeight: 400,
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '-1px'
              }}
            >
              Building a <span className="text-emerald-500">Resilient Brain</span>
            </h3>
            
            <p className="text-slate-400 max-w-2xl mx-auto text-[17px] font-['Arial',_sans-serif]">
              DevLog bridges the gap between solving and recording. Automatically preserves 
              AI context, manages code versions, and connects everything you learn.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
