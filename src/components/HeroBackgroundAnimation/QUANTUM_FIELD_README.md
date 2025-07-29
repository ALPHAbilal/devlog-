# Quantum Documentation Field Animation

## Overview
The Quantum Documentation Field is a premium GSAP-powered animation that creates an interactive particle field where documentation "atoms" collide, merge, and respond to user interaction.

## Features
- **Interactive Particles**: Documentation atoms that respond to cursor movement
- **Particle Types**: Different visual representations for code, text, AI conversations, headings, todos, and version tracking
- **Physics Simulation**: Realistic particle movement with attraction, repulsion, and collision detection
- **Merge Effects**: Same-type particles can merge with ripple animations
- **Metadata Display**: Particles reveal their type when cursor approaches
- **Performance Optimized**: Automatic device detection and particle count adjustment
- **Accessibility**: Respects prefers-reduced-motion setting

## Implementation Details

### GSAP Integration
GSAP is loaded via CDN in `index.html`:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/CustomEase.min.js"></script>
```

### Component Structure
- `QuantumDocumentationField.jsx` - Main component with physics simulation
- `gsapOptimizations.js` - Performance optimization utilities
- `hero-quantum-field.css` - Styling for particles and effects

### Performance Optimizations
1. **Device Detection**: Automatically adjusts particle count based on device capabilities
2. **GPU Acceleration**: Forces 3D transforms for smooth animation
3. **Reduced Motion**: Completely disables animation for accessibility
4. **Mobile Optimization**: Reduced effects and particle count on mobile devices
5. **Intersection Observer**: Only animates when visible

### Particle Counts by Device
- High-end Desktop: 30 particles
- Mid-range Desktop: 20 particles  
- Low-end/Mobile: 10-12 particles
- Reduced Data Mode: 15 particles

## Customization

### Particle Types
Edit the `PARTICLE_TYPES` object in `QuantumDocumentationField.jsx` to modify particle appearance:
```javascript
code: {
  color: '#3b82f6',
  glow: 'rgba(59, 130, 246, 0.4)',
  icon: '</>',
  metadata: 'Code Block',
  size: { min: 40, max: 60 }
}
```

### Physics Parameters
Adjust these values in the animation loop:
- `mouseRadius`: 150 - Range of cursor influence
- `attractionStrength`: 0.15 - How strongly particles are attracted to cursor
- `repulsionStrength`: 0.8 - How strongly particles repel each other

### Visual Effects
Modify CSS variables in `hero-quantum-field.css` for different visual styles.

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Mobile Considerations
- Reduced particle count
- Simplified effects
- No shimmer animations
- Touch-friendly interactions

## Future Enhancements
- WebGL renderer for even better performance
- More particle types
- Custom merge animations
- Particle trails
- Sound effects (optional)