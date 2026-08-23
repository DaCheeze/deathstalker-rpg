# Combat Restoration Pass Log

Updated: 2026-08-22

## Purpose

This is the durable record of the combat-feel recovery work that followed the
developer's rejected range-band and audio reviews. It records each bounded pass,
the evidence used, files changed, verification run, and anything that still needs
developer judgment. A pass is not called accepted until its stated review gate is
actually completed.

## Working rules

- Preserve the default legacy showcase while the opt-in range-band experiment is
  repaired at `?mode=range-band`.
- Treat developer play and listening review as the acceptance authority for feel.
- Use Gemini clip analysis only as secondary evidence. Do not implement its
  timestamp claims or synthesis recipes without corroboration.
- Keep audio procedural Web Audio with no audio files or new dependencies.
- Report measured results and known failures; do not turn skipped review into an
  estimate.

## Pass 0 - Evidence recovery and failure isolation

Status: complete as an audit; no combat or synthesis values changed in this pass.

### Developer-reported failures

- The range-band party could be damaged repeatedly before melee became available.
- Six ready charges created an opening interrupt cascade and disruptors felt far too
  dominant.
- The simplified prototype removed expected information and the legacy force-shield
  option, making it unsuitable as the main demo.
- Weapon sounds felt generic and repetitive, with little satisfying distinction
  between moves.

### Evidence recovered

- The default route was restored as the showcase. The range-band experiment remains
  isolated behind `?mode=range-band`.
- The default demo exposes `N` to restart and keeps expanded move information
  visible. Force shields still exist in legacy combat; their absence is an explicit
  range-band prototype exclusion.
- Local FFmpeg analysis confirmed that the two supplied clips contain stereo AAC
  audio at 48 kHz. Clip A has dense repeated broadband transients through most of
  its fight; Clip B has much longer quiet stretches and sparser transient clusters.
- The generated Gemini report contains material timestamp and source-description
  contradictions. It is retained as raw secondary evidence in
  `docs/development/gemini-combat-comparison.md`, not as an implementation spec.
- Code inspection found four corroborated audio problems: one reusable noise buffer
  always starts at offset zero; multiple named abilities route to the same family
  cue; Twin Vibro-Daggers has no deliberate second strike; and audio starts at
  action dispatch instead of sharing visual contact timing.
- Code inspection also disproved claims that every attack uses one envelope or that
  blade, blunt, disruptor, shield, UI, and outcome cues lack separate synthesis
  graphs.

### Files and artifacts

- Added the comparison workflow and documentation:
  `scripts/gemini-media-compare.ts`,
  `scripts/run-gemini-media-compare.mjs`,
  `docs/development/gemini-audiovisual-review.md`, and
  `tests/audio/geminiMediaCompare.test.ts`.
- Generated the raw report at
  `docs/development/gemini-combat-comparison.md`.
- Generated local, gitignored FFmpeg analysis artifacts under
  `.gemini/audio-analysis/`.

### Verification

- `npm run verify:quality`: passed after the comparison-tool pass.
- Build: passed.
- Lint: passed with 0 errors and 0 warnings.
- Tests: passed, 84/84.
- Focused combat audio routing tests: passed, 6/6.

### Result and next gate

The reliable implementation priorities are: remove the automatic opening cascade,
give each named melee move a recognizable signature, vary procedural transients,
and tie audible impact to visible contact. Subjective improvement remains untested
until the developer listens to the revised build.

## Pass 1 - Range-band opening pressure and restart recovery

Status: implemented with automated and browser verification; developer feel review
is pending.

### Changes

- Replaced six opening charges with one ready charge per side. The fastest loadout
  on each side starts at CHARGE; the other four combatants visibly start SPENT.
  `initBattle` now preserves an authored ready/spent value instead of always
  rearming every prototype combatant.
- Changed range-band enemy engagement policy to prefer its mirrored living target
  when unclaimed, then any unclaimed living target, and only then focus an already
  claimed target. This removes the deterministic three-enemy dogpile on the
  already-wounded 90-HP loadout.
- Added an authored-fixture flow test that drives the real 3v3 queue and enemy AI
  through both advances. It asserts exactly two interrupts, three distinct enemy
  engagement targets, six living Engaged combatants, and a legal melee option for
  every party member.
- Kept the 1.6 prototype damage multiplier, but added a prototype-only presentation
  profile: the visual sequence is 540 ms instead of 810 ms, with contact at 460 ms
  and only an 80 ms aftermath; hit-stop is 90 ms
  instead of 190 ms, shake is 7 px for 220 ms instead of 15 px for 380 ms, and the
  flash uses 0.16 alpha for 140 ms instead of 0.4 alpha for 220 ms. Legacy
  disruptor presentation values are unchanged.
