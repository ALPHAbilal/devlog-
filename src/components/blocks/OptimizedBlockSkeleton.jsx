import React from 'react';

const OptimizedBlockSkeleton = ({ type = 'text', estimatedHeight = 100 }) => {
  // Use CSS custom property for dynamic height
  const style = {
    '--skeleton-height': `${estimatedHeight}px`
  };

  return (
    <div 
      className="skeleton-block"
      style={style}
      data-skeleton-type={type}
    >
      <div className="skeleton-content" />
    </div>
  );
};

// Add CSS for skeleton loading
export const skeletonStyles = `
  .skeleton-block {
    position: relative;
    height: var(--skeleton-height);
    margin-bottom: 1rem;
    border-radius: 0.5rem;
    overflow: hidden;
    background: rgba(31, 41, 55, 0.5); /* dark-primary/50 */
    border: 1px solid rgba(55, 65, 81, 0.5); /* gray-800/50 */
  }

  .skeleton-content {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(156, 163, 175, 0.1) 50%,
      transparent 100%
    );
    animation: skeleton-shimmer 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }

  /* Type-specific skeleton patterns */
  .skeleton-block[data-skeleton-type="heading"]::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 1rem;
    right: 25%;
    height: 2rem;
    background: rgba(107, 114, 128, 0.3);
    border-radius: 0.25rem;
    transform: translateY(-50%);
  }

  .skeleton-block[data-skeleton-type="text"]::before,
  .skeleton-block[data-skeleton-type="text"]::after {
    content: '';
    position: absolute;
    left: 1rem;
    right: 1rem;
    height: 0.875rem;
    background: rgba(107, 114, 128, 0.3);
    border-radius: 0.25rem;
  }

  .skeleton-block[data-skeleton-type="text"]::before {
    top: 1rem;
    right: 3rem;
  }

  .skeleton-block[data-skeleton-type="text"]::after {
    top: 2.5rem;
    right: 5rem;
  }

  .skeleton-block[data-skeleton-type="code"] {
    background: rgba(31, 41, 55, 0.8);
  }

  .skeleton-block[data-skeleton-type="code"]::before {
    content: '';
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 4rem;
    height: 1rem;
    background: rgba(107, 114, 128, 0.3);
    border-radius: 0.25rem;
  }

  /* Fade in animation when real content loads */
  .block-fade-in {
    animation: block-fade-in 0.3s ease-out;
  }

  @keyframes block-fade-in {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

export default OptimizedBlockSkeleton;