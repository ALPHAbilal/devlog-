/**
 * Issue Detector - Compare exports and imports to find problems
 */

import * as path from 'path';
import type { ExportInfo, ImportInfo, Issue } from '../types';
import { extractExports, getSourceFileExports } from '../parsers/exportParser';
import { extractImports } from '../parsers/importParser';
import { findSourceFilesInDir, resolveToAbsolute, PathConfig } from '../utils/pathResolver';

export interface DetectionContext {
  barrelPath: string;
  barrelExports: ExportInfo[];
  sourceFiles: string[];
  sourceExports: Map<string, ExportInfo[]>; // file -> exports
  consumers: ImportInfo[];
  projectRoot: string;
  pathConfig: PathConfig;
}

export function detectIssues(context: DetectionContext): Issue[] {
  const issues: Issue[] = [];

  // 1. Check for exports in barrel that don't exist in source files
  issues.push(...detectWrongSourceExports(context));

  // 2. Check for missing exports that consumers need
  issues.push(...detectMissingExports(context));

  // 3. Check for default vs named export mismatches
  issues.push(...detectDefaultMismatches(context));

  // 4. Check for wrong source file references in barrel
  issues.push(...detectWrongSourceReferences(context));

  return issues;
}

// Detect when barrel exports something that source file doesn't export
function detectWrongSourceExports(context: DetectionContext): Issue[] {
  const issues: Issue[] = [];

  for (const barrelExport of context.barrelExports) {
    // Skip namespace exports (export * from)
    if (barrelExport.type === 'namespace' && barrelExport.name === '*') {
      continue;
    }

    // If it's a re-export, check if source file has it
    if (barrelExport.source) {
      const sourceFile = resolveToAbsolute(
        barrelExport.source,
        context.barrelPath,
        context.pathConfig,
        context.projectRoot
      );

      const sourceExports = context.sourceExports.get(sourceFile) || [];

      // What are we looking for in the source?
      const lookingFor = barrelExport.localName || barrelExport.name;
      const isLookingForDefault = lookingFor === 'default' || barrelExport.type === 'default_as_named';

      let found = false;
      for (const sourceExp of sourceExports) {
        if (isLookingForDefault) {
          if (sourceExp.type === 'default') {
            found = true;
            break;
          }
        } else {
          if (sourceExp.name === lookingFor && sourceExp.type !== 'default') {
            found = true;
            break;
          }
        }
      }

      if (!found) {
        // Check what the source file actually exports
        const actualExports = sourceExports.map(e =>
          e.type === 'default' ? `default (${e.name})` : e.name
        ).join(', ');

        const suggestedFix = generateSuggestedFix(barrelExport, sourceExports);

        issues.push({
          type: 'wrong_source',
          severity: 'error',
          barrel: context.barrelPath,
          exportName: barrelExport.name,
          expected: isLookingForDefault ? 'default export' : `named export "${lookingFor}"`,
          actual: actualExports || 'nothing',
          sourceFile,
          affectedFiles: [],
          suggestedFix,
        });
      }
    }
  }

  return issues;
}

// Detect when consumers import something that barrel doesn't export
function detectMissingExports(context: DetectionContext): Issue[] {
  const issues: Issue[] = [];

  // Build set of what barrel exports
  const barrelExportNames = new Set<string>();
  let hasDefaultExport = false;

  for (const exp of context.barrelExports) {
    if (exp.type === 'namespace' && exp.name === '*') {
      // Star exports re-export everything from source
      continue;
    }
    barrelExportNames.add(exp.name);
    if (exp.type === 'default' || exp.name === 'default') {
      hasDefaultExport = true;
    }
  }

  // Check each consumer's imports
  for (const consumer of context.consumers) {
    // Check named imports
    for (const importedName of consumer.importedNames) {
      if (!barrelExportNames.has(importedName)) {
        // Find where this export might actually exist
        const possibleSource = findExportInSources(importedName, context);

        issues.push({
          type: 'missing_export',
          severity: 'error',
          barrel: context.barrelPath,
          exportName: importedName,
          expected: `export { ${importedName} }`,
          actual: 'not exported',
          sourceFile: possibleSource?.file,
          affectedFiles: [consumer.file],
          suggestedFix: possibleSource
            ? `export { ${importedName} } from '${possibleSource.relativePath}';`
            : `// Could not find source for ${importedName}`,
        });
      }
    }

    // Check default import
    if (consumer.hasDefaultImport && !hasDefaultExport) {
      issues.push({
        type: 'default_mismatch',
        severity: 'error',
        barrel: context.barrelPath,
        exportName: 'default',
        expected: 'default export',
        actual: 'no default export',
        affectedFiles: [consumer.file],
        suggestedFix: `export { default } from './primary-module';`,
      });
    }
  }

  return issues;
}

