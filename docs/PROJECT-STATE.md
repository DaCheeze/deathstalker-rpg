# Project State

Updated: 2026-08-27

## Durable decisions

- Build and ship a complete game.
- Godot 4 is the developer-approved sole presentation client as of 2026-08-23.
  Keep the deterministic TypeScript combat core authoritative and feed Godot through
  a versioned plain-data bridge. Canvas is frozen historical source, not a fallback,
  comparator, parity target, deployable client, or acceptance reference.
- The full game may use raster sprites, procedural Godot 2D combatants, or a hybrid.
  The former procedural-only/no-sprites restriction is revoked; presentation choices
  should serve final visual quality, readability, animation, and sustainable asset
  production rather than preserve a prototype implementation.
- Use *Deathstalker* for story/tone placeholders and *Octopath Traveler* for game
  design direction.
- Use a classic JRPG campaign loop: towns provide rest, shops, and a stable return
  point; fields and dungeons provide exploration, persistent one-time chests,
  discrete battles that return to the map, and repeatable regular encounters for
  optional XP/gold. Recommended-route completion must not require grinding, but
  players may deliberately overlevel to make authored fixed-strength bosses easier.
  Do not scale enemies or bosses to the party's current level. Medkits are optional
  tactical supplies, not mandatory story gates.
- The full campaign follows the Hero's Journey as a player-experienced
  transformation. Separation, Initiation, and Return shape narrative progression,
  balance pressure, economy, recovery, reward, and changing world architecture.
  Apply the complete movement at campaign scale, selected echoes at expedition
  scale, and compression/release rhythm at area scale. Critical paths should be
  intuitively legible through architecture before UI intervention. The operational
  contract is `docs/design/hero-journey-campaign-architecture.md`; it does not
  authorize unapproved names, dialogue, plot, balance values, or economy values.
- The selected opening expedition is a source-aligned Virimonde forced departure.
  Imperial authority condemns Owen without explaining why. Hazel, a clone-legging
  smuggler and pirate, crash-lands on Virimonde and saves him at his wounded last
  stand; their shared flight begins the campaign's Separation movement while
  preserving Owen's home for a possible transformed return. This supersedes both
  the earlier routine-Hazel-presence proposal and the provisional formal
  capture/execution-site structure. The fixed source-reconciled order is: familiar
  Standing approach and supplies, authentic death order, concealed-route escape,
  private-flyer pursuit and shootdown, last stand at a windbreak tree, Hazel's
  damaged escape-pod impact and active rescue, flight to the lake, lake regroup,
  and departure in Owen's private yacht hidden underwater. The next destination,
  exact pod-damage cause, names, relationships, and dialogue remain unapproved.
  `docs/design/opening-expedition-forced-departure-v1.md` is the operational beat
  sheet.
- The opening's ten beats are internal authority, replay, telemetry, and save
  boundaries—not player-facing chapters. The intro presents a compact connected
  Virimonde space with limited optional exploration and breathing room between its
  required rescue and departure confrontations. Normal field contacts are visible;
  the opening uses no random encounter roll. A player field strike against an
  unaware contact grants player opening initiative, enemy detection and first
  contact grants enemy opening initiative, and mutually aware contact uses the
  normal speed queue. TypeScript validates the awareness geometry, initiation, and
  starting queue; Godot only presents the world and collects intent. Exact distances,
  patrol speed, and optional rewards remain unapproved data.
- Use gothic-industrial war-fantasy as a controlled secondary visual influence:
  restrained gothic decay for Imperial court/elite spaces and heavier
  reliquary-industrial construction for Imperial military spaces. Keep the party
  practical and human-scale, make Hadenmen golden brutalist fortress-machines, and
  make Shub precise red/rust/iron-black alien machines with no blue or purple
  faction palette. Do not import recognizable faction designs, iconography,
  signature weapons, super-soldier proportions, or gothic UI typography.
- `docs/design/visual-style-bible.md` is the operational visual authority. Every
  meaningful new creative brief receives independently viable A/B choices; derived
  crops, masks, atlases, and resizes inherit a selected direction unless they add a
  new creative decision.
- Character/costume anchors: Hazel has red hair and green eyes; Owen is blonde by
  developer direction. Principal-party wardrobes are not required to be dull or
  mostly charcoal: use distinctive saturated identity colors over functional,
  human-scale construction. Many aristocrats and nobles still wear dark clothing,
  but source-backed Imperial fashion also includes vivid silks, metallic treatments,
  and theatrical cuts. Express rank through silhouette, material, layering, posture,
  and controlled contrast rather than one universal palette.
- Retain recognizable *Deathstalker*-derived mechanics, factions, races/types,
  technology, and concepts until one developer-requested originality pass.
- Work locally first. The developer decides when to commit and push.
- The developer-approved Humble/GameDev Market audio library may supply seven
  weapon cues in Godot: `vibro_blade`, `twin_vibro_daggers`, `heavy_smash`,
  `concussive_shove`, `particle`, `ballistic_scatter`, and `plasma`. Purchased
  sources, purchase records, and staged WAVs remain owner-controlled and out of
  Git. The public checkout retains procedural coverage for all seven;
  `disruptor`, `shield_raise`, and `psionic` remain procedural in every mode.
- Every game-development pass updates
  `docs/development/production-pass-ledger.md` before handoff; interrupted passes
  receive explicit incomplete checkpoints.
- Use Node 24 LTS. Do not add dependencies without approval.
- Every future work recommendation identifies its best execution venue as local,
  cloud, or hybrid and gives a short reason.
- The bounded three-character range-band prototype is retained as explicit
  historical fixture evidence, not the active live-game direction. The Godot Web
  session starts combatants directly Engaged, offers melee on the first turn, never
  exposes `Advance` to the player or AI, and retargets after a defeat without a
  movement turn. Deathstalker remains a menu-driven turn-based JRPG, not a tactical
  RPG.

