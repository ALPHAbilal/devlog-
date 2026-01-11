# Framer Motion (Now Called "Motion") - Complete Documentation Guide

## ðŸ“š Important Update

**Framer Motion has been rebranded to "Motion"** in 2024-2025. It's now available as a more universal animation library for JavaScript, React, and Vue frameworks. The documentation, API, and core concepts remain largely the same, but the naming has changed.

- **Official Docs:** https://motion.dev/docs
- **Examples:** https://motion.dev/examples
- **npm install:** `npm install motion` (or `framer-motion` for legacy)

---

## ðŸš€ Quick Start

### 1. Installation

```bash
# Using npm
npm install framer-motion

# Using yarn
yarn add framer-motion

# Using pnpm
pnpm add framer-motion
```

### 2. Basic Setup

```javascript
import { motion } from "framer-motion";

function MyComponent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      Hello, animated world!
    </motion.div>
  );
}
```

---

## ðŸŽ¯ Core Concepts

### 1. **Motion Component**

The foundation of Framer Motion is the `motion` component wrapper:

- `motion.div`, `motion.span`, `motion.button`, etc.
- Wraps existing DOM elements to make them animatable
- Declarative API using props

```javascript
import { motion } from "framer-motion";

<motion.div
  initial={{ rotate: 0 }}        // Starting state
  animate={{ rotate: 360 }}      // Target state
  transition={{ duration: 2 }}   // Animation timing
>
  Rotating Box
</motion.div>
```

### 2. **Initial, Animate, Exit**

Three key animation states:

| Property | Purpose |
|----------|---------|
| `initial` | State when component first mounts |
| `animate` | State to animate towards |
| `exit` | State when component unmounts (with AnimatePresence) |

```javascript
<motion.div
  initial={{ y: -100, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: 100, opacity: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### 3. **Transition Options**

Control how animations happen:

```javascript
<motion.div
  animate={{ x: 100 }}
  transition={{
    duration: 0.8,        // Animation duration in seconds
    delay: 0.2,          // Wait before starting
    ease: "easeInOut",   // Easing function
    repeat: Infinity,    // Repeat count
    repeatType: "reverse", // How to repeat (reverse, loop, mirror)
    repeatDelay: 0.5,    // Delay between repeats
  }}
>
  Animated Box
</motion.div>
```

**Easing Functions:**
- `"linear"` - Constant speed
- `"easeIn"`, `"easeOut"`, `"easeInOut"` - Smooth curves
- `"circIn"`, `"circOut"`, `"circInOut"` - Circular easing
- `"backIn"`, `"backOut"`, `"backInOut"` - Back/overshoot effect
- `[0.17, 0.67, 0.83, 0.67]` - Custom cubic-bezier

### 4. **Spring Animations**

Physics-based animations that feel natural:

```javascript
<motion.div
  animate={{ rotate: 360 }}
  transition={{
    type: "spring",
    stiffness: 100,    // 0-1000, higher = stiffer
    damping: 10,       // 0-100, higher = less bouncy
    mass: 1,           // 1-10, affects momentum
  }}
>
  Spring Animation
</motion.div>
```

**Preset Spring Types:**
```javascript
transition={{ type: "spring" }}           // Default spring
transition={{ type: "spring", duration: 0.8 }} // Tween-like spring
```

---

## âœ‹ Gesture Animations

### 1. **Hover & Tap**

```javascript
<motion.button
  whileHover={{ scale: 1.1 }}      // Scale on hover
  whileTap={{ scale: 0.95 }}       // Scale on click
  transition={{ type: "spring", stiffness: 400 }}
>
  Hover & Tap Me
</motion.button>
```

### 2. **Drag**

```javascript
<motion.div
  drag                             // Enable dragging
  dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
  dragElastic={0.2}               // How "elastic" the drag is
  onDragEnd={(event, info) => {
    console.log("Dragged by", info.offset);
  }}
>
  Drag Me!
