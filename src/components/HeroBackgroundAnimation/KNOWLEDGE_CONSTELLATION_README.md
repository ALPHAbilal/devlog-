# Knowledge Constellation Animation

A sophisticated GSAP-powered hero background animation that visualizes Devlog's core concept: "Your Second Brain for Code" through an interactive constellation of knowledge nodes.

## Features

### Core Animation
- **Knowledge Nodes**: 8 different types representing various forms of developer knowledge
  - Code snippets (blue)
  - AI conversations (purple) 
  - Documentation (green)
  - Error solutions (red)
  - Solutions/insights (orange)
  - Version control (cyan)
  - Tags (gray)
  - Database/data structures (violet)

### Interactive Features
1. **Cursor Interactions**
   - Gravitational effect: Nodes are attracted to cursor at medium range
   - Repulsion effect: Nodes move away at close range
   - Hover preview: Shows content preview when hovering over nodes

2. **Click & Drag Interactions**
   - Click nodes to select them
   - Click and drag to draw temporary connections
   - Select multiple nodes to create permanent connections
   - Ripple effects on click

3. **Animation Phases**
   - **Chaos**: Initial scattered state
   - **Discovery**: Nodes begin grouping by type
   - **Organization**: Final constellation pattern

### Performance Optimizations
- Canvas-based rendering for optimal performance
- GPU acceleration with transform3d
- Responsive particle count based on device
- Reduced motion support
- Mobile-specific optimizations

## Usage

```jsx
import KnowledgeConstellation from './components/HeroBackgroundAnimation/KnowledgeConstellation';

function HeroSection() {
  return (
    <div className="hero-container">
      <KnowledgeConstellation />
      {/* Your hero content */}
    </div>
  );
}
```

## Customization

### Adjusting Node Count
The component automatically adjusts node count based on device:
- Desktop: 40 nodes
- Tablet: 30 nodes  
- Mobile: 20 nodes

### Modifying Knowledge Types
Edit the `KNOWLEDGE_TYPES` array in the component to add/remove node types.

### Animation Timing
Adjust the timeline durations in the GSAP context setup to change animation pacing.

## Browser Support
- Modern browsers with Canvas API support
- Requires GSAP (loaded via CDN in index.html)
- Gracefully degrades with prefers-reduced-motion

## Performance Notes
- Uses requestAnimationFrame for smooth 60fps animation
- Implements visibility detection to pause when off-screen
- Optimized for mobile with reduced effects