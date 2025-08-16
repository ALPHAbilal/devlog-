import { useState, useRef } from 'react';

export default function TouchFeedback({ 
  children, 
  onClick, 
  className = '', 
  disabled = false,
  rippleColor = 'rgba(255, 255, 255, 0.3)',
  hapticFeedback = true 
}) {
  const [ripples, setRipples] = useState([]);
  const containerRef = useRef(null);
  let rippleTimeout = null;

  const handleClick = (e) => {
    if (disabled) return;

    // Create ripple effect
    const rect = containerRef.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    };

    setRipples(prev => [...prev, newRipple]);

    // Remove ripple after animation
    rippleTimeout = setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    // Haptic feedback
    if (hapticFeedback && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    // Call onClick handler
    if (onClick) {
      onClick(e);
    }
  };

  const handleTouchStart = (e) => {
    if (disabled) return;

    // Add pressed state
    if (containerRef.current) {
      containerRef.current.classList.add('pressed');
    }

    // Light haptic feedback on touch start
    if (hapticFeedback && window.navigator.vibrate) {
      window.navigator.vibrate(5);
    }
  };

  const handleTouchEnd = () => {
    // Remove pressed state
    if (containerRef.current) {
      containerRef.current.classList.remove('pressed');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`touch-feedback ${className} ${disabled ? 'disabled' : ''}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}
      
      {/* Ripple container */}
      <div className="ripple-container">
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              backgroundColor: rippleColor
            }}
          />
        ))}
      </div>
    </div>
  );
}