## Current implementation

- The intro-completion sequence is implemented from the Standing approach through
  temporary safety aboard the yacht. All ten TypeScript boundaries now have a
  player-controlled spatial seam: the connected Standing grounds, a short wreck-to-
  windbreak traversal, Hazel's pod-to-rescue approach, the required visible rescue
  contact, a noncombat lake release, an explorable shoreline with an avoidable
  patrol, the required visible departure contact, and a controllable yacht interior
  with an explicit observation-port finish. Ordinary exploration renders one lead
  avatar—Hazel only during the rescue handoff and Owen otherwise. Internal beat
  index/count remain available to diagnostics and strict save/replay but no longer
  appear in exploration or combat; the player sees only a quiet place plate.
  Opening protocol v3 keeps contact geometry, initiation, one-action opening
  advantage, victory persistence, required-contact gates, combat return, and final
  completion authoritative in TypeScript. The committed 34-exchange transcript
  reaches sequence 33 with `awaiting=complete`, and the strict Godot validator proves
  transcript replay and resume. A fresh-origin exported Web playthrough completed
  the entire intro, skipped the optional patrol, resolved both required encounters,
  returned to each field, walked the yacht interior, and displayed `OPENING
  EXPEDITION COMPLETE` with zero browser warnings/errors. That pass also exposed and
  fixed actionless enemy-first contacts failing to auto-advance AI, the remaining
  combat `SEPARATION NN/10` label, and a final capture transition race. The warmed
  1280×720 Web overlay measured 17.86 ms/frame; the repository-safe export is 43.43
  MiB across 15 files. Exact awareness geometry, numerical balance, authored final
  text/art, device audio, and developer visual/control-feel approval remain open.
- The Hero's Journey campaign architecture contract is approved and documented.
  Its first authoritative runtime seam is now `ExpeditionJourneyState`: pure
  TypeScript owns the ordered Separation beats, current boundary, persistent party
  condition, inventory, encounters, legal actions, AI, and RNG.
  The encounter validator now preserves and validates declared environment data.
- The first bounded campaign-loop proving fixture is now implemented. Pure
  TypeScript owns a town hub with rest and shops; an Owen-only 2D exploration
  contract with bounds, walkable regions, entry points, a dominant route, quieter
  side routes, two concealed persistent one-time chests, one repeatable regular
  contact and one additional optional side contact; a fixed-strength boss approach;
  shared XP/level/gold; condition persistence; and discrete combat return. Godot Web
  exposes it at `?mode=world-loop` as an explicitly noncanonical systems map. Godot
  owns local walking/collision, depth scale, terrain/prop presentation, input
  collection, and diagnostic route rendering; TypeScript protocol v3 supplies all
  map placements, strict visible-contact geometry, authoritative player/enemy/normal
  opening advantage, and Owen's
  exploration identity. Only Owen appears while exploring, while the existing three
  functional party loadouts remain visible in combat.
  A strict 76-exchange transcript proves two chests, three optional patrol clears,
  overleveling above level 1, town rest, and fixed-boss completion. A real WebGL 2
  pass verified shop purchase, travel, chest persistence, optional combat, automatic
  return to exploration, persistent damage, and medkit-free town rest with zero
  browser warnings/errors. That run reached interactive in 496.20 ms and showed a
  warmed 17.86 ms average frame time. Public artifact commit `00cff44` now exposes
  the same fixture at
  `https://dacheeze.github.io/deathstalker-rpg/index.html?mode=world-loop`; hosted
  verification reached `awaiting=explore` at sequence 0 in 2273.90 ms and produced
  zero browser warnings/errors. The fixture validates architecture and is not
  approved campaign content, final level art, or numeric balance. The Owen/2D local
  follow-up passed WebGL movement in both axes, concealed-chest discovery and
  persistence, optional-contact entry, and the combat-party handoff with zero
  warning/error browser entries. Its clean local boot reported 763.50 ms to
  interactive and the warmed Godot overlay held 17.86 ms/frame at 1280×720. The
  first inspected capture is `docs/screenshots/world-loop-owen-2d-field.png`.
  The natural-wayfinding follow-up removes explicit routes and floating labels from
  ordinary play, keeps the exact graph inside F12 diagnostics, represents services
  and contacts as world props, camouflages concealed caches until proximity, and
  aligns the visible shoreline with the upper walkable branch. Its local WebGL run
  reached interactive in 597.90 ms, held 17.86 ms/frame, and logged zero browser
  warnings/errors. The inspected capture is
  `docs/screenshots/world-loop-natural-guidance-field.png`; developer visual and
  feel approval remains open and this revision is not deployed. The latest local
  follow-up expands all three proving locations beyond one screen, adds a damped
  clamped Godot camera, and keeps clicks, props, concealed caches, terrain cues,
  diagnostics, and Owen in one world-coordinate transform. The TypeScript Web host
  now autosaves a strict version-1 world-loop command-history checkpoint and resumes
  it by deterministic replay; Owen's location and finite walkable position are kept
  in a separate strict presentation checkpoint that must match the authoritative
  sequence and location before Godot restores it. Local WebGL QA opened the lower
  field cache, moved away, and reloaded at authoritative sequence 2 in the same
  position with the cache still open and medkits still at 5. The clean-origin load
  reported 836.40 ms to interactive; the warmed reload reported 453.70 ms and 16.67
  ms/frame at 1280x720 with zero browser warnings/errors. The inspected capture is
  `docs/screenshots/world-loop-camera-resume-field.png`; camera feel, hosted-device
  performance, developer approval, and deployment remain open.
  The 2026-08-29 productionization pass adds a reusable injected scenario-runtime
  factory while retaining the functional proving fixture as the only default entry.
  Strict TypeScript now validates every campaign-field contact trigger against
  declared facing, awareness, strike, collision, and player-position data before
  selecting the opening side. The regenerated 76-exchange transcript and Godot
  validator prove player-first and enemy-first contacts, two persistent chests,
  optional grinding, town/shop/rest, reload reconstruction, and fixed-boss victory.
  A fresh 1280x720 local Web run exercised shop purchase, enemy-first and
  player-first patrols, chest persistence across reload, repeated XP/gold rewards,
  level-up, return-to-town recovery, boss approach, and a deliberate underleveled
  fixed-boss defeat. Its diagnostics measured 17.86 ms/frame. That run exposed a
  visually silent defeat state; the compositor now presents an explicit terminal
  card and restart instruction. A generalized strict native transcript-review path
  replayed all 76 authoritative exchanges through the production controller and
  captured the fixed-boss victory card at 1280×720 in
  `docs/screenshots/overnight-world-loop-victory-card.png`. That visual pass caught
  and removed a contradictory exploration prompt beneath the terminal card. The
  final capture, GDScript checks, validators, and rebuilt Web export pass. A browser
  URL-policy rejection still prevents the remaining post-export Web victory route;
  no hosted deploy was performed.
