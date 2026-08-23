# Combat Visual Direction

Status: **proposed**. Godot is the sole production presentation client. The former
browser game is frozen historical source and is not a reference or comparator. No
background, combatant, or style A/B choice in `art/` is approved or integrated. The
canonical Godot client implements the exact nine-layer compositor architecture;
the isolated harness remains neutral A/B evidence and chooses no background.

This document records the current visual diagnosis and the next approval gate. It
does not select an A/B candidate, authorize concept art as a sprite, or change lore,
characters, combat, or runtime code.

## Godot architecture evidence — 2026-08-23

`experiments/godot-visual-ab-harness/` now exposes the required starfield, far
backdrop, stage floor, enemy, party, emissive, foreground, half-resolution post, and
UI passes as nine exact-order named nodes. Its post pass owns a 960×540
`SubViewport`; UI is a separate `CanvasLayer` outside post-processing. Layer
toggles and a diagnostic 3×3 mosaic operate on the real render nodes, and no
full-resolution per-frame blur is used.

The composite and diagnostic captures hold fixture time, camera, units, effects,
post parameters, and UI constant while presenting both unapproved Empire
backgrounds as neutral A/B evidence. Four script checks, import, and bounded
180-frame composite and 60-frame diagnostic smokes pass. The exact results and
capture hashes are recorded in
`docs/development/godot-nine-layer-compositor-proof-2026-08-23.md`.

This closed the isolated proof step. The canonical `godot/` renderer subsequently
integrated the compositor architecture, while the backgrounds remain flat read-only
review plates, the units remain procedural blocks, and no A/B winner or production
art integration exists.

## Historical pre-cutover Canvas diagnosis

The following diagnosis records why the former Canvas presentation was rejected.
It is not a current implementation target, comparison gate, or source of Godot
acceptance criteria.

A live review of the default Canvas battle and Empire, Shub, and Hadenman replay
scenes found no browser-console warnings or errors. The scene is mechanically
legible, but it still reads as a prototype for reasons that are mostly visible art
and animation, with a smaller set of compositor and asset-pipeline issues.

| Area | What is already sound | Why it still reads as prototype | Primary gap |
|---|---|---|---|
| Compositor | Explicit Canvas nine-layer order, cached static layers, half-resolution bloom, grading, vignette, parallax, hit-stop-aware effects, and semantic contact timing; an isolated Godot harness now proves the same exact node order and UI/post separation | The proof is not integrated into the canonical Godot client. Flat external images have no implemented overscan/depth treatment; `drawEffects()` currently runs in the Canvas UI layer after the menus, so world VFX can bypass world grading/bloom and paint over UI | Canonical engine integration |
| Environments | Encounter-specific palettes, light direction, a sharp floor, haze, sparse particles, and foreground framing | Repeated blurred rectangles, columns, grids, and one shared perspective floor communicate blocking rather than a specific place; the background and floor do not share authored perspective or materials | Production art, then integration |
| Combatants | Shared ground plane, weight scaling, contact shadows, faction accents, targeting, idle bob, lunge, flinch, and readable state bars | Large geometric blocks carry identity mainly through color. Weapons, anatomy, material response, pose, recoil, anticipation, contact, recovery, and defeat animation are not authored | Production art and animation |
| Lighting/materials | Encounter data chooses a rim side and the emissive pass feeds bloom | Combatants are largely self-lit flat shapes; background light does not convincingly wrap across armor, cloth, weapons, or the floor. Emissive points are generic and not attached to authored sprite sockets or masks | Art plus lighting setup |
| UI/readability | Queue, HP/ESP, targeting, and contextual choices are functional and remain outside post-processing | Tiny monospaced text and debug-like glyphs dominate at normal browser size, while the command menu can visually merge with combatants. This reinforces the tool/demo impression | Presentation refinement |
| Asset pipeline | Five complete background A/B pairs and party/enemy concept A/B pairs exist with recorded provenance; a strict proposed Godot combatant-raster package contract and validator now define the technical handoff | All manifest background entries are `null`; startup does not call `AssetManager.validateManifest()`; no combatant package has been authored or approved, and the concept files remain multi-subject boards with no runtime anchors, frames, sockets, or battle-scale proof | Developer choice, then production handoff |

The existing A/B art demonstrates that the target can look materially richer. It
does not close the gap by itself. The opaque background choices are flattened review
plates, and the transparent party/enemy choices are concept sheets, not individual
animation-ready combatants. Their high-frequency surface detail will also need
simplification and scale testing to avoid mud or shimmer in a browser-sized battle.

## Highest-impact next A/B pass

The neutral Empire background/compositor harness is complete. The next gate is a
developer choice: select a background and party concept direction for the study
only, or explicitly keep either axis open. After that choice, build one controlled
**Imperial combat vertical slice** in the Godot Compatibility renderer while
keeping all source art engine-neutral. Best venue: **local first**, because
animation timing, transparent-edge quality, battle-scale readability, and
subjective art approval need the developer beside the Godot captures.
Add cloud/CI Web-export checks only after the local slice is stable.

