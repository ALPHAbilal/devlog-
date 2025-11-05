---
date: 2025-11-04T23:42:16+01:00
researcher: Claude
git_commit: f83567524863027224e86db3b7f3f661eaf8b0c8
branch: main
repository: ALPHAbilal/devlog-
topic: "PropTypes Implementation Plan for All Block Components"
tags: [research, codebase, blocks, proptypes, implementation-plan, type-safety]
status: complete
last_updated: 2025-11-04
last_updated_by: Claude
---

# Research: PropTypes Implementation Plan for All Block Components

**Date**: 2025-11-04T23:42:16+01:00
**Researcher**: Claude
**Git Commit**: f83567524863027224e86db3b7f3f661eaf8b0c8
**Branch**: main
**Repository**: ALPHAbilal/devlog-

## Research Question

Research deeply what blocks need PropTypes, their exact locations, and all information to create a plan to add PropTypes to all block types.

## Executive Summary

**Current State**: PropTypes package is NOT installed. Zero blocks (0/11) have PropTypes validation.

**Proposed Solution**: Add PropTypes to all 11 block components to catch type errors during development.

**Implementation Effort**:
- Setup: 10 minutes (install package)
- Per block: 15-30 minutes average
- Total: ~5-6 hours for all 11 blocks

**Impact**: Catch prop type errors immediately in development with zero production cost.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Shared PropTypes Definitions](#shared-proptypes-definitions)
3. [Block-Specific PropTypes](#block-specific-proptypes)
4. [Implementation Plan](#implementation-plan)
5. [Code References](#code-references)

---

## Current State Analysis

### Package Status
- **prop-types package**: NOT in package.json
- **PropTypes imports**: 0 found in codebase
- **PropTypes definitions**: 0 found in blocks

### Block Components Requiring PropTypes

| # | Component | File | Props Count | Complexity |
|---|-----------|------|-------------|------------|
| 1 | TextBlock | TextBlock.jsx:9 | 7 props | High |
| 2 | CodeBlock | CodeBlock.jsx:5 | 4 props | Medium |
| 3 | HeadingBlock | HeadingBlock.jsx:3 | 2 props | Low |
| 4 | TableBlock | TableBlock.jsx:4 | 4 props | Very High |
| 5 | TodoBlock | TodoBlock.jsx:21 | 2 props | Medium |
| 6 | FileTreeBlock | FileTreeBlock.jsx:444 | 2 props | High |
| 7 | ImageBlock | ImageBlock.jsx:8 | 4 props | Medium |
| 8 | InlineImageBlock | InlineImageBlock.jsx:7 | 4 props | Low |
| 9 | AIBlockRefined | AIBlockRefined.jsx:6 | 2 props | Medium |
| 10 | OptimizedVersionTrackBlock | OptimizedVersionTrackBlock.jsx:82 | 2 props | Medium |
| 11 | OptimizedIssueTrackerBlock | OptimizedIssueTrackerBlock.jsx:96 | 2 props | Medium |

### Props Flow Architecture

```
ExpandedViewEnhanced.jsx (Parent)
        ↓ (24 props)
    Block.jsx (Middleware)
        ↓ (8-9 filtered props)
Individual Block Components
```

**Key Finding**: Block.jsx filters props before passing to individual blocks, reducing prop count from 24 to 8-9.

---

## Shared PropTypes Definitions

### Create: `src/utils/propTypes.js`

This shared file will contain reusable PropTypes for common structures.

```javascript
import PropTypes from 'prop-types';

/**
 * Shared PropTypes definitions for block components
 */

// Base block shape - all blocks must have these
export const BaseBlockPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  createdAt: PropTypes.string,
  updatedAt: PropTypes.string,
  position: PropTypes.number,
});

// Common callback function types
export const OnUpdatePropType = PropTypes.func.isRequired;
export const OnDeletePropType = PropTypes.func;
export const OnConvertPropType = PropTypes.func;
export const OnFocusPropType = PropTypes.func;
export const OnAddBelowPropType = PropTypes.func;
export const OnNavigateToBlockPropType = PropTypes.func;

// Common state props
export const IsFocusedPropType = PropTypes.bool;
export const AllBlocksPropType = PropTypes.arrayOf(PropTypes.object);

// Block type enum - centralized source of truth
export const BlockType = PropTypes.oneOf([
  'text',
  'code',
  'heading',
  'table',
  'todo',
  'filetree',
  'image',
  'inline-image',
  'ai',
  'version-track',
  'issue-tracker'
]);

// Metadata shape (used by multiple blocks)
export const MetadataPropType = PropTypes.shape({
  isCollapsed: PropTypes.bool,
  collapsedMessages: PropTypes.arrayOf(PropTypes.number),
  isBlockCollapsed: PropTypes.bool,
  layout: PropTypes.string,
});

// Message shape (for AI blocks)
export const MessagePropType = PropTypes.shape({
  role: PropTypes.oneOf(['user', 'ai', 'assistant']).isRequired,
  content: PropTypes.string.isRequired,
});

// TreeNode shape (for FileTree blocks)
export const TreeNodePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isFolder: PropTypes.bool.isRequired,
  children: PropTypes.array, // Recursive - will be validated at runtime
  content: PropTypes.string,
});

// Image data shape (for Image blocks)
export const ImageDataPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  storagePath: PropTypes.string,
  alt: PropTypes.string,
  size: PropTypes.number,
  dimensions: PropTypes.shape({
    width: PropTypes.number,
    height: PropTypes.number,
  }),
});

// Todo item shape (for Todo blocks)
export const TodoItemPropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  task: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['todo', 'in_progress', 'done', 'blocked']).isRequired,
  priority: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
  dueDate: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  createdAt: PropTypes.string.isRequired,
});

// Table alignment type
export const TableAlignmentPropType = PropTypes.oneOf(['left', 'center', 'right']);
```

---

## Block-Specific PropTypes

### 1. TextBlock.jsx

**File**: `src/components/blocks/TextBlock.jsx`
**Line**: Add after imports (around line 9)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, OnConvertPropType, IsFocusedPropType, OnFocusPropType, OnAddBelowPropType, AllBlocksPropType, MetadataPropType } from '../../utils/propTypes';

// ... component code ...

TextBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['text']).isRequired,
    content: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    isNew: PropTypes.bool,
    metadata: MetadataPropType,
    images: PropTypes.array, // Legacy support for paste handler
  }).isRequired,
  onUpdate: OnUpdatePropType,
  onConvert: OnConvertPropType,
  isFocused: IsFocusedPropType,
  onFocus: OnFocusPropType,
  onAddBelow: OnAddBelowPropType,
  allBlocks: AllBlocksPropType,
};

