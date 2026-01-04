/**
 * Block Entity - Re-exports for FSD external access
 *
 * Source of truth: src/features/block/lib/schemas.ts
 *
 * This barrel provides cross-feature entity access following
 * Feature-Sliced Design (FSD) patterns.
 */

// Schemas and types
export * from '@/features/block/lib/schemas';

// Repository
export { BlockRepository, blockRepository } from './Block.repository';
