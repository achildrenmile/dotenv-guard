# Issue 03 — Secret safety (invariant)

## Title

Never output the value of a `secret`-typed variable.

## Context

Variables declared with `type: secret` hold sensitive values (API keys, tokens).
The tool must treat their values as unprintable. This is a **safety invariant**,
not a feature — it must hold across every code path.

## Invariant

The **value** of a `secret`-typed variable must **NEVER** appear in any output —
not in success messages, not in error messages, not in logs. Only the variable
**name** may be shown; the value is **always masked** (e.g. `API_SECRET=***`).

This applies even when the value is invalid, missing-adjacent, or looks like a
placeholder — a warning about a suspicious secret must still not echo the value.

## Acceptance criteria

- A test reads a `.env` containing a `secret` with a known, distinctive
  plaintext value.
- The test triggers **all output paths**: a **valid** run, an **invalid** run
  (e.g. another variable fails), and an **error** run (e.g. bad schema / parse
  error) — capturing everything written to stdout and stderr.
- The test asserts the **plaintext secret value appears in NONE** of the captured
  output.
- The variable **name** may appear; only the raw value must be absent.

## Test hints

- Use a secret value unlikely to occur by accident (e.g.
  `SUPER_SECRET_VALUE_9c1f`) so a substring search is meaningful.
- Capture output by intercepting `console.log`/`console.error` (or the process
  streams). Assert `!output.includes(SECRET_VALUE)` for **each** path.
- Don't just check the happy path — the invariant is most likely to break in
  error/exception messages, so exercise those explicitly.
- A green suite that never feeds a real secret through the error path proves
  nothing (see `AGENTS.md`).
