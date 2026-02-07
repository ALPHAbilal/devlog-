import { useState, useRef, useEffect } from 'react';
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

function ProblemCard({ problem, index, flashActive }) {
  const cardRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (e) => {
    if (!cardRef.current || !isHovered) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);

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
      style={{ perspective: 1000, position: 'relative' }}
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

      {/* Scan flash overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ borderRadius: '16px', zIndex: 10 }}
        initial={{ opacity: 0 }}
        animate={flashActive ? {
          opacity: [0, 1, 0],
          boxShadow: [
            'inset 0 0 0 1px rgba(16,185,129,0), 0 0 0px rgba(16,185,129,0)',
            'inset 0 0 0 2px rgba(16,185,129,0.5), 0 0 30px rgba(16,185,129,0.15)',
            'inset 0 0 0 1px rgba(16,185,129,0), 0 0 0px rgba(16,185,129,0)',
          ]
        } : { opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </motion.div>
  );
}

export default function ProblemSection() {
  const { ref, isInView } = useScrollAnimation();
  const [scanPhase, setScanPhase] = useState('idle');
  // idle → scanning → morph → done
  const [flashRow, setFlashRow] = useState(-1); // -1 = none, 0 = top row, 1 = bottom row
  const gridRef = useRef(null);
  const scanTriggered = useRef(false);

  // Kick off scan after cards have animated in
  useEffect(() => {
    if (!isInView || scanTriggered.current) return;
    scanTriggered.current = true;

    // Wait for cards to finish entering (~1.2s after isInView)
    const startDelay = setTimeout(() => {
      setScanPhase('scanning');
    }, 1200);

    return () => clearTimeout(startDelay);
  }, [isInView]);

  // Flash timing during scan
  useEffect(() => {
    if (scanPhase !== 'scanning') return;

    const topFlash = setTimeout(() => setFlashRow(0), 300);
    const topClear = setTimeout(() => setFlashRow(-1), 800);
    const bottomFlash = setTimeout(() => setFlashRow(1), 700);
    const bottomClear = setTimeout(() => setFlashRow(-1), 1200);

    return () => {
      clearTimeout(topFlash);
      clearTimeout(topClear);
      clearTimeout(bottomFlash);
      clearTimeout(bottomClear);
    };
  }, [scanPhase]);

  const handleScanComplete = () => {
    setScanPhase('morph');
  };

  const handleMorphComplete = () => {
    setScanPhase('done');
  };

  const showContent = scanPhase === 'done';

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

        {/* Problems Grid — with scan overlay */}
        <div className="relative" ref={gridRef}>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-24"
            variants={problemCardContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {problems.map((problem, index) => {
              // Top row = index 0,1 → flash when flashRow===0
              // Bottom row = index 2,3 → flash when flashRow===1
              const row = index < 2 ? 0 : 1;
              return (
                <ProblemCard
                  key={index}
                  problem={problem}
                  index={index}
                  flashActive={flashRow === row}
                />
              );
            })}
          </motion.div>

          {/* Scan line — sweeps down through the grid */}
          {scanPhase === 'scanning' && (
            <motion.div
              className="absolute left-0 right-0 pointer-events-none"
              style={{
                height: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.3) 15%, rgba(16,185,129,0.8) 50%, rgba(16,185,129,0.3) 85%, transparent)',
                boxShadow: '0 0 20px rgba(16,185,129,0.3), 0 0 6px rgba(16,185,129,0.6)',
                zIndex: 20,
              }}
              initial={{ top: 0, opacity: 0 }}
              animate={{ top: '100%', opacity: [0, 1, 1, 1, 0.8] }}
              transition={{ duration: 1.2, ease: 'linear' }}
              onAnimationComplete={handleScanComplete}
            />
          )}
        </div>

        {/* Transition to solution */}
        <div className="text-center">
          <div className="flex flex-col items-center">
            {/* Morph line: horizontal → vertical */}
            <div className="relative mb-8" style={{ height: 96 }}>
              <motion.div
                className="absolute left-1/2"
                style={{
                  background: 'linear-gradient(to bottom, transparent, #334155, #10b981)',
                  transformOrigin: 'top center',
                }}
                initial={{ width: '100%', height: 2, x: '-50%', opacity: 0 }}
                animate={
                  scanPhase === 'morph'
                    ? { width: 1, height: 96, x: '-50%', opacity: 1 }
                    : scanPhase === 'done'
                      ? { width: 1, height: 96, x: '-50%', opacity: 1 }
                      : { width: '100%', height: 2, x: '-50%', opacity: 0 }
                }
                transition={
                  scanPhase === 'morph'
                    ? { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
                    : { duration: 0 }
                }
                onAnimationComplete={() => {
                  if (scanPhase === 'morph') handleMorphComplete();
                }}
              />
            </div>

            {/* Badge */}
            <motion.div
              className="flex items-center gap-3 px-4 py-1.5 rounded-full border border-[rgba(16,185,129,0.3)] bg-[rgba(16,185,129,0.05)] mb-8"
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={showContent ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="text-emerald-500 text-[14px] font-['JetBrains_Mono',_monospace]">LOG: SOLUTION_FOUND</span>
            </motion.div>

            {/* Heading */}
            <motion.h3
              className="text-white mb-6"
              style={{
                fontSize: 'clamp(32px, 4vw, 48px)',
                lineHeight: '1.1',
                fontWeight: 400,
                fontFamily: 'Arial, sans-serif',
                letterSpacing: '-1px'
              }}
              initial={{ opacity: 0, y: 15 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Building a <span className="text-emerald-500">Resilient Brain</span>
            </motion.h3>

            <motion.p
              className="text-slate-400 max-w-2xl mx-auto text-[17px] font-['Arial',_sans-serif]"
              initial={{ opacity: 0, y: 15 }}
              animate={showContent ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ delay: 0.4, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              DevLog bridges the gap between solving and recording. Automatically preserves
              AI context, manages code versions, and connects everything you learn.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
