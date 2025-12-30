# Phase 3: Block Contracts (TypeScript Interfaces)

> **Goal**: Define TypeScript interfaces for all block types, creating compile-time safety.

**Status**: Overview Only - Will generate detailed plan when starting this phase.

---

## Best Practices for This Phase

### Interface Design Rules
1. **Interface-first, implementation-second** - Define types before coding
2. **Readonly by default** - Mark mutable fields explicitly
3. **Discriminated unions for block types** - `type` field as discriminator
4. **No optional unless truly optional** - Undefined is a bug source
5. **Generic where appropriate** - `BlockComponent<T extends BlockData>`

### Block Contract Rules
1. **Every block implements BlockComponentProps** - No exceptions
2. **onUpdate signature is sacred** - `(id: string, updates: Partial<BlockData>) => void`
3. **Block data is serializable** - No functions, no circular refs
4. **Metadata is typed** - Not `Record<string, any>`
5. **Position is required** - Blocks always have position

### Migration Rules
1. **Add types to existing code first** - JSDoc bridge before .tsx
2. **One block type at a time** - TextBlock → CodeBlock → etc.
3. **Test after each conversion** - Verify runtime behavior unchanged
4. **Type errors are bugs** - Fix immediately, don't suppress

### Validation Rules
1. **Zod schemas match TypeScript types** - Single source of truth
2. **Validate at boundaries** - API responses, user input
3. **Runtime validation in dev** - Catch mismatches early
4. **No validation in hot paths** - Performance matters

### Documentation Rules
1. **JSDoc on all public interfaces** - IDE hints
2. **Examples in comments** - Show valid usage
3. **Link to related types** - `@see BlockData`

---

## Objectives

1. Define `BlockComponent` interface (what every block must implement)
2. Define `BlockData` base type and variants for each block type
3. Create type-safe block registry
4. Add JSDoc bridge to existing .jsx files
5. Convert critical blocks to .tsx

---

## Core Interfaces (Preview)

```typescript
// entities/Block/Block.types.ts

export type BlockType =
  | 'text'
  | 'code'
  | 'heading'
  | 'table'
  | 'todo'
  | 'ai'
  | 'image'
  | 'inline-image'
  | 'filetree'
  | 'issue-tracker';

export interface BlockData {
  id: string;
  type: BlockType;
  content: string;
  data?: Record<string, unknown>;
  metadata?: BlockMetadata;
  position: number;
  created_at: number;
  isNew?: boolean;
}

export interface BlockComponentProps {
  block: BlockData;
  onUpdate: (id: string, updates: Partial<BlockData>) => void;
  onConvert?: (newType: BlockType) => void;
  onAddBelow?: (type: BlockType) => void;
  readOnly?: boolean;
}

// Each block type extends this
export interface TextBlockData extends BlockData {
  type: 'text';
  tags?: string[];
}

export interface CodeBlockData extends BlockData {
  type: 'code';
  language: string;
  filePath?: string;
}

// ... more block-specific types
```

---

## High-Level Steps

1. Create `entities/Block/` with type definitions
2. Define base `BlockData` interface
3. Define each block-specific data type
4. Define `BlockComponentProps` interface
5. Create type-safe block registry
6. Add JSDoc to existing blocks (for gradual migration)
7. Convert TextBlock and CodeBlock to .tsx as proof

---

## Success Criteria

### Automated
- [ ] All block types have TypeScript definitions
- [ ] Block registry is type-safe
- [ ] `npm run typecheck` passes
- [ ] At least 2 blocks converted to .tsx

### Manual
- [ ] IDE shows proper autocomplete for block props
- [ ] Type errors caught at compile time
- [ ] Blocks still function correctly

---

## Estimated Duration

~1 week

---

## Depends On

- Phase 2 complete (FSD structure with entities/ layer)

---

## Detailed Plan

*To be generated when this phase starts.*

---

*Phase 3 of Document Page Architecture Refactor*
