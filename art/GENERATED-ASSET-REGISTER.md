# Generated Asset Register

Initial batch generated 2026-08-22 with the built-in OpenAI image-generation
tool. Choice-pair library added the same day.

All assets in this register are exploratory or proposed. None is developer-approved,
registered in the runtime manifest, or integrated into the renderer. The existing
`hazel-dark-concept-v1.png` predates this batch and is not covered here.

Binary sources and review exports are archived in the private Git LFS repository
`DaCheeze/deathstalker-rpg-art` at commit
`e1a26c43de68effd1ffe3f3f408a56e578558824`. They remain available in the current
owner-local workspace, but binary files under `art/` are intentionally ignored by
the GitHub Pages game repository. This register and the candidate catalog remain
the game-repository metadata authority; neither is a runtime manifest.

## Choice policy

Every new creative brief receives at least two independently viable candidates,
identified as **Choice A** and **Choice B**, so the developer can compare visual
directions before anything is approved or integrated.

- A choice must materially change composition, silhouette, spatial language, or
  design construction. A simple recolor is not a second choice.
- A rejected draft, crop repair, floor-horizon correction, transparency cleanup,
  or resized export is a revision of its parent choice and does not count as an
  alternate.
- Derived assets inherit the chosen direction. Revisions use a separate version
  suffix rather than consuming a new choice letter.
- Choice letters are neutral review identifiers, not approval or ranking.
- No generated choice enters the runtime manifest until the developer selects it
  and explicitly requests integration.

## 2026-08-23 authoritative corrections

The following corrections supersede the older rows and prompt summaries retained
later in this file. Superseded files remain only as provenance and must not enter a
runtime manifest.

| Family | Rejected or superseded provenance | Current proposed alternatives | Reason |
|---|---|---|---|
| Shub environments | Unversioned `enc_shub_*` A/B files | `enc_shub_skirmish-choice-{a|b}-v2.png`; `enc_shub_swarm-choice-{a|b}-v2.png` | Developer set Shub to red/rust/ember/iron-black with no blue or purple faction read |
| Shub machine concepts | `shub-enemy-family-choice-{a|b}.png` | `shub-machine-family-choice-{a|b}-v2.png` | Same palette correction; new art preserves precise alien-machine geometry |
| Hadenman environment | Unversioned `enc_hadenman_vanguard` A/B files | `enc_hadenman_vanguard-choice-{a|b}-v2.png` | Developer set Hadenmen to engineered gold rather than crimson/red |
| Hadenman concepts | Unversioned `hadenman-enemy-duo` A/B files | `hadenman-enemy-duo-choice-{a|b}-v2.png` | Golden fortress-machine correction |
| Hazel/Owen dark wardrobe | `hazel-owen-costume-lookdev-choice-a-v2.png`; `...choice-b-v1.png` | Vibrant Choices A-D listed below | Developer rejected the dull party wardrobe; Hazel stays red-haired and Owen blonde |

The rejected files were not deleted or altered. They do not count as live
alternatives and cannot be selected accidentally without an explicit reversal.

## Current Godot-first art expansion

Every row in this section is **proposed and unselected**. Nothing is registered in a
runtime manifest or integrated into Godot or Canvas. Group sheets require slicing,
anchoring, metadata, and in-engine validation after a developer choice.

### Environment and compositor candidates

