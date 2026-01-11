# Claude Code: Skills & Rules Folder Best Practices

A focused guide on creating effective SKILL.md files and organizing the rules folder.

---

## Part 1: Rules Folder Best Practices

### Directory Structure

```
.claude/rules/
├── code-style.md           # Language and formatting rules
├── testing.md              # Testing conventions and coverage
├── security.md             # Security and compliance requirements
├── api.md                  # API design patterns
├── database.md             # Database conventions
├── frontend/               # Subdirectory for frontend-specific rules
│   ├── react.md
│   ├── components.md
│   └── styling.md
└── backend/                # Subdirectory for backend-specific rules
    ├── controllers.md
    └── middleware.md
```

### Creating Rule Files

**File naming:**
- Use lowercase with hyphens: `code-style.md`, not `CodeStyle.md`
- Be specific: `react-components.md`, not `frontend.md`
- One concern per file: Don't mix code style with testing in same file

**File location:**
- Project-specific rules: `./.claude/rules/`
- Team-wide rules: Commit to git in `./.claude/rules/`
- All `.md` files auto-load with same priority

### Rule File Structure

**Minimal rule file:**
```markdown
# Code Style Rules

- Functional components only
- TypeScript strict mode enabled
- Max 200 lines per file
- Use const, not var
```

**Rule file with path scoping:**
```markdown
---
paths:
  - "src/components/**/*.tsx"
  - "src/hooks/**/*.ts"
---

# React Component Rules

## File Organization
1. Imports (React, external, internal)
2. Types and interfaces
3. Component function
4. Export statement

## Component Patterns
- Functional components only, no classes
- Props typed with interfaces
- Use custom hooks for reusable logic
- Max 200 lines per component

## State Management
- useState for local state
- useContext for cross-component data
- Don't over-use hooks
- Never pass callbacks through multiple levels
```

### Path Scoping with YAML Frontmatter

Rules only apply to matching file paths using glob patterns:

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/routes/**/*.ts"
---

# API Rules

- RESTful endpoints only
- Validate all inputs with Zod
- Return consistent error format
```

**Glob pattern examples:**
- `"src/**/*.ts"` - All TypeScript files under src/
- `"**/*.test.ts"` - All test files anywhere
- `"src/{api,routes}/**/*.ts"` - Multiple directories
- `"src/**/*.{ts,tsx}"` - Multiple extensions
- `"*.md"` - Root-level markdown files

### Best Practices for Rules

**DO:**
- ✅ Be specific and actionable: "Functional components only, max 200 lines"
- ✅ Include examples of correct vs incorrect patterns
- ✅ Organize by topic (code-style, testing, security)
- ✅ Use path scoping to apply rules conditionally
- ✅ Reference other rules when appropriate
- ✅ Update monthly, prune outdated rules

**DON'T:**
- ❌ Don't write vague rules: "Use best practices"
- ❌ Don't mix multiple concerns in one file
- ❌ Don't include entire architecture docs (reference them instead)
- ❌ Don't add rules you won't enforce
- ❌ Don't create too many rules (5-10 per topic max)

### Example: Complete Rules Folder

**code-style.md:**
```markdown
---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
---

# TypeScript Code Style

## Formatting
- 2-space indentation
- Use const, avoid var
- Semicolons required
- Single quotes for strings

## Type Safety
- Strict mode enabled
- No `any` types (use explicit types)
- Use discriminated unions for variants
- Export types from module files

## Imports/Exports
- Group: React/external → internal → types
- Use named imports for utilities
- Use default imports for components
- Use barrel exports (index.ts)
```

**testing.md:**
```markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---

# Testing Conventions

## Coverage Targets
- Utilities: 90%+
- Components: 80%+
- Controllers: 85%+

## File Organization
- Place tests next to source: `Button.tsx` + `Button.test.tsx`
- Or in `__tests__` folder: `src/__tests__/Button.test.tsx`
- Name: `*.test.ts` or `*.spec.ts`

