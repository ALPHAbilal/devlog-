// Debug helper to check block rendering
export function debugBlocks() {
  console.log('🔍 Block Animation Debug');
  
  // Check if blocks are generated
  const container = document.querySelector('.hero-background-animation');
  console.log('Container found:', !!container);
  
  if (container) {
    console.log('Container styles:', {
      '--mouse-x': container.style.getPropertyValue('--mouse-x'),
      '--mouse-y': container.style.getPropertyValue('--mouse-y'),
      position: getComputedStyle(container).position,
      overflow: getComputedStyle(container).overflow,
      pointerEvents: getComputedStyle(container).pointerEvents,
    });
  }
  
  // Check blocks
  const blocks = document.querySelectorAll('.hero-block');
  console.log('Blocks found:', blocks.length);
  
  if (blocks.length > 0) {
    const firstBlock = blocks[0];
    console.log('First block:', {
      className: firstBlock.className,
      position: getComputedStyle(firstBlock).position,
      opacity: getComputedStyle(firstBlock).opacity,
      transform: getComputedStyle(firstBlock).transform,
      left: getComputedStyle(firstBlock).left,
      top: getComputedStyle(firstBlock).top,
      width: getComputedStyle(firstBlock).width,
      height: getComputedStyle(firstBlock).height,
    });
    
    // Check block content
    const content = firstBlock.querySelector('.hero-block__content');
    if (content) {
      console.log('Block content:', {
        display: getComputedStyle(content).display,
        background: getComputedStyle(content).background,
        opacity: getComputedStyle(content).opacity,
      });
    }
  }
  
  // Check CSS file loading
  const stylesheets = Array.from(document.styleSheets);
  const heroCSS = stylesheets.find(sheet => 
    sheet.href && sheet.href.includes('hero-background-animation.css')
  );
  console.log('Hero CSS loaded:', !!heroCSS);
  
  // Check for any errors
  console.log('Checking for common issues...');
  
  if (!container) {
    console.error('❌ Container not found');
  }
  
  if (blocks.length === 0) {
    console.error('❌ No blocks rendered');
    console.log('Possible causes:');
    console.log('- generateBlocks() not called');
    console.log('- AnimatePresence not rendering');
    console.log('- isVisible state is false');
    console.log('- prefersReducedMotion is true');
  }
  
  // Check motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log('Prefers reduced motion:', prefersReducedMotion);
}