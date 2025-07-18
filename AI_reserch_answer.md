# Best Practices for Pricing Toggle Buttons: Dynamic Content Handling & Modern Implementation

## The dynamic content challenge and its solution

Your pricing toggle's misalignment issue stems from a fundamental problem: percentage-based calculations don't account for actual DOM element dimensions. When the "Save 22%" badge appears, the Annual button's width changes, but your animation calculations remain static. Modern solutions leverage **ResizeObserver** and **LayoutGroup** to handle these dynamic changes automatically.

The industry has shifted from toggle switches to **segmented controls** (radio-style buttons) for pricing selectors. Companies like GitHub, Tailwind UI, and modern design systems favor this pattern because it better represents a choice between options rather than an on/off state. More importantly, segmented controls handle dynamic content more gracefully through proper layout measurement techniques.

## Modern implementation patterns from leading companies

Leading tech companies in 2024-2025 have converged on several key patterns for pricing toggles. Rather than complex percentage calculations, they use **transform-based animations** with **absolute positioning** for highlight indicators. The most successful implementations measure actual DOM dimensions and update CSS custom properties dynamically.

**Radix UI** exemplifies the modern approach with their SegmentedControl component. They use ResizeObserver to track content changes and update the highlight position accordingly. **Tailwind UI** implements a similar pattern using CSS custom properties for runtime animation control. **Ant Design** provides a `transitionDuration` prop for customizing animation timing, while **Mantine** automatically recalculates widths with a 50ms debounce for performance.

## Technical solution: Measuring and animating based on actual DOM sizes

Here's a production-ready solution using **Framer Motion's LayoutGroup** to handle your dynamic content challenge:

```jsx
import { motion, LayoutGroup } from 'framer-motion';
import { useState, useRef, useLayoutEffect } from 'react';

function PricingToggle() {
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [dimensions, setDimensions] = useState({ monthly: 0, annual: 0 });
  const monthlyRef = useRef(null);
  const annualRef = useRef(null);

  // Measure button dimensions on mount and when content changes
  useLayoutEffect(() => {
    const measureButtons = () => {
      if (monthlyRef.current && annualRef.current) {
        setDimensions({
          monthly: monthlyRef.current.offsetWidth,
          annual: annualRef.current.offsetWidth
        });
      }
    };

    measureButtons();
    
    // Set up ResizeObserver for dynamic content changes
    const resizeObserver = new ResizeObserver(measureButtons);
    if (monthlyRef.current) resizeObserver.observe(monthlyRef.current);
    if (annualRef.current) resizeObserver.observe(annualRef.current);
    
    return () => resizeObserver.disconnect();
  }, [billingPeriod]); // Re-measure when billing period changes

  return (
    <LayoutGroup>
      <div className="inline-flex items-center p-1 bg-dark-secondary rounded-lg relative">
        {/* Highlight indicator with dynamic positioning */}
        <motion.div
          className="absolute h-[calc(100%-8px)] bg-accent-green rounded-md"
          layoutId="highlight"
          initial={false}
          animate={{
            x: billingPeriod === 'monthly' ? 4 : dimensions.monthly + 4,
            width: billingPeriod === 'monthly' ? dimensions.monthly : dimensions.annual
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ top: '4px' }}
        />
        
        <button
          ref={monthlyRef}
          onClick={() => setBillingPeriod('monthly')}
          className="px-4 py-2 rounded-md transition-all relative z-10"
          aria-pressed={billingPeriod === 'monthly'}
        >
          Monthly
        </button>
        
        <button
          ref={annualRef}
          onClick={() => setBillingPeriod('annual')}
          className="px-4 py-2 rounded-md transition-all relative z-10 flex items-center"
          aria-pressed={billingPeriod === 'annual'}
        >
          Annual
          <AnimatePresence mode="wait">
            {billingPeriod === 'annual' && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="ml-2 text-xs bg-dark-primary/20 px-2 py-0.5 rounded"
              >
                Save 22%
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </LayoutGroup>
  );
}
```

## Alternative approach: CSS custom properties with layout measurement

For teams preferring CSS-based animations, this approach uses CSS custom properties updated via JavaScript:

