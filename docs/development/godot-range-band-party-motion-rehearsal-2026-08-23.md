# Godot range-band party resolved-timeline motion rehearsal — 2026-08-23

## Outcome and approval boundary

Pass 13 completes the interrupted motion view in
`experiments/godot-range-band-party-art-review/`. Choice A and Choice B now run
side-by-side through the same authoritative range-band presentation replay so the
developer can compare silhouette behavior under identical timing.

This is **complete as an isolated review surface** and **unapproved as an art or
motion direction**. It does not create authored animation frames, choose A or B,
select full-frame raster versus hybrid motion, approve anchors or scale, build a
raster package, or register anything with canonical `godot/`.

## Implemented surface

The review manifest pins
`godot/data/presentation-range-band-replay-v1.json` by repository-relative path,
SHA-256, byte length, format, schema version, fixture ID, frame count, and duration.
The loader accepts only the expected six stable combatant IDs and the bounded
`advance`, `attack`, and `disruptor` action types.

View 5 presents both branches in equal 892×830 panels and provides:

- 34 resolved frames over 25.75 seconds with play/pause, 0.10-second stepping,
  resolved-frame stepping, 0.25×/1× speed, and deterministic CLI time selection;
- contact-gated result-state reveal using serialized visual-contact timing;
- smooth band-to-band advance interpolation and a bounded 56 px melee lunge;
- anchor-preserving whole-raster idle, anticipation, recoil, and hit poses with
  rotation bounded to 0.032 radians and scale modulation bounded to 1.8%;
- serialized disruptor beam-start/contact timing rendered as a procedural trace;
- abstract opponent markers so no enemy art direction or mirroring policy is
  invented;
- HP, role, band, action, frame, and timeline readouts outside the art sources.

All source combatants remain one idle-like transparent keyframe. The rehearsal is
deliberately incapable of proving foot-cycle quality, limb articulation, silhouette
interpolation, anticipation/contact/recovery coverage, sockets, effect occlusion,
defeat animation, or an approved production pipeline.

## Evidence

| Evidence | Timeline point | Dimensions / frames | SHA-256 |
|---|---:|---:|---|
| [Opening disruptor](../screenshots/godot-range-band-party-motion-disruptor-2026-08-23.png) | 1.05 s | 1920×1080 | `76CD282F61559943D0A6685A14BD5C273E8FE48AFA26150FA08112B8101317C6` |
| [Advance midpoint](../screenshots/godot-range-band-party-motion-advance-2026-08-23.png) | 2.40 s | 1920×1080 | `D4BFF87B82C0659CA42FB78A7B7AB632AB032DC260D87EAE6BD8BA39D0168FDD` |
| [Melee contact](../screenshots/godot-range-band-party-motion-melee-2026-08-23.png) | 11.35 s | 1920×1080 | `DBBC15D87A8313E4501031800A6B78745E341E61317B386EBD52D1BEB753E8A5` |
| [Complete rehearsal at 4×](../screenshots/godot-range-band-party-motion-rehearsal-4x-2026-08-23.mp4) | 0–25.75 s source time | 194 frames, 1920×1080, 30 FPS, 6.466667 s, 4,631,623 bytes | `296354E783CBA434F196B595413CC9318FDF0FFE3AC5C906D02031D6634E1F65` |

The three stills were inspected at full 1920×1080. Both panels retain uncropped
sources, proposed ground anchors remain visually attached through the sampled
transforms, the disruptor trace is visible at serialized beam time, Advance is
labeled rather than displaying a null ability name, and engaged status labels no
longer collide with the combatant/opponent cluster. These are observed properties
of the review surface, not approval of either branch.

## Verification

Godot `4.7.2.stable`:

| Check | Result |
|---|---|
| `scripts/main.gd --check-only` | exit 0 |
| scene `--validate-only` | exit 0; six sources, two backgrounds, and pinned resolved timeline accepted; five intentional blockers reported |
| motion scene at 0.95 / 2.40 / 11.35 s | three exit-0 smokes |
| final real-renderer still capture | three 1920×1080 frames promoted |
| final real-renderer 4× capture | 194 frames at 30 FPS; average CPU render 0.37 ms/frame, GPU 0.08 ms/frame, AVI encoding 10.22 ms/frame |

Repository quality:

```text
npm.cmd run verify:quality
build: passed (Vite 6.4.3, 40 modules)
lint: 0 errors, 0 warnings
tests: 134 passed across 29 files
```

The first restricted-sandbox quality attempt stopped at Vite with `spawn EPERM`;
the identical command passed outside that process-launch restriction. A headless
dummy-renderer Movie Maker attempt also crashed with a null texture. Normal
headless validation/smokes remained green, and all promoted evidence came from the
real OpenGL Compatibility renderer (`NVIDIA GeForce RTX 5080`).

The bridge fixture was not regenerated because no serializer, schema, core state,
or fixture content changed. Full balance checking was skipped because this is an
isolated presentation-only pass with no gameplay, data, AI, or simulation changes.

## Next gate

The developer reviews the MP4 and static A/B evidence, then chooses complete Party
A, complete Party B, or explicitly requests a mixed/new direction. Concept choice,
motion-pipeline choice, background choice, anchor/scale approval, and package
integration remain separate decisions. No selected branch should enter canonical
Godot until those decisions and the complete raster-package requirements are met.