</motion.div>
```

**Drag Constraints:**
```javascript
// Constrain to bounds
drag
dragConstraints={{ left: -200, right: 200, top: 0, bottom: 300 }}

// Constrain to parent element
const constraintsRef = useRef(null);
<motion.div ref={constraintsRef}>
  <motion.div drag dragConstraints={constraintsRef} />
</motion.div>
```

### 3. **Inertia & Momentum**

```javascript
<motion.div
  drag
  dragElastic={0.2}
  dragMomentum={{
    power: 0.8,        // 0-1, how much momentum carries
    restDelta: 10,     // When to consider drag "complete"
  }}
>
  Swipe with Momentum
</motion.div>
```

### 4. **Focus & More Gestures**

```javascript
<motion.input
  whileFocus={{ scale: 1.05, boxShadow: "0 0 10px rgba(0,0,0,0.2)" }}
  transition={{ type: "spring", stiffness: 300 }}
/>

<motion.div
  onHoverStart={() => console.log("hover start")}
  onHoverEnd={() => console.log("hover end")}
  onTapStart={() => console.log("tap start")}
  onTapCancel={() => console.log("tap cancelled")}
/>
```

---

## ðŸ“Š Variants

Pre-define animation states for reusability and orchestration:

```javascript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // Delay between children
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

function List() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.div key={item} variants={itemVariants}>
          {item}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

**Key Features:**
- Variants cascade to child motion elements
- Automatic orchestration with `staggerChildren`
- Named states for cleaner code
- Reusable across components

---

## ðŸŽ¬ AnimatePresence

Handle enter/exit animations when components mount/unmount:

```javascript
import { motion, AnimatePresence } from "framer-motion";

function Modal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.3 }}
        >
          <h1>Modal Content</h1>
          <button onClick={onClose}>Close</button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Exit Mode Options:**
```javascript
<AnimatePresence
  mode="wait"           // Wait for exit before next enter
  // OR
  mode="popLayout"      // Sync with layout animations
>
  {/* content */}
</AnimatePresence>
```

---

## ðŸ“ Layout Animations

Automatically animate layout changes:

```javascript
import { motion } from "framer-motion";
import { useState } from "react";

function LayoutExample() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout                  // Enable layout animation
      onClick={() => setIsExpanded(!isExpanded)}
      style={{
        width: isExpanded ? 300 : 100,
        height: isExpanded ? 300 : 100,
      }}
    >
      Click to expand
    </motion.div>
  );
}
```

**Layout ID for Shared Elements:**

```javascript
// Animate between different positions/sizes
<motion.div layoutId="shared-element" />
// Later in different component...
<motion.div layoutId="shared-element" /> // Animates to this position
```

---

## ðŸª Hooks

### 1. **useMotionValue**

Create animatable values:

```javascript
import { useMotionValue, useTransform } from "framer-motion";

function Slider() {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);

  return (
    <motion.div
      drag="x"
      dragElastic={0.2}
      style={{ x, opacity }}
    >
      Drag me
    </motion.div>
  );
}
```

### 2. **useTransform**

Transform one value into another:

```javascript
const x = useMotionValue(0);
const rotation = useTransform(x, [-100, 100], [-45, 45]);
const scale = useTransform(x, [-100, 0, 100], [0.5, 1, 1.5]);

<motion.div style={{ x, rotation, scale }} drag="x" />
```

### 3. **useViewportScroll**

Scroll-linked animations (legacy - use `useScroll` in newer versions):

```javascript
import { useScroll, useTransform } from "framer-motion";

function ScrollExample() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return <motion.div style={{ opacity }}>Fade on scroll</motion.div>;
}
```

### 4. **useAnimation**

Programmatically control animations:

```javascript
import { useAnimation } from "framer-motion";

