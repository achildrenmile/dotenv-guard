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
 *
 * STATUS: stub. No logic implemented yet — see issues/01-core-validation.md.
 */

/**
 * Parse argv, load schema + env, run validation, print findings, set exit code.
 *
 * TODO: implement (see issues/01-core-validation.md and issues/02-friendly-errors.md).
 * - parse --schema and --file flags
 * - loadSchema() + parseEnv()
 * - validate()
 * - print findings (masking secret values — see issues/03-secret-safety.md)
 * - process.exit(result.valid ? 0 : 1)
 */
export function main(_argv: string[]): void {
  // TODO: implement
  throw new Error('not implemented');
}

main(process.argv.slice(2));