- Made the center `RESTART [N/CLICK]` header control clickable even during enemy
  processing. Space now matches the end-overlay promise and advances after victory
  or defeat.
- Restart now clears beams, projectiles, lunges, flinches, popups, screen shake,
  flash, hit-stop, and the action banner. A generation token prevents an enemy turn
  scheduled by the old encounter from firing inside the restarted encounter.

### Files

- Mechanics/data: `src/core/battle.ts`, `src/core/ai.ts`,
  `src/core/validator.ts`, and `src/data/range-band-prototype.json`.
- Presentation/input: `src/render/drawFx.ts`,
  `src/render/drawCombatants.ts`, `src/render/drawUI.ts`,
  `src/render/feedbackConfig.ts`, and `src/ui/battleController.ts`.
- Tests: `tests/core/rangeBandPrototype.test.ts`,
  `tests/core/rangeBandEncounter.test.ts`, and
  `tests/render/disruptorFeedbackConfig.test.ts`.
- Contract: `AGENTS.md` and
  `docs/design/three-character-range-band-prototype.md`.

### Verification

- Range-band focused tests: passed, 7/7 across the rules and authored-flow files.
- A production-build browser playthrough advanced all three party members from FAR
  to NEAR, entered targeted MELEE, exposed legal named melee moves, and kept all
  three party members alive. Only the Critical loadout on each side began with
  CHARGE; every other opening label showed SPENT.
- The repaired opening produced one enemy interrupt against the party's Critical
  loadout rather than an all-party opening cascade. The party reached melee at
  120/120, 55/90, and 140/140 HP in the observed run.
- Header click restart returned an altered turn-2 state to turn 1, restored HP, and
  removed the active shield. Restarting immediately after Pass left the game on
  turn 1 after the discarded enemy timeout elapsed.
- Browser console: 0 warnings and 0 errors on the default and range-band paths.
- Developer feel review: pending; this pass is not yet accepted.

## Pass 2 - Named attack identities and transient variation

Status: implemented and automatically verified; developer listening is pending.

### Changes

- Replaced shared family routing for the four prototype melee moves with explicit,
  validator-checked profiles: `vibro_blade`, `twin_vibro_daggers`, `heavy_smash`,
  and `concussive_shove`. Generic `blade` and `blunt` remain valid fallbacks for
  future or legacy data.
- Vibro-Blade now has one swing, a quiet sawtooth motor, a low body contact, and one
  short metallic ring centered on the 100 ms lunge contact.
- Twin Vibro-Daggers now has two light contacts at 85 ms and 145 ms with different
  filter centers and ring pitches. It no longer plays one generic blade cue.
- Heavy Smash now has a muted wind-up followed by lowpass impact noise, a mid-low
  body, and a distinct 112-to-40 Hz sub fall.
- Concussive Shove now uses a short midrange contact and an airy rising pressure
  tail, deliberately omitting Heavy Smash's sub layer.
- Added a deterministic six-step variation table bounded to small pitch, filter,
  and decay changes. Impact anchors and gain levels do not move.
- Every reusable noise source now starts at a changing golden-ratio phase within
  the existing one-second procedural buffer instead of replaying sample zero on
  every attack.
- Rebuilt the disruptor cue as a restrained charge, narrower two-voice beam, and one
  compact impact. Its former `0.65` sub plus `0.45` crunch combination is now a
  `0.28` sub, `0.18` crunch, and `0.09` short crack before the existing master gain.
  This is a structural level reduction, not a claim of approved loudness.

### Files

- `src/audio/cueVariation.ts`
- `src/audio/combatAudioCue.ts`
- `src/audio/synth.ts`
- `src/core/types.ts`
- `src/core/validator.ts`
- `src/data/abilities.json`
- `tests/audio/cueVariation.test.ts`
- `tests/audio/combatAudioCue.test.ts`
- `tests/core/validator.test.ts`

### Verification so far

- Pass 2 focused routing, variation, and validation tests: passed, 16/16.
- Full suite at the end of the isolated audio edit: passed, 92/92.
- Build: passed.
- Lint: passed with 0 errors and 0 warnings.
- Developer listening: pending. These sounds are implemented, not yet accepted.

## Pass 3 - Shared audio/visual contact timing

Status: implemented with automated and browser verification; developer listening
review is pending.

### Changes

- Added one pure semantic presentation timeline for melee contact, projectile
  contact, psionic contact, disruptor beam start, and disruptor contact. It advances
  from the compositor's active elapsed time, freezes at zero delta during hit-stop,
  emits each milestone once, and has explicit reset behavior.
- Converted lunges, projectiles, psionic waves, and disruptor sequences to use the
  same compositor delta instead of mixing wall-clock time, frame count, and delta
  time. Effect creation now returns stable tokens that the shared timeline tracks.
