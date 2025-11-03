import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Play, Pause, RotateCcw, Check, Save } from 'lucide-react';

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
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 25
      }}
      className="mb-6"
    >
      <Component block={block} />
    </motion.div>
  );
};

// Heading Block - Exact styling from HTML line 221-234
const HeadingBlockDemo = ({ block }) => {
  return (
    <motion.div
      className="text-text-primary cursor-text hover:bg-dark-secondary/30 rounded px-2 py-1 transition-colors"
      whileHover={{ x: 5 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <motion.h1
        className="font-bold"
        style={{
          fontSize: 'clamp(1.777rem, 1.5rem + 1.385vw, 2.5rem)',
          lineHeight: '1.2'
        }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {block.content}
      </motion.h1>
    </motion.div>
  );
};

// Text Block - Exact styling from HTML line 156-177
const TextBlockDemo = ({ block }) => {
  return (
    <motion.div
      className="relative rounded-lg border border-dark-secondary/50 bg-dark-secondary/20 hover:bg-dark-secondary/30 transition-all duration-200"
      whileHover={{ scale: 1.01 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-text-primary p-4 rounded-lg">
        <motion.p
          className="leading-relaxed text-text-primary/90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {block.content}
        </motion.p>

        {/* Tags with stagger animation */}
        {block.tags && block.tags.length > 0 && (
          <div className="flex gap-2 mt-3">
            {block.tags.map((tag, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  delay: 0.3 + (i * 0.15),
                  type: "spring",
                  stiffness: 400,
                  damping: 15
                }}
                className="text-xs bg-accent-green/20 text-accent-green px-2 py-1 rounded font-medium"
              >
                {tag}
              </motion.span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Code Block - Exact styling from HTML line 179-219
const CodeBlockDemo = ({ block }) => {
  const lines = block.content.split('\n');

  return (
    <motion.div
      className="group relative pt-2"
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* File path badge - Exact from HTML line 184-186 */}
      {block.filePath && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute -top-3 left-0 text-xs text-accent-green/80 bg-dark-primary px-2 py-1 rounded-t font-mono z-30 border border-accent-green/30 border-b-0"
        >
          {block.filePath}
        </motion.div>
      )}

      {/* Label (Before/After) */}
      {block.label && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
          className={`absolute -top-3 right-0 text-xs px-2 py-1 rounded-t font-medium z-30 border border-b-0 ${
            block.label.includes('Before')
              ? 'bg-red-500/10 text-red-400 border-red-500/30'
              : 'bg-green-500/10 text-green-400 border-green-500/30'
          }`}
        >
          {block.label}
        </motion.div>
      )}

      {/* Code container - Exact from HTML line 200-218 */}
      <div className="bg-dark-primary rounded-lg overflow-hidden border border-dark-secondary/50">
        <div className="flex">
          {/* Line numbers - Exact from HTML line 203-209 */}
          <motion.div
            className="select-none text-text-secondary text-sm font-mono p-4 pr-0 text-right border-r border-dark-secondary/50 leading-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {lines.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + (i * 0.02) }}
              >
                {i + 1}
              </motion.div>
            ))}
          </motion.div>

          {/* Code - Exact from HTML line 211-215 */}
          <pre className="flex-1 p-4 pl-4 overflow-x-auto font-mono text-sm">
            <motion.code
              className="text-text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {block.content}
            </motion.code>
          </pre>
        </div>
      </div>

      {/* Syntax highlighting glow effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.1, 0],
          boxShadow: [
            '0 0 0px rgba(16, 185, 129, 0)',
            '0 0 20px rgba(16, 185, 129, 0.3)',
            '0 0 0px rgba(16, 185, 129, 0)'
          ]
        }}
        transition={{ duration: 1, delay: 0.5 }}
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

  // Animation timeline (8 seconds)
  const timeline = [
    { step: 0, delay: 0, action: 'reset' },
    { step: 1, delay: 1000, action: 'addHeading' },
    { step: 2, delay: 2000, action: 'addText' },
    { step: 3, delay: 3000, action: 'addBuggyCode' },
    { step: 4, delay: 4000, action: 'addFixedCode' },
    { step: 5, delay: 5000, action: 'addTags' },
    { step: 6, delay: 6000, action: 'showSaving' },
    { step: 7, delay: 7000, action: 'showSaved' },
    { step: 8, delay: 10000, action: 'loop' } // 3s pause before loop
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
        // Update text block with tags
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
      {/* Demo Window */}
      <motion.div
        className="bg-dark-secondary/50 backdrop-blur-sm rounded-2xl border-2 border-dark-secondary/50 shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Window Header */}
        <div className="bg-dark-secondary/80 px-6 py-4 border-b border-dark-secondary flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-text-secondary text-sm font-medium">
            Quick Fix - React Performance
          </div>
          {/* Save Indicator */}
          <div className="w-20 flex items-center justify-end">
            <AnimatePresence mode="wait">
              {showSaveIndicator === 'saving' && (
                <motion.div
                  key="saving"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-1.5 text-xs text-text-secondary"
                >
                  <Save className="w-3.5 h-3.5 animate-pulse" />
                  <span>Saving...</span>
                </motion.div>
              )}
              {showSaveIndicator === 'saved' && (
                <motion.div
                  key="saved"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 text-xs text-accent-green"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Document Content */}
        <div className="p-8 min-h-[500px] max-h-[600px] overflow-y-auto bg-dark-primary">
          <AnimatePresence mode="popLayout">
            {blocks.map((block, index) => (
              <BlockRenderer key={block.id} block={block} index={index} />
            ))}

            {/* Empty state */}
            {blocks.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-[400px]"
              >
                <div className="text-center">
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.5, 0.3]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 mx-auto mb-4 rounded-lg bg-dark-secondary/30 flex items-center justify-center"
                  >
                    <span className="text-3xl">✨</span>
                  </motion.div>
                  <p className="text-text-secondary/50 text-lg">
                    Ready to capture...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Demo Controls */}
      <motion.div
        className="flex items-center justify-center gap-3 mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePlayPause}
          className="px-5 py-2.5 bg-accent-green text-dark-primary rounded-lg font-medium flex items-center gap-2 hover:bg-accent-green/90 transition-colors shadow-lg shadow-accent-green/20"
        >
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
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRestart}
          className="px-5 py-2.5 bg-dark-secondary text-text-primary rounded-lg font-medium flex items-center gap-2 hover:bg-dark-secondary/80 transition-colors border border-dark-secondary"
        >
          <RotateCcw className="w-4 h-4" />
          Restart
        </motion.button>
      </motion.div>
    </div>
  );
};

export default InstantCaptureDemo;
