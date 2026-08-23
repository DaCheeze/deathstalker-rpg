# Godot Art Transition Readiness

Date: 2026-08-23

Status: **candidate inventory prepared; every direction remains proposed,
unselected, unintegrated, and absent from the runtime manifest.** There has been
no subjective developer approval and no claim that a concept board is a
production-ready asset.

The machine-readable inventory is
`art/GODOT-ART-CANDIDATE-CATALOG-v1.json`. It points only to existing current
finals and their review sheets, records exact source dimensions and alpha modes,
and keeps rejected palette and wardrobe directions as explicit provenance. The
catalog is a review and production-planning artifact. It is **not** the startup
asset manifest and Godot must not load it as one.

## Authority and current boundary

The staged migration remains governed by
`docs/development/godot-transition-plan.md` and the nine-layer presentation
contract in `docs/design/presentation.md`. The isolated compositor harness proves
architecture only; canonical authored art integration is still a Phase 2 gate.
The deterministic TypeScript core and versioned presentation bridge remain
authoritative for resolved combat state and events.

The proposed combatant package format is documented in
`docs/design/godot-combatant-raster-asset-contract-v1.md`, with the companion
schema at
`docs/design/schemas/godot-combatant-raster-package-v1.schema.json` and the
repository validator at
`scripts/validate-godot-combatant-raster-package.mjs`. The current npm command
`npm run godot:assets:validate` runs the validator's deterministic self-test. A
green self-test verifies the validator, not any concept sheet, real combatant
package, manifest registration, motion quality, or developer preference.

## Readiness classes in the catalog

- `reference_only` means the image communicates direction but must never be
  treated as a runtime texture. It must be re-authored into the appropriate
  production asset or translated into procedural VFX/UI behavior after approval.
- `needs_slicing` means the source is a transparent multi-component board. A
  selected branch needs measured derivatives, pivots or patch margins, and
  purpose-specific metadata before import. Existing slice plans are linked in the
  catalog where available.
- `needs_animation_package` means the source is combatant look-development, not an
  atlas. A selected branch must become a complete transparent animation package
  under the raster contract before it can enter a manifest.
- `candidate_after_approval` means the whole-frame image is structurally closest
  to import, but developer selection, derivative naming, import settings,
  manifest registration, canonical scene placement, capture review, and runtime
  QA still remain.

These labels express the next production operation; they do not rank A, B, C, or
D and do not imply approval.

## Selection-to-runtime sequence

### 1. Record the developer selection

Review each creative family independently. Record the exact candidate ID, choice
letter, review sheet, and developer decision. A background choice does not select
its stage floor, foreground occluder, combatant direction, motion pipeline,
portrait language, or UI chrome. Preserve rejected choices as provenance instead
of deleting or silently replacing them.

Before derivative work begins, confirm that the selected branch still satisfies
the durable palette and identity anchors:

- Hazel has red hair and Owen is blonde;
- party wardrobes may be colorful and individually expressive rather than
  uniformly dark;
- Hadenmen are golden;
- Shub uses red, rust, and iron-black, with no blue or purple faction palette;
- aristocrats often use dark clothing, but this is not a universal party palette.

### 2. Produce clean derivatives or slices

Keep the selected source unchanged. Create lowercase production derivatives in
the appropriate `art/runtime/` family only after approval.

- Background, stage-floor, and foreground branches retain the 1920 x 1080
  alignment relationship. Preserve transparent regions in floor and foreground
  layers, verify parallax-safe margins, and do not bake combatants, UI, contact
  shadows, bloom, particles, or active effects into them.
- Dialogue UI and menu chrome use the linked measured slice plans as starting
  data. Extract `AtlasTexture` regions only from the selected branch. Verify
  `NinePatchRect` margins at minimum, target, and maximum UI sizes, keep text and
  state colors runtime-owned, and keep all UI outside world post-processing.
- Prop sheets use their linked component bounds and keep transparent padding.
  Placement pivots are authored per scene role; a visual console or fragment does
  not become interactable merely because it is sliced.
- Portrait and queue-token sheets need deliberate crops, consistent face scale,
  safe expression framing, masks, and compact-size readability checks. The source
  boards themselves do not enter the UI atlas.
- Psi-blocker state boards need one selected visual branch, individual state
  textures, a stable ground anchor and footprint, explicit state identifiers, and
  fail-loud metadata for the destructible speed-zero field object. Do not collapse
  it into an encounter flag or force it into the combatant package schema without
  an approved field-object contract.
- Combat-feedback boards remain procedural references. Rebuild their approved
  timing, silhouette, color, emissive, grade, and bloom language in Godot rather
  than cropping effects from the boards.

Any RGB or baked-checker costume first render is invalid. It is not a choice and
must not be promoted. Only the numerically verified RGBA costume finals listed in
the catalog are eligible for visual review, and even those remain reference-only
until an approved portrait or combatant derivative is authored.

### 3. Author anchors, scale, states, and metadata

For a combatant direction, create a real package beneath
`art/runtime/combatants/` only when its atlas exists. Follow the v1 package
contract exactly:

- non-interlaced RGBA8 PNG with straight alpha;
- fixed 512 x 512 cells, safe bounds, and transparent padding;
- one explicit frame-local ground anchor with no metadata drift and no more than
  one source pixel of observed stationary-foot drift;
