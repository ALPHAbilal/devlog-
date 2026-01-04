/**
 * Path Resolver - Handle module path resolution with aliases
 */

import * as path from 'path';
import * as fs from 'fs';

export interface PathConfig {
  baseUrl: string;
  aliases: Record<string, string>;
}

// Load path aliases from tsconfig.json
export function loadPathConfig(projectRoot: string): PathConfig {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  try {
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    // Remove comments from JSON (tsconfig allows them)
    const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const tsconfig = JSON.parse(cleanContent);

    const compilerOptions = tsconfig.compilerOptions || {};
    const baseUrl = compilerOptions.baseUrl || '.';
    const paths = compilerOptions.paths || {};

    const aliases: Record<string, string> = {};
    for (const [alias, targets] of Object.entries(paths)) {
      // Convert '@/*' to '@/' and ['./src/*'] to './src/'
      const cleanAlias = alias.replace('/*', '/');
      const cleanTarget = (targets as string[])[0]?.replace('/*', '/') || '';
      aliases[cleanAlias] = cleanTarget;
    }

    return { baseUrl, aliases };
  } catch (error) {
    console.warn('Could not load tsconfig.json, using defaults');
    return {
      baseUrl: '.',
      aliases: { '@/': './src/' },
    };
  }
}

// Resolve an import path to absolute file path
export function resolveToAbsolute(
  importPath: string,
  fromFile: string,
  config: PathConfig,
  projectRoot: string
): string {
  let resolved = importPath;

  // Handle aliases
  for (const [alias, target] of Object.entries(config.aliases)) {
    if (importPath.startsWith(alias)) {
      resolved = importPath.replace(alias, target);
      break;
    }
  }

  // Handle relative paths
  if (resolved.startsWith('.')) {
    resolved = path.resolve(path.dirname(fromFile), resolved);
  } else if (!path.isAbsolute(resolved)) {
    resolved = path.join(projectRoot, config.baseUrl, resolved);
  }

  // Try to find the actual file
  const extensions = ['.ts', '.tsx', '.js', '.jsx', ''];
  for (const ext of extensions) {
    // Try direct file
    const directPath = resolved + ext;
    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
      return directPath;
    }

    // Try index file in directory
    const indexPath = path.join(resolved, `index${ext || '.ts'}`);
    if (fs.existsSync(indexPath)) {
      return indexPath;
    }
  }

  return resolved;
}

// Convert absolute path to import path for reporting
export function toImportPath(absolutePath: string, projectRoot: string, aliases: Record<string, string>): string {
  let relative = path.relative(projectRoot, absolutePath);

  // Convert back to alias format
  for (const [alias, target] of Object.entries(aliases)) {
    const targetClean = target.replace('./', '');
    if (relative.startsWith(targetClean)) {
      return relative.replace(targetClean, alias);
    }
  }

  return relative;
}

// Find all barrel files in the project
export function findBarrelFiles(projectRoot: string, patterns: string[]): string[] {
  const barrels: string[] = [];

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and other excluded dirs
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        scanDir(fullPath);
      } else if (entry.isFile()) {
        // Check if it's a barrel file
        if (entry.name === 'index.ts' || entry.name === 'index.js' || entry.name === 'index.tsx') {
          barrels.push(fullPath);
        }
      }
    }
  }

  scanDir(path.join(projectRoot, 'src'));
  return barrels;
}

// Find all source files that could be exported from a barrel
export function findSourceFilesInDir(barrelDir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(barrelDir)) return files;

  const entries = fs.readdirSync(barrelDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(barrelDir, entry.name);

    if (entry.isFile()) {
      // Skip the barrel file itself and test files
      if (entry.name.startsWith('index.') || entry.name.includes('.test.') || entry.name.includes('.spec.')) {
        continue;
      }

      if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

// Find all potential consumer files
export function findConsumerFiles(projectRoot: string): string[] {
  const files: string[] = [];

  function scanDir(dir: string) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
          continue;
        }
        scanDir(fullPath);
      } else if (entry.isFile()) {
        if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          files.push(fullPath);
        }
      }
    }
  }

  scanDir(path.join(projectRoot, 'src'));
  return files;
}
