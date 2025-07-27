import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { GitBranch, GitCommit, GitMerge } from 'lucide-react';

// Sample code evolution stages
const CODE_VERSIONS = [
  {
    version: 'v1.0',
    code: `function fetchData() {\n  // Initial implementation\n  return fetch('/api/data')\n}`,
    highlight: 'Initial implementation',
  },
  {
    version: 'v1.1',
    code: `async function fetchData() {\n  // Added error handling\n  try {\n    return await fetch('/api/data')\n  } catch (error) {\n    console.error(error)\n  }\n}`,
    highlight: 'Added error handling',
  },
  {
    version: 'v2.0',
    code: `async function fetchData(options = {}) {\n  // Added caching & retry logic\n  const cached = cache.get(options.key)\n  if (cached) return cached\n  \n  try {\n    const data = await fetchWithRetry('/api/data', options)\n    cache.set(options.key, data)\n    return data\n  } catch (error) {\n    logger.error('Fetch failed:', error)\n    throw error\n  }\n}`,
    highlight: 'Added caching & retry logic',
  },
];

export default function CodeEvolution() {
  const [currentVersion, setCurrentVersion] = useState(0);
  const [showBranch, setShowBranch] = useState(false);

  // Auto-advance through versions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentVersion((prev) => (prev + 1) % CODE_VERSIONS.length);
      setShowBranch(true);
      setTimeout(() => setShowBranch(false), 2000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="code-evolution">
      {/* Version timeline */}
      <div className="evolution-timeline">
        {CODE_VERSIONS.map((version, index) => (
          <motion.div
            key={version.version}
            className="timeline-node"
            initial={{ scale: 0 }}
            animate={{ 
              scale: index <= currentVersion ? 1 : 0.5,
              opacity: index <= currentVersion ? 1 : 0.3,
            }}
            transition={{ delay: index * 0.2 }}
          >
            <GitCommit 
              size={20} 
              color={index === currentVersion ? '#10b981' : '#64748b'} 
            />
            <span className="version-label">{version.version}</span>
          </motion.div>
        ))}
        
        {/* Connection lines */}
        <motion.div
          className="timeline-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: (currentVersion + 1) / CODE_VERSIONS.length }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Code display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentVersion}
          className="evolution-code-block"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.5 }}
        >
          <div className="code-header">
            <div className="code-version">
              {CODE_VERSIONS[currentVersion].version}
            </div>
            <div className="code-highlight">
              {CODE_VERSIONS[currentVersion].highlight}
            </div>
          </div>
          
          <pre className="code-content">
            <code>{CODE_VERSIONS[currentVersion].code}</code>
          </pre>
          
          {/* Version control visualization */}
          <AnimatePresence>
            {showBranch && currentVersion > 0 && (
              <motion.div
                className="branch-merge"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <GitBranch size={16} />
                <span>→</span>
                <GitMerge size={16} />
                <span className="merge-text">Merged to main</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Floating version badges */}
      <div className="version-badges">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="version-badge"
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: [0, 1, 1, 0],
              y: [100, 0, -20, -100],
              x: Math.sin(i * 1.5) * 30,
            }}
            transition={{
              duration: 8,
              delay: i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            v{(currentVersion + i + 1) % 3 + 1}.{i}
          </motion.div>
        ))}
      </div>

      {/* Evolution particles */}
      <div className="evolution-particles">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="evolution-particle"
            style={{
              left: `${20 + i * 12}%`,
              background: i % 2 === 0 ? '#10b981' : '#3b82f6',
            }}
            animate={{
              y: [-50, -200],
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 0.5,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}