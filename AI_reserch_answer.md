# Comprehensive debugging methodology for invisible React BlockControls component

## Quick diagnostic checklist

Before diving deep, run these commands in your browser console to quickly identify the most common issues:

```javascript
// 1. Check if element exists in DOM
const elements = document.querySelectorAll('[class*="absolute"][class*="left"]');
console.log('Found elements:', elements.length, elements);

// 2. Force visibility on all potential BlockControls
Array.from(elements).forEach(el => {
  el.style.cssText = 'display: block !important; visibility: visible !important; opacity: 1 !important; background: red !important; min-width: 100px !important; min-height: 50px !important; z-index: 9999 !important;';
});

// 3. Check computed styles of selected element
if ($0) {
  const styles = getComputedStyle($0);
  console.table({
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity,
    width: $0.offsetWidth,
    height: $0.offsetHeight,
    position: styles.position,
    zIndex: styles.zIndex
  });
}
```

## Step 1: Component rendering verification

### Verify DOM presence
```javascript
// Comprehensive element finder
function findBlockControls() {
  const strategies = [
    // By class patterns
    () => document.querySelectorAll('[class*="absolute"][class*="left"][class*="top"]'),
    () => document.querySelectorAll('[class*="opacity-0"], [class*="opacity-100"]'),
    () => document.querySelectorAll('[class*="scale-95"], [class*="scale-100"]'),
    // By style attributes
    () => document.querySelectorAll('[style*="z-index: 20"]'),
    () => document.querySelectorAll('[style*="pointer-events"]'),
    // By position
    () => Array.from(document.querySelectorAll('*')).filter(el => {
      const styles = getComputedStyle(el);
      return styles.position === 'absolute' && styles.left === '-0.5rem';
    })
  ];
  
  const results = new Set();
  strategies.forEach((strategy, i) => {
    const found = strategy();
    console.log(`Strategy ${i} found:`, found.length);
    found.forEach(el => results.add(el));
  });
  
  return Array.from(results);
}

const blockControls = findBlockControls();
console.log('Total potential BlockControls found:', blockControls.length);
blockControls.forEach((el, i) => {
  console.log(`Element ${i}:`, el);
  el.style.border = '3px solid lime';
});
```

### React component verification
```javascript
// Find React fiber information
function findReactComponent(element) {
  const key = Object.keys(element).find(key => 
    key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$')
  );
  
  if (!key) return null;
  
  const fiber = element[key];
  let current = fiber;
  
  // Walk up to find the actual component
  while (current && typeof current.type === 'string') {
    current = current.return;
  }
  
  return current ? {
    name: current.type?.name || 'Unknown',
    props: current.memoizedProps,
    state: current.memoizedState,
    hooks: current.memoizedState
  } : null;
}

// Apply to found elements
blockControls.forEach((el, i) => {
  const component = findReactComponent(el);
  console.log(`React component ${i}:`, component);
});
```

## Step 2: CSS cascade and visibility debugging

### Complete visibility diagnostic
```javascript
function diagnoseVisibility(element) {
  if (!element) element = $0;
  
  const rect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);
  const parent = element.parentElement;
  const parentStyles = parent ? getComputedStyle(parent) : null;
  
  const diagnosis = {
    element: element.tagName + '.' + element.className,
    
    // Visibility blockers
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
    
    // Actual values
    computedStyles: {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      position: styles.position,
      zIndex: styles.zIndex,
      transform: styles.transform,
      transition: styles.transition,
      pointerEvents: styles.pointerEvents
    },
    
    // Dimensions
    dimensions: {
      boundingRect: rect,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight,
      clientWidth: element.clientWidth,
      clientHeight: element.clientHeight
    },
    
    // Tailwind classes check
    tailwindClasses: {
      hasOpacityClasses: element.className.includes('opacity-'),
      hasScaleClasses: element.className.includes('scale-'),
      hasTransitionClasses: element.className.includes('transition')
    }
  };
  
  // Summary
  const issues = Object.entries(diagnosis.invisibilityReasons)
    .filter(([, value]) => value)
    .map(([key]) => key);
  
  console.log('🔍 Visibility Diagnosis:', diagnosis);
  console.log('❌ Issues found:', issues);
  
  return diagnosis;
}

// Run diagnosis
blockControls.forEach((el, i) => {
  console.log(`\n--- Diagnosing element ${i} ---`);
  diagnoseVisibility(el);
});
```

