# Development Workflow

## Local-first policy

Develop and verify in the local checkout. Do not commit or push merely because a
change compiles. Keep the tree reviewable and let the developer inspect subjective
browser, visual, and audio changes before publication.

Node 20 LTS is the supported runtime and matches GitHub Actions. The current Windows
Node 24 runtime fails before `tsx` simulation commands with an `os.userInfo()`
`uv_os_get_passwd returned ENOMEM` error.

## Compact commands

- `npm run project:status` reports runtime, changed areas, and applicable gates.
- `npm run verify:quick` type-checks, reports lint errors, and runs compact tests.
- `npm run verify:quality` runs production build, a compact lint summary, and tests.
- `npm run verify:gameplay` runs the same quality checks plus the full balance
  assertion.
- `npm run balance:smoke` is a short diagnostic, never final balance evidence.

Full individual commands remain available in `package.json`.

## Reporting

- Report measured values and exact failures, not descriptions of effort.
- State which checks were skipped and why. Never substitute estimates.
- Store reviewable screenshots under `docs/screenshots/` with repository-relative
  links. Do not present machine-specific paths as shared evidence.
- Generated repository assets must report path and dimensions.
- If dependency installation or browser work is blocked by the environment, say so.

## Verification matrix

| Change | Required checks |
|---|---|
| Documentation only | `git diff --check` |
| Build/workflow/config | build, current lint, tests |
| Audio/render/UI | build, current lint, tests, affected browser path |
| Core/data/sim/mechanics/balance | all above plus full `balance-check` |

Existing lint warnings must be reported honestly. Do not claim lint is clean until
the backlog is removed and `--max-warnings=0` is enforced.

## Deployment

`.github/workflows/deploy.yml` validates pull requests targeting `main` with
`npm ci`, build, lint, and tests without publishing. Pushes to `main` run the same
quality job and deploy `dist/` only after it succeeds. Manual workflow dispatch runs
quality checks without publishing. Balance is not yet a CI gate.

## Definition of done for balance

1. Production build has zero TypeScript errors.
2. Lint completes and all warnings are reported.
3. All unit tests pass.
4. Full `npm run balance-check` exits zero and its output is reported.
5. Both seeds and their variance are reported.
6. Failure distribution across encounters is reported.

A mechanics change also updates the relevant design document.