## Test Structure
- Describe blocks for grouping
- It/test for individual test cases
- Focus on behavior, not implementation
- Mock external dependencies
```

**api.md:**
```markdown
---
paths:
  - "src/routes/**/*.ts"
  - "src/controllers/**/*.ts"
---

# API Design Rules

## Endpoints
- RESTful pattern: `/api/v1/resource`
- Use HTTP methods: GET, POST, PUT, PATCH, DELETE
- No verbs in URLs

## Validation
- Validate all inputs with Zod
- Return 400 for validation errors
- Include field-level error details

## Responses
- Successful: `{ success: true, data: {...} }`
- Error: `{ success: false, error: { code: string, message: string } }`
- Use proper HTTP status codes
```

**frontend/react.md:**
```markdown
---
paths:
  - "src/components/**/*.tsx"
  - "src/pages/**/*.tsx"
---

# React Component Rules

## Component Structure
1. Imports (React, external, internal)
2. Types/Interfaces
3. Component function
4. Export

## Styling
- Tailwind utility classes
- Use cn/clsx for conditional classes
- No inline styles
- Mobile-first responsive

## State Management
- useState for local state
- useContext for global state
- React Query for server state
- Never prop drill callbacks
```

---

## Part 2: SKILL.md Best Practices

### What Makes a Good Skill

A Skill should:
1. Have a clear, specific purpose
2. Include trigger keywords in description
3. Be automatically invoked by Claude when relevant
4. Keep main SKILL.md under 500 tokens
5. Use progressive disclosure for complex content

### SKILL.md Structure

**Minimal Skill (50-100 lines):**
```markdown
---
name: skill-name
description: What this skill does and when to use it. Include trigger keywords.
---

# Skill Title

## When to Use
This skill is automatically triggered when you ask about [topic].

## What It Does
- Explain what the skill provides
- List key capabilities
- Note any restrictions

## Quick Example
Show a simple example of output or behavior.
```

**Complete Skill (200-300 lines):**
```markdown
---
name: pdf-processing
description: Extract text, tables, and fill forms in PDF files. Use when working with PDFs, form data, or document extraction.
allowed-tools: Read, Bash(python:*)
user-invocable: true
---

# PDF Processing

## Overview
This skill helps you work with PDF files using Python tools.

## Key Capabilities
- Extract text and tables from PDFs
- Fill PDF forms programmatically
- Merge and split documents
- Validate PDF fields

## Quick Start

### Extract Text
```bash
python scripts/extract.py input.pdf
```

### Fill Form
```bash
python scripts/fill_form.py template.pdf data.json output.pdf
```

## Common Patterns

### Extract Tables
```python
import pdfplumber
with pdfplumber.open("file.pdf") as pdf:
    for table in pdf.pages[0].extract_tables():
        print(table)
```

### Validate Fields
```bash
python scripts/validate.py form.pdf
```

## Advanced Usage
For detailed API documentation, see [REFERENCE.md](./reference.md)

## Dependencies
- pdfplumber
- pypdf

## Installation
```bash
pip install pdfplumber pypdf
```
```

### SKILL.md Metadata Fields

| Field | Required | Type | Example |
|-------|----------|------|---------|
| `name` | Yes | string | `pdf-processing` |
| `description` | Yes | string | "Extract and process PDFs. Use when..." |
| `allowed-tools` | No | string | `Read, Bash(python:*)` |
| `user-invocable` | No | boolean | `true` (default) |
| `context` | No | string | `fork` (for isolated context) |
| `agent` | No | string | `general-purpose` |
| `disable-model-invocation` | No | boolean | `false` (default) |

### Writing Effective Descriptions

**Good descriptions:**
- Specific about what the skill does
- Include keywords users naturally say
- Clear when to use the skill
- Under 1024 characters

```
"Extract text, tables, and metadata from PDF files. Fill PDF forms 
and generate reports. Use when working with PDF documents, form 
data extraction, or batch document processing."
```

**Poor descriptions:**
- Too vague: "Helps with documents"
- Missing keywords: "Process files"
- Too long or unfocused
- No clear trigger conditions

### Directory Structure for Skills

**Simple Skill:**
```
~/.claude/skills/skill-name/
└── SKILL.md
```

**Complex Skill with Progressive Disclosure:**
```
~/.claude/skills/skill-name/
├── SKILL.md              # Overview and quick start
├── REFERENCE.md          # Detailed API documentation
├── EXAMPLES.md           # Usage examples
└── scripts/
    ├── helper.py         # Supporting script
    └── validate.py       # Validation script
