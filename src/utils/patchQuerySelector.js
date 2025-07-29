/**
 * Patch to catch and fix querySelector errors in production
 * This wraps the native querySelector methods to add error handling
 */

export function patchQuerySelector() {
  // Store original methods
  const originalQuerySelector = Element.prototype.querySelector;
  const originalQuerySelectorAll = Element.prototype.querySelectorAll;
  
  // Override querySelector
  Element.prototype.querySelector = function(selector) {
    try {
      return originalQuerySelector.call(this, selector);
    } catch (error) {
      console.error('querySelector error caught:', {
        selector,
        element: this,
        error: error.message
      });
      return null;
    }
  };
  
  // Override querySelectorAll
  Element.prototype.querySelectorAll = function(selector) {
    try {
      return originalQuerySelectorAll.call(this, selector);
    } catch (error) {
      console.error('querySelectorAll error caught:', {
        selector,
        element: this,
        error: error.message
      });
      return [];
    }
  };
  
  // Add warning for non-elements
  const warnIfNotElement = (obj, method) => {
    if (obj && typeof obj === 'object' && !obj.nodeType) {
      console.warn(`${method} called on non-DOM object:`, obj);
      console.trace();
    }
  };
  
  // Patch object methods that might be mistakenly called
  const patchMethod = (obj, methodName) => {
    if (obj && !obj[methodName] && !obj.nodeType) {
      obj[methodName] = function() {
        console.error(`${methodName} called on non-DOM object:`, this);
        console.trace();
        return methodName === 'querySelector' ? null : [];
      };
    }
  };
  
  // Monitor for querySelector calls on non-elements
  if (typeof Proxy !== 'undefined') {
    const handler = {
      get(target, prop) {
        if (prop === 'querySelector' || prop === 'querySelectorAll') {
          warnIfNotElement(target, prop);
        }
        return target[prop];
      }
    };
    
    // You can wrap specific objects if needed
    // Example: window.someGlobalObject = new Proxy(window.someGlobalObject, handler);
  }
  
  console.log('querySelector methods patched for error handling');
}

// Auto-patch in development
if (process.env.NODE_ENV === 'development') {
  patchQuerySelector();
}