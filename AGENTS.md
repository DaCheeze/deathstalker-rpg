# AGENTS.md

## What this is

A turn-based JRPG in the tradition of classic Final Fantasy, set in a decaying
star empire. Blood-and-thunder space opera: aristocratic Families scheming in a
rotting court, an Empress on the Iron Throne, rogue machine intelligences on the
fringe, and a small crew of salvagers who become insurgents.

Combat terminology is borrowed from Simon R. Green's Deathstalker series as
working shorthand during prototyping. Player-facing text should use original
names; internal terms may stay as-is until a rename pass.

Structure is Final Fantasy X: explore, fight several encounters, then a boss. The
tension comes from arriving at the boss already damaged and low on supplies, not
from boss difficulty in isolation.

---

## Reading this document

**This file describes mechanics, invariants, and targets — not stat values.**
Specific numbers (HP, attack, multipliers, item counts) live in `src/data/*.json`
and change most passes. Do not duplicate them here; this document rots when they
drift.

When a task says "tune X," it means change the data file. When it says "change how
X works," it means this document needs updating too.

**Corollary: tunable values must live in data or config, not hardcoded in core.**
If a number is something a balance pass would plausibly change — regeneration
rates, thresholds, multipliers, item counts — it belongs in a JSON file, not a
constant in a `.ts` module. Anything hardcoded in core is invisible to the tuning
dashboard and to `balance-overrides.json`.

---

## Stack — pinned, do not substitute

| Layer | Choice |
|---|---|
| Language | TypeScript 5.x, `strict: true` |
| Build | Vite |
| Test | Vitest (Node environment, no jsdom for core tests) |
| Render | HTML5 Canvas 2D, hand-rolled. No Phaser, no PixiJS, no React. |
| Audio | Web Audio API, procedurally synthesized. No audio files. |
| Art | Procedural canvas primitives. No sprites, no image assets. |
| Package manager | npm |

Do not add a dependency without asking first.

---

## Commands

```bash
npm install
npm run dev              # Vite dev server
npm run build            # production build; zero TS errors required
npm run test             # Vitest, headless
npm run lint             # ESLint; must pass clean
npm run sim              # headless run simulator
npm run sim -- --seed N  # seeded run
npm run balance-check    # asserts metrics against balance-targets.json
```

---

## Architecture — the hard boundary

```
src/
  core/        pure game logic. NO browser APIs. NO rendering.
  data/        JSON content: abilities, enemies, party, encounters.
  render/      canvas drawing. Reads state, never mutates.
  ui/          input handling, DOM glue.
  audio/       Web Audio synthesis.
  sim/         headless simulator, replay recording, balance assertions.
  main.ts      wiring.
```

**`src/core/` must run in plain Node with zero DOM.** No `document`, `window`,
`canvas`, `requestAnimationFrame`, `localStorage`, or `Image`. If a core module
cannot be imported and executed in a Vitest test with no browser environment, the
design is wrong.

This constraint is load-bearing. It is what allows the simulator to run headless,
the balance checker to run in CI, and the tuning dashboard to run in a Web Worker.
Do not erode it.

Core exposes pure functions over plain data:

```ts
function applyAction(state: BattleState, action: BattleAction, rng: RNG): BattleState
```

No hidden mutation, no singletons, no event emitters in core. RNG is threaded in
explicitly — **never call `Math.random()` inside core.** Determinism is required
for replay and for meaningful simulation.

---

## Combat mechanics

Four crew versus up to four enemies plus objects. Discrete turn queue, not
real-time.

### Turn queue

A first-class object in state, built from a speed-based tick accumulator,
projecting roughly the next 8 turns. It supports runtime manipulation —
displacement pushes a combatant back by a number of ticks.

Do not refactor this into an implicit sort at the top of each round. Displacement
is a core tactical layer.

Combatants with speed 0 (psi-blockers) never take turns and are excluded from the
queue. Dead combatants are purged from the queue immediately on death.

### Disruptors

Every combatant carries one. It is devastating and almost always unavailable —
which is why everyone still carries a blade.

- High damage, targeting roughly **65% of a healthy target's max HP**
- Force shields only partially mitigate it — see Force shields below. Nothing
  else in the game reduces it.
- Cooldown measured in **that combatant's own turns**, not global rounds
- **Cooldown persists across encounters within a run**

That last rule is the point. Firing in fight two may mean entering fight three
without it. The cooldown is a run-level decision, not a per-fight one.

Enemy disruptor charge state must be visible to the player.

### Boost — captain only

Only the captain has `canBoost: true`. It is a character identity, not a party
buff.

