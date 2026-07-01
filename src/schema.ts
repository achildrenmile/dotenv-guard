/**
 * Schema types and loader for dotenv-guard.
 *
 * A .env.schema is YAML mapping variable names to rules, e.g.:
 *
 *   DATABASE_URL: { type: url, required: true }
 *   PORT:         { type: port, required: true }
 *   LOG_LEVEL:    { type: enum, values: [debug, info, warn, error], required: false }
 *   API_SECRET:   { type: secret, required: true }
 *
 * STATUS: stub. No logic implemented yet — see issues/01-core-validation.md.
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

/**
 * Load and parse a .env.schema file into a Schema object.
 *
 * TODO: implement (see issues/01-core-validation.md).
 * - read file at `path`
 * - parse YAML
 * - validate shape (known types, values[] present for enum, etc.)
 *
 * @param path Path to the schema file.
 */
export function loadSchema(_path: string): Schema {
  // TODO: implement
  throw new Error('not implemented');
}
