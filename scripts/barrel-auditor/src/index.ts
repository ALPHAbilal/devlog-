/**
 * Barrel File Auditor - Main Entry Point
 *
 * Systematically audits all barrel files (index.ts) to find:
 * - Missing exports that consumers need
 * - Wrong export syntax (default vs named)
 * - Exports that don't exist in source files
 * - Wrong source file references
 */

import * as fs from 'fs';
import * as path from 'path';
import type { AuditResult, BarrelAnalysis, ExportInfo, ImportInfo, Issue } from './types';
import { extractExports, getSourceFileExports } from './parsers/exportParser';
import { extractImports } from './parsers/importParser';
import {
  loadPathConfig,
  findBarrelFiles,
  findSourceFilesInDir,
  findConsumerFiles,
  resolveToAbsolute,
  PathConfig,
} from './utils/pathResolver';
import { detectIssues, DetectionContext } from './analyzers/issueDetector';
import { generateConsoleReport } from './reporters/consoleReporter';
import { generateMarkdownReport } from './reporters/markdownReporter';

export interface AuditOptions {
  projectRoot: string;
  outputFormat?: 'console' | 'markdown' | 'json';
  outputFile?: string;
  barrelFilter?: string; // Only audit specific barrel
}

export async function runAudit(options: AuditOptions): Promise<AuditResult> {
  const { projectRoot, barrelFilter } = options;

  console.log('🔍 Loading configuration...');
  const pathConfig = loadPathConfig(projectRoot);

  console.log('📁 Finding barrel files...');
  let barrelFiles = findBarrelFiles(projectRoot, ['**/index.ts', '**/index.js']);

  // Filter if specific barrel requested
  if (barrelFilter) {
    barrelFiles = barrelFiles.filter(f => f.includes(barrelFilter));
  }

  console.log(`   Found ${barrelFiles.length} barrel files`);

  console.log('📄 Finding consumer files...');
  const consumerFiles = findConsumerFiles(projectRoot);
  console.log(`   Found ${consumerFiles.length} potential consumer files`);

  console.log('🔬 Parsing all files...');

  // Parse all consumer imports once
  const allImports: ImportInfo[] = [];
  for (const file of consumerFiles) {
    const imports = extractImports(file);
    allImports.push(...imports);
  }

  console.log(`   Parsed ${allImports.length} import statements`);

  console.log('🔎 Analyzing barrels...');
  const barrelAnalyses: BarrelAnalysis[] = [];

  for (const barrelPath of barrelFiles) {
    const analysis = analyzeBarrel(barrelPath, allImports, pathConfig, projectRoot);
    barrelAnalyses.push(analysis);
  }

  // Calculate summary stats
  let totalIssues = 0;
  let criticalIssues = 0;
  let warnings = 0;
  const affectedConsumersSet = new Set<string>();

  for (const analysis of barrelAnalyses) {
    totalIssues += analysis.issues.length;
    for (const issue of analysis.issues) {
      if (issue.severity === 'error') {
        criticalIssues++;
      } else {
        warnings++;
      }
      for (const file of issue.affectedFiles) {
        affectedConsumersSet.add(file);
      }
    }
  }

  const result: AuditResult = {
    barrels: barrelAnalyses,
    totalIssues,
    criticalIssues,
    warnings,
    affectedConsumers: affectedConsumersSet.size,
  };

  return result;
}

function analyzeBarrel(
  barrelPath: string,
  allImports: ImportInfo[],
  pathConfig: PathConfig,
  projectRoot: string
): BarrelAnalysis {
  const barrelDir = path.dirname(barrelPath);

  // 1. Get what the barrel exports
  const barrelExports = extractExports(barrelPath);

  // 2. Find source files in the same directory
  const sourceFiles = findSourceFilesInDir(barrelDir);

  // Also find source files referenced by barrel re-exports
  const referencedFiles = new Set<string>();
  for (const exp of barrelExports) {
    if (exp.source) {
      const resolved = resolveToAbsolute(exp.source, barrelPath, pathConfig, projectRoot);
      referencedFiles.add(resolved);
    }
  }

  const allSourceFiles = [...new Set([...sourceFiles, ...referencedFiles])];

  // 3. Parse source file exports
  const sourceExports = new Map<string, ExportInfo[]>();
  for (const sourceFile of allSourceFiles) {
    if (fs.existsSync(sourceFile)) {
      const exports = getSourceFileExports(sourceFile);
      sourceExports.set(sourceFile, exports);
    }
  }

  // 4. Find consumers that import from this barrel
  const barrelImportPath = barrelPath
    .replace(projectRoot, '')
    .replace(/^\/src\//, '@/')
    .replace(/\/index\.(ts|js|tsx)$/, '')
    .replace(/\\/g, '/');

  const consumers = allImports.filter(imp => {
    // Match various import path formats
    const normalized = imp.importPath.replace(/\/index$/, '');
    return (
      normalized === barrelImportPath ||
      normalized === barrelImportPath + '/index' ||
      imp.importPath.endsWith(barrelImportPath.replace('@/', ''))
    );
  });

  // 5. Detect issues
  const context: DetectionContext = {
    barrelPath,
    barrelExports,
    sourceFiles: allSourceFiles,
    sourceExports,
    consumers,
    projectRoot,
    pathConfig,
  };

  const issues = detectIssues(context);

  return {
    barrelPath,
    exports: barrelExports,
    sourceFiles: allSourceFiles,
    consumers,
    issues,
  };
}

// CLI Entry Point
async function main() {
  const args = process.argv.slice(2);

  const options: AuditOptions = {
    projectRoot: process.cwd(),
    outputFormat: 'console',
  };

  // Parse args
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--format' || arg === '-f') {
      options.outputFormat = args[++i] as AuditOptions['outputFormat'];
    } else if (arg === '--output' || arg === '-o') {
      options.outputFile = args[++i];
    } else if (arg === '--barrel' || arg === '-b') {
      options.barrelFilter = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Barrel File Auditor

Usage: npx ts-node scripts/barrel-auditor/src/index.ts [options]

Options:
  -f, --format <type>   Output format: console, markdown, json (default: console)
  -o, --output <file>   Write report to file
  -b, --barrel <path>   Only audit barrel files matching path
  -h, --help            Show this help
`);
      process.exit(0);
    }
  }

  try {
    const result = await runAudit(options);

    // Output results
    switch (options.outputFormat) {
      case 'markdown':
        const md = generateMarkdownReport(result);
        if (options.outputFile) {
          fs.writeFileSync(options.outputFile, md);
          console.log(`\n📝 Report written to ${options.outputFile}`);
        } else {
          console.log(md);
        }
        break;

      case 'json':
        const json = JSON.stringify(result, null, 2);
        if (options.outputFile) {
          fs.writeFileSync(options.outputFile, json);
          console.log(`\n📝 Report written to ${options.outputFile}`);
        } else {
          console.log(json);
        }
        break;

      default:
        generateConsoleReport(result);
    }

    // Exit with error code if critical issues found
    if (result.criticalIssues > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { generateConsoleReport, generateMarkdownReport };
