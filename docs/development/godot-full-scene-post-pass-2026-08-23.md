# Canonical Godot Full-Scene Post Pass

Date: 2026-08-23

## Outcome

The canonical Godot client now routes the composed presentation world through a
true two-stage half-resolution post pipeline. This resolves the overlay-only
limitation recorded in the earlier canonical compositor pass.

The production render path is:

1. Layers 01 through 07 issue 1920x1080 design-space presentation commands under a
   single 0.5-scale WorldDesignSurface.
2. WorldSourceViewport composes those layers once at 960x540.
3. Layer 08 binds that exact viewport texture both to WorldFeed and to the
   canonical full-scene shader sampler.
4. HalfResolutionPostViewport applies grade, bright-neighbor bloom, and vignette
   once at 960x540.
5. PostCompositeTexture enlarges the completed post result once to 1920x1080.
6. Layer 09 remains a sibling CanvasLayer at layer 100 and is never included in
   either world or post viewport.

The strict TypeScript bridge, contact-gated state reveal, fixture selector,
deterministic presentation motion, semantic audio scheduling, and five-cue native
audio implementation are unchanged. No combat logic or game-state mutation moved
into GDScript.

## Scene and runtime contract

WorldSourceViewport owns WorldDesignSurface, WorldComposition, and exact semantic
layers 01 through 07. Layer08BloomGradeVignetteComposite is a root sibling rather
than a descendant of its source viewport, preventing a recursive texture feed.
Layer09UI is a separate root sibling.

The runtime contract now validates all of the following before bridge loading:

- exact logical order 01 through 09, required names, groups, and z indices;
- a 960x540 composed-world source and a 0.5 design-surface scale;
- a separate 960x540 post viewport;
- the actual source viewport texture RID bound to WorldFeed;
- that same RID bound as the shader's world_texture sampler;
- the post viewport texture RID bound to the single 1920x1080 output rectangle;
- the canonical shader resource path;
- UI CanvasLayer 100 outside both viewport subtrees.

The independent validator instantiates the scene without the main controller,
allows viewport bindings to become ready, and checks those RIDs directly. It also
turns layer 08 off and proves that the raw composed-world texture becomes the
output, then restores the post result.

## Post implementation

godot/shaders/canonical_full_scene_post.gdshader is a Compatibility canvas-item
shader. Its current neutral study uses:

- an eight-neighbor bright pass at a three/two-texel radius;
- threshold 0.58 and bloom strength 0.16;
- saturation 1.06 and contrast 1.035;
- restrained cool balance with a small warm highlight lift;
- vignette strength 0.24.

These are presentation-study values, not gameplay data or approved final art
direction. The shader samples only the 960x540 composed-world texture and executes
inside the 960x540 post viewport. No full-resolution blur or post shader runs over
the UI.

## Preserved inspection behavior

- F1 through F7 toggle their real source layers.
- F8 switches between the processed and raw composed-world textures instead of
  making the entire world disappear.
- F9 toggles the outside-post UI.
- F10 restores all nine semantic layers.
- D, or the presentation-only --diagnostic startup flag, displays the physical
  three-by-three diagnostic view at the same bridge snapshot and contact time.

In diagnostic mode, tiles 01 through 07 show the isolated raw semantic layers,
tile 08 shows the shader-processed miniature sampled from that world texture, and
tile 09 shows the UI renderer outside post. The diagnostic overlay itself remains
in Layer09UI.

## Files

- godot/main.tscn
- godot/scripts/main.gd
- godot/scripts/canonical_post_composite.gd
- godot/scripts/canonical_compositor_layer.gd
- godot/scripts/validate_canonical_compositor.gd
- godot/shaders/canonical_full_scene_post.gdshader
- docs/screenshots/godot-canonical-full-scene-post-range-band-2026-08-23.png
- docs/screenshots/godot-canonical-full-scene-post-diagnostic-2026-08-23.png
- docs/development/godot-full-scene-post-pass-2026-08-23.md

No TypeScript, bridge schema, fixture, core/data value, combat rule, audio
implementation, asset, dependency, Canvas client, manifest, or package command
changed.