- The first proving expedition has a source-aligned playable vertical slice. Its
  ten beats trace pastoral Virimonde, Owen's unexplained death order and Standing
  escape, flyer shootdown and windbreak last stand, Hazel's pod impact and active
  rescue, flight to the lake, lake regroup, hidden-yacht departure, and temporary
  safety. Hazel is identified as a clonelegger, smuggler, and pirate; Owen remains
  visible through the last stand, Hazel becomes active for the rescue, and both are
  present after convergence. TypeScript caps Owen at 75% HP on entering the
  flyer-wreck boundary so the source injury is authoritative and persists; the
  value is provisional until balance work resumes. Three provisional menu-driven
  combats start Engaged and expose no `Advance`. A protocol-version-3, 34-exchange
  transcript and strict Godot controller/loader keep combat and journey authority
  in TypeScript. Godot Web presents a deep pastoral procedural Virimonde, Imperial
  constriction, crash rupture, transparent journey HUD, combat, lake regroup, and
  temporary safety. The Web host autosaves a strict command-history checkpoint
  after every accepted boundary/action and resumes it on reload by deterministically
  replaying validated commands; corrupted saves fail closed. A separate exact-schema
  presentation checkpoint preserves Owen's position and local supply-inspection
  state only when sequence, beat ID, map ID, finite coordinates, and current
  walkability all match the authoritative resumed view.

  Every visited beat exposes strict boundary telemetry for party HP, inventory,
  retired recovery-choice state (null on the active route), encounter outcome,
  turns, and action count. The first three beats consume one validated
  TypeScript-supplied 3700×1500 `virimonde_standing_grounds` exploration map with
  bounds, walkable regions, routes, functional landmarks, objective identity, and
  interaction radius. Godot owns only four-direction WASD/arrow or click movement,
  collision against those supplied regions, a damped scrolling camera, and scene
  presentation. Beat 0 implements the approved ordinary-world lock: Owen approaches
  the procedural Deathstalker Standing through familiar farmland, guided by an old
  stone-and-river axis to a physical supply cache. `Inspect supplies` confirms the
  unchanged starting inventory and spends nothing; `Finish inspection` submits the
  same TypeScript-owned boundary intent. Beat 1 reverses the same connected grounds
  after anonymous Standing personnel accept the Imperial death order: access seals,
  its windows turn hostile, three anonymous personnel hold the approach, and Owen
  retreats to the old landmark before `Leave the Standing` becomes available. Beat
  2 carries that position into the compressed concealed passage and opens onto
  Owen's private flyer; its supplied interaction radius hands off to the
  authoritative flyer-wreck boundary. Later beats stage the wreck and windbreak last
  stand, damaged pod impact, lake approach, hidden yacht, and yacht safety without
  adding combat resolution to Godot. Dialogue, final raster assets, next destination,
  and combat tuning remain open.

  Native Godot also has a strict transcript-review mode that consumes the same
  exported TypeScript route, rewrites only transport IDs, and rejects command
  divergence. Its capture mode produced inspected 1280×720 frames for the Standing
  approach, supply endpoint, hostile reversal, concealed passage, and flyer release.
  Actual WebGL QA walked the complete first-three-beat route, proved exact
  position/inspection restoration across reload, and reached Beat 3 with Owen at the
  TypeScript-authored 75% HP cap with zero browser warnings or errors. Those captures
  are presentation evidence, not final visual approval. The Deathstalker Standing
  composition is developer-approved in narrative content; subjective visual
  execution still requires play review.
- The latest three-pass continuous-exploration graphics iteration is locally
  complete. Pass 1 rebuilt the multi-screen field with irregular agriculture,
  hedgerows, quieter route wear, and a narrower river; Pass 2 strengthened the
  inhabited Standing terrace, hostile reversal, dark retaining-stone passage,
  diminishing lamps, and cyan-edged flyer release; Pass 3 replaced the inherited
  floating beat card with a compact transparent upper-right objective plate, narrow
  Separation indicator, and contextual bottom prompt that does not cover Owen or the
  landmarks. Fifteen inspected native captures cover the three passes. The rebuilt
  Web export passed actual 2D click traversal, supply inspection, exact reload,
  spatial reversal, passage traversal, flyer interaction, and Beat 2 → Beat 3 handoff
  with zero browser warnings/errors. At 1280×720 its warmed overlay remained 17.86
  ms/frame. A clean-origin single boot sample was 517.20 ms versus the 756.20 ms
  pre-pass sample; this is diagnostic evidence, not a p99 acceptance result. The
  environment remains procedural and awaits developer visual/control-feel approval.
  Public artifact commit `c7b77a7` now exposes this exact Godot Web export at
  `https://dacheeze.github.io/deathstalker-rpg/index.html?deploy=c7b77a7`.
  Hosted verification visibly loaded the continuous field, accepted click-to-move
  traversal under the scrolling camera, reported 17.86 ms/frame at 1280×720, and
  produced zero browser warnings/errors. Its single engine-start-to-scene sample was
  5537.60 ms on the remote Pages load; this is hosted diagnostic evidence, not a p99
  target. The source branch was not pushed.