| Family | Choice A | Choice B | Format | Review |
|---|---|---|---|---|
| Imperial skirmish backdrop | `art/choices/backgrounds/enc_empire_skirmish-choice-a.png` | `...choice-b.png` | 1920 x 1080 opaque | `art/review/background-choice-pairs-v1.png` |
| Imperial patrol backdrop | `art/choices/backgrounds/enc_empire_patrol-choice-a.png` | `...choice-b.png` | 1920 x 1080 opaque | `art/review/background-choice-pairs-v1.png` |
| Shub skirmish backdrop, corrected | `art/choices/backgrounds/enc_shub_skirmish-choice-a-v2.png` | `...choice-b-v2.png` | 1920 x 1080 opaque | `art/review/shub-red-rust-choice-pairs-v2.png` |
| Shub swarm backdrop, corrected | `art/choices/backgrounds/enc_shub_swarm-choice-a-v2.png` | `...choice-b-v2.png` | 1920 x 1080 opaque | `art/review/shub-red-rust-choice-pairs-v2.png` |
| Hadenman vanguard backdrop, corrected | `art/choices/backgrounds/enc_hadenman_vanguard-choice-a-v2.png` | `...choice-b-v2.png` | 1920 x 1080 opaque | `art/review/hadenman-gold-choice-pairs-v2.png` |
| Title/main-menu plate | `art/choices/backgrounds/title-main-menu-background-choice-a-v1.png` | `...choice-b-v1.png` | 1920 x 1080 opaque | `art/review/title-main-menu-background-choice-pair-v1.png` |
| Mistworld battle backdrop | `art/choices/backgrounds/mistworld-battle-background-choice-a-v1.png` | `...choice-b-v1.png` | 1920 x 1080 opaque | `art/review/mistworld-battle-background-choice-pair-v1.png` |
| Imperial noble dialogue interior | `art/choices/backgrounds/imperial-noble-dialogue-interior-choice-a-v1.png` | `...choice-b-v1.png` | 1920 x 1080 opaque | `art/review/imperial-noble-dialogue-interior-choice-pair-v1.png` |
| Imperial stage floor | `art/choices/stage-floor/imperial-stage-floor-choice-a-v2.png` | `...choice-b-v3.png` | 1920 x 1080 RGBA | `art/review/imperial-layer-choice-pairs-v3.png` |
| Shub stage floor | `art/choices/stage-floor/shub-stage-floor-choice-a-v1.png` | `...choice-b-v1.png` | 1920 x 1080 RGBA | `art/review/shub-layer-choice-pairs-v1.png` |
| Hadenman stage floor | `art/choices/stage-floor/hadenman-stage-floor-choice-a-v1.png` | `...choice-b-v1.png` | 1920 x 1080 RGBA | `art/review/hadenman-layer-choice-pairs-v1.png` |
| Imperial foreground occluder | `art/choices/foreground/imperial-parallax-occluder-choice-a-v2.png` | `...choice-b-v2.png` | 1920 x 1080 RGBA | `art/review/imperial-layer-choice-pairs-v3.png` |
| Shub foreground occluder | `art/choices/foreground/shub-parallax-occluder-choice-a-v1.png` | `...choice-b-v1.png` | 1920 x 1080 RGBA | `art/review/shub-layer-choice-pairs-v1.png` |
| Hadenman foreground occluder | `art/choices/foreground/hadenman-parallax-occluder-choice-a-v1.png` | `...choice-b-v1.png` | 1920 x 1080 RGBA | `art/review/hadenman-layer-choice-pairs-v1.png` |

Foreground finals reserve a broad transparent center for combat and UI. Flattened
backdrops remain composition candidates; a selected production environment still
needs layer metadata, horizon and vanishing-point lock, import settings, and a live
Godot compositor review.

### Combatant, field-object, and effect studies

| Family | Choice A | Choice B | Format | Runtime condition |
|---|---|---|---|---|
| Range-band party selection | `art/choices/range-band/party/range-band-party-selection-choice-a-v2.png` | `...choice-b-v2.png` | 1536 x 1024 RGBA | Reference only; multi-subject sheet |
| Range-band opponents | `art/choices/range-band/opponents/range-band-opponent-selection-choice-a-v1.png` | `...choice-b-v1.png` | 1536 x 1024 RGBA | Reference only; multi-subject sheet |
| Queue Control Melee idle study | `art/choices/range-band/party/range-band-queue-control-melee-choice-a-idle-study-v1.png` | `...choice-b-idle-study-v1.png` | 1024 x 1536 RGBA | One connected padded subject each; needs animation package |
| Critical Melee idle study | `art/choices/range-band/party/range-band-critical-melee-choice-a-idle-study-v1.png` | `...choice-b-idle-study-v1.png` | 1024 x 1536 RGBA | One connected padded subject each; exactly two daggers; needs animation package |
| Power Melee idle study, normalized | `art/choices/range-band/party/range-band-power-melee-choice-a-idle-study-v2.png` | `...choice-b-idle-study-v2.png` | 1024 x 1536 RGBA | One connected padded subject each; exactly one broad blade; needs animation package |
| Psi-blocker states | `art/choices/field-objects/psi-blocker-states-choice-a-v2.png` | `...choice-b-v2.png` | 1536 x 1024 RGBA | Needs state slicing, anchor, and metadata |
| Golden Hadenman concepts | `art/choices/concepts/hadenman-enemy-duo-choice-a-v2.png` | `...choice-b-v2.png` | 1536 x 1024 RGBA | Reference only |
| Golden Hadenman Decimator idle study | `art/choices/concepts/hadenman-decimator-idle-combatant-choice-a-v1.png` | `...choice-b-v1.png` | 1254 x 1254 RGBA | One connected padded subject each; needs animation package |
| Golden Hadenman Enforcer idle study | `art/choices/concepts/hadenman-enforcer-idle-combatant-choice-a-v1.png` | `...choice-b-v1.png` | 1254 x 1254 RGBA | One connected padded subject each; needs animation package |
| Red/rust Shub concepts | `art/choices/concepts/shub-machine-family-choice-a-v2.png` | `...choice-b-v2.png` | 1536 x 1024 RGBA | Reference only |
| Hadenman/Shub queue tokens | `art/choices/portraits/hadenman-shub-queue-portrait-tokens-choice-a-v2.png` | `...choice-b-v4.png` | 1536 x 1536 RGBA | Needs four-token slicing |
| Combat-feedback language | `art/choices/look-dev/combat-feedback-language-choice-a-v1.png` | `...choice-b-v1.png` | 1672 x 941 opaque | Reference only; shipped VFX remain procedural |
| Red/rust Shub Stalker idle study | `art/choices/combatants/shub-stalker-idle-study-choice-a-v1.png` | `...choice-b-v1.png` | A 1216 x 1293; B 1212 x 1297; RGBA | One connected subject each; needs canvas/anchor normalization and animation package |