TextBlock.defaultProps = {
  isFocused: false,
  allBlocks: [],
};

// Keep existing memo export
export default memo(TextBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 7
**Lines to add**: ~30
**Complexity**: High (most props of any block)

---

### 2. CodeBlock.jsx

**File**: `src/components/blocks/CodeBlock.jsx`
**Line**: Add after imports (around line 5)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, AllBlocksPropType, OnNavigateToBlockPropType } from '../../utils/propTypes';

// ... component code ...

CodeBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['code']).isRequired,
    content: PropTypes.string,
    language: PropTypes.string,
    filePath: PropTypes.string,
    isNew: PropTypes.bool,
  }).isRequired,
  onUpdate: OnUpdatePropType,
  allBlocks: AllBlocksPropType,
  onNavigateToBlock: OnNavigateToBlockPropType,
};

CodeBlock.defaultProps = {
  allBlocks: [],
};

export default memo(CodeBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 4
**Lines to add**: ~25
**Complexity**: Medium

---

### 3. HeadingBlock.jsx

**File**: `src/components/blocks/HeadingBlock.jsx`
**Line**: Add after imports (around line 3)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType } from '../../utils/propTypes';

// ... component code ...

HeadingBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['heading']).isRequired,
    content: PropTypes.string,
    level: PropTypes.oneOf([1, 2, 3]),
    isNew: PropTypes.bool,
  }).isRequired,
  onUpdate: OnUpdatePropType,
};

