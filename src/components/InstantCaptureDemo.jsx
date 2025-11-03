import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, Save, Sparkles, Zap } from 'lucide-react';

// Block Renderer - Routes to specific block components
const BlockRenderer = ({ block, index }) => {
  const blockComponents = {
    heading: HeadingBlockDemo,
    text: TextBlockDemo,
    code: CodeBlockDemo
  };

  const Component = blockComponents[block.type];
  if (!Component) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, y: -20 }}
      transition={{
        duration: 0.6,
        delay: index * 0.15,
        type: "spring",
        stiffness: 260,
        damping: 30
      }}
      className="mb-8"
    >
      <Component block={block} />
    </motion.div>
  );
};

// Heading Block - Enhanced with gradient underline
const HeadingBlockDemo = ({ block }) => {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-text-primary font-bold relative inline-block"
        style={{
          fontSize: 'clamp(1.777rem, 1.5rem + 1.385vw, 2.5rem)',
          lineHeight: '1.2'
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {block.content}

        {/* Gradient underline */}
        <motion.div
          className="absolute -bottom-2 left-0 h-1 bg-gradient-to-r from-accent-green via-accent-blue to-accent-purple rounded-full"
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        />
      </motion.h1>

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 -z-10 blur-xl opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{
          background: 'linear-gradient(90deg, #10b981, #3b82f6, #8b5cf6)'
        }}
      />
    </motion.div>
  );
};

