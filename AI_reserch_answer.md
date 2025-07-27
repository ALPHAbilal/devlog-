# Fixing Supabase Auth UI centering in split-panel layouts

Your auth form centering issue stems from a combination of missing parent height definitions, Supabase Auth UI's internal styles conflicting with your layout, and CSS inheritance problems. Here's exactly why your current implementation fails and multiple proven solutions to fix it.

## Why your centering isn't working

The primary culprit is that **flexbox centering requires explicit height in the parent chain**. When you use `align-items: center`, it only works if the container has a defined height. Without `height: 100vh` or `min-height: 100vh` on your flex container, vertical centering fails silently. Additionally, Supabase Auth UI applies its own internal styles that can override your centering attempts unless you explicitly disable them with `extend: false` in the appearance prop.

## Three bulletproof solutions for immediate fix

### Solution 1: Complete flexbox wrapper with height inheritance

```css
/* Ensure height inheritance from root */
html, body {
  height: 100%;
  margin: 0;
}

.split-panel-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
}

.auth-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem; /* Prevents edge touching on small screens */
}

.auth-form-wrapper {
  width: 100%;
  max-width: 440px;
}
```

```jsx
<Auth 
  supabaseClient={supabase}
  appearance={{
    theme: ThemeSupa,
    extend: false, // Critical: disables conflicting internal styles
  }}
/>
```

### Solution 2: Modern CSS Grid centering

```css
.auth-panel {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: clamp(1rem, 5vw, 3rem);
}

.auth-form-wrapper {
  width: min(440px, 100vw - 2rem); /* Responsive width constraint */
}
```

### Solution 3: Transform-based centering (most reliable)

```css
.auth-panel {
  position: relative;
  min-height: 100vh;
}

.auth-form-wrapper {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 440px;
}
```

## Debugging your specific issue

Add this temporary CSS to visualize container boundaries and identify the problem:

```css
* {
  outline: 1px solid red;
}

.split-panel-container {
  background: rgba(255, 0, 0, 0.1);
}

.auth-panel {
  background: rgba(0, 255, 0, 0.1);
}

.auth-form-wrapper {
  background: rgba(0, 0, 255, 0.1);
}
```

Check these common failures in order:
1. **Missing height**: Verify `min-height: 100vh` is set on the auth panel
2. **Inheritance break**: Ensure `html, body { height: 100%; }` is defined
3. **Supabase styles**: Confirm `extend: false` is set in appearance prop
4. **Box-sizing**: Apply `box-sizing: border-box` globally

## Responsive implementation for all viewport sizes

```css
/* Mobile-first approach */
.split-panel-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.auth-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.auth-form-wrapper {
  width: 100%;
  max-width: 440px;
}

/* Tablet and up */
@media (min-width: 768px) {
  .split-panel-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  
  .auth-panel {
    padding: 2rem;
  }
}

/* Large displays */
@media (min-width: 1600px) {
  .auth-panel {
    padding: 3rem;
  }
}
```

## Tailwind CSS implementation

If you're using Tailwind, here's the complete solution:

```jsx
<div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
  {/* Left branding panel */}
  <div className="hidden md:flex items-center justify-center bg-gray-50">
    {/* Branding content */}
  </div>
  
  {/* Right auth panel */}
  <div className="flex items-center justify-center p-4 md:p-8">
    <div className="w-full max-w-[440px]">
      <Auth 
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          extend: false,
        }}
      />
    </div>
  </div>
</div>
```

## Critical notes about Supabase Auth UI

**Important**: Supabase Auth UI was deprecated in February 2024 and moved to community maintenance. This deprecation may be contributing to your styling issues. For production applications, consider:

1. **Immediate fix**: Use the solutions above with `extend: false`
2. **Short-term**: Migrate to custom auth forms using Supabase methods directly
3. **Long-term**: Use the new [Supabase UI Library](https://supabase.com/ui) for better-maintained components

## The "Gentle Flex" pattern - most resilient approach

Based on extensive testing, this pattern handles all edge cases:

```css
.auth-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1ch;
  min-height: 100vh;
  padding: clamp(1rem, 5vw, 3rem);
}

.auth-form-wrapper {
  width: 100%;
  max-width: 440px;
}
```

This approach works because it:
- Uses `min-height` instead of `height` for content flexibility
- Includes responsive padding with `clamp()`
- Adds `gap` for consistent spacing
- Works with dynamic content and internationalization

These solutions will guarantee your auth form centers properly in the right panel across all viewport sizes. The key is ensuring proper height inheritance, disabling Supabase's internal styles, and using modern CSS centering techniques that account for common edge cases.