// Detect default vs named export mismatches
function detectDefaultMismatches(context: DetectionContext): Issue[] {
  const issues: Issue[] = [];

  for (const barrelExport of context.barrelExports) {
    if (barrelExport.type === 'default_as_named' && barrelExport.source) {
      // Barrel is doing: export { default as Foo } from './file'
      // Check if source file has a default export
      const sourceFile = resolveToAbsolute(
        barrelExport.source,
        context.barrelPath,
        context.pathConfig,
        context.projectRoot
      );

      const sourceExports = context.sourceExports.get(sourceFile) || [];
      const hasDefault = sourceExports.some(e => e.type === 'default');

      if (!hasDefault) {
        // Maybe it has a named export with the same name?
        const hasNamed = sourceExports.some(e => e.name === barrelExport.name && e.type === 'named');

        issues.push({
          type: 'wrong_syntax',
          severity: 'error',
          barrel: context.barrelPath,
          exportName: barrelExport.name,
          expected: hasNamed
            ? `export { ${barrelExport.name} } from '${barrelExport.source}'`
            : 'default export in source',
          actual: `export { default as ${barrelExport.name} }`,
          sourceFile,
          affectedFiles: [],
          suggestedFix: hasNamed
            ? `export { ${barrelExport.name} } from '${barrelExport.source}';`
            : `// Source file needs: export default ${barrelExport.name}`,
        });
      }
    }
  }

  return issues;
}

// Detect when barrel references wrong source file
function detectWrongSourceReferences(context: DetectionContext): Issue[] {
  const issues: Issue[] = [];
  const barrelDir = path.dirname(context.barrelPath);

  for (const barrelExport of context.barrelExports) {
    if (barrelExport.source) {
      const sourceFile = resolveToAbsolute(
        barrelExport.source,
        context.barrelPath,
        context.pathConfig,
        context.projectRoot
      );

      // Check if the resolved source file exists
      const fs = require('fs');
      if (!fs.existsSync(sourceFile)) {
        // Try to find the export in other files
        const possibleSource = findExportInSources(
          barrelExport.localName || barrelExport.name,
          context
        );

        if (possibleSource) {
          issues.push({
            type: 'wrong_source',
            severity: 'error',
            barrel: context.barrelPath,
            exportName: barrelExport.name,
            expected: possibleSource.relativePath,
            actual: barrelExport.source,
            sourceFile: possibleSource.file,
            affectedFiles: [],
            suggestedFix: `export { ${barrelExport.name} } from '${possibleSource.relativePath}';`,
          });
        }
      }
    }
  }

  return issues;
}

// Helper: Find where an export actually exists
function findExportInSources(
  exportName: string,
  context: DetectionContext
): { file: string; relativePath: string } | null {
  const barrelDir = path.dirname(context.barrelPath);

  for (const [file, exports] of context.sourceExports.entries()) {
    for (const exp of exports) {
      if (exp.name === exportName || (exp.type === 'default' && exportName === 'default')) {
        const relativePath = './' + path.relative(barrelDir, file)
          .replace(/\\/g, '/')
          .replace(/\.(ts|tsx|js|jsx)$/, '');
        return { file, relativePath };
      }
    }
  }

  return null;
}

// Helper: Generate suggested fix based on what source exports
function generateSuggestedFix(barrelExport: ExportInfo, sourceExports: ExportInfo[]): string {
  // If looking for named but source has default
  const hasDefault = sourceExports.some(e => e.type === 'default');
  const hasNamed = sourceExports.some(e => e.name === barrelExport.name && e.type === 'named');

  if (barrelExport.type === 'default_as_named') {
    if (!hasDefault && hasNamed) {
      return `export { ${barrelExport.name} } from '${barrelExport.source}';`;
    }
  }

  if (barrelExport.type === 'named' && !hasNamed && hasDefault) {
    return `export { default as ${barrelExport.name} } from '${barrelExport.source}';`;
  }

  // List available exports
  const available = sourceExports.map(e => e.name).join(', ');
  return `// Available exports: ${available || 'none'}`;
}
