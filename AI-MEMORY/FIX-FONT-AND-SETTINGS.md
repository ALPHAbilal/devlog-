# Fix: Font Consistency Across Blocks + Display Settings Persistence

**Created**: 2025-03-04
**Priority**: HIGH
**Status**: TODO

---

## Problem 1: Inconsistent Font Across Block Types

### Root Cause
The typography system defines `--step-writing` (user-configurable font size) and `--line-height-writing` (user-configurable line height) in `src/styles/typography.css`, and users can customize these via Settings > Display. However, **only 2 out of 8 content blocks** actually use these CSS variables. The rest use hardcoded Tailwind classes, making the user's font-size/line-height settings effectively broken for most blocks.

### Current State Per Block

| Block | Font Size Source | Uses `--step-writing`? | Uses `--line-height-writing`? | Font Family |
|-------|-----------------|----------------------|------------------------------|-------------|
| **TextBlock** (TipTap) | `tiptap.css` → `var(--step-writing, 0.9375rem)` | ✅ Yes | ✅ Yes | ✅ `var(--font-sans)` via CSS |
| **AIBlockRefined** | Inline style `fontSize: 'var(--step-writing)'` | ✅ Yes | ✅ Yes | ✅ `font-sans` class |
| **HeadingBlock** | `var(--step-2/3/4)` — correct, headings use step scale | N/A (headings) | N/A | ✅ Inherits |
| **CodeBlock** | `text-sm font-mono` hardcoded (14px) | ❌ No | ❌ No | ✅ `font-mono` (correct) |
| **TodoBlock** | `text-lg` title, `text-sm`/`text-xs` items hardcoded | ❌ No | ❌ No | ❌ Inherits only |
| **TableBlock** | No explicit size (inherits body `--step-0` = 16-18px) | ❌ No | ❌ No | ❌ Inherits only |
| **FileTreeBlock** | `text-sm font-mono` hardcoded (14px) | ❌ No | ❌ No | ✅ `font-mono` (correct) |
| **ImageBlock** | `font-medium` only on caption | ❌ No | ❌ No | ❌ Inherits only |
| **InlineImageBlock** | No font styles | ❌ No | ❌ No | ❌ Inherits only |
| **OptimizedIssueTrackerBlock** | `text-sm`/`text-xs` hardcoded | ❌ No | ❌ No | ❌ Inherits only |

### Fix Plan

#### A. Blocks That SHOULD Use `--step-writing` (content/reading blocks)
These blocks contain user-written prose/content that should respect the user's font size:

**1. TodoBlock** (`src/components/blocks/TodoBlock.jsx`)
- Task name input/display: Replace `text-sm` → add inline style `fontSize: 'var(--step-writing)'`
- Task name in display mode (line ~382): Same treatment
- Keep `text-xs` on metadata labels (Status, Priority, Due Date headers) — those are UI chrome, not content

**2. TableBlock** (`src/components/blocks/TableBlock.jsx`)
- Cell content (the markdown-rendered cells): Add inline style `fontSize: 'var(--step-writing)', lineHeight: 'var(--line-height-writing)'`
- Keep `text-xs` on column action buttons and footer — those are UI elements
- The cell input (line ~717): Add `style={{ fontSize: 'var(--step-writing)' }}`

**3. OptimizedIssueTrackerBlock** (`src/components/blocks/OptimizedIssueTrackerBlock.jsx`)
- Issue title display: Add inline style `fontSize: 'var(--step-writing)'`
- Keep `text-sm`/`text-xs` on metadata (counts, labels)

**4. ImageBlock** (`src/components/blocks/ImageBlock.jsx`)
- Caption text: Add `style={{ fontSize: 'var(--step-writing)' }}`

**5. InlineImageBlock** (`src/components/blocks/InlineImageBlock.jsx`)
- Caption text if any: Same treatment

#### B. Blocks That Should KEEP Hardcoded Sizes (correct as-is)
- **CodeBlock**: `font-mono text-sm` is standard for code — code should be monospace and slightly smaller. ✅ Keep.
- **FileTreeBlock**: `font-mono text-sm` is correct for file paths — monospace smaller text. ✅ Keep.
- **HeadingBlock**: Uses `--step-2/3/4` scale which is the correct heading scale. ✅ Keep.

#### C. Add Explicit `font-sans` to Content Blocks Missing It
Add `font-sans` class (which maps to Inter) to these blocks' main content containers:
- TodoBlock task content wrapper
- TableBlock cell content area
- OptimizedIssueTrackerBlock content area
- ImageBlock/InlineImageBlock caption

This prevents font inheritance issues if a block is nested differently.

---

## Problem 2: Display Settings Don't Persist After Hard Refresh

### Root Cause (Multiple Issues)

**Bug 1: Settings Page passes 2 args, provider expects 3**
- `src/pages/SettingsClaude.jsx` line ~210 calls:
  ```js
  applyDisplaySettings(localDisplaySettings.fontSize, localDisplaySettings.lineHeight)
  ```
- But `src/app/providers/settings-provider.tsx` line ~183 expects:
  ```ts
  applyDisplaySettings(fontSize: number, lineHeight: number, blockSpacing: string)
  ```
- The `blockSpacing` param is `undefined`, so `--block-gap` gets set to `'16px'` (default fallback), and `displayBlockSpacing` is never saved to localStorage/Supabase.