A separate production-chat pass produced two independent, genuinely transparent
Power Melee v1 look-development studies. They are retained as superseded framing
provenance now that the fully padded v2 A/B pair exists:

- `art/choices/range-band/party/range-band-power-melee-choice-a-idle-study-v1.png`
  (1240 x 1269 RGBA);
- `art/choices/range-band/party/range-band-power-melee-choice-b-idle-study-v1.png`
  (1024 x 1536 RGBA).

The Shub Stalker A/B pair also contains exactly one connected subject at alpha
thresholds 16, 64, and 128 and follows the approved red/rust/iron-black palette.
Choice A has 20 px bottom safety; Choice B has 56 px bottom safety but only 19 px top
safety. Both remain look-development studies pending equalized transparent canvas,
explicit ground anchor, sockets, scale, state coverage, and package validation.
Rejected cropped generations remain outside the repository.

The normalized Power Melee v2 pair and the Critical and Queue Control v1 pairs are
each 1024 x 1536 RGBA. Fresh alpha measurements place every visible bottom edge at
y=1356, leaving 180 pixels of bottom padding; the Power pair begins at y=180, the
Critical pair at y=230/329, and the Queue Control pair at y=241/322. These are
**studies, not runtime packages**: they still need a developer-selected branch,
shared battle scale and ground anchor, sockets, complete motion states, atlas
construction, metadata, and package validation. Earlier baked-checker/RGB attempts
were not copied into the repository and do not count as choices.

### Portrait, UI, and prop candidates

| Family | Choice A | Choice B | Format | Review or derivative plan |
|---|---|---|---|---|
| Red-haired/blonde portrait calibration | `art/choices/portraits/red-blonde-dialogue-portrait-calibration-choice-a-v1.png` | `...choice-b-v2.png` | 1536 x 1024 RGBA | `art/review/red-blonde-dialogue-portrait-style-choice-pair-v2.png` |
| Hazel/Owen dialogue expressions | `art/choices/portraits/hazel-owen-dialogue-expression-portrait-choice-a-v1.png` | `...choice-b-v1.png` | 1536 x 1024 RGBA | Listening/commanding; `art/review/hazel-owen-dialogue-expression-portrait-choice-pair-v1.png` |
| Imperial noble portraits | `art/choices/portraits/imperial-noble-portrait-style-choice-a-v2.png` | `...choice-b-v6.png` | 1536 x 1024 RGBA | `art/review/imperial-noble-portrait-style-choice-pair-v1.png` |
| Imperial non-noble portraits | `art/choices/portraits/imperial-nonnoble-dialogue-portrait-style-choice-a-v1.png` | `...choice-b-v1.png` | 1024 x 1536 RGBA | `art/review/imperial-nonnoble-dialogue-portrait-style-choice-pair-v1.png` |
| Imperial social-spectrum portraits | `art/choices/portraits/imperial-social-spectrum-dialogue-portrait-choice-a-v1.png` | `...choice-b-v1.png` | 1536 x 1024 RGBA | `art/review/imperial-social-spectrum-dialogue-portrait-choice-pair-v1.png` |
| Dialogue portrait UI kit | `art/choices/ui/dialogue-portrait-ui-kit-choice-a-v2.png` | `...choice-b-v3.png` | 1536 x 1024 RGBA | Slice plan v2 |
| Combat status icons | `art/choices/ui/icons/combat-status-icons-choice-a-v4.png` | `...choice-b-v4.png` | 1536 x 1024 RGBA | Needs icon slicing and semantic mapping |
| Party/equipment menu chrome | `art/choices/ui/imperial-party-equipment-menu-chrome-kit-choice-a-v1.png` | `...choice-b-v1.png` | 2048 x 2048 RGBA | Six components; JSON slice/NinePatch plan present |
| Imperial environment props | `art/choices/props/imperial-environment-prop-cutout-kit-choice-a-v1.png` | `...choice-b-v1.png` | 2048 x 2048 RGBA | Four components; JSON slice plan present |

