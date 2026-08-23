# Godot Power Melee combatant idle-study harness — 2026-08-23

## Decision status

This pass is complete as isolated visual-QA evidence. It does **not** approve or
select either combatant choice, either background study, an anchor, a scale, or a
motion pipeline. Each combatant input is one idle-like keyframe, not a valid Godot
combatant raster package. Nothing was registered with a runtime manifest or copied
into canonical `godot/`.

The portable experiment lives at
`experiments/godot-combatant-study-harness/`. It keeps private `res://` copies of
the two combatant studies and the two neutral Empire backgrounds, with their
provenance and measured identities pinned in `study/study_manifest.json`.

## Exact source measurements

Bounds use `[x, y, width, height]`; margins use left/top/right/bottom. The
`alpha>=2` threshold only separates Choice A's single alpha-1 edge residue from its
substantive silhouette. It is a diagnostic threshold, not an asset-contract rule.

| Measurement | Choice A | Choice B |
|---|---:|---:|
| Source dimensions | 1240x1269 | 1024x1536 |
| Bytes | 1,010,720 | 2,092,247 |
| SHA-256 | `7FCB32092BD8505C7949E18FBF77CC898C1D6C41FCE47490DC3DD6F0ADD5E65A` | `4CC068F71BAA58DE7518E5BF52095D54BB5A12EAEBFB77F58B80828D673D902B` |
| PNG / decoded format | 8-bit RGBA, color type 6, non-interlaced / RGBA8 | 8-bit RGBA, color type 6, non-interlaced / RGBA8 |
| Transparent / partial / opaque pixels | 1,180,881 / 391,803 / 876 | 1,049,119 / 523,745 / 0 |
| Strict `alpha>0` bounds | `[0,13,950,1256]` | `[38,39,908,1473]` |
| Strict margins | L0 T13 R290 B0 | L38 T39 R78 B24 |
| `alpha>=2` bounds | `[352,13,596,1201]` | `[40,41,904,1467]` |
| `alpha>=2` margins | L352 T13 R292 B55 | L40 T41 R80 B28 |
| Edge-touching nonzero pixels | exactly one: `(0,1268)`, alpha `1` | zero |
| Proposed ground anchor | `(650,1214)` | `(492,1508)` |
| Proposed 1080p visible height / scale | 360 px / `0.2997502081598668` | 360 px / `0.24539877300613497` |

Both meaningful silhouettes are fully inside their source canvases at `alpha>=2`,
and the harness's matte, background, and diagnostic layouts validate without crop
at all three reversible height candidates. At the default 360px 1080p proposal,
the 1280x720 stretched review presents the same design state at 240px visible
height.

The proposed anchors place `y` at the exclusive bottom of each `alpha>=2` bound and
keep `x` inside that bound. They are practical alignment hypotheses only. A real
package needs approved ground anchors and consistent authored cells; these source
canvases are not substitutes.

## Strict blockers

Normal review validation passes the pinned file, alpha, and no-crop checks. Strict
package readiness deliberately exits `3` with seven explicit blocker entries:

1. Each choice contains one idle-like keyframe only. There are no clips, timing,
   event markers, sockets, masks, or stationary-foot-drift evidence.
2. Neither source is a 512x512 production cell or complete raster package.
3. Full-frame-raster and deliberate-hybrid are telemetry-only placeholders. The
   harness does not invent missing frames or parts.
4. **Choice A strict nonzero-alpha gate fails exactly:** one alpha-1 residue pixel
   at `(0,1268)` touches the left and bottom source edges.
5. Choice A's substantive top margin is `13px`, below the provisional `32px`
   review margin.
6. Choice B's substantive bottom margin is `28px`, below the provisional `40px`
   review margin.
7. Choice B's bottom safety is only `24px` under strict `alpha>0`; this is reported
   separately so the exact strict measurement is not hidden by the `alpha>=2`
   diagnostic. Choice B is not edge-cropped.

Choice B having zero fully opaque pixels is an observed encoding fact, not a
failure by itself: it contains real transparent and partially transparent alpha,
and the pinned decoder/alpha checks pass. It remains worth preserving in any
subsequent cleanup so edge opacity is not accidentally flattened.

## Visual review

The game-art review was conducted at the same proposed visible height on dark,
light, checker, and both neutral Empire background studies, with identical
background treatment and no candidate-specific correction.

- Both silhouettes remain readable on all three mattes at the proposed 360px
  1080p / 240px 720p-equivalent height. No gross rectangular matte, crop, or obvious
  dark/white fringe was visible in the inspected captures.
