/**
 * Safe DOM query helpers to prevent querySelector errors
 */

/**
 * Safely query selector on an element
 * @param {any} element - The element to query (might not be a DOM element)
 * @param {string} selector - The CSS selector
 * @returns {Element|null} The found element or null
 */
export function safeQuerySelector(element, selector) {
  if (!element || typeof element.querySelector !== 'function') {
    console.warn('safeQuerySelector: Invalid element provided', element);
    return null;
  }
  
  try {
    return element.querySelector(selector);
  } catch (error) {
    console.error('safeQuerySelector: Error querying selector', { selector, error });
    return null;
  }
}

/**
 * Safely query selector all on an element
 * @param {any} element - The element to query
 * @param {string} selector - The CSS selector
 * @returns {NodeList|Array} The found elements or empty array
 */
export function safeQuerySelectorAll(element, selector) {
  if (!element || typeof element.querySelectorAll !== 'function') {
    console.warn('safeQuerySelectorAll: Invalid element provided', element);
    return [];
  }
  
  try {
    return element.querySelectorAll(selector);
  } catch (error) {
    console.error('safeQuerySelectorAll: Error querying selector', { selector, error });
    return [];
  }
}

/**
 * Check if an object is a DOM element
 * @param {any} obj - The object to check
 * @returns {boolean} True if it's a DOM element
 */
export function isDOMElement(obj) {
  return obj instanceof Element || obj instanceof HTMLDocument;
}

/**
 * Get DOM element from event
 * @param {Event} event - The event object
 * @param {string} property - 'target' or 'currentTarget'
 * @returns {Element|null} The DOM element or null
 */
export function getElementFromEvent(event, property = 'currentTarget') {
  if (!event || !event[property]) {
    return null;
  }
  
  const element = event[property];
  return isDOMElement(element) ? element : null;
}

/**
 * Safe focus with error handling
 * @param {string} selector - The CSS selector
 * @param {Element} context - The context element (default: document)
 */
export function safeFocus(selector, context = document) {
  const element = safeQuerySelector(context, selector);
  if (element && typeof element.focus === 'function') {
    try {
      element.focus();
    } catch (error) {
      console.warn('safeFocus: Unable to focus element', { selector, error });
    }
  }
}