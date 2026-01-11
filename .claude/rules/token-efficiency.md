# Token Efficiency Rules

## Response Length

- **Simple question** → 1-3 lines
- **Code fix** → show diff only, not whole file
- **Explanation** → bullets, not paragraphs
- **Investigation** → findings only, not process

## What to Skip

- "I'll help you with..."
- "Let me explain..."
- Repeating user's question
- Obvious observations
- Success confirmations (unless asked)

## File Operations

- Read specific lines, not whole file
- Grep before Read
- Show only changed sections
- Reference files, don't paste content

## Debug Logging

- Log only when resolved
- 4 lines per bug max
- No narratives
- Code < 5 lines

## Todo List

- Use for 3+ step tasks only
- Mark complete immediately
- Remove stale items
- Don't log trivial tasks
