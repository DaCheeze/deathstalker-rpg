# Godot Disruptor Audio Pass — 2026-08-23

## Status

Implemented and deterministically validated as the fifth bounded cue in the
canonical Godot procedural-audio path. This is engineering evidence, not developer
listening approval.

## Goal

The disruptor had repeatedly read as too intense and too generic. This pass gives
the serialized disruptor semantic its own short, dry, restrained identity:

- a quiet low charge from 50–190 ms;
- dry silence before the immutable 220 ms beam anchor;
- a centered low/low-mid beam body from 220 ms to just before contact;
- one compact low-mid contact at the immutable 460 ms anchor; and
- no explosion tail, laser shriek, high-pass layer, or generic weapon fallback.

The authoritative range action remains 540 ms long with its beam at 220 ms and
contact at 460 ms. No combat, balance, fixture, bridge, or scheduler value changed.

## Implementation boundary

Changed:

- godot/scripts/procedural_combat_audio.gd
- godot/scripts/validate_combat_audio.gd
- this report

The existing supports_cue() route now recognizes disruptor; no main.gd branch or
ability-ID policy was added. Unsupported valid semantics remain explicit silence.
The range fixture's mirrored held-interrupt event still has no audio cue, so the
authoritative action remains the only disruptor-audio source.

The synthesis remains file-free and dependency-free. Charge and beam material uses
tones plus bounded low-pass/band-limited noise. The beam noise band's configured
center tops out at 940 Hz before bounded variation and its upper edge is roughly
1.8 kHz; contact uses one decaying low-pass body plus one low-mid tone.

## Deterministic measurements

Godot 4.7.2 rendered each 540 ms cue at 48 kHz: 25,920 stereo frames per variation.
All values below are measured after the shared output gain and soft limiter.

| Variation | Peak | Full-buffer RMS | Charge RMS | Beam RMS | Contact RMS | Sample-delta RMS |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 0.1251 | 0.0173 | 0.0082 | 0.0186 | 0.0351 | 0.00250 |
| 1 | 0.1434 | 0.0176 | 0.0086 | 0.0187 | 0.0362 | 0.00261 |
| 2 | 0.1387 | 0.0168 | 0.0082 | 0.0187 | 0.0327 | 0.00236 |
| 3 | 0.1471 | 0.0175 | 0.0082 | 0.0188 | 0.0355 | 0.00269 |
| 4 | 0.1399 | 0.0176 | 0.0082 | 0.0187 | 0.0361 | 0.00242 |
| 5 | 0.1435 | 0.0172 | 0.0087 | 0.0188 | 0.0341 | 0.00261 |

The maximum measured peak is 0.1471, approximately -16.6 dBFS, below the explicit
0.32 headroom ceiling. Across all six variations, the quiet charge remains audible
and below beam RMS, the beam remains non-silent, and contact RMS exceeds beam RMS.
The 195–215 ms pre-beam gap measured zero RMS.

Across the complete cycle, peak spans 0.1251–0.1471, full-buffer RMS
0.0168–0.0176, charge RMS 0.0082–0.0087, beam RMS 0.0186–0.0188, contact
RMS 0.0327–0.0362, and sample-delta RMS 0.00236–0.00269.

The sample-delta RMS is a deterministic roughness/high-frequency proxy, not a
spectral analysis. Every variation is below the explicit 0.018 ceiling by a wide
margin. The renderer itself also omits high-pass material from this cue.

## Automated verification

- procedural_combat_audio.gd --check-only: passed.
- validate_combat_audio.gd --check-only: passed.
- Full audio validator: passed twice.
- The two complete validator outputs were byte-for-byte identical.
- Five cues × six variations rendered finite, non-silent, exact-length buffers.
- Each variation matched an immediate repeated render sample-for-sample.
- Disruptor metadata preserved exactly one contact at 460 ms and duration 540 ms.
- Disruptor metadata preserved the 220 ms beam anchor.
- Disruptor-specific charge/beam/contact, dry-gap, peak-headroom, and
  sample-delta thresholds passed for all six variations.
- Canonical legacy replay smoke: passed 25/25 snapshots; 12 rendered cues, 15
  explicit silences, 12 variation steps, and shared reset passed.
- Canonical range-band replay smoke: passed 34/34 snapshots; 20 rendered cues, 3
  explicit silences, 20 variation steps, exactly 2 held interrupts, and 0 duplicate
  interrupt-event audio cues. Shared reset passed.
- Both canonical smokes also passed the integrated nine-layer order, 960×540 post
  boundary, and UI-outside-post check before replay.

## Limitations and review gate

- No person has listened to this Godot cue yet; timbre, perceived loudness, mix
  placement, and satisfaction remain developer review gates.
- Headless synthesis does not measure output-device latency, driver behavior,
  headphones/speakers, long-session fatigue, or Web export behavior.
- Sample-delta RMS does not replace FFT, critical-band, or perceptual loudness
  analysis.
- The cue intentionally remains much quieter than the existing Heavy Smash render;
  only listening in the full battle mix can confirm that this is restrained without
  becoming too weak.
- No cancellation, pause, hit-stop, or scheduler policy changed in this pass.
