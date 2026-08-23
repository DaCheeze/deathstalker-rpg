# Visual Style Bible

Status: **direction approved; individual asset selection remains open**
Updated: 2026-08-23

## Purpose and authority

This document is the operational visual authority for the game's art. It defines
how the approved creative direction should look, how visual choices are compared,
and what a production-ready asset must prove.

- `creative-direction.md` owns setting, reference, terminology, and narrative scope.
- This bible owns visual thesis, shape, material, palette, camera, faction, UI,
  portrait, VFX, asset-lifecycle, and visual-QA rules.
- `presentation.md` owns Godot composition, runtime layering, effects, and
  performance constraints.
- `art/GENERATED-ASSET-REGISTER.md` owns file provenance, dimensions, prompt
  summaries, and approval status.

The developer is the creative director and final subjective authority. Approval of
a visual system does not approve every image produced under that system.

Godot 4 is the sole presentation client. The browser Canvas client is frozen
historical source, not a fallback, comparator, parity target, or acceptance
reference. Asset sources and metadata stay engine-neutral, and the deterministic
TypeScript core remains authoritative through the versioned presentation bridge.

Do not invent character names, place names, insignia, dialogue, lore, or plot while
making art. Anonymous functional studies remain anonymous until the developer
provides or approves identity.

## Visual north star

> A decaying star empire rendered as a shallow-focus tactical diorama: sharp,
> human-scale combatants against immense, dim, material-heavy spaces; cool shadow
> cut by restrained warm emissives; operatic grandeur without losing JRPG clarity.

### Pillars

1. **Operatic decay** — wealth, engineering, and ceremony have survived longer
   than the knowledge and institutions that created them.
2. **Human insignificance** — architecture and machines dwarf people without making
   combatants unreadably small.
3. **Silhouette-first tactics** — role, side, weapon, state, and threat remain clear
   before surface detail or color is considered.
4. **Ritualized technology** — age and half-understood maintenance are expressed
   through construction, repetition, access systems, wear, and material hierarchy.
5. **Controlled contrast** — predominantly dark neutral frames use a few deliberate
   emissive and accent colors instead of uniform neon saturation.
6. **Weighty semantic feedback** — animation, contact timing, recoil, hit-stop,
   sound, light, and particles agree on the same gameplay event.

## Influence translation and originality guardrails

The project may combine high-level qualities from its references, but it does not
reproduce their protected visual identities.

| Reference role | Transferable qualities | Do not reproduce |
|---|---|---|
| *Deathstalker* story/tone reference | Operatic far-future decay, swordplay beside advanced weapons, aristocratic menace, psychic power | Published costume designs, cover compositions, character likenesses, insignia, or final visual identities |
| *Octopath Traveler* game/presentation reference | Turn clarity, strong silhouettes, shallow diorama depth, selective bloom, readable tactical staging | Character designs, sprite likenesses, UI layouts, logos, or exact effects |
| Gothic-industrial war-fantasy secondary influence | Monumental scale, decayed grandeur, dense machinery, ritualized maintenance, human insignificance | Recognizable factions, armor, weapons, vehicles, compositions, iconography, or typography |

### Developer-provided cover-art calibration

The ten-cover review in `deathstalker-cover-art-visual-review.md` is secondary tonal
evidence, not a canonical model sheet. Edition art contradicts itself on faces,
hair, costume, armor, and equipment.

- Transfer sword-and-compact-sidearm silhouettes, human heroes against overwhelming
  scale, large saturated character blocks, practical belts/holsters/boots, and the
  tension between aristocratic tailoring and repaired field gear.
- The covers support broad slender-dueling and shallow-curved-saber study families,
  not canonical swords. Every project blade needs original guard, housing, grip,
  proportion, and motion construction.
- Acid gold, yellow-green, and hot amber may define selected danger environments,
  encounter families, or promotional key-art studies. They are not the universal
  scene grade.
- Never reproduce a published costume, likeness, weapon, armor/creature silhouette,
  pose, typography system, border, logo, or cover composition.

### Explicit exclusions from the secondary influence

- No eagle or double-headed-eagle motifs.
- No purity seals, parchment strips, skull systems, bone fields, crosses, copied
  heraldry, chapter markings, chaos-star constructions, or pseudo-Latin text.
- No oversized super-soldier anatomy, enormous round pauldrons, or buildings mounted
  on armor.
- No recognizable bolters, chainsaw weapons, canonical plasma weapons, vehicles, or
  faction silhouettes.
- No blackletter or franchise-like gothic interface typography.
- No prompt should request imitation of a living artist.

Use the influence as material, scale, age, construction, and lighting language—not
as a library of recognizable objects.

## Source-grounded visual translation