HeadingBlock.defaultProps = {
  block: {
    level: 2, // Default heading level
  },
};

export default memo(HeadingBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 2 (simplest)
**Lines to add**: ~20
**Complexity**: Low

---

### 4. TableBlock.jsx

**File**: `src/components/blocks/TableBlock.jsx`
**Line**: Add after imports (around line 4)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, IsFocusedPropType, OnFocusPropType, TableAlignmentPropType } from '../../utils/propTypes';

// ... component code ...

TableBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['table']).isRequired,
    data: PropTypes.shape({
      headers: PropTypes.arrayOf(PropTypes.string).isRequired,
      rows: PropTypes.arrayOf(
        PropTypes.arrayOf(PropTypes.string)
      ).isRequired,
      columnAlignments: PropTypes.arrayOf(TableAlignmentPropType).isRequired,
      hasHeaderRow: PropTypes.bool.isRequired,
    }),
    isNew: PropTypes.bool,
  }).isRequired,
  onUpdate: OnUpdatePropType,
  isFocused: IsFocusedPropType,
  onFocus: OnFocusPropType,
};

TableBlock.defaultProps = {
  isFocused: false,
  block: {
    data: {
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [['', '', ''], ['', '', ''], ['', '', '']],
      columnAlignments: ['left', 'left', 'left'],
      hasHeaderRow: true,
    },
  },
};

export default memo(TableBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 4
**Lines to add**: ~35
**Complexity**: Very High (complex nested data structure)

---

### 5. TodoBlock.jsx

**File**: `src/components/blocks/TodoBlock.jsx`
**Line**: Add after imports (around line 21)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, TodoItemPropType } from '../../utils/propTypes';

// ... component code ...

TodoBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['todo']).isRequired,
    data: PropTypes.shape({
      todos: PropTypes.arrayOf(TodoItemPropType),
    }),
  }).isRequired,
  onUpdate: OnUpdatePropType,
};

TodoBlock.defaultProps = {
  block: {
    data: {
      todos: [],
    },
  },
};

export default memo(TodoBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 2
**Lines to add**: ~25
**Complexity**: Medium (todo item structure)

---

### 6. FileTreeBlock.jsx

**File**: `src/components/blocks/FileTreeBlock.jsx`
**Line**: Add after imports (around line 444)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, TreeNodePropType } from '../../utils/propTypes';

// ... component code ...

FileTreeBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['filetree']).isRequired,
    treeData: PropTypes.arrayOf(TreeNodePropType),
  }).isRequired,
  onUpdate: OnUpdatePropType,
};

FileTreeBlock.defaultProps = {
  block: {
    treeData: [],
  },
};

export default memo(FileTreeBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 2
**Lines to add**: ~20
**Complexity**: High (recursive tree structure)

---

### 7. ImageBlock.jsx

**File**: `src/components/blocks/ImageBlock.jsx`
**Line**: Add after imports (around line 8)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, OnDeletePropType, IsFocusedPropType, ImageDataPropType, MetadataPropType } from '../../utils/propTypes';

// ... component code ...

ImageBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['image']).isRequired,
    images: PropTypes.arrayOf(ImageDataPropType),
    // Legacy single image format support
    url: PropTypes.string,
    storagePath: PropTypes.string,
    alt: PropTypes.string,
    size: PropTypes.number,
    dimensions: PropTypes.object,
    metadata: MetadataPropType,
  }).isRequired,
  onUpdate: OnUpdatePropType,
  onDelete: OnDeletePropType,
  isFocused: IsFocusedPropType,
};

ImageBlock.defaultProps = {
  isFocused: false,
  block: {
    images: [],
  },
};

export default memo(ImageBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 4
**Lines to add**: ~30
**Complexity**: Medium (supports legacy and modern formats)

---

### 8. InlineImageBlock.jsx

**File**: `src/components/blocks/InlineImageBlock.jsx`
**Line**: Add after imports (around line 7)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, OnDeletePropType, IsFocusedPropType } from '../../utils/propTypes';

// ... component code ...

InlineImageBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['inline-image']).isRequired,
    url: PropTypes.string,
    alt: PropTypes.string,
  }).isRequired,
  onUpdate: OnUpdatePropType,
  onDelete: OnDeletePropType,
  isFocused: IsFocusedPropType,
};

InlineImageBlock.defaultProps = {
  isFocused: false,
  block: {
    alt: '',
  },
};

export default InlineImageBlock;
```

**Props Count**: 4
**Lines to add**: ~25
**Complexity**: Low (simple structure)

---

### 9. AIBlockRefined.jsx

**File**: `src/components/blocks/AIBlockRefined.jsx`
**Line**: Add after imports (around line 6)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType, MessagePropType, MetadataPropType } from '../../utils/propTypes';

// ... component code ...

AIBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['ai']).isRequired,
    messages: PropTypes.arrayOf(MessagePropType),
    metadata: PropTypes.shape({
      collapsedMessages: PropTypes.arrayOf(PropTypes.number),
      isBlockCollapsed: PropTypes.bool,
    }),
  }).isRequired,
  onUpdate: OnUpdatePropType,
};

AIBlock.defaultProps = {
  block: {
    messages: [],
    metadata: {
      collapsedMessages: [],
      isBlockCollapsed: false,
    },
  },
};

export default memo(AIBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 2
**Lines to add**: ~30
**Complexity**: Medium (message array structure)

---

### 10. OptimizedVersionTrackBlock.jsx

**File**: `src/components/blocks/OptimizedVersionTrackBlock.jsx`
**Line**: Add after imports (around line 82)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType } from '../../utils/propTypes';

// ... component code ...

OptimizedVersionTrackBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['version-track']).isRequired,
    title: PropTypes.string,
    versions: PropTypes.array,
    currentVersion: PropTypes.object,
    viewMode: PropTypes.string,
  }).isRequired,
  onUpdate: OnUpdatePropType,
};

OptimizedVersionTrackBlock.defaultProps = {
  block: {
    title: 'Version Track',
    versions: [],
  },
};

export default memo(OptimizedVersionTrackBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 2
**Lines to add**: ~25
**Complexity**: Medium (lazy-loaded wrapper)

---

### 11. OptimizedIssueTrackerBlock.jsx

**File**: `src/components/blocks/OptimizedIssueTrackerBlock.jsx`
**Line**: Add after imports (around line 96)

```javascript
import PropTypes from 'prop-types';
import { BaseBlockPropType, OnUpdatePropType } from '../../utils/propTypes';

// ... component code ...

OptimizedIssueTrackerBlock.propTypes = {
  block: PropTypes.shape({
    ...BaseBlockPropType,
    type: PropTypes.oneOf(['issue-tracker']).isRequired,
    title: PropTypes.string,
    issues: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      status: PropTypes.oneOf(['open', 'in-progress', 'closed']).isRequired,
    })),
  }).isRequired,
  onUpdate: OnUpdatePropType,
};

OptimizedIssueTrackerBlock.defaultProps = {
  block: {
    title: 'Issue Tracker',
    issues: [],
  },
};

