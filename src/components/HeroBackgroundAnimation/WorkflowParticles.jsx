import { motion } from 'framer-motion';
import { Command, Save, Keyboard, Download, Cloud, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';

// Workflow elements
const WORKFLOW_ELEMENTS = [
  { command: '/code', icon: Command, color: '#3b82f6', description: 'Transform to code block' },
  { command: 'Cmd+S', icon: Save, color: '#10b981', description: 'Auto-save instantly' },
  { command: 'Cmd+K', icon: Keyboard, color: '#8b5cf6', description: 'Quick search' },
  { command: '[[link]]', icon: null, color: '#f59e0b', description: 'Link documents' },
  { command: '#tag', icon: null, color: '#06b6d4', description: 'Organize with tags' },
];

// Auto-save layer visualization
const SAVE_LAYERS = [
  { name: 'Memory', icon: Shield, delay: 0 },
  { name: 'IndexedDB', icon: Shield, delay: 0.2 },
  { name: 'Cloud Sync', icon: Cloud, delay: 0.4 },
];

export default function WorkflowParticles() {
  const [activeCommand, setActiveCommand] = useState(0);
  const [showSaveLayers, setShowSaveLayers] = useState(false);

  // Cycle through commands
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCommand((prev) => (prev + 1) % WORKFLOW_ELEMENTS.length);
      
      // Show save layers periodically
      if (Math.random() > 0.7) {
        setShowSaveLayers(true);
        setTimeout(() => setShowSaveLayers(false), 3000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="workflow-particles">
      {/* Floating command hints */}
      {WORKFLOW_ELEMENTS.map((element, index) => {
        const Icon = element.icon;
        const isActive = index === activeCommand;
        
        return (
          <motion.div
            key={element.command}
            className="workflow-hint"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: isActive ? [0, 1, 1, 0] : 0,
              scale: isActive ? [0.8, 1, 1, 0.8] : 0,
              y: isActive ? [50, 0, -20, -70] : 50,
              x: Math.sin(index * 1.2) * 100,
            }}
            transition={{
              duration: 3,
              times: [0, 0.2, 0.8, 1],
            }}
            style={{
              left: `${20 + (index * 15)}%`,
              color: element.color,
            }}
          >
            <div className="hint-command">
              {Icon && <Icon size={16} />}
              <span>{element.command}</span>
            </div>
            <div className="hint-description">{element.description}</div>
          </motion.div>
        );
      })}

      {/* Terminal prompt animation */}
      <motion.div
        className="terminal-prompt"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
      >
        <motion.div
          animate={{
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatDelay: 2,
          }}
        >
          <span className="prompt-symbol">❯</span>
          <motion.span
            className="prompt-text"
            initial={{ width: 0 }}
            animate={{ width: 'auto' }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            devlog capture "Fixed the bug! 🎉"
          </motion.span>
          <motion.span
            className="prompt-cursor"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          >
            |
          </motion.span>
        </motion.div>
      </motion.div>

      {/* Auto-save visualization */}
      <motion.div
        className="save-layers"
        initial={{ opacity: 0 }}
        animate={{ opacity: showSaveLayers ? 1 : 0 }}
      >
        <div className="save-title">6-Layer Auto-Save</div>
        {SAVE_LAYERS.map((layer, index) => {
          const Icon = layer.icon;
          
          return (
            <motion.div
              key={layer.name}
              className="save-layer"
              initial={{ x: -50, opacity: 0 }}
              animate={{
                x: showSaveLayers ? 0 : -50,
                opacity: showSaveLayers ? 1 : 0,
              }}
              transition={{ delay: layer.delay }}
            >
              <Icon size={16} />
              <span>{layer.name}</span>
              <motion.div
                className="save-pulse"
                animate={{
                  scale: showSaveLayers ? [1, 1.5, 1] : 1,
                  opacity: showSaveLayers ? [1, 0, 1] : 0,
                }}
                transition={{
                  duration: 1,
                  delay: layer.delay + 0.5,
                }}
              />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Export hint */}
      <motion.div
        className="export-hint"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.6, 0.6, 0],
          y: [0, -10, -10, -20],
        }}
        transition={{
          duration: 6,
          times: [0, 0.2, 0.8, 1],
          repeat: Infinity,
          repeatDelay: 8,
        }}
      >
        <Download size={16} />
        <span>Export anytime • Own your data</span>
      </motion.div>

      {/* Keyboard shortcuts floating */}
      <div className="keyboard-particles">
        {['⌘K', '⌘N', '⌘S', '⌘/'].map((key, i) => (
          <motion.div
            key={key}
            className="keyboard-key"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.6, 0.6, 0],
              y: [-20, -100, -150, -200],
              x: Math.sin(i * 0.8) * 50,
            }}
            transition={{
              duration: 8,
              delay: i * 2,
              repeat: Infinity,
              ease: "easeOut",
            }}
            style={{
              left: `${70 + i * 8}%`,
            }}
          >
            {key}
          </motion.div>
        ))}
      </div>
    </div>
  );
}