The detailed research index is
`docs/design/deathstalker-visual-source-index.md`. Public publisher samples and the
developer-provided five-text searchable corpus establish a broader material,
spatial, and costume range than a uniformly dark reading of the setting:
heated working uniforms and boot knives; cloaks, swords, disruptors, furs, and
steelmesh; battered rebel leathers with bright personal color; vivid silks,
fluorescent and metallic fashion treatments, velvet, polished boots, severe black
robes, and black-and-silver armor; and starship luxury that places fur, mahogany,
leather, and advanced hardware together.

Translate those descriptions into contrast between populations rather than copying
published cover art or treating any one outfit as a universal uniform. Principal
party members may be saturated and individually tailored. Many nobles remain dark
by developer direction, while a visible court-fashion minority is deliberately
extravagant. Military authority stays controlled and severe. Rim and rebel wear
combines hard use with vivid personal repair or styling.

The extended corpus also establishes four recurring spatial rules:

- a named world or institution receives its own construction, weather, and light
  logic instead of a universal dark-space-opera kit;
- Shub and Haden spaces behave as extensions of their makers' bodies and thought,
  not human rooms decorated with faction colors;
- Imperial power separates public spectacle from concealed coercive machinery;
  surface city, corporate tower, mutable Court, buried palace, factory, and prison
  are related branches rather than one interchangeable architecture set; and
- brightness is not safety. High-key pastoral, civic, or primary-color spaces may
  carry horror through unnatural regularity, absence, damage, and hostile function.

Novel descriptions inform materials, social contrast, and functional details. They
do not overrule developer-approved project anchors: Hazel has red hair and green
eyes, Owen is blonde, Hadenmen are golden, and Shub are red/rust/iron-black.
## Approval snapshot

### Direction-approved

- HD-2D-inspired shallow-focus diorama presentation.
- Raster, procedural, or deliberately hybrid combatant production, chosen by visual
  quality, readability, animation needs, and sustainable scope.
- Runtime particles, combat effects, bloom, grading, and contact shadows remain
  procedural.
- Every meaningful creative brief receives independently viable A/B choices.
- The game's decaying-Empire court and elite baseline uses **restrained gothic
  decay**, while surface, corporate, and mutable-Court branches retain their own
  source-grounded spatial identities.
- Imperial patrol, prison, foundry, and war spaces use **heavy
  reliquary-industrial construction**.
- Party equipment remains practical and human-scale, but party wardrobes use
  confident saturated color, distinctive cuts, and selective luxurious or salvaged
  materials rather than defaulting to charcoal tactical wear.
- Hadenmen remain **golden** brutalist fortress-machines with minimal gothic
  ornament.
- Shub remain precise alien machines in **red, rust, ember, and iron-black**, with
  no blue or purple faction palette.
- Named environment families remain visually distinct, and later Golden Age civic
  warmth is an era-specific contrast rather than part of the baseline Empire kit.
- Shub Ghost Warriors, Shub Furies, machine cities, and Haden integrated spaces are
  distinct branches of their faction language, not palette swaps of one humanoid
  unit or one corridor set.

### Still proposed or unresolved

- Every individual generated background, combatant, weapon, field object, overlay,
  portrait, and look-development board until explicitly selected.
- Final character identities, faces, costumes, and expression sheets.
- Final typography and repository-backed font.
- Exact runtime sprite pipeline: full-frame raster versus deliberate hybrid.
- Final background horizon alignment and true layered parallax packages.
- Final code-token reconciliation for the newly approved golden Hadenmen and
  red/rust Shub palettes.

## Global composition and camera

### Battle view

- Design and review at 1920 x 1080, 16:9.
- Enemies occupy the left and face screen-right.
- Party occupies the right and faces screen-left.
- Both sides share one scale family, deck, perspective, and ground plane.
- Keep the upper third to two-fifths quiet enough for the queue and party status.
- Preserve a readable lower-middle combat lane.
- Keep command-menu space immediately to the left of the acting party member clear.
- Avoid bright shafts, faces, or high-frequency detail behind persistent UI.

Historical background studies were authored around a legacy Canvas deck line of
`y = 850`. That is provenance, not a Godot acceptance target. Generated background
art still limits painted floor to the bottom 15%, with 12% preferred, but the
selected plate's horizon, perspective, stage floor, anchors, and canonical Godot
ground line must be locked together before integration.

### Environment plates

- Runtime-visible crop: at least 1920 x 1080.
- Preferred production working plate: 2304 x 1296 or larger 16:9, retaining real
  crop allowance around the 1920 x 1080 camera.
- Critical structures stay inside the central 88%; outer edges carry expendable
  overscan for shake and parallax.
- Painted floor occupies no more than the bottom 15%; 12% is the normal target.
- Use one dominant directional source. Secondary practical lights remain quiet.
- Backgrounds contain no figures, creatures, statues that read as people, UI,
  particles, weapon effects, text, logos, or baked contact shadows.
- Avoid evenly bright rooms and multi-neon “cyberpunk soup.”

### Layered environment package

A selected flattened plate is a composition reference, not the final parallax
package. Production environments separate:

1. far backdrop;
2. mid architecture;
3. sharp stage floor;
4. foreground occluders;
5. optional emissive and occlusion masks;
6. plain metadata for crop, horizon, vanishing point, light position/color, and
   parallax depth.

Foreground occluders frame depth without covering combatant heads, the acting-unit
menu, target bars, or semantic contact effects.

### Environment identity and transformation grammar

Environment briefs must name the world, era, social function, and current state.
The following source-grounded families are direction constraints; individual plates
and layer packages remain proposed until selected.

| Family | Construction and depth | Light, weather, and transformation rule |
|---|---|---|
| Mistworld / Mistport | Compressed, irregular quarters; ramshackle commerce beside older guild wealth; steelglass port tower, narrow streets, roofs, pipes, and practical fortification | Gray fog, snow, sleet, slush, pale daylight, oil lamps, and isolated electric warmth; visibility is a survival system |
| Golgotha surface | Pastel aerial towers, delicate bridges, glass-and-steel family or corporate fortresses, and family-specific silhouettes without invented heraldry | Crimson dawn, high-altitude traffic, polished public spectacle; keep it visibly separate from the palace below |
| Buried Imperial palace | Vast steel-and-brass bunker, coercive transit, monumental chambers, service machinery, and hidden weapons | Cold institutional base shell with narrow controlled warm light; refinement and threat occupy the same frame |
| Mutable Imperial Court | The palace shell stays fixed while a layered environmental skin can replace floor, air, horizon, weather, and hazards | Swamp, arctic, or another approved Court state must read as physically consequential theater, not a decorative hologram filter |
| Gehenna | Black cracked ground, breached fortress mass, hard-suit staging, and fractured interior apertures | Continent-scale scarlet/gold fire is the dominant source; retain black structure and tactical silhouettes instead of filling the frame with bloom |
| Technos III | Fractured metal plain, trenches, scrap hills, fortress-factory, and deep inhabited tunnel honeycomb | Abrupt extreme seasons alter overlays and foreground state; the underlying factory and combat lane remain spatially consistent |
| Virimonde | Open fields, stone boundaries, woods, rivers, old stone Standing, and human-scale farm settlements | Pastoral breadth is the baseline; Imperial mechanization is an invasive before/after state of sheds, smoke, straight-line machines, and erased landscape |
| Shannon's World / Summerland | Simplified primary-color structures, artificial play spaces, scenic flats, toy-scale settlements, river route, and finally primordial forest | Use unnaturally clean high-key color, silence, repetition, war damage, and abrupt twilight; never turn the whole sequence into generic dark horror |
| Shub | Nonhuman-scale metal world, folded/faceted machine volumes, suspended cable jungles, impossible depth, variable gravity, and specialized human-access envelopes | Iron-black/rust/ember project palette; scale and topology should feel computationally generated and indifferent to bodies |
| Haden / New Haden | Sharp machine architecture overwrites or absorbs human structures; integrated stations, suspended paths, towers, laboratories, and fortress-scale ships | Engineered gold over black recesses by project direction; pale-hot internal light, minimal shadow logic, low mechanical pulse, and city-as-organism behavior |
| Organic alien vessel | Corpse-white cable web, self-forming tunnels, egg-like chambers, membranes, and no recognizable human drive or weapons layout | Sickly neutral body light with restrained vein traces; this is a separate biomechanical family and must not be mistaken for Shub |
| Later Golden Age Logres | Warm wood Court, luminous mosaics, stained glass, organic steel/glass Parliament, bright towers, globes, pyramids, bridges, and hidden surviving undercity | Label by era. This optimistic civic language is useful for contrast, memory, or later content, but must not brighten the decaying-Empire baseline by accident |

When a location changes state, keep at least two stable visual anchors—silhouette,
vanishing structure, stage-floor geometry, or a major machine mass—so the player
reads transformation rather than an unrelated replacement background.

## Depth, focus, lighting, and value

- Sharp: combatants, ground contact, target state, and UI.
- Cached soft focus: far backdrop and foreground occluders.
- Sharp and static: stage floor.
- Normal frame target: roughly 70–80% neutral/dark material, 15–25% structural
  accent, and no more than 5–10% emissive color.
- A source-grounded high-key location may invert the normal value ratio, but must
  retain quiet UI zones, strong combatant separation, restrained bloom, and a clear
  reason for the brightness. High-key is a location state, never the global grade.
- Outside the documented high-key exception, backgrounds remain predominantly
  shadowed. Rim light separates units from the scene; it does not outline every
  edge equally.
- Bloom begins only from an emissive mask/pass and never erases weapon, HP, target,
  range-band, or ready/spent readability.
- Transparent combatants use neutral form lighting. Never bake environment grade,
  bloom, particles, cast shadows, or strong scene-colored light into base sprites.

## Palette system

Code and encounter data remain the implementation source of truth. These are the
starting visual tokens; art normally uses desaturated material relatives and
reserves the exact saturated values for UI, small emissives, and state cues.

