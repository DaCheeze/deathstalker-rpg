# Canonical Godot Presentation Client

Status: sole production presentation client with dual-fixture usability, a ten-cue
procedural baseline, and an optional local licensed-audio path for seven weapon
cues. The exact nine-layer architecture has been proven in an isolated harness,
but canonical authored integration, device/Web acceptance, and developer
visual/listening acceptance remain open.
Godot is presentation-first;
the pure TypeScript core remains authoritative for combat, RNG, AI, queue state,
outcomes, replay snapshots, and semantic audio routing. The former Vite/Canvas/Web
Audio client is frozen historical source, not a fallback or comparator. Developer
architecture and listening review remain pending.

This directory was promoted from the validated technical shape in
`experiments/godot-hd2d-spike/`. The experiment remains unchanged as historical
evidence. Production presentation work belongs here under explicit phase gates.

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

## Live Web session

`src/session/liveSessionProtocol.ts` provides the first transport-neutral live
session host. Its version-1 request/response envelopes support bounded session
creation, legal player actions, TypeScript-owned enemy actions, monotonic sequence
checks, idempotent retry handling, restart, and deterministic error responses. Each
successful transition contains a presentation-only state/action/event snapshot and
the next legal player intents. Core RNG cursors are serializable for later
save/resume work but never cross the presentation response.

`src/host/webCoreHost.ts` is the replaceable Web adapter. Vite bundles it as a
browser global for Godot Web without reviving the former Canvas client:

```powershell
npm run godot:web:core
```

The resulting ignored build artifact is
`godot/build/web/deathstalker-core-host.js`. `web/custom_shell.html` loads it before
Godot, and `scripts/web_game_core_client.gd` owns the Godot-side JSON call and
strict response-envelope validation. Run the native contract validator with:

```powershell
& $godot --headless --path $project --script 'res://scripts/validate_web_game_core_client.gd'
```

The same Web host now exposes the authoritative opening expedition without
replacing the standalone combat endpoint. Regenerate and validate its deterministic
37-exchange transcript with:

```powershell
npm run godot:opening
npm run opening-check
& $godot --headless --path $project --script 'res://scripts/validate_opening_expedition.gd'
```

The opening route is pastoral Virimonde → unexplained death order → concealed-route
escape → private-flyer shootdown and windbreak last stand → Hazel's escape-pod
impact → Hazel's active rescue → flight to the lake → lake regroup →
hidden-yacht departure → temporary safety. The visible cast is beat-scoped: Owen
through the last stand, Hazel becomes active for the rescue, and both are present
after convergence. Hazel is identified as a clonelegger, smuggler, and pirate.
TypeScript owns the journey boundary, persistence, inventory, combat, legal actions,
AI, and RNG; Godot owns only presentation and player intent collection.

Entering the flyer-wreck boundary applies a TypeScript-authored 75% HP cap to Owen.
This makes the source injury truthful in the HUD and persistent through later
encounters. The value is provisional for the later balance pass; Godot only displays
the supplied condition.

The Web adapter autosaves the opening after every accepted command to a namespaced
version-1 browser checkpoint. A reload resumes by replaying the validated command
history through a fresh TypeScript session, preserving the exact RNG cursor without
serializing opaque runtime objects. Missing checkpoints start a new expedition;
malformed or incompatible checkpoints fail closed instead of silently discarding
progress. The noncombat HUD reports the saved sequence. Restart resets the
expedition and immediately replaces the checkpoint with the new initial state.

Every response also includes strict boundary telemetry for each visited beat:
functional job key, party HP and percentage, inventory, retired recovery-choice
state, encounter status, turn number, and action count. The active route keeps that
choice null and advances the lake as an ordinary continuation. Godot validates this
record but does not derive or mutate it.

## Noncanonical world-loop proving map

The Web host also exposes a bounded TypeScript-authoritative campaign-loop fixture.
It is explicitly noncanonical and exists to prove the classic JRPG structure before
approved locations and content are authored: a town hub with rest and shops, a
field route with two persistent one-time chests and a repeatable optional encounter,
and a fixed-strength boss approach. Battles are discrete contacts and return to the
map. HP persists until town rest; XP, levels, gold, inventory, opened chests, and
victory counts persist throughout the session. Medkits are optional supplies, not a
forced progression gate, and no enemy scales to the party level.

