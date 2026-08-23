# Godot Combatant Raster Asset Contract v1

Status: **contract proposed and implementation-ready; repository validator
implemented with a measured 21/21 deterministic self-test; developer technical
approval and every art decision remain pending**. No visual direction or asset is
selected by this document.

This contract turns a future transparent combatant study into portable source data
that Godot can consume without embedding presentation decisions in a scene. It is
bounded to the anonymous three-character range-band prototype and supports exactly
these functional role identifiers:

- `power-melee`
- `critical-melee`
- `queue-control-melee`

Those identifiers are not character names, vocations, lore, or final identities.
Party and mirrored opponent studies use the same three roles with different
`deploymentSide` and `facing` values. No A/B concept, motion pipeline, background,
weapon appearance, costume, or palette winner is selected here.

The machine-readable companion is
`docs/design/schemas/godot-combatant-raster-package-v1.schema.json`. The repository
validator is `scripts/validate-godot-combatant-raster-package.mjs`. The validator
loads that schema before applying the cross-field, cross-package, filesystem,
manifest, and decoded-PNG rules that JSON Schema cannot express.

The engine-neutral presentation and compositor requirements remain authoritative in
`docs/design/presentation.md`, and migration/cutover gates remain authoritative in
`docs/development/godot-transition-plan.md`. This package contract narrows those
requirements for portable combatant rasters; it does not supersede either document.

## Package boundary

One metadata document describes one combatant, one deployment side, and one RGBA
atlas. A multi-subject concept board can appear only in provenance; it cannot be the
atlas. Runtime derivatives remain engine-neutral PNG plus JSON. Godot scenes,
`SpriteFrames`, `AnimationLibrary` resources, imported textures, materials, and
`Marker2D` nodes are generated consumers, not the durable source of truth.

The v1 package records:

- source and provenance references;
- neutral A/B approval state;
- atlas dimensions, cell layout, alpha treatment, and optional material masks;
- a per-frame ground anchor, safe bounds, and effect sockets;
- named clips, per-frame duration, looping policy, and semantic events;
- one shared battle-scale group for the three-role study;
- startup-manifest registration state.

No package may contain damage, targeting, queue, cooldown, range-band, or outcome
rules. Godot presents actions resolved by the TypeScript bridge.

## Files and paths

- Runtime atlases and masks are lowercase PNGs beneath
  `art/runtime/combatants/`.
- Package metadata lives beside its atlas and uses `.json`.
- A v1 package ID is
  `range-band-{party|opponent}-{role}-choice-{a|b}-v{revision}`, where `role` is
  one of the three identifiers at the top of this contract and revision is a
  positive integer.
- The metadata, atlas, emissive mask, and normal mask names are respectively
  `{packageId}-package.json`, `{packageId}-atlas.png`,
  `{packageId}-emissive.png`, and `{packageId}-normal.png`. Metadata and every
  declared image are in the same directory.
- The choice letter identifies the concept candidate embodied by that package; it
  is neutral provenance, not approval or rank. Do not create a runtime package
  before an actual candidate atlas exists.
- The package points to its existing entry in
  `art/GENERATED-ASSET-REGISTER.md` and existing source artifacts. A path never
  anticipates a future file.
- Repository-relative paths use `/`, contain no drive prefix or `..`, and must
  resolve inside the repository root.

The current concept boards remain unapproved visual references. They must not be
registered as atlases or extracted into runtime sprites without a developer
selection and a production cleanup pass.

## Atlas and transparency

V1 uses a fixed `512 x 512` RGBA8 cell. An atlas is a complete rectangular grid of
those cells, no larger than `4096 x 4096`; unused cells remain transparent. This is
the current production-tile target from the visual style bible. A need for a
different cell size is a v2 contract decision, not an undocumented exception.

- Use non-interlaced PNG, 8 bits per channel, true RGBA (`color type 6`), sRGB,
  and straight alpha.
- Every declared frame has at least one visible and one transparent pixel.
- Every visible pixel remains at least 32 source pixels from the top, left, and
  right edges and at least 40 source pixels from the bottom edge. In half-open
  frame-local coordinates, `safeBounds.x >= 32`, `safeBounds.y >= 32`,
  `safeBounds.x + safeBounds.width <= 480`, and
  `safeBounds.y + safeBounds.height <= 472`.
- A declared `safeBounds` rectangle contains every nontransparent pixel. It is a
  validation envelope, not a crop instruction; the full 512 x 512 trim box is
  preserved.
- Each frame uses the same cell size and the same explicit ground anchor. The
  validator rejects anchor drift. The initial production target is `(256, 472)`;
  the first staged study may revise it, but the chosen value is then fixed for every
  frame in that package.
- Stationary-foot drift inside the painted silhouette is still a visual QA check:
  constant metadata cannot prove that the artist painted the foot in the same
  place. Captures must show no more than one pixel of source-space drift.
