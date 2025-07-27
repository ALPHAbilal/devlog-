# Auth Debug Console Documentation

## Overview
The Auth Debug Console is a comprehensive debugging tool for diagnosing responsive layout issues on the authentication page. It provides real-time data about viewport, grid layouts, element measurements, and CSS calculations across all device sizes.

## Features

### 1. **Real-Time Monitoring**
- Viewport dimensions (width, height, device pixel ratio)
- Active media queries
- CSS Grid track sizes and template columns
- Element measurements and positions
- CSS custom property values
- Performance metrics

### 2. **Issue Detection**
- Centering misalignments (with pixel-precise offsets)
- Overflow detection on all elements
- Grid layout application verification
- Z-index stacking context analysis

### 3. **Interactive Interface**
- Floating, draggable console
- Minimize/maximize functionality
- Export data as JSON
- Copy to clipboard
- Keyboard shortcut toggle (Ctrl+Shift+D)

## Usage

### Opening the Debug Console
- Press `Ctrl+Shift+D` to toggle the console visibility
- The console appears as a floating panel in the top-left corner

### Console Sections

#### Viewport
Shows current viewport dimensions and device pixel ratio:
- Width in pixels
- Height in pixels
- Device pixel ratio (DPR)

#### Active Media Queries
Displays all currently active media queries:
- mobile, tablet, desktop, large-desktop, ultra-wide, 4k
- Orientation (portrait/landscape)
- Special conditions (landscape-mobile)

#### Grid Layout
Shows CSS Grid information for the auth wrapper:
- Grid template columns value
- Individual track sizes
- Helps identify grid layout issues

#### Element Measurements
Expandable details for each major element:
- auth-wrapper
- branding-panel
- form-panel
- form-container
- form-wrapper
- mobile-branding
- supabase-container

Each element shows:
- Size (width × height)
- Position (relative to viewport)
- Display type
- Overflow settings

#### CSS Variables
Expandable list of all auth-specific CSS custom properties:
- Typography scale (--auth-text-*)
- Spacing scale (--auth-space-*)
- Container widths (--auth-form-width-*)

#### Detected Issues
Automatically highlights problems:
- Centering misalignments (with exact pixel offsets)
- Grid layout not applied when expected
- Other layout anomalies

#### Overflow Detection
Lists any elements with content overflow:
- Element selector/class
- Scroll dimensions vs client dimensions

#### Performance
Shows debug console update performance:
- Update time in milliseconds

### Exporting Data

#### Export as JSON
1. Click the download icon in the console header
2. File will be saved as `auth-debug-[timestamp].json`
3. Contains all debug data plus metadata:
   - Timestamp
   - User agent
   - Screen information
   - Full debug snapshot

#### Copy to Clipboard
1. Click the copy icon in the console header
2. Full JSON data copied to clipboard
3. Can be pasted into bug reports or shared with team

### Dragging the Console
- Click and drag the header to reposition
- Console remembers position during session

## Debug Data Structure

```json
{
  "viewport": {
    "width": 1920,
    "height": 1080,
    "dpr": 1
  },
  "grid": {
    "columns": "1fr 640px",
    "tracks": ["1fr", "640px"]
  },
  "elements": {
    "auth-wrapper": {
      "width": 1920,
      "height": 1080,
      "display": "grid",
      "position": "relative"
    }
  },
  "cssVars": {
    "--auth-text-base": "1rem",
    "--auth-space-lg": "1rem"
  },
  "mediaQueries": [
    { "name": "desktop", "query": "(min-width: 1024px)", "active": true }
  ],
  "issues": [],
  "overflows": [],
  "performance": {
    "renderTime": 12.5
  },
  "timestamp": "2024-01-27T10:30:00.000Z",
  "userAgent": "Mozilla/5.0..."
}
```

## Troubleshooting Common Issues

### Issue: Centering Misalignment
**Detection**: Shows "Horizontal/Vertical centering off by Xpx"
**Solution**: Check parent container display properties and child margins

### Issue: Grid Not Applied
**Detection**: "Grid layout not applied on desktop"
**Solution**: Verify media query breakpoints and grid CSS properties

### Issue: Overflow Detected
**Detection**: Lists elements with scrollWidth > clientWidth
**Solution**: Check element sizing, padding, and box-sizing properties

## Best Practices

1. **Regular Monitoring**: Keep console open while testing responsive behavior
2. **Export Before/After**: Export data before and after fixes to compare
3. **Share Debug Data**: Include exported JSON when reporting issues
4. **Check All Breakpoints**: Test at key viewport widths:
   - 320px (mobile min)
   - 768px (tablet)
   - 1024px (desktop)
   - 1440px (large desktop)
   - 1920px (full HD)
   - 2560px (4K)

## Performance Considerations

- Console updates every second when visible
- Minimal performance impact (~10-15ms update time)
- Automatically pauses when minimized
- No impact when hidden

## Mobile Usage

- Touch-friendly controls
- Responsive sizing for small viewports
- Swipe to scroll content
- Larger tap targets on touch devices

## Keyboard Shortcuts

- `Ctrl+Shift+D`: Toggle console visibility
- `Escape`: Close console (when focused)

## Future Enhancements

- [ ] Record and replay layout changes
- [ ] Visual element highlighting
- [ ] Network condition simulation
- [ ] Automated issue fixing suggestions
- [ ] Integration with browser DevTools