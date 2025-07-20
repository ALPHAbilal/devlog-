# Solved Errors Documentation

This directory contains documentation of all errors we've encountered and solved in the DevLog platform. Each error is documented with its symptoms, root cause, solution, and prevention tips.

## Index of Solved Errors

### 1. [Console Spam - FloatingControlsTrigger](./console-spam-floatingcontrols.md)
**Date**: 2025-01-20  
**Summary**: Excessive console logging on every scroll event causing performance issues

### 2. [Supabase Preview Column Missing](./supabase-preview-column-missing.md)
**Date**: 2025-01-20  
**Summary**: RPC function trying to insert into non-existent 'preview' column (Error 42703)

### 3. [Document Already Exists 409 Error](./document-already-exists-409.md)
**Date**: 2025-01-20  
**Summary**: System incorrectly treating existing documents as new, causing duplicate key errors

### 4. [FloatingControlsTrigger Not Appearing](./floating-controls-not-appearing.md)
**Date**: 2025-01-20  
**Summary**: Floating controls button not visible due to useEffect dependency issues and edge cases

### 5. [BlockControls Not Visible on Hover](./block-controls-not-visible.md)
**Date**: 2025-01-20  
**Summary**: Block controls (dots menu) clipped by overflow container due to positioning outside padding area

## How to Use This Documentation

1. **When you encounter an error**: Search this index for similar symptoms
2. **Check the specific error file**: Each file contains detailed analysis and solutions
3. **Follow the prevention tips**: Avoid making the same mistakes
4. **Add new errors**: Document any new errors you solve using the same format

## Error Documentation Template

When adding new error documentation, use this template:

```markdown
# [Error Title]

**Date Solved**: YYYY-MM-DD  
**Severity**: High/Medium/Low  
**Category**: Frontend/Backend/Database/Build  

## Symptoms
What the user experiences

## Error Messages
Exact error text from console/logs

## Root Cause
Why this error occurred

## Solution
Step-by-step fix applied

## Files Changed
- file1.js: Description of change
- file2.js: Description of change

## Prevention
How to avoid this in the future

## Related Issues
Links to similar problems or documentation
```