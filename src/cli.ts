#!/usr/bin/env node
/**
 * CLI entry point for dotenv-guard.
 *
 * Planned usage:
 *   dotenv-guard --schema .env.schema --file .env
 *
 * Exit codes:
 *   0 = valid
 *   1 = validation errors (or usage/parse errors)
 */

/**
 * Parse argv, load schema + env, run validation, print findings, set exit code.
 */
import { readFileSync } from 'node:fs';
import { loadSchema } from './schema.js';
import { parseEnv, validate } from './validator.js';
import { formatReport } from './format.js';

export function main(argv: string[]): void {
  const color = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
  let schemaPath: string | undefined;
  let envPath: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--schema') {
      schemaPath = argv[++i];
    } else if (argv[i] === '--file') {
      envPath = argv[++i];
    }
  }

  if (!schemaPath || !envPath) {
    console.error('Usage: dotenv-guard --schema <path> --file <path>');
    process.exitCode = 1;
    return;
  }

  let result;
  try {
    const schema = loadSchema(schemaPath);
    const raw = readFileSync(envPath, 'utf8');
    const env = parseEnv(raw);
    result = validate(env, schema);
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    process.exitCode = 1;
    return;
  }

  if (result.findings.length === 0) {
    console.log(
      color ? '\x1b[32m✔\x1b[0m dotenv-guard: OK — no issues found' : 'dotenv-guard: OK — no issues found',
    );
  } else {
    console.log(formatReport(result.findings, { color }));
  }

  process.exitCode = result.valid ? 0 : 1;
}

main(process.argv.slice(2));