- Contact shadows, floor, environment grade, bloom, beams, impact flashes,
  particles, UI, and cast shadows are not baked into the atlas.

Optional emissive and normal masks are separate non-interlaced RGBA8 PNGs with
exactly the same dimensions as the base atlas. Mask alpha may not extend beyond
base-atlas alpha. A declared mask must already exist. `null` means the material
feature is intentionally absent for this package, not missing. Godot imports an
emissive mask as sRGB color and a normal mask as linear vector data; the source-path
slot, rather than filename guessing, decides that interpretation.

## Facing, anchors, bounds, and battle scale

The facing convention is explicit and validator-enforced:

| Deployment side | Authored facing |
|---|---|
| `party` | `left` |
| `opponent` | `right` |

An approved action may turn a node at runtime, but a package does not silently
violate its authored side. If mirrored runtime reuse is later approved, record it
as a contract revision rather than hiding a negative X scale inside a scene.

All prototype packages use the scale group
`range-band-prototype-human-v1`. Metadata records:

- the `1920 x 1080` reference viewport;
- the desired visible height at 1080p;
- the atlas-to-screen display scale.

The validator calculates the tallest visible frame and confirms that
`visible source height x displayScale` equals the recorded target within one pixel.
When the validator receives a complete `--require-prototype-set`, the Power,
Critical, and Queue Control packages must share the scale group, viewport, target
visible height, deployment side, ground anchor, concept choice, and motion
pipeline. The developer still chooses that first target height and confirms or
revises the initial `(256, 472)` anchor during the staged visual review; the
contract prevents accidental cross-role scale or anchor drift afterward.

The ground anchor is in frame-local source pixels. Godot positions each atlas region
so that this point lands on the combatant's world ground point. `safeBounds` is also
frame-local and half-open. The validator confirms visible alpha remains inside it,
the anchor lies horizontally inside it, and `groundAnchor.y` equals the exclusive
bottom edge `safeBounds.y + safeBounds.height`. All frames in one package use the
same anchor.

## Required clips and timing

Every v1 study supplies exactly one named clip for each minimum state below. Extra
runtime states require a later schema version so clients cannot silently disagree.

| Clip | Loop | Held final frame | Required semantic event |
|---|---:|---:|---|
| `ranged_idle` | yes | no | none |
| `closing_idle` | yes | no | none |
| `advance` | yes | no | none; `footfall` permitted |
| `engage` | no | no | none |
| `engaged_idle` | yes | no | none |
| `melee_anticipation` | no | no | none |
| `melee_contact` | no | no | exactly one `contact` |
| `melee_recovery` | no | no | none |
| `signature` | no | no | exactly one `contact` |
| `disruptor_draw_aim` | no | no | none |
| `disruptor_fire` | no | no | exactly one `muzzle` and one `beam_start` |
| `disruptor_recovery` | no | no | none |
| `hit` | no | no | none |
| `defeat` | no | yes | exactly one `defeat` |

Each clip contains one or more frame references. Each entry declares a nominal
duration from 16 to 2000 milliseconds. An event declares its millisecond offset
inside that frame. Frame timings define authored motion weighting; the presentation
bridge remains authoritative for action duration and semantic contact. A Godot
consumer retimes or samples the clip so its named marker coincides with the bridge
marker instead of moving gameplay contact to match the artwork.

`advance` is deliberately a looping locomotion cycle. The same reusable travel
cycle can cover Ranged to Closing or Closing to Engaged while the bridge determines
the resolved travel duration; the separate non-looping `engage` clip owns arrival
and target commitment. This avoids freezing on an advance's last pose when a
presentation duration is longer than one gait cycle. An animation direction that
needs a one-shot full advance must revise this v1 timing policy rather than silently
changing the consumer.

## Effect and material sockets

Every frame records stable, frame-local positions for:

- `weapon_tip`
- `muzzle`
- `hand`
- `core`
- `head`
- `hit_center`

`weapon_tip_secondary` and `hand_secondary` are optional for a two-weapon study;
`shield_center` is reserved for the wider game and is not required by this bounded
prototype. A socket remains declared even when its part is occluded so VFX do not
jump to a fallback origin. All socket points must remain within the frame.

The package may declare the low-frequency material families it actually uses:
`matte-cloth`, `worn-metal`, `ceramic-housing`, and `emissive-core`. These are
response tags, not a direction selection. A package that declares an emissive core
must supply an emissive mask. Normal response remains optional.

Godot derives `Marker2D` children from sockets. The compositor owns trails, muzzle
flashes, beams, impacts, hit particles, bloom, and contact shadows. Material masks
feed runtime materials; they never contain those effects.

## Approval and manifest gate

Concept direction and motion pipeline are independent decisions:

- concept choice: neutral `A` or `B`;
- motion choice: `full-frame-raster` or `deliberate-hybrid`.

Each decision always identifies the candidate embodied by the files and separately
records `unapproved`, `approved`, or `rejected`; `A` is never treated as better
than `B`. Here `unapproved` means pending developer review, not unknown
provenance. The package asset state is `proposed`, `asset-approved`, `integrated`,
or `rejected`.