- Entering is a **free action** — it does not consume the turn
- Grants a damage and speed bonus while active
- Accrues **burnout** on entry and each turn boosting; decays each turn not
  boosting
- Above a chip threshold, burnout deals damage each turn
- At the crash threshold, forced exit plus a multi-turn **crash** during which the
  captain cannot act
- **Voluntary exit is clean — no crash.** Only forced exit crashes

Design intent: ride it and drop out deliberately, or push too far and pay.

Boost must be net positive — baseline must beat `--no-boost` in simulation. It has
regressed to net negative four separate times. Treat that comparison as a
regression test on every balance pass.

### Force shields

Raised as an action, costing a turn. Single use, then drops.

- Blocks melee and projectile attacks completely
- **Partially mitigates disruptor damage** — the player's only counter to an
  incoming disruptor
- **Psionic attacks bypass shields entirely**

### Espers

The party has exactly **one** esper. She is dangerous with psionics and weak with a
blade. Abilities cost ESP from a per-battle pool that regenerates slowly, and
partially between encounters.

Her kit splits cleanly by purpose — one ability for armor-bypassing damage, one for
defense debuffs. **Do not recombine damage and turn displacement into a single
ability.** That combination made it mandatory in every encounter and had to be
split apart.

Turn displacement lives with the physical striker, not the esper.

### Psi-blockers

A destructible object on the field, not an encounter flag. Speed 0, no turns, no
offense. While any psi-blocker lives, esper abilities are disabled for both sides.
Destroying them restores psionics immediately.

The fiction: a device containing a tortured esper brain, screaming psychically.
Empire technology.

Design intent: a real decision between spending turns silencing it and fighting
through the debuff. It occupies an enemy slot and can take splash damage from
multi-target attacks — keep incidental splash kills below ~30% of its deaths, or
the decision evaporates.

### Party roles

Four distinct roles. Each should be the top damage contributor in at least one
encounter type. If one never leads, that role is not pulling weight.

| Role | Identity |
|---|---|
| Captain / Striker | Burst damage, sole access to boost |
| Esper | Armor bypass and debuffs; physically weak |
| Mercenary Striker | Highest speed, high crit, turn displacement |
| Heavy Tech Marine | Multi-target crowd control against swarms |

The marine's scatter shot hits **all living enemies** at reduced per-target damage
— break-even at two targets, clearly better at three or more.

### Enemy factions

Three design languages, so encounters feel different:

- **Empire** — ordinary soldiers and House guards. Balanced. Fields psi-blockers.
- **Shub (rogue AIs)** — identical, fast, coordinated units. Punish slow play.
- **Hadenmen (augmented post-humans)** — few, heavily armored, hit hard. Punish
  wasted disruptor shots.

---

## Campaign and expedition progression (JRPG structure)

The game follows a JRPG structure: preparation, levels, equipment, and gold provide the player with strategic levers. Difficulty is measured as a **curve** relative to `recommendedLevel`.

### State architecture

- **`CampaignState`**: Persists across expeditions. Owns party level (cap 10), XP, gold, reserve consumable inventory, owned equipment, assigned equipment, and completed expeditions.
- **`ExpeditionState`** (formerly `RunState`): Represents a single active run. Initialized with computed combatant stats and provisioned consumable rations. Resets upon return.
- **Stat computation**: Pure function: `base + (level - 1) * growth + equipmentModifiers`. `BattleState` receives the resulting plain `Combatant` without needing level knowledge.

### Equipment catalog

- **Slots**: Weapon and Accessory.
- **Declarative modifiers**: Evaluated by the pure stat computation engine (Attack, Defense, Max HP, Max ESP, Speed, Disruptor Cooldown reduction, Boost Chip threshold offset, ESP efficiency).

### Healing & shop economy

- Encounters award XP and Gold scaled by tier.
- Consumables (medkits and revive stims) are purchased with gold between expeditions, capped by `maxMedkitsPerExpedition` and `maxRevivesPerExpedition`.
- In-expedition healing remains a finite supply decision.

---

## Run structure

An expedition is an ordered sequence of encounters ending in an elite or boss fight.

### What persists between encounters

| Resource | Behavior |
|---|---|
| HP | Persists exactly. No free healing. |
| ESP | Persists with partial regeneration. |
| Burnout | Persists at half value. |
| Disruptor cooldown | Persists exactly. |
| Force shield | Clears. |
| Crash state | Clears. |
| Deaths | KIA persists for the expedition unless revived. |

### Encounter tiers & attrition budget (at Recommended Level)

Each encounter carries a `tier` field. Tiers define both pacing and attrition cost at the recommended level.

