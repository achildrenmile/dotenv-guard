# dotenv-guard

Validate `.env` files against a schema — catch missing variables, type
violations, and risky placeholder secrets before they reach production.

> ⚠️ **Status: scaffold only.** This repository is currently a **skeleton**.
> The validation logic is **not implemented** — `src/` contains typed stubs
> with `TODO`s, and `tests/` is empty. Nothing here is finished or production
> ready. The implementation is planned and tracked as tasks under
> [`issues/`](./issues). See [Status / Roadmap](#status--roadmap).

## What it should do

Validate a `.env` file against a `.env.schema`. The schema declares, per
variable, what type it must be and whether it is required. dotenv-guard reads
both files, checks every variable against its rule, and reports problems in a
human-readable way:

- **Missing required variables**
- **Type violations** — e.g. a port outside `1–65535`, a URL without a scheme
- **Warnings** — e.g. a `secret` whose value looks like a placeholder

## Schema format

The schema is YAML. Each key is a variable name; its value is a rule.

| Field      | Values                                    | Notes                          |
| ---------- | ----------------------------------------- | ------------------------------ |
| `type`     | `string` `url` `port` `enum` `secret`     | required                       |
| `required` | `true` `false`                            | required                       |
| `values`   | list of allowed strings                   | only for `type: enum`          |

Types:

- **string** — any value.
- **url** — must parse as a URL with a scheme (e.g. `https://…`).
- **port** — integer within `1–65535`.
- **enum** — value must be one of `values`.
- **secret** — sensitive value. Its **value is never printed** in any output
  (see [`issues/03-secret-safety.md`](./issues/03-secret-safety.md)).

Example (`.env.schema.example`):

```yaml
DATABASE_URL: { type: url, required: true }
PORT: { type: port, required: true }
LOG_LEVEL: { type: enum, values: [debug, info, warn, error], required: false }
API_SECRET: { type: secret, required: true }
```

## Planned usage

```bash
dotenv-guard --schema .env.schema --file .env
```

- Exit code **`0`** — file is valid.
- Exit code **`1`** — validation errors were found.

## Status / Roadmap

The tool is not built yet. Work is split into three tasks under
[`issues/`](./issues):

1. [`01-core-validation.md`](./issues/01-core-validation.md) — load schema,
   parse `.env`, validate all types, correct exit codes. (Deterministic.)
2. [`02-friendly-errors.md`](./issues/02-friendly-errors.md) — make the error
   output more helpful. (Open-ended.)
3. [`03-secret-safety.md`](./issues/03-secret-safety.md) — guarantee secret
   values never appear in any output. (Invariant.)

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # vitest
npm run lint    # eslint
```

## License

MIT