- shared battle-scale metadata and 1920 x 1080 reference viewport;
- every required animation clip, duration, loop/hold policy, and semantic event;
- stable weapon, muzzle, hand, core, head, and hit-center sockets;
- optional emissive and normal masks only when they exist and have been reviewed;
- no baked floor, contact shadow, lighting grade, bloom, beam, particle, or UI.

The developer must select the concept direction and motion pipeline separately.
The first three-role range-band set also needs an agreed visible height at 1080p
and confirmation or revision of the initial `(256, 472)` anchor before the shared
values are frozen.

For non-combatant runtime art, create equally explicit metadata for source path,
dimensions, alpha treatment, pivot or patch margins, intended scene/layer,
selection record, and provenance. Do not invent a future path in metadata.

### 4. Register and import only existing approved derivatives

Every referenced file must exist before registration. Add only selected,
production-cleaned derivatives to the startup-validated asset manifest. Missing
assets, metadata, frames, states, or manifest keys must abort loading rather than
fall back to a block, empty texture, concept board, or placeholder path.

For combatants, run the package validator against each real package and use
`--require-prototype-set` for a complete same-side three-role study. Only an
`integrated` package with approved concept and motion decisions may be registered,
as required by the package contract.

Godot import settings must preserve the authored data:

- no auto-trimming or hidden negative-scale mirroring;
- no alpha premultiplication that changes straight-alpha edges;
- sRGB interpretation for base color and emissive color;
- linear/vector interpretation for declared normal data;
- lossless or explicitly reviewed compression appropriate to the target;
- no filter, mipmap, or repeat policy accepted without review at actual battle or
  UI scale.

Imported `.godot` resources are consumers, not the durable source of truth.

### 5. Place assets in the canonical compositor

Integrate selected derivatives into `godot/`, not the historical experiment. Keep
the exact semantic order:

1. starfield void;
2. far backdrop;
3. stage floor;
4. enemy units and enemy-side world objects;
5. party units;
6. emissive pass;
7. cached foreground occluders;
8. half-resolution bloom, grade, and vignette;
9. UI and menus outside post-processing.

Background layers are cached and only rebuilt when needed. Never blur a
full-resolution layer per frame. Combatants and field objects consume resolved
bridge snapshots/events; Godot does not decide legal actions, damage, queue order,
targeting, cooldowns, persistence, or outcomes.

### 6. Run structural, visual, and runtime QA

Structural checks are necessary but not sufficient:

- parse every new metadata or manifest document;
- verify every referenced path is repository-relative, exists, and resolves inside
  the repository;
- run `npm run godot:assets:validate` and validate each real package directly;
- regenerate an affected bridge fixture only when the bridge schema or fixture
  content actually changes;
- run `--check-only` on changed GDScripts and the relevant headless validator and
  scene smoke;
- keep build, zero-warning lint, and tests green for integrated code changes.

Human review remains mandatory:

- inspect alpha edges on dark and light mattes at full source size;
- compare silhouettes, face crops, icon recognition, and material separation at
  1280 x 720 and 1920 x 1080;
- confirm battle scale, ground anchors, stationary feet, sockets, and transparent
  safe bounds;
- review every animation state in motion and align contact, muzzle, beam, and defeat
  markers to the bridge timeline;
- compare A/B captures using the same fixture, camera, lighting, UI, background,
  VFX, and timing;
- inspect resize, pause/replay, target selection, queue/status readability, and
  representative state combinations;
- test the Godot Compatibility/Web build with zero missing-resource and browser
  console errors before calling an asset integrated.

Automated success must not be described as subjective visual approval.

## What is ready now

- Current proposed full-frame backgrounds, stage floors, and foreground
  occluders are inventoried for selection, including the late Mistworld A/B
  battle-background pair.
- Current combatant, field-object, portrait/token, UI/icon, menu-chrome, prop,
  combat-feedback, and colorful Hazel/Owen look-development branches are
  inventoried with their next required production operation.
- Highest current revisions are used. The old blue/purple Shub, red/black
  Hadenman, and dull Hazel/Owen directions are explicitly superseded provenance,
  not live options.
- Existing prop and UI slice plans are linked rather than duplicated.
- Source dimensions and alpha modes were checked numerically; opaque RGB plates
  are distinguished from transparent straight-RGBA boards.
- The current Power, Critical, and Queue Control Melee A/B idle studies are
  inventoried at a consistent 1024 x 1536 RGBA source size with dedicated review
  sheets. Their visible alpha bounds were remeasured; all six retain 180 pixels of
  bottom padding. They are cleaner concept inputs than the earlier Power v1 pair,
  but remain single poses rather than atlases or contract-ready packages.

## What is not ready or approved

- No candidate or choice has been selected by the developer.
- No candidate has subjective visual approval.
- No combatant concept has an approved motion pipeline or complete animation
  package.
- The three current range-band role pairs still lack a developer-selected concept
  branch, approved shared battle scale and ground anchor, sockets, full clip/state
  coverage, timing, 512 x 512 atlas cells, package metadata, and motion review.
- No ground anchor, battle scale, effect socket set, or real-package metadata has
  been approved for any current concept board.
- No listed art has been registered in a startup asset manifest.
- No listed art has been imported into or placed in the canonical Godot runtime.
- No canonical scene capture, animation review, Web import check, or runtime art QA
  has been completed for these candidates.
- Validator self-test success does not change any of the statements above.

The next art transition action is therefore developer selection, not manifest or
runtime integration.
