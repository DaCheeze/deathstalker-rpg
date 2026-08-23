# Owen Combatant Raster Brief v1

Status: **direction-approved for the next Owen concept and vertical-slice studies;
the final costume asset, sidearm casing, animation execution, package-schema
extension, and all runtime files remain unapproved**.

This brief translates the current Owen direction into a Godot-ready art handoff. It
does not register an Owen runtime package or extend the anonymous three-character
prototype contract. `visual-style-bible.md` remains the visual authority,
`godot-combatant-raster-asset-contract-v1.md` remains the technical baseline, and
`presentation.md` remains the compositor authority.

## Locked and proposed identity

- **Locked project anchor:** Owen is blonde. Hair color must remain stable through
  scene grading and must stay value-separated from pale trim.
- **Visual thesis:** a flamboyant aristocratic adventurer—tall, lean, and rangy,
  with trained grace, martial readiness, and human-scale equipment rather than
  oversized armor anatomy.
- **Preferred costume A — travel coat:** long tailored cobalt coat over dark field
  layers, severe blue-black collar, restrained ivory and black-gold trim, and enough
  split construction for a readable advance and melee step. This is the default
  direction for the next study, not approval of an existing image.
- **Fallback costume B — field coat:** shorter indigo split-tail coat with a cobalt
  over-panel, dark collar yoke, restrained ivory trim, and warm-brown utility
  layers. This remains an independently viable gameplay-readability comparison if
  A's coat obscures the legs, weapon, or ground contact.
- **Material hierarchy:** tailored dyed outer cloth first, darker protective field
  construction and restrained steelmesh second, then one controlled warm-leather
  luxury accent. Do not add fur to the base costume study; its mass and edge noise
  work against Owen's rangy gameplay silhouette.
- **Cover-art calibration:** retain only the recurring contrast logic of a narrow
  human-scale figure, saturated blue outer identity, pale secondary layer, dark
  head edge, boots, and visible sword/sidearm readiness. Do not copy published white
  sleeves, chest symbols, blue body garments, exact collars, belts, weapons, poses,
  or likenesses.
- Final face, age treatment, body proportions, costume history, insignia, personal
  symbolism, and the final costume asset require developer approval.

## Sword direction

- **Sword A — dueling frame:** slender straight blade, open mechanical guard,
  protected hand channel, and compact vibration housing near the hilt. Keep the
  silhouette precise and human-scale rather than needle-thin or oversized.
- **Sword B — field saber:** shallow-curved single edge, compact asymmetric knuckle
  guard, and low-profile vibration housing. Preserve a broad readable sweep without
  copying any published blade curve or hilt.
- Both studies must coexist cleanly with the compact disruptor, cobalt coat, and
  authored screen-left stance. Review them at gameplay scale under identical motion
  timing before selecting a prop family.
- Keep both base swords neutral. Vibration, trails, contact sparks, and emissive
  response remain runtime-owned effects attached through sockets and masks.

## Base presentation rules

- Author each frame as a `512 x 512` RGBA8 straight-alpha atlas cell. Multi-cell
  atlases are allowed within the technical contract; `512 x 512` is the frame cell,
  not a requirement for one PNG per frame.
- Keep visible pixels at least 32 pixels from the top, left, and right edges and 40
  pixels from the bottom edge.
- Author the party-facing base toward screen-left. Approved action clips may turn
  at runtime when a move requires it.
- Start the first production study with the ground anchor at `(256, 472)`. Validate
  that anchor against the selected vertical slice before freezing the package.
  Once frozen, every frame uses the same trim and anchor; a planted foot may drift
  by no more than one pixel in stationary clips.
- Keep base rasters clean: no floor plane, contact or cast shadow, environmental
  grade, bloom, beam, muzzle flare, impact, particles, damage text, or UI.
- Use neutral source lighting and preserve clean alpha edges. Godot owns contact
  shadows, emissive/VFX layers, hit-stop, shake, and full-scene post. Only bloom,
  grade, and vignette enter the half-resolution post boundary; UI remains outside
  post-processing.

## Idle and movement direction

- **Ranged idle:** preserve the tall, lean silhouette. Keep the weapon hand, coat
  hem, and ground contact leg distinct at gameplay scale. The coat may breathe, but
  it must not create false foot motion.
- **Closing idle and advance:** screen-left is forward for the authored party base.
  Keep a dark or saturated collar edge around the blonde hair. Pale ivory or gold
  trim must not merge with the hair after the scene grade and half-resolution post.
- **Engage transition:** lower the center of mass and widen the support without
  turning Owen into a heavy unit. Preserve negative space around the weapon and
  keep him distinct from enemies normally staged on screen-left.
- **Engaged idle:** show readiness through posture and weapon placement, not through
  a baked glow. Maintain the same anchor and readable cobalt/dark-layer grouping.

## Melee and disruptor hooks

- The melee sequence needs a legible anticipation, one exact contact milestone,
  and recovery. A screen-left forward sword sweep is the preferred primary motion
  for the first vertical slice. A compact draw-cut remains the viable comparison;
  the brief does not lock every future sword action to the same sweep.
- The melee-contact clip declares exactly one `contact` event. The presentation
  bridge supplies semantic timing; Godot retimes the authored marker to that
  resolved timeline and coordinates hit-stop, VFX, flinch, and audio there.
- Declare `weapon_tip`, `muzzle`, `hand`, `core`, `head`, and `hit_center` sockets on
  every frame. Sockets position effects and reactions; they do not decide contact
  timing or combat outcomes.
- Owen carries a compact disruptor at the hip. The ring-capacitor silhouette is a
  proposed casing direction, not yet approved. Explore at least two independently
  readable casing studies before locking it, while keeping both compact enough to
  survive the gameplay-scale read.
- Keep the sidearm casing neutral in base art. Ready, spent, charge, beam, and
  detonation states belong to runtime material/emissive and VFX passes. The fire
  clip declares exactly one `muzzle` and one `beam_start` event.
- Route all combat sound through the Godot semantic audio system. Disruptor audio
  remains procedural in every audio mode; melee sound follows the selected weapon
  cue and the project's hybrid-audio eligibility rules. No Web Audio dependency is
  part of the production sprite contract.
- Hit and defeat frames must retain the cobalt, dark-field, hair, skin, and metal
  value groups after post-processing. The defeat clip emits exactly one `defeat`
  event and holds its final frame.

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
`owen-animation-timing-sheet-v1.md`. They guide motion weighting only. The
presentation bridge remains authoritative for action duration and semantic contact.

## Approval and implementation gates

1. Produce preferred costume A and fallback costume B at normal gameplay scale;
   advance A unless its long coat compromises leg, weapon, or anchor readability.
2. Select one of two independently viable compact disruptor casing studies.
3. Compare the preferred forward sweep with the compact draw-cut, then validate the
   selected ranged-idle/advance/melee-contact vertical slice at normal 720p and
   1080p gameplay scale.
4. Confirm or revise the provisional `(256, 472)` anchor, then freeze it for the
   package.
5. Approve a wider-game named-combatant schema extension before adding Owen to the
   runtime manifest. The current v1 validator intentionally accepts only the three
   anonymous prototype roles.
6. After schema approval, create the full raster/metadata package, run the strict
   asset validator and affected Godot scene, inspect a local capture, and record the
   developer's subjective decision. Technical checks alone do not approve the art.

Best production venue: **hybrid**. Keep schema, anchors, cleanup, atlas assembly,
Godot integration, and capture review local; use cloud image generation only for
independent A/B concept and source-frame exploration. This protects runtime
precision while retaining breadth during visual selection.