```

### Progressive Disclosure Pattern

Keep SKILL.md focused, reference detailed docs for advanced usage:

**SKILL.md (concise overview):**
```markdown
---
name: code-analysis
description: Analyze code for performance, security, and quality issues.
allowed-tools: Read, Grep, Bash(python:*)
---

# Code Analysis

## Quick Start
Run analysis on a file:
```bash
python scripts/analyze.py src/file.ts
```

## Output Format
- Issues found with severity
- Line numbers and descriptions
- Suggested fixes

## Advanced Options
For detailed configuration options, see [REFERENCE.md](./REFERENCE.md)
```

**REFERENCE.md (detailed docs):**
```markdown
# Code Analysis - Complete Reference

## Configuration Options
- severity: warning, error, critical
- rules: list of enabled rules
- excludePatterns: patterns to ignore

## Custom Rules
[Detailed instructions for custom rules]

## Performance Tuning
[How to optimize for large codebases]
```

### Tool Restriction Best Practices

Use `allowed-tools` to limit what Claude can do in a skill:

```markdown
---
name: read-only-analysis
description: Analyze code without making changes
allowed-tools: Read, Grep, Bash(git:*)
---
```

**Common tool combinations:**
- `Read, Grep, Glob` - Safe, read-only operations
- `Read, Bash(node:*)` - JavaScript/Node.js tools
- `Read, Bash(python:*)` - Python tools
- `Edit, Bash(git:*)` - Git and file operations
- `Read, Bash(npm:*)` - npm package management

### Isolated Context Skills

Use `context: fork` for complex operations:

```markdown
---
name: code-refactoring
description: Refactor code with detailed analysis and multiple steps
context: fork
agent: general-purpose
---

# Code Refactoring

This skill runs in an isolated context to:
- Keep the main conversation clean
- Run complex multi-step processes
- Return results to main agent
```

Benefits:
- Separate conversation history
- Independent context window
- Complex operations without cluttering main chat
- Results automatically returned

### Example: Real-World Skills

**Skill 1: Commit Message Generator**
```markdown
---
name: generating-commit-messages
description: Generate clear, descriptive commit messages from git diffs. Use when writing commits or need help with commit messages.
---

# Commit Message Generator

## Process
1. Analyze staged changes with `git diff --staged`
2. Create commit message following conventions:
   - Summary: Under 50 characters, present tense
   - Body: Explain what and why
   - Footer: Reference issues if applicable

## Conventions
- Use present tense: "Add feature", not "Added"
- Explain the why, not just what
- Include issue references: "Fixes #123"
- Scope: "feat(auth):", "fix(api):"

## Example Output
```
feat(auth): implement OAuth2 integration

Add OAuth2 authentication support using Google provider.
Includes token refresh, user profile sync, and logout.

Fixes #456
```
```

**Skill 2: Security Review**
```markdown
---
name: security-review
description: Review code for security vulnerabilities, credential exposure, and OWASP violations. Use when reviewing code for security issues.
allowed-tools: Read, Grep, Bash(git:*)
---

# Security Code Review

## Checks
- SQL injection prevention
- XSS vulnerabilities
- Credential exposure
- Authentication/authorization issues
- OWASP top 10 violations

## Process
1. Scan for credential patterns
2. Check input validation
3. Review authentication flows
4. Inspect error messages
5. Verify authorization logic

