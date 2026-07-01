/**
 * Schema types and loader for dotenv-guard.
 *
 * A .env.schema is YAML mapping variable names to rules, e.g.:
 *
 *   DATABASE_URL: { type: url, required: true }
 *   PORT:         { type: port, required: true }
 *   LOG_LEVEL:    { type: enum, values: [debug, info, warn, error], required: false }
 *   API_SECRET:   { type: secret, required: true }
 */

/** Supported variable types. */
export type VarType = 'string' | 'url' | 'port' | 'enum' | 'secret';

/** Rule for a single variable in the schema. */
export interface VarRule {
  type: VarType;
  required: boolean;
  /** Allowed values, only meaningful for type 'enum'. */
  values?: string[];
}

/** Parsed schema: variable name -> rule. */
export type Schema = Record<string, VarRule>;

import { readFileSync } from 'node:fs';
import { parse } from 'yaml';

const VALID_TYPES: VarType[] = ['string', 'url', 'port', 'enum', 'secret'];

/**
 * Load and parse a .env.schema file into a Schema object.
 *
 * @param path Path to the schema file.
 */
export function loadSchema(path: string): Schema {
  const text = readFileSync(path, 'utf8');
  const doc: unknown = parse(text);

  if (typeof doc !== 'object' || doc === null || Array.isArray(doc)) {
    throw new Error('Invalid schema: expected a mapping of variable rules');
  }

  const result: Schema = {};
  for (const [name, rawRule] of Object.entries(doc as Record<string, unknown>)) {
    if (typeof rawRule !== 'object' || rawRule === null || Array.isArray(rawRule)) {
      throw new Error(`Invalid schema for ${name}: rule must be an object`);
    }
    const { type, required, values } = rawRule as {
      type?: unknown;
      required?: unknown;
      values?: unknown;
    };

    if (typeof type !== 'string' || !VALID_TYPES.includes(type as VarType)) {
      throw new Error(`Invalid schema for ${name}: unknown type '${String(type)}'`);
    }

    if (type === 'enum' && (!Array.isArray(values) || values.length === 0)) {
      throw new Error(`Invalid schema for ${name}: enum type requires non-empty 'values'`);
    }

    result[name] = {
      type: type as VarType,
      required: required === true,
      ...(type === 'enum' ? { values: (values as unknown[]).map(String) } : {}),
    };
  }

  return result;
}
