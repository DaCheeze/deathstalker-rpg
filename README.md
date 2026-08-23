# Space Opera JRPG

A browser-based, turn-based JRPG set in a decaying star empire. Its
story tone draws inspiration from Simon R. Green's *Deathstalker* series, while its
game-design direction draws from the *Octopath Traveler* series. The current
prototype intentionally retains recognizable working placeholders for some
mechanics, factions, character types, technology, and story concepts; these are
planned for a cohesive originality pass later. The project combines a deterministic
headless TypeScript combat core with a hand-rolled Canvas/Web Audio reference client,
replays, simulation, balance tooling, and a staged Godot-first presentation client.

[Play the current GitHub Pages build](https://dacheeze.github.io/deathstalker-rpg/)

## Current features

- Four-character party with distinct combat roles
- Speed-based projected turn queue with displacement
- Persistent expedition attrition, consumables, and disruptor cooldowns
- Boost, burnout, force-shield, esper, and psi-blocker mechanics
- Empire, Shub, and Hadenman encounter languages
- Deterministic seeded simulation and replay playback
- Nine-layer Canvas 2D compositor with currently procedural combatants; raster,
  procedural, and hybrid combatant production are all permitted
- Procedurally synthesized combat and interface audio
- In-browser tuning dashboard and headless balance assertions
- Versioned presentation bridge and canonical Godot replay client with strict
  legacy/range-band fixtures and four native procedural melee cues
- Isolated exact nine-layer Godot compositor proof and strict proposed combatant
  raster-package validator; production art selection remains pending

## Run locally

Requirements: Node.js 20 LTS and npm. Node 20 matches the deployment workflow;
newer major versions should be treated as unverified until all `tsx` commands run
successfully.

```bash
npm install
npm run dev
```

Vite prints the local URL when the server starts.

Generate the deterministic legacy fixture for the staged Godot client with
`npm run godot:fixture`; see [godot/README.md](godot/README.md) for the range-band
fixture, Godot 4.7.2 validation, and exact commands for both selectable replays. The
Canvas client remains the deployed parity/rollback reference while the recorded
Godot cutover gates are open. Measured migration history is in the
[transition pass log](docs/development/godot-transition-pass-log-2026-08-23.md),
with separate evidence for the
[range-band fixture](docs/development/godot-range-band-bridge-fixture-2026-08-23.md)
and [nine-layer compositor proof](docs/development/godot-nine-layer-compositor-proof-2026-08-23.md).

## Verification

```bash
npm run project:status   # changed areas and applicable verification
npm run verify:quick     # typecheck, lint errors, compact tests
npm run verify:quality   # production build, compact lint summary, compact tests
npm run verify:gameplay  # quality gates plus the full balance checker
```

Balance work must also report two seeds, encounter rounds and actions, attrition
budgets, and failure distribution. The faster `npm run balance:smoke` command is
diagnostic only. See [AGENTS.md](AGENTS.md) for always-on invariants and
[docs/PROJECT-STATE.md](docs/PROJECT-STATE.md) for current status.

## Architecture

```text
src/
  core/     Pure deterministic game logic; no browser APIs
  data/     JSON content and tunable values
  bridge/   Pure versioned presentation serializers
  render/   Canvas 2D drawing and compositor
  ui/       Input and browser glue
  audio/    Procedural Web Audio synthesis
  sim/      Headless simulation, replays, and balance assertions
  main.ts   Application wiring
godot/      Target presentation client; consumes bridge data, resolves no combat
```

The boundary around `src/core/` is deliberate: it keeps combat deterministic and
lets the same rules run in Vitest, simulations, replays, a Web Worker, and the live
game.

## Development policy

- TypeScript is strict; do not add dependencies without approval.
- Tunable gameplay values belong in JSON, not hardcoded core constants.
- Never use browser APIs or `Math.random()` in `src/core/`.
- Godot is presentation-first; TypeScript remains authoritative for combat and
  shared semantic cue/timing resolution during the initial migration phases.
- Combatants may use approved raster, procedural, or hybrid production under the
  asset manifest and provenance policy.
- Verify locally before committing or pushing.

## Deployment

GitHub Actions deploys `dist/` to GitHub Pages after a push to `main`. The workflow
runs the production build, current lint, and tests, and publishes only after they
pass. Pull requests targeting `main` run the same gates without publishing. Balance
and browser verification remain local gates. Manual workflow runs validate quality
without publishing.