- The current opening check completes the entire no-grind route for required seeds
  12345 and 98765 at sequence 33 with ten boundary records and exactly the two
  required victories; the lake patrol is optional and skipped. Recovery choice
  remains null, no medkit is spent, and both runs finish with four medkits and one
  revive. Final combined party HP is 30.95% for seed 12345 and 36.67% for seed
  98765 after the 75% flyer-wreck injury cap. These are measured opening baselines,
  not approved balance targets.
- An earlier complete exported Web audit exercised the now-retired medkit choice;
  it remains historical input/persistence evidence but is not current economy
  acceptance. The active 34-exchange route now uses a normal `continue` at the lake,
  rejects the retired choice command, and passes strict TypeScript and Godot
  validation. The existing input fix remains current: F12 owns diagnostics while D
  remains exclusively available for rightward traversal. The post-revision browser
  audit now proves the continuous first-three-beat route and Beat 3 handoff; a
  complete subjective playthrough of all ten beats remains an acceptance gate.
- Pass 18 established the current scene composition.
- Pass 19 procedural combat audio and shared live/replay cue routing are implemented
  and covered by unit tests. Reactive event and outcome cues now share the same
  browser-free routing, including lethal burnout and MAX-speed replay suppression.
- The first listening review found muted, laser-like melee attacks and insufficient
  ranged-weapon differentiation. Weapon abilities now carry validator-checked audio
  profiles for blade, blunt, ballistic, ballistic scatter, particle, plasma, and
  laser synthesis. Blade attacks use separated swing/body/metal beats, current
  particle/plasma/scatter weapons route to distinct procedural timbres, and force
  shield activation rises into an energy spike. No current ability is labeled as a
  laser or single-shot ballistic weapon; those profiles are ready for future data.
- Developer listening review rejected the revised Pass 19 cues. Routing still
  selects blade, blunt, particle, plasma, scatter, shield, and disruptor profiles,
  but the procedural profiles remain too similar and generic in actual play. In
  particular, multiple energy weapons share one parameterized oscillator routine,
  much of the roster reuses Particle Carbine, and cue-selection tests did not
  measure perceptual differentiation. Do not describe Pass 19 audio as approved.
- Godot now has a strict hybrid replacement path for the seven developer-selected
  weapon cues. The committed manifest allowlists 28 purchased WAVs by source path,
  SHA-256, WAV shape, timing, and conservative layer gain; the idempotent staging
  command copies them into a Git-ignored owner-local root without overwriting a
  mismatch. `auto`, `procedural`, and `licensed` preserve the same semantic IDs,
  durations, contacts, and global six-step variation sequence. Empty staging is a
  valid public fallback; partial, mismatched, or unmanifested staging fails loudly.
- Licensed `vibro_blade` uses three standard anime `Sword_Slice` sources. After the
  developer rejected Twin Vibro-Daggers' knife and dry-sword trials, its local
  licensed recipe now uses the explicitly selected
  `C:\Users\Daniel\Desktop\Assets\dagger hit.mp3`, converted without altering the
  original to a 48 kHz stereo PCM WAV in the owner source vault. Its measured main
  transient aligns to both unchanged `85/145 ms` contacts, preserves the
  `120–142 ms` silent notch, and keeps the second hit stronger. Technical validation
  passes, and the developer approved the exact rendered 225 ms recipe from a remote
  private preview on 2026-08-23. Distribution provenance, in-engine device latency,
  full-combat mix, and speaker/headphone translation remain open. The public GitHub
  Pages build still uses the repository-safe procedural cue and is unaffected by
  owner-local WAV changes.
- Required-licensed bridge smokes route 13 licensed/8 procedural cues in the legacy
  fixture and 18 licensed/2 procedural cues in the range-band fixture. The updated
  10×6 review harness routes 42 licensed and 18 procedural selections. These are
  structural and routing results only; the developer has not yet accepted the
  replacement timbres or mix by listening.
- The follow-up integration audit confirmed every declared licensed asset is used
  and none is tracked. The stager now fails before copying unless Git confirms the
  owner-local destination is ignored, and `npm run project:status` recognizes
  Godot paths and reports their additional check-only/validator/smoke obligations.
- `npm run gemini:compare` provides a hybrid two-clip audiovisual review workflow.
  It uploads only explicitly selected media, requires timestamped confirmation that
  Gemini can detect non-speech audio in both clips before requesting a comparison,
  automatically extracts synchronized lossless audio with FFmpeg, supports supplied
  audio-track overrides, and deletes temporary files and uploads by default.
- The public GitHub Pages URL at
  <https://dacheeze.github.io/deathstalker-rpg/> now serves the Godot Web live-combat
  slice from an isolated `gh-pages` artifact branch. The prior Canvas deployment is
  replaced. This is a manually published preview, not yet a reproducible release
  pipeline; `main` pushes still do not deploy.
- Pull requests and `main` pushes run build, lint, and tests without deploying a
  presentation client.
