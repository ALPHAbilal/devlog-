/**
 * Export Parser - AST-based export extraction
 * Uses @babel/parser for robust parsing
 */

import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as fs from 'fs';
import * as path from 'path';
import type { ExportInfo } from '../types';

export function extractExports(filePath: string): ExportInfo[] {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return [];
  }

  const code = fs.readFileSync(filePath, 'utf-8');
  const exports: ExportInfo[] = [];

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });

    traverse(ast, {
      // Handle: export { foo, bar } from './file'
      // Handle: export { default as Foo } from './file'
      // Handle: export { foo as bar } from './file'
      ExportNamedDeclaration(nodePath) {
        const node = nodePath.node;

        // Re-exports from another file
        if (node.source) {
          const source = node.source.value;

          for (const specifier of node.specifiers) {
            if (specifier.type === 'ExportSpecifier') {
              const exportedName = specifier.exported.type === 'Identifier'
                ? specifier.exported.name
                : specifier.exported.value;
              const localName = specifier.local.name;

              // Check if this is re-exporting a default as named
              const isDefaultAsNamed = localName === 'default';

              exports.push({
                file: filePath,
                type: isDefaultAsNamed ? 'default_as_named' : 'named',
                name: exportedName,
                localName: isDefaultAsNamed ? undefined : localName,
                source,
                isTypeOnly: node.exportKind === 'type',
              });
            } else if (specifier.type === 'ExportNamespaceSpecifier') {
              exports.push({
                file: filePath,
                type: 'namespace',
                name: specifier.exported.name,
                source,
                isTypeOnly: false,
              });
            }
          }
        } else {
          // Direct exports: export const foo = ..., export function bar() {}
          if (node.declaration) {
            const decl = node.declaration;

            if (decl.type === 'VariableDeclaration') {
              for (const declarator of decl.declarations) {
                if (declarator.id.type === 'Identifier') {
                  exports.push({
                    file: filePath,
                    type: 'named',
                    name: declarator.id.name,
                    isTypeOnly: false,
                  });
                }
              }
            } else if (decl.type === 'FunctionDeclaration' && decl.id) {
              exports.push({
                file: filePath,
                type: 'named',
                name: decl.id.name,
                isTypeOnly: false,
              });
            } else if (decl.type === 'ClassDeclaration' && decl.id) {
              exports.push({
                file: filePath,
                type: 'named',
                name: decl.id.name,
                isTypeOnly: false,
              });
            } else if (decl.type === 'TSTypeAliasDeclaration' || decl.type === 'TSInterfaceDeclaration') {
              exports.push({
                file: filePath,
                type: 'named',
                name: decl.id.name,
                isTypeOnly: true,
              });
            }
          }

          // Named exports without declaration: export { foo, bar }
          for (const specifier of node.specifiers) {
            if (specifier.type === 'ExportSpecifier') {
              const exportedName = specifier.exported.type === 'Identifier'
                ? specifier.exported.name
                : specifier.exported.value;
              exports.push({
                file: filePath,
                type: 'named',
                name: exportedName,
                localName: specifier.local.name,
                isTypeOnly: node.exportKind === 'type',
              });
            }
          }
        }
      },

      // Handle: export default foo
      ExportDefaultDeclaration(nodePath) {
        const node = nodePath.node;
        let name = 'default';

        if (node.declaration) {
          if (node.declaration.type === 'Identifier') {
            name = node.declaration.name;
          } else if (node.declaration.type === 'FunctionDeclaration' && node.declaration.id) {
            name = node.declaration.id.name;
          } else if (node.declaration.type === 'ClassDeclaration' && node.declaration.id) {
            name = node.declaration.id.name;
          }
        }

        exports.push({
          file: filePath,
          type: 'default',
          name,
          isTypeOnly: false,
        });
      },

      // Handle: export * from './file'
      ExportAllDeclaration(nodePath) {
        const node = nodePath.node;
        exports.push({
          file: filePath,
          type: 'namespace',
          name: '*',
          source: node.source.value,
          isTypeOnly: node.exportKind === 'type',
        });
      },
    });
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, (error as Error).message);
  }

  return exports;
}

// Get all exports from a source file (what it actually exports, not re-exports)
export function getSourceFileExports(filePath: string): ExportInfo[] {
  const exports = extractExports(filePath);
  // Filter out re-exports (those with source) to get actual exports
  return exports.filter(exp => !exp.source);
}
