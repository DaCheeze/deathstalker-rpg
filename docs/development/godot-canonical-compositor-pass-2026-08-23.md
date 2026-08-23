# Canonical Godot Nine-Layer Compositor Pass

Date: 2026-08-23

## Outcome

The production godot/ replay client now presents the existing strict TypeScript
bridge through the explicit nine-layer compositor architecture previously proven
in the isolated visual harness. The canonical controller still owns fixture
selection, playback time, contact-gated state reveal, and semantic audio dispatch;
it contains no draw commands and performs no combat resolution.

This is a bounded Phase 2 structural integration. All visual content remains
procedural, neutral, and unapproved. No raster package, background choice, gameplay
value, ability policy, target, outcome, or combat calculation was added.

## Canonical hierarchy

godot/main.tscn contains the ordered contract as inspectable nodes. Layers 01
through 08 are children of WorldComposition; layer 09 is a sibling CanvasLayer.

| Order | Node / required semantic group | Cadence and boundary |
|---:|---|---|
| 1 | Layer01Starfield / compositor_layer_01_starfield | cached procedural void and deterministic stars |
| 2 | Layer02FarBackdrop / compositor_layer_02_far_backdrop | cached neutral architecture and light shaft |
| 3 | Layer03StageFloor / compositor_layer_03_stage_floor | cached sharp shared ground plane |
| 4 | Layer04EnemyUnits / compositor_layer_04_enemy_units | per-frame bridge-presented enemy bodies |
| 5 | Layer05PartyUnits / compositor_layer_05_party_units | per-frame bridge-presented party bodies |
| 6 | Layer06EmissivePass / compositor_layer_06_emissive_pass | per-frame accents, force-shield/Boost presentation, particles, and resolved action effects |
| 7 | Layer07ForegroundOccluders / compositor_layer_07_foreground_occluders | cached soft-geometry proxy; no blur kernel |
| 8 | Layer08BloomGradeVignetteComposite / compositor_layer_08_half_resolution_post | transparent 960x540 post overlay enlarged once to 1920x1080 |
| 9 | Layer09UI / compositor_layer_09_ui | CanvasLayer 100 sibling, always outside post |

The controller validates names, child order, groups, z indices, layer-number
bindings, the 960x540 post viewport, and UI separation before bridge loading.
validate_canonical_compositor.gd independently validates the authored scene
without starting a replay.

canonical_compositor_layer.gd is the one canonical draw implementation.
main.gd exposes a presentation snapshot containing the already selected visible
bridge state, resolved action timing, deterministic presentation positions, and
diagnostic state. The renderer reads that snapshot; it never chooses actions,
targets, damage, queue order, legal movement, cooldowns, or outcomes.

## Inspection controls

- F1 through F9: toggle the corresponding compositor layer.
- F10: restore all nine layers.
- D: arrange the eight world/post nodes and the UI renderer into a physical
  three-by-three diagnostic mosaic at the same bridge snapshot and playback time.
- Existing Space, R, Tab, and Esc controls retain pause, restart, overlay, and quit
  behavior.

Static layers 01, 02, 03, and 07 are redrawn only on initialization or diagnostic
layout changes. Dynamic layers 04, 05, 06, 08, and 09 follow replay time. No
full-resolution per-frame blur was introduced.

## Files

- godot/main.tscn
- godot/scripts/main.gd
- godot/scripts/canonical_compositor_layer.gd
- godot/scripts/canonical_post_composite.gd
- godot/scripts/canonical_compositor_diagnostic.gd
- godot/scripts/validate_canonical_compositor.gd
- docs/screenshots/godot-canonical-range-band-compositor-2026-08-23.png
- docs/development/godot-canonical-compositor-pass-2026-08-23.md

No dependency, asset manifest, bridge schema, fixture, TypeScript core, Canvas
client, procedural-audio implementation, combat data, or gameplay value changed in
this pass.

## Verification

Godot version: 4.7.2.stable.official.ed1daf0bf.

- All 11 canonical GDScripts passed --check-only.
- Canonical Godot import exited 0.
- Legacy fixture validator passed: schema v1, 25 frames, TypeScript authority.
- Strict bridge-contract validator passed: 12 malformed documents rejected and
  the targetless esper case accepted.
- Deterministic native-audio validator passed its current five-cue, six-variation
  contract with sample-identical repeat renders.
- Range-band fixture validator passed: 34 frames, two held interrupts, victory.
- Independent compositor validator passed:
  nodes=9 order=01>02>03>04>05>06>07>08>09 post=960x540
  ui=CanvasLayer100/outside-post.
- Accelerated legacy replay passed 25/25 snapshots with contact-gated reveal:
  23 action cues, 4 event cues, 12 rendered supported cues, 15 explicit silences,
  12 deterministic variation steps, and zero duplicate interrupt-event audio.
- Accelerated range-band replay passed 34/34 snapshots with contact-gated reveal:
  20 action cues, 3 event cues, 20 rendered supported cues, 3 explicit silences,
  20 deterministic variation steps, exactly two held interrupts, and zero duplicate
  interrupt-event audio.

The promoted canonical range-band capture is an unedited Godot Movie Maker frame:

- path:
  docs/screenshots/godot-canonical-range-band-compositor-2026-08-23.png;
- dimensions: 1280x720 PNG;
- bytes: 123,007;
- fixture: --fixture=range-band, fixed 60 fps, first recorded frame;
- SHA-256:
  065DFB47C8990C4FE0BD9C5F090FC013CC87279792DD6C0DDCB514E3DDDB19DB.

A second independent one-frame capture produced the same SHA-256. Visual inspection
confirmed that all six procedural stand-ins share one floor, enemy and party sides
remain distinct, emissive accents and the restrained spotlight read over the cached
depth planes, the queue/status/range information remains sharp outside post, and no
layer is blank or incorrectly occluding the UI. The first inspection exposed a
clipped top-right timer and a debug panel grazing range labels; both were corrected
before the promoted and repeated captures.

The two-frame correction capture reported 0.09 ms/frame average CPU render
submission and 0.00 ms/frame GPU time at Godot's output precision. PNG encoding
reported 21.41 ms/frame. These are short deterministic capture diagnostics, not a
sustained frame-rate or GPU benchmark.

## Explicit limitations

- Layer 08 currently renders a transparent half-resolution grade tint, light
  shaft, procedural bloom proxy, and vignette, then enlarges that overlay over
  layers 01 through 07. It does **not** sample or downscale the already composed
  world framebuffer. This proves the canonical layer boundary, resolution, order,
  and UI exclusion, but not final full-scene color-grade or bloom parity.
- The architecture uses procedural block combatants and neutral environment
  studies only. It does not select or approve combatant raster art, a background,
  animation packages, alpha edges, authored parallax, materials, or final effects.
- Foreground softness and distant depth are layered geometry/downsample proxies,
  not production blur shaders.
- A deterministic still and accelerated replay do not prove animation quality,
  live interaction parity, sustained performance, resize behavior, device
  coverage, Web export, payload/startup gates, or accessibility.
- Automated checks do not approve visual quality. The developer's statement that
  the Godot presentation is already much better than the custom engine supports
  continuing the transition, but placeholder art and the remaining Phase 2 gates
  stay open.