export default memo(OptimizedIssueTrackerBlock, (prevProps, nextProps) => { /* ... */ });
```

**Props Count**: 2
**Lines to add**: ~25
**Complexity**: Medium (lazy-loaded wrapper)

---

## Implementation Plan

### Phase 1: Setup (10 minutes)

#### Step 1.1: Install PropTypes Package
```bash
npm install --save prop-types
```

**Verify**: Check `package.json` dependencies includes `"prop-types": "^15.8.1"`

#### Step 1.2: Create Shared PropTypes File
- **File**: `src/utils/propTypes.js`
- **Action**: Create new file with shared PropTypes definitions (see above)
- **Lines**: ~120 lines
- **Test**: Import in one block to verify no errors

### Phase 2: Add PropTypes to Blocks (5 hours)

Implement in order from **simple to complex** to build confidence:

#### Week 1: Simple Blocks (3 blocks, ~1.5 hours)

**Day 1: HeadingBlock** (30 min)
- File: `src/components/blocks/HeadingBlock.jsx`
- Props: 2 (simplest block)
- Add PropTypes at line ~3
- Test: Pass invalid props in dev mode, verify warnings

**Day 2: InlineImageBlock** (30 min)
- File: `src/components/blocks/InlineImageBlock.jsx`
- Props: 4
- Add PropTypes at line ~7
- Test: Verify image upload still works

**Day 3: TodoBlock** (30 min)
- File: `src/components/blocks/TodoBlock.jsx`
- Props: 2
- Add PropTypes at line ~21
- Test: Create/edit todos, verify no warnings

#### Week 1: Medium Complexity (4 blocks, ~2 hours)

**Day 4: CodeBlock** (30 min)
- File: `src/components/blocks/CodeBlock.jsx`
- Props: 4
- Add PropTypes at line ~5
- Test: Syntax highlighting, language switching

**Day 5: ImageBlock** (30 min)
- File: `src/components/blocks/ImageBlock.jsx`
- Props: 4
- Add PropTypes at line ~8
- Test: Upload images, verify both legacy and modern formats

**Day 6: AIBlockRefined** (30 min)
- File: `src/components/blocks/AIBlockRefined.jsx`
- Props: 2
- Add PropTypes at line ~6
- Test: Add messages, collapse/expand

**Day 7: OptimizedVersionTrackBlock + OptimizedIssueTrackerBlock** (30 min each)
- Files: Both optimized blocks
- Props: 2 each
- Add PropTypes to both
- Test: Verify lazy loading still works

#### Week 2: Complex Blocks (4 blocks, ~1.5 hours)

**Day 8: FileTreeBlock** (30 min)
- File: `src/components/blocks/FileTreeBlock.jsx`
- Props: 2 (but recursive structure)
- Add PropTypes at line ~444
- Test: Add folders/files, nest deeply

**Day 9: TextBlock** (45 min)
- File: `src/components/blocks/TextBlock.jsx`
- Props: 7 (most props)
- Add PropTypes at line ~9
- Test: All features (tags, paste, slash commands)

**Day 10: TableBlock** (45 min)
- File: `src/components/blocks/TableBlock.jsx`
- Props: 4 (complex nested data)
- Add PropTypes at line ~4
- Test: Add/remove rows/columns, alignments

### Phase 3: Testing & Validation (30 minutes)

#### Integration Testing
1. **Load existing document** - Verify no PropTypes warnings
2. **Create new blocks** - Test all 11 block types
3. **Test conversions** - Convert between block types
4. **Test edge cases**:
   - Pass null as block prop
   - Pass undefined as onUpdate
   - Pass string instead of function
   - Pass number instead of object

#### Validation Checklist
- [ ] All 11 blocks have PropTypes
- [ ] No console warnings in development
- [ ] Production build size not increased (PropTypes stripped)
- [ ] All existing features still work
- [ ] Invalid props show clear warnings

### Phase 4: Documentation (15 minutes)

#### Update Documentation
1. **README.md** - Add note about PropTypes
2. **CLAUDE.md** - Update development practices section
3. **Contributing guide** - Add PropTypes requirement for new blocks

---

## Testing Strategy

### Development Mode Testing

```javascript
// Test invalid prop types (should show warnings)

// Test 1: Invalid block object
<TextBlock
  block={null}  // ❌ Should warn: expected object, got null
  onUpdate={updateBlock}
/>

// Test 2: Missing required prop
<TextBlock
  block={{ id: '123', type: 'text' }}
  // ❌ Missing onUpdate - should warn
/>

// Test 3: Wrong function type
<CodeBlock
  block={{ id: '456', type: 'code' }}
  onUpdate="not a function"  // ❌ Should warn: expected func, got string
/>

// Test 4: Invalid block type
<HeadingBlock
  block={{ id: '789', type: 'invalid', content: 'Hello' }}
  // ❌ Should warn: type should be 'heading'
  onUpdate={updateBlock}
/>

// Test 5: Invalid nested data
<TableBlock
  block={{
    id: '101',
    type: 'table',
    data: {
      headers: "not an array",  // ❌ Should warn: expected array
      rows: []
    }
  }}
  onUpdate={updateBlock}
