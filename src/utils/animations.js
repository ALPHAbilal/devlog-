// Framer Motion animation variants and utilities

// Fade animations
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
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
    transition: { duration: 0.5, ease: "easeOut" }
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
      ease: [0.6, 0.01, -0.05, 0.95]
    }
  }
};

// Scale animations
export const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

// Card hover animations
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: "0 20px 30px rgba(0, 0, 0, 0.2)",
    transition: { duration: 0.2, ease: "easeOut" }
  }
};

// Button animations
export const buttonHover = {
  rest: {
    scale: 1,
    boxShadow: "0 4px 6px rgba(16, 185, 129, 0.2)",
    transition: { duration: 0.2, ease: "easeOut" }
  },
  hover: {
    scale: 1.05,
    boxShadow: "0 8px 20px rgba(16, 185, 129, 0.4)",
    transition: { duration: 0.2, ease: "easeOut" }
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
export const iconBounce = {
  rest: { y: 0 },
  hover: {
    y: [-2, 0, -2],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export const iconRotate = {
  rest: { rotate: 0 },
  hover: {
    rotate: 360,
    transition: { duration: 0.6, ease: "easeInOut" }
  }
};

// Shimmer effect for badges/highlights
export const shimmer = {
  rest: {
    backgroundPosition: "-200% center",
    transition: { duration: 0 }
  },
  hover: {
    backgroundPosition: "200% center",
    transition: { 
      duration: 1.5,
      ease: "linear",
      repeat: Infinity
    }
  }
};

// Navigation scroll effects
export const navScrolled = {
  top: {
    backgroundColor: "rgba(10, 22, 40, 0.8)",
    backdropFilter: "blur(12px)",
    boxShadow: "none",
    transition: { duration: 0.3, ease: "easeOut" }
  },
  scrolled: {
    backgroundColor: "rgba(10, 22, 40, 0.95)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
    transition: { duration: 0.3, ease: "easeOut" }
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
    transition: { duration: 0.3, ease: "easeOut" }
  },
  hover: {
    scale: 1.05,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

// Gradient animation
export const gradientShift = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 5,
      ease: "linear",
      repeat: Infinity
    }
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