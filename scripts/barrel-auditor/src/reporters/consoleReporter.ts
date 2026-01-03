/**
 * Console Reporter - Pretty output for terminal
 */

import type { AuditResult, Issue, BarrelAnalysis } from '../types';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function generateConsoleReport(result: AuditResult): void {
  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  console.log(colorize('  BARREL FILE AUDIT REPORT', 'bold'));
  console.log(colorize('═'.repeat(60), 'cyan') + '\n');

  // Summary
  console.log(colorize('SUMMARY', 'bold'));
  console.log('─'.repeat(40));
  console.log(`  Barrels analyzed:    ${colorize(result.barrels.length.toString(), 'cyan')}`);
  console.log(`  Total issues:        ${result.totalIssues > 0 ? colorize(result.totalIssues.toString(), 'red') : colorize('0', 'green')}`);
  console.log(`  Critical (errors):   ${result.criticalIssues > 0 ? colorize(result.criticalIssues.toString(), 'red') : '0'}`);
  console.log(`  Warnings:            ${result.warnings > 0 ? colorize(result.warnings.toString(), 'yellow') : '0'}`);
  console.log(`  Affected consumers:  ${result.affectedConsumers}`);
  console.log();

  // Issues by barrel
  for (const barrel of result.barrels) {
    if (barrel.issues.length === 0) continue;

    console.log(colorize(`\n📁 ${simplifyPath(barrel.barrelPath)}`, 'bold'));
    console.log('─'.repeat(50));

    for (const issue of barrel.issues) {
      printIssue(issue);
    }
  }

  // Footer
  console.log('\n' + colorize('═'.repeat(60), 'cyan'));
  if (result.criticalIssues > 0) {
    console.log(colorize(`  ❌ ${result.criticalIssues} critical issues must be fixed`, 'red'));
  } else {
    console.log(colorize('  ✅ No critical issues found!', 'green'));
  }
  console.log(colorize('═'.repeat(60), 'cyan') + '\n');
}

function printIssue(issue: Issue): void {
  const icon = issue.severity === 'error' ? '❌' : '⚠️';
  const color = issue.severity === 'error' ? 'red' : 'yellow';

  console.log();
  console.log(`  ${icon} ${colorize(issue.type.toUpperCase().replace('_', ' '), color)}: ${colorize(issue.exportName, 'bold')}`);

  if (issue.expected) {
    console.log(`     Expected: ${colorize(issue.expected, 'green')}`);
  }
  if (issue.actual) {
    console.log(`     Actual:   ${colorize(issue.actual, 'red')}`);
  }
  if (issue.sourceFile) {
    console.log(`     Source:   ${colorize(simplifyPath(issue.sourceFile), 'dim')}`);
  }
  if (issue.affectedFiles.length > 0) {
    console.log(`     Affects:  ${issue.affectedFiles.map(f => simplifyPath(f)).join(', ')}`);
  }

  console.log(`     ${colorize('Fix:', 'cyan')} ${issue.suggestedFix}`);
}

function simplifyPath(filePath: string): string {
  // Remove absolute path prefix, keep relative to src/
  return filePath.replace(/.*\/src\//, 'src/').replace(/\\/g, '/');
}