Portrait faces and identities remain provisional. Generated UI graphics do not
replace semantic labels, keyboard focus, or accessibility treatment.

### Hazel and Owen vibrant wardrobe choices

The first dark pair is rejected. The four current candidates preserve Hazel's red
hair and green eyes and Owen's developer-approved blonde hair; faces remain
provisional.

| Choice | File | Direction | Status |
|---|---|---|---|
| A | `art/choices/costumes/hazel-owen-vibrant-costume-lookdev-choice-a-v1.png` | Practical rebel-pulp: Hazel in teal/sea-green/cream/copper; Owen in cobalt/ivory/warm brown/black-gold | Proposed, RGBA |
| B | `art/choices/costumes/hazel-owen-vibrant-costume-lookdev-choice-b-v1.png` | Aristocratic adventure: Hazel in emerald/turquoise/ivory/brass; Owen in royal blue/indigo/plum/ivory/gold | Proposed, RGBA |
| C | `art/choices/costumes/hazel-owen-vibrant-costume-lookdev-choice-c-v1.png` | Exuberant Rim-adventurer patchwork: turquoise/cream/copper/saffron and cerulean/russet/ivory/emerald | Proposed, RGBA |
| D | `art/choices/costumes/hazel-owen-vibrant-costume-lookdev-choice-d-v1.png` | Court-rebel fusion: emerald/peacock/antique gold/coral and plum/cobalt/ivory/bright gold | Proposed, RGBA |

Reviews:

- `art/review/hazel-owen-vibrant-costume-lookdev-choice-pair-v1.png` (A/B)
- `art/review/hazel-owen-vibrant-costume-lookdev-choice-cd-v1.png` (C/D)
- `art/review/range-band-queue-control-melee-idle-study-choice-pair-v1.png`
- `art/review/range-band-critical-melee-idle-study-choice-pair-v1.png`
- `art/review/range-band-power-melee-idle-study-choice-pair-v2.png`
- `art/review/hadenman-decimator-idle-combatant-choice-pair-v1.png`
- `art/review/hadenman-enforcer-idle-combatant-choice-pair-v1.png`
- `art/review/hazel-owen-dialogue-expression-portrait-choice-pair-v1.png`

### Owen full-body character concept

| Choice | File | Dimensions / format | Direction | Status |
|---|---|---|---|---|
| A | `art/choices/characters/owen/owen-character-choice-a-v1-concept.png` | 1023 x 1537 opaque PNG | Preferred long cobalt travel coat; blonde, tall and rangy; original slender dueling-frame sword; compact ring-capacitor disruptor | Exploratory; unselected and unintegrated |

Generated 2026-08-23 with the built-in OpenAI image-generation tool. The prompt
requested a polished full-body painterly science-fantasy concept in the project's
restrained Imperial interior language, with cobalt/indigo/ivory/black-gold tailoring,
dark field layers, restrained steelmesh, one warm-leather accent, one human-scale
sword, and one neutral compact disruptor. It explicitly excluded published costume,
likeness, weapon, pose, and cover-composition copying; franchise iconography;
oversized armor; active effects; text; logos; insignia; and watermarks.

This is a single exploratory concept, not a completed A/B choice set, transparent
combatant source, portrait identity approval, animation frame, or runtime asset.
Choice B must independently test the shorter field-coat/readability direction before
selection. Any later runtime derivative requires transparent extraction or clean
reauthoring, equalized scale, anchor and safe-bound validation, full state coverage,
sockets, metadata, manifest registration, and canonical Godot capture review.
## Original 2026-08-22 A/B choice library (historical base)

