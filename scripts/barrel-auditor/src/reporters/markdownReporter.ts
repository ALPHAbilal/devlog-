/**
 * Markdown Reporter - Generate markdown report file
 */

import type { AuditResult, Issue, BarrelAnalysis } from '../types';

export function generateMarkdownReport(result: AuditResult): string {
  const lines: string[] = [];

  // Header
  lines.push('# Barrel File Audit Report');
  lines.push('');
  lines.push(`> Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Barrels analyzed | ${result.barrels.length} |`);
  lines.push(`| Total issues | ${result.totalIssues} |`);
  lines.push(`| Critical (errors) | ${result.criticalIssues} |`);
  lines.push(`| Warnings | ${result.warnings} |`);
  lines.push(`| Affected consumers | ${result.affectedConsumers} |`);
  lines.push('');

  // Quick fix section
  if (result.criticalIssues > 0) {
    lines.push('## Quick Fixes');
    lines.push('');
    lines.push('Copy and apply these fixes to resolve all critical issues:');
    lines.push('');

    for (const barrel of result.barrels) {
      const criticalIssues = barrel.issues.filter(i => i.severity === 'error');
      if (criticalIssues.length === 0) continue;

      lines.push(`### \`${simplifyPath(barrel.barrelPath)}\``);
      lines.push('');
      lines.push('```typescript');
      for (const issue of criticalIssues) {
        lines.push(`// Fix: ${issue.type} - ${issue.exportName}`);
        lines.push(issue.suggestedFix);
      }
      lines.push('```');
      lines.push('');
    }
  }

  // Detailed issues
  lines.push('## Detailed Issues');
  lines.push('');

  for (const barrel of result.barrels) {
    if (barrel.issues.length === 0) {
      lines.push(`### ✅ \`${simplifyPath(barrel.barrelPath)}\``);
      lines.push('');
      lines.push('No issues found.');
      lines.push('');
      continue;
    }

    const errorCount = barrel.issues.filter(i => i.severity === 'error').length;
    const warnCount = barrel.issues.filter(i => i.severity === 'warning').length;

    lines.push(`### ${errorCount > 0 ? '❌' : '⚠️'} \`${simplifyPath(barrel.barrelPath)}\``);
    lines.push('');
    lines.push(`**Issues:** ${errorCount} errors, ${warnCount} warnings`);
    lines.push('');

    lines.push('| Type | Export | Expected | Actual | Fix |');
    lines.push('|------|--------|----------|--------|-----|');

    for (const issue of barrel.issues) {
      const icon = issue.severity === 'error' ? '🔴' : '🟡';
      lines.push(`| ${icon} ${issue.type} | \`${issue.exportName}\` | ${issue.expected || '-'} | ${issue.actual || '-'} | \`${escapeMarkdown(issue.suggestedFix)}\` |`);
    }

    lines.push('');

    // Affected files
    const affectedFiles = new Set<string>();
    for (const issue of barrel.issues) {
      for (const file of issue.affectedFiles) {
        affectedFiles.add(file);
      }
    }

    if (affectedFiles.size > 0) {
      lines.push('**Affected consumers:**');
      lines.push('');
      for (const file of affectedFiles) {
        lines.push(`- \`${simplifyPath(file)}\``);
      }
      lines.push('');
    }
  }

  // Barrels with no issues
  const cleanBarrels = result.barrels.filter(b => b.issues.length === 0);
  if (cleanBarrels.length > 0) {
    lines.push('## Clean Barrels');
    lines.push('');
    lines.push('These barrel files have no issues:');
    lines.push('');
    for (const barrel of cleanBarrels) {
      lines.push(`- ✅ \`${simplifyPath(barrel.barrelPath)}\``);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function simplifyPath(filePath: string): string {
  return filePath.replace(/.*\/src\//, 'src/').replace(/\\/g, '/');
}

function escapeMarkdown(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .slice(0, 80);
}
