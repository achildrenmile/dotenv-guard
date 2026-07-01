import { describe, it, expect, vi, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { main } from '../src/cli.js';
import { validate } from '../src/validator.js';

const SECRET_VALUE = 'SUPER_SECRET_VALUE_9c1f';

const SCHEMA = [
  'DATABASE_URL: { type: url, required: true }',
  'API_SECRET: { type: secret, required: true }',
].join('\n');

function writeTmp(name: string, contents: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'dotenv-guard-secret-'));
  const path = join(dir, name);
  writeFileSync(path, contents, 'utf8');
  return path;
}

function captureAllOutput() {
  const buf: string[] = [];
  const logSpy = vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    buf.push(args.map(String).join(' '));
  });
  const errSpy = vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    buf.push(args.map(String).join(' '));
  });
  const origStdoutWrite = process.stdout.write.bind(process.stdout);
  const origStderrWrite = process.stderr.write.bind(process.stderr);
  process.stdout.write = ((chunk: unknown) => {
    buf.push(String(chunk));
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: unknown) => {
    buf.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;

  return {
    output: () => buf.join('\n'),
    restore: () => {
      logSpy.mockRestore();
      errSpy.mockRestore();
      process.stdout.write = origStdoutWrite;
      process.stderr.write = origStderrWrite;
    },
  };
}

afterEach(() => {
  process.exitCode = undefined;
  vi.restoreAllMocks();
});

describe('secret safety invariant', () => {
  it('never leaks the secret value on a valid run', () => {
    const schemaPath = writeTmp('.env.schema', SCHEMA);
    const envPath = writeTmp('.env', `DATABASE_URL=https://x.com\nAPI_SECRET=${SECRET_VALUE}\n`);

    const cap = captureAllOutput();
    main(['--schema', schemaPath, '--file', envPath]);
    const output = cap.output();
    cap.restore();

    expect(process.exitCode).toBe(0);
    expect(output).not.toContain(SECRET_VALUE);
  });

  it('never leaks the secret value on an invalid run (another variable fails)', () => {
    const schemaPath = writeTmp('.env.schema', SCHEMA);
    const envPath = writeTmp('.env', `API_SECRET=${SECRET_VALUE}\n`);

    const cap = captureAllOutput();
    main(['--schema', schemaPath, '--file', envPath]);
    const output = cap.output();
    cap.restore();

    expect(process.exitCode).toBe(1);
    expect(output).toContain('DATABASE_URL');
    expect(output).not.toContain(SECRET_VALUE);
  });

  it('never leaks the secret value on a schema/parse error run', () => {
    const schemaPath = writeTmp('.env.schema', 'FOO: { type: bogus, required: true }');
    const envPath = writeTmp('.env', `API_SECRET=${SECRET_VALUE}\n`);

    const cap = captureAllOutput();
    main(['--schema', schemaPath, '--file', envPath]);
    const output = cap.output();
    cap.restore();

    expect(process.exitCode).toBe(1);
    expect(output).not.toContain(SECRET_VALUE);
  });

  it('never includes a raw secret value in validate() findings, including placeholder warnings', () => {
    const schema = {
      DATABASE_URL: { type: 'url' as const, required: true },
      API_SECRET: { type: 'secret' as const, required: true },
    };

    const realSecretResult = validate(
      { API_SECRET: SECRET_VALUE, DATABASE_URL: 'nope' },
      schema,
    );
    for (const finding of realSecretResult.findings) {
      expect(finding.message).not.toContain(SECRET_VALUE);
    }

    const placeholderResult = validate(
      { API_SECRET: 'changeme', DATABASE_URL: 'https://x.com' },
      schema,
    );
    for (const finding of placeholderResult.findings) {
      expect(finding.message).not.toContain('changeme');
    }
  });
});