### Parent chain analysis
```javascript
function analyzeParentChain(element) {
  const chain = [];
  let current = element;
  
  while (current && current !== document.body) {
    const styles = getComputedStyle(current);
    const rect = current.getBoundingClientRect();
    
    chain.push({
      element: current,
      tag: current.tagName,
      classes: current.className,
      visibility: {
        display: styles.display,
        visibility: styles.visibility,
        opacity: styles.opacity,
        overflow: styles.overflow
      },
      dimensions: {
        width: rect.width,
        height: rect.height
      },
      positioning: {
        position: styles.position,
        zIndex: styles.zIndex
      },
      hasGroupClass: current.className.includes('group')
    });
    
    current = current.parentElement;
  }
  
  console.table(chain);
  return chain;
}
```

## Step 3: JavaScript state and hooks debugging

### useHover hook verification
```javascript
// Test hover state changes
function debugHoverState(element) {
  if (!element) element = $0;
  
  console.log('🎯 Testing hover detection...');
  
  // Check current event listeners
  const listeners = getEventListeners(element);
  console.log('Event listeners:', listeners);
  
  // Monitor all mouse events
  const events = ['mouseenter', 'mouseleave', 'mouseover', 'mouseout'];
  events.forEach(event => {
    element.addEventListener(event, (e) => {
      console.log(`🖱️ ${event} fired on`, e.target);
    });
  });
  
  // Test manual hover trigger
  setTimeout(() => {
    console.log('📍 Triggering manual mouseenter...');
    element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  }, 1000);
  
  setTimeout(() => {
    console.log('📍 Triggering manual mouseleave...');
    element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
  }, 2000);
  
  // Check if parent has .group class
  const parent = element.closest('.group');
  if (parent) {
    console.log('✅ Found .group parent:', parent);
    monitorEvents(parent, 'mouse');
  } else {
    console.log('❌ No .group parent found');
  }
}

// Run hover debugging
blockControls.forEach((el, i) => {
  console.log(`\n--- Debugging hover for element ${i} ---`);
  debugHoverState(el);
});
```

### React hooks state inspection
```javascript
// Inspect React component state and hooks
function inspectReactHooks(element) {
  const fiber = element._reactFiber || 
                element.__reactFiber$ || 
                element.__reactInternalInstance;
                
  if (!fiber) {
    console.log('❌ No React fiber found');
    return;
  }
  
  let hookState = fiber.memoizedState;
  const hooks = [];
  let hookIndex = 0;
  
  while (hookState) {
    hooks.push({
      index: hookIndex++,
      value: hookState.memoizedState,
      deps: hookState.deps,
      next: hookState.next ? 'has next' : 'last hook'
    });
    hookState = hookState.next;
  }
  
  console.table(hooks);
  
  // Check for hover state (usually first or second hook)
  const possibleHoverState = hooks.find(h => 
    typeof h.value === 'boolean' || 
    (Array.isArray(h.value) && h.value.length === 2)
  );
  
  console.log('Possible hover state:', possibleHoverState);
}
```

## Step 4: Production-specific issues

### Check for Tailwind CSS purging
```javascript
// Verify Tailwind classes exist in production
function checkTailwindClasses() {
  const testClasses = [
    'opacity-0', 'opacity-100',
    'scale-95', 'scale-100',
    'transition-all', 'duration-200',
    'pointer-events-none', 'pointer-events-auto'
  ];
  
  const results = {};
  
  testClasses.forEach(className => {
    const testEl = document.createElement('div');
    testEl.className = className;
    document.body.appendChild(testEl);
    
    const styles = getComputedStyle(testEl);
    results[className] = {
      exists: styles.cssText.length > 0,
      opacity: styles.opacity,
      transform: styles.transform,
      transition: styles.transition
    };
    
    document.body.removeChild(testEl);
  });
  
  console.table(results);
  
  // Check if opacity transition classes work
  const transitionTest = document.createElement('div');
  transitionTest.className = 'transition-all duration-200 opacity-0';
  document.body.appendChild(transitionTest);
  
  setTimeout(() => {
    transitionTest.className = 'transition-all duration-200 opacity-100';
    console.log('Opacity after class change:', getComputedStyle(transitionTest).opacity);
    document.body.removeChild(transitionTest);
  }, 100);
}

checkTailwindClasses();
```

