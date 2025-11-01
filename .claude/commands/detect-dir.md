---
description: "Scan directory structure and generate detailed markdown report"
argument-hint: "optional directory path (default: current directory)"
---

# Directory Structure Detection Report Generator

Generating comprehensive directory analysis report...

**Target Directory:** $ARGUMENTS (or current directory if not specified)

## Analysis in Progress

Using @directory-detector subagent to:

1. ✅ Scan for problematic directories
2. ✅ Check for duplicate files and code
3. ✅ Identify orphaned files
4. ✅ Analyze directory depth
5. ✅ Generate structured markdown report

---

## Report Generation

The detector will:
- Create a file named `directory-report-<timestamp>.md`
- Save it to your project root
- Display the full report location
- Show a summary of critical findings

## What Happens Next

Once the report is generated:
1. **Review the findings** in the markdown report
2. **Check each section** (Critical, Warnings, Duplicates)
3. **Decide what to clean** - the report will have checkboxes
4. **When ready**, run: `/cleanup-by-report <report-filename>`

---

## 🔍 Starting Analysis

@directory-detector

Please scan the directory structure and generate the detection report.
