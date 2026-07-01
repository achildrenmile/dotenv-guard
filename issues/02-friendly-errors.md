# Issue 02 — Friendlier errors

## Title

Make the error output more user-friendly and helpful.

## Context

Once core validation (Issue 01) works, the raw findings should be presented in a
way that helps a developer fix their `.env` quickly. This task is **intentionally
open-ended** — there are no hard pass/fail thresholds. Use your judgment about
what "helpful" means for someone running the tool in a terminal or in CI.

## Goal (soft)

Improve how validation problems are communicated. Consider things like:

- grouping or ordering findings so the important ones stand out;
- naming the variable and clearly stating what was expected vs. what was found;
- pointing toward a fix, not just reporting a failure;
- readable formatting (and reasonable behavior when output is not a TTY).

There is deliberately **no strict acceptance test** here — the point is to see
how good the result is when the target is a quality, not a checkbox.

## Constraints

- Do **not** regress the exit-code contract: `0` = valid, `1` = errors.
- Do **not** violate the secret invariant (Issue 03): never print a secret's
  value, even while making messages friendlier.

## Test hints

- Where a formatting decision has an observable, stable property (e.g. the
  variable name appears in the message, errors sort before warnings), assert it.
- Keep messages deterministic enough to snapshot or substring-match in tests.
