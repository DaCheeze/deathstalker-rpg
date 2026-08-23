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
| Narrative research, story structure, gameplay integration | `.agents/skills/narrative-systems-designer/SKILL.md` |
| Combat mechanics, roles, factions | `docs/design/combat.md` |
| Runs, progression, balance, simulation | `docs/design/run-and-balance.md` |
| Canvas rendering, assets, visual/audio feedback | `docs/design/presentation.md` |
| Godot transition phases and cutover gates | `docs/development/godot-transition-plan.md` |
| Godot combatant raster packages | `docs/design/godot-combatant-raster-asset-contract-v1.md` |
| Verification, deployment, reporting | `docs/development/workflow.md` |
| Production pass history and current handoff | `docs/development/production-pass-ledger.md` |
| Studio agents, delegation, cloud autonomy | `docs/development/agent-workflow.md` |
| Current milestone, known failures, next work | `docs/PROJECT-STATE.md` |

Read `docs/PROJECT-STATE.md` when beginning implementation or planning. Do not read
every design document unless the task crosses every area.

`PROJECT-CONTEXT-EXPORT.md` is a historical Claude handoff, not an authoritative
instruction source.

## Developer-approved Godot transition

The developer approved a staged transition to Godot 4 on 2026-08-23. Godot is the
target presentation client; this is no longer an isolated engine evaluation.

- Keep the deterministic TypeScript core authoritative during the first migration
  phases. Godot consumes a versioned plain-data presentation bridge and must not
  reimplement combat resolution in GDScript.
- Keep the browser/Canvas client working as a parity and rollback reference until
  the recorded Godot cutover gates pass. Do not delete it merely because a Godot
  scene exists.
- Put production Godot work in `godot/`. Keep `experiments/godot-hd2d-spike/` as
  historical evaluation evidence.
- New visual, animation, and audio presentation work should target Godot first.
  Shared rules, simulation, balance, and content validation remain browser-free
  TypeScript unless the developer approves a later core-language migration.
- The isolated nine-layer harness is validated architecture evidence, not canonical
  authored integration or visual approval. The canonical client has a ten-cue
  procedural baseline plus an optional local licensed-audio path for seven named
  weapon cues; device, Web, and listening parity remain open.

## Stack — transition target

| Layer | Choice |
|---|---|
| Language | TypeScript 5.x, `strict: true` for the authoritative core; typed GDScript for Godot presentation |
| Build | Vite for the parity client; Godot 4.x for the target client |
| Test | Vitest/Node for core and bridge; Godot headless script and scene smoke checks |
| Render | Godot 2D is the target; hand-rolled Canvas 2D remains the migration reference |
| Audio | Godot hybrid audio: optional owner-staged licensed WAVs for seven named weapon cues, repository-safe procedural fallback, and procedural Web Audio reference |
| Package manager | npm |

Do not add a dependency without asking first. Use Node 20 LTS.

## Architecture — load-bearing boundaries

```text
src/core/    pure deterministic game logic; no browser APIs
src/data/    JSON content and tunable values
src/bridge/  pure versioned serializers for presentation clients
src/render/  Canvas drawing; reads state, never mutates it
src/ui/      input handling and browser wiring
src/audio/   Web Audio synthesis
src/sim/     headless simulation, replay, and balance tools
src/main.ts  wiring
godot/       target presentation client; consumes bridge data, resolves no combat
```

- `src/core/` must import and run in plain Node with no DOM, Canvas, storage,
  animation, or image APIs.
- Core exposes pure functions over plain data. No hidden mutation, singletons, or
  event emitters.
- Thread RNG explicitly. Never call `Math.random()` in core.
- Tunable values belong in `src/data/*.json`, not hardcoded core constants.
- Use discriminated unions, no `any`, and no unexplained non-null assertions.
- Bridge payloads are plain versioned data produced from core state. Schema changes
  require serializer tests and a matching strict Godot loader update.
- Godot scenes may animate and present resolved actions/events, but must not decide
  damage, legal actions, queue order, cooldowns, targeting, persistence, or outcomes.

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

