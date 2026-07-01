# Issue 01 — Core validation

## Title

Implement the core: load schema, parse `.env`, validate against the schema.

## Context

`dotenv-guard` should validate a `.env` file against a `.env.schema`. The schema
declares each variable's `type` (`string` | `url` | `port` | `enum` | `secret`),
whether it is `required`, and — for `enum` — the allowed `values`. The scaffold
provides typed stubs in `src/schema.ts`, `src/validator.ts`, and `src/cli.ts`;
`tests/` is empty. This issue implements the deterministic core.

Wire it end to end so this works:

```bash
dotenv-guard --schema .env.schema --file .env
```

## Acceptance criteria

- `loadSchema(path)` reads and parses the YAML schema; rejects malformed schemas
  (unknown `type`, missing `values` for `enum`).
- `parseEnv(raw)` parses `.env` text into a name → value map (handles comments,
  blank lines, `KEY=VALUE`).
- `validate(env, schema)` checks **every type**:
  - **string** — present when `required`.
  - **url** — parses as a URL **with a scheme**; otherwise error.
  - **port** — integer within `1–65535`; outside range → error.
  - **enum** — value is one of `values`; otherwise error.
  - **secret** — present when `required`. (Value masking is Issue 03.)
- A **missing required** variable → error **and** exit code `1`.
- A **port outside range** → error.
- An **invalid enum** value → error.
- A **valid** file → exit code `0`.
- CLI prints findings and exits `0` (valid) or `1` (errors).

## Test hints

- Unit test **each type** with both a happy path and **one failure case per
  type** (missing required, non-URL, out-of-range port, unknown enum value,
  missing required secret).
- Assert the actual property, not just "no throw": e.g. the out-of-range port
  test must assert an **error finding** is produced **and** the CLI exit code is
  `1`. See `AGENTS.md` — a green run alone proves nothing.
- Cover a fully valid file that yields **zero** findings and exit `0`.
- Suggested fixtures: reuse `.env.schema.example` plus small inline `.env`
  strings per case.
