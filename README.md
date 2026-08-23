# Space Opera JRPG

A Godot 4-based, turn-based JRPG set in a decaying star empire. Its
story tone draws inspiration from Simon R. Green's *Deathstalker* series, while its
game-design direction draws from the *Octopath Traveler* series. The current
prototype intentionally retains recognizable working placeholders for some
mechanics, factions, character types, technology, and story concepts; these are
planned for a cohesive originality pass later. The project combines a deterministic
headless TypeScript combat core with a versioned presentation bridge, replays,
simulation, balance tooling, and a Godot-only presentation client. The former
Canvas/Web Audio implementation is frozen historical source, not a fallback or
comparison target.

## Current features

- Four-character party with distinct combat roles
- Speed-based projected turn queue with displacement
- Persistent expedition attrition, consumables, and disruptor cooldowns
- Boost, burnout, force-shield, esper, and psi-blocker mechanics
- Empire, Shub, and Hadenman encounter languages
- Deterministic seeded simulation and replay playback
- Canonical nine-layer Godot compositor with true full-scene post and UI outside post
- Godot-native ten-cue procedural combat audio plus an optional strict owner-staged
  licensed bank for seven weapon cues
- Headless balance assertions and deterministic fixture generation
- Versioned presentation bridge and canonical Godot replay client with strict
  legacy/range-band fixtures
- Versioned live-session protocol with authoritative sequence/retry handling and a
  replaceable Godot Web JavaScript host
- Strict proposed Godot combatant raster-package validator; production art selection
  remains pending

## Run locally

Requirements: Godot 4.7.2 Compatibility, Node.js 24 LTS, and npm.

```bash
npm install
npm run godot:fixture
npm run godot:web:core
godot --path godot
```

See [godot/README.md](godot/README.md) for fixture selection, the live Web-host
foundation, Godot 4.7.2 validation, audio modes, and exact replay commands. The
forward production phases are in the
[Godot production plan](docs/development/godot-transition-plan.md). Measured
migration history remains in the
[transition pass log](docs/development/godot-transition-pass-log-2026-08-23.md),
with separate evidence for the
[range-band fixture](docs/development/godot-range-band-bridge-fixture-2026-08-23.md)
and [nine-layer compositor proof](docs/development/godot-nine-layer-compositor-proof-2026-08-23.md).

## Verification

```bash
npm run project:status   # changed areas and applicable verification
npm run verify:quick     # typecheck, lint errors, compact tests
npm run verify:quality   # TypeScript build gate, compact lint summary, compact tests
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
  session/  Authoritative session setup and orchestration over core state
  host/     Replaceable Web/native I/O adapters around the authoritative session
  presentation/ Engine-neutral semantic timing and feedback policy
  render/   Frozen legacy Canvas code plus shared presentation policy
  ui/       Frozen legacy browser code plus still-shared controllers
  audio/    Shared semantic routing plus frozen legacy Web Audio code
  sim/      Headless simulation, replays, and balance assertions
  main.ts   Frozen legacy browser entry point
godot/      Sole presentation client; consumes bridge data, resolves no combat
```

The boundary around `src/core/` is deliberate: it keeps combat deterministic and
lets the same rules run in Vitest, simulations, replays, a Web Worker, and the live
game.

## Development policy

- TypeScript is strict; do not add dependencies without approval.
- Tunable gameplay values belong in JSON, not hardcoded core constants.
- Never use browser APIs or `Math.random()` in `src/core/`.
- Godot is the sole presentation client; TypeScript remains authoritative for combat
  and shared semantic cue/timing resolution.
- Combatants may use approved raster, procedural, or hybrid production under the
  asset manifest and provenance policy.
- Verify locally before committing or pushing.

## Deployment

GitHub Actions currently runs the TypeScript build gate, zero-warning lint, and
tests without publishing a presentation client. The former Canvas Pages deployment
is disabled. Godot native/Web export and deployment will be added only after the
production plan's release gates pass and the developer approves publication.