Regenerate and validate its deterministic 76-exchange transcript with:

```powershell
npm run godot:world-loop
& $godot --headless --path $project --script 'res://scripts/validate_world_loop.gd'
```

After building the Web host and exporting Godot, open:

```text
http://127.0.0.1:4173/?mode=world-loop
```

Use A/D or Left/Right (or click the floor) to move. Enter or E activates a nearby
travel, chest, encounter, rest, or shop marker. Combat uses the same TypeScript-
supplied legal-action menu as the opening and returns automatically to exploration
after victory. Godot controls movement and marker presentation only; it does not
decide rewards, chest persistence, encounter availability, travel legality, prices,
rest effects, leveling, boss strength, combat outcomes, or RNG.

`web/core_host_smoke.html` exercises the compiled host without the retired Canvas
renderer. In a Web export, the canonical scene now creates this live session by
default, renders the validated legal-action menu, sends only selected intent back
to TypeScript, and queues each returned resolved transition through the existing
contact-gated compositor. TypeScript also advances enemy turns. Godot does not infer
legal actions, select AI, or resolve outcomes. Native/headless runs retain fixture
replay by default; pass `--replay` to force fixture mode where command-line arguments
are available.

For local presentation review without a browser host, pass `--opening-review`.
This mode uses `scripts/opening_transcript_client.gd` to consume the committed
37-exchange TypeScript transcript in order. It validates every response with the
same strict Godot opening loader, compares sequence and command semantics, rewrites
only request/session transport IDs, and fails loudly if input diverges. It is a
deterministic presentation and capture surface, not an alternate game runtime and
not a save-capable client.

An automated native capture can advance through source-safe `continue` boundaries
and save the requested beat after two rendered frames:

```powershell
& $godot --path $project --display-driver windows --rendering-method gl_compatibility -- `
  --opening-review `
  --opening-capture-beat=4 `
  --opening-capture-path='F:/RPG v1/docs/screenshots/opening-beat-04.png' `
  --audio=procedural
```

The capture beat must be from 0 through 9 and capture options require
`--opening-review`. Automated capture replays the exact committed TypeScript
transcript through combat and recovery commands when a later boundary is requested;
it never synthesizes a player decision or resolves gameplay in Godot. Add
`--opening-capture-route-end` with beat 0 to capture the reached-marker state and
its newly available Inspect Supplies prompt, or with beat 1 to capture Owen clear
of the reversed Standing route. Add
`--opening-capture-supplies-inspected` alongside it to capture the confirmed supply
state and Finish Inspection handoff; this supply option is valid only for beat 0.

The opening Virimonde beat now implements the developer-approved ordinary-world
lock. Owen starts visible in familiar farmland on the approach to the procedural
Deathstalker Standing silhouette; an old stone-and-river axis orients the route and
a physical supply cache marks its end. Hold `A`/`D` or Left/Right, or click the
route, to move Owen. Arrival exposes Inspect Supplies. Inspection confirms the
TypeScript-supplied starting condition and inventory, spends nothing, and exposes
Finish Inspection; only that second interaction sends the unchanged authoritative
`continue` intent. Movement and inspection progress are Godot presentation state:
they do not decide journey legality, mutate persistent condition, resolve combat,
or enter the checkpoint. Reloading the same boundary therefore resets only the
local walk and inspection, not authoritative opening progress.

The death-order beat reverses that learned route without changing TypeScript
authority. Anonymous Deathstalker Standing personnel accept the authentic Imperial
order and turn on Owen; the Standing access seals and Owen must move back toward the
old stone-and-river landmark before `Leave the Standing` becomes available. The
local retreat sends no combat or journey action. Later environment states stage the
concealed route and private flyer, flyer wreck and windbreak tree, damaged escape
pod, lake approach, underwater-yacht reveal, and yacht safety. These are resolved
presentation landmarks; combat and journey outcomes still come only from the
TypeScript transcript or live Web session.

