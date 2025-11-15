---
description: "Map all import/export relationships in the codebase. Creates dependency graphs and identifies orphaned files, circular dependencies, and usage patterns."
argument-hint: "optional directory path (default: src/)"
---

# 🗺️ Import Dependency Mapping

Building complete import/export dependency map...

**Target Directory:** $ARGUMENTS (or src/ if not specified)

## What This Command Does

This command analyzes your entire codebase to:

1. **Map Import Relationships** - Who imports what
2. **Identify Orphans** - Files never imported
3. **Find Circular Dependencies** - Import loops
4. **Trace Dependency Trees** - Full import chains
5. **Analyze Usage Patterns** - Most/least used files

## Why This Is Useful

### Before Deleting Code
Use this to verify a file is truly unused:
- Check if it has incoming imports
- See what it depends on
- Understand removal impact

### Refactoring
Understand file relationships:
- Find tightly coupled code
- Identify candidates for extraction
- Optimize import structure

### Performance Analysis
Identify bloat:
- Files with too many imports
- Deeply nested dependencies
- Unnecessary transitive dependencies

---

## Analysis Process

Using @import-dependency-mapper to:

✅ Scan all .js/.jsx/.ts/.tsx files
✅ Extract import/export statements
✅ Build complete dependency graph
✅ Calculate metrics (indegree, outdegree, depth)
✅ Identify patterns (orphans, circles, hubs)

---

## Report Contents

The generated report will include:

### 1. Overview Statistics
- Total files analyzed
- Total import relationships
- Entry points identified
- Hub files (imported by many)

### 2. Orphan Files
Files with zero incoming imports:
```
src/Test.jsx - Never imported ✅ Safe to delete
src/utils/old-helper.js - Never imported ✅ Safe to delete
```

### 3. Dependency Trees
Visual representation of import chains:
```
App.jsx
├── Dashboard.jsx
│   ├── DocumentGrid.jsx
│   └── ProjectExplorer.jsx
└── Landing.jsx
```

### 4. Circular Dependencies
Import loops that may cause issues:
```
AuthContext.jsx → storageWrapper.js → AuthContext.jsx ❌
```

### 5. Hub Files
Critical files many others depend on:
```
utils/helpers.js - Imported by 45 files ⚠️ Don't delete!
```

### 6. Unused Exports
Exports never imported anywhere:
```
helpers.js: oldCalculate() - Never imported ✅ Can remove
```

---

## Report Generation

The mapper will create:
- File: `dependency-map-<timestamp>.md`
- Location: Project root
- Format: Markdown with trees and tables
- Optional: JSON export for visualization

---

## Use Cases

### Before Running /detect-legacy

Run this first to understand the codebase:
```bash
/map-imports
# Review dependency-map-<timestamp>.md
# Then run /detect-legacy
```

### Verify Safe Deletion

Check if a file is safe to remove:
```bash
/map-imports
# Search report for the file
# Check "Imported By" section
# If zero imports → safe to delete
```

### Find Refactoring Opportunities

Identify code to extract:
```bash
/map-imports
# Look for "Duplicate Code Patterns"
# Check "Heavily Connected Files"
# Find candidates for extraction
```

### Debug Circular Dependencies

Fix import loops:
```bash
/map-imports
# Check "Circular Dependencies" section
# See the complete loop
# Refactor to break the circle
```

---

## Integration with Other Commands

### Workflow 1: Safe Cleanup
```bash
# Step 1: Map dependencies
/map-imports

# Step 2: Detect legacy code
/detect-legacy

# Step 3: Cross-reference reports
# Check if "legacy" files are orphans in dependency map

# Step 4: Clean up confidently
/cleanup-legacy --phase=1
```

### Workflow 2: Refactoring
```bash
# Step 1: Map current structure
/map-imports

# Step 2: Identify issues
# - Circular dependencies
# - Hub files (too many responsibilities)
# - Deep nesting

# Step 3: Refactor

# Step 4: Map again to verify improvement
/map-imports
```

---

## Understanding the Output

### Indegree (Popularity)
Number of files that import this file.

- **High indegree (10+):** Hub file, many dependencies
- **Zero indegree:** Orphan, never imported

### Outdegree (Complexity)
Number of files this file imports.

- **High outdegree (20+):** Complex file, many dependencies
- **Zero outdegree:** Leaf file, no imports

### Depth
Distance from entry points (main.jsx, App.jsx).

- **Depth 0:** Entry point
- **Depth 1:** Imported by entry
- **Depth 3+:** Deeply nested

### Example

```
File: src/utils/helpers.js
├─ Indegree: 45 (imported by 45 files) ← HUB
├─ Outdegree: 3 (imports 3 files)
├─ Depth: 2 (two hops from App.jsx)
└─ Type: Utility
```

---

## Advanced Features

### JSON Export

The report includes a JSON data structure:
```json
{
  "nodes": [...],
  "edges": [...],
  "orphans": [...],
  "circles": [...]
}
```

Use this for:
- Custom visualization (D3.js, Cytoscape)
- Integration with other tools
- Automated analysis scripts

### Visualization Tools

Suggested tools for visual graphs:
```bash
# Option 1: madge
npx madge src/App.jsx --image graph.png

# Option 2: dependency-cruiser
npx depcruise src/ --output-type dot | dot -T svg > deps.svg
```

---

## 🔍 Starting Analysis

@import-dependency-mapper

Please analyze the codebase and generate a comprehensive import dependency map.
Target directory: $ARGUMENTS (default: src/)

Include:
- Complete import/export graph
- Orphan files (never imported)
- Hub files (imported by many)
- Circular dependencies
- Dependency trees for main entry points
- Unused exports
- Metrics (indegree, outdegree, depth)
- JSON export for visualization

Generate the report with:
- Overview statistics
- Visual dependency trees
- Actionable recommendations
- Integration with legacy detection
