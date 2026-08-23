# Godot Ranged Cue Bank — Read-only Audit — 2026-08-23

Status: **promising isolated synthesis work, but current validator fails and the
bank is not connected to canonical playback**.

## Why this audit exists

Two canonical-tree files appeared from a concurrent workspace writer while the
full-scene-post verification was running:

- `godot/scripts/audio/ranged_cue_bank.gd`
- `godot/scripts/validate_ranged_cue_bank.gd`

They were outside the active post, listening-harness, and combatant-study agents'
declared scopes. This pass therefore inspected and executed them without editing,
renaming, deleting, or integrating them.

Audited SHA-256 values:

- bank: `A071EF2F35A0F7133E99C3E2580E9BD0F7DFA70D288552930BDA1A461CDDB969`
- validator: `866CD06CD6FAED7765DA8218CDD1641C853F7E90246F46DCD14E061148947490`

## Findings

### P1 — clean-cache validator parsing is brittle

The bank independently passes Godot `--check-only`. On a clean class cache, the
validator fails at its `bank: RangedCueBank` annotation even though it preloads the
bank script; the following inferred-variable errors are cascades. A headless editor
import registers the global `class_name`, after which validator parsing passes.

Import masking the error is not sufficient for a fail-loud validator. The owner
should remove the global-class registration dependency from the validator's type
surface or otherwise make the preload-local type relationship parse on the
mandated fresh check-only path.

### P1 — one enforced mix hierarchy assertion fails

The complete deterministic validator exits 1 on exactly one assertion. Scatter
variation 1 peaks at `0.53437`; Plasma variation 1 peaks at `0.52085`. Their ratio
is `1.02596` (`+0.223 dB`), below the validator's required `1.04` Scatter-over-
Plasma peak ratio.

This is narrow rather than catastrophic: the same Scatter render is `+5.93 dB`
peak and `+7.70 dB` RMS over Particle, and `+2.41 dB` RMS over Plasma. The failure
still matters because the authored contract says Scatter is the routine ranged
peak apex.

### P1 — no canonical consumer exists

Repository search finds `RangedCueBank` only in its validator. Canonical playback
still routes these semantic cues as explicit silence through the existing
procedural combat-audio component. The files are therefore an isolated synthesis
bank, not integrated player-facing audio.

## Passing evidence

- Cue IDs are exactly `particle`, `ballistic_scatter`, and `plasma`.
- Durations are 320, 300, and 345 ms, all within the routine 350 ms ceiling.
- Contact anchors are 250, 210, and 250 ms and match the current bridge timing.
- Double renders are sample-identical across all six variations.
- Buffers are finite/non-silent and deterministic seeded-noise lanes are bounded.
- Structural checks preserve three dry Particle packets, Scatter's immediate crack
  plus uneven early pellets, and Plasma's instability/release/sputter sequence.
- The highest individual sample peak is Scatter variation 3 at `0.60385`
  (`-4.38 dBFS`), below the validator's `0.6801` ceiling.

## Still unproven

The bank has no action-plus-reactive stack-headroom test, true-peak/LUFS/centroid
measurement, melee-relative comparison, cross-client parity, device/Web evidence,
or developer listening approval. Passing the remaining assertion would not prove
those gates.

This audit refreshed only ignored Godot editor/class cache data. No source, cue,
fixture, bridge, gameplay, dependency, commit, or push changed.
