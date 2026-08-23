# Owen Animation Timing Sheet v1

Status: **proposed authored-motion timing for concept and vertical-slice production;
not a gameplay-timing change, runtime package, or approved animation asset**.

This sheet accompanies `owen-combatant-raster-brief-v1.md`. Values below are nominal
source-frame durations for visual weighting. The TypeScript presentation bridge
remains authoritative for resolved action duration, semantic contact, and disruptor
beam/contact timing. Godot must retime or sample clips so named markers meet the
bridge timeline; gameplay never waits for an authored frame.

## Current semantic references

- Routine melee currently resolves over `200 ms` with semantic contact at `100 ms`.
- The wider-game disruptor reference resolves over `810 ms`: `220 ms` charge,
  `240 ms` beam to contact at `460 ms`, and `350 ms` impact/recovery aftermath.
- The bounded range-band prototype uses the same `220 ms` beam start and `460 ms`
  contact but only an `80 ms` aftermath. Owen is not registered under that anonymous
  prototype package schema.
- Hit-stop, audio, flinch, VFX, shake, and damage feedback attach to bridge events.
  They are not additional sprite frames and are not baked into the atlas.

## Preferred melee motion A — forward sweep

Owen steps and sweeps toward screen-left. The shoulder and hip lead, the sword
crosses a clean negative-space channel, and the split coat follows one visual beat
behind the torso. The planted foot remains tied to the package anchor; travel comes
from the Godot combatant root rather than sliding the foot inside the frame.

| Clip | Source frames | Frame durations | Total | Loop | Event |
|---|---:|---|---:|---:|---|
| `melee_anticipation` | 3 | `24, 24, 24 ms` | `72 ms` | no | none |
| `melee_contact` | 3 | `16, 24, 16 ms` | `56 ms` | no | one `contact` on frame 2 at `12 ms` |
| `melee_recovery` | 3 | `24, 24, 24 ms` | `72 ms` | no | none |

The authored sequence totals `200 ms`. Contact occurs at global source time
`100 ms`: `72 ms` anticipation + `16 ms` first contact frame + `12 ms` into the
second contact frame. Preserve one strong silhouette at anticipation, contact, and
recovery even if intermediate frames are later added.

At contact, `weapon_tip` marks the blade endpoint and `hit_center` marks Owen's
stable reaction origin. Both sockets, plus `muzzle`, `hand`, `core`, and `head`,
remain declared on every frame. The `contact` event owns timing; sockets own only
spatial placement.

## Comparison melee motion B — compact draw-cut

Use the same frame counts, durations, and semantic event as motion A so the review
compares pose language rather than different timing. Keep the elbows closer, reduce
coat displacement, and emphasize a shorter diagonal blade channel. This is the
fallback if the forward sweep becomes muddy beside an enemy or under the command
menu, not a deliberately weaker option.

## Idle, movement, reaction, and defeat

| Clip | Source frames | Frame durations | Total | Loop | Motion note |
|---|---:|---|---:|---:|---|
| `ranged_idle` | 8 | `8 x 120 ms` | `960 ms` | yes | Quiet breath; coat settles; planted foot drift no more than 1 px |
| `closing_idle` | 8 | `8 x 100 ms` | `800 ms` | yes | Slightly higher readiness; collar/hair separation remains stable |
| `advance` | 8 | `8 x 80 ms` | `640 ms` | yes | Reusable gait; optional `footfall` at global `200 ms` and `520 ms` |
| `engage` | 4 | `60, 60, 56, 64 ms` | `240 ms` | no | Lower center of mass without adding heavy-unit bulk |
| `engaged_idle` | 6 | `6 x 120 ms` | `720 ms` | yes | Weapon-ready breathing; no baked state glow |
| `hit` | 3 | `40, 40, 60 ms` | `140 ms` | no | Compact recoil preserving cobalt/dark material blocks |
| `defeat` | 6 | `80, 80, 100, 120, 140, 200 ms` | `720 ms` | no | One `defeat` on frame 1 at `0 ms`; hold frame 6 |

Godot owns root translation during `advance`; the loop supplies gait only. Coat and
hair secondary motion must settle into the loop seam without an obvious pop. The
defeat marker aligns to the bridge event, after which the authored fall plays and
the final frame remains held.

## Disruptor draw, fire, and recovery

| Clip | Source frames | Frame durations | Total | Loop | Event |
|---|---:|---|---:|---:|---|
| `disruptor_draw_aim` | 4 | `4 x 55 ms` | `220 ms` | no | none |
| `disruptor_fire` | 6 | `6 x 40 ms` | `240 ms` | no | one `muzzle` and one `beam_start` on frame 1 at `0 ms` |
| `disruptor_recovery` | 5 | `60, 60, 70, 70, 90 ms` | `350 ms` | no | none |

The casing stays neutral. Runtime masks and compositor VFX communicate charge,
beam, contact, and spent state. The source sequence matches the current wider-game
`810 ms` reference, but Godot must still obey the resolved bridge values. The
prototype's shorter aftermath would retime or truncate recovery without changing
the source package.

## Signature action boundary

Do not invent signature-action choreography or timing before Owen's signature move
is developer-approved. The eventual `signature` clip must be non-looping and contain
exactly one `contact` event. Its nominal frames and duration are intentionally `TBD`;
do not create a filler animation or manifest entry to satisfy the slot.

## Review gates

1. Review motion A and B with the same costume, background, camera, semantic
   timeline, and effects disabled first.
2. Confirm the forward sweep reads at normal 1280 x 720 and 1920 x 1080 presentation
   scale without the coat hiding foot placement or blade travel.
3. Repeat with canonical post, runtime contact shadow, and semantic effects enabled.
4. Check loop seams, stationary foot drift, socket continuity, and the exact
   `100 ms` melee contact alignment in motion.
5. Treat all durations as proposed until the vertical slice is captured and the
   developer approves the motion feel.

Best production venue: **hybrid**. Generate independent source-frame explorations
in the cloud, then perform timing cleanup, interpolation choices, atlas assembly,
semantic retiming, and Godot capture review locally.
