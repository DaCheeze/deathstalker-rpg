# Hazel Animation Timing Sheet v1

Status: **proposed authored-motion timing for concept and vertical-slice production;
not a gameplay-timing change, runtime package, or approved animation asset**.

This sheet accompanies `hazel-combatant-raster-brief-v1.md`. Values are nominal
source-frame durations for visual weighting. The TypeScript presentation bridge
remains authoritative for resolved action duration and semantic contact. Godot must
retime or sample clips so named markers meet the bridge timeline; gameplay never
waits for an authored frame.

## Current semantic and hit-stop references

- Routine melee resolves over `200 ms` with semantic contact at `100 ms`.
- Standard contact applies `60 ms` of active-delta hit-stop. At 60 FPS this is
  approximately `3.6` refresh intervals, not an authored four-frame hold.
- Critical contact currently uses `110 ms` of hit-stop. The action data and feedback
  policy choose normal versus critical behavior; the sprite package does not.
- During hit-stop, contact-bearing motion and recovery receive zero active delta.
  Recovery resumes from the interrupted source-frame position when the pause ends.
- The wider-game disruptor reference resolves over `810 ms`: `220 ms` charge,
  `240 ms` beam to contact at `460 ms`, and `350 ms` impact/recovery aftermath.
- Hit-stop, audio, flinch, VFX, shake, and damage feedback attach to semantic bridge
  events. They are not baked into the atlas.

## Preferred melee motion A — driving cross-body cut

Hazel loads her hips without a theatrical windup, travels directly toward
screen-left, and drives the forward-weighted blade through one clean horizontal-to-
diagonal channel. Her industrial collar and compact shoulders remain stable enough
to preserve the head silhouette while the torso supplies force.

| Clip | Source frames | Frame durations | Total | Loop | Beat/event |
|---|---:|---|---:|---:|---|
| `melee_anticipation` | 3 | `20, 20, 24 ms` | `64 ms` | no | anticipation, then travel begins |
| `melee_contact` | 3 | `20, 24, 28 ms` | `72 ms` | no | travel; one `contact` on frame 2 at `16 ms` |
| `melee_recovery` | 3 | `20, 20, 24 ms` | `64 ms` | no | recovery |

The authored sequence totals `200 ms`. Contact occurs at global source time
`100 ms`: `64 ms` anticipation + `20 ms` first contact frame + `16 ms` into the
second contact frame. The remaining contact and recovery motion pauses for the
resolved `60 ms` standard hit-stop, then continues from the same source position.
Do not duplicate the contact pose to approximate that pause.

At contact, `weapon_tip` marks the blade endpoint and `hit_center` marks Hazel's
stable reaction origin. Both sockets, plus `muzzle`, `hand`, `core`, and `head`,
remain declared on every frame. The `contact` event owns timing; sockets own only
spatial placement.

## Comparison melee motion B — compact rising cut

Use the same frame counts, durations, contact placement, and hit-stop behavior as
motion A so the review compares pose language rather than timing. Keep the elbows
closer, shorten the blade channel, and drive upward from a lower guard. This is a
viable crowded-staging alternative, not a deliberately weaker option.

## Idle, movement, reaction, and defeat

| Clip | Source frames | Frame durations | Total | Loop | Motion note |
|---|---:|---|---:|---:|---|
| `ranged_idle` | 7 | `7 x 120 ms` | `840 ms` | yes | Watchful breath; compact shoulders; planted foot drift no more than 1 px |
| `closing_idle` | 6 | `6 x 120 ms` | `720 ms` | yes | Economical readiness with stable head/collar separation |
| `advance` | 8 | `8 x 70 ms` | `560 ms` | yes | Direct reusable gait; optional `footfall` at global `140 ms` and `420 ms` |
| `engage` | 4 | `50, 50, 48, 52 ms` | `200 ms` | no | Drop into cutting stance without heavy-unit breadth |
| `engaged_idle` | 6 | `6 x 100 ms` | `600 ms` | yes | Compact weapon-ready loop; no baked vibration glow |
| `hit` | 3 | `40, 40, 60 ms` | `140 ms` | no | Tight recoil preserving red-hair and teal/ivory blocks |
| `defeat` | 6 | `70, 70, 90, 110, 130, 170 ms` | `640 ms` | no | One `defeat` on frame 1 at `0 ms`; hold frame 6 |

Godot owns root translation during `advance`; the loop supplies gait only. Hair,
pouches, and repair tabs must settle through loop seams without noise or foot drift.
The defeat marker aligns to the bridge event, after which the authored fall plays
and the final frame remains held.

## Disruptor draw, fire, and recovery

| Clip | Source frames | Frame durations | Total | Loop | Event |
|---|---:|---|---:|---:|---|
| `disruptor_draw_aim` | 4 | `4 x 55 ms` | `220 ms` | no | none |
| `disruptor_fire` | 6 | `6 x 40 ms` | `240 ms` | no | one `muzzle` and one `beam_start` on frame 1 at `0 ms` |
| `disruptor_recovery` | 5 | `60, 60, 70, 70, 90 ms` | `350 ms` | no | none |

The draw must clear the closed rear-hip holster without intersecting the torso,
pouches, or blade silhouette. The casing stays neutral. Runtime masks and compositor
VFX communicate charge, beam, contact, and spent state. The source sequence matches
the current wider-game `810 ms` reference, but Godot still obeys resolved bridge
values.

## Signature action boundary

Do not invent signature-action choreography or timing before Hazel's signature move
is developer-approved. The eventual `signature` clip must be non-looping and contain
exactly one `contact` event. Its nominal frames and duration are intentionally `TBD`;
do not create a filler animation or manifest entry to satisfy the slot.

## Review gates

1. Review motion A and B with the same costume, background, camera, semantic
   timeline, and effects disabled first.
2. Confirm all four visual beats remain readable at 1280 x 720 and 1920 x 1080,
   despite the three-clip package structure.
3. Repeat with canonical post, runtime contact shadow, and semantic effects enabled.
4. Check loop seams, stationary foot drift, socket continuity, the exact `100 ms`
   contact alignment, and the `60 ms` active-delta freeze in motion.
5. Treat all durations as proposed until the vertical slice is captured and the
   developer approves the motion feel.

Best production venue: **hybrid**. Generate independent source-frame explorations
in the cloud, then perform timing cleanup, interpolation choices, atlas assembly,
semantic retiming, and Godot capture review locally.
