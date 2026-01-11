---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# Code Investigation Rules

## Before Fixing

1. **Check debug knowledge first**
   ```
   AI-MEMORY/debug/[category].md
   ```

2. **Read the actual error** - don't assume
   - Line number matters
   - Stack trace shows origin

3. **Check container** - one level above the error
   - Parent component
   - Calling function
   - Provider wrapper

## Investigation Order

```
Error appears
  ↓
1. Exact error message?
2. Which file:line?
3. What calls this code?
4. Similar bug in debug/?
```

## Don't

- Don't guess without reading code
- Don't fix symptoms, find cause
- Don't write long explanations
- Don't repeat failed attempts