| Tier | Rounds | HP cost (% of party max, before healing) |
|---|---|---|
| Skirmish | 3–5 | ~10% |
| Standard | 5–7 | ~25% |
| Elite | 6–8 | ~35% |
| Boss | 8–10 | remainder |

### JRPG difficulty curve

Difficulty is evaluated across a level sweep around `recommendedLevel` with full supply:

| Party level relative to recommended | Target clear rate |
|---|---|
| +1 or more | 95%+ |
| At recommended level | 85–90% |
| One level under | 55–65% |
| Two levels under | 20–30% |

- **Supply sensitivity**: Clear rate difference between Full Supply and Half Supply must be $\ge 10\%$.
- **Boss ingress**: Party enters final encounter at 50–70% HP with 1–2 medkits remaining.
- **Minimum sample guard**: Failure distribution assertions are suppressed when total run failures $< 20$, reporting `INSUFFICIENT DATA` instead of evaluating noise.

---

## Simulation and verification

The simulator is not optional tooling. Balance is measured, not felt.

- Simulate complete **runs**, not isolated battles. Run completion rate is the
  primary metric; individual battle win rate is a secondary diagnostic.
- Policy modes — `--no-disruptor`, `--no-boost`, `--no-esper` — verify that every
  mechanic is load-bearing. **Baseline must beat all three.**
- Always report **two seeds.** Seed-to-seed variance above a few points means the
  result is noise.
- Report **rounds and actions** per encounter. A "turn" is ambiguous and must not
  be used as a unit in reports — that ambiguity cost three passes of misdirected
  pacing work.
- `npm run balance-check` asserts every metric against `balance-targets.json` and
  exits non-zero on failure. **This is the source of truth for whether balance
  passes — not a hand-written summary table.**

### Replays

Battles are recorded as seed plus an ordered action list, replayable exactly.
`--record-samples` saves a median, shortest, and longest battle per encounter.

Replays answer questions the tables cannot: whether a fight is interesting,
whether a mechanic reads, where a long battle stalls.

---

## Presentation

The target look is **HD-2D** — the Octopath Traveler style: sharp foreground
subjects in a shallow-focus diorama, heavy bloom, strong per-zone color grading,
and constant ambient particles.

**Adapted for this stack.** HD-2D normally means pixel-art sprites in 3D
environments. This project has neither. The look does not come from the sprites —
it comes from the post-processing. Procedurally drawn units sit in the sprite
slot of the layer stack and receive the same treatment.

### Asset policy

**The agent never creates, generates, or invents image assets.** It cannot
produce images, and referencing a file that does not exist on disk is a build
failure waiting to happen. If a task seems to require art that is not already in
the repository, stop and say so rather than stubbing a path.

Within that constraint:

| Category | Policy |
|---|---|
| Combatant units | **Procedural only.** No sprites. |
| Backgrounds and backdrops | Developer-supplied image assets permitted |
| Textures, overlays, UI frames | Developer-supplied image assets permitted |
| Fonts | Developer-supplied permitted |
| Particles, effects, post-processing | Procedural only |

Combatants stay procedural because per-instance accent colors, weight-scaled
silhouettes, mirrored variation, and idle animation all come free from drawing
code and would otherwise need frame-by-frame authoring. The enemy roster will
keep growing; each new unit should cost a function, not an art commission.

Asset loading must fail **loudly** — a missing file is an explicit error at load,
never a silent fallback or an empty draw. Any asset the renderer expects must be
listed in a manifest that is validated at startup.

### Combatant construction

- **Layered construction.** Each unit is 8–14 overlapping filled shapes: base
  body, darker inset core, rim light on one edge, separate armor and weapon
  elements. Fills carry the form; outlines and glow are accents, not the primary
  read.
- **Silhouettes scale by weight.** A dreadnought visibly dwarfs a drone.
- **Nothing is static.** Idle animation on every unit — hovering, breathing,
  rotating.
- **Identical enemies must be visually distinguishable** — instance accent color,
  suffix letter, mirrored detail, offset animation phase.
- **Combatants stand in the environment**, grounded on a stage floor with contact
  shadows. Not in cards. Card frames make it read as a dashboard.

### The layer stack

Rendering is a compositor. Each layer is its own offscreen canvas; the compositor
in `render/` walks them in order and draws each into the visible canvas.

Back to front:

| # | Layer | Redraw cost |
|---|---|---|
| 1 | Starfield void | Pre-blurred, cached |
| 2 | Far backdrop | Pre-blurred, cached |
| 3 | Stage floor | Sharp, static |
| 4 | Enemy units | Per frame |
| 5 | Party units | Per frame |
| 6 | Emissive pass | Per frame — feeds the bloom |
| 7 | Foreground occluders | Heavy blur, cached |
| 8 | Bloom, grade, vignette | Half-resolution composite |
| 9 | UI and menus | **Never post-processed** |

