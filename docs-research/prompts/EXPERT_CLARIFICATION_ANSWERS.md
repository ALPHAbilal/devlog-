# Answers to Expert's Clarification Questions

Thank you for the thorough questions! Here are the details:

## 1. Environment Differences

We haven't explicitly tested all scenarios yet. What we know:
- **Production on Vercel**: BlockControls DON'T appear on hover ❌
- **Local development** (`npm run dev`): Need to verify
- **Local production build** (`npm run build && npm run preview`): Haven't tested yet - this is an excellent suggestion!

## 2. Tailwind JIT Configuration

Looking at our `tailwind.config.js`:
- We ARE using Tailwind's default mode (JIT is enabled by default in Tailwind 3+)
- We have a `safelist` array but it doesn't include the critical classes:
  ```js
  safelist: [
    'hidden',
    'md:flex', 
    'md:hidden',
    'md:block',
    'min-h-[44px]',
    'min-w-[44px]',
    'p-3',
  ]
  ```
- **CRITICAL**: The negative positioning classes like `-left-2` are NOT in the safelist!
- We haven't checked build logs for purging warnings yet

## 3. Build Configuration Details

### Vite Config:
```js
build: {
  sourcemap: true, // Only this is set
}
```
- No specific CSS optimization settings
- Using Sentry plugin which might affect build

### Package.json scripts to check:
We should run:
```bash
npm run build
npm run preview
```
And see if the issue reproduces locally.

## 4. Additional Context from Our Investigation

### CSS Classes Being Used:
- Parent: `group block-wrapper relative transition-all duration-200`
- BlockControls: `block-controls absolute -left-2 top-1 flex items-start gap-1`

### Critical Observation:
In debug mode, the controls appear RIGHT NEXT to the block content, not offset left. This strongly suggests the `-left-2` class is being purged or not applied correctly in production.

## Immediate Action Items:

1. **Test local production build**:
   ```bash
   npm run build && npm run preview
   ```
   Check if hover works in local production build

2. **Add critical classes to safelist**:
   ```js
   safelist: [
     // ... existing entries
     '-left-2',
     'top-1',
     'absolute',
     'group-hover:opacity-100',
     'opacity-0',
     'pointer-events-none',
     'group-hover:pointer-events-auto'
   ]
   ```

3. **Check build output** for any CSS purging warnings

Would you like us to perform these tests first, or do you have enough information to proceed with your research?