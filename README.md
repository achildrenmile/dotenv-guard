# dotenv-guard

Validate `.env` files against a schema — catch missing variables, type
violations, and risky placeholder secrets before they reach production.

> **Status: working.** Core validation, grouped friendly error output, and the
> secret-safety invariant are all implemented and tested. The tool is also an
> ongoing experiment built via [zeroshot](https://github.com/the-open-engine/zeroshot)
> — see [How this repo is built](#how-this-repo-is-built).

## What it does

Validates a `.env` file against a `.env.schema`. The schema declares, per
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

## Usage

```bash
dotenv-guard --schema .env.schema --file .env
```

- Exit code **`0`** — file is valid.
- Exit code **`1`** — validation errors were found.

## Roadmap

The work was split into three tasks under [`issues/`](./issues), all now
implemented and tested:

1. [`01-core-validation.md`](./issues/01-core-validation.md) — load schema,
   parse `.env`, validate all types, correct exit codes. (Deterministic.)
2. [`02-friendly-errors.md`](./issues/02-friendly-errors.md) — group and clarify
   the error output. (Open-ended.)
3. [`03-secret-safety.md`](./issues/03-secret-safety.md) — guarantee secret
   values never appear in any output. (Invariant.)

## Development

```bash
npm install
npm run build   # tsc -> dist/
npm test        # vitest
npm run lint    # eslint
```

## How this repo is built

![deterministic](https://img.shields.io/badge/deterministic_goal-passed-brightgreen)
![fuzzy goal](https://img.shields.io/badge/fuzzy_goal-loop_set_the_bar-yellow)
![invariant](https://img.shields.io/badge/invariant-only_if_specified-orange)

dotenv-guard is both a real tool and an open experiment. The implementation was
produced by autonomous agent loops using
[zeroshot](https://github.com/the-open-engine/zeroshot), with each task defined
as an issue carrying explicit acceptance criteria under [`issues/`](./issues).

The point is not "AI builds it for you." It is to observe where such a loop
carries and where it does not. Three findings from the runs so far:

> [!NOTE]
> **Deterministic goal — core validation.** Passed in a single run, evidence-based and correct. The loop shines where "correct" is checkable.

> [!WARNING]
> **Fuzzy goal — friendlier errors.** Passed, but only because the planner defined its own criteria for "user-friendly". Whether the result was actually good could only be judged by a human.

> [!IMPORTANT]
> **Invariant — never print secret values.** Verified correctly, but only because it was given up front as an explicit acceptance criterion with a test. The loop enforces standards; it doesn't choose them.

Every run was cross-checked by hand. The environment used to reproduce the runs
is in [`Dockerfile.zeroshot`](./Dockerfile.zeroshot).

Takeaway: the loop is the cheap part; defining and verifying what "done" means
stays human work.

## License

MIT
