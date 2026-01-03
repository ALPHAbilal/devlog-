/**
 * Barrel File Auditor - Type Definitions
 * Following best practices from resources.md
 */

// Export metadata from source files
export interface ExportInfo {
  file: string;           // absolute path
  type: 'default' | 'named' | 'namespace' | 'default_as_named';
  name: string;           // export name
  source?: string;        // for re-exports: where it comes from
  isTypeOnly: boolean;    // TypeScript type-only export
  localName?: string;     // original name if renamed
}

// Import metadata from consumer files
export interface ImportInfo {
  file: string;           // consumer file path
  importedNames: string[];
  importPath: string;     // '@/features/storage/hooks'
  hasDefaultImport: boolean;
  defaultImportName?: string;
  isTypeOnly: boolean;
}

// Issue detection result
export interface Issue {
  type: 'missing_export' | 'wrong_syntax' | 'wrong_source' | 'unused_export' | 'default_mismatch';
  severity: 'error' | 'warning';
  barrel: string;
  exportName: string;
  expected?: string;       // what it should be
  actual?: string;         // what it is now
  sourceFile?: string;     // which source file has the export
  affectedFiles: string[]; // consumers affected
  suggestedFix: string;    // code to fix it
  lineNumber?: number;     // where in barrel file
}

// Barrel file analysis result
export interface BarrelAnalysis {
  barrelPath: string;
  exports: ExportInfo[];
  sourceFiles: string[];
  consumers: ImportInfo[];
  issues: Issue[];
}

// Full audit result
export interface AuditResult {
  barrels: BarrelAnalysis[];
  totalIssues: number;
  criticalIssues: number;
  warnings: number;
  affectedConsumers: number;
}

// Configuration
export interface AuditConfig {
  include: string[];
  exclude: string[];
  barrelPatterns: string[];
  aliases: Record<string, string>;
  rules: {
    'no-unused-exports': 'error' | 'warn' | 'off';
    'no-missing-exports': 'error' | 'warn' | 'off';
    'enforce-syntax': 'error' | 'warn' | 'off';
  };
}
