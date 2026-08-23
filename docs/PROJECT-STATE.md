# Project State

Updated: 2026-08-23

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
- The next mechanics target is the bounded three-character range-band prototype in
  `docs/design/three-character-range-band-prototype.md`. It uses per-combatant bands,
  targeted engagement, one ready/spent disruptor charge, and a held-charge interrupt
  against advance into Closing. Defense layers, Boost, esper, vocations, persistence,
  and numerical tuning are excluded from this experiment only.

## Current implementation

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
- Licensed `vibro_blade` now uses three standard `Sword_Slice` sources instead of
  the former knife-slice sources. Their strongest windows align to the unchanged
  `100 ms` melee contact, while `twin_vibro_daggers` deliberately retains the
  lighter knife sources and two-contact notch. Technical validation passes;
  developer listening approval remains open.
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
- The prior Canvas GitHub Pages build at
  <https://dacheeze.github.io/deathstalker-rpg/> is historical and is no longer the
  active game client. Automatic Pages deployment is disabled until a Godot Web
  release pipeline is approved.
- Pull requests and `main` pushes run build, lint, and tests without deploying a
  presentation client.
- The former browser routes are frozen historical implementation evidence. The
  bounded three-character prototype's active presentation surface is Godot.
  It uses anonymous Power, Critical, and Queue Control melee loadouts against three
  mirrored anonymous opponents. Ranged/Closing/Engaged state, targeted engagement,
  advance-only movement, queue-order held interrupts, permanent ready/spent charge,
  melee gating, re-engagement after a target falls, and queue displacement preview
  are implemented without changing legacy run simulations.
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
  a quieter charge/beam/contact structure. Developer listening has not accepted
  these revisions yet.
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
- The first live-session foundation is implemented without reviving the Canvas
  client. A transport-neutral version-1 TypeScript host now creates the range-band
  session, validates legal player actions, advances TypeScript-owned AI, resolves
  authoritative transitions, rejects stale or conflicting duplicate messages,
  safely deduplicates retries, and restarts with monotonic sequence numbers. Its RNG
  cursor is serializable. A replaceable Web adapter bundles to 51.21 kB raw / 14.47
  kB gzip, a custom Godot Web shell loads it before the engine, and the Godot-side
  Web client validates response envelopes. Canonical scene input/presentation
  wiring and a complete Godot Web export remain open.
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
- Tests pass: 142/142 across 31 files as of 2026-08-23, including live-session
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

1. Use the open 10×6 Godot listening harness to compare the seven owner-staged
   weapon replacements against the procedural baseline, while also reviewing the
   procedural Disruptor, Force Shield, and Psionics, on headphones and ordinary
   speakers. Automated/runtime verification is not subjective acceptance.
2. Decide whether restart must cancel already-scheduled Godot device buffers and
   review wall-time-versus-hit-stop audio behavior.
3. Review and accept the strict bridge/TypeScript authority boundary, dual-fixture
   replay, true full-scene post architecture, and UI-outside-post contract.
4. Connect canonical Godot input to the live Web session client, present returned
   transitions through the existing compositor, and prove restart/retry/error
   recovery inside an exported Godot Web build.
5. Define round and HP-attrition telemetry, reconcile the failure-distribution
   target, and decide wider-campaign disruptor semantics before tuning encounter
   pressure.
6. Run `experiments/godot-range-band-party-art-review/` and select—not merely
   generate—the complete party A or B branch, or explicitly request a newly authored
   mixed branch. Separately select the first background/layer branch, vivid principal
   wardrobe branch, and portrait language. Then choose a motion pipeline and convert
   the selected combatants into complete anchored animation packages before any
   canonical runtime registration.
7. After listening approval for the ten current families, add reactive/outcome
   families and measure device latency and Web behavior. Matching Godot 4.7.2
   export templates are currently absent.

## Working tree

The handoff, Pass 19, chat recovery, and range-band prototype work are intentionally
uncommitted. Always inspect `git status` for the authoritative current file list; do
not duplicate it here.
