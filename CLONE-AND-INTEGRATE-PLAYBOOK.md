# The Clone & Integrate Playbook
*A systematic approach to finding, studying, and integrating existing solutions*

---

## Core Philosophy
**"Don't reinvent the wheel - find the best wheel, understand it, then adapt it."**

Three Rules:
1. **Working code > Perfect architecture**
2. **Copy first, customize second**
3. **Understand completely before modifying**

---

## Phase 1: Discovery & Selection (Day 1)

### 1.1 Find Candidates
```bash
# Search GitHub for similar projects
# Keywords: [your-feature] + [your-stack]
# Example: "notion clone" "supabase" "react"

# Sort by:
- Recently updated (active = good)
- Stars (popularity = tested)
- Issues (many closed = maintained)
```

### 1.2 Quick Evaluation Checklist
```markdown
□ Similar tech stack (React version, database, etc.)
□ Recently updated (< 6 months)
□ Has the specific feature you need
□ Good code structure (clean folders)
□ Has documentation/README
□ Active issues/discussions
□ License allows usage
```

### 1.3 Create Comparison Matrix
```markdown
| Repo | Stars | Last Update | Has Feature | Stack Match | Complexity | Notes |
|------|-------|-------------|-------------|-------------|------------|-------|
| repo1 | 500 | 2 days ago | ✅ Autosave | 90% match | Simple | Best candidate |
| repo2 | 1200 | 1 month ago | ✅ Autosave | 70% match | Complex | Overengineered |
| repo3 | 50 | 1 week ago | ⚠️ Manual save | 95% match | Simple | Could adapt |
```

---

## Phase 2: Deep Study (Day 2-3)

### 2.1 Clone and Run Locally
```bash
# Always run it first - see it working!
git clone https://github.com/USER/REPO.git study-[feature-name]
cd study-[feature-name]
npm install
npm run dev

# Create a study branch
git checkout -b study-notes
```

### 2.2 Document Structure Mapping
Create `STUDY-NOTES.md` in the cloned repo:

```markdown
# Study Notes - [Repo Name]

## How [Feature] Works

### Entry Points
- Main component: `/src/components/Editor.jsx`
- Save logic: `/src/hooks/useAutosave.js`
- Database calls: `/src/services/api.js`

### Data Flow
1. User types → onChange → updateBlock()
2. updateBlock → debounced → saveQueue.add()
3. saveQueue → batch → api.saveBlocks()
4. api.saveBlocks → supabase.upsert()

### Key Files to Copy
- [ ] `/src/hooks/useAutosave.js` - Main save logic
- [ ] `/src/utils/saveQueue.js` - Queue management
- [ ] `/src/services/api.js` - Supabase calls
- [ ] `/database/functions.sql` - RPC functions

### Dependencies Needed
- lodash (for debounce)
- No other special deps
```

### 2.3 Trace the Feature Path
```javascript
// Add console.logs to understand flow
console.log('🔍 STUDY: Save triggered', data);
console.log('🔍 STUDY: Queue state', queue);
console.log('🔍 STUDY: API call', payload);
console.log('🔍 STUDY: Response', result);
```

### 2.4 Test Edge Cases
```markdown
## Edge Cases Tested
- [ ] Save with 0 blocks
- [ ] Save with 100+ blocks  
- [ ] Rapid typing (spam saves)
- [ ] Network disconnect
- [ ] Concurrent edits
- [ ] Page refresh mid-save
```

---

## Phase 3: Extraction (Day 4)

### 3.1 Create Isolation Test
```bash
# Create minimal test project
mkdir test-[feature]
cd test-[feature]
npm init -y
npm install [minimal-deps]

# Copy ONLY the feature files
mkdir src
cp ../study-[feature]/src/hooks/useAutosave.js src/
cp ../study-[feature]/src/utils/saveQueue.js src/
```

### 3.2 Create Minimal Test Case
```javascript
// test.js - Verify the feature works in isolation
import { useAutosave } from './src/useAutosave';

// Minimal test data
const testBlocks = [
  { id: '1', content: 'Test' }
];

// Test the save
const save = useAutosave();
save(testBlocks);
// Verify it saves to database
```

### 3.3 Document Requirements
```markdown
## Extracted Requirements

### Database Schema Needed
- blocks table with: id, content, metadata
- documents table with: id, user_id

### Environment Variables
- SUPABASE_URL
- SUPABASE_ANON_KEY

### Assumptions Made
- Block IDs are UUIDs
- Content is plain text
- Saves are debounced 1.5s
```

---

## Phase 4: Integration (Day 5-6)