- The former browser routes are frozen historical implementation evidence. The
  bounded three-character prototype's active presentation surface is Godot.
  It uses anonymous Power, Critical, and Queue Control melee loadouts against three
  mirrored anonymous opponents. Ranged/Closing/Engaged state, targeted engagement,
  advance-only movement, queue-order held interrupts, permanent ready/spent charge,
  melee gating, re-engagement after a target falls, and queue displacement preview
  are implemented without changing legacy run simulations.
- The public live session no longer uses that movement loop. It starts all six
  combatants Engaged in mirrored pairs, offers Vibro-Blade/Twin Daggers immediately
  to the fastest player loadout, keeps `Advance` out of every live legal-action list,
  and retargets a living opponent after a defeat without spending a turn. The
  TypeScript host owns this rule; Godot does not filter the action list.
- The first developer feel review found the surface cluttered and the disruptor far
  too strong. The local follow-up uses contextual legal-action menus, plain-language
  FAR/NEAR/MELEE and CHARGE/SPENT labels, role labels for the anonymous party, and a
  prototype-only disruptor multiplier of 1.6 instead of the legacy 3.2 value.
- The next review found the experiment fundamentally over-front-loaded: six ready
  charges and automatic held interrupts dismantled the party before melee became
  available, while the prototype exclusions removed the shields, move variety, and
  satisfying feedback expected from the demo. The experiment remains isolated for
  mechanics work and must not replace the default showcase.
- The restored default demo now keeps move information visible without requiring
  exact mouse hover, expands ability tooltips with power/critical/displacement data,
  and exposes an in-combat `N` restart shortcut in the header.
- The rejected six-charge range-band opening has been replaced with one ready
  disruptor charge per side. Authored ready/spent state is preserved, enemies prefer
  distinct mirrored engagement targets, and an authored 3v3 test proves exactly two
  opening interrupts, six living Engaged combatants, three distinct enemy targets,
  and a legal melee move for every party member.
- Prototype disruptors retain their 1.6 damage multiplier but now use a restrained
  540 ms presentation with 460 ms contact, an 80 ms aftermath, 90 ms hit-stop,
  7 px shake, and 0.16 flash alpha. Legacy disruptor values are unchanged.
- Vibro-Blade, Twin Vibro-Daggers, Heavy Smash, and Concussive Shove now have
  explicit validator-checked procedural identities. Noise sources use bounded
  deterministic variation and changing buffer offsets. The disruptor synthesis has
  a quieter charge/beam/contact structure. Twin Vibro-Daggers' public procedural
  candidate now translates the approved local recipe into a fast edge sweep and two
  dry broadband contacts without using the owner waveform. It measures `0.4406`
  peak / `0.0502` RMS, retains the exact `120–142 ms` notch, and makes the second
  contact 1.33× stronger by RMS. It is deployed for remote listening; the remaining
  procedural revisions are not developer-approved.
- A clean-room Clip B/reference-craft pass then reduced tonal blade residue, added
  a real silent notch between unequal dagger contacts, moved Heavy Smash weight into
  audible low-mid body, emphasized Concussive Shove's outward-pressure tail, and
  limited each contact to one short reactive consequence. All semantic anchors are
  unchanged. The full direction is in `docs/design/combat-audio-direction.md`;
  the current repository suite passes 134/134 tests across 29 files, but developer
  listening remains the acceptance gate.
- Live combat and replay now share one semantic feedback coordinator. Lunges,
  projectiles, psionic waves, disruptors, flinches, and contact milestones use the
  compositor's hit-stop-aware delta. Reactive audio, popups, flinch, shake, flash,
  death particles, and outcome cues resolve at semantic contact rather than action
  dispatch.
- Restart clears presentation state and invalidates stale enemy callbacks. Replay
  mode suspends the live controller and safely resumes an interrupted enemy turn on
  exit, preventing live effects from leaking into replay.
- The full implementation and verification history is recorded in
  `docs/development/combat-restoration-pass-log-2026-08-22.md`.
- The isolated Godot presentation spike completed its first local runtime and
  capture validation. The developer has now approved a production transition.
  Phase 1 is implemented locally: the canonical `godot/` client consumes a strict
  versioned serializer from authoritative TypeScript battle state and resolves no
  combat. It can replay either the 25-snapshot legacy fixture or the 34-snapshot
  range-band fixture through explicit `--fixture=legacy` and
  `--fixture=range-band` selectors; malformed selectors fail before bridge loading.
- Canonical Godot schedules only pre-resolved action and event semantics through a
  native hybrid audio path. All ten identities retain six-variation procedural
  coverage; four melee and three ranged weapon cues may instead use the strict
  owner-staged licensed bank. Disruptor, Force Shield, and Psionics stay procedural.
  The procedural baseline's original 1.04x Scatter-over-Plasma peak gate remains
  passing.
  Legacy replay accounting is 21 audible / 6 intentional silences; range-band
  remains 20 / 3. The local 10x6 listening harness is green, but developer
  listening, device latency/cancellation/soak, reactive/outcome families, and Web
  evidence remain pending.
- Canonical Godot now implements the exact nine-layer compositor. Layers 01–07
  compose at 960x540, layer 08 samples the actual composed world through one
  full-scene post before the single 1920x1080 upscale, and layer 09 remains outside
  post. Raw/post and physical diagnostic views pass. Isolated Power Melee A/B,
  complete three-role party A/B, and layered Empire A/B harnesses provide
  normal-scale review evidence, but no art is selected, package-ready, or
  runtime-registered and no subjective approval is claimed.