### Background choice pairs

All review exports below are opaque, exact 1920 x 1080 PNGs. The 1672 x 941
generation masters are retained losslessly under `art/choices/backgrounds/masters/`.

| Encounter | Choice A review export | Choice B review export | Status |
|---|---|---|---|
| `enc_empire_skirmish` | `art/choices/backgrounds/enc_empire_skirmish-choice-a.png` | `art/choices/backgrounds/enc_empire_skirmish-choice-b.png` | Proposed A/B pair |
| `enc_empire_patrol` | `art/choices/backgrounds/enc_empire_patrol-choice-a.png` | `art/choices/backgrounds/enc_empire_patrol-choice-b.png` | Proposed A/B pair |
| `enc_shub_skirmish` | `art/choices/backgrounds/enc_shub_skirmish-choice-a.png` | `art/choices/backgrounds/enc_shub_skirmish-choice-b.png` | Rejected: superseded by red/rust v2 pair |
| `enc_shub_swarm` | `art/choices/backgrounds/enc_shub_swarm-choice-a.png` | `art/choices/backgrounds/enc_shub_swarm-choice-b.png` | Rejected: superseded by red/rust v2 pair |
| `enc_hadenman_vanguard` | `art/choices/backgrounds/enc_hadenman_vanguard-choice-a.png` | `art/choices/backgrounds/enc_hadenman_vanguard-choice-b.png` | Rejected: superseded by golden v2 pair |

Choice B direction summaries:

- Imperial skirmish: an asymmetric ruined gallery with a broken left arcade and
  cold star aperture opposed by a narrow amber shaft on the right.
- Imperial patrol: a severe angular inspection bay with repeated sealed blast
  doors, avoiding Choice A's monumental arches and open exterior aperture.
- Shub skirmish: suspended black ceramic processing slabs and a high cyan breach,
  using negative space and an oblique beam instead of a central energy well.
- Shub swarm: a low radial coordination chamber organized around nested machine
  rings, rather than Choice A's vertical cathedral-like processing architecture.
- Hadenman vanguard: a broad transverse war bay and center-right hull breach,
  opposing Choice A's receding corridor and upper-left breach.

All background choices keep the upper corners quiet for the HUD, preserve an open
lower-middle combat lane, inset critical structures for overscan, use one dominant
directional light, contain no figures or baked combat effects, and keep the painted
floor within the bottom 12%.

### Concept-art choice pairs

| Brief | Choice A | Choice B | Dimensions | Alpha | Status |
|---|---|---|---:|---:|---|
| Party role lineup | `art/choices/concepts/party-role-lineup-choice-a.png` | `art/choices/concepts/party-role-lineup-choice-b.png` | 1536 x 1024 | Yes | Proposed A/B pair |
| Imperial enemy family | `art/choices/concepts/imperial-enemy-family-choice-a.png` | `art/choices/concepts/imperial-enemy-family-choice-b.png` | 1536 x 1024 | Yes | Proposed A/B pair |
| Shub enemy family | `art/choices/concepts/shub-enemy-family-choice-a.png` | `art/choices/concepts/shub-enemy-family-choice-b.png` | 1672 x 941 | Yes | Rejected: superseded by red/rust machine v2 pair |
| Hadenman enemy duo | `art/choices/concepts/hadenman-enemy-duo-choice-a.png` | `art/choices/concepts/hadenman-enemy-duo-choice-b.png` | 1536 x 1024 | Yes | Rejected: superseded by golden v2 pair |
| Combat weapon identity | `art/choices/concepts/combat-weapon-identity-choice-a.png` | `art/choices/concepts/combat-weapon-identity-choice-b.png` | 1536 x 1024 | Yes | Proposed A/B pair |

Choice B direction summaries:

- Party roles: lighter salvage/voidwear construction with cloth wraps and narrower
  equipment profiles, while retaining the same four anonymous functional roles.
- Imperial family: ivory-black segmented court armor and a squat trihedral
  Psi-Blocker Pylon, opposing Choice A's black-and-bronze monolithic language.
- Shub family: three near-identical black-and-white origami-diamond drones plus a
  larger related Stalker, with violet reduced to secondary detail.
- Hadenman duo: fortress-machine bodies made from near-black architectural slabs
  and recessed crimson plates; the Decimator is extremely broad and asymmetric,
  while the Enforcer is tall and long-striding.