Use these inputs without treating either letter as preferred:

- Environment A: `art/choices/backgrounds/enc_empire_skirmish-choice-a.png`
- Environment B: `art/choices/backgrounds/enc_empire_skirmish-choice-b.png`
- Party direction references:
  `art/choices/concepts/party-role-lineup-choice-a.png` and
  `art/choices/concepts/party-role-lineup-choice-b.png`
- Opponent direction references:
  `art/choices/concepts/imperial-enemy-family-choice-a.png` and
  `art/choices/concepts/imperial-enemy-family-choice-b.png`

After the developer records the study choices, produce one developer-selected,
anonymous party combatant as a transparent animation study. Do not choose its
functional role in this document, assign a name, or infer story. The study is the
first real test of clean alpha, anchor stability, battle scale, silhouette,
animation coverage, sockets, and readable material separation that the block
stand-ins cannot establish.

Create two motion-production candidates that preserve the same approved silhouette,
scale, camera, timing, and gameplay beats:

- **Motion A — full-frame raster:** independently drawn key poses and in-betweens,
  prioritizing organic weight and painterly silhouette control.
- **Motion B — deliberate hybrid:** layered body/weapon parts for reusable motion,
  with redrawn contact and recovery frames where cutout motion would look rigid.

Review the two motion candidates on the developer-selected background. If the
developer explicitly leaves the background choice open, retain the four-capture
matrix across both existing background variants instead. Each silent capture uses
the same deterministic replay, UI, light rig, camera, target proxy, and duration,
and shows idle, advance, melee
anticipation/contact/recovery, hit reaction, disruptor aim/fire/recovery, and defeat.
Record the environment and sustainable animation-pipeline decisions independently;
do not integrate a winner until its runtime cleanup and the acceptance checklist
below pass.

## Engine-neutral production contract

Godot scenes, imported textures, `AnimationPlayer` tracks, materials, and shaders
may be generated runtime derivatives. The durable sources remain portable PNGs plus
plain metadata so the art is not trapped in one renderer.

### Environment package

- Deliver a 1920×1080 visible crop at minimum. Prefer a larger 16:9 working plate
  such as 2304×1296 so a 1920×1080 camera retains roughly 10% crop allowance per
  edge for parallax and shake. Critical architecture stays inside the central 88%.
- Preserve the approved composition but separate it into far, mid, sharp floor, and
  foreground-occluder PNG layers. A flattened review export may be used for the A/B
  decision, not as the final layered environment.
- Keep the upper 40% quiet, the open combat lane in the lower middle, and painted
  floor at or below the bottom 15%. Align the selected plate's horizon and
  perspective to the runtime ground plane before final export.
- Use one declared directional source. Supply normalized light position/color and
  parallax depth in metadata. Do not bake figures, creatures, UI, particles,
  weapon effects, bloom, contact shadows, or foreground haze into the plate.
- Optional portable masks may describe occlusion, emissive architecture, and
  normal response. Color grade and vignette remain runtime parameters.

### Combatant package

- One combatant per RGBA PNG atlas or frame sequence; never a multi-subject concept
  board. Party faces screen-left and enemies screen-right unless an approved action
  explicitly turns them.
- Every frame uses the same trim box and an explicit pixel ground anchor. Feet may
  not drift more than one pixel in a stationary clip. Hovering units use a stable
  projected ground anchor plus a separate authored hover offset.
- Metadata records frame rectangles, duration per frame, loop behavior, logical
  battle scale, facing, safe bounds, and named events. Do not assume a fixed atlas
  frame rate.
- Minimum study clips: `idle`, `advance`, `melee_anticipation`, `melee_contact`,
  `melee_recovery`, `disruptor_aim`, `disruptor_fire`, `disruptor_recovery`,
  `hit`, and `defeat`. Production packages add role-specific guard, ranged,
  psionic, shield, Boost/crash, and victory states only where applicable.
- Mark semantic events such as `contact`, `muzzle`, `beam_start`, and `defeat` in
  metadata. Provide stable per-frame sockets for `weapon_tip`, `muzzle`, `hand`,
  `core`, `head`, and `hit_center` when relevant.
- Paint readable low-frequency material families: matte cloth, worn metal,
  ceramic/energy housings, and controlled emissive cores. Avoid noisy microdetail
  that disappears at normal battle scale.
- Use neutral form lighting with a consistent approved key direction. Put emissive
  response in a separate mask and provide an optional normal map; do not bake scene
  color grade, bloom, cast/contact shadows, particles, muzzle flashes, beams, or
  impact effects into the sprite.
- Include transparent padding for weapons, recoil, robes, and extreme poses. No
  frame may crop the silhouette or cause a scale pop.

## Acceptance checklist

- [ ] The developer's selected concept and background directions are recorded; no
  unselected A/B asset is registered as runtime content.
