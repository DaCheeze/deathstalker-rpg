# Presentation Design

## Target

The target is an HD-2D-inspired shallow-focus diorama: sharp procedural subjects,
blurred depth layers, strong zone grading, warm emissives against cool scenes,
restrained particles, bloom, and weighty combat feedback. The screen remains mostly
empty, with combatants sharing one ground plane in the lower-middle band.

## Asset policy

| Category | Policy |
|---|---|
| Combatants | Procedural only; no sprites |
| Backgrounds/backdrops | Repository-backed image assets permitted |
| Textures, overlays, UI frames | Repository-backed assets permitted |
| Fonts | Repository-backed assets permitted |
| Particles, combat effects, post-processing | Procedural only |

Every referenced asset must exist before code loads it, appear in the startup-
validated manifest, and fail loudly when missing. Never stub future paths.

Generated background assets must be 16:9, contain no figures or creatures, keep the
floor within the bottom 15%, remain dim with one strong directional source, and
include enough overscan for parallax. Report every generated path and dimensions.

## Combatants

- Build each from roughly 8–14 overlapping filled shapes with body, inset core, rim
  light, armor, and weapon elements.
- Scale silhouettes by weight and ground units with contact shadows.
- Animate every unit. Distinguish identical enemies through accents, suffix letters,
  mirrored details, or phase offsets.
- Combatants stand in the environment, not inside cards.

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
- MAX replay speed may suppress post-effects but must preserve readable state.

Audio remains procedural Web Audio: short, dry, timing-focused cues with no files.
