# Godot Power Melee Transparent Art Study — 2026-08-23

Status: **two genuinely transparent A/B idle look-development studies retained;
no visual choice, package approval, or runtime integration**.

## Purpose and boundary

This bounded game-art pass tested whether the existing anonymous three-character
range-band party directions could produce a clean single-combatant input for the
Godot raster-package workflow. It used the built-in image-generation tool and the
existing A/B sheet as a visual reference. It did not name a character, add lore,
choose a direction, author animation, change combat, or register an asset.

The target was the anonymous **Power Melee** loadout only: broad upper body, planted
stance, one straight-backed broad vibroblade with cyan edge, and one compact neutral
ring-capacitor disruptor. Party facing remains screen-left. Hammer, shield, second
weapon, exposed face, giant proportions, floor, shadow, scenery, UI, text, and baked
effects were excluded.

## Inputs

- A/B review sheet: `art/review/range-band-choice-pairs-v1.png`
- Party Choice A source board:
  `art/choices/range-band/party/range-band-party-selection-choice-a-v2.png`
- Party Choice B source board:
  `art/choices/range-band/party/range-band-party-selection-choice-b-v2.png`

The post-reboot filesystem sandbox could not pass local paths into the built-in
image tool. The unchanged review sheet was therefore rendered into the conversation
and used as the visible reference. No API key or fallback CLI was used.

## Prompt set

Choice A generation requested one full-body, helmeted, human-scale Power Melee
combatant derived only from the upper-left Choice A panel: ornate ivory and dark
steel, restrained gold/cyan detail, screen-left three-quarter battle stance, one
broad vibroblade, neutral holstered disruptor, low-frequency HD-2D forms, generous
padding, and a genuinely transparent background. The prompt explicitly prohibited
extra figures, floor/shadow/scenery, checkerboard, crop, text, lore, emblems, generic
franchise iconography, extra weapons, shield, cape, and oversized proportions.

Choice B generation used the same role, framing, scale, and exclusions while
requesting the upper-right panel's dark padded suit, practical pale plates,
industrial fasteners, and reduced ornament. The newly generated Choice A was used
only as framing/scale parity evidence.

Both initial generations returned RGB files with baked pale checkerboards. The
correction prompt was intentionally narrow: remove only the background, preserve
the complete subject and padding, return actual RGBA with alpha-zero background and
partially transparent antialiased edges, add nothing, and leave every art decision
unchanged. Choice A succeeded. Choice B failed that same requirement twice and was
rejected rather than mechanically guessed or admitted under a weaker standard.

## Measured result

Retained artifact:
`art/choices/range-band/party/range-band-power-melee-choice-a-idle-study-v1.png`

- PNG dimensions: 1240 x 1269
- color mode: RGBA
- alpha extrema: 0–255
- fully transparent pixels: 1,180,881
- partially transparent edge pixels: 391,803
- file size: 1,010,720 bytes
- SHA-256:
  `7FCB32092BD8505C7949E18FBF77CC898C1D6C41FCE47490DC3DD6F0ADD5E65A`

Rejected outputs were left only as generator previews and are not referenced by the
project. Their failure was technical, not a developer judgment of Choice B's visual
direction.

## Fresh independent Choice B follow-up

A later pass followed the recorded next gate: it generated Choice B from a fresh
text brief rather than editing or extracting any failed checkerboard image. The new
construction uses asymmetrical ivory ceramic protection, cobalt and turquoise
armored cloth, controlled saffron lining, gunmetal mechanisms, one straight-backed
broad vibroblade, and one inactive holstered ring-capacitor disruptor. It preserves
the anonymous human-scale Power Melee role and faces screen-left.

Retained artifact:
`art/choices/range-band/party/range-band-power-melee-choice-b-idle-study-v1.png`

- PNG dimensions: 1024 x 1536
- color mode: RGBA
- alpha extrema: 0–254
- fully transparent pixels: 1,049,119
- partially transparent visible pixels: 523,745
- file size: 2,092,247 bytes
- SHA-256:
  `4CC068F71BAA58DE7518E5BF52095D54BB5A12EAEBFB77F58B80828D673D902B`
- alpha connectivity: exactly one large subject at thresholds 16, 64, and 128
- nonzero bounds: x 38–945, y 39–1511; bottom safety is 24 pixels

The fresh B is a valid visual study, not a contract-ready package. Choice A also
remains a study: its nonzero bounds touch the left and bottom canvas edges. Neither
file may be promoted directly into an atlas without equalized scale, restored safe
padding, an explicit ground anchor, sockets, states, and package metadata.

## Limitations and next gate

The retained image is one idle-like keyframe, not a package. It has no 512 x 512
cell layout, normalized ground-anchor metadata, validated trim/safe bounds, battle
scale decision, animation clips, timing, semantic events, sockets, emissive/normal
masks, manifest entry, or Godot import. It has not passed
`scripts/validate-godot-combatant-raster-package.mjs` because no package claims to
exist yet.

Next, compare the two surviving A/B directions at normal battle scale. After the
developer selects one, re-author or normalize it into the required safe 512 x 512
cell package with idle, advance, anticipation, contact, recovery, hit, and defeat
coverage. Until then, the canonical Godot client continues using procedural
stand-ins.

No dependencies, gameplay values, bridge data, audio, commits, or pushes changed.
