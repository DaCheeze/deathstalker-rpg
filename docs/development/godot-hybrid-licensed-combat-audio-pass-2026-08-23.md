# Godot Hybrid Licensed Combat Audio Pass — 2026-08-23

## Outcome

Status: **implemented and technically verified; developer listening approval is
open**.

The developer-approved Humble/GameDev Market library now supplies an optional
owner-local replacement bank for the seven weapon cues that had the clearest
negative listening feedback:

- `vibro_blade`;
- `twin_vibro_daggers`;
- `heavy_smash`;
- `concussive_shove`;
- `particle`;
- `ballistic_scatter`; and
- `plasma`.

Disruptor, Force Shield, and Psionics remain procedural. Semantic cue IDs,
durations, contact anchors, bridge routing, and the global six-step deterministic
variation sequence did not change. No gameplay, core, fixture, bridge schema,
dependency, balance value, commit, push, or public deployment changed.

## Asset and licensing boundary

The committed manifest selects 26 WAVs from five packs in the developer's purchased
library and records their source-relative paths, SHA-256 hashes, WAV metadata,
strongest-transient alignment data, cue recipes, and conservative per-layer gains.
The source vault and purchase records remain outside the repository. Staged WAVs
live under `godot/assets/audio/licensed/`, which is Git-ignored; `git ls-files`
returns no paths below that root, and the Vite `dist/` build contains zero WAVs.

The local stager requires an explicit purchased-library root, verifies every source
hash before copying, refuses to overwrite a mismatched destination, and rejects
unmanifested staged WAVs without deleting them. The first run copied all 26
declared files; its second run was idempotent:

    Licensed combat audio staged safely: 0 copied, 26 already verified, 26 total.

The runtime bank also verifies manifest shape, exact cue scope, hashes, PCM/WAV
shape, decoded duration, layer timing, gain ceilings, and full/no-extra staging.
Empty staging is the valid repository/public-checkout state. Once any licensed WAV
is present, partial, mismatched, or unmanifested staging is invalid. Purchased-asset
distribution remains governed by the developer's license and proof of purchase;
this pass does not commit or publish the licensed files.

## Runtime behavior

The canonical client exposes three explicit source modes:

- `auto` prefers a ready licensed recipe for the seven eligible cues and otherwise
  uses procedural fallback;
- `procedural` never requires or loads the local licensed bank; and
- `licensed` requires a complete valid local bank for eligible cues while retaining
  procedural Disruptor, Shield, and Psionics.

Each licensed cue chooses one of three source recipes deterministically and applies
the existing six-step pitch family. Layer playback is trimmed and aligned to the
unchanged canonical cue/contact window. Stop, restart, mute, output gain,
suppression, and shutdown propagate through both sources.

The isolated 10×6 listening harness dynamically loads the same live synth, ranged
bank, licensed bank, and manifest. It accepts `--audio=auto`,
`--audio=procedural`, or `--audio=licensed`, displays licensed recipe/layer data,
and keeps the existing exact-variation and full-matrix controls.

## Material implementation

- `godot/data/licensed-combat-audio-manifest-v1.json` — allowlist, provenance
  metadata, hashes, WAV shape, and recipes;
- `scripts/stage-licensed-combat-audio.mjs` — safe local staging;
- `scripts/analyze-wav-transients.mjs` — deterministic PCM/WAV metadata and
  transient-window analysis used to author the manifest;
- `godot/scripts/audio/licensed_cue_bank.gd` — strict validation, runtime loading,
  aligned layering, and lifecycle control;
- `godot/scripts/validate_licensed_combat_audio.gd` — ready-bank and empty-public
  validation;
- `godot/scripts/procedural_combat_audio.gd` and `godot/scripts/main.gd` — hybrid
  dispatch and `--audio=` selection;
- the listening-harness live loader, checks, UI, and instructions; and
- the Godot ignore rule plus audio-policy, project-state, transition, and handoff
  documentation.

## Measured verification

All commands below exited 0 on the shared worktree:

- 15 canonical Godot scripts and six listening-harness scripts passed
  `--check-only` (21/21 total);
- Godot `--import` scanned/imported all 26 locally staged WAVs;
- the procedural validator passed ten cues × six variations with sample-identical
  repeat renders;
- the ranged validator passed three cues × six variations × two renders;
- the strict licensed validator reported
  `state=ready cues=7 assets=26 deterministic_layers=13 hashes=match
  wavs=manifested fallback_probe=absent output_suppressed=true`;
- legacy procedural smoke routed 0 licensed / 21 procedural / 6 explicit silences
  and replayed 25/25 snapshots;
- legacy licensed smoke routed 13 licensed / 8 procedural / 6 explicit silences
  and replayed 25/25 snapshots;
- range-band procedural smoke routed 0 licensed / 20 procedural / 3 explicit
  silences, retained two held interrupts, and replayed 34/34 snapshots;
- range-band licensed smoke routed 18 licensed / 2 procedural / 3 explicit
  silences, retained two held interrupts, and replayed 34/34 snapshots;
- the listening validator and scheduler smoke each covered 60 selections: 42
  licensed and 18 procedural in `auto`; an additional procedural-mode scheduler
  smoke covered 0 licensed and 60 procedural selections;
- `npm.cmd run build` passed with 40 transformed modules and the two previously
  recorded `node:fs`/`node:path` browser-externalization warnings;
- `npm.cmd run lint` passed with zero warnings and zero errors;
- `npm.cmd run test` passed 134/134 tests across 29/29 files; and
- `git diff --check` passed. Git emitted only working-copy LF-to-CRLF warnings.

The sandboxed first build/test attempts hit the recorded esbuild `spawn EPERM`
restriction; both passed when rerun with process-spawn permission. Godot emitted
nonfatal environment warnings for its inaccessible `user://` log/editor-settings
paths and Windows certificate store. Balance was skipped because this pass changes
presentation/audio only.

## Approval still open

All automated playback was output-suppressed. These checks establish selection,
integrity, timing plans, source routing, reset behavior, and fallback safety; they
do not establish whether the replacements sound good, physical, distinct,
satisfying, or correctly mixed on the developer's devices.

The next concrete step is a same-device A/B in the listening harness, starting at
conservative volume:

```powershell
$godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64.exe'
$harness = 'F:\RPG v1\experiments\godot-combat-audio-listening-harness'

& $godot --path $harness -- --audio=auto
& $godot --path $harness -- --audio=procedural
```

Review the four melee replacements first, then Particle, Scatter, and Plasma.
After developer selection, tune only rejected layers/gains and then measure audible
contact latency, cancellation, crackle/underrun behavior, ordinary-speaker
translation, ten-minute soak, and Godot Web behavior.