- Added a shared live/replay feedback coordinator. Both controllers now use the
  same action-to-effect path instead of maintaining two diverging copies.
- Damage popups, flinch, shield-shatter feedback, crit/disruptor hit-stop, screen
  shake, impact flash, death particles, reactive impact audio, and victory/defeat
  audio now resolve at the matching semantic contact rather than at action
  dispatch.
- Named melee synthesis keeps its audible contact at the 100 ms lunge midpoint.
  The rebuilt disruptor keeps charge and beam onset at 220 ms and audible/visual
  target contact at 460 ms. Projectile and psionic reactive feedback use their
  configured travel boundaries.
- Held interrupts use the reacting combatant as the disruptor beam origin and start
  that reactor's charge cue when the interrupt is emitted. Direct disruptor actions
  do not double-play their action cue.
- Encounter restart, replay load/scrub/backstep, and live/replay mode changes clear
  the timeline and all pending feedback. Replay MAX speed suppresses feedback as it
  did before.
- Flinch progression now uses the same hit-stop-aware compositor delta. It no longer
  expires on wall time while the rest of an impact is frozen.
- Entering replay now suspends the live controller, invalidates a queued enemy
  callback, and ignores underlying live input. Leaving replay safely reschedules an
  interrupted enemy turn instead of leaking live audio/effects into replay.
- Fixed prototype flash alpha so the configured 0.16 value is actually honored by
  Canvas drawing rather than replaced with a hardcoded 0.4 alpha.

### Files

- Timeline/render clocks: `src/render/combatFeedbackTimeline.ts`,
  `src/render/drawFx.ts`, `src/render/compositor.ts`, `src/render/canvas.ts`, and
  `src/render/feedbackConfig.ts`.
- Shared orchestration: `src/ui/combatFeedbackCoordinator.ts`,
  `src/ui/battleController.ts`, `src/ui/replayController.ts`, and `src/main.ts`.
- Tests: `tests/render/combatFeedbackTimeline.test.ts`,
  `tests/render/combatantFeedbackTimeline.test.ts`,
  `tests/ui/battleControllerSuspension.test.ts`, and
  `tests/ui/combatFeedbackCoordinator.test.ts`.

### Verification

- Final timing/suspension focused tests: passed, 17/17.
- Full suite after integration and audit fixes: passed, 109/109 across 27 files.
- Build: passed.
- Lint: passed with 0 errors and 0 warnings.
- `git diff --check`: passed; existing line-ending notices remain non-failing.
- Browser exercised default live combat, click restart, a queued-enemy restart,
  range-band advance/engage/melee, and live-to-replay suspension/resumption against
  the production build. The replay remained stable beyond the discarded timeout,
  then the enemy turn resumed on exit. Console: 0 warnings and 0 errors.
- Developer listening remains pending. Synchronization is implemented and runtime-
  verified, not yet accepted as satisfying.

### Known boundary

Authoritative battle state still applies deterministically when an action is
dispatched. This pass synchronizes the visible and audible impact feedback; it does
not introduce a second delayed presentation copy of HP or KIA state. If early HP-bar
or death-state updates remain noticeable in developer review, that needs a separate
presentation-state pass rather than delaying or mutating core resolution.

Three audio timing boundaries remain for later work:

- Psionic synthesis currently finishes around 200 ms while the visual ripple
  contacts at 320 ms. It still needs a deliberate cast/contact split.
- Reset clears visual and semantic scheduling, but Web Audio nodes already scheduled
  on its independent clock cannot currently be canceled. Restarting during a
  disruptor can therefore leave its scheduled tail audible.
- Web Audio uses wall time. If a new action is accepted during an existing hit-stop,
  an internally scheduled cue can move ahead of a delta-frozen visual. Normal direct
  and held disruptors do share the intended 460 ms contact anchor and do not
  double-play.

## Pass 4 - Full regression and review handoff

Status: automated and browser gates complete; developer listening/feel acceptance
is pending.

### Final regression evidence

- `npm run verify:quality`: passed.
- Production build: passed. Vite retained its existing non-failing `node:fs` and
  `node:path` browser-externalization notices from the balance module.
- Lint: 0 errors and 0 warnings.
- Tests: 109/109 passed across 27 files.
- Full two-seed balance check completed and retained the known baseline failure:
  `BALANCE CHECK FAILED: 14 metrics out of band.` Recommended-level completion was
  100.0% for seed 12345 and 100.0% for seed 98765 against the 85-90% target. This is
  unchanged; the range-band fixture remains isolated from legacy simulations.
- Final browser console inspection: 0 warnings and 0 errors.
- `git diff --check`: passed; existing line-ending conversion notices remain.

The production preview was used for final browser verification. An earlier Vite dev
watch process stopped with Windows `EBUSY` while watching an existing background
master PNG; that was a file-watcher/environment failure, not a game console error.