- The live-session foundation now runs as an exported Godot Web combat slice without
  reviving the Canvas client. A transport-neutral version-1 TypeScript host creates
  the direct-engagement combat session, validates legal player actions, advances TypeScript-owned
  AI, resolves authoritative transitions, rejects stale or conflicting duplicate
  messages, safely deduplicates retries, and restarts with monotonic sequence
  numbers. Godot validates the returned view/transition/action menu, presents one
  resolved transition at a time through the canonical compositor, and never decides
  combat. The live menu is now a compact translucent card positioned from the active
  party member, lifted clear of party names/bodies, and hidden during player/enemy
  transitions. Keyboard and pointer actions plus restart were exercised in the export.
  The repository-safe Web package is 38.90 MiB raw / 10.06 MiB gzip-simulated and
  reached its live menu in 533.70 ms on the local desktop test.
- The first canonical battlefield readability pass replaces the flat pillar/grid
  harness look with cached recessed bays, structural ribs, a plated shared deck,
  restrained warm practical light, and soft foreground machinery. Procedural
  combatants now use layered human-scale silhouettes with split stances, armor,
  coats, heads, limbs, and loadout-specific weapon profiles. Live play hides the
  diagnostic card and bridge/audio instrumentation by default while retaining Tab
  access; replay diagnostics are unchanged. The deployed baseline and local revised
  export measured 17.54 ms and 17.53 ms per frame respectively in the same browser
  profile. This is technically verified procedural direction; final authored-asset
  approval and every unintegrated raster candidate remain open.
- The developer positively reviewed that battlefield direction as "way better" and
  requested continued graphics iteration. The next local refinement gives Power,
  Critical, and Queue Control distinct body widths, stances, coats/armor, head
  treatments, weapons, emissive traces, and geometric queue tokens. Party members
  retain practical human heads while opponents use angular masked silhouettes;
  explicit role labels supplement shape and color. The command card was lifted an
  additional 60 design pixels after browser QA found it covering the new role label.
  Warmed Web frame time moved from 17.53 to 17.64 ms (+0.11 ms, approximately
  0.6%), and the opening plus next-actor menus remained clear with zero browser
  warnings/errors. This refinement is local and technically verified; developer
  review of the new silhouettes/tokens and deployment remain open.
- The first authored canonical environment selection is now Imperial layered set A.
  Its exact 1920x1080 far backdrop, sharp stage floor, and transparent foreground
  occluder are promoted into `godot/assets/environment/imperial/`, registered in a
  strict startup-validated manifest, and rendered only in compositor layers 2, 3,
  and 7. The developer selected A for its long central perspective and rejected the
  visually compressed close-corridor direction. Procedural humanoids render at
  0.72 scale; the party occupies a separated rising diagonal while the three
  opponents form a tighter cluster with quieter labels. A native 1280x720 canonical
  capture confirms grounding and hierarchy. The Web export grows from 38.90 MiB to
  41.47 MiB raw, while warmed Web frame time remains unmeasured because the browser
  controller blocked the final localhost reload after the first zero-error visual
  inspection. Developer review of the final combined frame remains open.
- The proposed Godot-first art library now includes corrected golden Hadenman and
  red/rust Shub families; Imperial, Shub, Hadenman, and Mistworld environment
  alternatives; stage-floor and foreground layers; range-band and psi-blocker
  studies; portrait, queue-token, UI, icon, prop, and menu-chrome alternatives; and
  four vivid Hazel/Owen costume directions. The current catalog and transition
  readiness handoff are `art/GODOT-ART-CANDIDATE-CATALOG-v1.json` and
  `docs/development/godot-art-transition-readiness-2026-08-23.md`. All entries remain
  proposed, unselected, and unintegrated.
- The complete exploratory/provenance art library is archived in the private Git
  LFS repository `DaCheeze/deathstalker-rpg-art` at commit `e1a26c4`. Binary files
  below this repository's `art/` path are optional owner-local review inputs and
  Git-ignored; the register, catalog, slice plans, approval state, and compact
  production evidence remain here. Approved runtime derivatives must be promoted
  into engine asset paths and strict manifests rather than force-added from the
  exploratory archive.
- `docs/design/deathstalker-visual-source-index.md` records paraphrased visual
  evidence from lawful publisher samples and five developer-provided local texts.
  It distinguishes explicit source detail, art inference, and project overrides,
  including blonde Owen, golden Hadenmen, and rust-red Shub. The resulting visual
  bible now separates named world/era families, high-key horror, Shub machine
  subtypes, Haden integrated spaces, and mutable Imperial Court states.
- `docs/design/deathstalker-cover-art-visual-review.md` records the paraphrased
  review of ten developer-provided cover scans without storing the copyrighted
  images. Direction-approved transfers are limited to mixed sword/compact-sidearm
  silhouettes, human heroes against overwhelming scale, saturated character blocks,
  practical holsters/boots, aristocratic-versus-repaired material contrast, and
  selective acid-gold/yellow-green danger atmosphere. The cover study also records
  medium-confidence slender dueling-blade and shallow-curved field-saber families;
  Owen will compare original versions of both, while Hazel retains a distinct
  forward-weighted straight-backed industrial vibroblade. Published costumes,
  likenesses, weapons, armor/creatures, typography, borders, logos, poses, and
  compositions remain explicit exclusions.
- `docs/design/owen-combatant-raster-brief-v1.md` translates the proposed Owen
  direction into a Godot-ready character handoff. The long cobalt travel coat is now
  the preferred next-study direction, with a shorter field coat retained as a viable
  readability fallback; restrained steelmesh and one warm-leather luxury accent
  preserve his rangy silhouette. `docs/design/owen-animation-timing-sheet-v1.md`
  defines proposed loop behavior and source-frame weighting aligned to current
  semantic timing without changing bridge authority. The ring-capacitor casing,
  generated art, motion execution, and named-combatant schema remain unapproved.