### Three-character range-band prototype exception

The bounded prototype in `docs/design/three-character-range-band-prototype.md` is
the approved next mechanics target. Its explicit exclusions override the legacy
invariants above only inside that one-encounter prototype. Do not remove the legacy
systems from the wider game or infer campaign rules from their temporary absence.

- Use exactly three anonymous functional party loadouts: Power Melee, Critical
  Melee, and Queue Control Melee. Do not add vocations or an esper.
- Track Ranged, Closing, and Engaged per combatant. Entering Engaged selects a
  specific opponent.
- Give every combatant one visible ready/spent disruptor state. After the rejected
  six-charge opening, only the fastest loadout on each side starts ready. A ready
  charge may be used at Ranged or Closing, or held to interrupt an opponent
  advancing into Closing. It is unusable while Engaged and does not recharge during
  the encounter. When several reactions are possible, the first ready opponent in
  projected queue order fires.
- Movement is advance-only. A combatant whose engagement target falls spends an
  Advance action to select another living opponent while remaining Engaged.
- Exclude force shields, Shields/Armor/Exposed, Boost, multi-encounter persistence,
  and numerical balance acceptance from this prototype.

## Presentation invariants

- Combatants may use repository-backed raster sprites, procedural Canvas
  constructions, or a deliberate hybrid. Choose the approach that best serves the
  full game's visual quality, readability, animation needs, and production scope;
  do not preserve a prototype technique as a permanent restriction.
- Runtime combatant sprites must use transparent assets, explicit ground anchors,
  consistent battle scale, documented animation states, and the validated asset
  manifest described in `docs/design/presentation.md`.
- Every required repository asset must exist, be declared in its manifest, and fail
  loudly when missing. Optional licensed combat audio has an explicit no-assets
  state; partial, mismatched, or unmanifested local staging fails loudly.
- The renderer uses the explicit tested nine-layer compositor order.
- Never blur full-resolution layers per frame. UI is never post-processed.
- Do not write tests that assert on rendered pixels.
- Only `vibro_blade`, `twin_vibro_daggers`, `heavy_smash`, `concussive_shove`,
  `particle`, `ballistic_scatter`, and `plasma` may use locally staged licensed
  Humble/GameDev Market WAVs. Licensed sources, purchase records, and staged files
  remain owner-controlled; staged WAVs are Git-ignored.
- Public and repository-safe operation must retain procedural synthesis for those
  seven cues. `disruptor`, `shield_raise`, and `psionic` remain procedural in every
  runtime mode. Supported modes are `auto`, `procedural`, and `licensed`.

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
npm run godot:fixture
npm run godot:assets:validate
npm run godot:audio:stage -- --source-root "C:\Users\Daniel\Desktop\Sound Effects"
```

## Working agreement

- Work and test locally first. The developer decides when to commit and push.
- After every game-development pass, update
  `docs/development/production-pass-ledger.md` before handing work back. Record the
  objective, material changes, exact verification, subjective gates, and next step.
  Interrupted passes receive an explicit checkpoint entry and are never reported as
  complete.
- Preserve unrelated work in a dirty tree.
- Report measured results honestly. Never label a missed target as met or replace a
  skipped measurement with an estimate.
- Do not change specified values silently. If one appears wrong, report it and
  propose a change.
- Browser-facing changes require exercising the affected path and inspecting the
  console. Subjective audio/visual quality requires developer review.
- A push to `main` deploys only after build, zero-warning current lint, and tests
  pass. Balance is not a deployment gate while the recorded baseline is failing.

## Definition of done

For code changes: build, zero-warning lint, and tests pass. For
browser-facing work, add local browser verification. For core mechanics, game data,
simulation policy, progression, or balance, also run the full two-seed
`npm run balance-check` and report failures verbatim. Pure documentation does not
require game verification; run `git diff --check`.

For Godot changes, also regenerate any affected bridge fixture, run `--check-only`
on every changed GDScript, and run the relevant headless validator/scene smoke.
Visual and audio presentation still require a local capture or listening review and
must not be described as approved from headless checks alone.