function AnimationControl() {
  const controls = useAnimation();

  const handleClick = async () => {
    await controls.start({ x: 100 });
    await controls.start({ rotate: 360 });
  };

  return (
    <motion.div animate={controls}>
      <button onClick={handleClick}>Animate</button>
    </motion.div>
  );
}
```

### 5. **useInView**

Trigger animations when element enters viewport:

```javascript
import { useInView } from "framer-motion";
import { useRef } from "react";

function InViewExample() {
  const ref = useRef(null);
  const isInView = useInView(ref);

  return (
    <motion.div
      ref={ref}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
    >
      Animates when in view
    </motion.div>
  );
}
```

---

## ðŸŽ¨ Animatable Properties

### Common Properties
- **Transform:** `x`, `y`, `z`, `rotate`, `rotateX`, `rotateY`, `scale`, `scaleX`, `scaleY`
- **Opacity:** `opacity`
- **Colors:** `color`, `backgroundColor`, `borderColor`
- **Dimensions:** `width`, `height`
- **Positioning:** Any CSS property that doesn't trigger layout

### Will NOT Animate Efficiently
- `top`, `left`, `right`, `bottom` (use `x`, `y` instead)
- `padding`, `margin` (use layout animations)
- `display` (use AnimatePresence)

### Animation Example
```javascript
<motion.div
  animate={{
    x: 100,
    y: 50,
    rotate: 90,
    scale: 1.2,
    opacity: 0.8,
    backgroundColor: "#ff0000",
  }}
/>
```

---

## ðŸ”„ Common Patterns

### 1. **Stagger Animation**

```javascript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

<motion.div variants={container} initial="hidden" animate="show">
  {items.map((i) => (
    <motion.div key={i} variants={item} />
  ))}
</motion.div>
```

### 2. **Page Transition**

```javascript
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
```

### 3. **Loading Spinner**

```javascript
const spin = {
  animate: {
    rotate: 360,
  },
};

<motion.div
  variants={spin}
  animate="animate"
  transition={{ duration: 1, repeat: Infinity, linear: true }}
>
  â³
</motion.div>
```

### 4. **Slide-In Menu**

```javascript
<motion.div
  initial={{ x: "-100%" }}
  animate={isOpen ? { x: 0 } : { x: "-100%" }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
  style={{ position: "fixed", left: 0, top: 0, height: "100vh", width: 300 }}
>
  {/* Menu content */}
</motion.div>
```

### 5. **Hover & Click Effects**

```javascript
<motion.button
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 10,
  }}
>
  Interactive Button
</motion.button>
```

---

## ðŸ“± Scroll Animations

### Scroll-Triggered Animations

```javascript
import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

function ScrollTrigger() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <motion.div ref={ref} style={{ opacity }}>
      Fades in on scroll
    </motion.div>
  );
}
```

### Parallax Effect

```javascript
function Parallax() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, -100]);

  return (
    <motion.div style={{ y, backgroundAttachment: "fixed" }}>
      Parallax content
    </motion.div>
  );
}
```

---

## ðŸŽª SVG Animations

### Path Drawing Animation

```javascript
<motion.path
  pathLength={0}
  animate={{ pathLength: 1 }}
  transition={{ duration: 2 }}
  stroke="black"
  strokeWidth={2}
/>
```

### SVG Morphing

```javascript
import { useState } from "react";

