import { useEffect } from 'react';

export default function OpacityForensics() {
  useEffect(() => {
    // Forensic opacity debugger
    const suspiciousValues = [0.685, 0.770];
    const opacitySnapshots = new Map();
    
    // 1. Intercept all opacity modifications
    const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
    CSSStyleDeclaration.prototype.setProperty = function(property, value, priority) {
      if (property === 'opacity') {
        const numericValue = parseFloat(value);
        if (suspiciousValues.some(v => Math.abs(v - numericValue) < 0.001)) {
          console.error('🚨 SUSPICIOUS OPACITY DETECTED:', value);
          console.trace('Stack trace at detection:');
        }
      }
      return originalSetProperty.call(this, property, value, priority);
    };
    
    // 2. Monitor computed style access
    const originalGetComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function(element, pseudoElement) {
      const styles = originalGetComputedStyle.call(this, element, pseudoElement);
      const opacity = styles.opacity;
      
      if (opacity && suspiciousValues.some(v => Math.abs(v - parseFloat(opacity)) < 0.001)) {
        console.warn('⚠️ Computed opacity at suspicious value:', opacity, 'for:', element);
        opacitySnapshots.set(element, {
          opacity: opacity,
          timestamp: performance.now(),
          stack: new Error().stack
        });
      }
      return styles;
    };
    
    // 3. Track transition interruptions
    const handleTransitionCancel = (e) => {
      if (e.propertyName === 'opacity') {
        const currentOpacity = getComputedStyle(e.target).opacity;
        console.error('💥 Opacity transition CANCELLED at:', currentOpacity);
        console.log('Element:', e.target);
        console.log('Elapsed time:', e.elapsedTime);
      }
    };
    
    document.addEventListener('transitioncancel', handleTransitionCancel, true);
    
    // 4. Monitor React render interruptions
    let renderCount = 0;
    const checkBlockControls = () => {
      renderCount++;
      if (renderCount > 1) {
        const elements = document.querySelectorAll('.block-controls');
        elements.forEach(element => {
          const opacity = getComputedStyle(element).opacity;
          if (opacity !== '0' && opacity !== '1') {
            console.warn('React render during transition, opacity:', opacity);
          }
        });
      }
    };
    
    // Check periodically
    const intervalId = setInterval(checkBlockControls, 500);
    
    console.log('✅ Opacity forensics enabled. Watch for 🚨 and 💥 markers.');
    
    // Cleanup
    return () => {
      document.removeEventListener('transitioncancel', handleTransitionCancel, true);
      clearInterval(intervalId);
      // Note: We can't easily restore the prototype methods, so they'll remain patched
    };
  }, []);
  
  // Run immediate diagnostic
  useEffect(() => {
    const diagnoseOpacityIssue = async () => {
      await new Promise(r => setTimeout(r, 1000)); // Wait for components to mount
      
      const elements = document.querySelectorAll('.block-controls');
      
      console.group('🔬 Opacity Diagnostic Report');
      console.log('Found', elements.length, 'BlockControls elements');
      
      elements.forEach((element, index) => {
        const computed = getComputedStyle(element);
        console.log(`BlockControls ${index}:`, {
          opacity: computed.opacity,
          transition: computed.transition,
          willChange: computed.willChange,
          transform: computed.transform,
          classList: Array.from(element.classList),
          parent: element.parentElement
        });
      });
      
      console.groupEnd();
    };
    
    diagnoseOpacityIssue();
  }, []);
  
  return null; // This is a diagnostic component, no UI needed
}