```jsx
function CSSPricingToggle() {
  const [isAnnual, setIsAnnual] = useState(false);
  const containerRef = useRef(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    const buttons = containerRef.current.querySelectorAll('button');
    const monthlyButton = buttons[0];
    const annualButton = buttons[1];
    
    const updateHighlight = () => {
      const activeButton = isAnnual ? annualButton : monthlyButton;
      const { offsetLeft, offsetWidth } = activeButton;
      
      containerRef.current.style.setProperty('--highlight-x', `${offsetLeft}px`);
      containerRef.current.style.setProperty('--highlight-width', `${offsetWidth}px`);
    };
    
    updateHighlight();
    
    // Update on window resize
    window.addEventListener('resize', updateHighlight);
    return () => window.removeEventListener('resize', updateHighlight);
  }, [isAnnual]);

  return (
    <div 
      ref={containerRef}
      className="pricing-toggle-container"
      style={{
        '--highlight-x': '4px',
        '--highlight-width': '100px'
      }}
    >
      <div className="highlight-indicator" />
      <button 
        onClick={() => setIsAnnual(false)}
        aria-pressed={!isAnnual}
      >
        Monthly
      </button>
      <button 
        onClick={() => setIsAnnual(true)}
        aria-pressed={isAnnual}
      >
        Annual {isAnnual && <span className="badge">Save 22%</span>}
      </button>
    </div>
  );
}
```

```css
.pricing-toggle-container {
  display: inline-flex;
  position: relative;
  background: #1a1a1a;
  border-radius: 8px;
  padding: 4px;
}

.highlight-indicator {
  position: absolute;
  top: 4px;
  bottom: 4px;
  left: var(--highlight-x);
  width: var(--highlight-width);
  background: #10b981;
  border-radius: 6px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.pricing-toggle-container button {
  position: relative;
  z-index: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.2s;
}

.badge {
  margin-left: 8px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  font-size: 12px;
}
```

## Accessibility considerations for toggle animations

Modern pricing toggles must meet **WCAG 2.2** standards. The key requirement is using `aria-pressed` to communicate toggle state rather than changing button labels. Screen readers announce "Monthly toggle button pressed" or "Annual toggle button not pressed," providing clear state information.

Implement **prefers-reduced-motion** support to respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .highlight-indicator {
    transition: none;
  }
  
  .pricing-toggle-container button {
    transition: none;
  }
}
```

For keyboard navigation, ensure both **Space** and **Enter** keys activate the toggle. Focus indicators must meet the 3:1 contrast ratio requirement:

```css
.pricing-toggle-container button:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

## Performance optimization strategies

**Preventing layout shifts** is critical for Core Web Vitals. The key is animating only `transform` and `opacity` properties, which don't trigger reflow:

```css
.highlight-indicator {
  transform: translateX(var(--highlight-x));
  width: var(--highlight-width);
  will-change: transform, width;
}

/* Clean up will-change after animation */
.highlight-indicator:not(.animating) {
  will-change: auto;
}
```

For **React optimization**, memoize the toggle component and use callbacks efficiently:

```jsx
const PricingToggle = React.memo(({ onPeriodChange }) => {
  const handleToggle = useCallback((period) => {
    onPeriodChange(period);
  }, [onPeriodChange]);
  
  // Component implementation
});
```

## Modern design trends and implementation examples

The shift toward **segmented controls** reflects a broader trend in UI design. Companies like Linear and Railway use minimal, clean interfaces with subtle animations. The typical animation duration is **200-300ms** with spring animations providing the most natural feel.

For comprehensive examples, **Tailwind UI** offers multiple pricing toggle patterns. **Radix UI's** SegmentedControl provides a fully accessible implementation with built-in ResizeObserver support. **Headless UI** offers an unstyled foundation perfect for custom designs.

## Conclusion

The solution to your dynamic content challenge lies in measuring actual DOM dimensions rather than relying on percentage calculations. Modern approaches using ResizeObserver, LayoutGroup, or CSS custom properties provide smooth, professional animations that adapt to content changes automatically. By following accessibility guidelines and performance best practices, you'll create a pricing toggle that not only looks polished but provides an excellent user experience across all devices and assistive technologies.