# Godot range-band party A/B art review — 2026-08-23

## Outcome and decision status

This pass converts the six current anonymous range-band party idle studies into a
single runnable Godot review surface at consistent battle scale. The experiment is
`experiments/godot-range-band-party-art-review/`.

No art direction was selected. All six studies remain proposed, unapproved,
single-frame sources with no runtime registration. The harness does not modify the
canonical `godot/` client, infer animation, or claim package readiness.

## Pinned inputs

All sources are 1024×1536 non-interlaced 8-bit RGBA PNGs. Alpha bounds are exact
nonzero-alpha rectangles `[x, y, width, height]`.

| Role / branch | Source version | Alpha bounds | SHA-256 |
|---|---|---:|---|
| Power A | normalized v2 | `[148,180,727,1176]` | `51A9E192CF2FB31A3EC8DD145321CDF40311A59C7BC15002736080B8AF9E9E8F` |
| Critical A | v1 | `[128,230,768,1126]` | `88E92CEBBD633F288236A4C8D08B59D438BAEF6899D7994A1405999E1B4F7479` |
| Queue A | v1 | `[128,241,768,1115]` | `4722F9A95F40D95B6908B3F50EDEB0680D32DCE5E1597B00A10688B72D24083A` |
| Power B | normalized v2 | `[154,180,715,1176]` | `083992A69774AAD29CAA30B7082FCD90C6E87908A8AC77438757AD628FEB1530` |
| Critical B | v1 | `[128,329,768,1027]` | `A3490DEF46AB6603ECA654A44CDCCDB0FFF35C71444725C9AD25E8D7FBDB3659` |
| Queue B | v1 | `[128,322,768,1034]` | `BD855A12AB652E60BABD92719570C4999B75F98A0D888BB407585A3D6D3FAF0A` |

Every image has zero nonzero-alpha pixels on its source edges and retains the
authored 180 px transparent bottom pad. The reversible review anchor is `(512,
1356)` for all six. Equal-height presentation is computed from the measured alpha
silhouette rather than the padded source canvas.

The optional Empire A/B context sources are also hash-, byte-, and
dimension-pinned. They remain independent unapproved background choices.

## Review surface

The 1920×1080 design surface provides four views:

1. a complete active party at proposed `320 / 360 / 400` px visible height;
2. complete Choice A and Choice B parties side-by-side at a fixed 320 px comparison
   height;
3. any one role's A/B pair on dark, light, and mid mattes at 360 px;
4. all six source, alpha-bound, and proposed-anchor diagnostics.

The `G` control cycles a neutral procedural stage and the two Empire contexts.
This is explicitly contextual: it does not couple a combatant branch to a
background branch. Source and alpha-bound overlays are available through `O`.

The startup validator resolves only safe repository-relative `art/` paths, checks
SHA-256 and byte length, rejects changed PNG encoding or decoded dimensions, scans
exact alpha bounds, and rejects edge-touching alpha. A failure renders a loud error
surface and exits validation with code 2.

## Visual QA observations

The three-role formations were inspected at the proposed 360 px 1080p height, and
the combined branch comparison at 320 px. There is no visible crop, ground-anchor
separation, unexpected rectangular matte, or role-label collision in the promoted
captures.

- Choice A reads as a practical, human-scale travel-coat family. Teal/ivory Power,
  magenta/teal Critical, and orange/teal Queue provide stronger role-color
  separation while retaining shared construction language.
- Choice B reads as a cleaner, harder-surface athletic squad. Its recurring
  blue/ivory/yellow language creates stronger uniformity, but Critical and Queue
  overlap more in palette and the three roles separate less strongly by color.
- In both branches, Power retains the broadest weight read, Critical the most
  forward/agile silhouette and two visible blades, and Queue the clearest
  weapon-plus-control-hand pose.
- These are descriptive review observations, not a selection. Developer preference
  remains the subjective gate.

This static surface cannot assess anticipation, contact, recovery, hit reaction,
defeat, stationary-foot drift, effect occlusion, material response under the
canonical compositor, or bridge-timed animation.

## Evidence

| Capture | Resolution | SHA-256 |
|---|---:|---|
| [Complete Choice A](../screenshots/godot-range-band-party-choice-a-review-1920x1080-2026-08-23.png) | 1920×1080 | `4D30FC825805AE81C3726C4146E8B570D47AE4E050919ECB29A6B597B675800F` |
| [Complete Choice B](../screenshots/godot-range-band-party-choice-b-review-1920x1080-2026-08-23.png) | 1920×1080 | `A67CD789D76DD53EB8E450C0395069AA5081B5906E85829588902042C3828E61` |
| [Side-by-side A/B](../screenshots/godot-range-band-party-ab-comparison-1920x1080-2026-08-23.png) | 1920×1080 | `13755AA8E382A1D068956EDCBE4A32721E0270B4BE7B1633B00BA82CB8F3BE13` |

Godot Movie Maker rendered two frames for each promoted composition at fixed 60
FPS. The first frame from each sequence was promoted and the redundant second frame
was removed; repeat-byte identity is not claimed because its hash was not retained.
Measured average render time was `0.63–0.67 ms/frame`; PNG encoding was
`46.32–53.52 ms/frame`. Static two-frame capture is not gameplay profiling.

## Verification

Godot `4.7.2.stable` results:

| Check | Result |
|---|---|
| `scripts/main.gd --check-only` | exit 0; editor-exit RID/ObjectDB leak diagnostics retained as a tooling limitation |
| isolated import | exit 0 |
| `--validate-only` | exit 0; six combatants and two contextual backgrounds matched pinned identity and geometry |
| full Choice A / Choice B / combined comparison captures | exit 0; native 1920×1080 |
| matte view with bounds enabled | exit 0 |
| six-source diagnostic view | exit 0 |

The remaining four declared blockers are intentional: single-keyframe inputs,
unapproved anchor/height proposals, independent unapproved background choice, and
no canonical runtime registration.

## Launch

From the repository root:

```powershell
& 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64.exe' --path 'F:\RPG v1\experiments\godot-range-band-party-art-review'
```

The next gate is a developer choice between the complete A and B families, or an
explicit request for a newly authored mixed branch. Only after that choice should
one branch receive a motion-pipeline decision and a complete raster package.

## Resolved-timeline motion follow-up

Pass 13 adds an isolated fifth view that runs both branches through the same pinned
34-frame range-band replay using restrained whole-raster rehearsal. It does not
change the Pass 12 art decision status or create animation frames. Exact scope,
captures, verification, and limitations are recorded in
`godot-range-band-party-motion-rehearsal-2026-08-23.md`.
