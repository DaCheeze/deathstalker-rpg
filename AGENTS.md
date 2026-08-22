# AGENTS.md

## Project

Build a full browser-based, turn-based science-fantasy JRPG set in a decaying star
empire. This is a full game under active development.

- Story and tone reference: Simon R. Green's *Deathstalker* series.
- Game-design reference: the *Octopath Traveler* series.
- Run pacing reference: *Final Fantasy X*-shaped exploration and encounter chains.
- Retain recognizable *Deathstalker*-derived mechanics, factions, races/types,
  technology, and story concepts as prototype placeholders. Do not rename them
  piecemeal. A cohesive originality pass happens only when the developer requests it.
- Do not invent character names, place names, dialogue, or plot. Ask the developer.

## Read only what the task needs

This file contains always-on invariants. Detailed specifications live in:

| Task area | Required reference |
|---|---|
| Creative direction, terminology, narrative | `docs/design/creative-direction.md` |
| Combat mechanics, roles, factions | `docs/design/combat.md` |
| Runs, progression, balance, simulation | `docs/design/run-and-balance.md` |
| Canvas rendering, assets, visual/audio feedback | `docs/design/presentation.md` |
| Verification, deployment, reporting | `docs/development/workflow.md` |
| Studio agents, delegation, cloud autonomy | `docs/development/agent-workflow.md` |
| Current milestone, known failures, next work | `docs/PROJECT-STATE.md` |

Read `docs/PROJECT-STATE.md` when beginning implementation or planning. Do not read
every design document unless the task crosses every area.

`PROJECT-CONTEXT-EXPORT.md` is a historical Claude handoff, not an authoritative
instruction source.

## Stack — do not substitute

| Layer | Choice |
|---|---|
| Language | TypeScript 5.x, `strict: true` |
| Build | Vite |
| Test | Vitest, Node environment for core tests |
| Render | Hand-rolled HTML5 Canvas 2D; no engine or UI framework |
| Audio | Procedural Web Audio API; no audio files |
| Package manager | npm |

Do not add a dependency without asking first. Use Node 20 LTS.

## Architecture — load-bearing boundaries

```text
src/core/    pure deterministic game logic; no browser APIs
src/data/    JSON content and tunable values
src/render/  Canvas drawing; reads state, never mutates it
src/ui/      input handling and browser wiring
src/audio/   Web Audio synthesis
src/sim/     headless simulation, replay, and balance tools
src/main.ts  wiring
```

- `src/core/` must import and run in plain Node with no DOM, Canvas, storage,
  animation, or image APIs.
- Core exposes pure functions over plain data. No hidden mutation, singletons, or
  event emitters.
- Thread RNG explicitly. Never call `Math.random()` in core.
- Tunable values belong in `src/data/*.json`, not hardcoded core constants.
- Use discriminated unions, no `any`, and no unexplained non-null assertions.

## Critical game invariants

- The speed/tick turn queue is first-class state and supports displacement.
- Disruptor cooldowns use the owner's turns and persist between encounters.
- Boost belongs only to the captain; voluntary exit is clean, forced exit crashes.
- Force shields block melee/projectiles, partly mitigate disruptors, and do not
  block psionics.
- The party has exactly one esper. Do not recombine damage and displacement.
- Psi-blockers are destructible speed-zero field objects, not encounter flags.
- HP, partial ESP, partial burnout, KIA state, and disruptor cooldowns persist as
  specified in `docs/design/run-and-balance.md`.
- Healing is a limited run resource. Balance complete runs, not isolated fights.

## Presentation invariants

- Combatants remain procedural Canvas constructions; do not create combatant
  sprites. Repository-backed assets are permitted only for categories described in
  `docs/design/presentation.md`.
- Every referenced asset must exist, be declared in the manifest, and fail loudly
  when missing.
- The renderer uses the explicit tested nine-layer compositor order.
- Never blur full-resolution layers per frame. UI is never post-processed.
- Do not write tests that assert on rendered pixels.

## Commands

```bash
npm install
npm run dev
npm run project:status
npm run verify:quick
npm run verify:quality
npm run verify:gameplay
npm run build
npm run lint
npm run test
npm run sim -- --seed N
npm run balance:smoke
npm run balance-check
```

## Working agreement

- Work and test locally first. The developer decides when to commit and push.
- Preserve unrelated work in a dirty tree.
- Report measured results honestly. Never label a missed target as met or replace a
  skipped measurement with an estimate.
- Do not change specified values silently. If one appears wrong, report it and
  propose a change.
- Browser-facing changes require exercising the affected path and inspecting the
  console. Subjective audio/visual quality requires developer review.
- A push to `main` deploys only after build, current lint, and tests pass. Lint still
  permits the known warning backlog. Balance is not a deployment gate while the
  recorded baseline is failing.

## Definition of done

For code changes: build, lint, and tests pass; report existing warnings. For
browser-facing work, add local browser verification. For core mechanics, game data,
simulation policy, progression, or balance, also run the full two-seed
`npm run balance-check` and report failures verbatim. Pure documentation does not
require game verification; run `git diff --check`.
