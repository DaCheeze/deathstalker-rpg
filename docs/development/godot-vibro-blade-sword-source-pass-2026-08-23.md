# Godot Vibro-Blade Sword-Source Pass — 2026-08-23

## Outcome

The optional licensed `vibro_blade` recipe now uses sword recordings rather than
knife recordings. The repository-safe procedural path, semantic cue ID, `300 ms`
licensed duration, `100 ms` contact anchor, TypeScript authority boundary, and
`twin_vibro_daggers` recipe are unchanged.

This is technically integrated and ready for developer listening. Timbre, weight,
tail quality, mix, and satisfaction remain subjectively unapproved.

## Measured source selection

The owner library contains five retro sword slices and sixty sword-labeled files in
the Ultimate Anime Combat pack: twenty standard slices, twenty super slices, and
twenty special impacts. The sixty-file primary set was measured before changing the
manifest. Super slices ran approximately `3.48–3.83 s`, and special impacts ran
approximately `2.16–2.71 s`, making them poor first choices for a routine dry
`300 ms` cue. Standard sword slices ran approximately `1.34–1.62 s` and supplied
several early transient shapes compatible with the existing contact.

The selected sources are:

| Runtime asset | Source | Duration | Raw peak | Strongest 5 ms window |
|---|---|---:|---:|---:|
| `sword_slice_01` | `Sword_Slice_01.wav` | `1.418345 s` | `-4.999 dBFS` | `0.110204 s` |
| `sword_slice_02` | `Sword_Slice_02.wav` | `1.520907 s` | `-5.000 dBFS` | `0.100181 s` |
| `sword_slice_03` | `Sword_Slice_03.wav` | `1.512698 s` | `-5.000 dBFS` | `0.112517 s` |

All three licensed layers use `0 dB` recipe gain and align the strongest window to
`0.100 s`. Their raw peaks are approximately `1.6–2.5 dB` below the former knife
source peaks; after the former recipe gains are included, the new source peaks are
approximately `0.3–0.6 dB` quieter before the shared bank output gain. This is a
conservative first listening level, not a mastering decision.

The manifest no longer declares `knife_slice_1`, which was used only by
`vibro_blade`. Its ignored staged WAV and Godot import sidecar were removed after
the exact paths were resolved inside the licensed staging root and the owner-library
source hash was verified. The purchased source remains intact outside the
repository. `knife_slice_2`, `knife_slice_3`, and `knife_slice_4` remain declared
and staged for `twin_vibro_daggers`.

## Material changes

- `godot/data/licensed-combat-audio-manifest-v1.json` replaces the licensed
  Vibro-Blade recipe and records the three new source hashes and WAV metadata.
- Owner-local ignored staging copied the three sword WAVs and imported them in
  Godot; the licensed bank now contains `28` declared assets.
- `docs/design/combat-audio-direction.md`, `docs/PROJECT-STATE.md`, and the
  production ledger record the current recipe and open listening gate.

No licensed audio, purchase proof, generated import sidecar, gameplay value,
TypeScript core rule, bridge schema, fixture, GDScript, scene, dependency, commit,
or push is included in this pass.

## Verification

- Transient analysis completed for all sixty standard/super/special sword files and
  for the three replaced knife sources.
- Local staging reported `3 copied, 25 already verified, 28 total`.
- Godot import found and imported `sword_slice_01.wav`, `sword_slice_02.wav`, and
  `sword_slice_03.wav`; it exited `0` with the existing non-fatal root-certificate
  and sandboxed editor-settings warnings.
- The strict licensed validator passed `state=ready`, seven cues, `28` assets,
  `13` deterministic layers, matching hashes, and the empty public-fallback probe.
- Licensed legacy replay passed `25/25` snapshots with `13` licensed, `8`
  procedural, and `6` silent selections.
- Licensed range-band replay passed `34/34` snapshots with `18` licensed, `2`
  procedural, and `3` silent selections, retaining exactly two held interrupts and
  zero duplicate interrupt-event audio.
- The listening validator and licensed scene scheduler each passed all `60`
  selections: `42` licensed and `18` procedural.
- `npm run verify:quality` passed build/typecheck, lint at `0` errors and `0`
  warnings, and `142/142` tests across `31/31` files.
- Focused and repository-wide `git diff --check` are required at final handoff.

## Listening gate and next step

Listen to Vibro-Blade in `--audio=licensed` first at normal speed, then compare it
with Twin Vibro-Daggers. Confirm that it reads as one human-scale sword sweep with a
broader body, that the `100 ms` contact feels synchronized, and that the trimmed
tail does not click or end abruptly on headphones or ordinary speakers. If the
source family is right but a variation is weak, replace or gain-tune only that
variation without changing semantic timing.

Best venue: **local**. The decision depends on the owner-staged WAVs, Godot's actual
audio device path, and the developer's headphones and speakers.