- Weapon identity: straight-backed and geometric relic-tech silhouettes, including
  one broad-muzzle scatter gun and a disruptor dominated by a perpendicular ring
  capacitor, rather than ornamental or rotary constructions.

These remain concept sheets, not animation-ready sprite sheets. They do not define
ground anchors, battle scale, animation states, frame timing, or final identity.

### Three-character range-band studies

The bounded anonymous range-band prototype has separate three-role party and
opponent A/B boards. Choice letters are independent between the two sides.

| Brief | Choice A | Choice B | Dimensions | Alpha | Status |
|---|---|---|---:|---:|---|
| Range-band party roles | `art/choices/range-band/party/range-band-party-selection-choice-a-v2.png` | `art/choices/range-band/party/range-band-party-selection-choice-b-v2.png` | 1536 x 1024 | Yes | Proposed A/B concept pair |
| Range-band opponents | `art/choices/range-band/opponents/range-band-opponent-selection-choice-a-v1.png` | `art/choices/range-band/opponents/range-band-opponent-selection-choice-b-v1.png` | 1536 x 1024 | Yes | Proposed A/B concept pair |

Two isolated Power Melee idle-keyframe studies now provide independent A/B visual
choices at a larger production-review scale:

| Study | Dimensions | Alpha | SHA-256 | Status |
|---|---:|---:|---|---|
| `art/choices/range-band/party/range-band-power-melee-choice-a-idle-study-v1.png` | 1240 x 1269 | Yes | `7FCB32092BD8505C7949E18FBF77CC898C1D6C41FCE47490DC3DD6F0ADD5E65A` | Unapproved single-frame study; touches left/bottom bounds |
| `art/choices/range-band/party/range-band-power-melee-choice-b-idle-study-v1.png` | 1024 x 1536 | Yes | `4CC068F71BAA58DE7518E5BF52095D54BB5A12EAEBFB77F58B80828D673D902B` | Unapproved single-frame study; 24 px bottom safety |

The built-in generator's first Choice A render and three early Choice B renders
baked checkerboards into RGB. They failed the alpha gate and were not copied into
the repository. A targeted Choice A extraction produced real RGBA. A later Choice B
was generated independently from a fresh text brief and also has genuine RGBA, with
exactly one connected subject at thresholds 16, 64, and 128. The pair supports
visual comparison but does not satisfy the motion/package gate or select either
choice. Full evidence and prompts are in
`docs/development/godot-power-melee-art-study-2026-08-23.md`.

### Gothic-industrial influence calibration

This pair tests how strongly a secondary gothic-industrial war-fantasy influence
can press on the established decaying-star-empire direction without importing
recognizable franchise identity. Both are battle-in-context keyframes, not runtime
backgrounds, and both are exact 1920 x 1080 review exports.

| Choice | Review export | Generation master | Direction | Status |
|---|---|---|---|---|
| A | `art/choices/style-calibration/imperial-battle-in-context-choice-a.png` | `art/choices/style-calibration/masters/imperial-battle-in-context-choice-a-master.png` | Restrained gothic decay: aristocratic verticality, ritualized machinery, tarnished brass, elegant oppression | Proposed |
| B | `art/choices/style-calibration/imperial-battle-in-context-choice-b.png` | `art/choices/style-calibration/masters/imperial-battle-in-context-choice-b-master.png` | Heavy reliquary industrial: transverse fortress mass, blast shutters, furnace infrastructure, militarized oppression | Proposed |

The transferable influences under review are monumental scale, decayed grandeur,
ritualized maintenance, material density, and human insignificance. Excluded are
recognizable franchise iconography, eagle motifs, purity seals, skull decoration,
oversized super-soldier proportions, signature weapons, faction copies, and gothic
text treatments. The party remains lean and role-readable; Imperial spaces may
carry the gothic weight, Hadenmen remain brutalist fortress-machines, and Shub
remain precise alien machine geometry.

## Original background proposal batch (Choice A sources)

The internally retained masters from the original generation pass are opaque
1672 x 941 PNG files. They are now aliased as Choice A; this historical section
preserves their source paths and prompt record. Exact 1920 x 1080 review exports
from that pass are under `art/proposals/backgrounds/runtime-previews/`.

