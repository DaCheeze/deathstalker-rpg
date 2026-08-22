# Space Opera JRPG

A browser-based, turn-based JRPG set in a decaying star empire. Its
story tone draws inspiration from Simon R. Green's *Deathstalker* series, while its
game-design direction draws from the *Octopath Traveler* series. The current
prototype intentionally retains recognizable working placeholders for some
mechanics, factions, character types, technology, and story concepts; these are
planned for a cohesive originality pass later. The project combines a deterministic
headless combat core with a hand-rolled Canvas 2D renderer, procedural Web Audio,
replays, simulation, and balance tooling.

[Play the current GitHub Pages build](https://dacheeze.github.io/deathstalker-rpg/)

## Current features

- Four-character party with distinct combat roles
- Speed-based projected turn queue with displacement
- Persistent expedition attrition, consumables, and disruptor cooldowns
- Boost, burnout, force-shield, esper, and psi-blocker mechanics
- Empire, Shub, and Hadenman encounter languages
- Deterministic seeded simulation and replay playback
- Nine-layer Canvas 2D compositor with procedural combatants and effects
- Procedurally synthesized combat and interface audio
- In-browser tuning dashboard and headless balance assertions

## Run locally

Requirements: Node.js 20 LTS and npm. Node 20 matches the deployment workflow;
newer major versions should be treated as unverified until all `tsx` commands run
successfully.

```bash
npm install
npm run dev
```

Vite prints the local URL when the server starts.

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
  render/   Canvas 2D drawing and compositor
  ui/       Input and browser glue
  audio/    Procedural Web Audio synthesis
  sim/      Headless simulation, replays, and balance assertions
  main.ts   Application wiring
```

The boundary around `src/core/` is deliberate: it keeps combat deterministic and
lets the same rules run in Vitest, simulations, replays, a Web Worker, and the live
game.

## Development policy

- TypeScript is strict; do not add dependencies without approval.
- Tunable gameplay values belong in JSON, not hardcoded core constants.
- Never use browser APIs or `Math.random()` in `src/core/`.
- Combatants and effects remain procedural Canvas primitives.
- Verify locally before committing or pushing.

## Deployment

GitHub Actions deploys `dist/` to GitHub Pages after a push to `main`. The workflow
runs the production build, current lint, and tests, and publishes only after they
pass. Pull requests targeting `main` run the same gates without publishing. Balance
and browser verification remain local gates. Manual workflow runs validate quality
without publishing.
