/**
 * Core validation logic for dotenv-guard.
 *
 * Validates a parsed .env (name -> value map) against a Schema and produces
 * a list of human-readable issues.
 *
 * INVARIANT (see issues/03-secret-safety.md): the VALUE of a variable whose
 * type is 'secret' must NEVER appear in any output — not in messages, not in
 * logs. Only the variable name may be shown; the value is always masked.
 */

import type { Schema } from './schema.js';

/** Known placeholder secret values that indicate a value was never replaced. */
const PLACEHOLDER_SECRET_VALUES = new Set([
  'changeme',
  'change_me',
  'change-me',
  'todo',
  'xxx',
  'password',
  'secret',
  'placeholder',
  'your-secret-here',
  'test',
  'example',
  'fixme',
  'dummy',
  'apikey',
  'api_key',
  '123456',
]);

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
 * @param raw Raw file contents.
 */
export function parseEnv(raw: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      continue;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();

    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

/**
 * Validate an env map against a schema.
 *
 * Checks, per type:
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
export function validate(env: Record<string, string>, schema: Schema): ValidationResult {
  const findings: Finding[] = [];

  for (const [name, rule] of Object.entries(schema)) {
    const value = env[name];
    const present = value !== undefined && value !== '';

    if (!present) {
      if (rule.required) {
        findings.push({
          severity: 'error',
          variable: name,
          message: `${name} is required but missing`,
        });
      }
      continue;
    }

    switch (rule.type) {
      case 'string':
        break;
      case 'secret':
        if (PLACEHOLDER_SECRET_VALUES.has(value.trim().toLowerCase())) {
          findings.push({
            severity: 'warning',
            variable: name,
            message: `${name} looks like a placeholder secret — replace it with a real value before deploying`,
          });
        }
        break;
      case 'url':
        try {
          new URL(value);
        } catch {
          findings.push({
            severity: 'error',
            variable: name,
            message: `${name} must be a valid URL with a scheme (got "${value}")`,
          });
        }
        break;
      case 'port':
        if (!/^\d+$/.test(value)) {
          findings.push({
            severity: 'error',
            variable: name,
            message: `${name} must be a port between 1 and 65535 (got "${value}")`,
          });
        } else {
          const port = Number(value);
          if (port < 1 || port > 65535) {
            findings.push({
              severity: 'error',
              variable: name,
              message: `${name} must be a port between 1 and 65535 (got "${value}")`,
            });
          }
        }
        break;
      case 'enum':
        if (!rule.values?.includes(value)) {
          findings.push({
            severity: 'error',
            variable: name,
            message: `${name} must be one of [${rule.values?.join(', ')}] (got "${value}")`,
          });
        }
        break;
    }
  }

  return {
    valid: findings.every((f) => f.severity !== 'error'),
    findings,
  };
}
