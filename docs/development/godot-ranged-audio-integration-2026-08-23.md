# Godot Ranged Audio Integration — 2026-08-23

Status: **implemented and deterministically verified; developer listening, device
behavior, and Web audio remain unapproved and unmeasured.**

## Outcome

The isolated Particle Carbine, Scatter Shot, and Plasma Burst synthesis bank is now
a canonical Godot consumer. ProceduralCombatAudio owns semantic support, routing,
variation sequence, timing metadata, and playback; it delegates only ranged PCM
rendering to godot/scripts/audio/ranged_cue_bank.gd. The TypeScript core and bridge
remain authoritative, and no combat outcome is resolved in GDScript.

Canonical Godot now renders ten named file-free cue families with six deterministic
variations each:

- Vibro-Blade
- Twin Vibro-Daggers
- Heavy Smash
- Concussive Shove
- Disruptor
- Force Shield
- Psionics
- Particle Carbine
- Scatter Shot
- Plasma Burst

Unsupported valid semantics remain explicit silence. No generic fallback, audio
binary, dependency, gameplay value, bridge schema, or fixture content was added.

## Ranged hierarchy repair

The weakened Scatter-over-Plasma peak check was restored from merely greater-than
Plasma to the original 1.04x minimum. Scatter received one explicit
SCATTER_AUTHORITY_GAIN of 1.06 before the bank's existing output stage.

The complete three-cue validator passed all six variations and duplicate renders.
The narrowest Scatter-over-Plasma peak ratio is variation 1:

- Scatter peak: 0.55962
- Plasma peak: 0.52085
- ratio: 1.07444x
- requirement: greater than 1.04x

The highest ranged peak is Scatter variation 3 at 0.63139, below the bank's
0.6801 validation ceiling. Fixed semantic contacts remain Particle 250 ms,
Scatter 210 ms, and Plasma 250 ms.

## Canonical routing and replay evidence

godot/scripts/procedural_combat_audio.gd exposes the three exact bridge cue IDs
and loads the ranged bank fail-loudly. The isolated listening harness injects the
same live bank source, avoiding a synthesis fork.

Measured replay results:

- legacy fixture: 25/25 snapshots, 21 rendered cues, 6 intentional silences,
  21 variation steps;
- range-band fixture: 34/34 snapshots, 20 rendered cues, 3 intentional silences,
  two held interrupts, and zero duplicate interrupt-event audio.

The range-band fixture has no ranged action, so its accounting correctly remains
unchanged.

## Listening harness

experiments/godot-combat-audio-listening-harness/ now exposes ten cue buttons,
keys 1–9 plus 0, six exact variation buttons, and a full 60-step matrix.
Particle, Scatter, and Plasma labels describe their gesture/material/consequence
stories and explicit failure modes.

Measured headless results:

- all six harness GDScripts passed --check-only;
- structural validator: 10 cues, 6 variations, 60 selected renders, 60 plan steps;
- scene scheduler smoke: 10 UI cues, 6 variations, 60 selected renders, 60
  scheduled steps;
- output remained suppressed for both automated routes.

These checks do not establish audible quality.

## Art-catalog reconciliation

The Godot review catalog now contains 35 candidate families:

- 14 candidate_after_approval;
- 9 needs_animation_package;
- 9 needs_slicing;
- 3 reference_only.

The stale Power Melee v1 catalog entry was replaced with the normalized 1024 x 1536
RGBA v2 A/B pair. Current Critical Melee and Queue Control Melee A/B idle studies
were added as separate needs_animation_package records with existing review
sheets and measured alpha bounds.

All six current role studies retain 180 pixels of bottom padding. They remain
unselected single-pose concepts: no shared battle scale, approved anchor, sockets,
complete clips, atlas, package metadata, runtime manifest, canonical placement, or
subjective approval is claimed.

## Verification

Environment: pinned Node 20.20.2 and Godot 4.7.2 stable.

- all 13 canonical Godot GDScripts passed --check-only;
- all six listening-harness GDScripts passed --check-only;
- ranged cue validator exited 0;
- canonical ten-cue audio validator exited 0;
- bridge fixture, bridge contract, range-band fixture, and compositor validators
  exited 0;
- both canonical accelerated replay smokes exited 0;
- TypeScript plus Vite production build exited 0 with 40 modules;
- ESLint exited 0 with no diagnostics;
- Vitest passed 29 files / 134 tests;
- combatant-raster validator self-test passed 21/21;
- the updated art catalog parsed successfully.

The Vite build retained the existing node:fs and node:path browser
externalization notices for src/sim/balanceCheck.ts. No balance check was required
because this pass changed no core mechanics, game data, simulation policy,
progression, or balance.

## Approval still open

The developer must audition all ten families on headphones and ordinary speakers.
In particular, confirm that Particle does not read as a smooth generic laser,
Scatter owns the routine ranged peak without becoming harsh, and Plasma feels
heavier and more unstable than Particle. Audible contact synchronization, device
latency, cancellation, crackle/underruns, soak behavior, and Godot Web output remain
open.

The art next gate is developer selection of a branch, followed by one complete
anchored animation package. No candidate was selected or integrated in this pass.

No commit or push was made.