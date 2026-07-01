# Conventions for agents working on dotenv-guard

- **Language:** TypeScript only. ES modules. Keep `src/` files focused; no
  frameworks needed.
- **Tests:** Use [vitest](https://vitest.dev). Put tests under `tests/`.
- **No secrets in output:** Never print the value of a `secret`-typed variable
  in any output path (success, error, or logs). Only the variable name may
  appear; the value is always masked. See `issues/03-secret-safety.md`.
- **A green run is not enough — tests must check the property.** A passing test
  suite proves nothing if the assertions don't actually exercise the behavior.
  Each test must assert the specific property it claims to verify (e.g. an
  invalid port produces an error AND exit code 1 — not merely "no throw").
- **Exit codes:** `0` = valid, `1` = validation errors.
- **Scope:** Implement against the acceptance criteria in the matching
  `issues/*.md` file. Don't expand scope beyond the issue.
