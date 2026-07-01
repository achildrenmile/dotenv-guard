/**
 * Core validation logic for dotenv-guard.
 *
 * Validates a parsed .env (name -> value map) against a Schema and produces
 * a list of human-readable issues.
 *
 * INVARIANT (see issues/03-secret-safety.md): the VALUE of a variable whose
 * type is 'secret' must NEVER appear in any output — not in messages, not in
 * logs. Only the variable name may be shown; the value is always masked.
 *
 * STATUS: stub. No logic implemented yet — see issues/01-core-validation.md.
 */

import type { Schema } from './schema.js';

/** Severity of a validation finding. */
export type Severity = 'error' | 'warning';

/** A single validation finding. */
export interface Finding {
  severity: Severity;
  /** Variable name the finding relates to (never the raw secret value). */
  variable: string;
  message: string;
}

/** Result of validating an env map against a schema. */
export interface ValidationResult {
  valid: boolean;
  findings: Finding[];
}

/**
 * Parse the raw text of a .env file into a name -> value map.
 *
 * TODO: implement (see issues/01-core-validation.md).
 *
 * @param raw Raw file contents.
 */
export function parseEnv(_raw: string): Record<string, string> {
  // TODO: implement
  throw new Error('not implemented');
}

/**
 * Validate an env map against a schema.
 *
 * TODO: implement (see issues/01-core-validation.md).
 * Must check, per type:
 * - string: present when required
 * - url:    parseable URL with a scheme
 * - port:   integer within 1..65535
 * - enum:   value is one of rule.values
 * - secret: present when required; value never echoed (see issue 03)
 * Missing required variables and type violations are 'error' findings.
 *
 * @param env    Parsed env map (name -> value).
 * @param schema Parsed schema.
 */
export function validate(_env: Record<string, string>, _schema: Schema): ValidationResult {
  // TODO: implement
  throw new Error('not implemented');
}
