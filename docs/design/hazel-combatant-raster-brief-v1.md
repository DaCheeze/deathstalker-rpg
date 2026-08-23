# Hazel Combatant Raster Brief v1

Status: **direction-approved for the next Hazel concept and vertical-slice studies;
the final costume asset, weapon casings, animation execution, package-schema
extension, and all runtime files remain unapproved**.

This brief translates the approved Hazel direction into a Godot-ready art handoff.
It does not register a Hazel runtime package or extend the anonymous three-character
prototype contract. `visual-style-bible.md` remains the visual authority,
`godot-combatant-raster-asset-contract-v1.md` remains the technical baseline, and
`presentation.md` remains the compositor authority.

## Locked identity and costume direction

- **Identity anchors:** Hazel has unruly red hair and green eyes. Her working body
  direction is tall and lithely muscular, with a sharp, angular face rather than an
  exaggerated pointed caricature.
- **Visual thesis:** an industrial survivor and compactly efficient fighter. Her
  silhouette communicates practical readiness, repaired equipment, and controlled
  athletic force rather than aristocratic flourish or heavy-unit bulk.
- **Preferred costume A — teal industrial field kit:** hard-wearing peacock-teal and
  ivory layers, compact black shoulder protection, a functional industrial collar,
  accessible pouches, and durable boots. Antique-brass hardware remains restrained
  and subordinate to the teal/ivory block structure.
- **Fallback costume B — emerald thermal field kit:** emerald outer construction,
  cream thermal panels, compact black collar and shoulder protection, turquoise
  repair panels, practical pouches, durable boots, and restrained antique-brass
  hardware. This remains a viable readability comparison, not a weaker variation.
- **Condition hierarchy:** include a few established field repairs, blackened fabric
  edges, and restrained old scorch marks. Do not bake major fresh damage identically
  into every base frame; encounter-specific damage belongs in a separately approved
  variant or runtime treatment.
- Keep large orange, rust, copper, coral, or red fields away from the collar,
  shoulders, and head. Small warm repair or hardware accents may appear lower on
  the body when they remain value-separated from her hair.
- **Cover-art calibration:** retain only the recurring action logic of athletic
  forward motion, compact firearms, accessible holsters, dark practical layers, and
  saturated red hair against a dark collar. Keep Hazel more protected and functional
  than the exposed leather or bare-midriff treatments in published art; do not copy
  their armor, weapons, poses, costumes, or likenesses.
- Final facial execution, age treatment, exact proportions, costume history,
  insignia, personal symbolism, and the final costume asset require developer
  approval.

## Base presentation rules

- Author each frame as a `512 x 512` RGBA8 straight-alpha atlas cell. Multi-cell
  atlases are allowed; the target describes a frame cell, not one PNG per frame.
- Keep visible pixels at least 32 pixels from the top, left, and right edges and 40
  pixels from the bottom edge.
- Author the party-facing base toward screen-left. Approved action clips may turn
  at runtime when a move requires it.
- Start the first production study with the ground anchor at `(256, 472)`. Validate
  it against the selected vertical slice before freezing the package. Once frozen,
  every frame uses the same trim and anchor; a planted foot may drift by no more
  than one pixel in stationary clips.
- Keep base rasters clean: no floor plane, contact or cast shadow, environmental
  grade, bloom, beam, weapon glow, impact, particles, damage text, or UI.
- Use neutral source lighting and clean alpha edges. Godot owns contact shadows,
  emissive/VFX layers, hit-stop, shake, and full-scene post. Only bloom, grade, and
  vignette enter the half-resolution post boundary; UI remains outside post.

## Equipment direction

- **Preferred vibroblade A:** forward-weighted and straight-backed, with a mechanical
  frame guard and compact vibration housing. The silhouette must read as engineered
  cutting equipment rather than a glowing energy sword or oversized cleaver.
- **Comparison vibroblade B:** retain the straight mechanical blade family but use a
  narrower forward profile, inset frame guard, and more integrated vibration
  housing. Review both at gameplay scale before selecting a casing.
- The cover review's dueling-blade and curved-saber families are reserved as broad
  Owen comparisons. Hazel may inherit their one-handed scale and protected-hand
  clarity, but her blade remains visibly forward-weighted, straight-backed, and
  industrial rather than becoming a recolored version of Owen's sword.