The public live session starts all six combatants directly Engaged. Melee is legal
on the first player turn, `Advance` is absent from both player and AI intent lists,
and a defeated target is replaced without a movement turn. The explicit
`--fixture=range-band` replay remains historical diagnostic evidence for the earlier
movement/interrupt experiment; it is not the active live-game rule set. The live
command menu is a translucent, actor-anchored card lifted above the party and hidden
while player or enemy transitions resolve.

Live controls are `1`–`9` or click to act, Up/Down to select, Enter to confirm,
`R` to restart, Tab to show or hide the diagnostic overlay, and F12 to toggle the
nine-layer compositor diagnostic. Live play starts with diagnostics hidden; replay
mode retains the technical header and overlay. F12 is deliberately separate from
the `D` traversal key.
The shell exposes its engine-start-to-scene timing as
`#boot-status[data-interactive-ms]` for browser automation.

The client renders layered procedural combatants with distinct Power, Critical, and
Queue Control proportions, side-specific head/material treatments, role weapon
profiles, matching geometric queue tokens, state bars, action beats, status fields,
and the full replay loop. The canonical Imperial environment uses the
developer-selected layered set A: a deep hall backdrop, stage floor, and foreground
occluder assigned to compositor layers 2, 3, and 7. The strict
`runtime-visual-assets-manifest-v1.json` loader validates that exact approved
selection, resource paths, dimensions, and local source hashes before rendering.

The current manual remote preview is
<https://dacheeze.github.io/deathstalker-rpg/>. GitHub Pages serves an isolated
artifact-only `gh-pages` branch, not the frozen Canvas build and not the source tree
on `main`. This is suitable for developer playtesting, but it is not yet the
one-command verified deployment pipeline required for release.

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

The current Twin Vibro-Daggers local recipe additionally uses the developer-selected
`Desktop/Assets/dagger hit.mp3` through an owner-local PCM conversion. Its
distribution provenance is unrecorded, so it remains excluded from public exports
and must not be treated as release-cleared. The hosted build uses the separately
synthesized procedural two-cut translation.

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

Use the repository's supported Node 24 LTS runtime from the repository root:

```powershell
# Legacy fixture.
npm run godot:fixture

# Range-band fixture (there is not yet a second npm alias).
npm exec -- tsx scripts/export-godot-range-band-presentation.ts
```

The npm alias invokes `scripts/export-godot-presentation.ts`; the second command
invokes `scripts/export-godot-range-band-presentation.ts`. Node 24 can fail inside
the managed Windows sandbox before either exporter starts with
`uv_os_get_passwd returned ENOMEM`; the same commands run normally outside that
sandbox. Neither exporter contains a timestamp. The legacy exporter
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

Official matching Godot 4.7.2 single-threaded Web templates are installed on the
current development machine, and the complete live Web export has been exercised.
The release preset excludes `assets/audio/licensed/*` even when the owner-local bank
is staged, so public exports remain repository-safe and use procedural coverage.
The procedural `AudioStreamGenerator` explicitly requests Godot streaming playback
because generated streams cannot use the Web sample-playback default. No
audible-device latency, crackle, underrun, ten-minute soak, action/contact
synchronization measurement, spectral analysis, or listening approval is claimed.
Headless render assertions use no audio
output device and cannot approve timbre, mix, loudness, impact, or satisfaction.
Developer comparison across `auto`, `procedural`, and `licensed` on headphones and
ordinary speakers remains the acceptance gate.

The current export is 38.90 MiB raw / 10.06 MiB under local maximum-gzip simulation
and reached the live scene in 533.70 ms in one local desktop in-app-browser run. Its
warmed HUD frame average was 17.54 ms. Keyboard action, TypeScript-owned AI response,
restart, and pointer action passed with zero console warnings/errors. Real hosted
compression/transfer, cold-cache/network startup, p99 frame time, other desktop
browsers, mobile/touch, production asset manifests, editor workflow speed, and
developer visual/audio preference remain open gates. The preset stays
single-threaded and Compatibility-renderer-first.
