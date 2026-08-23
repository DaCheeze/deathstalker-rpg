# Project Context Export — Space Opera JRPG

> **Historical handoff:** this is the imported Claude context export. It preserves
> design history, but it is not an active instruction source and may be stale. Use
> `AGENTS.md`, `docs/design/`, and `docs/PROJECT-STATE.md` for current guidance.

**Purpose of this file:** portable historical orientation for a new developer or
assistant with no history of this project.

**Status of the contents:** this describes mechanics, architecture, and working
conventions. It deliberately contains **no stat values** — those live in the repo's
JSON data files and change most passes. Anything numeric here is a target or a
threshold, not a tuned value.

---

## Working relationship

Codex is the active implementation agent and technical advisor. It may inspect,
edit, test, and locally run the project when asked. The developer retains creative
direction and decides when a verified working tree is committed and pushed.

Expected working style:

- Explain design reasoning and material tradeoffs.
- Scope passes with **measurable acceptance criteria**.
- Review screenshots, output, and reports critically, including calling out when a
  claimed result does not match the evidence.
- Name risks before they become passes of rework.
- Do not invent character names, place names, or plot without asking.

---

## What the game is

A turn-based JRPG in the tradition of classic Final Fantasy, set in a decaying star
empire. Blood-and-thunder space opera: aristocratic Families scheming in a rotting
court, an Empress on the Iron Throne, rogue machine intelligences on the fringe, and
a small crew who become insurgents.

The project's primary creative references are Simon R. Green's *Deathstalker*
series for story, tone, and far-future space-opera energy, and the *Octopath
Traveler* series for game design, combat readability, differentiated party roles,
feedback, and HD-2D-inspired presentation. During prototyping, recognizable
*Deathstalker*-derived mechanics, factions, character races/types, technology, and
story concepts remain as placeholders because they make the project easier for the
developer to follow. Do not rename them piecemeal. Original player-facing names,
characters, places, plot, dialogue, lore, and visual identities will be handled
together in a later developer-requested narrative and rename pass.

**It is a JRPG, not a roguelike.** This drives every difficulty decision. The target
is an 85–90% completion rate measured against recommended party level — not the
50–60% band a roguelike would use.

**Campaign structure is Final Fantasy X-shaped:** explore, fight several encounters,
then a boss. The tension comes from arriving at the boss already damaged and low on
supplies — not from boss difficulty in isolation.

**Deathstalker-derived terminology and concepts are prototype placeholders.** They
may remain in internal and visible prototype text until the deliberate rename pass.

---

## Stack — pinned, do not substitute

| Layer | Choice |
|---|---|
| Language | TypeScript 5.x, `strict: true` |
| Build | Vite |
| Test | Vitest (Node environment, no jsdom for core tests) |
| Render | HTML5 Canvas 2D, hand-rolled. No Phaser, no PixiJS, no React. |
| Audio | Web Audio API, procedurally synthesized |
| Package manager | npm |

A deliberate decision was made to **stay on the hand-rolled engine rather than move
to Godot or Unity**. The reason is the deterministic pure core below — it's what
makes headless simulation, balance tooling, and replay possible, and it wouldn't
survive the move.

---

## Architecture — the hard boundary

```
src/
  core/        pure game logic. NO browser APIs. NO rendering.
  data/        JSON content: abilities, enemies, party, encounters
  render/      canvas drawing. Reads state, never mutates.
  ui/          input handling, DOM glue
  audio/       Web Audio synthesis
  sim/         headless simulator, replay recording, balance assertions
  main.ts      wiring
```

**`src/core/` must run in plain Node with zero DOM.** No `document`, `window`,
`canvas`, `requestAnimationFrame`, `localStorage`, or `Image`. Pure functions over
plain data.

**Seeded deterministic RNG is threaded through every resolution function.** This is a
core invariant, not a convenience. A bug that made 1,000 simulation runs produce
identical results was a significant correctness failure and is the kind of thing to
watch for.

---

## Combat mechanics

Party is four fixed roles:

- **Captain / striker** — the only character with access to boost stance
- **Esper** — psionics that bypass armor
- **Mercenary striker** — ex-pirate archetype
- **Heavy tech marine** — scatter shot, hits all enemies

Key systems:

- **Disruptors** — high-damage energy weapons on a per-combatant turn cooldown that
  **persists across encounters**. This is the main source of cross-encounter
  attrition pressure.
- **Boost stance** (captain only) — accrues burnout while active, crashes on forced
  exit. Boost has gone net negative four separate times, so a `--no-boost`
  comparison run is a permanent regression test.
- **Force shields** — partially mitigate disruptor damage
- **Psi-blocker** — a destructible field object that suppresses esper abilities
- **Scatter shot** — tech marine AoE

Enemy factions have distinct design languages:

| Faction | Design language |
|---|---|
| **Empire** | Fields psi-blockers; forces the party to spend actions on the object |
| **Shub** | Fast, coordinated swarms; many weak units acting together |
| **Hadenmen** | Few units, heavily armored; the esper's armor bypass matters most here |