### Detect build/compilation issues
```javascript
// Check if custom hooks are available
function verifyProductionBuild() {
  const checks = {
    reactVersion: React?.version || 'React not found',
    nodeEnv: process?.env?.NODE_ENV || 'Unknown',
    customHooks: {
      useHover: typeof window.useHover,
      // Add other custom hooks
    },
    hasSourceMaps: new Error().stack.includes('.js:'),
    documentReady: document.readyState
  };
  
  console.table(checks);
  
  // Check for common production optimizations
  if (checks.nodeEnv === 'production') {
    console.log('⚠️ Running in production mode - some debug features may be disabled');
  }
}

verifyProductionBuild();
```

## Step 5: Advanced diagnostic techniques

### Complete element analysis function
```javascript
function completeElementAnalysis(element) {
  if (!element) element = $0;
  
  console.group('🔍 Complete Element Analysis');
  
  // 1. Basic visibility
  const rect = element.getBoundingClientRect();
  const styles = getComputedStyle(element);
  
  console.log('1️⃣ Visibility State:', {
    isVisible: rect.width > 0 && rect.height > 0 && styles.opacity > 0,
    display: styles.display,
    visibility: styles.visibility,
    opacity: styles.opacity
  });
  
  // 2. Positioning
  console.log('2️⃣ Positioning:', {
    position: styles.position,
    coordinates: { top: rect.top, left: rect.left },
    dimensions: { width: rect.width, height: rect.height },
    zIndex: styles.zIndex,
    transform: styles.transform
  });
  
  // 3. Interaction
  const elementAtCenter = document.elementFromPoint(
    rect.left + rect.width/2,
    rect.top + rect.height/2
  );
  
  console.log('3️⃣ Interaction:', {
    pointerEvents: styles.pointerEvents,
    isClickable: elementAtCenter === element,
    elementAtCenter: elementAtCenter
  });
  
  // 4. Transitions
  console.log('4️⃣ Transitions:', {
    transition: styles.transition,
    animationDuration: styles.animationDuration,
    transitionDuration: styles.transitionDuration
  });
  
  // 5. Classes and attributes
  console.log('5️⃣ Classes:', {
    classList: Array.from(element.classList),
    dataset: element.dataset,
    attributes: Array.from(element.attributes).map(a => ({
      name: a.name,
      value: a.value
    }))
  });
  
  // 6. React component
  const reactComponent = findReactComponent(element);
  if (reactComponent) {
    console.log('6️⃣ React Component:', reactComponent);
  }
  
  // 7. Parent analysis
  const parentChain = [];
  let parent = element.parentElement;
  while (parent && parentChain.length < 5) {
    parentChain.push({
      tag: parent.tagName,
      classes: parent.className,
      hasGroup: parent.className.includes('group')
    });
    parent = parent.parentElement;
  }
  console.log('7️⃣ Parent Chain:', parentChain);
  
  console.groupEnd();
}
```

### Force visibility with all overrides
```javascript
function forceElementVisible(element) {
  if (!element) element = $0;
  
  // Nuclear option - override everything
  const overrides = `
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    position: fixed !important;
    top: 50px !important;
    left: 50px !important;
    width: 200px !important;
    height: 100px !important;
    background: rgba(255, 0, 0, 0.8) !important;
    border: 3px solid yellow !important;
    z-index: 999999 !important;
    pointer-events: auto !important;
    transform: none !important;
    clip: auto !important;
    clip-path: none !important;
    overflow: visible !important;
  `;
  
  element.style.cssText = overrides;
  
  console.log('🚨 Element forced visible with overrides');
  console.log('If element still not visible, it may not be in DOM');
}
```

