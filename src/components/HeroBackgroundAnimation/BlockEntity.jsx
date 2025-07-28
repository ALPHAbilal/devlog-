import { motion } from 'framer-motion';
import { memo } from 'react';

const blockIcons = {
  code: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 7l-4 5 4 5m8-10l4 5-4 5m-6-14l-2 14" />
    </svg>
  ),
  text: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 6h16M4 12h16M4 18h12" />
    </svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2a10 10 0 1010 10A10 10 0 0012 2zm0 18a8 8 0 118-8 8 8 0 01-8 8z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9V6m0 12v-3m3-3h3m-12 0h3" />
    </svg>
  ),
  heading: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 4v16m12-16v16m-12-8h12" />
    </svg>
  ),
  todo: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
  version: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M6 9v4c0 1 1 2 2 2h8c1 0 2-1 2-2V9" />
    </svg>
  ),
  file: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <path d="M13 2v7h7" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18m-18 6h18m-12-12v18m6-18v18" />
    </svg>
  ),
};

// Memoize to prevent unnecessary re-renders
const BlockEntity = memo(function BlockEntity({ block }) {
  const { type, x, y, size, opacity, layer, duration, delay, id } = block;

  const variants = {
    initial: {
      y: window.innerHeight + size,
      opacity: 0,
      scale: 0.8,
    },
    animate: {
      y: -size * 2,
      opacity: [0, opacity, opacity, 0],
      scale: 1,
      transition: {
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "linear",
        opacity: {
          times: [0, 0.1, 0.9, 1],
          ease: "easeInOut",
        },
      },
    },
  };

  // CSS custom properties for this block's position
  const style = {
    '--block-x': `${x + size / 2}px`,
    '--block-y': `${y + size / 2}px`,
    '--block-size': `${size}px`,
    left: x,
    top: 0,
    width: size,
    height: size,
  };

  return (
    <motion.div
      className={`hero-block hero-block--${type} hero-block--layer-${layer}`}
      style={style}
      variants={variants}
      initial="initial"
      animate="animate"
      data-block-id={id}
    >
      <div className="hero-block__inner">
        <div className="hero-block__content">
          <div className="hero-block__icon">
            {blockIcons[type]}
          </div>
          {type === 'code' && (
            <div className="hero-block__code-lines">
              <span className="hero-block__code-line" />
              <span className="hero-block__code-line" />
              <span className="hero-block__code-line" />
            </div>
          )}
        </div>
        <div className="hero-block__glow" />
      </div>
    </motion.div>
  );
});

export default BlockEntity;