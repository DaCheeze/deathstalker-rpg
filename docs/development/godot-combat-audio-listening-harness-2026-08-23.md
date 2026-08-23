# Godot Combat Audio Listening Harness — 2026-08-23

## Outcome

An isolated Godot-native listening/review harness now exposes the five existing
production procedural cues — Vibro-Blade, Twin Vibro-Daggers, Heavy Smash,
Concussive Shove, and Disruptor — across all six deterministic variations.

The project lives entirely under
experiments/godot-combat-audio-listening-harness/. It dynamically loads the live
godot/scripts/procedural_combat_audio.gd implementation rather than copying or
changing synthesis. No canonical Godot scene, bridge fixture, TypeScript bridge,
core, gameplay, data, dependency, or audio file changed for this pass.

## Review route

- Keys 1–5 and labeled buttons select one of the five cues.
- Left/Q, Right/E, and labeled buttons select variations 1–6.
- Space/Enter replays the exact selection.
- A plays the selected cue across all six variations.
- F plays the ordered 5 × 6 matrix.
- S cancels queued playback and the active review; R also restores cue 1,
  variation 1; M toggles mute.
- Automated playback includes 400 ms dry gaps between variations and 850 ms
  between cue families.
- Labels expose production timing plus the intended material read and explicit
  failure modes from the combat-audio direction.

The default harness output is -9 dB with an on-screen -24 to 0 dB control.
Selection itself is silent. Exact variation playback performs suppressed,
synchronously discarded pre-roll against the live production sequence before
queuing the requested variation.

## Measured checks

Environment: Godot 4.7.2.stable.official.ed1daf0bf, production mix rate 48 kHz.

Every one of the six harness GDScripts passed an explicit --check-only run:

- exact_variation_player.gd
- listening_harness_checks.gd
- main.gd
- production_audio_source.gd
- review_catalog.gd
- validate_listening_harness.gd

The standalone structural validator exited 0 and reported:

    [Combat Audio Listening Harness] STRUCTURAL PASS cues=5 variations=6 selected_renders=30 plan_steps=30 dry_gap=0.40 family_gap=0.85 output_suppressed=true source=F:/RPG v1/godot/scripts/procedural_combat_audio.gd

The complete headless main-scene smoke ran the actual full review scheduler at an
accelerated time scale, exited 0, and reported:

    [Combat Audio Listening Harness] SCENE SMOKE PASS ui_cues=5 ui_variations=6 selected_renders=30 scheduled_steps=30 output_suppressed=true

Both routes also passed the live production deterministic render checks: five
cues × six variations, sample-identical repeated renders, correct frame counts,
finite/non-silent buffers, bounded semantic contacts, the exact dagger notch, and
the Disruptor charge/beam/contact structure. The harness-specific pass additionally
proved 30 unique ordered cue/variation selections, exact sequence positioning,
400/850 ms review-gap policy, all 30 steps through the UI scheduler, cleared
pending frames after stop, and no headless AudioStreamPlayer creation.

Repository gates used the pinned Node 20.20.2 executable rather than the system
Node 24 runtime:

- TypeScript build plus Vite production build exited 0; Vite transformed 40
  modules. Existing node:fs and node:path browser-externalization notices were
  emitted for src/sim/balanceCheck.ts.
- ESLint exited 0 with no diagnostics.
- Vitest passed 29 files and 134 tests.
- A focused harness scan found no audio binaries or native dependency files and no
  trailing whitespace. Repository git diff --check exited 0, with existing LF to
  CRLF working-copy warnings reported separately by Git.

## Approval still pending

Subjective listening remains developer approval. The headless evidence makes no
claim that the cues sound good, distinct, physical, correctly weighted, satisfying,
or properly mixed on headphones or ordinary speakers.

Real-device latency, audible contact synchronization, operating-system/device
cancellation, crackle/underruns, drift, sustained review soak, and Web-export
behavior were not measured. The on-screen timeline shows authored buffer
coordinates, not audible driver onset. The 400/850 ms gaps are review spacing, not
gameplay timing.

The runtime source loader intentionally depends on the current repository-relative
layout. This keeps the harness on the production implementation, but moving the
harness away from its current experiments path will fail loudly until that explicit
relative source path is updated.
