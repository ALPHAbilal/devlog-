// Framer Motion animation variants and utilities

// Apple's custom easing curves
export const appleEase = {
  smooth: [0.25, 0.46, 0.45, 0.94],
  dramatic: [0.16, 1, 0.3, 1]
};

// Fade animations
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: appleEase.smooth }
  }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: appleEase.smooth }
  }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: appleEase.smooth }
  }
};

// Stagger children animations
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: appleEase.smooth }
  }
};

// Text reveal animations
export const textReveal = {
  hidden: { 
    opacity: 0,
    y: 20,
    filter: "blur(10px)"
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: appleEase.dramatic
    }
  }
};

// Scale animations
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: appleEase.smooth }
  }
};

// Card hover animations
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2, ease: appleEase.smooth }
  },
  hover: {
    scale: 1,
    boxShadow: "0 20px 30px rgba(0, 0, 0, 0.2)",
    transition: { duration: 0.2, ease: appleEase.smooth }
  }
};

// Button animations with Stripe's multi-layer shadow
export const buttonHover = {
  rest: {
    scale: 1,
    boxShadow: `
      0 1px 2px rgba(16, 185, 129, 0.15),
      0 3px 6px rgba(16, 185, 129, 0.15),
      0 12px 24px rgba(16, 185, 129, 0.15)
    `,
    transition: { duration: 0.2, ease: appleEase.smooth }
  },
  hover: {
    scale: 1,
    boxShadow: `
      0 1px 3px rgba(16, 185, 129, 0.2),
      0 5px 10px rgba(16, 185, 129, 0.2),
      0 15px 30px rgba(16, 185, 129, 0.2)
    `,
    transition: { duration: 0.2, ease: appleEase.smooth }
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

// Magnetic button effect
export const magneticButton = {
  rest: { x: 0, y: 0 },
  hover: { 
    x: 0, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  }
};

// Icon animations
export const iconLift = {
  rest: { y: 0 },
  hover: {
    y: 0,
    transition: {
      duration: 0.2,
      ease: appleEase.smooth
    }
  }
};

export const iconRotate = {
  rest: { rotate: 0 },
  hover: {
    rotate: 360,
    transition: { duration: 0.6, ease: appleEase.dramatic }
  }
};

// Shimmer effect for badges/highlights (one-time on hover)
export const shimmer = {
  rest: {
    backgroundPosition: "-200% center"
  },
  hover: {
    backgroundPosition: "200% center",
    transition: { 
      duration: 0.8,
      ease: appleEase.smooth
    }
  }
};

// Navigation scroll effects
export const navScrolled = {
  top: {
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    backdropFilter: "blur(12px)",
    boxShadow: "none",
    transition: { duration: 0.3, ease: appleEase.smooth }
  },
  scrolled: {
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    transition: { duration: 0.3, ease: appleEase.smooth }
  }
};

// Pricing toggle animation
export const toggleSwitch = {
  monthly: { x: 0 },
  annual: { x: 24 },
  transition: { type: "spring", stiffness: 700, damping: 30 }
};

// 3D card tilt effect
export const card3D = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.3, ease: appleEase.smooth }
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.3, ease: appleEase.smooth }
  }
};

// Gradient animation (static gradient, no animation)
export const gradientStatic = {
  initial: {
    backgroundPosition: "0% 50%"
  }
};

// Utility function to check for reduced motion preference
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

// Apply reduced motion variants
export const getMotionVariant = (variant) => {
  if (shouldReduceMotion()) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0 } }
    };
  }
  return variant;
};

// Intersection observer options for scroll animations
export const scrollAnimationOptions = {
  once: true,
  margin: "-100px",
  amount: 0.3
};