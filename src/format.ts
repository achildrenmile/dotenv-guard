/**
 * Human-friendly formatting of validation findings for terminal/CI output.
 *
 * INVARIANT (see issues/03-secret-safety.md): never print a secret's value.
 * This module only ever renders Finding.message/variable, which the
 * validator guarantees are free of raw secret values.
 */

import type { Finding, Severity } from './validator.js';

function sym(severity: Severity, color: boolean): string {
  if (severity === 'error') {
    return color ? '\x1b[31m✖\x1b[0m' : '[ERROR]';
  }
  return color ? '\x1b[33m⚠\x1b[0m' : '[WARN]';
}

/**
 * Render findings as a grouped, sorted report: errors before warnings,
 * alphabetical by variable name within each severity.
 *
 * @param findings Validation findings to render.
 * @param opts.color Whether to include ANSI color codes.
 */
export function formatReport(findings: Finding[], opts: { color: boolean }): string {
  const sorted = [...findings].sort((a, b) =>
    a.severity === b.severity
      ? a.variable.localeCompare(b.variable)
      : a.severity === 'error'
        ? -1
        : 1,
  );

  const errors = sorted.filter((f) => f.severity === 'error');
  const warnings = sorted.filter((f) => f.severity === 'warning');

  const lines: string[] = [];

  if (errors.length > 0) {
    lines.push(`Errors (${errors.length}):`);
    for (const f of errors) {
      lines.push(`  ${sym('error', opts.color)} ${f.variable}: ${f.message}`);
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push(`Warnings (${warnings.length}):`);
    for (const f of warnings) {
      lines.push(`  ${sym('warning', opts.color)} ${f.variable}: ${f.message}`);
    }
    lines.push('');
  }

  lines.push(`${errors.length} error(s), ${warnings.length} warning(s) found`);

  return lines.join('\n');
}
