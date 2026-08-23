# Canonical Godot Presentation Client

Status: Phase 1 production migration client with dual-fixture usability, a ten-cue
procedural baseline, and an optional local licensed-audio path for seven weapon
cues. The exact nine-layer architecture has been proven in an isolated harness,
but canonical authored integration, device/Web parity, and developer
visual/listening acceptance remain open.
Godot is presentation-first;
the pure TypeScript core remains authoritative for combat, RNG, AI, queue state,
outcomes, replay snapshots, and semantic audio routing. The Vite/Canvas/Web Audio
browser client remains intact and is the rollback/reference client. Developer
architecture and listening review remain pending.

This directory was promoted from the validated technical shape in
`experiments/godot-hd2d-spike/`. The experiment remains unchanged as historical
evidence. Production migration work belongs here under explicit phase gates.

Architecture authority and phase gates live in
`docs/development/godot-transition-plan.md`; presentation requirements live in
`docs/design/presentation.md`. The implemented combatant-package validator and
still-pending technical/art decisions are specified in
`docs/design/godot-combatant-raster-asset-contract-v1.md`. The isolated
nine-layer proof is documented in
`experiments/godot-visual-ab-harness/README.md`; it is evidence for the canonical
implementation, not a substitute for it.

## What runs

The client can load either of two committed deterministic fixtures generated from
validator-backed repository data and the current core:

- `--fixture=legacy` (the default) selects
  `data/presentation-replay-v1.json`;
- `--fixture=range-band` selects
  `data/presentation-range-band-replay-v1.json`.

The exporters call existing seeded initialization, AI, and `applyAction`; they do
not reproduce combat rules. Each transition carries a complete presentation-only
snapshot plus:

- a resolved action descriptor;
- shared browser `audioCue` and event `audioCues` semantic names;
- shared visual duration/contact/beam timing resolved from `FEEDBACK_CONFIG`;
- normalized calculated events and state suitable for rendering.

When an authoritative `Advance` transition is interrupted by a held disruptor, the
exporter promotes that transition to a disruptor presentation action owned by the
reactor. The action carries the authoritative reactor/target IDs, shared disruptor
cue, and prototype timing. Its mirrored `disruptor_interrupt` event keeps the
semantic event but has no duplicate audio cue in the replay document, so a client
cannot play the same disruptor twice by routing both action and event cues.

`scripts/presentation_bridge_loader.gd` rejects unknown/missing keys, unsupported
format/schema values, bad references, unstable combatant ordering, inconsistent HP
and alive state, non-monotonic frames/turns, invalid semantic cues/timing, unsafe or
non-finite metadata, and any action duration that overlaps the next snapshot or the
final hold. GDScript performs no damage, targeting, cooldown, queue, AI, RNG, or
outcome calculation.

The client renders procedural migration stand-ins, state bars, queue order, action
beats, status fields, and the full replay loop. It intentionally does not load
unapproved raster art.

`scripts/procedural_combat_audio.gd` is the reusable, repository-safe 48 kHz
`AudioStreamGenerator` baseline. The optional local licensed path is manifest-backed
and does not replace the public procedural implementation. The canonical replay
schedules each serialized `action.audioCue` once when its frame becomes active and
each pre-resolved `event.audioCues` entry once at that action's serialized
result/contact anchor. It does not inspect ability IDs or derive combat or cue
policy in GDScript.

The procedural baseline supports `vibro_blade`, `twin_vibro_daggers`,
`heavy_smash`, `concussive_shove`, `disruptor`, `shield_raise`, `psionic`,
`particle`, `ballistic_scatter`, and `plasma`, each with six deterministic
variations. Every other valid bridge cue is explicit silence and is
logged once by semantic cue name; there is no generic fallback. The legacy fixture
dispatches 21 audible cues and six intentional silences. The range-band fixture
dispatches 20 audible cues and three silent death events. Its two held-interrupt
events carry empty audio arrays, so routing both semantic fields cannot
double-dispatch either disruptor occurrence.

## Audio source modes and local staging