**Bug 2: `applyDisplaySettings` is NOT called on load from localStorage**
- The localStorage `useEffect` (line ~48) calls `setSettings(prev => ({ ...prev, ...parsed }))` which updates state.
- The `applyDisplaySettings` effect (line ~198) does fire when `settings.displayFontSize` changes.
- **BUT**: There's a race condition. The localStorage effect runs, sets state. Then the Supabase effect runs and may overwrite with stale/missing data if the profile doesn't have `displayFontSize` saved (because of Bug 1 — blockSpacing wasn't included, so the save may have been partial or the structure was wrong).

**Bug 3: Supabase `update` only saves to profiles if user exists, but doesn't handle first-time save**
- If the user has never saved settings before, `profiles.settings` column is `null`.
- The `update` call works fine, but the **initial load** from Supabase returns `null` for `profile.settings`, so the localStorage values get overwritten by defaults on the next render cycle.
- Flow: localStorage loads saved settings → Supabase loads `null` → settings state gets reset to defaults → CSS variables get default values.

**Bug 4: Supabase load overwrites localStorage settings without merge**
- Line ~99: `setSettings(prev => ({ ...prev, ...profileSettings }))` — this spreads profile settings over previous state. If `profileSettings` from Supabase doesn't contain `displayFontSize` (because it was never saved to Supabase properly), the defaults from the initial state remain, which is correct.
- BUT: Line ~101: `localStorage.setItem('devlogSettings', JSON.stringify(profileSettings))` — this **overwrites** localStorage with ONLY what Supabase returned, which may be missing display settings. On next hard refresh, localStorage now has incomplete data.

### Fix Plan

**Fix 1: Settings page — pass all 3 args to `applyDisplaySettings`**

File: `src/pages/SettingsClaude.jsx` (~line 210)
```js
// BEFORE (broken):
applyDisplaySettings(
  localDisplaySettings.fontSize,
  localDisplaySettings.lineHeight
);

// AFTER (fixed):
applyDisplaySettings(
  localDisplaySettings.fontSize,
  localDisplaySettings.lineHeight,
  settings.displayBlockSpacing || 'normal'
);
```

Also update the `updateSettings` call to include blockSpacing:
```js
updateSettings({
  displayFontSize: localDisplaySettings.fontSize,
  displayLineHeight: localDisplaySettings.lineHeight,
  displayBlockSpacing: settings.displayBlockSpacing || 'normal'
});
```

**Fix 2: Merge Supabase settings with localStorage instead of overwriting**

File: `src/app/providers/settings-provider.tsx` (~line 101)
```ts
// BEFORE (overwrites localStorage):
localStorage.setItem('devlogSettings', JSON.stringify(profileSettings));

// AFTER (merges — preserves local settings that Supabase doesn't have):
const existingLocal = localStorage.getItem('devlogSettings');
const merged = existingLocal 
  ? { ...JSON.parse(existingLocal), ...profileSettings }
  : profileSettings;
localStorage.setItem('devlogSettings', JSON.stringify(merged));
```

**Fix 3: Ensure CSS variables are applied on EVERY settings load (not just state change)**

The current effect at line ~198 already watches `settings.displayFontSize` etc, which should work. But add a safety net: also apply on mount after localStorage load.

File: `src/app/providers/settings-provider.tsx`
Add to the localStorage loading effect (after `setSettings`):
```ts
// Apply CSS variables immediately from localStorage (don't wait for state update)
if (parsed.displayFontSize && parsed.displayLineHeight) {
  const root = document.documentElement;
  root.style.setProperty('--step-writing', `${parsed.displayFontSize}px`);
  root.style.setProperty('--line-height-writing', String(parsed.displayLineHeight));
  const spacingMap: Record<string, string> = { compact: '8px', normal: '16px', relaxed: '24px' };
  root.style.setProperty('--block-gap', spacingMap[parsed.displayBlockSpacing] || '16px');
}
```

This ensures CSS variables are set synchronously from localStorage before React re-renders, eliminating the flash of default fonts.

---

## Implementation Order

1. **Fix settings persistence first** (Problem 2) — fixes 1, 2, 3
   - `src/app/providers/settings-provider.tsx`
   - `src/pages/SettingsClaude.jsx`
2. **Then fix block font consistency** (Problem 1)
   - `src/components/blocks/TodoBlock.jsx`
   - `src/components/blocks/TableBlock.jsx`
   - `src/components/blocks/OptimizedIssueTrackerBlock.jsx`
   - `src/components/blocks/ImageBlock.jsx`
   - `src/components/blocks/InlineImageBlock.jsx`

## Testing Checklist

- [ ] Change font size in Settings > Display > Apply
- [ ] Hard refresh (Ctrl+Shift+R) — font size should persist
- [ ] Check ALL block types show correct font size after refresh
- [ ] Check TextBlock matches TodoBlock matches TableBlock font size
- [ ] Check CodeBlock and FileTreeBlock remain monospace and smaller (unaffected)
- [ ] Check HeadingBlock sizes are still correct (H1 > H2 > H3)
- [ ] Test with logged-out user (localStorage only)
- [ ] Test with logged-in user (Supabase + localStorage)
- [ ] Open new tab — settings should be consistent
- [ ] Change line height — verify it persists and applies to all content blocks

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/providers/settings-provider.tsx` | Fix localStorage overwrite, add immediate CSS apply on load |
| `src/pages/SettingsClaude.jsx` | Pass blockSpacing to applyDisplaySettings, save it |
| `src/components/blocks/TodoBlock.jsx` | Add `--step-writing` + `font-sans` to task content |
| `src/components/blocks/TableBlock.jsx` | Add `--step-writing` + `font-sans` to cell content |
| `src/components/blocks/OptimizedIssueTrackerBlock.jsx` | Add `--step-writing` to issue titles |
| `src/components/blocks/ImageBlock.jsx` | Add `--step-writing` to caption |
| `src/components/blocks/InlineImageBlock.jsx` | Add `--step-writing` to caption if exists |
