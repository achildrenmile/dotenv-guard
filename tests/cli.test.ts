import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../src/cli.js';

const SECRET = 'SUPER_SECRET_VALUE_9c1f';

const SCHEMA_CONTENTS = [
  'DATABASE_URL: { type: url, required: true }',
  'API_SECRET: { type: secret, required: true }',
].join('\n');

function writeTmpFile(name: string, contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'dotenv-guard-cli-'));
  const path = join(dir, name);
  writeFileSync(path, contents, 'utf8');
  return path;
}

function collectLogs(spy: ReturnType<typeof vi.spyOn>): string {
  return spy.mock.calls.map((args) => args.join(' ')).join('\n');
}

afterEach(() => {
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe('cli main', () => {
  it('exits 0 and never logs the secret when the env is fully valid', () => {
    const schemaPath = writeTmpFile('.env.schema', SCHEMA_CONTENTS);
    const envPath = writeTmpFile('.env', `DATABASE_URL=https://x.com\nAPI_SECRET=${SECRET}\n`);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    main(['--schema', schemaPath, '--file', envPath]);

    expect(process.exitCode).toBe(0);
    expect(collectLogs(logSpy)).not.toContain(SECRET);
    expect(collectLogs(errSpy)).not.toContain(SECRET);
  });

  it('exits 1, names the missing variable, and never logs the secret when invalid', () => {
    const schemaPath = writeTmpFile('.env.schema', SCHEMA_CONTENTS);
    const envPath = writeTmpFile('.env', `API_SECRET=${SECRET}\n`);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    main(['--schema', schemaPath, '--file', envPath]);

    expect(process.exitCode).toBe(1);
    const logs = collectLogs(logSpy);
    expect(logs).toContain('DATABASE_URL');
    expect(logs).not.toContain(SECRET);
    expect(collectLogs(errSpy)).not.toContain(SECRET);
  });

  it('exits 1 and never logs the secret on a schema parse error', () => {
    const schemaPath = writeTmpFile('.env.schema', 'FOO: { type: bogus, required: true }');
    const envPath = writeTmpFile('.env', `API_SECRET=${SECRET}\n`);

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    main(['--schema', schemaPath, '--file', envPath]);

    expect(process.exitCode).toBe(1);
    expect(collectLogs(logSpy)).not.toContain(SECRET);
    expect(collectLogs(errSpy)).not.toContain(SECRET);
  });

  it('exits 0 with a Warnings section when only a placeholder-secret warning is found', () => {
    const schemaPath = writeTmpFile('.env.schema', SCHEMA_CONTENTS);
    const envPath = writeTmpFile('.env', 'DATABASE_URL=https://x.com\nAPI_SECRET=changeme\n');

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    main(['--schema', schemaPath, '--file', envPath]);

    expect(process.exitCode).toBe(0);
    expect(collectLogs(logSpy)).toContain('Warnings');
  });
});