Exactly `vibro_blade`, `twin_vibro_daggers`, `heavy_smash`, `concussive_shove`,
`particle`, `ballistic_scatter`, and `plasma` may use locally staged licensed WAVs
from the developer's Humble/GameDev Market collection. `disruptor`, `shield_raise`,
and `psionic` remain procedural in every mode. All sources preserve the same bridge
cue IDs, durations, and semantic contact anchors.

Runtime modes are:

- `auto` — prefer a manifest-validated local licensed cue when available and use
  its procedural identity otherwise;
- `procedural` — force the public/repository-safe procedural path; and
- `licensed` — request the local licensed bank for eligible cues and report missing
  or invalid staging instead of silently changing the requested mode.

Select a mode with `--audio=auto`, `--audio=procedural`, or
`--audio=licensed`. The default is `auto`.

Licensed source files and purchase records remain in the owner's source vault. The
local staged root, `godot/assets/audio/licensed/`, is Git-ignored. The committed
manifest records the allowlisted cues, expected source-relative paths, hashes, WAV
shape, layer timing, and mix metadata without committing the licensed audio itself.
Stage only the manifest-declared files from the repository root:

```powershell
npm run godot:audio:stage -- --source-root "C:\Users\Daniel\Desktop\Sound Effects"
```

The stager validates source hashes, refuses mismatched existing destinations, and
does not modify the source vault. No staged WAVs is a valid public-checkout state;
`auto` and `procedural` continue through procedural synthesis.

## Generate the fixtures

Use the repository's supported Node 20 runtime from the repository root:

```powershell
# Legacy fixture.
npm run godot:fixture

# Range-band fixture (there is not yet a second npm alias).
npm exec -- tsx scripts/export-godot-range-band-presentation.ts
```

The npm alias invokes `scripts/export-godot-presentation.ts`; the second command
invokes `scripts/export-godot-range-band-presentation.ts`. The current Node 24
Windows runtime can fail inside `tsx` before either exporter starts
with `uv_os_get_passwd returned ENOMEM`; that is the already-recorded runtime issue,
not a fixture error. Neither exporter contains a timestamp. The legacy exporter
uses seed `230823` and
produces byte-identical output. Phase 1 verification generated 25 snapshots ending
in victory with SHA-256
`c5d6546a3f0fc58de9bb6bc05914cba39ef554eff521bc668d8c50aac43722cf`.
The range-band exporter generated 34 snapshots ending in victory with SHA-256
`16d8c17b3ff08263d62a75c43352dd2eeee5c1b5c1bfa13fcc7ecb5783a9219f`.

## Validate and run

Combatant raster packages remain outside Godot import until a developer-approved
concept and motion direction have been converted into the strict PNG/JSON package
defined in `docs/design/godot-combatant-raster-asset-contract-v1.md`. Validate the
contract implementation and its deterministic positive/negative fixtures with:

```powershell
npm run godot:assets:validate
```

Passing this command proves package structure and decoded-image invariants; it does
not approve the artwork or register any candidate in the runtime manifest.

With the approved self-contained Godot 4.7.2 runtime:

```powershell
$godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64_console.exe'
$project = 'F:\RPG v1\godot'

Get-ChildItem $project -Recurse -Filter '*.gd' | ForEach-Object {
    $resource = 'res://' + $_.FullName.Substring($project.Length + 1).Replace('\', '/')
    & $godot --headless --path $project --script $resource --check-only
    if ($LASTEXITCODE) { throw "Parse failed: $resource" }
}

& $godot --headless --path $project --script 'res://scripts/validate_fixture.gd'
& $godot --headless --path $project --script 'res://scripts/validate_bridge_contract.gd'
& $godot --headless --path $project --script 'res://scripts/validate_range_band_fixture.gd'
& $godot --headless --path $project --script 'res://scripts/validate_combat_audio.gd'
& $godot --headless --path $project --script 'res://scripts/validate_ranged_cue_bank.gd'
& $godot --headless --path $project --script 'res://scripts/validate_licensed_combat_audio.gd' -- --require-assets
& $godot --headless --path $project --import

# Interactive legacy replay with automatic local-licensed preference.
& $godot --path $project -- --fixture=legacy --audio=auto

# Interactive range-band replay forced to the public procedural path.
& $godot --path $project -- --fixture=range-band --audio=procedural

# Complete accelerated smoke for both strict fixtures.
& $godot --headless --path $project --scene 'res://main.tscn' --fixed-fps 60 -- --bridge-smoke --fixture=legacy
& $godot --headless --path $project --scene 'res://main.tscn' --fixed-fps 60 -- --bridge-smoke --fixture=range-band

# Require and exercise the staged licensed bank through both full replays.
& $godot --headless --path $project --scene 'res://main.tscn' --fixed-fps 60 -- --bridge-smoke --fixture=legacy --audio=licensed
& $godot --headless --path $project --scene 'res://main.tscn' --fixed-fps 60 -- --bridge-smoke --fixture=range-band --audio=licensed
```