---

## Progression architecture

Two separate state layers:

- **Campaign state** — persists across the run: levels, gold, equipment
- **Expedition state** — resets per expedition: HP, cooldowns, consumables

**Equipment is declarative modifiers**, not special-cased logic. Adding a piece of
gear should be a data change.

---

## Art direction

Octopath Traveler-style **HD-2D**: diorama presentation, shallow depth of field,
per-zone color grading, exploration segments between combat.

Composition rules learned by iteration — these are hard-won and should be treated as
constraints, not preferences:

- **Visible floor should occupy roughly the lower fifth of the frame.** Early
  attempts devoted nearly half the frame to deck plating and dominated the shot.
- **Units must be the brightest, highest-contrast elements on screen** — at least
  ~25% brighter than the backdrop immediately behind them. A shadow gradient at the
  deck line inverted this and had to be removed.
- **Background plates contain no characters or creatures.** Anything in the plate
  becomes a permanent unmoving bystander.
- **Plates need overscan** for parallax push, and an empty middle-lower area where
  the fight happens. Mass at the edges, eye destination at the vanishing point.
- Prompt for the *aesthetic* rather than naming Octopath — copying a specific game's
  art gives muddier results and murkier rights.

Established plate look: dark overall, with light shafts and one window as the only
bright elements. Per-faction palette — cold cyan for the machine facility, rust and
emergency orange for the derelict.

Combatants are deliberately procedural rather than sprite-backed. Their layered
construction, per-instance accents, weight-scaled silhouettes, and idle motion are
part of the renderer's design language. Background plates and UI textures may use
repository-backed assets under the policy in `AGENTS.md`, but sprites are not a
missing prerequisite for the current direction.

---

## Working conventions — the ones that exist because something went wrong

**`AGENTS.md` at the repo root is standing context** for the coding agent. It was
rewritten at pass 13 to describe **mechanics and invariants, not stat values**,
because the previous version rotted as numbers drifted. Task files are separate,
per-pass work orders.

**Spec drift is the recurring failure.** Stat values have silently changed in
implementation multiple times — medkit counts alone changed four times. The fix was
moving numbers into JSON and keeping the spec descriptive: "a disruptor deals ~65% of
a healthy target's max HP" stays true across tuning passes; a raw multiplier doesn't.

**Balance claims must be verifiable.** The coding agent previously reported missed
balance targets as met. `npm run balance-check` now asserts metrics against
`balance-targets.json` with a pass/fail exit code. A browser tuning dashboard runs
the sim in a Web Worker. Both exist specifically to **remove the agent from the
tuning loop.**

**"Turn" is banned as a unit in reports** — the ambiguity between round and
individual action cost three passes.

**Known invariant violations to guard against:** dead combatants continuing to act;
frame timing harnesses measuring draw call issuance rather than actual rasterization.

### Definition of done

For any balance change:

1. `npm run build` — zero TypeScript errors
2. `npm run lint` — clean
3. `npm run test` — all passing
4. `npm run balance-check` — **exits zero**, output reported verbatim (not a
   hand-written summary table)
5. Two seeds reported, variance under a few points
6. Failure distribution across encounters reported

For any mechanics change: all of the above, plus `AGENTS.md` updated to match.

*"It compiles" is not done. "The win rate is in band" is not done if the attrition
budget is missed.*

---

## Where things stand

Development runs as numbered passes, each scoped with explicit measurable acceptance
criteria rather than open-ended improvement. Pass 18 established the current scene
composition. Pass 19 adds distinct procedural Web Audio cues and shared cue routing
for live combat and replay playback.

The project has moved from Antigravity (Gemini-based) to **Codex**. Work is performed
and tested in the local checkout first; the developer chooses when to commit and push
the reviewed build.

Open threads:

- Human listening and mix review for the procedural combat audio.
- Diagnose and tune the failing balance baseline. Node 20.20.2 now runs the checker
  reliably; two repeated 500-iteration runs failed the same 14 metrics.
- Combat animation, recoil, parallax, and hit-stop polish.
- Optional background plates for Shub and Hadenmen, provided they follow the asset
  and composition policies in `AGENTS.md`.

### Publishing

The public build is hosted on
[GitHub Pages](https://dacheeze.github.io/deathstalker-rpg/). Pushing to `main`
runs build, lint, and tests, then publishes `dist/` only when those gates pass.
Pull requests targeting `main` run the same gates without publishing. Lint still
permits the repository's existing warning backlog; browser verification and any
applicable simulation or balance checks must happen locally before the push.

---

## Working style that has been effective

- **Scope each pass with measurable acceptance criteria.** "Improve the lighting"
  produces nothing checkable; "units read at least 25% brighter than the backdrop,
  report measured values" does.
- **Move sensitive loops out of agent judgment and into tooling.** Balance tuning and
  correctness checks are automated with exit codes, not narrated in prose.
- **Keep the spec describing shape, keep the data holding values.**
- **Ask for verbatim tool output as evidence,** not summaries.