### Developer listening route

Use `http://127.0.0.1:5173/?mode=range-band` with sound on:

1. Confirm that only the Critical loadout begins at CHARGE and that the one held
   interrupt reads as a restrained warning/contact beat, not the whole encounter.
2. Advance each survivor into MELEE. With Critical Melee, alternate Vibro-Blade and
   Twin Vibro-Daggers and check that one cut versus two quick contacts is obvious.
3. With Power Melee, alternate Heavy Smash and Concussive Shove and check that the
   first has a low body/sub impact while the second has a midrange pressure push.
4. Use restart during a disruptor once. Note whether its already-scheduled tail is
   objectionable; this is a known reset limitation.
5. Rate each pair for identity, repetition, contact sync, loudness, and satisfaction.
   Subjective acceptance remains with the developer.

### Related engine evaluation

The parallel Godot evaluation evidence and original go/no-go gates are recorded in
`docs/development/godot-hd2d-evaluation-2026-08-22.md`. The developer subsequently
approved a staged Godot transition on 2026-08-23; that later decision is tracked in
the dedicated Godot transition plan and pass log.

## Pass 5 - Reference-driven melee audio revision

Status: implemented and structurally verified; developer listening is pending.

### Evidence and direction

- Local FFmpeg analysis of the supplied reference fight (`Clip B`) showed a sparser
  mix than the current fight: more silence and headroom around short gestures, but
  stronger isolated peaks. Its blade events were compact and followed a useful
  bright-to-low spectral arc. It was not a differentiation reference because the
  captured Vibro-Blade and Twin Vibro-Daggers reused essentially the same old cue.
- External games were used only as clean-room craft references for readable attack
  buildup, material-specific weapon identity, mix priority, and shared grammar plus
  a move-specific signature. No sounds were copied, sampled, traced, or added as
  files.
- The resulting physical-first direction, measurements, anti-references, and move
  matrix are recorded in `docs/design/combat-audio-direction.md`.

### Changes

- Vibro-Blade now leads with a broad 0.9-to-4.8-to-1.8 kHz noise gesture and a
  stronger contact body. Its foreground saw motor changed from `0.08` to `0.045`
  (about -5.0 dB) and its ring from `0.12` to `0.065` (about -5.3 dB), while the
  existing 100 ms semantic contact anchor remains unchanged.
- Twin Vibro-Daggers retains contacts at 85 ms and 145 ms. The first contact now
  fully ends by roughly 118 ms at maximum bounded variation, leaving more than
  27 ms of true separation; the second contact is deliberately stronger and longer.
- Heavy Smash moves its weight into audible low-mid body (`0.14` to `0.26`) and
  reduces sub-only dependence (`0.35` to `0.14`). Concussive Shove reduces its body
  (`0.17` to `0.09`) while strengthening and lengthening the outward pressure tail
  (`0.13` to `0.20`, approximately 110 ms to 170 ms).
- A damage contact now emits at most one short reactive consequence cue. Death takes
  priority over shield shatter and critical accents, avoiding a second full-sounding
  attack at one contact. The crit accent was shortened from about 140 ms to 55 ms
  and reduced from `0.40` to `0.13`.
- The cue design table is exported beside the immutable contact anchors so tests can
  guard the intended silhouettes and the minimum dagger notch.

### Files and verification

- Changed synthesis/routing: `src/audio/synth.ts`,
  `src/audio/cueVariation.ts`, and `src/audio/combatAudioCue.ts`.
- Changed tests: `tests/audio/cueVariation.test.ts` and
  `tests/audio/combatAudioCue.test.ts`.
- Focused audio tests: 13/13 passed.
- Full suite: 112/112 passed across 27 files.
- Type-check: passed. Production build: passed with only the existing non-failing
  Vite `node:fs`/`node:path` browser-externalization notices.
- Lint: 0 errors and 0 warnings. `git diff --check`: passed.
- Browser route loads at `?mode=range-band`; subjective timbre and satisfaction
  remain explicitly unapproved until the developer listens locally.

## Pass index

| Pass | Scope | Status | Acceptance gate |
|---|---|---|---|
| 0 | Evidence recovery and failure isolation | Complete | Audit evidence recorded |
| 1 | Range-band opening pressure | Runtime-verified; feel review pending | Developer play review |
| 2 | Named attack identities and transient variation | Implemented; review pending | Tests and developer listening |
| 3 | Shared audio/visual contact timing | Runtime-verified; listening pending | Developer listening |
| 4 | Full regression and handoff | Complete except subjective review | Developer acceptance of feel/audio |
| 5 | Clean-room reference-driven melee revision | Structurally verified; listening pending | Developer listening in browser and Godot audition paths |
