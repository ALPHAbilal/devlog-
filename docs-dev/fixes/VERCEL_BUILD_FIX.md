# Vercel Build Fix - January 29, 2025

## Issue:
Build was failing with error:
```
Transform failed with 1 error:
/vercel/path0/src/utils/storage/SupabaseAdapter.js:374:12: ERROR: The symbol "blocks" has already been declared
```

## Root Cause:
Duplicate variable declaration in the same scope:
- Line 349: `const blocks = document.blocks || [];`
- Line 374: `const { blocks, ...docData } = document;`

## Solution Applied:
Renamed the destructured variable to `documentBlocks` to avoid conflict:
- Line 374: `const { blocks: documentBlocks, ...docData } = document;`
- Updated all references after line 374 to use `documentBlocks`

## Files Changed:
- `/src/utils/storage/SupabaseAdapter.js`

The build should now complete successfully!