**The layer order is an explicit ordered array in code, not an implicit sequence
of draw calls.** A Vitest test asserts the order. A debug key toggles individual
layers on and off. Layer order is exactly the kind of thing that gets silently
reshuffled during a refactor, and it is invisible in a screenshot until something
looks subtly wrong.

Nothing in this section touches `src/core/`.

### The performance rule

**Never blur per frame.** `ctx.filter = 'blur()'` is brutally slow in Canvas 2D.

Static layers are blurred once at load into their offscreen buffers and never
touched again unless the canvas resizes. Only the two unit layers and the
emissive pass redraw each frame.

Target 60fps. Frame time must be instrumented and reportable.

### Depth of field

The single biggest contributor to the look, and free once cached.

Heavy blur on the starfield, far backdrop, and foreground occluders. Sharp on the
stage floor and the units. That contrast alone is most of what makes a scene read
as HD-2D.

### Parallax

How the 3D is faked. Each layer offsets by a different multiplier when the camera
nudges — turn transitions, hit-stop, boost activation, screen shake.

Even ±8px of differential across layers sells depth convincingly. Hook the
offsets to the existing hit-stop and shake systems rather than building a
separate camera.

### Bloom

The one effect worth its frame cost.

Draw a bright-pass into a **half-resolution** offscreen canvas, blur that once,
then draw it back scaled up with `globalCompositeOperation = 'lighter'`. Half-res
is what makes it affordable; the blur hides the upscale.

### Emissive pass

Each unit may define an optional emissive layer — disruptor charge glow, esper
eye-shine, engine wash, console light. **Only the emissive layer feeds the
bright-pass.**

This is what prevents the sterile-sci-fi problem. HD-2D's warmth comes from soft
organic light sources; sci-fi palettes drift cold and clean. Warm emissives
against a cold graded scene produce that warmth without a single torch in the
scene.

### Color grade and vignette

Composite operations over `fillRect`, not shaders:

- A warm or cold wash at `'multiply'`
- A lift at `'screen'`
- A cached radial-gradient vignette on top

**Per-encounter grade settings live in the encounter JSON**, so a new zone look is
a data change, not a TypeScript change. Empire warm and metallic, Shub cold and
sterile, Hadenman dark with harsh red.

### Particles

Constant, subtle ambient motion in every scene — dust motes, drifting debris,
sparks, ember drift. Never so dense it competes with the units.

### Mechanic-driven grading

State the player currently reads off a number should also read visually:

- **Boost active** — warm rim light on the captain, slightly stronger grade
- **Burnout crash** — saturation drops until recovery ends
- **Psi-blocker alive** — interference wash across the scene
- **Low party HP** — vignette tightens, grade cools

### Combat feedback

- **Hit-stop on impact** — this does more for combat weight than any other single
  technique.
- **The disruptor is a three-beat event**: charge, beam, detonation. It must read
  as heavier than anything else on screen, and it should drive a bloom spike.
- Audio is synthesized Web Audio placeholders — short, dry, timing feedback only.

All feedback timings live in `feedbackConfig.ts`. All grade and bloom parameters
live alongside them. Everything degrades gracefully at MAX replay speed — post
effects suppressed, state still readable.

---

## Conventions

- `strict: true`. No `any`. No non-null assertions without a comment.
- Discriminated unions for actions and effects.
- Name things from the fiction, not `Weapon1`.
- Small files. A core module past ~300 lines is doing too much.
- Comments explain *why*, never *what*.

---

## Do not

- Do not add dependencies without asking.
- Do not import browser APIs into `src/core/`.
- Do not call `Math.random()` in core — thread the RNG.
- Do not change values specified in a task without saying so. Spec values have
  silently drifted three times (medkit counts, heal percentages, damage
  multipliers). If a specified number seems wrong, say so and propose a change.
- **Do not label a missed target as met.** If a measured value falls outside its
  band, report it as a failure with the number.
- Do not tune to the win rate while missing the attrition budget.
- Do not recombine damage and displacement into one ability.
- Do not write tests that assert on rendering.
- Do not invent character names, place names, or plot. Ask.

---

## Definition of done

For any balance change:

1. `npm run build` — zero TypeScript errors.
2. `npm run lint` — clean.
3. `npm run test` — all passing.
4. `npm run balance-check` — **exits zero**, output reported verbatim.
5. Two seeds reported, variance under a few points.
6. Failure distribution across encounters reported.

For any mechanics change, all of the above plus this document updated to match.

"It compiles" is not done. "The win rate is in band" is not done if the attrition
budget is missed.