- Choice A reads as the denser, broader, more weight-forward silhouette; Choice B
  reads as the taller, slimmer silhouette with a long down-left weapon projection.
  Those are observations, not a selection recommendation.
- Both retain authored party-facing screen-left orientation. Choice-specific full
  source extents differ substantially, which is why equal visible height is more
  informative than equal raw texture scale.
- Both remain legible against both neutral Empire studies in this static setup.
  Background choice and combatant choice remain independent decisions.
- The overlay legend is intentionally inspectable: gray source extent, gold
  provisional safe inset, red strict nonzero bounds, cyan `alpha>=2` bounds, green
  proposed anchor/ground line, and an explicit red marker for Choice A's alpha-1
  edge pixel.

This review cannot assess animation cadence, anticipation, hit reaction, effect
occlusion, stationary foot drift, actual combat spacing, or runtime-event sync.

## Deterministic capture evidence

Godot Movie Maker recorded two frames for each static view at fixed 60 FPS. Within
every sequence, frame 0 and frame 1 were byte-identical. Frame 0 was promoted below.
The 1280x720 mattes use the harness's default stretched review window. For native
1920x1080 evidence, the window override was temporarily removed, captures were
taken from the 1920x1080 design viewport, and the 1280x720 default was restored.

| Evidence | Resolution | SHA-256 (both recorded frames) |
|---|---:|---|
| [Choice A dark/light/checker mattes](../screenshots/godot-power-melee-study-mattes-choice-a-1280x720-2026-08-23.png) | 1280x720 | `FD0863B965CF7B532E4A16841EAC8F80CC261FF44D18D8DFD1CE9DB8605F91BA` |
| [Choice B dark/light/checker mattes](../screenshots/godot-power-melee-study-mattes-choice-b-1280x720-2026-08-23.png) | 1280x720 | `1BAF66452665B96DC2CAFF63746F8AE139093BE7587AFBFE7A1EB60CE64E062D` |
| [Both choices on Empire background A](../screenshots/godot-power-melee-study-background-a-both-1920x1080-2026-08-23.png) | 1920x1080 | `EC44DF8335177F33178A2EB3B4056AC9174911B54531E460C040CD1E4325F2C5` |
| [Both choices on Empire background B](../screenshots/godot-power-melee-study-background-b-both-1920x1080-2026-08-23.png) | 1920x1080 | `39FB1846EF525407029C37B1D1779D565ED6F553F337C38CC3B50A8FFC295702` |
| [Choice A source diagnostic](../screenshots/godot-power-melee-study-source-choice-a-1920x1080-2026-08-23.png) | 1920x1080 | `12584799B54BEF9121F5E124C49B48F366A99AFA4B8A795A96FFA2E26B4B96CD` |
| [Choice B source diagnostic](../screenshots/godot-power-melee-study-source-choice-b-1920x1080-2026-08-23.png) | 1920x1080 | `006180FA434702264F83D7D3B01612B2475E52CBDAA5292B1965DFAD069C351E` |

The capture labels and diagnostic values are state-derived constants; startup scan
timings are log-only so they do not make pixels nondeterministic.

## Validation and measured cost

Godot `4.7.2.stable` results:

| Check | Result |
|---|---|
| Changed `scripts/main.gd` `--check-only` | exit `0` |
| Isolated `--import --quit` | exit `0`; four PNGs imported |
| `--validate-only` | exit `0`; structural validation pass and exact measurements matched |
| `--validate-only --strict` | expected exit `3`; seven blockers printed |
| Bounded matte smoke, fixed 60 FPS, 60 frames | exit `0` |
| Six two-frame Movie Maker sequences | exit `0`; each pair byte-identical |

Measured startup alpha scans varied by run: Choice A was approximately
`129–143ms`; Choice B was approximately `146–164ms` on this machine. They run once
at harness startup, not per frame. One logged two-frame 1280x720 capture reported
average CPU render time `0.19ms/frame`, GPU time `0.00ms/frame`, and PNG encoding
time `27.52ms/frame`; a two-frame static review is not representative gameplay
profiling. No blur, post-process, animation, or per-frame alpha scan exists in this
harness.

Godot's headless `--check-only` run also printed renderer RID/ObjectDB leak messages
while returning `0`; the bounded runtime smoke returned `0` and did not print those
exit-cleanup messages. This is recorded as a tooling limitation, not presented as a
performance pass.

No dependency, canonical client, core, bridge, audio, project-state, transition
log, commit, or push change was made by this pass.