| System | Current tokens | Use |
|---|---|---|
| Global | void `#080B12`, panel `#0F172A`, border `#1E293B`, pale text `#F1F5F9`, muted text `#64748B` | Blue-black field, slate structure, clean readable UI |
| Party | primary cyan `#38BDF8`, secondary blue `#0284C7` | Side identity and small equipment/rim accents |
| Party roles | cyan `#38BDF8`, violet `#C084FC`, amber-orange `#FB923C`, green-cyan `#4ADE80` | Role accents; never full-body recolors |
| Empire | amber `#F59E0B`, material brass `#AA8430`, cool shadow `#1A2040` | Restrained authority, aging metal, warm practical light |
| Shub art direction | iron-black `#100B09`, deep rust `#8C3B24`, oxide `#B4532A`, ember `#DC4C32`, dark crimson `#681B1B` | Rusted/fired machine construction with red optical and operational states; no blue or purple faction color |
| Hadenmen art direction | black recess `#0A0906`, deep gold `#8A641F`, engineered gold `#C8A951`, pale electrum `#E6D28A`, hot core `#F5E6B0` | Broad golden armor planes over black machinery; light reads pale-hot rather than red |
| Disruptor | ready `#10B981`, active `#059669`, spent `#475569` | State must also change icon, brightness, and label |
| Other mechanics | shield `#00F2FE`, ESP `#C084FC`, Boost `#F59E0B`, HP `#22C55E`, danger `#EF4444` | Mechanic colors override faction color locally |

Cyan, violet, amber, red, and green each serve more than one system. Color is never
the sole state cue. Pair hue with silhouette, icon, placement, motion, value, and/or
plain-language label.

The current Canvas tokens still identify Shub with violet and Hadenmen with red.
Those tokens are now legacy implementation colors and conflict with the approved art
direction. Do not spend production time reconciling the frozen browser client; apply
the approved values when the replacement A/B families are integrated in Godot.

## Material hierarchy

1. **Structure:** soot-dark steel, blue-black composite, dark stone-composite, or
   black ceramic establishes mass.
2. **Protective surface:** aged ivory ceramic, worn plate, or faction-specific shell
   breaks the silhouette into readable planes.
3. **Flexible system:** graphite fabric, seals, hoses, and joints explain motion.
4. **Service metal:** restrained brass or functional fasteners reveal age and access.
5. **Emissive core:** one small, mechanically located source communicates power or
   state.

Prefer broad material planes and selective wear. Avoid uniform scratches,
high-frequency greeble coverage, edge-lighting every panel, or “detail” that becomes
noise at a 200 x 290 battle footprint.

## Faction and side languages

### Party

- Human-scale, lean-to-sturdy silhouettes with practical salvage/voidwear
  construction.
- Give each principal character two or three substantial identity colors plus a
  grounding neutral. Color may occupy coats, jackets, sashes, quilted panels,
  lining, armor shells, and layered textiles; it is not limited to tiny role pips.
- Combine durable travel layers with operatic specificity: repaired luxury cloth,
  contrasting linings, tailored coats over field gear, ceramic or metal protection,
  and visibly maintained personal equipment.
- Equipment-led asymmetry communicates history and function without invented
  heraldry.
- Role must read from stance and weapon before color.
- Keep saturated costumes value-separated from the dim environments and from
  gameplay emissives. Avoid indiscriminate rainbow distribution, generic modern
  tactical cosplay, and super-soldier bulk.

### Character and costume anchors

These are developer-provided placeholder-era identity facts. Preserve them in every
unhelmeted portrait, outfit study, dialogue crop, and cinematic reference.

- **Hazel:** red hair and green eyes. Favor peacock teal, turquoise, emerald,
  sea-green, ivory, cream, antique brass, and controlled saffron. Copper, coral,
  rust, and orange may appear away from the head, but large warm collar or shoulder
  fields must not merge with her hair.
- **Owen:** blonde hair by developer direction. Favor cobalt, cerulean, indigo,
  royal blue, plum, ivory, warm brown, black-gold, and limited emerald. Use a dark or
  saturated edge around the head and keep pale gold trim value-separated from the
  hair.
- Hair color remains stable across lighting studies. Environment grade may shift
  surrounding values, but it must not make Hazel brunette or Owen red-haired.
- The first novel's public sample describes Owen with dark hair. Blonde Owen is an
  intentional project override and must not drift during later source research.
- Do not infer final facial features, age treatment, body type, costume history,
  insignia, or personal symbolism until the developer approves them.

### Aristocrats and nobles

- Dark clothing is the default: black, blue-black, graphite, deep desaturated plum,
  and near-black oxblood may form the base.
- Rank reads through silhouette, cut, fabric quality, layering, controlled metallic
  detail, and posture. Many nobles stay dark, but court fashion is not universally
  somber.
- Use velvet-like matte depth, dense woven cloth, polished dark composite, restrained
  antique metal, and selective vivid lining or silk contrast.