| Encounter | Selected master | Exact review export | Status |
|---|---|---|---|
| `enc_empire_skirmish` | `art/proposals/backgrounds/empire-hall-backdrop-v2.png` | `art/proposals/backgrounds/runtime-previews/enc_empire_skirmish-background-proposal-v1.png` | Proposed |
| `enc_empire_patrol` | `art/proposals/backgrounds/empire-patrol-hall-backdrop-v1.png` | `art/proposals/backgrounds/runtime-previews/enc_empire_patrol-background-proposal-v1.png` | Proposed |
| `enc_shub_skirmish` | `art/proposals/backgrounds/shub-facility-backdrop-v2.png` | `art/proposals/backgrounds/runtime-previews/enc_shub_skirmish-background-proposal-v1.png` | Rejected: legacy blue/purple palette |
| `enc_shub_swarm` | `art/proposals/backgrounds/shub-swarm-backdrop-v2.png` | `art/proposals/backgrounds/runtime-previews/enc_shub_swarm-background-proposal-v1.png` | Rejected: legacy blue/purple palette |
| `enc_hadenman_vanguard` | `art/proposals/backgrounds/hadenman-derelict-backdrop-v2.png` | `art/proposals/backgrounds/runtime-previews/enc_hadenman_vanguard-background-proposal-v1.png` | Rejected: legacy red/black palette |

All selected plates are empty 16:9 battle backdrops with a quiet upper field,
readable lower-middle combat lane, one dominant directional light, parallax-safe
margins, and floor/deck content limited to the bottom 12%. They contain no figures,
creatures, UI, readable text, logos, particles, weapon effects, or baked contact
shadows.

The following first passes are retained as alternates but are not selected for
runtime evaluation because their painted floor rises above the project limit:

- `art/proposals/backgrounds/empire-hall-backdrop-v1.png`
- `art/proposals/backgrounds/shub-facility-backdrop-v1.png`
- `art/proposals/backgrounds/shub-swarm-backdrop-v1.png`
- `art/proposals/backgrounds/hadenman-derelict-backdrop-v1.png`

### Historical background prompt set

The Shub and Hadenman prompts below are retained only as a record of rejected
first-pass generation. Their palette instructions are not current direction; use the
corrected v2 candidates and the visual style bible instead.

Shared specification: polished painterly-realistic 2D science-fantasy JRPG
environment plate with shallow-focus diorama sensibility; exact 16:9 landscape;
straight-on wide battle view; upper 40% quiet; lower-middle combat lane readable;
critical structures inset from the outer 6%; floor/deck no more than bottom 12%;
dim scene with one dominant directional source; no figures, creatures, statues,
faces, text, symbols, UI, logos, watermarks, particles, weapon effects, contact
shadows, or foreground frame.

- Imperial skirmish: a decaying ceremonial hall of an aristocratic star empire,
  combining monumental court architecture and an aging interstellar fortress;
  vaulted columns, worn dark stone-composite, tarnished bronze and gold, distant
  cold-space aperture, and one amber-gold source from the upper right against cool
  blue-black shadow.
- Imperial patrol: a practical fortified inner patrol hall rather than a ceremonial
  chamber; reinforced vaulted arches, repeated dark-metal columns, sealed side
  passages and aging defensive bulkheads; space for three enemies plus a separately
  rendered field object; upper-right amber source and cool shadow. No freestanding
  pylon or machinery in the combat lane.
- Shub skirmish: an empty rogue-machine facility with blackened ribbed metal,
  recessed conduits, geometric apertures, worn processing structures and cold haze;
  one cyan-blue source rising from a low central fractured conduit, with only subtle
  violet reflections.
- Shub swarm: a denser and distinct rogue-machine outpost coordination chamber with
  repeating processing towers, modular wall cells, deep lateral recesses and broad
  clearance for four enemies; one low central cyan machine aperture and restrained
  violet side accents.
- Hadenman vanguard: an empty ruined Hadenman derelict warship chamber built at an
  oppressive scale; massive armored ribs, scorched bulkheads, severed conduits and
  warped blast doors; one hot orange-red source through an upper-left hull breach
  against deep charcoal shadow.

The four selected `v2` plates were produced by editing only the lower spatial
composition of their corresponding first pass: preserve architecture, camera,
palette and lighting; extend walls and structures downward; place the floor horizon
near 88% image height; add no new objects or light sources.

## Original concept-sheet batch (Choice A sources)

