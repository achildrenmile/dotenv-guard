import { describe, it, expect } from 'vitest';
import { formatReport } from '../src/format.js';
import { validate } from '../src/validator.js';
import type { Finding } from '../src/validator.js';
import type { Schema } from '../src/schema.js';

describe('formatReport', () => {
  it('sorts errors before warnings, alphabetically by variable within severity', () => {
    const findings: Finding[] = [
      { severity: 'warning', variable: 'ZETA', message: 'zeta warning' },
      { severity: 'error', variable: 'BETA', message: 'beta error' },
      { severity: 'error', variable: 'ALPHA', message: 'alpha error' },
      { severity: 'warning', variable: 'ALPHA_W', message: 'alpha_w warning' },
    ];

    const output = formatReport(findings, { color: false });

    const alphaErrIdx = output.indexOf('ALPHA:');
    const betaErrIdx = output.indexOf('BETA:');
    const alphaWarnIdx = output.indexOf('ALPHA_W:');
    const zetaWarnIdx = output.indexOf('ZETA:');

    expect(alphaErrIdx).toBeGreaterThanOrEqual(0);
    expect(betaErrIdx).toBeGreaterThan(alphaErrIdx);
    expect(alphaWarnIdx).toBeGreaterThan(betaErrIdx);
    expect(zetaWarnIdx).toBeGreaterThan(alphaWarnIdx);
  });

  it('never emits ANSI escapes when color is false', () => {
    const findings: Finding[] = [{ severity: 'error', variable: 'FOO', message: 'oops' }];
    const output = formatReport(findings, { color: false });
    expect(output).not.toMatch(/\x1b\[/);
  });

  it('emits ANSI escapes when color is true and an error is present', () => {
    const findings: Finding[] = [{ severity: 'error', variable: 'FOO', message: 'oops' }];
    const output = formatReport(findings, { color: true });
    expect(output).toMatch(/\x1b\[/);
  });

  it('includes a summary count line', () => {
    const findings: Finding[] = [
      { severity: 'error', variable: 'FOO', message: 'oops' },
      { severity: 'warning', variable: 'BAR', message: 'hm' },
    ];
    const output = formatReport(findings, { color: false });
    expect(output).toContain('1 error(s), 1 warning(s) found');
  });
});

describe('placeholder secret detection', () => {
  const schema: Schema = {
    API_SECRET: { type: 'secret', required: true },
  };

  it('flags an exact-match placeholder secret as a warning, not exposing the value', () => {
    const result = validate({ API_SECRET: 'changeme' }, schema);
    const finding = result.findings.find((f) => f.variable === 'API_SECRET');
    expect(finding).toBeDefined();
    expect(finding?.severity).toBe('warning');
    expect(finding?.message).toMatch(/placeholder/i);
    expect(finding?.message).not.toContain('changeme');
    expect(result.valid).toBe(true);
  });

  it('is case-insensitive and trims whitespace', () => {
    const result = validate({ API_SECRET: '  PASSWORD  ' }, schema);
    const finding = result.findings.find((f) => f.variable === 'API_SECRET');
    expect(finding).toBeDefined();
    expect(finding?.message).toMatch(/placeholder/i);
  });

  it('does not flag a non-placeholder secret value', () => {
    const result = validate({ API_SECRET: 'shh' }, schema);
    expect(result.findings.some((f) => f.variable === 'API_SECRET')).toBe(false);
  });

  it('does not false-positive on values merely containing a placeholder substring', () => {
    const result = validate({ API_SECRET: 'super-secret-value-123' }, schema);
    expect(result.findings.some((f) => f.variable === 'API_SECRET')).toBe(false);
  });
});
