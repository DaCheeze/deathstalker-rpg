# Development Workflow

## Local-first policy

Develop and verify in the local checkout. Do not commit or push merely because a
change compiles. Keep the tree reviewable and let the developer inspect subjective
Godot visual and audio changes before publication.

Node 24 LTS is the supported runtime and matches GitHub Actions. On the current
Windows workstation, Node 24 can fail before `tsx` commands only inside the managed
sandbox with an `os.userInfo()` `uv_os_get_passwd returned ENOMEM` error; the same
commands run normally outside that sandbox.

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
- If dependency installation, Godot, or Web-export work is blocked by the environment, say so.

### Required production-pass ledger

Every game-development pass must update
`docs/development/production-pass-ledger.md` before handoff. A pass entry records:

- the pass objective and completion state;
- material gameplay, presentation, asset, audio, tooling, and documentation changes;
- exact verification commands and measured results;
- checks skipped or blocked, plus every subjective developer-review gate;
- the next concrete continuation point.

An interrupted or wrapped pass receives a checkpoint entry with its incomplete and
unverified work called out explicitly. A pass is not complete until its ledger entry
exists. Detailed specialist reports may remain separate, but the ledger must link
them so the developer has one chronological source of truth.

## Verification matrix

| Change | Required checks |
|---|---|
| Documentation only | `git diff --check` |
| Build/workflow/config | build, current lint, tests |
| Godot audio/render/UI | build, current lint, tests, changed GDScript `--check-only`, affected validator/scene smoke, and local capture or listening review |
| Godot bridge/schema/client | build, current lint, tests, deterministic fixture export, every changed GDScript `--check-only`, headless fixture/scene smoke |
| Godot visual/audio presentation | Godot bridge/client checks plus a local motion capture or listening pass; subjective developer approval remains explicit |
| Core/data/sim/mechanics/balance | all above plus full `balance-check` |

Existing lint warnings must be reported honestly. Do not claim lint is clean until
the backlog is removed and `--max-warnings=0` is enforced.

## Deployment

`.github/workflows/deploy.yml` validates pull requests and pushes targeting `main`
with `npm ci`, build, lint, and tests without publishing. The former Canvas Pages
deployment is disabled. A Godot native/Web export and deployment pipeline requires
its own approved production pass. Balance is not yet a CI gate.

## Definition of done for balance

1. Production build has zero TypeScript errors.
2. Lint completes and all warnings are reported.
3. All unit tests pass.
4. Full `npm run balance-check` exits zero and its output is reported.
5. Both seeds and their variance are reported.
6. Failure distribution across encounters is reported.

A mechanics change also updates the relevant design document.
