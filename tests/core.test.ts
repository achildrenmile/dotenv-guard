import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSchema, type Schema } from '../src/schema.js';
import { parseEnv, validate } from '../src/validator.js';

const schema: Schema = {
  DATABASE_URL: { type: 'url', required: true },
  PORT: { type: 'port', required: true },
  LOG_LEVEL: { type: 'enum', required: false, values: ['debug', 'info', 'warn', 'error'] },
  API_SECRET: { type: 'secret', required: true },
};

function writeTmp(contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'dotenv-guard-'));
  const path = join(dir, '.env.schema');
  writeFileSync(path, contents, 'utf8');
  return path;
}

describe('parseEnv', () => {
  it('parses KEY=VALUE pairs, skipping comments and blank lines', () => {
    const raw = [
      '# a comment',
      '',
      'DATABASE_URL=https://x.com',
      '  PORT=8080  ',
      '# another comment',
      'LOG_LEVEL=debug',
    ].join('\n');

    expect(parseEnv(raw)).toEqual({
      DATABASE_URL: 'https://x.com',
      PORT: '8080',
      LOG_LEVEL: 'debug',
    });
  });

  it('strips matching surrounding quotes', () => {
    const raw = 'FOO="bar"\nBAZ=\'qux\'';
    expect(parseEnv(raw)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });
});

describe('validate', () => {
  it('flags a missing required string/url variable', () => {
    const env = { PORT: '8080', API_SECRET: 'shh' };
    const result = validate(env, schema);
    expect(result.valid).toBe(false);
    expect(result.findings).toContainEqual({
      severity: 'error',
      variable: 'DATABASE_URL',
      message: 'DATABASE_URL is required but missing',
    });
  });

  it('flags an invalid URL and accepts a valid one', () => {
    const invalid = validate(
      { DATABASE_URL: 'not-a-url', PORT: '8080', API_SECRET: 'shh' },
      schema,
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.findings.some((f) => f.variable === 'DATABASE_URL')).toBe(true);

    const valid = validate(
      { DATABASE_URL: 'https://x.com', PORT: '8080', API_SECRET: 'shh' },
      schema,
    );
    expect(valid.findings.some((f) => f.variable === 'DATABASE_URL')).toBe(false);
  });

  it('flags an out-of-range port and a non-numeric port', () => {
    const outOfRange = validate(
      { DATABASE_URL: 'https://x.com', PORT: '70000', API_SECRET: 'shh' },
      schema,
    );
    expect(outOfRange.valid).toBe(false);
    expect(outOfRange.findings).toContainEqual({
      severity: 'error',
      variable: 'PORT',
      message: 'PORT must be a port between 1 and 65535 (got "70000")',
    });

    const nonNumeric = validate(
      { DATABASE_URL: 'https://x.com', PORT: 'abc', API_SECRET: 'shh' },
      schema,
    );
    expect(nonNumeric.valid).toBe(false);
    expect(nonNumeric.findings.some((f) => f.variable === 'PORT')).toBe(true);

    const valid = validate(
      { DATABASE_URL: 'https://x.com', PORT: '8080', API_SECRET: 'shh' },
      schema,
    );
    expect(valid.findings.some((f) => f.variable === 'PORT')).toBe(false);
  });

  it('flags an invalid enum value and accepts a valid one', () => {
    const invalid = validate(
      { DATABASE_URL: 'https://x.com', PORT: '8080', API_SECRET: 'shh', LOG_LEVEL: 'trace' },
      schema,
    );
    expect(invalid.valid).toBe(false);
    const finding = invalid.findings.find((f) => f.variable === 'LOG_LEVEL');
    expect(finding).toBeDefined();
    expect(finding?.message).toContain('debug, info, warn, error');

    const valid = validate(
      { DATABASE_URL: 'https://x.com', PORT: '8080', API_SECRET: 'shh', LOG_LEVEL: 'debug' },
      schema,
    );
    expect(valid.findings.some((f) => f.variable === 'LOG_LEVEL')).toBe(false);
  });

  it('flags a missing required secret without ever exposing a secret value', () => {
    const secretValue = 'super-secret-value-123';
    const missing = validate({ DATABASE_URL: 'https://x.com', PORT: '8080' }, schema);
    expect(missing.valid).toBe(false);
    const finding = missing.findings.find((f) => f.variable === 'API_SECRET');
    expect(finding).toBeDefined();
    expect(finding?.message).not.toContain(secretValue);

    const present = validate(
      { DATABASE_URL: 'https://x.com', PORT: '8080', API_SECRET: secretValue },
      schema,
    );
    for (const f of present.findings) {
      expect(f.message).not.toContain(secretValue);
    }
  });

  it('produces zero findings and valid=true for a fully valid env', () => {
    const result = validate(
      {
        DATABASE_URL: 'https://x.com',
        PORT: '8080',
        LOG_LEVEL: 'info',
        API_SECRET: 'shh',
      },
      schema,
    );
    expect(result.findings).toEqual([]);
    expect(result.valid).toBe(true);
  });
});

describe('loadSchema', () => {
  it('parses .env.schema.example into a Schema with 4 keys', () => {
    const contents = [
      'DATABASE_URL: { type: url, required: true }',
      'PORT: { type: port, required: true }',
      'LOG_LEVEL: { type: enum, values: [debug, info, warn, error], required: false }',
      'API_SECRET: { type: secret, required: true }',
    ].join('\n');
    const path = writeTmp(contents);

    const result = loadSchema(path);
    expect(Object.keys(result)).toEqual(['DATABASE_URL', 'PORT', 'LOG_LEVEL', 'API_SECRET']);
    expect(result.PORT.type).toBe('port');
    expect(result.LOG_LEVEL.values).toContain('warn');
  });

  it('throws on an unknown type', () => {
    const path = writeTmp('FOO: { type: bogus, required: true }');
    expect(() => loadSchema(path)).toThrow();
  });

  it('throws when an enum type is missing values', () => {
    const path = writeTmp('FOO: { type: enum, required: true }');
    expect(() => loadSchema(path)).toThrow();
  });
});