Each smoke accelerates one complete loop to 16x, routes supported cues with
audible output disabled before an output player is created, checks exact-once
action/event semantic dispatch, and asserts the shared `R`/loop reset clears queued
playback, both dispatch ledgers, and the six-step variation sequence. It then prints
fixture-derived ledger/render/silence counts and exits. The range-band smoke also
requires exactly two held interrupts and empty duplicate event-audio routing.
Default `auto` smoke deliberately forces the asset-independent procedural path;
passing `--audio=licensed` is the explicit staged-bank integration gate.
Unknown names, including an empty `--fixture=`, fail before bridge loading; duplicate
fixture selectors are rejected as ambiguous. Controls: Space pauses, `R` restarts,
Tab toggles telemetry, and Escape quits.

`validate_combat_audio.gd` renders all ten procedural cues across all six bounded
variation steps twice and requires sample-identical repeats, finite/non-silent
buffers, exact contact bounds, the dagger notch, ranged-family structure, shield
rise/lock, psionic gather/contact structure, and stack headroom.
`validate_licensed_combat_audio.gd` accepts either a fully valid manifest-backed
local bank or the explicit no-assets public state; it rejects partial, mismatched,
or unmanifested staging. These are technical regression assertions, not listening
acceptance.

## Contract and deferred work

The machine-readable contract is
`schema/presentation-bridge-v1.schema.json`; the GDScript validator is the runtime
enforcement path. Any breaking field or semantic change requires a new schema
version and a compatibility/rollback decision rather than silently changing v1.

The separate combatant-raster package validator is implemented and its current
deterministic self-test passes 21/21 cases. No combatant package is technically or
artistically approved, registered, or loaded by this client, and the canonical
startup adapter remains future integration work.

Action audio and consequence audio are pre-resolved with the shared browser-free
resolvers. Godot consumes both semantic fields and renders the ten identities
listed above. The procedural synth delegates Particle, Scatter, and Plasma PCM to
`scripts/audio/ranged_cue_bank.gd`; the optional licensed path is implemented by
`scripts/audio/licensed_cue_bank.gd` for only the seven allowlisted weapon cues.
Generic blade/blunt, boost, reactive, and outcome cues remain explicit silence.
Outcome serialization is deliberately deferred: the shared outcome resolver
requires the prior and next battle statuses, so v1 does not invent an event-only
mapping.

Current validated encounter loading does not retain the optional environment block,
so both fixtures explicitly use the bridge's `unconfigured` presentation fallback.
Preserving validator-checked encounter environment data is a later contract change;
the exporter does not read unvalidated JSON around the core loader.

The Phase 1 renderer keeps the previous snapshot visible until the serialized
visual-contact anchor, or until action duration for a non-contact action. HP, alive,
queue, status, and outcome therefore change at the same resolved boundary as the
effect without any GDScript calculation. Full authored animation state coverage,
hit-stop/pause integration, and reactive-effect polish remain deferred.

Matching Godot Web templates are not installed. No audible-device latency, crackle,
underrun, ten-minute soak, action/contact synchronization measurement, spectral
analysis, or Web audio evidence is claimed. Headless render assertions use no audio
output device and cannot approve timbre, mix, loudness, impact, or satisfaction.
Developer comparison across `auto`, `procedural`, and `licensed`, against the
browser reference, on headphones and ordinary speakers remains the acceptance
gate.

Web export size/startup, target-browser compatibility/performance, production asset
manifest integration, editor workflow speed, and developer visual preference also
remain open parity gates. The configured Web preset stays single-threaded and
Compatibility renderer-first.
