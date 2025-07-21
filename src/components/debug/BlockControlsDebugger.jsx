import { useEffect } from 'react';

export default function BlockControlsDebugger() {
  useEffect(() => {
    console.clear();
    console.log('🔧 BlockControls Debugging Started...\n');

    // Function to find all potential BlockControls elements
    function findBlockControls() {
      const strategies = [
        // By class patterns
        () => document.querySelectorAll('[class*="absolute"][class*="left"][class*="top"]'),
        () => document.querySelectorAll('[class*="opacity-0"], [class*="opacity-100"]'),
        () => document.querySelectorAll('[class*="scale-95"], [class*="scale-100"]'),
        // By style attributes
        () => document.querySelectorAll('[style*="z-index: 20"]'),
        () => document.querySelectorAll('[style*="pointer-events"]'),
        // By content (looking for drag handles)
        () => document.querySelectorAll('.drag-handle'),
        // By React component structure
        () => document.querySelectorAll('[class*="flex"][class*="items-start"][class*="gap-1"]')
      ];
      
      const results = new Set();
      strategies.forEach((strategy, i) => {
        const found = strategy();
        console.log(`Strategy ${i} found:`, found.length, 'elements');
        found.forEach(el => results.add(el));
      });
      
      return Array.from(results);
    }

    // Function to diagnose visibility issues
    function diagnoseVisibility(element, index) {
      const rect = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      const parent = element.parentElement;
      const parentStyles = parent ? getComputedStyle(parent) : null;
      
      const diagnosis = {
        elementIndex: index,
        className: element.className,
        
        invisibilityReasons: {
          displayNone: styles.display === 'none',
          visibilityHidden: styles.visibility === 'hidden',
          opacityZero: parseFloat(styles.opacity) === 0,
          zeroWidth: rect.width === 0,
          zeroHeight: rect.height === 0,
          offScreen: rect.bottom < 0 || rect.right < 0 || 
                     rect.top > window.innerHeight || rect.left > window.innerWidth,
          parentHidden: parentStyles && (
            parentStyles.display === 'none' || 
            parentStyles.visibility === 'hidden' ||
            parseFloat(parentStyles.opacity) === 0
          ),
          pointerEventsNone: styles.pointerEvents === 'none',
          behindOtherElement: document.elementFromPoint(
            rect.left + rect.width/2, 
            rect.top + rect.height/2
          ) !== element
        },
        
        computedStyles: {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          position: styles.position,
          left: styles.left,
          top: styles.top,
          zIndex: styles.zIndex,
          transform: styles.transform,
          pointerEvents: styles.pointerEvents
        },
        
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom
        }
      };
      
      // Log issues
      const issues = Object.entries(diagnosis.invisibilityReasons)
        .filter(([, value]) => value)
        .map(([key]) => key);
      
      if (issues.length > 0) {
        console.warn(`❌ Element ${index} has issues:`, issues);
      } else {
        console.log(`✅ Element ${index} should be visible`);
      }
      
      return diagnosis;
    }

    // Function to check parent chain
    function analyzeParentChain(element) {
      const chain = [];
      let current = element;
      let depth = 0;
      
      while (current && current !== document.body && depth < 10) {
        const styles = getComputedStyle(current);
        chain.push({
          depth: depth++,
          tag: current.tagName,
          classes: current.className,
          hasGroupClass: current.className.includes('group'),
          overflow: styles.overflow + ' ' + styles.overflowX + ' ' + styles.overflowY,
          position: styles.position,
          display: styles.display,
          opacity: styles.opacity
        });
        current = current.parentElement;
      }
      
      return chain;
    }

    // Function to test hover functionality
    function testHoverState(element, index) {
      console.log(`\n🎯 Testing hover for element ${index}...`);
      
      // Find parent with .group class
      const groupParent = element.closest('.group');
      if (groupParent) {
        console.log('✅ Found .group parent');
        
        // Simulate hover
        groupParent.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        setTimeout(() => {
          const newOpacity = getComputedStyle(element).opacity;
          console.log(`After mouseenter: opacity = ${newOpacity}`);
          groupParent.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        }, 100);
      } else {
        console.log('❌ No .group parent found!');
      }
    }

    // Main debugging sequence
    setTimeout(() => {
      console.group('📍 STEP 1: Finding BlockControls Elements');
      const elements = findBlockControls();
      console.log(`Found ${elements.length} potential BlockControls elements`);
      console.groupEnd();

      if (elements.length === 0) {
        console.error('❌ NO BLOCKCONTROLS FOUND IN DOM!');
        console.log('Possible reasons:');
        console.log('- Component not being rendered');
        console.log('- Conditional rendering preventing display');
        console.log('- Import/build error');
        
        // Check for Block components
        const blocks = document.querySelectorAll('[class*="group"][class*="relative"]');
        console.log(`Found ${blocks.length} Block components`);
        
        return;
      }

      // Analyze each element
      elements.forEach((el, i) => {
        console.group(`\n📍 STEP 2: Analyzing Element ${i}`);
        
        // Make it visible for debugging
        el.style.cssText += `
          border: 3px solid red !important;
          background: rgba(255, 0, 0, 0.3) !important;
          min-width: 100px !important;
          min-height: 50px !important;
        `;
        
        // Diagnose visibility
        const diagnosis = diagnoseVisibility(el, i);
        console.table(diagnosis.computedStyles);
        console.table(diagnosis.dimensions);
        
        // Check parent chain
        console.log('\n📍 Parent Chain Analysis:');
        const chain = analyzeParentChain(el);
        console.table(chain);
        
        // Test hover
        testHoverState(el, i);
        
        console.groupEnd();
      });

      // Force visibility test
      console.group('\n📍 STEP 3: Force Visibility Test');
      elements.forEach((el, i) => {
        console.log(`Forcing element ${i} visible...`);
        el.style.cssText = `
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: fixed !important;
          top: ${50 + (i * 60)}px !important;
          left: 50px !important;
          width: 200px !important;
          height: 50px !important;
          background: rgba(0, 255, 0, 0.8) !important;
          border: 3px solid yellow !important;
          z-index: 999999 !important;
          pointer-events: auto !important;
        `;
      });
      console.log('If elements appear as green boxes, they ARE in DOM but have visibility issues');
      console.groupEnd();

      // Check Tailwind classes
      console.group('\n📍 STEP 4: Tailwind CSS Check');
      const testClasses = ['opacity-0', 'opacity-100', 'scale-95', 'scale-100'];
      testClasses.forEach(className => {
        const testEl = document.createElement('div');
        testEl.className = className;
        document.body.appendChild(testEl);
        const styles = getComputedStyle(testEl);
        console.log(`${className}:`, {
          opacity: styles.opacity,
          transform: styles.transform
        });
        document.body.removeChild(testEl);
      });
      console.groupEnd();

      // Summary
      console.group('\n📊 DEBUGGING SUMMARY');
      console.log(`Total elements found: ${elements.length}`);
      console.log('Check the green/yellow boxes on screen');
      console.log('If no boxes appear, BlockControls are NOT in DOM');
      console.log('If boxes appear, the issue is CSS visibility');
      console.groupEnd();

    }, 1000); // Wait for React to render

  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'black',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 999999,
      fontSize: '12px'
    }}>
      🔍 BlockControls Debugger Active - Check Console
    </div>
  );
}