| Asset | Dimensions | Alpha | Status and intended use |
|---|---:|---:|---|
| `art/concepts/characters/party-role-silhouette-concept-v1.png` | 1536 x 1024 | Yes | Exploratory anonymous role/massing study |
| `art/concepts/factions/imperial-enemy-family-concept-v1.png` | 1536 x 1024 | Yes | Exploratory Legionnaire, House Guard, and Psi-Blocker language |
| `art/concepts/factions/shub-enemy-family-concept-v1.png` | 1672 x 941 | Yes | Rejected provenance: legacy blue/purple Drone and Stalker language |
| `art/concepts/factions/hadenman-enemy-duo-concept-v1.png` | 1536 x 1024 | Yes | Rejected provenance: legacy red/black Decimator/Enforcer palette |
| `art/concepts/equipment/combat-weapon-identity-board-v1.png` | 1536 x 1024 | Yes | Exploratory weapon silhouette and audio-identity reference |

These are concept sheets, not sprite sheets. They do not define animation states,
frame timing, foot anchors, final scale, or approved character identity.

### Historical concept prompt set

The Shub and Hadenman prompts below are retained only as rejected first-pass
provenance. Their cyan/violet and crimson instructions are superseded by red/rust
Shub and golden Hadenmen.

Shared specification: polished painterly-realistic science-fantasy JRPG concept
art; production-minded materials and silhouettes readable at small battle scale;
genuinely transparent background; complete isolated subjects with safe padding; no
scenery, floor, contact shadows, text, labels, insignia, logos, watermark, UI,
particles, active effects, or cropped edges.

- Party roles: exactly four anonymous helmeted figures facing screen-left: an
  athletic Captain/Striker with vibro-blade, slung particle carbine and inactive
  boost hardware; a lighter Sole Esper with a modest vibro-blade and violet neural
  details but no active psychic effect; a lean Mercenary Striker with twin
  vibro-daggers and slung carbine; and a broad Heavy Tech Marine bracing a distinctive
  wide-muzzle scatter gun. Shared worn-charcoal base with cyan, violet, amber and
  green-cyan role accents.
- Imperial family: exactly two human combatants and one stationary pylon facing
  screen-right: practical medium-armored Legionnaire with carbine and sheathed
  vibro-blade; broader House Guard with heavier layered armor and the same weapon
  family; waist-to-chest-height unmanned Psi-Blocker Pylon with no weapons. Worn
  blackened steel, slate cloth, bronze and muted amber-gold accents.
- Shub family: exactly four machines facing screen-right: three nearly identical
  compact hovering diamond-hull drones with central cyan apertures and twin particle
  needle housings, distinguished only by tiny mirrored violet details; one larger
  swept-wing mantis-like Stalker with tri-optic cluster and plasma pod housings. No
  firing or exhaust effects.
- Hadenman duo: exactly two enclosed augmented post-humans facing screen-right: an
  immense broad Decimator with sloped juggernaut armor, reactor sponson, particle
  carbine and heavy sheathed vibro-blade; a slightly narrower, more mobile Enforcer
  with the same weapon family. Blackened steel, scarred crimson plate and hot red
  optics; no visible faces or gore.
- Weapon board: exactly six isolated design slots in two rows: military vibro-blade;
  one paired set of twin vibro-daggers; compact particle carbine; heavy wide-muzzle
  kinetic scatter gun; ceramic-shrouded plasma projector; compact disruptor emitter
  with ring capacitor. Distinct silhouettes and restrained functional accent cores,
  with no beams, muzzle flashes, hands or ammunition.

## Review sheets

- `art/review/background-proposals-contact-sheet-v1.png`
- `art/review/concept-sheets-contact-sheet-v1.png`
- `art/review/background-choice-pairs-v1.png`
- `art/review/concept-choice-pairs-v1.png`
- `art/review/imperial-influence-calibration-pair-v1.png`

The checkerboard in the concept review sheets is review-only and confirms the
source PNGs carry transparency. It is not present in the concept assets themselves.

## Integration notes

Godot 4 is the target presentation client. The review inventory in
`art/GODOT-ART-CANDIDATE-CATALOG-v1.json` is deliberately not a runtime manifest and
must never be loaded as one. Every current file remains proposed and unselected.
After the developer chooses a branch, follow
`docs/development/godot-art-transition-readiness-2026-08-23.md`: keep the source,
produce clean derivatives or slices, author anchors/scale/states/sockets and strict
metadata, validate every referenced path, then register only files that already
exist and verify them in the canonical Godot compositor.

Combatant and multi-subject sheets are not animation packages. The current Canvas
client remains the parity/rollback reference and still requires its own loader,
manifest, overscan, browser-console, and subjective visual checks if a selected
asset is also wired there. No generated asset in this register has crossed either
integration gate.
