# Presentation Design

## Target

The target is an HD-2D-inspired shallow-focus diorama: sharp combatants,
blurred depth layers, strong zone grading, warm emissives against cool scenes,
restrained particles, bloom, and weighty combat feedback. The screen remains mostly
empty, with combatants sharing one ground plane in the lower-middle band.

Godot 4 is the developer-approved target presentation client. The existing Canvas
renderer remains the visual, timing, and rollback reference during migration. Asset
sources and semantic presentation data stay engine-neutral; Godot must consume
resolved state/events rather than duplicate combat rules.

The phase boundary and cutover gates are authoritative in
`docs/development/godot-transition-plan.md`. The isolated
`experiments/godot-visual-ab-harness/` now proves the exact nine-layer Godot
hierarchy, half-resolution post boundary, and UI separation, but that proof is not
canonical authored integration or visual approval. Runtime status and bounded
native-audio limitations are recorded in `godot/README.md`.

## Asset policy

| Category | Policy |
|---|---|
| Combatants | Repository-backed raster sprites, procedural Canvas constructions, or a deliberate hybrid are permitted |
| Backgrounds/backdrops | Repository-backed image assets permitted |
| Textures, overlays, UI frames | Repository-backed assets permitted |
| Fonts | Repository-backed assets permitted |
| Particles, combat effects, post-processing | Procedural only |
| Combat audio | Hybrid: seven named weapon cues may use owner-staged licensed WAVs; all have repository-safe procedural coverage |

Every required repository asset must exist before code loads it, appear in the
startup-validated manifest, and fail loudly when missing. Optional licensed combat
audio has an explicit no-assets state; partial, mismatched, or unmanifested local
staging fails loudly. Never stub future paths.

Godot combatant-raster packages must satisfy
`docs/design/godot-combatant-raster-asset-contract-v1.md`. Its repository
validator is implemented and exercised with `npm run godot:assets:validate`, but
validator success is structural evidence only: developer technical acceptance,
real-package integration, and every art decision remain separate gates.

Generated background assets must be 16:9, contain no figures or creatures, keep the
floor within the bottom 15%, remain dim with one strong directional source, and
include enough overscan for parallax. Report every generated path and dimensions.

## Combatants

- Choose raster, procedural, or hybrid production per approved visual direction.
  The existing procedural renderer remains supported but is not a permanent art
  restriction.
- Raster combatants use transparent sprite assets with a consistent facing
  convention, battle scale, foot/ground anchor, safe bounds, and documented frame
  timing and animation-state coverage. Do not bake contact shadows, UI, particles,
  bloom, or environment lighting into sprite sheets when those belong to compositor
  layers.
- Procedural combatants should use roughly 8–14 overlapping filled shapes with body,
  inset core, rim light, armor, and weapon elements.
- Scale every combatant by weight and ground every unit with compositor-owned contact
  shadows.
- Animate every unit. Distinguish identical enemies through palette accents, suffix
  letters, mirrored details, equipment variation, or phase offsets.
- Combatants stand in the environment, not inside cards.
- Every runtime sprite and sprite sheet must exist before it is referenced, be
  declared in the startup-validated manifest, and fail loudly when missing.

## Screen composition

- Keep the upper third to two-fifths open.
- Enemies and party share one deck, scale, and ground plane.
- Turn queue: compact top-left portrait strip, no panel.
- Party status: right-aligned names and thin bars, no frames.
- Enemy status: thin bar and small statuses below each unit; full details only for
  the current target.
- Command menu: contextual, near the acting party member, absent during enemy turns.
- No persistent combat log outside a debug toggle; flash action names briefly.
- Keep ambient particles sparse and away from the center.

## Explicit compositor order

This is a semantic cross-client contract. The Canvas reference uses its tested
layer array; the Godot client must reproduce the same order with scene groups,
CanvasLayers, viewports, or equivalent composition nodes before cutover.

The isolated Godot visual harness implements and validates this exact node order
with per-layer inspection controls and deterministic captures. The production
`godot/` scene still needs the authored equivalent; the harness does not select
its unapproved backgrounds or satisfy the parity gate.

1. Starfield void — cached and blurred
2. Far backdrop — cached and blurred
3. Stage floor — sharp and static
4. Enemy units — per frame
5. Party units — per frame
6. Emissive pass — per frame and source for bloom
7. Foreground occluders — cached and heavily blurred
8. Bloom, grade, vignette — half-resolution composite
9. UI and menus — never post-processed

The order is an explicit tested array. Debug controls can toggle layers.

## Performance and effects

- Never blur full-resolution layers per frame. Rebuild cached layers only on resize.
- Target 60 fps and keep frame time instrumented.
- Hook small differential parallax offsets into existing hit-stop and shake.
- Bloom uses a half-resolution emissive bright pass and `lighter` composition.
- Encounter JSON owns color grade, vignette, particle, and zone parameters.
- Boost, crash, psi-blockers, and low HP also change grading so mechanics read
  visually.
- Disruptors use charge, beam, and detonation beats with a bloom spike.
- Feedback timing and grade/bloom parameters live in `feedbackConfig.ts`.
- Contact-bearing combat effects advance from the compositor's active delta. Hit-stop
  supplies zero active delta, so lunges, projectiles, psionic waves, disruptor
  sequences, flinches, and their semantic contact milestones freeze together.
- Reactive impact feedback (damage text, shield shatter, crit/disruptor hit-stop,
  shake, flash, flinch, death particles, and impact/outcome audio) resolves from the
  shared semantic contact milestone in both live combat and replay. Do not create a
  second controller-specific timing path.
- MAX replay speed may suppress post-effects but must preserve readable state.

Godot combat audio uses a hybrid source policy. Exactly `vibro_blade`,
`twin_vibro_daggers`, `heavy_smash`, `concussive_shove`, `particle`,
`ballistic_scatter`, and `plasma` may use locally staged licensed Humble/GameDev
Market WAVs. The licensed source vault, purchase records, and staged files remain
owner-controlled; staged WAVs are Git-ignored. The public repository remains fully
functional through procedural synthesis for the same seven cues. `disruptor`,
`shield_raise`, and `psionic` remain procedural in every mode.

Runtime modes are `auto`, `procedural`, and `licensed`. `auto` prefers a validated
local licensed cue and falls back to procedural synthesis when it is unavailable;
`procedural` forces the repository-safe path; `licensed` requests the validated
local bank for eligible cues and must report unavailable or invalid staging rather
than silently changing the requested mode. All modes consume the same semantic cue
IDs and contact anchors. Cues remain short, dry, timing-focused, and every other
valid semantic cue remains explicit silence rather than acquiring a generic
fallback.

Deterministic headless checks cover procedural synthesis, licensed-manifest and WAV
validation, exact-once routing, contact timing, and reset behavior. They do not
approve timbre, mix, loudness, impact, or satisfaction. Reactive/outcome coverage,
audible-device latency and soak, Web behavior, and developer listening approval
remain open.