### 4.1 Create Feature Branch
```bash
# In YOUR project
git checkout -b integrate-[feature]-from-[repo]
```

### 4.2 Add Behind Feature Flag
```javascript
// Start with feature flag
const USE_NEW_SAVE = process.env.REACT_APP_NEW_SAVE === 'true';

if (USE_NEW_SAVE) {
  // New copied code
  return useAutosaveNew();
} else {
  // Keep existing code
  return useAutosaveOld();
}
```

### 4.3 Adaptation Checklist
```markdown
## Integration Steps

### Step 1: Direct Copy (Make it Run)
- [ ] Copy files exactly as is
- [ ] Add missing dependencies
- [ ] Fix import paths only
- [ ] Verify it compiles

### Step 2: Minimal Adaptation (Make it Work)  
- [ ] Update API endpoints
- [ ] Match field names (data → metadata)
- [ ] Update environment variables
- [ ] Test with your data

### Step 3: Gradual Customization (Make it Yours)
- [ ] Adjust debounce timing
- [ ] Add your error handling
- [ ] Match your UI/UX
- [ ] Add your logging
```

### 4.4 Side-by-Side Testing
```javascript
// Run both systems, compare results
const oldResult = await oldSave(blocks);
const newResult = await newSave(blocks);

console.assert(
  oldResult.count === newResult.count,
  'Save mismatch!'
);
```

---

## Phase 5: Validation (Day 7)

### 5.1 Testing Protocol
```markdown
## Test Scenarios

### Happy Path
- [ ] Save single block
- [ ] Save multiple blocks
- [ ] Edit existing blocks

### Edge Cases  
- [ ] Network failure
- [ ] Concurrent edits
- [ ] Large documents
- [ ] Rapid edits

### Performance
- [ ] Measure save time
- [ ] Check network calls
- [ ] Monitor memory usage
```

### 5.2 Rollback Plan
```markdown
## Rollback Procedure

1. **Immediate** (< 1 min)
   - Toggle feature flag off
   - Clear cache

2. **Clean** (< 5 min)
   - git revert [commit]
   - Deploy previous version

3. **Complete** (< 30 min)
   - Remove feature branch
   - Document what went wrong
   - Plan fixes
```

---

## Anti-Patterns to Avoid

### ❌ DON'T: Modify While Learning
```javascript
// BAD: Changing code before understanding it
const save = debounce(saveFunction, 5000); // "Let me optimize this"
```

### ❌ DON'T: Copy Without Running
Never copy code you haven't seen working

### ❌ DON'T: Integrate Everything at Once
Always integrate incrementally

### ❌ DON'T: Ignore the Database Schema
Schema mismatches cause 90% of integration failures

### ❌ DON'T: Skip the Isolation Test
If it doesn't work alone, it won't work integrated

---

## Templates

### Research Log Template
```markdown
# [Date] - [Feature] Research

## Repositories Examined
1. [repo] - [why chosen] - [outcome]

## Key Findings
- [What works]
- [What doesn't]
- [What to copy]

## Decision
Using [repo] because [reasons]
```

### Integration PR Template
```markdown
## Integrated [Feature] from [Source]

### Source
- Repository: [link]
- Files copied: [list]
- License: [verified]

### Changes Made
- [Minimal adaptations only]

### Testing Done
- [ ] Runs in isolation
- [ ] Passes all tests
- [ ] No regressions

### Rollback Plan
- Feature flag: NEW_SAVE
- Revert commits: [hashes]
```

---

## Quick Reference Commands

```bash
# Find similar repos
gh search repos "notion clone" --language=javascript --sort=stars

# Clone for study
git clone [repo] study-[date]-[feature]

# Compare implementations
diff -r repo1/src/feature repo2/src/feature

# Extract specific feature
git sparse-checkout set src/feature

# Test in isolation
npx create-react-app test-feature --template minimal
```

---

## Golden Rules

1. **Time Investment Ratio**
   - 20% finding candidates
   - 40% understanding the code
   - 30% testing in isolation
   - 10% actual integration

2. **Code Quality Signals**
   - Clean folder structure
   - Consistent naming
   - Recent commits
   - Closed issues > Open issues
   - Has tests

3. **Integration Safety**
   - Always use feature flags
   - Keep both systems running
   - Test with production data copy
   - Have rollback ready

4. **Documentation Discipline**
   - Document WHY you chose it
   - Document WHAT you changed
   - Document HOW to rollback

---

## Remember

**"The best code is code you didn't write."**

But when you do integrate:
- Understand it completely
- Test it thoroughly  
- Adapt it minimally
- Credit the source

This playbook is your systematic approach to leveraging existing solutions effectively.