- `docs/design/hazel-combatant-raster-brief-v1.md` translates the approved Hazel
  direction into a Godot-ready character handoff. A teal-and-ivory industrial field
  kit is the preferred next-study direction, with an emerald-and-cream kit retained
  as a viable comparison; compact black protection, controlled repair/scorch wear,
  and strict warm-color separation preserve her red-haired silhouette.
  `docs/design/hazel-animation-timing-sheet-v1.md` maps four readable melee beats
  into the current three-clip schema, retains the `200 ms` action and `100 ms`
  semantic contact, and documents `60 ms` standard active-delta hit-stop without
  encoding it as duplicate raster frames. Weapon casings, generated art, signature
  choreography, motion execution, and named-combatant schema remain unapproved.
- During the first live review of the canonical range-band Godot replay, the
  developer reported that it was already much better than the custom/Canvas engine
  presentation overall. The developer subsequently selected Godot as the sole
  presentation target; this historical comparison is no longer an active gate and
  does not by itself approve placeholder art, cues, device latency, or Web export.
  `docs/development/godot-hd2d-evaluation-2026-08-22.md` remains the pre-decision
  evidence, while `docs/development/godot-transition-plan.md` and
  `docs/development/godot-transition-pass-log-2026-08-23.md` are the active
  migration records. The dedicated range replay and compositor evidence live in
  `docs/development/godot-range-band-bridge-fixture-2026-08-23.md` and
  `docs/development/godot-nine-layer-compositor-proof-2026-08-23.md`.

## Recovered cloud-chat audit

- A pasted ChatGPT transcript claimed that documentation reconciliation completed as
  commit `54f7c24` and that implementation later began in an isolated worktree on
  `codex/range-band-prototype-implementation`.
- Neither that commit, branch, worktree, nor its alleged code changes are present in
  this clone or its known remote refs as of 2026-08-22. Do not treat the transcript's
  completion claims as repository state.
- The transcript does contain an explicit developer acceptance of the seven bounded
  defaults now recorded in the prototype contract, plus the standing local/cloud/
  hybrid recommendation preference.
- The checked-out `codex/design-reconciliation` branch is at `cf64827`, which adds
  the developer-authored design brief and narrative skill but not the claimed later
  reconciliation or implementation.

## Known verification state

- Build passes.
- Tests pass: 143/143 across 31 files as of 2026-08-23, including live-session
  sequencing/retry/error handling, serializable RNG state, Web-host exposure, range-band authored
  flow, named audio routing/variation, semantic contact scheduling, hit-stop-frozen
  flinch, restart, replay suspension, and the strict Godot presentation bridge.
- Lint exits zero with 0 errors and 0 warnings. Unsafe non-null assertions were
  replaced with typed guards, explicit invariant failures, or structurally safe
  access, and `npm run lint` now enforces `--max-warnings=0`.
- The active canonical Godot scripts pass `--check-only`; bridge, contract,
  procedural-audio, ranged-bank, licensed-bank, range-band, and compositor validators pass. Accelerated legacy
  and range-band replays complete 25/25 and 34/34 snapshots; range-band preserves
  exactly two held interrupts and zero duplicate interrupt-event audio. The
  canonical full-scene captures repeat byte-identically.
- The single-threaded Compatibility Web export now loads the direct-engagement live
  TypeScript session and its authoritative Godot menu without `Advance`. The menu is
  actor-anchored and translucent, disappears during transitions, and moves with the
  next active party member. A clean in-app-browser run measured 533.70 ms from
  engine start to the live scene, advanced player and TypeScript-owned AI actions,
  restarted from sequence 2 to the initial state at monotonic sequence 3, accepted
  pointer input through sequence 5, and retained zero console warnings/errors. The
  warmed HUD frame average was 17.54 ms. The export totals 38.90 MiB raw and 10.06
  MiB under local maximum-gzip simulation; real hosted transfer and multi-browser/
  mobile measurements remain open.
- GitHub Pages deployment `ea5f410` publishes only the verified Godot artifact from
  `gh-pages`. It includes the revised battlefield atmosphere, layered procedural
  combatants, and live-default clean UI from Godot 24. The public URL reached the
  direct-engagement scene, offered melee without `Advance`, completed Twin
  Vibro-Daggers plus the TypeScript-owned AI response, returned a moved legal-action
  card, and retained zero console warnings/errors. The latest cache-busted
  current-profile sample reached the live scene in 3251.60 ms, under the 4-second
  desktop target but not labeled cold because the profile had already loaded shared
  engine assets. The prior measured cold startup remains 4805.70 ms, missing the
  target by 805.70 ms; a subsequent cached canonical load measured 593.70 ms. This
  preview does not yet prove reproducible source-to-artifact CI,
  multi-browser/mobile behavior, or cold-start acceptance.