- Keep the vibroblade neutral in base art. Vibration, contact streaks, sparks, and
  any emissive response are runtime effects attached through sockets and masks.
- Hazel carries a compact disruptor in a closed rear-hip holster. A ring-capacitor
  casing is the preferred direction, pending two independently readable casing
  studies and a draw-readability check from the authored screen-left view.
- Keep the disruptor casing neutral. Ready, spent, charge, beam, and detonation
  states belong to runtime materials, emissive passes, and compositor VFX.

## Idle, movement, and damage readability

- **Ranged idle:** preserve the tall, athletic silhouette while keeping both shoulder
  armor masses compact. The holstered sidearm, pouches, boots, and planted foot must
  remain legible without turning the pose into an equipment inventory display.
- **Closing idle and advance:** screen-left is forward for the authored party base.
  Use direct, economical gait mechanics. Repairs and scorch breakup must not create
  false limb edges or hide the ground-contact leg.
- **Engage transition:** lower the center of mass into a prepared cutting stance
  without adding heavy-unit breadth. Keep the blade channel clear of the torso and
  command-menu safe area.
- **Hit and defeat:** retain distinct red-hair, skin, teal/emerald, ivory/cream,
  black-protection, and metal value groups after canonical post-processing.

## Melee beats, semantic timing, and sockets

- Every standard strike presents four visual beats: anticipation, travel, semantic
  contact, and recovery. Under the current three-clip schema, travel spans the end
  of `melee_anticipation` and the opening portion of `melee_contact`; do not add an
  undeclared `melee_travel` state without an approved schema revision.
- A driving screen-left cross-body cut is the preferred primary motion. A compact
  rising cut remains the independently viable comparison for crowded staging.
- The melee-contact clip declares exactly one `contact` event. The presentation
  bridge owns the resolved contact time; Godot retimes or samples authored frames so
  that marker meets the bridge timeline.
- Declare `weapon_tip`, `muzzle`, `hand`, `core`, `head`, and `hit_center` on every
  frame, including when a part is occluded. Sockets position effects and reactions;
  they do not decide contact timing, hit-stop duration, or combat outcomes.
- Standard melee hit-stop is currently `60 ms`. It pauses the compositor's active
  delta at semantic contact and is not encoded as a fixed number of duplicate
  raster frames. At 60 FPS it spans about 3.6 refresh intervals; the observed frame
  count may vary with contact phase.
- Route combat sound through Godot's semantic audio system. The vibroblade follows
  the project's hybrid-audio policy; disruptor audio remains procedural in every
  mode.
- The disruptor fire clip declares exactly one `muzzle` and one `beam_start` event.
  The defeat clip declares exactly one `defeat` event and holds its final frame.

## Minimum animation coverage

The future package must cover:

- ranged idle;
- closing idle;
- advance loop;
- engage transition;
- engaged idle;
- melee anticipation, contact, and recovery;
- signature action;
- disruptor draw, fire, and recovery;
- hit reaction; and
- defeat with a held final frame.

Frame rectangles, durations, loop flags, battle scale, facing, safe bounds, ground
anchor, semantic events, and sockets belong in strict metadata rather than filename
conventions or inference from pixels.

The proposed source-frame durations and loop behaviors are defined in
`hazel-animation-timing-sheet-v1.md`. They guide authored motion only and do not
change bridge timing or feedback values.

## Approval and implementation gates

1. Produce preferred costume A and fallback costume B at normal gameplay scale;
   advance A unless its collar, armor, or equipment weakens her silhouette.
2. Compare the two vibroblade constructions and two compact disruptor casing
   studies without baked emissives.
3. Compare the driving cross-body cut with the compact rising cut, then validate the
   selected ranged-idle/advance/melee-contact vertical slice at 1280 x 720 and
   1920 x 1080.
4. Confirm or revise the provisional `(256, 472)` anchor, then freeze it for the
   package.
5. Approve a wider-game named-combatant schema extension before adding Hazel to the
   runtime manifest. The current v1 validator intentionally accepts only the three
   anonymous prototype roles.
6. After schema approval, create the full raster/metadata package, run the strict
   asset validator and affected Godot scene, inspect a local capture, and record the
   developer's subjective decision. Technical checks alone do not approve the art.

Best production venue: **hybrid**. Keep schema, anchors, cleanup, atlas assembly,
Godot integration, and capture review local; use cloud image generation only for
independent A/B concept and source-frame exploration.