## Report Format
- Severity: Critical, High, Medium, Low
- Location: File and line number
- Description: What the issue is
- Recommendation: How to fix it
```

**Skill 3: Performance Optimization**
```markdown
---
name: performance-optimization
description: Optimize code performance, reduce memory usage, and improve response times. Use when improving speed or efficiency.
allowed-tools: Read, Grep, Edit, Bash(*)
context: fork
---

# Performance Optimization

## Analysis Areas
- Time complexity (identify O(n²) algorithms)
- Memory usage and leaks
- Database query optimization
- Caching opportunities
- Network request batching

## Optimization Process
1. Profile current performance
2. Identify bottlenecks
3. Suggest optimizations
4. Implement changes
5. Measure improvements

## Common Patterns

### Before (O(n²))
```javascript
items.map(item => 
  related.find(r => r.id === item.id)
)
```

### After (O(n))
```javascript
const map = new Map(related.map(r => [r.id, r]));
items.map(item => map.get(item.id))
```
```

### Best Practices for Skills

**DO:**
- ✅ Write descriptions with specific trigger keywords
- ✅ Keep SKILL.md under 500 tokens
- ✅ Use progressive disclosure with supporting docs
- ✅ Include quick examples
- ✅ Use `allowed-tools` to restrict capabilities
- ✅ Test that skills trigger on relevant requests
- ✅ Include dependencies and setup instructions

**DON'T:**
- ❌ Don't write vague descriptions: "Helps with code"
- ❌ Don't include massive reference docs in SKILL.md
- ❌ Don't create overlapping skills with similar purposes
- ❌ Don't forget to test your skills
- ❌ Don't leave broken script references
- ❌ Don't make descriptions too long (max 1024 chars)

### Troubleshooting Skills

| Issue | Solution |
|-------|----------|
| Skill not triggering | Add more keywords to description. Test with exact phrases. |
| Description too long | Move details to supporting .md files. Keep main under 1024 chars. |
| Invalid YAML | Use online validator. Ensure `---` on line 1. Use spaces, not tabs. |
| Missing dependencies | Install in environment before Claude uses them: `pip install package` |
| Script permissions | Set execute: `chmod +x scripts/*.py` |
| Skill not found | Verify path: `~/.claude/skills/name/SKILL.md` |

---

## Part 3: Integration Checklist

### Quick Setup (30 minutes)

```bash
# 1. Create folder structure
mkdir -p .claude/rules
mkdir -p ~/.claude/skills/my-skill

# 2. Create first rule
cat > .claude/rules/code-style.md << 'EOF'
# Code Style

- Functional components only
- TypeScript strict mode
- Max 200 lines per file
EOF

# 3. Create first skill
cat > ~/.claude/skills/my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What this does. Use when [trigger].
---

# My Skill

Quick instructions here.
EOF

# 4. Test
claude "explain the code style rules"
claude "use my-skill"

# 5. Commit
git add .claude/
git commit -m "Add rules and skills"
```

### Monthly Maintenance

- [ ] Review rules that Claude struggles with
- [ ] Add new rules for common issues
- [ ] Prune outdated rules
- [ ] Test that skills trigger correctly
- [ ] Update skill descriptions if needed
- [ ] Check context usage with `/context`

---

## Key Takeaways

**Rules Folder:**
1. Organize by topic (code-style, testing, security)
2. Use path scoping for conditional rules
3. Keep each rule file focused on one concern
4. Start with 5-10 essential rules, add as needed
5. Commit to git for team sharing

**Skills:**
1. Include trigger keywords in description
2. Keep SKILL.md under 500 tokens
3. Use progressive disclosure for complexity
4. Include quick examples
5. Use allowed-tools to restrict capabilities
6. Test that skills trigger correctly

**Together:**
- Rules guide what Claude should do
- Skills teach Claude how to do complex tasks
- Both should evolve with your project
- Share with team by committing to git
- Monitor effectiveness monthly