- GitHub Pages deployment `ff9cee5` publishes the complete ten-beat functional
  opening expedition from the same artifact-only `gh-pages` branch without pushing
  the dirty source branch or `main`. Pages reported `built` for that exact commit.
  A cache-busted Chromium/WebGL 2 load reached `Separation 01/10` in 3,385.10 ms,
  used pointer movement to inspect Owen's supplies, advanced to `Separation 02/10 —
  Imperial death order`, and emitted zero browser warnings or errors. This is a
  remote developer preview; full hosted-route, subjective visual/audio, mobile, and
  reproducible release-pipeline gates remain open.
- The listening harness passes all six script checks plus its 60-selection validator
  and scheduler smoke, with 42 licensed and 18 procedural selections when the local
  bank is staged. The Power Melee harness passes structural review and its
  strict package gate exits 3 as designed with seven blockers. The complete party
  harness passes script check, import, exact six-source/two-background validation,
  matte/diagnostic smokes, and three native 1920x1080 captures. The layered Empire
  harness passes five script checks, import, strict source/compositor validation,
  and A-post/B-raw smokes. The combatant-raster package validator remains 21/21.
- The range-band party review now includes a fifth resolved-timeline motion view.
  Choice A and Choice B run side-by-side through the same hash-pinned 34-frame,
  25.75-second bridge replay with contact-gated state reveal, advance interpolation,
  restrained anchor-preserving whole-raster poses, and abstract opponent markers.
  Script check, validation, three scene smokes, final 1920×1080 stills, a 194-frame
  4× MP4, build, zero-warning lint, and 134/134 tests pass. This remains comparison
  evidence over one keyframe per combatant, not animation coverage, a selected
  motion pipeline, art approval, or canonical integration.
- The Gemini comparison tool passes its five focused tests and completed its live
  two-clip workflow with a developer-supplied key that was not stored in the
  repository. The generated report is materially inconsistent about timestamps and
  source descriptions; retain it as raw secondary evidence, not an implementation
  specification.
- Node 24.19.0 is the supported local and CI runtime. Project commands run normally
  outside the managed Windows sandbox; the sandbox-only `uv_os_get_passwd returned
  ENOMEM` startup failure remains an environment limitation.
- Full balance check: failed identically on two repeated runs, 14 metrics out of
  band at 500 iterations for seeds 12345 and 98765.
- The post-prototype full balance check retained the same recorded result:
  `BALANCE CHECK FAILED: 14 metrics out of band.` Recommended-level completion was
  100.0% for both seeds. The prototype fixture is isolated from legacy run inputs.
- The simplified-surface/disruptor follow-up retained that same legacy baseline:
  `BALANCE CHECK FAILED: 14 metrics out of band.` Recommended-level completion was
  100.0% for both seeds; the prototype-only 1.6 multiplier does not enter legacy
  run simulations.
- Local browser verification exercised Ranged to Closing interrupts, permanent
  ready/spent state, targeted Engaged entry, melee gating, distinct queue glyphs,
  and the three loadouts with no console warnings or errors. Developer feel review
  remains outstanding.
- The lint-cleanup balance check on 2026-08-22 retained that baseline: `BALANCE
  CHECK FAILED: 14 metrics out of band.` Recommended-level completion remained
  100.0% for both seeds, with no balance targets or gameplay values changed.
- The final combat-restoration balance check retained the same result: `BALANCE
  CHECK FAILED: 14 metrics out of band.` Recommended-level completion was 100.0%
  for seeds 12345 and 98765 against the 85-90% target. No failure count changed.
- Final production-build browser verification exercised default tooltips and Force
  Shield, click/N restart, stale-timeout cancellation, replay suspend/resume,
  range-band advance/interrupt/engage/melee, and a named Vibro-Blade action. The
  browser console contained 0 warnings and 0 errors. Subjective listening and feel
  review remain outstanding.
- Recommended-level completion is 100% for both seeds; the game is currently far
  easier and less attritional than its targets.
- The first studio-agent pilot diagnosed encounter-pressure collapse plus several
  measurement defects; see `docs/development/balance-diagnosis-2026-08-22.md`.
- Action-cap handling, replay initial-state capture, input provenance, two-seed
  pacing assertions, percentage conversion, no-data status, and boost-exit policy
  ordering are corrected. No targets or gameplay values changed.
- Cloud autonomy boundaries are encoded in `docs/development/agent-workflow.md`.
- Do not add balance checking to deployment until the baseline is green.

## Open work

1. Developer-review the three-pass opening graphics comparison and then the
  complete source-reconciled route in the real Godot build:
  Standing approach and supply inspection, route reversal, concealed escape and
  private flyer, shootdown and windbreak last stand, Hazel's pod impact/rescue,
  flight to the lake, lake regroup, hidden-yacht departure, and temporary safety.
  Confirm subjective landmark readability, pacing, audio feel, and source
  recognition. The technical browser audit already completed the route, proved
  control transfer and persistence, and found zero browser warnings/errors. The
  authority seam, deterministic transcript, Web export, and native capture path
  exist; final raster location art, dialogue, next destination, and combat tuning
  remain later production work rather than opening-functionality blockers.
2. Use the open 10×6 Godot listening harness to compare the seven owner-staged
   weapon replacements against the procedural baseline, while also reviewing the
   procedural Disruptor, Force Shield, and Psionics, on headphones and ordinary
   speakers. Automated/runtime verification is not subjective acceptance.
3. Decide whether restart must cancel already-scheduled Godot device buffers and
   review wall-time-versus-hit-stop audio behavior.
4. Review and accept the strict bridge/TypeScript authority boundary, dual-fixture
   replay, true full-scene post architecture, and UI-outside-post contract.
5. Add a deliberate exported-build fault-injection smoke so retry/error UI recovery
   is proven in the Web runtime, then cover touch input and a complete encounter.
6. Define round and HP-attrition telemetry, reconcile the failure-distribution
   target, and decide wider-campaign disruptor semantics before tuning encounter
   pressure.
7. Run `experiments/godot-range-band-party-art-review/` and select—not merely
   generate—the complete party A or B branch, or explicitly request a newly authored
   mixed branch. Imperial environment A is selected and canonically integrated;
   next select the vivid principal wardrobe branch and portrait language. Then choose
   a motion pipeline and convert the selected combatants into complete anchored
   animation packages before any canonical runtime registration.
8. After listening approval for the ten current families, add reactive/outcome
   families and measure audible-device latency, cancellation, and sustained Web
   behavior. Official Godot 4.7.2 Web templates are installed locally; reproducible
   template provisioning and hosted browser coverage remain release-pipeline work.

## Working tree

The handoff, Pass 19, chat recovery, and range-band prototype work are intentionally
uncommitted. Always inspect `git status` for the authoritative current file list; do
not duplicate it here.
