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

// Problem card animations
export const problemCardContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

export const problemCardItem = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { 
      duration: 0.6, 
      ease: appleEase.dramatic,
      scale: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  }
};

// Icon float animation
export const iconFloat = {
  rest: { 
    y: 0,
    rotate: 0
  },
  hover: {
    y: -4,
    rotate: 5,
    transition: {
      duration: 0.3,
      ease: appleEase.smooth,
      rotate: {
        duration: 0.6,
        ease: appleEase.dramatic
      }
    }
  }
};

// Glow pulse animation
export const glowPulse = {
  initial: {
    opacity: 0.5,
    scale: 1
  },
  animate: {
    opacity: [0.5, 1, 0.5],
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

// Card 3D tilt effect (enhanced)
export const card3DEnhanced = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.4, 
      ease: appleEase.dramatic 
    }
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: { 
      duration: 0.4, 
      ease: appleEase.dramatic,
      scale: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    }
  }
};

// Gradient animation for borders
export const gradientLoop = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Indicator fill animation
export const indicatorFill = {
  rest: { width: "0%" },
  hover: {
    width: "100%",
    transition: {
      duration: 0.6,
      ease: appleEase.dramatic
    }
  }
};

// Magnetic hover effect for buttons
export const magneticHover = {
  rest: { x: 0, y: 0 },
  hover: (offset) => ({
    x: offset.x * 0.3,
    y: offset.y * 0.3,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 15
    }
  })
};

// Liquid morph animation
export const liquidMorph = {
  rest: {
    borderRadius: "12px",
    scale: 1,
  },
  hover: {
    borderRadius: ["12px", "16px", "12px"],
    scale: [1, 1.02, 1],
    transition: {
      duration: 0.6,
      ease: appleEase.smooth,
      times: [0, 0.5, 1]
    }
  }
};

// Energy pulse animation
export const energyPulse = {
  initial: {
    scale: 1,
    opacity: 1,
  },
  animate: {
    scale: [1, 2, 2.5],
    opacity: [1, 0.5, 0],
    transition: {
      duration: 1.5,
      ease: "easeOut",
      repeat: Infinity,
      repeatDelay: 1
    }
  }
};

// 3D Tilt effect based on mouse position
export const tiltEffect = {
  rest: {
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  },
  hover: (rotation) => ({
    rotateX: rotation.x,
    rotateY: rotation.y,
    scale: 1.02,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30
    }
  })
};

// Particle float animation
export const particleFloat = {
  initial: {
    y: 0,
    x: 0,
    opacity: 0,
  },
  animate: (custom) => ({
    y: custom.y || -100,
    x: custom.x || 0,
    opacity: [0, 1, 1, 0],
    transition: {
      duration: custom.duration || 3,
      delay: custom.delay || 0,
      ease: "linear",
      repeat: Infinity,
      times: [0, 0.1, 0.9, 1]
    }
  })
};

// Feature card reveal animation
export const featureReveal = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.9,
    rotateX: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      ease: appleEase.dramatic,
      opacity: { duration: 0.6 },
      scale: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  }
};

// Hero text reveal with blur
export const heroTextReveal = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: "blur(10px)",
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    scale: 1,
    transition: {
      duration: 1,
      ease: appleEase.dramatic,
      filter: { duration: 0.8 }
    }
  }
};