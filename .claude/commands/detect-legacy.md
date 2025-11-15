---
description: "Detect unused, legacy, and redundant code in the codebase. Generates detailed markdown report without modifying files."
argument-hint: "optional directory path (default: src/)"
---

# 🔍 Legacy Code Detection

Analyzing codebase for unused and legacy code...

**Target Directory:** $ARGUMENTS (or src/ if not specified)

## What This Command Does

This command will scan your codebase and identify:

1. **Unused Files** - Files never imported anywhere
2. **Unused Exports** - Functions/components exported but not used
3. **Duplicate Code** - Similar implementations across files
4. **Commented Code** - Large blocks of dead code
5. **Technical Debt** - TODO/FIXME markers

## Analysis Process

Using @legacy-code-detector to:

✅ Build complete import/export map
✅ Check every file for usage
✅ Identify replaced/superseded files
✅ Find duplicate patterns
✅ Analyze technical debt

---

## Report Generation

The detector will create:
- File: `legacy-code-report-<timestamp>.md`
- Location: Project root
- Format: Markdown with tables and checkboxes

## Confidence Levels

Results are categorized by confidence:

- **🔴 HIGH** - Safe to remove (no imports found)
- **🟡 MEDIUM** - Review needed (possible edge cases)
- **🟢 LOW** - Investigate further (dynamic imports possible)

---

## Safety Features

✅ **No files modified** - Detection only
✅ **Multiple verification** - Checks imports, strings, configs
✅ **Clear documentation** - Every finding explained
✅ **Rollback ready** - Cleanup can be reversed

---

## What Happens Next

After the report is generated:

1. **Review findings** section by section
2. **Start with HIGH confidence items** first
3. **Test after each cleanup** phase
4. **When ready**, run: `/cleanup-legacy legacy-code-report-<timestamp>.md --phase=1`

---

## 🔍 Starting Detection

@legacy-code-detector

Please analyze the codebase and generate a comprehensive legacy code detection report.
Target directory: $ARGUMENTS (default: src/)

Include:
- Unused files with zero imports
- Unused exports never referenced
- Files marked as "Unused/Legacy" in CLAUDE.md
- Duplicate code patterns
- Commented code blocks (>20 lines)
- Technical debt markers (TODO/FIXME)

Generate the report with:
- Executive summary
- High/Medium/Low confidence sections
- Actionable cleanup plan
- Safety verification checklist
- Rollback instructions