// Text Block - Enhanced glassmorphism with gradient border
const TextBlockDemo = ({ block }) => {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Gradient border container */}
      <div className="relative rounded-xl p-[1px] bg-gradient-to-br from-accent-green/30 via-accent-blue/20 to-transparent">
        {/* Glass content */}
        <motion.div
          className="relative rounded-xl bg-dark-secondary/40 backdrop-blur-md border border-dark-secondary/50 overflow-hidden"
          whileHover={{
            backgroundColor: 'rgba(26, 40, 68, 0.5)',
            scale: 1.005
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent)',
              backgroundSize: '200% 100%'
            }}
            animate={{
              backgroundPosition: ['200% 0', '-200% 0']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <div className="relative p-6">
            <motion.p
              className="text-text-primary/90 leading-relaxed text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {block.content}
            </motion.p>

            {/* Tags with enhanced animation */}
            {block.tags && block.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {block.tags.map((tag, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.4 + (i * 0.12),
                      type: "spring",
                      stiffness: 500,
                      damping: 20
                    }}
                    whileHover={{
                      scale: 1.1,
                      y: -2,
                      transition: { duration: 0.2 }
                    }}
                    className="relative px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-accent-green/20 to-accent-green/10 text-accent-green border border-accent-green/30 cursor-default"
                  >
                    <span className="relative z-10">{tag}</span>
                    {/* Tag glow */}
                    <motion.div
                      className="absolute inset-0 rounded-full bg-accent-green/20 blur-sm"
                      animate={{
                        opacity: [0, 0.5, 0]
                      }}
                      transition={{
                        duration: 2,
                        delay: i * 0.3,
                        repeat: Infinity
                      }}
                    />
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Code Block - Premium design with multiple enhancements
const CodeBlockDemo = ({ block }) => {
  const lines = block.content.split('\n');

  return (
    <motion.div
      className="group relative"
      whileHover={{ scale: 1.003 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* File path badge with gradient */}
      {block.filePath && (
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          className="absolute -top-3 left-4 px-3 py-1.5 text-xs font-mono font-medium text-accent-green bg-gradient-to-r from-dark-primary via-dark-primary to-dark-secondary rounded-t-lg border border-accent-green/30 border-b-0 shadow-lg shadow-accent-green/10 z-30"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3" />
            <span>{block.filePath}</span>
          </div>
        </motion.div>
      )}

      {/* Label (Before/After) with enhanced styling */}
      {block.label && (
        <motion.div
          initial={{ opacity: 0, y: -15, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 20
          }}
          className={`absolute -top-3 right-4 px-3 py-1.5 text-xs font-semibold rounded-t-lg border border-b-0 z-30 shadow-lg ${
            block.label.includes('Before')
              ? 'bg-gradient-to-r from-red-500/20 to-red-500/10 text-red-300 border-red-500/40 shadow-red-500/10'
              : 'bg-gradient-to-r from-green-500/20 to-green-500/10 text-green-300 border-green-500/40 shadow-green-500/10'
          }`}
        >
          {block.label}
        </motion.div>
      )}

      {/* Code container with gradient border */}
      <div className="relative rounded-xl p-[1px] bg-gradient-to-br from-dark-secondary/50 via-accent-green/20 to-dark-secondary/50">
        <div className="relative bg-dark-primary rounded-xl overflow-hidden border border-dark-secondary/50">
          <div className="flex">
            {/* Line numbers with gradient background */}
            <motion.div
              className="relative select-none text-text-secondary/60 text-sm font-mono py-4 px-4 text-right border-r border-dark-secondary/50 leading-6 bg-gradient-to-b from-dark-secondary/30 to-dark-primary"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {lines.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 + (i * 0.03) }}
                  className="hover:text-accent-green/80 transition-colors"
                >
                  {i + 1}
                </motion.div>
              ))}
            </motion.div>

            {/* Code content */}
            <div className="flex-1 overflow-hidden">
              <pre className="p-4 overflow-x-auto font-mono text-sm leading-6">
                <motion.code
                  className="text-text-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                >
                  {block.content}
                </motion.code>
              </pre>
            </div>
          </div>

          {/* Subtle gradient overlay at top */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-accent-green/5 to-transparent pointer-events-none" />
        </div>
      </div>

      {/* Pulsing glow effect */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          boxShadow: '0 0 40px rgba(16, 185, 129, 0.15)'
        }}
      />
    </motion.div>
  );
};

const InstantCaptureDemo = () => {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: "-100px" });

  // Demo content
  const demoContent = {
    heading: "Fixed React Re-render Issue",
    explanation: "Component was re-rendering on every state change. Used React.memo and useMemo to optimize performance.",
    buggyCode: `function UserProfile({ user }) {
  const [count, setCount] = useState(0);

  // Problem: recalculates on every render
  const expensiveValue = calculateExpensiveValue(user);

  return <div>{expensiveValue}</div>;
}`,
    fixedCode: `function UserProfile({ user }) {
  const [count, setCount] = useState(0);

  // Solution: memoize expensive calculation
  const expensiveValue = useMemo(
    () => calculateExpensiveValue(user),
    [user]
  );

  return <div>{expensiveValue}</div>;
}`,
    tags: ['#react', '#performance', '#bug-fix']
  };

  // Animation timeline
  const timeline = [
    { step: 0, delay: 0, action: 'reset' },
    { step: 1, delay: 1000, action: 'addHeading' },
    { step: 2, delay: 2200, action: 'addText' },
    { step: 3, delay: 3500, action: 'addBuggyCode' },
    { step: 4, delay: 4800, action: 'addFixedCode' },
    { step: 5, delay: 6000, action: 'addTags' },
    { step: 6, delay: 7000, action: 'showSaving' },
    { step: 7, delay: 7800, action: 'showSaved' },
    { step: 8, delay: 10500, action: 'loop' }
  ];

  // Auto-play when in view
  useEffect(() => {
    if (isInView && !isPlaying) {
      setIsPlaying(true);
    }
  }, [isInView, isPlaying]);

  // Timeline controller
  useEffect(() => {
    if (!isPlaying) return;

    const currentTimeline = timeline[currentStep];
    if (!currentTimeline) return;

    const timer = setTimeout(() => {
      executeAction(currentTimeline.action);
      setCurrentStep(prev => prev + 1);
    }, currentTimeline.delay);

    return () => clearTimeout(timer);
  }, [currentStep, isPlaying]);

  // Action executor
  const executeAction = (action) => {
    switch (action) {
      case 'reset':
        setBlocks([]);
        setShowSaveIndicator(false);
        break;
      case 'addHeading':
        setBlocks([{ id: 1, type: 'heading', content: demoContent.heading }]);
        break;
      case 'addText':
        setBlocks(prev => [...prev, { id: 2, type: 'text', content: demoContent.explanation, tags: [] }]);
        break;
      case 'addBuggyCode':
        setBlocks(prev => [...prev, {
          id: 3,
          type: 'code',
          language: 'javascript',
          filePath: 'src/components/UserProfile.jsx',
          content: demoContent.buggyCode,
          label: 'Before (Buggy)'
        }]);
        break;
      case 'addFixedCode':
        setBlocks(prev => [...prev, {
          id: 4,
          type: 'code',
          language: 'javascript',
          filePath: 'src/components/UserProfile.jsx',
          content: demoContent.fixedCode,
          label: 'After (Fixed)'
        }]);
        break;
      case 'addTags':
        setBlocks(prev => prev.map(block =>
          block.id === 2
            ? { ...block, tags: demoContent.tags }
            : block
        ));
        break;
      case 'showSaving':
        setShowSaveIndicator('saving');
        break;
      case 'showSaved':
        setShowSaveIndicator('saved');
        break;
      case 'loop':
        setCurrentStep(0);
        break;
      default:
        break;
    }
  };

  // Control handlers
  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRestart = () => {
    setCurrentStep(0);
    setBlocks([]);
    setShowSaveIndicator(false);
    setIsPlaying(true);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Demo Window with enhanced glassmorphism */}
      <motion.div
        className="relative rounded-3xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Gradient border */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-green/30 via-accent-blue/20 to-accent-purple/20 rounded-3xl p-[2px]">
          <div className="w-full h-full bg-dark-primary rounded-3xl" />
        </div>

        {/* Glass layer */}
        <div className="relative bg-dark-secondary/60 backdrop-blur-xl border-2 border-dark-secondary/50 rounded-3xl overflow-hidden">
          {/* Window Header with gradient */}
          <div className="relative bg-gradient-to-r from-dark-secondary/90 via-dark-secondary/80 to-dark-secondary/90 backdrop-blur-md px-6 py-4 border-b border-dark-secondary/50">
            {/* Subtle top gradient */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent-green/30 to-transparent" />

            <div className="flex items-center justify-between">
              {/* macOS buttons with glow */}
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg shadow-red-500/50"
                  whileHover={{ scale: 1.2, boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/50"
                  whileHover={{ scale: 1.2, boxShadow: '0 0 12px rgba(245, 158, 11, 0.6)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                />
                <motion.div
                  className="w-3 h-3 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/50"
                  whileHover={{ scale: 1.2, boxShadow: '0 0 12px rgba(16, 185, 129, 0.6)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                />
              </div>

              {/* Title with icon */}
              <div className="flex items-center gap-2 text-text-secondary text-sm font-medium">
                <Sparkles className="w-4 h-4 text-accent-green" />
                <span>Quick Fix - React Performance</span>
              </div>

              {/* Save Indicator with enhanced animation */}
              <div className="w-24 flex items-center justify-end">
                <AnimatePresence mode="wait">
                  {showSaveIndicator === 'saving' && (
                    <motion.div
                      key="saving"
                      initial={{ opacity: 0, x: 10, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -10, scale: 0.9 }}
                      className="flex items-center gap-2 text-xs text-text-secondary"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Save className="w-4 h-4" />
                      </motion.div>
                      <span className="font-medium">Saving...</span>
                    </motion.div>
                  )}
                  {showSaveIndicator === 'saved' && (
                    <motion.div
                      key="saved"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-xs text-accent-green font-medium"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      >
                        <Check className="w-4 h-4" />
                      </motion.div>
                      <span>Saved</span>
                      {/* Success glow */}
                      <motion.div
                        className="absolute inset-0 bg-accent-green/20 rounded-full blur-lg"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.5, 2] }}
                        transition={{ duration: 0.8 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Document Content with gradient background */}
          <div className="relative p-10 min-h-[500px] max-h-[600px] overflow-y-auto">
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-dark-primary via-dark-primary to-dark-secondary/50" />

            {/* Subtle grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
              }}
            />

            <div className="relative z-10">
              <AnimatePresence mode="popLayout">
                {blocks.map((block, index) => (
                  <BlockRenderer key={block.id} block={block} index={index} />
                ))}

                {/* Enhanced Empty state */}
                {blocks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center h-[450px]"
                  >
                    <div className="text-center">
                      {/* Animated gradient orb */}
                      <motion.div
                        className="relative w-24 h-24 mx-auto mb-8"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {/* Outer glow */}
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-accent-green/30 via-accent-blue/30 to-accent-purple/30 blur-2xl"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.2, 1]
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />

                        {/* Inner orb */}
                        <motion.div
                          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-accent-green/20 to-accent-blue/20 backdrop-blur-sm border border-accent-green/30 flex items-center justify-center shadow-lg"
                          animate={{
                            rotate: 360
                          }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        >
                          <Sparkles className="w-10 h-10 text-accent-green" />
                        </motion.div>

                        {/* Rotating particles */}
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-accent-green/60"
                            style={{
                              top: '50%',
                              left: '50%',
                            }}
                            animate={{
                              rotate: [0 + (i * 120), 360 + (i * 120)],
                              x: [0, 50, 0],
                              y: [0, 50 * Math.sin((i * 120) * Math.PI / 180), 0],
                              opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                              duration: 4,
                              repeat: Infinity,
                              ease: "easeInOut",
                              delay: i * 0.4
                            }}
                          />
                        ))}
                      </motion.div>

                      {/* Text */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <p className="text-text-primary text-xl font-semibold mb-2">
                          Ready to capture
                        </p>
                        <p className="text-text-secondary/60 text-sm">
                          Watch how blocks appear with beautiful animations
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enhanced Demo Controls */}
      <motion.div
        className="flex items-center justify-center gap-4 mt-8"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          className="relative px-6 py-3 bg-gradient-to-r from-accent-green to-accent-green/80 text-dark-primary rounded-xl font-semibold flex items-center gap-2 overflow-hidden shadow-lg shadow-accent-green/30 border border-accent-green/50"
        >
          {/* Button shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-200%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          <span className="relative z-10 flex items-center gap-2">
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRestart}
          className="px-6 py-3 bg-dark-secondary/80 backdrop-blur-sm text-text-primary rounded-xl font-semibold flex items-center gap-2 border border-dark-secondary hover:border-accent-green/30 transition-colors shadow-lg"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </motion.button>
      </motion.div>
    </div>
  );
};

export default InstantCaptureDemo;
