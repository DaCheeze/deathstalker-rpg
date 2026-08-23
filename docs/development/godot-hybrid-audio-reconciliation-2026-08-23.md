# Godot Hybrid Audio Project Reconciliation — 2026-08-23

Status: **complete integration audit and workflow hardening; developer listening,
device, and Web approval remain open**.

## Objective

Reconcile the owner-staged audio work with the canonical Godot client, repository
policy, listening harness, staging workflow, and project verification guidance.
This pass did not select new sounds or change cue timing, gain, combat behavior,
bridge data, or the TypeScript authority boundary.

## Audit result

The audio work is connected rather than isolated:

- the manifest allowlist exactly contains `vibro_blade`,
  `twin_vibro_daggers`, `heavy_smash`, `concussive_shove`, `particle`,
  `ballistic_scatter`, and `plasma`;
- all 26 declared assets are referenced by the seven cue recipes, with no missing,
  duplicate, unused, or unmanifested WAV;
- `disruptor`, `shield_raise`, and `psionic` are absent from the licensed manifest
  and continue through the procedural renderer;
- canonical `godot/scripts/main.gd` installs the shared hybrid audio node and
  exposes `auto`, `procedural`, and strict `licensed` modes without resolving
  combat in GDScript;
- the 10×6 listening harness dynamically loads that same production synth, ranged
  bank, licensed bank, and manifest; and
- `godot/.gitignore` protects the 26 local WAVs and 26 generated import sidecars.
  `git ls-files -- godot/assets/audio/licensed` returns no tracked files.

## Material changes

- `scripts/stage-licensed-combat-audio.mjs` now asks Git to confirm an ignore match
  for the destination before reading/copying the allowlisted sources. If the ignore
  rule is removed or the manifest root is redirected outside it, staging fails
  before changing licensed files.
- `scripts/project-status.mjs` now classifies canonical and experimental Godot
  paths as `godot` and includes the required GDScript check-only plus relevant
  headless validator/scene-smoke reminder in its recommendation.
- Project state and the production ledger record this reconciliation separately
  from the original audio implementation pass.

No licensed audio binary, purchase proof, source-vault file, dependency, bridge
fixture, gameplay value, commit, push, or deployment changed.

## Verification

All listed commands exited 0 unless explicitly described otherwise:

- an idempotent staging run reported `0 copied, 26 already verified, 26 total`;
- Git ignore probing matched `godot/.gitignore`, and the staged root contained 26
  WAVs plus 26 Godot `.import` sidecars with zero tracked licensed files;
- manifest audit: seven exact eligible cues, 26 assets, 21 variations, 39 authored
  layer definitions, 26 unique referenced assets, zero missing and zero unused;
- all 15 canonical and six listening-harness GDScripts passed `--check-only`;
- the strict licensed validator passed `state=ready`, seven cues, 26 assets, 13
  deterministic selected layers, matching hashes, manifested WAVs, and the empty
  public-fallback probe;
- required-licensed canonical legacy replay passed 25/25 snapshots with 13
  licensed, eight procedural, and six intentionally silent dispatches;
- required-licensed canonical range-band replay passed 34/34 snapshots with 18
  licensed, two procedural, three intentionally silent dispatches, and exactly two
  held interrupts;
- listening-harness auto validation and scene smoke each passed all 60 selections
  with 42 licensed and 18 procedural; its explicit procedural scene smoke passed
  0 licensed and 60 procedural;
- `npm run verify:quality` passed: 40-module production build, lint 0 errors/0
  warnings, and 134/134 tests across 29 files; and
- the updated project-status output included the `godot` area and the Godot gate
  reminder.

The first sandboxed quality run failed at Vite with the known esbuild `spawn EPERM`
restriction; the identical permitted rerun passed. Vite retained its two existing
`node:fs` and `node:path` browser-externalization warnings. Verification ran with
installed Node 24.19.0, which the project-status tool correctly reports as
unsupported against the repository's Node 20 policy.

Balance was skipped because this pass changes only audio/tooling integration and
documentation. Bridge fixtures were not regenerated because neither serializer nor
schema changed. All automated audio output was suppressed, so this pass does not
approve timbre, impact, mix, device latency, cancellation, soak stability,
ordinary-speaker translation, or Web audio.

## Next step

Run the same-device listening harness in `auto` and `procedural` modes, compare the
four melee cues first and then Particle, Scatter, and Plasma, and record explicit
accept/reject notes per cue before changing recipes or gain.