Rules enforced by the validator:

1. The concept choice matches the package ID's neutral `choice-a` or `choice-b`
   segment, and both choice fields are present even while pending review.
2. Any approved or rejected decision, and any approved, integrated, or rejected
   asset state, requires an existing developer-review record.
3. `asset-approved` and `integrated` require both decisions to be approved.
4. A rejected decision forces the package asset state to `rejected`.
5. Only `integrated` may be `registered`; every other asset state must be
   `not-registered` with null manifest fields.
6. A registered package names an existing JSON startup manifest and key. The
   manifest must use the following plain-data envelope and map that key to the
   metadata file being validated:

```json
{
  "format": "deathstalker-combatant-asset-manifest",
  "schemaVersion": 1,
  "combatants": {
    "<existing-manifest-key>": "<existing-package-metadata-path>"
  }
}
```

The example path is structural only; it is not a repository asset reference. The
canonical Godot startup path must abort before scene instantiation if the manifest,
metadata, atlas, mask, frame, animation, event, or socket validation fails. It must
not substitute a block, empty texture, or concept board for a missing registered
combatant.

The current repository has no approved combatant raster package under this
contract. Therefore no package from the present A/B boards is registered and no
missing future path is added to a runtime manifest.

For machine-checkable provenance, the asset register entry for a future package
contains the exact marker
`<!-- asset-register-id: {assetRegisterEntryId} -->`. In v1 that ID equals
`packageId`. The validator also requires every source path, review record, atlas,
mask, manifest, and manifest-mapped metadata path to exist as a regular file inside
the repository.

## Godot consumption contract

A Godot adapter for an approved package performs this order:

1. Load the startup manifest and reject an unknown format or schema version.
2. Load the package JSON and validate it and every referenced PNG before creating a
   combatant node.
3. Import the atlas without auto-trimming, premultiplication, or baked effects.
4. Create atlas regions from declared frame rectangles; place the sprite at the
   negative ground-anchor offset.
5. Create socket markers from the active frame and apply the package's recorded
   display scale.
6. Build animation tracks from named clips and nominal frame durations.
7. Align `contact`, `muzzle`, `beam_start`, and `defeat` markers to the resolved
   presentation-bridge timeline.
8. Attach procedural VFX and materials through declared sockets and masks.

The adapter may cache validated resources. It may not resolve an action, infer a
target, alter HP, choose queue order, or invent a missing frame.

## Validation commands

Validate one or more future packages from the repository root:

```powershell
node scripts/validate-godot-combatant-raster-package.mjs <package.json>
```

Validate a complete same-side three-role study and cross-package scale consistency:

```powershell
node scripts/validate-godot-combatant-raster-package.mjs --require-prototype-set <power.json> <critical.json> <queue.json>
```

Run deterministic positive and negative harness checks without leaving assets in
the repository:

```powershell
npm run godot:assets:validate
```

The npm command invokes
`node scripts/validate-godot-combatant-raster-package.mjs --self-test`.

The validator exits nonzero and prints every discovered error. Passing structural
validation does not approve silhouette, animation feel, alpha-edge quality,
material read, or either A/B direction.

The self-test creates and removes a uniquely named temporary repository. Its
positive cases cover a proposed package, an integrated/registered package, and a
complete same-side three-role set. Its negative cases cover approval gating,
manifest mapping, missing files, malformed PNG encoding, alpha outside safe bounds,
timing/events, and cross-package scale drift.

The current measured result is 21/21 deterministic checks passing. That result
confirms the validator implementation; it is not developer technical acceptance,
proof of a real package, canonical Godot startup-adapter integration, or art
approval.

## Human review still required

- Review alpha edges on dark and light mattes at full source size.
- Compare silhouette, weapon count, role readability, and material separation at
  1280 x 720 and 1920 x 1080.
- Confirm stationary feet do not visibly drift and the ground anchor does not slide.
- Check every clip in motion, including anticipation, contact, recovery, hit, and
  defeat; a static frame or headless pass is insufficient.
- Run the same deterministic replay, camera, UI, background, light, and VFX for A/B
  motion comparisons.
- Record concept, motion, and background decisions separately. A combatant-package
  approval does not select the environment.
- Verify the Godot Compatibility/Web build loads loudly with no missing-resource or
  browser-console errors before marking an asset integrated.

## Remaining developer decisions

The contract deliberately leaves these open:

1. developer technical acceptance or revision of this proposed v1 contract;
2. party concept direction A or B for the first anonymous study;
3. full-frame raster or deliberate-hybrid motion direction;
4. the shared visible height at 1080p and whether the first capture confirms the
   initial `(256, 472)` anchor;
5. whether opponent studies receive independently authored art or a later approved
   mirroring policy;
6. which optional normal and emissive masks survive the material review;
7. the separate Empire background A/B decision.