function SVGMorph() {
  const [isCircle, setIsCircle] = useState(true);

  return (
    <motion.svg width={200} height={200}>
      <motion.circle
        cx={100}
        cy={100}
        r={isCircle ? 50 : 0}
        animate={{ r: isCircle ? 50 : 100 }}
      />
    </motion.svg>
  );
}
```

---

## ðŸš€ Performance Tips

1. **Use `motion` instead of `div`** - Optimized for animations
2. **Animate transforms instead of layout properties** - Better performance
   - âœ… Use: `x`, `y`, `rotate`, `scale`
   - âŒ Avoid: `top`, `left`, `width`, `height`
3. **Use `will-change` sparingly** - Framer Motion handles this
4. **Lazy load animations** - Don't animate off-screen elements
5. **Use Spring instead of Tween** for natural interactions
6. **Batch animations** - Use variants to coordinate multiple elements

---

## ðŸ“š Key API Reference

### Props

| Prop | Type | Purpose |
|------|------|---------|
| `initial` | object/string | Starting animation state |
| `animate` | object/string | Target animation state |
| `exit` | object/string | Animation when unmounting |
| `transition` | object | Animation timing options |
| `variants` | object | Predefined animation states |
| `drag` | boolean | Enable dragging |
| `whileHover` | object | Animate on hover |
| `whileTap` | object | Animate on tap |
| `whileFocus` | object | Animate on focus |
| `whileInView` | object | Animate when in viewport |
| `layout` | boolean | Enable layout animations |
| `layoutId` | string | Shared layout animations |

### Hooks

| Hook | Purpose |
|------|---------|
| `useMotionValue()` | Create animatable values |
| `useTransform()` | Transform one value to another |
| `useScroll()` | Track scroll position |
| `useAnimation()` | Programmatic animation control |
| `useInView()` | Detect viewport visibility |
| `useAnimationFrame()` | Callback on each animation frame |
| `useTime()` | Track animation time |

### Components

| Component | Purpose |
|-----------|---------|
| `motion.*` | Animated DOM elements |
| `AnimatePresence` | Manage mount/unmount animations |

---

## ðŸ”— Resources

### Official Documentation
- **Motion Docs:** https://motion.dev/docs
- **Motion Examples:** https://motion.dev/examples (330+ examples!)
- **GitHub:** https://github.com/motiondivision/motion

### Learning Materials
- **Framer Motion Playground:** https://framermotionexamples.com
- **YouTube Crash Course:** "The Framer Motion Crash Course || React Animation"
- **Tutorials:** Interactive examples with source code on motion.dev

### Integration Guides
- **Framer:** Use Motion in Framer projects
- **Next.js:** Built-in support with SSR
- **Figma:** Design and implement animations
- **Three.js:** 3D animations with Motion
- **Radix UI, Base UI:** Combine with component libraries

---

## ðŸ’¡ Pro Tips

1. **Use `layoutId` for shared element transitions** - Create polished page transitions
2. **Combine `drag` with `useMotionValue`** - Create interactive, responsive designs
3. **Use `AnimatePresence` with `exit` animations** - Never let elements disappear abruptly
4. **Leverage `whileInView`** - Animate on scroll without complex scroll tracking
5. **Test with `repeat: Infinity`** - Quick way to see if animation looks right
6. **Use spring physics** - Feels more natural than linear tweens
7. **Group related animations in variants** - Makes code cleaner and reusable
8. **Monitor performance** - Chrome DevTools Animation Panel is your friend

---

## ðŸŽ“ Next Steps

1. **Start Small:** Create simple hover and tap animations first
2. **Build Complex Variants:** Master variant orchestration
3. **Explore Gestures:** Add drag and scroll interactions
4. **Combine with Other Libraries:** Pair with Three.js, D3, etc.
5. **Read Official Examples:** 330+ examples cover every use case
6. **Join Community:** Framer community Discord for help

---

## ðŸ“ Common Mistakes to Avoid

1. âŒ **Animating layout properties** â†’ Use transforms instead
2. âŒ **Not using AnimatePresence** â†’ Elements disappear abruptly
3. âŒ **Complex calculations in `animate` object** â†’ Use `useTransform` instead
4. âŒ **Forgetting `ref={constraintsRef}`** â†’ Drag constraints won't work
5. âŒ **Using `whileHover` and `whileTap` together without `transition`** â†’ Can feel janky
6. âŒ **Not leveraging `layoutId`** â†’ Missing smooth transitions
7. âŒ **Animating too much** â†’ Keep animations under 1 second for UI
8. âŒ **Not testing on mobile** â†’ Gestures work differently on touch devices

---

**Last Updated:** January 2026
**Framework Version:** Motion (formerly Framer Motion)
**Status:** Current and actively maintained