- Reserve a visible minority of fashionable courtiers for deliberately extravagant
  saturated silks, metallic hair or skin treatments, clashing accessories, and
  theatrical period cuts. Their excess provides a useful foil for severe dark-clad
  power figures.
- Keep jewelry, embroidery, and house/family marks restrained and non-specific until
  the developer supplies approved symbols.
- Avoid uniform rainbow distribution, bright full-body faction uniforms, and copied
  historical or franchise regalia.

### Empire: shared language

- Aged human engineering, ordered repetition, dark composite, steel, restrained
  brass/amber, and controlled oppression.
- Combatants remain human, even when heavily protected.
- Avoid copied heraldry, religious props, excessive robes, and heroic oversized
  armor.

#### Surface-city and family/corporate branch

- Golgotha's surface wealth uses pastel tower masses, glass and steel, aerial
  movement, and confident architectural variation rather than palace materials at
  street level.
- A family or corporation may have a distinct tower silhouette and security logic,
  but no crest, text, or symbol is invented before developer approval.
- Dawn, weather, sabotage, and civil disorder may stain or damage the polished
  surface without turning it into the buried palace.

#### Court and elite branch: restrained gothic decay

- Vertical arches, long proportions, fluted structure, narrow apertures, ceremonial
  service machinery, finer brass, and elegant wear.
- Warm shafts are narrow and directional against cool blue-black shadow.
- Ornament derives from structure and access, never applied franchise symbols.

#### Mutable Court branch: weaponized spectacle

- The Court's steel-and-brass structural shell is persistent; projected climate,
  terrain, mist, water, ice, flora, and concealment occupy separate Godot layers and
  effect passes.
- A Court skin changes navigation pressure, visibility, costume response, and
  hazard language. It must feel physically dangerous even when its origin is
  theatrical technology.
- Do not bake every possible Court state into one maximalist image. Author a stable
  shell and independently reviewable state packages.

#### Military and industrial branch: heavy reliquary industry

- Transverse mass, rectangular buttresses, blast shutters, repeated bays, furnace
  infrastructure, chain-driven service systems, and pale armored structural panels.
- Soot-dark steel dominates; aged pale ceramic and limited furnace amber divide
  planes.
- The result is oppressive infrastructure, not a gothic church with guns.

### Shub

- Precise diamond, radial, suspended, folded, and origami-like geometry.
- Iron-black shells, oxidized red/rust structural planes, dark crimson recesses, and
  small ember-red optics or cores.
- No blue, cyan, or purple faction accents. Neutral white-hot contact highlights may
  appear only where material or impact requires them.
- Repeated drones share near-identical construction; variation is subtle and
  controlled.
- Environments should feel built by the same faceted machine intelligence, not by
  humans with red lights. Oxidation must follow seams, heat, exposure, and service
  geometry rather than becoming a uniform orange noise layer.
- Shub architecture ignores human scale and ergonomics: steps, voids, machine
  mouths, cable forests, variable pressure/gravity zones, and building-scale moving
  parts follow machine need. Human-safe chambers are conspicuous temporary
  accommodations.
- **Core machines:** repeated blank or faceted bodies communicate manufactured
  precision and shared intelligence.
- **Ghost Warriors:** recognizable dead organic tissue is held and operated by
  iron-black/rust implants and structural staples. Dead flesh is payload and
  psychological warfare, not a new blue, purple, or green faction palette.
- **Furies:** a controlled human disguise opens or fails to reveal a compact,
  precise inner chassis with integrated blades, sensors, and energy apertures.
  Transformation states must share anchors so the reveal reads as one body changing,
  and must avoid a recognizable cinematic killer-robot silhouette.
- Avoid brass ritualism, cloth, human armor anatomy, gothic arches, and familiar
  floating-shell-with-eye silhouettes without further original development.

### Hadenmen

- Fortress-machine bodies assembled from broad engineered-gold architectural slabs
  over near-black mechanical recesses and joints.
- Gold is the dominant armor identity, ranging from deep old gold to pale electrum.
  It reads as advanced structural material, not Imperial jewelry, coin polish, or
  decorative brass trim.
- Decimator: extremely broad, low, asymmetric mass.
- Enforcer: taller, narrower, long-striding mass.
- Internal power reads pale-hot gold or controlled white. Avoid red as a primary
  operational accent so the faction remains distinct from Shub.
- Ships and occupied cities are collective bodies. Hadenmen plug into systems,
  surrender ordinary human workstation ergonomics, move with quiet group purpose,
  and can become literal machine components.
- Haden construction overwrites human space with sharp, internally lit volumes and
  unfamiliar angles. Preserve enough of the displaced human shell to make the
  transformation legible where the story calls for occupation or conversion.
- Low pulse, pressure-like air movement, cold internal light, and near-silent group
  motion may imply a shared mind; do not rely on random gold glow or decorative
  circuitry.
- Avoid gothic ornament, round heroic pauldrons, and recognizable power-armored
  super-soldier construction.