/>
```

### Production Mode Testing

```bash
# Build for production
npm run build

# Verify PropTypes code is stripped
# Should see significantly smaller bundle if PropTypes were large portion
```

### Automated Testing

```javascript
// Add to test files
describe('Block PropTypes', () => {
  // Suppress console errors for these tests
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('warns when block prop is null', () => {
    render(<TextBlock block={null} onUpdate={() => {}} />);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Failed prop type')
    );
  });

  it('warns when onUpdate is not a function', () => {
    const block = { id: '1', type: 'text', content: 'Hello' };
    render(<TextBlock block={block} onUpdate="invalid" />);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('expected `function`')
    );
  });
});
```

---

## Benefits & Impact

### Development Benefits

**1. Immediate Error Detection**
```
Before PropTypes:
User reports: "My code blocks are blank!"
You debug: 2 hours later find parent passing wrong prop

With PropTypes:
Console: "Warning: Failed prop type: The prop `block.content` is marked
as required in `CodeBlock`, but its value is `undefined`"
You fix: 2 minutes
```

**2. Self-Documenting Code**
```javascript
// Instead of reading 500 lines to understand props
// Read PropTypes definition in 20 lines:

TextBlock.propTypes = {
  block: PropTypes.shape({
    id: PropTypes.string.isRequired,    // Oh, ID is required
    content: PropTypes.string,          // Content is optional
    tags: PropTypes.arrayOf(PropTypes.string), // Tags are string array
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,  // onUpdate is required function
};
```

**3. Refactoring Safety**
```javascript
// You decide to change block structure:
// OLD: block.content
// NEW: block.data.content

// PropTypes catch ALL places that need updating:
// "Warning: Failed prop type: `block.content` is undefined in TextBlock"
// You find all 15 places instantly instead of hunting bugs
```

**4. Team Collaboration**
- New developer joins team
- PropTypes tell them exactly what props each component needs
- Clear contracts between components
- Reduces questions and onboarding time

### Production Benefits

**Zero Cost**
- PropTypes code is stripped during production build
- No runtime performance impact
- No bundle size increase
- Only benefits during development

---

## Potential Issues & Solutions

### Issue 1: Recursive TreeNode PropTypes

**Problem**: FileTreeBlock has recursive tree structure
```javascript
TreeNode {
  children: Array<TreeNode>  // Recursive!
}
```

**Solution**: PropTypes can't validate deep recursion, but can validate first level
```javascript
export const TreeNodePropType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  isFolder: PropTypes.bool.isRequired,
  children: PropTypes.array,  // Just validate it's an array
  content: PropTypes.string,
});
```

### Issue 2: Legacy Image Format

**Problem**: ImageBlock supports both old and new formats

**Solution**: Make both optional, validate at runtime
```javascript
ImageBlock.propTypes = {
  block: PropTypes.shape({
    // Modern format
    images: PropTypes.arrayOf(ImageDataPropType),
    // Legacy format (deprecated)
    url: PropTypes.string,
    alt: PropTypes.string,
  }).isRequired,
};
```

### Issue 3: Performance with Large Documents

**Problem**: PropTypes validation on 1000+ blocks might slow dev mode

**Solution**:
1. PropTypes only run in development
2. React.memo prevents unnecessary validations
3. If needed, can disable PropTypes: `NODE_ENV=production npm run dev`

### Issue 4: Complex Table Validation

**Problem**: TableBlock has deeply nested structure

**Solution**: Validate structure, not content
```javascript
data: PropTypes.shape({
  headers: PropTypes.arrayOf(PropTypes.string), // Validate type, not values
  rows: PropTypes.arrayOf(PropTypes.array),     // Validate structure
  // Don't validate every cell value
})
```

---

## Maintenance & Best Practices

### When Adding New Blocks

**Checklist for new block components**:
1. [ ] Import PropTypes from 'prop-types'
2. [ ] Import shared PropTypes from utils/propTypes
3. [ ] Define component.propTypes
4. [ ] Define component.defaultProps (if applicable)
5. [ ] Test with invalid props in dev mode
6. [ ] Update utils/propTypes.js if new shapes needed

### When Changing Block Structure

**Before**:
1. Check which blocks use the changed structure
2. Update PropTypes first
3. Run dev mode - PropTypes will show what breaks
4. Fix all warnings
5. Update unit tests

### PropTypes Style Guide

**Do**:
✅ Use shared PropTypes from utils/propTypes.js
✅ Mark truly required props as .isRequired
✅ Define defaultProps for optional props with defaults
✅ Use specific types (oneOf, arrayOf, shape)
✅ Add comments for complex structures

**Don't**:
❌ Don't use PropTypes.any (defeats the purpose)
❌ Don't mark everything as required (only what's actually required)
❌ Don't validate internal state (only props)
❌ Don't duplicate PropTypes across files (use shared)

---

## Rollout Timeline

### Conservative Approach (Recommended)

**Week 1**: Setup + 3 simple blocks
- Day 1: Install package, create shared PropTypes file
- Day 2-4: HeadingBlock, InlineImageBlock, TodoBlock

**Week 2**: 4 medium complexity blocks
- Day 1-4: CodeBlock, ImageBlock, AIBlock, OptimizedBlocks

**Week 3**: 4 complex blocks + testing
- Day 1-3: FileTreeBlock, TextBlock, TableBlock
- Day 4-5: Integration testing, documentation

### Aggressive Approach (Fast)

**Day 1**: Setup + all simple/medium (7 blocks)
**Day 2**: All complex blocks (4 blocks)
**Day 3**: Testing + documentation

---

## Code References

### Files to Create
- `src/utils/propTypes.js` - Shared PropTypes definitions

### Files to Modify (11 blocks)

| File | Line | Add Props | Complexity |
|------|------|-----------|------------|
| src/components/blocks/TextBlock.jsx | ~9 | 7 props | High |
| src/components/blocks/CodeBlock.jsx | ~5 | 4 props | Medium |
| src/components/blocks/HeadingBlock.jsx | ~3 | 2 props | Low |
| src/components/blocks/TableBlock.jsx | ~4 | 4 props | Very High |
| src/components/blocks/TodoBlock.jsx | ~21 | 2 props | Medium |
| src/components/blocks/FileTreeBlock.jsx | ~444 | 2 props | High |
| src/components/blocks/ImageBlock.jsx | ~8 | 4 props | Medium |
| src/components/blocks/InlineImageBlock.jsx | ~7 | 4 props | Low |
| src/components/blocks/AIBlockRefined.jsx | ~6 | 2 props | Medium |
| src/components/blocks/OptimizedVersionTrackBlock.jsx | ~82 | 2 props | Medium |
| src/components/blocks/OptimizedIssueTrackerBlock.jsx | ~96 | 2 props | Medium |

### Package to Install
```json
{
  "dependencies": {
    "prop-types": "^15.8.1"
  }
}
```

---

## Related Research
- thoughts/shared/research/2025-11-04-blocks-implementation-mistakes-verification.md
- thoughts/shared/research/2025-11-03-document-block-types-research.md

---

## Success Criteria

- [x] PropTypes package installed
- [ ] Shared PropTypes file created (src/utils/propTypes.js)
- [ ] All 11 blocks have PropTypes definitions
- [ ] All 11 blocks have defaultProps where applicable
- [ ] No PropTypes warnings in development with valid data
- [ ] PropTypes warnings appear with invalid data
- [ ] Production build successful (PropTypes stripped)
- [ ] All existing features work correctly
- [ ] Documentation updated

---

## Conclusion

Adding PropTypes to all 11 block components will:
1. **Catch bugs immediately** in development (not in production)
2. **Document prop contracts** clearly for all developers
3. **Enable safe refactoring** by identifying all affected code
4. **Cost nothing** in production (code is stripped)
5. **Take ~5-6 hours** to implement completely

**Recommendation**: Start with Phase 1 (setup) immediately, then implement blocks incrementally starting with simplest (HeadingBlock) to build confidence and establish patterns.

The investment of 5-6 hours will save countless hours of debugging prop-related issues and make the codebase more maintainable for the entire team.
