/**
 * Import Parser - AST-based import extraction
 * Uses @babel/parser for robust parsing
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import type { ImportInfo } from '../types';

export function extractImports(filePath: string): ImportInfo[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const code = fs.readFileSync(filePath, 'utf-8');
  const imports: ImportInfo[] = [];

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });

    traverse(ast, {
      ImportDeclaration(nodePath) {
        const node = nodePath.node;
        const importPath = node.source.value;
        const importedNames: string[] = [];
        let hasDefaultImport = false;
        let defaultImportName: string | undefined;

        for (const specifier of node.specifiers) {
          if (specifier.type === 'ImportDefaultSpecifier') {
            hasDefaultImport = true;
            defaultImportName = specifier.local.name;
          } else if (specifier.type === 'ImportSpecifier') {
            const importedName = specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : specifier.imported.value;
            importedNames.push(importedName);
          } else if (specifier.type === 'ImportNamespaceSpecifier') {
            importedNames.push('*');
          }
        }

        imports.push({
          file: filePath,
          importPath,
          importedNames,
          hasDefaultImport,
          defaultImportName,
          isTypeOnly: node.importKind === 'type',
        });
      },
    });
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, (error as Error).message);
  }

  return imports;
}

// Filter imports that target a specific barrel path
export function getImportsForBarrel(
  allImports: ImportInfo[],
  barrelPath: string,
  aliases: Record<string, string>
): ImportInfo[] {
  return allImports.filter(imp => {
    const resolvedPath = resolveImportPath(imp.importPath, aliases);
    return (
      resolvedPath === barrelPath ||
      resolvedPath === barrelPath.replace(/\/index\.(ts|js)$/, '') ||
      imp.importPath.includes(barrelPath.replace(/.*src\//, '@/').replace(/\/index\.(ts|js)$/, ''))
    );
  });
}

// Resolve import path with aliases
function resolveImportPath(importPath: string, aliases: Record<string, string>): string {
  for (const [alias, target] of Object.entries(aliases)) {
    if (importPath.startsWith(alias)) {
      return importPath.replace(alias, target);
    }
  }
  return importPath;
}