### Psi-Blockers

- Unmanned, stationary, speed-zero field objects with no offensive weapon language.
- The device is Imperial institutional horror: a surgically extracted living esper
  brain remains visible inside a sealed life-support casket or pressure vault, with
  perfusion lines, electrodes, and pain-induction hardware that force the psychic
  scream used to suppress other esper powers.
- Keep the treatment horrifying but clinical rather than gratuitously gory. The
  silhouette reads as grounded containment machinery, never a clean utility pylon,
  armed combatant, or mystical shrine.
- Damage states must be physically visible: intact and sustained; damaged with
  failing containment/support; destroyed and inert. Do not depict an intact brain
  floating unharmed after the housing is destroyed.
- Active, ready, disabled, and field effects remain runtime overlays rather than
  baked glow or psychic particles.

## Three-character range-band prototype

This bounded prototype uses exactly three anonymous functional loadouts and no
esper, vocation, force shield, or Boost language.

| Loadout | Silhouette | Weapon and mechanism | Accent |
|---|---|---|---|
| Power Melee | Broadest upper body; planted symmetrical stance | One forward-weighted straight-backed broad vibroblade; no hammer or shield | Cyan |
| Critical Melee | Leanest, fastest, low forward stance, strongest negative space | Exactly two matched narrow vibrodaggers with hooked guards | Violet |
| Queue Control Melee | Lowest center of gravity, wide braced legs, deliberate asymmetry | One medium vibroblade plus a mechanical piston/impulse shove gauntlet; not a force shield | Amber-orange |

Every loadout carries the same compact ring-capacitor disruptor. The base art keeps
it neutral; ready/spent illumination and icon state are runtime-owned. Only the
fastest loadout on each side begins ready in the current authored encounter.

## Combatant production contract

### Concept studies

- Multi-subject sheets are direction references only.
- Use true RGBA transparency, complete silhouettes, same baseline/scale, and safe
  outer padding.
- No floor, cast/contact shadow, UI, particles, bloom, firing effects, or environment
  light.
- Validate subject count, anatomy, weapon count, crop, alpha, and silhouette at the
  intended battle footprint.

### Runtime combatants

- One combatant per frame sequence or atlas; never ship a group concept sheet.
- Initial production tile target: 512 x 512 RGBA per frame.
- Initial ground-anchor target: `(256, 472)`, retaining at least 32 px head/weapon
  safety and 40 px bottom safety. Validate and revise once the first selected
  vertical slice is staged.
- Party faces screen-left; enemies face screen-right unless an approved action turns
  them.
- Every frame uses the same trim box and pixel ground anchor. Stationary feet drift
  no more than one pixel.
- Metadata records frame rectangles, duration, loop behavior, logical battle scale,
  facing, safe bounds, named semantic events, and relevant sockets.
- Relevant sockets include `weapon_tip`, `muzzle`, `hand`, `core`, `head`,
  `shield_center`, and `hit_center`.

Minimum state coverage:

- ranged idle;
- closing idle and advance;
- engage transition;
- engaged idle;
- melee anticipation, semantic contact, and recovery;
- role-specific signature action;
- ranged aim/fire/recoil where applicable;
- disruptor draw/aim, fire or held interrupt, and recovery;
- flinch/hit;
- incapacitated/defeat.

Contact shadows, trails, impact sprites, beams, particles, bloom, and screen feedback
remain compositor-owned.

## Weapons and equipment

- Every weapon class has one unmistakable massing rule; recolor never defines a
  weapon identity.
- Vibro-blade: forward-weighted straight-backed military blade.
- Twin vibro-daggers: matched narrow pair with hooked guards; exactly two.
- Particle carbine: short triangular bullpup mass with contained power chamber.
- Scatter gun: one broad rectangular muzzle with lateral recoil cylinders; never a
  rotary barrel.
- Plasma projector: long ceramic slab with vented heat cage around a contained core.
- Disruptor emitter: compact device dominated by a perpendicular ring capacitor.
- Avoid baked energy halos in production base color. Emissive response becomes a
  separate mask or runtime overlay.

## Portrait system

Portraits are expected to support dialogue, queue recognition, party status, and
possibly menus. They are planned now, but final identities wait for developer-
approved characters.

### Portrait style calibration

- Use anonymous, explicitly non-canon test subjects for A/B rendering and crop
  studies.
- Do not treat an attractive generated face as a character approval.
- Test the same subject and framing under two materially distinct render treatments,
  not merely two palettes.

### Proposed portrait master

- 1024 x 1024 RGBA master, head and upper torso in three-quarter view.
- Ten-percent transparent outer safety; no baked panel, speech box, background, or
  scene lighting.
- Preserve enough shoulders and costume to identify role when the face is small.
- Derive a dialogue crop and a compact queue/status crop from the same approved
  identity anchor.
- Queue derivatives must remain readable at approximately 96–128 px and in
  grayscale.