- [ ] A/B captures differ only on the declared axis, use the same replay/camera/UI,
  and are reviewed side by side at normal speed.
- [ ] Backgrounds remain clear behind the queue, party status, command menu, and
  VFX; horizon, floor perspective, and directional light agree with the units.
- [ ] Alpha edges are clean on both dark and light test mattes, with no checkerboard,
  halo, fringe, or accidental opaque pixels.
- [ ] Anchors, bounds, scale, facing, frame timing, state names, semantic events,
  and effect sockets are present and validated before runtime registration.
- [ ] Silhouette, role, weapon, target, and instance accent remain readable at both
  1280×720 display size and the 1920×1080 design canvas without relying on labels.
- [ ] Idle is stable; advance has weight; anticipation telegraphs intent; contact
  lands on the semantic marker; recovery and recoil distinguish the action; hit and
  defeat do not resemble ordinary bob or translation.
- [ ] Armor, cloth, ceramic, and emissive parts remain distinct under both
  background choices and respond coherently to the declared light.
- [ ] Contact shadows, bloom, grade, particles, beams, impacts, and camera feedback
  are runtime layers; UI remains above them and outside post-processing.
- [ ] The Godot Compatibility/Web build loads every approved asset loudly, shows no
  missing-resource or Godot runtime errors, and is visually checked in motion.
- [ ] Source path, dimensions, provenance, prompt/transformation summary, approval
  status, and derived runtime paths are added to the asset register.

## What Godot changes—and what it does not

Godot is now the first runtime implementation path for this art vertical slice. It
materially improves the work of assembling parallax layers, previewing normal and
emissive maps, placing 2D lights and occluders, authoring `AnimationPlayer` timing,
attaching effect sockets, tuning particles/shaders, and comparing motion in context.
That should shorten iteration once production-ready art exists.

Godot does **not** choose an A/B direction, turn a group concept sheet into a clean
sprite atlas, supply missing poses, correct inconsistent anatomy or perspective,
simplify noisy materials, establish anchors, or make a generic silhouette specific.
The exact nine-layer harness now proves hierarchy, review controls, and UI/post
separation more strongly than the earlier spike, but its flat plates, block
combatants, proxy depth treatment, broad procedural bloom, and scripted motion
still do not prove production visual quality. The staged transition should
therefore proceed through the developer choice and transparent combatant/motion A/B
slice while keeping sources engine-neutral, rather than treating engine migration
as the visual-quality milestone by itself.

## Existing developer-review paths

All files below are proposed and unapproved. `art/GENERATED-ASSET-REGISTER.md`
remains the provenance and status record.

Background overview: `art/review/background-choice-pairs-v1.png`

| Encounter | Choice A | Choice B |
|---|---|---|
| Empire skirmish | `art/choices/backgrounds/enc_empire_skirmish-choice-a.png` | `art/choices/backgrounds/enc_empire_skirmish-choice-b.png` |
| Empire patrol | `art/choices/backgrounds/enc_empire_patrol-choice-a.png` | `art/choices/backgrounds/enc_empire_patrol-choice-b.png` |
| Shub skirmish | `art/choices/backgrounds/enc_shub_skirmish-choice-a.png` | `art/choices/backgrounds/enc_shub_skirmish-choice-b.png` |
| Shub swarm | `art/choices/backgrounds/enc_shub_swarm-choice-a.png` | `art/choices/backgrounds/enc_shub_swarm-choice-b.png` |
| Hadenman vanguard | `art/choices/backgrounds/enc_hadenman_vanguard-choice-a.png` | `art/choices/backgrounds/enc_hadenman_vanguard-choice-b.png` |

All background review exports are opaque 1920×1080 PNGs.

Combatant overview: `art/review/concept-choice-pairs-v1.png`

| Brief | Choice A | Choice B |
|---|---|---|
| Party roles | `art/choices/concepts/party-role-lineup-choice-a.png` | `art/choices/concepts/party-role-lineup-choice-b.png` |
| Imperial enemies | `art/choices/concepts/imperial-enemy-family-choice-a.png` | `art/choices/concepts/imperial-enemy-family-choice-b.png` |
| Shub enemies | `art/choices/concepts/shub-enemy-family-choice-a.png` | `art/choices/concepts/shub-enemy-family-choice-b.png` |
| Hadenman enemies | `art/choices/concepts/hadenman-enemy-duo-choice-a.png` | `art/choices/concepts/hadenman-enemy-duo-choice-b.png` |

The party, Imperial, and Hadenman concept files are transparent 1536×1024 PNGs;
the Shub files are transparent 1672×941 PNGs. They are visual-direction references,
not extract-and-ship sprites.

Secondary influence calibration:
`art/review/imperial-influence-calibration-pair-v1.png`, with individual frames at
`art/choices/style-calibration/imperial-battle-in-context-choice-a.png` and
`art/choices/style-calibration/imperial-battle-in-context-choice-b.png`. These are
battle-in-context keyframes, not runtime backgrounds.
