# Godot Imperial Layered Battle-Stage Study

Date: 2026-08-23

Status: **isolated A/B review study complete; every source remains proposed,
unselected, unregistered, and unintegrated.** This pass does not choose an art
direction or change canonical `godot/`, the bridge, gameplay, audio, shared art
catalogs/registers, or source images.

## Purpose and boundary

`experiments/godot-empire-layered-battle-study/` tests the current Imperial
environment candidates as physically separate battle-stage layers at the normal
1920 x 1080 review frame. Matching A letters and matching B letters switch
together only to make an immediate controlled comparison. Backdrop, floor, and
foreground remain independent developer decisions; choosing one must not silently
choose the other two.

Procedural combatants and emissives are neutral stand-ins. The study consumes no
bridge data, resolves no combat, registers no runtime assets, and does not imply
that either composition is production-ready.

## Exact source provenance

The study manifest preserves the current highest-revision paths from
`art/GODOT-ART-CANDIDATE-CATALOG-v1.json`, with the readiness boundary from
`docs/development/godot-art-transition-readiness-2026-08-23.md` and provenance
links to `art/GENERATED-ASSET-REGISTER.md`. Runtime loading checks every recorded
SHA-256, path, dimension, PNG decode format, and alpha range before displaying a
frame.

| Layer | Choice A | Choice B | Contract |
|---|---|---|---|
| Far backdrop | `art/choices/backgrounds/enc_empire_skirmish-choice-a.png` (`A02BBAD9…0895B`) | `art/choices/backgrounds/enc_empire_skirmish-choice-b.png` (`C7127A4E…4E178`) | 1920 x 1080 RGB8, opaque |
| Stage floor | `art/choices/stage-floor/imperial-stage-floor-choice-a-v2.png` (`135EA248…E7C44`) | `art/choices/stage-floor/imperial-stage-floor-choice-b-v3.png` (`077EB5F4…23EB6`) | 1920 x 1080 RGBA8, alpha 0–255 |
| Foreground occluder | `art/choices/foreground/imperial-parallax-occluder-choice-a-v2.png` (`EA8BFFBA…B02F5`) | `art/choices/foreground/imperial-parallax-occluder-choice-b-v2.png` (`34117FAB…D2B13`) | 1920 x 1080 RGBA8, alpha 0–255 |

Review sheets remain comparison aids, not runtime assets:

- `art/review/background-choice-pairs-v1.png`, Empire Skirmish row only;
- `art/review/imperial-layer-choice-pairs-v3.png` for the current floor and
  foreground revisions.

No source image was copied, edited, selected, or added to a startup manifest.

## Implemented composition

The scene is intentionally explicit:

```text
EmpireLayeredBattleStudy
├─ WorldViewport (960 x 540)
│  └─ WorldRoot (1920 x 1080 design coordinates at 0.5 scale)
│     ├─ FarBackdropLayer
│     ├─ StageFloorLayer
│     ├─ UnitStandInLayer
│     ├─ EmissiveLayer
│     └─ ForegroundOccluderLayer
├─ PostComposite (samples the exact WorldViewport texture, upscales to 1920 x 1080)
└─ Layer09UI (CanvasLayer 100 sibling, outside post)
```

The six full-resolution candidates are validated first, then cached as 960 x 540
textures. The world is composed once at that size. A single post shader samples the
whole composed world, applies a bounded neighbor-threshold glow, cool/warm grade,
and vignette, then enlarges it to 1920 x 1080. UI is drawn afterward and includes
true-white/cyan reference marks that are never graded.

Controls:

- `Tab`, `1`, or `2`: immediate matched-letter A/B switch;
- `P`: raw composed-world versus post-processed output;
- `Esc`: quit.

## Deterministic validation

Godot version: `4.7.2.stable.official.ed1daf0bf`, Compatibility renderer for
captures.

All five changed GDScripts pass independent `--check-only`. Project import exits
zero. The headless validator exits zero and reports:

```text
[Empire Layer Study Smoke] PASS exact A/B sources, dimensions/alpha/hashes,
layer order, true post feed, raw bypass, and UI separation.
```

The smoke starts on A/post, switches to B, removes the post material while retaining
the exact world feed, restores post and A, and verifies that the three-source A
signature is unchanged. There is no RNG, wall-time animation, gameplay state, or
capture-time mutation.

Godot's headless display driver uses a dummy renderer with no framebuffer. The
validator remains headless; capture commands require the real Compatibility
renderer at explicit `--resolution 1920x1080`. The capture code fails loudly on a
missing framebuffer or wrong dimensions rather than saving empty evidence.

## Captures

Both images were captured at fixed frame 8 with post enabled. Each was rendered a
second time and reproduced the same SHA-256 exactly.

| Choice | Capture | SHA-256 |
|---|---|---|
| A | `docs/screenshots/godot-empire-layered-battle-study-choice-a-post-2026-08-23.png` | `F33CF7C58FF377CDB6B5D1DFE1485A9E2EBF4AFE075E3010F26988C302667744` |
| B | `docs/screenshots/godot-empire-layered-battle-study-choice-b-post-2026-08-23.png` | `6366E201BC79ECAE20D6D7D81A5EC2343B76730E1955E279BF7729DC4B86CAF9` |

Both decode as 1920 x 1080 RGBA. Signal checks rule out blank frames: A has luma
range 16–232 with average 41.32; B has range 16–230 with average 39.04. The A/B
SSIM is `0.491964`, confirming materially different captured compositions rather
than label-only variants.

The primary worker's image viewer and browser-control runtime were unavailable
after the workspace ACL failure (`apply deny-read ACLs`). An independent agent
completed the visual inspection instead:

- both frames are upright, crisp, non-recursive, and free of obvious missing
  textures, black-frame output, or post-processed-UI defects;
- header/footer/UI remain sharp outside post, and the neutral unit/emissive layers
  remain legible while the foreground candidates correctly occlude frame edges;
- A reads as a centered, symmetric deep Imperial nave with the strongest central
  vanishing-point focus;
- B reads as an asymmetric side corridor with a warm right-side light column and a
  more lateral composition;
- both remain very dark around the stand-ins, so final authored combatants need
  deliberate rim/value separation.

This inspection does not establish a preference or approval. Neither capture proves
final horizon/foot-plane matching, parallax, masks, or authored sprite integration;
developer visual review remains the approval gate.

## Remaining limitations and review questions

- This is a structural art-direction study, not the final nine-layer canonical
  battle scene. It deliberately combines enemy/party stand-ins and omits bridge
  playback, authored combatant packages, starfield/mid-architecture derivatives,
  parallax motion, and gameplay feedback.
- The post shader is a bounded study treatment, not final bloom or color science.
  It uses an eight-neighbor luminance approximation, not a separable authored
  emissive blur chain.
- Stage-floor and foreground sources are downsampled once with the rest of the world
  for the half-resolution composite. No full-resolution per-frame blur is used.
- The flattened backdrop remains a composition candidate. Horizon, vanishing point,
  runtime ground line, overscan, and true layered mid-architecture metadata are
  still open.
- The developer should compare combat-lane clarity, unit separation, command-menu
  safe space, foreground obstruction, floor perspective, and whether either layer
  combination overstates gothic architecture versus the approved Imperial
  court/military split.
- Any future selection must record each layer independently before derivative,
  manifest, or canonical integration work begins.