## Verification

Godot version: 4.7.2.stable.official.ed1daf0bf.

- All 11 canonical GDScripts passed --check-only.
- Canonical import exited 0. Import output was also scanned explicitly for shader
  diagnostics because Godot can print shader errors without returning a nonzero
  import exit code; no shader diagnostic remained.
- Legacy fixture validator passed: schema v1, 25 frames, TypeScript authority.
- Strict bridge validator passed: 12 malformed documents rejected; the targetless
  esper case remained accepted.
- Native procedural-audio validator passed five cues across six deterministic
  variations with sample-identical repeat renders.
- Range-band fixture validator passed: 34 frames, two held interrupts, victory.
- Independent full-scene compositor validator passed:
  layers=01>02>03>04>05>06>07, world_feed=960x540,
  sampled_by_post=true, post=960x540, upscale=1920x1080,
  layer08_bypass=true, ui=CanvasLayer100/outside-post.
- Legacy accelerated replay passed 25/25 snapshots with contact-gated reveal:
  23 action cues, 4 event cues, 12 supported renders, 15 explicit silences,
  12 variation steps, and zero duplicate interrupt-event audio.
- Range-band accelerated replay passed 34/34 snapshots with contact-gated reveal:
  20 action cues, 3 event cues, 20 supported renders, 3 explicit silences,
  20 variation steps, exactly two held interrupts, and zero duplicate
  interrupt-event audio.

## Deterministic captures and visual inspection

The promoted normal capture is:

- path:
  docs/screenshots/godot-canonical-full-scene-post-range-band-2026-08-23.png;
- 1280x720 PNG, 202,702 bytes;
- authoritative range-band fixture, fixed 60 fps, first recorded frame;
- SHA-256:
  EDBB3A40F3E9D652E4B741CC733BFB5F94F72D043C82C29074348DA72A9DC40E.

A separate repeat process produced the same SHA-256. Visual inspection found no
vertical inversion, stale viewport, missing layer, recursive feedback, duplicated
world, blank first frame, or UI post-processing. The six stand-ins remain on one
floor; source geometry receives the cool grade and restrained emissive bloom; the
timer, queue, names, health/range labels, bridge authority line, and overlay remain
sharp outside post.

The promoted diagnostic capture is:

- path:
  docs/screenshots/godot-canonical-full-scene-post-diagnostic-2026-08-23.png;
- 1280x720 PNG, 84,509 bytes;
- same fixture/time with --diagnostic;
- SHA-256:
  BE323BBA6A317169FB345C26EA75B46505F79A056C511D5848BD08567BD11AB2.

Visual inspection confirmed seven separately readable source tiles, a processed
layer-08 miniature, and a distinct outside-post UI tile.

The two-frame normal capture reported average CPU render submission of
0.37 ms/frame and GPU time of 0.00 ms/frame at Godot's output precision. PNG
encoding reported 27.90 ms/frame. The repeat and diagnostic processes reported
0.29 and 0.24 ms/frame CPU submission. These tiny deterministic captures are not a
sustained performance or GPU-profiler benchmark.

## Remaining limitations

- Bloom is a fixed single-pass eight-neighbor LDR study, not a production
  multi-radius, mip-chain, Gaussian, HDR, or tone-mapped bloom implementation.
- Grade/bloom/vignette values are scene-level neutral studies. They are not yet
  authored per encounter or driven by validated presentation configuration.
- The complete world, including combatant bodies, is intentionally composed at
  half resolution. Linear enlargement may soften future raster alpha edges or
  fine material detail; final combatant packages require direct visual review.
- The diagnostic layer-08 tile processes a miniature of the diagnostic source
  mosaic. It proves the sampled post route but is not a second simultaneous copy of
  the normal full encounter.
- Short still captures do not prove sustained frame time, resize behavior, Web
  export, startup, payload, mobile/device coverage, shader compatibility across
  required browsers, or accessibility.
- Procedural block combatants and the environment remain neutral placeholders.
  The pipeline does not select or approve raster art, backgrounds, animation
  packages, final palette, final bloom character, or subjective visual quality.