### Expression coverage after identity approval

- neutral/listening;
- focused/commanding;
- anger under control;
- pain or wounded strain;
- restrained relief;
- role-specific exceptional states only when narrative content requires them.

Maintain facial structure, age, proportions, hair, costume, camera, and light across
expressions. Do not generate expression variants independently without an approved
identity anchor.

## UI, typography, and iconography

- UI is a clean tactical layer over the world, not another gothic environment.
- Keep the compact top-left queue, right-aligned party status, thin enemy bars, and
  contextual actor-adjacent command menu.
- UI remains outside post-processing.
- Use local scrims only where necessary for contrast; avoid large persistent cards.
- State icons require silhouette plus text/value redundancy.
- Replace debug-like emoji and single-letter glyph dependence with an approved
  geometric icon or portrait language.
- `Courier New` is a current prototype implementation choice, not approved final
  typography. Select and bundle a repository font only through a separate approval
  and dependency/license review.
- Do not use blackletter, parchment panels, skull ornament, or faux-medieval frames.

## VFX and feedback language

All shipped particles, combat effects, trails, flashes, bloom, grading, and camera
feedback remain procedural.

Every contact-bearing action uses readable beats:

1. anticipation or charge;
2. travel or strike;
3. semantic contact;
4. short recovery/aftermath.

Disruptors retain charge, beam, detonation, and bloom-spike grammar. Effects freeze
with hit-stop through the compositor's shared active-delta timeline. Numeric timing
and intensity stay in `feedbackConfig.ts`, not duplicated here.

Concept boards may depict effect language for review, but they are references, not
baked runtime effect sprites. Keep the center tactically readable and never obscure
HP, target, range, engagement, queue, or ready/spent state.

## A/B choice, version, and derivative policy

- Every meaningful creative brief receives two independently viable candidates.
- A/B must change composition, silhouette, construction, material hierarchy, or
  spatial language. Recolor alone does not count.
- A rejected draft, crop repair, alpha cleanup, horizon correction, or resize is a
  revision of its parent choice, not a second choice.
- Mechanical derivatives—crops, masks, atlases, mipmaps, resized exports, and queue
  thumbnails—inherit the selected direction and do not each require a new A/B pair.
- A new creative decision inside a derivative does require A/B.
- Compare candidates at equal scale, crop, matte, labels, and review-sheet treatment.
- Choice letters are neutral identifiers, not ranks.

Recommended new-file grammar:

`{family}-{subject}-choice-{a|b}-v{revision}-{artifact}.{ext}`

Examples:

- `range-band-party-choice-a-v2-concept.png`
- `psi-blocker-choice-b-v1-states.png`
- `captain-choice-a-v1-dialogue-neutral.png`

Do not rename historical generated sources merely to satisfy the new grammar.
Record canonical review and production paths in the asset register.

## Asset lifecycle and approval states

| State | Meaning |
|---|---|
| Exploratory | Prompt or study may be incomplete; not a formal choice |
| Proposed | QA-passing candidate ready for developer comparison |
| Direction-approved | Visual system is approved; individual files may remain proposed |
| Asset-approved | Specific file/direction selected for production derivatives |
| Integrated | Exists, is manifest-registered, loads loudly, and was verified in the canonical Godot client |
| Rejected | Retained only for provenance or comparison; never integrated |

Workflow:

1. Write the brief: consumer, subject, constraints, dimensions, alpha, facing,
   overscan, prohibited content, and approval state.
2. Produce independent A/B choices.
3. Inspect full resolution for anatomy, geometry, text artifacts, seams, alpha,
   crop, light, hierarchy, and recognizable-IP drift.
4. Build an equalized comparison sheet.
5. Developer selects or redirects.
6. Produce runtime derivatives with anchors, scale, states, timing, masks, and
   metadata.
7. Add provenance and status to the asset register.
8. Add manifest entries only after every referenced file exists.
9. Integrate through the canonical Godot client, validate the manifest and import,
   exercise the affected scene, inspect runtime output, and request final subjective
   review.

## Visual QA checklist

- [ ] Correct subject count, side, facing, role, weapon count, and state coverage.
- [ ] Faction and role read in black silhouette at intended runtime size.
- [ ] Value hierarchy survives grayscale.
- [ ] Color is not the only state cue.
- [ ] Alpha contains transparent and visible pixels with no matte fringe or halo.
- [ ] No cropped helmet, foot, weapon, cloth, cable, or extreme-pose bound.
- [ ] Ground anchor, scale, and baseline are consistent.
- [ ] No unintended figure, face, text, logo, insignia, symbol, or watermark.
- [ ] No recognizable franchise weapon, armor, icon, or composition.
- [ ] One dominant scene-light direction and a readable combat lane.
- [ ] Background floor is at most 15%, preferably 12%.
- [ ] Queue, party status, target bars, and command-menu safe zones remain clear.
- [ ] Base sprites contain no baked floor, shadow, environment grade, bloom, beam,
  particles, or impact effect.
