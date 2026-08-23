# Godot Shield and Psionic Audio Pass — 2026-08-23

## Outcome

The canonical production procedural synth now supports two previously silent,
pre-resolved semantic cue names:

- shield_raise: four action dispatches in the strict legacy fixture;
- psionic: three action dispatches in the strict legacy fixture.

No cue-policy inference was added. The unchanged canonical scheduler already asks
the synth whether a serialized cue is supported, so extending the synth's explicit
cue registry makes only those exact semantic names audible. Canonical main,
scenes/compositor, bridge, fixtures, TypeScript core/gameplay/data, and the
independent ranged-cue-bank work were not edited.

## Authored identities

| Cue | Duration | Semantic contact | Construction | Explicit rejection |
|---|---:|---:|---|---|
| Force Shield | 370 ms | 240 ms containment lock | A deterministic stressed electrical texture rises without an attack transient, folds inward, then resolves to one centered fundamental that settles from 278 Hz toward 188 Hz before a short release. | No attack impact, alarm pulse, long musical chord, or weapon crack. |
| Psionics | 455 ms | 320 ms | Smooth band-limited mid pressure and independently seeded side pressure gather inside the stereo field; the contact releases diffuse decaying mid/side air rather than a physical strike. | No laser, projectile sweep, electric gun, pitched weapon onset, or magic sparkle layer. |

Both cues use the production six-step pitch/filter/decay variation cycle and
cue-specific deterministic seeds. Durations and semantic contacts remain fixed
across variation. No generic fallback, audio file, external asset, or dependency
was introduced.

## Deterministic render evidence

Environment: Godot 4.7.2.stable.official.ed1daf0bf at the production 48 kHz mix
rate. Values are full-buffer linear samples after each cue's production soft
limiter and before the AudioStreamPlayer output setting.

Across all six Shield Raise variations:

| Measurement | Range |
|---|---:|
| Frames | 17,760 |
| Peak | 0.1129–0.1158 |
| Full-buffer RMS | 0.0442–0.0457 |
| Early stressed-rise RMS, 40–90 ms | 0.0062–0.0070 |
| Late stressed-rise RMS, 175–220 ms | 0.0324–0.0360 |
| Stable-lock RMS, 255–335 ms | 0.0787–0.0791 |
| Rise sample-delta RMS | 0.02103–0.02332 |
| Lock sample-delta RMS | 0.00194–0.00201 |

The validator requires audible rising texture, a late-rise level at least 1.20
times the early window, an audible stable lock, lock delta below 70 percent of the
stressed-rise delta, peak no higher than 0.28, exactly 17,760 frames, and the
240 ms lock/contact inside the buffer.

Across all six Psionics variations:

| Measurement | Range |
|---|---:|
| Frames | 21,840 |
| Peak | 0.1281–0.1513 |
| Full-buffer RMS | 0.0146–0.0161 |
| Gathering-pressure RMS, 90–285 ms | 0.0092–0.0101 |
| Contact/release RMS, 320–410 ms | 0.0280–0.0316 |
| Pre-contact mid RMS | 0.0102–0.0110 |
| Pre-contact side RMS | 0.0020–0.0022 |
| Full-buffer sample-delta RMS | 0.00640–0.00716 |

The validator requires audible gathering pressure, contact/release RMS at least
1.10 times the gathering window, side pressure above 12 percent of mid pressure,
peak no higher than 0.30, sample-delta RMS no higher than 0.016, exactly 21,840
frames, and the required 320 ms semantic contact.

Every cue/variation pair is rendered twice and compared sample for sample. The
expanded production pass reported:

    [Combat Audio Render] PASS seven cues x six variations; repeat renders are sample-identical.
    [Godot Combat Audio Validator] PASS seven distinct named cues: four melee, disruptor, shield containment, and psionic pressure; unsupported semantics remain explicit silence.

## Headroom

For each variation, the validator renders four simultaneous-start offline stacks:
Shield plus Psionics, Shield plus Heavy Smash, Psionics plus Heavy Smash, and the
three-cue Shield/Psionics/Heavy Smash combination. Across those 24 checks:

| Measurement | Measured range | Required ceiling |
|---|---:|---:|
| Maximum stack peak | 0.3894–0.4499 | 0.64 |
| Maximum stack RMS | 0.0742–0.0771 | 0.10 |

These are deterministic buffer-headroom checks, not a bus-governance or audible
mix approval.

## Canonical fixture smoke

The complete accelerated legacy smoke exited 0:

    [Godot Combat Audio] PASS fixture=legacy frames=25 actions=24 action_cues=23 event_cues=4 rendered=19 silent=8 variation_steps=19 held_interrupts=0 duplicate_interrupt_event_audio=0 output_suppressed=true
    [Godot Combat Audio] PASS shared R/loop reset clears playback, ledgers, and variation sequence.
    [Godot Presentation] Replay complete: 25/25 serialized snapshots rendered with contact-gated results at 16.0x.

The seven newly supported legacy dispatches account for the four Shield Raise and
three Psionics actions. The remaining eight semantic dispatches stay explicit
silence; no generic substitute was introduced.

The complete accelerated range-band smoke exited 0:

    [Godot Combat Audio] PASS fixture=range-band frames=34 actions=33 action_cues=20 event_cues=3 rendered=20 silent=3 variation_steps=20 held_interrupts=2 duplicate_interrupt_event_audio=0 output_suppressed=true
    [Godot Combat Audio] PASS shared R/loop reset clears playback, ledgers, and variation sequence.
    [Godot Presentation] Replay complete: 34/34 serialized snapshots rendered with contact-gated results at 16.0x.

That bounded fixture contains neither new family. Its two held interrupts still
carry zero duplicate event audio.

## Listening harness and repository gates

The isolated production-source listening harness now exposes seven cue buttons,
six exact variation buttons, and the complete ordered 42-step review matrix.
Labels state each new material story and rejection criteria. Its deterministic
headless checks exited 0:

    [Combat Audio Listening Harness] STRUCTURAL PASS cues=7 variations=6 selected_renders=42 plan_steps=42 dry_gap=0.40 family_gap=0.85 output_suppressed=true source=F:/RPG v1/godot/scripts/procedural_combat_audio.gd
    [Combat Audio Listening Harness] SCENE SMOKE PASS ui_cues=7 ui_variations=6 selected_renders=42 scheduled_steps=42 output_suppressed=true

All changed GDScripts passed explicit Godot --check-only runs. Using pinned Node
20.20.2, the TypeScript and Vite production build passed with 40 modules, ESLint
passed without diagnostics, and Vitest passed 29 files / 134 tests. Vite emitted
the existing node:fs and node:path browser-externalization notices for
src/sim/balanceCheck.ts.

A focused artifact scan found no audio binaries or native dependency files and no
trailing whitespace. Repository git diff --check exited 0; Git emitted the existing
LF-to-CRLF working-copy warnings separately. The reboot-era sandbox ACL failure
required the approved recovery patch engine and escalated local validation commands.

## Approval still open

Subjective listening remains developer approval. None of the automated evidence
establishes that Shield Raise sounds like a convincing containment field, that
Psionics feels internal and nonmechanical, that the two families are satisfying or
properly weighted in combat, or that their six variations avoid perceptual fatigue.

Headphone and ordinary-speaker review, audible action/contact synchronization,
device latency, cancellation of samples already handed to the operating system,
crackle/underruns, a sustained voice-pressure soak, and Godot Web-export behavior
remain unmeasured. The harness timeline marks authored buffer coordinates only.