## Step 6: Systematic debugging process

### The definitive debugging sequence

```javascript
async function systematicDebug() {
  console.clear();
  console.log('🔧 Starting systematic BlockControls debugging...\n');
  
  // Step 1: Find all potential elements
  console.group('STEP 1: Element Discovery');
  const elements = findBlockControls();
  console.log(`Found ${elements.length} potential BlockControls`);
  console.groupEnd();
  
  if (elements.length === 0) {
    console.error('❌ No BlockControls elements found in DOM');
    console.log('Possible reasons:');
    console.log('- Component not rendered');
    console.log('- Conditional rendering always false');
    console.log('- Build/compilation error');
    return;
  }
  
  // Step 2: Analyze each element
  for (let i = 0; i < elements.length; i++) {
    console.group(`\nSTEP 2: Analyzing Element ${i}`);
    const el = elements[i];
    
    // Make it visible for testing
    el.style.border = '2px dashed red';
    
    // Run diagnostics
    const diagnosis = diagnoseVisibility(el);
    const issues = Object.entries(diagnosis.invisibilityReasons)
      .filter(([, value]) => value)
      .map(([key]) => key);
    
    if (issues.length > 0) {
      console.warn('Issues found:', issues);
      
      // Try to fix each issue
      if (issues.includes('opacityZero')) {
        console.log('🔧 Fixing opacity...');
        el.style.opacity = '1';
      }
      
      if (issues.includes('displayNone')) {
        console.log('🔧 Fixing display...');
        el.style.display = 'block';
      }
      
      if (issues.includes('pointerEventsNone')) {
        console.log('🔧 Fixing pointer events...');
        el.style.pointerEvents = 'auto';
      }
    }
    
    console.groupEnd();
  }
  
  // Step 3: Test hover functionality
  console.group('\nSTEP 3: Testing Hover Functionality');
  elements.forEach((el, i) => {
    debugHoverState(el);
  });
  console.groupEnd();
  
  // Step 4: Check production-specific issues
  console.group('\nSTEP 4: Production Build Checks');
  verifyProductionBuild();
  checkTailwindClasses();
  console.groupEnd();
  
  console.log('\n✅ Debugging complete. Check findings above.');
}

// Run the complete debug sequence
systematicDebug();
```

## Common issue resolutions

Based on the debugging results, here are the most common fixes:

### 1. Opacity stuck at 0
```javascript
// Add to your component temporarily
useEffect(() => {
  if (ref.current) {
    // Force opacity after mount
    setTimeout(() => {
      ref.current.style.opacity = '1';
      console.log('Forced opacity to 1');
    }, 100);
  }
}, [ref]);
```

### 2. Parent .group class missing
```javascript
// Add .group class to parent programmatically
useEffect(() => {
  if (ref.current) {
    const parent = ref.current.parentElement;
    if (parent && !parent.classList.contains('group')) {
      parent.classList.add('group');
      console.log('Added .group class to parent');
    }
  }
}, [ref]);
```

### 3. Hover events not firing
```javascript
// Use callback ref to ensure proper attachment
const callbackRef = useCallback(node => {
  if (node) {
    console.log('Ref attached to:', node);
    // Attach listeners directly
    node.addEventListener('mouseenter', () => setIsHovered(true));
    node.addEventListener('mouseleave', () => setIsHovered(false));
  }
}, []);
```

### 4. Z-index stacking issues
```javascript
// Check stacking context
function fixStackingContext(element) {
  let parent = element.parentElement;
  while (parent) {
    const styles = getComputedStyle(parent);
    if (styles.zIndex !== 'auto' || styles.position !== 'static') {
      console.log('Found stacking context:', parent);
      parent.style.zIndex = '1';
    }
    parent = parent.parentElement;
  }
}
```

This comprehensive debugging methodology should help you identify exactly why your BlockControls component isn't appearing. Start with the quick diagnostic checklist, then work through the systematic debugging process if needed. The key is to eliminate possibilities one by one until you find the root cause.