- [ ] Status, provenance, dimensions, prompts, and open decisions are recorded.

## Current visual review references

- `docs/design/deathstalker-visual-source-index.md`
- `docs/design/deathstalker-cover-art-visual-review.md`
- `docs/design/hazel-combatant-raster-brief-v1.md`
- `docs/design/hazel-animation-timing-sheet-v1.md`
- `docs/design/owen-combatant-raster-brief-v1.md`
- `docs/design/owen-animation-timing-sheet-v1.md`
- `art/review/imperial-influence-calibration-pair-v1.png`
- `art/review/background-choice-pairs-v1.png`
- `art/review/shub-red-rust-choice-pairs-v2.png`
- `art/review/hadenman-gold-choice-pairs-v2.png`
- `art/review/imperial-layer-choice-pairs-v3.png`
- `art/review/shub-layer-choice-pairs-v1.png`
- `art/review/hadenman-layer-choice-pairs-v1.png`
- `art/review/mistworld-battle-background-choice-pair-v1.png`
- `art/review/title-main-menu-background-choice-pair-v1.png`
- `art/review/imperial-noble-dialogue-interior-choice-pair-v1.png`
- `art/review/range-band-choice-pairs-v1.png`
- `art/review/range-band-critical-melee-idle-study-choice-pair-v1.png`
- `art/review/range-band-power-melee-idle-study-choice-pair-v2.png`
- `art/review/range-band-queue-control-melee-idle-study-choice-pair-v1.png`
- `art/review/hadenman-decimator-idle-combatant-choice-pair-v1.png`
- `art/review/hadenman-enforcer-idle-combatant-choice-pair-v1.png`
- `art/review/psi-blocker-choice-pair-v1.png`
- `art/review/combat-feedback-choice-pair-v1.png`
- `art/review/combat-status-icon-language-choice-pair-v3.png`
- `art/review/dialogue-portrait-ui-choice-pair-v4.png`
- `art/review/red-blonde-dialogue-portrait-style-choice-pair-v2.png`
- `art/review/hazel-owen-dialogue-expression-portrait-choice-pair-v1.png`
- `art/review/imperial-noble-portrait-style-choice-pair-v1.png`
- `art/review/imperial-nonnoble-dialogue-portrait-style-choice-pair-v1.png`
- `art/review/imperial-social-spectrum-dialogue-portrait-choice-pair-v1.png`
- `art/review/hadenman-shub-queue-portrait-tokens-choice-pair-v1.png`
- `art/review/hazel-owen-vibrant-costume-lookdev-choice-pair-v1.png`
- `art/review/hazel-owen-vibrant-costume-lookdev-choice-cd-v1.png`
- `art/review/imperial-environment-prop-cutout-kit-choice-pair-v1.png`
- `art/review/imperial-party-equipment-menu-chrome-kit-choice-pair-v1.png`
- `art/GENERATED-ASSET-REGISTER.md`
- `art/GODOT-ART-CANDIDATE-CATALOG-v1.json`
## Decision log

| Date | Decision | Scope |
|---|---|---|
| 2026-08-22 | Adopt the visual north star and HD-2D-inspired shallow-focus presentation | Direction-approved |
| 2026-08-22 | Use restrained gothic decay for Imperial court/elite spaces and heavy reliquary industry for Imperial military spaces | Direction-approved |
| 2026-08-22 | Keep party practical; make Hadenmen golden fortress-machines; make Shub precise red/rust alien machines with no blue or purple faction palette; exclude recognizable secondary-reference iconography | Direction-approved |
| 2026-08-22 | Require meaningful A/B alternatives for creative briefs while allowing mechanical derivatives to inherit an approved branch | Direction-approved |
| 2026-08-22 | Plan portraits for dialogue, queue, and status use, but defer canon faces until character identity approval | Direction-approved |
| 2026-08-22 | Preserve Hazel's red hair and Owen's blonde hair; coordinate both against dark readable costume bases; make dark clothing the aristocratic and noble default | Superseded in part on 2026-08-23 |
| 2026-08-23 | Keep Hazel red-haired/green-eyed and Owen blonde, but give principal party members substantial saturated identity colors over functional construction; many nobles remain dark while extravagant court fashion remains a visible source-backed counter-language | Direction-approved |
| 2026-08-23 | Use lawful public novel samples as material and social-contrast evidence; record source facts, inferences, and developer overrides separately in `deathstalker-visual-source-index.md` | Direction-approved research method |
| 2026-08-23 | Give each named world and institution its own construction, weather, and light grammar; permit source-grounded high-key horror; and keep later Golden Age civic warmth era-separated from the decaying-Empire baseline | Direction-approved |
| 2026-08-23 | Treat Shub and Haden spaces as extensions of machine bodies and group thought; distinguish Shub core machines, Ghost Warriors, and Furies; and author the Imperial mutable Court as a stable shell with layered hazardous states | Direction-approved |
