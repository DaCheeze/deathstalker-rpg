# Godot Transition Pass Log — 2026-08-23

This log records measured migration work. The forward contract remains
`docs/development/godot-transition-plan.md`.

## Pass 0 — decision baseline

Status: complete as technical and decision evidence.

- Godot 4.7.2 Compatibility loaded static JSON, rendered a deterministic replay,
  ran headlessly, and supported a local A/B surface in the isolated spike.
- The developer approved a staged production transition with the deterministic
  TypeScript core authoritative and Canvas/Web Audio retained as parity and
  rollback references.
- The spike did not establish production visual quality, Web export support,
  procedural audio, browser startup/performance, deployment, or workflow-speed
  acceptance. It remains unchanged under `experiments/godot-hd2d-spike/`.

## Pass 1 — canonical bridge and replay client

Status: implemented locally; developer architecture review remains pending.

### Implemented boundary

- `src/bridge/presentationBridge.ts` owns the pure versioned v1 serializer.
- `scripts/export-godot-presentation.ts` generates a timestamp-free replay from
  validated data, seeded RNG, existing AI, and authoritative `applyAction` results.
- `godot/schema/presentation-bridge-v1.schema.json` and
  `godot/scripts/presentation_bridge_loader.gd` define and independently enforce
  the strict consumer contract. Godot resolves no combat rules or cue policy.
- `godot/scripts/main.gd` keeps the prior snapshot visible until the serialized
  contact anchor, or action end for non-contact actions. HP, queue, statuses,
  deaths, and outcomes therefore reveal at the resolved TypeScript boundary.
- Frame cadence is normalized once to millisecond precision and each frame is
  checked against `index * frameStepSeconds`. Non-finite/unsafe metadata,
  overlapping action duration, and a final action longer than `endHoldSeconds` are
  rejected before playback.
- A held range-band disruptor interrupt is detected only from authoritative
  `stateAfter.recentEvents`. The transition is serialized as a disruptor action
  owned by the reactor with authoritative target, cue, and prototype timing; an
  uninterrupted `Advance` remains an advance action. The mirrored interrupt event
  retains its semantic identity but its duplicate audio cue is removed from the
  replay document so future action/event routing cannot double-play it.
- Phase 3 now targets Godot-native procedural synthesis. Web Audio remains the
  operational parity/reference implementation; no audio synth was integrated in
  this pass.

### Verification

Runtime: Node v20.20.2 and Godot v4.7.2 stable Compatibility/headless.

```powershell
$node20 = 'C:\Users\Daniel\AppData\Local\npm-cache\_npx\185e25162edaacfb\node_modules\node\bin\node.exe'
$godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64_console.exe'
$project = 'F:\RPG v1\godot'
```

1. Focused bridge suite:

   ```powershell
   & $node20 node_modules/vitest/vitest.mjs run tests/bridge/presentationBridge.test.ts
   ```

   Result: exit 0; 1 file passed; 19/19 tests passed in 495 ms. Coverage includes
   interrupted and uninterrupted Advance documents, cue ownership, exact normalized
   cadence, final-hold bounds, and non-finite/non-positive metadata.

2. Deterministic fixture export, run twice:

   ```powershell
   & $node20 node_modules/tsx/dist/cli.mjs scripts/export-godot-presentation.ts
   ```

   Result on both runs: exit 0; 25 snapshots; seed `230823`; outcome `victory`;
   SHA-256 `c5d6546a3f0fc58de9bb6bc05914cba39ef554eff521bc668d8c50aac43722cf`.
   The pre-recovery file and both regenerated files were byte-identical.

3. GDScript parse checks:

   ```powershell
   Get-ChildItem $project -Recurse -Filter '*.gd' | ForEach-Object {
     $resource = 'res://' + $_.FullName.Substring($project.Length + 1).Replace('\', '/')
     & $godot --headless --path $project --script $resource --check-only
   }
   ```

   Result: exit 0 for all four scripts: `main.gd`,
   `presentation_bridge_loader.gd`, `validate_bridge_contract.gd`, and
   `validate_fixture.gd`.

4. Strict fixture and malformed-contract validation:

   ```powershell
   & $godot --headless --path $project --script res://scripts/validate_fixture.gd
   & $godot --headless --path $project --script res://scripts/validate_bridge_contract.gd
   ```

   Result: both exit 0. The fixture validator reported schema v1, fixture
   `phase-1-empire-skirmish`, 25 frames, and `typescript-core` authority. The
   contract validator rejected 12 malformed/incompatible documents and accepted a
   schema-valid targetless esper action. Negative cases cover missing/unknown keys,
   unsupported schema, invalid cue/reference/nested reference, nonuniform cadence,
   non-finite seed/frame step, short final hold, contact after duration, and beam
   after contact.

5. Import and complete accelerated replay:

   ```powershell
   & $godot --headless --path $project --import
   & $godot --headless --path $project --scene res://main.tscn --fixed-fps 60 -- --bridge-smoke
   ```

   Result: both exit 0. Import completed; contact-gated reveal passed for all 24
   transitions; 25/25 serialized snapshots replayed at 16.0x.

6. Repository quality gates:

   ```powershell
   & $node20 node_modules/typescript/bin/tsc
   & $node20 node_modules/vite/bin/vite.js build
   & $node20 node_modules/vitest/vitest.mjs run
   & $node20 node_modules/eslint/bin/eslint.js src/bridge/presentationBridge.ts tests/bridge/presentationBridge.test.ts --max-warnings=0
   & $node20 node_modules/eslint/bin/eslint.js . --max-warnings=0
   git diff --check
   ```

   - Production TypeScript/Vite build: exit 0; 40 modules transformed. Vite emitted
     the existing browser-externalization notices for `node:fs` and `node:path` from
     `src/sim/balanceCheck.ts`.
   - Full Vitest: exit 0; 28 files and 131/131 tests passed in 1.12 s.
   - Focused bridge lint: exit 0 with 0 warnings/errors.
   - Repository-wide lint was run once during concurrent sprite-contract work and
     exited 1 on 25 unused declarations in the then-incomplete untracked
     `scripts/validate-godot-combatant-raster-package.mjs`. This pass did not edit
     that file. A clean final repository-wide lint rerun remains required after the
     concurrent file settles.
   - `git diff --check` reported no whitespace errors; it printed only line-ending
     conversion warnings for pre-existing dirty-tree files.

### Deferred gates and limitations

- This is deterministic replay, not live TypeScript/Godot transition messaging.
- Procedural stand-ins are not authored visual parity and received no subjective
  visual acceptance in this pass.
- Godot plays no audio yet. No listening review or latency measurement was claimed.
- Matching Web templates are not installed; no Godot Web export, payload, startup,
  browser compatibility, memory, or sustained frame-time gate was measured.
- Outcome-audio serialization, full animation coverage, hit-stop/pause parity,
  production asset integration, accessibility/input parity, deployment, and a
  default-client switch remain deferred to their recorded phases.
- After the reboot, the Windows workspace sandbox could not create processes due to
  `helper_unknown_error: apply deny-read ACLs`. Approved escalated commands and the
  trusted recovery patch engine were used; no check failed because of this warning.

No dependencies, sprite-contract files, audio synthesis, commits, or pushes were
added by this pass.

## Pass 2 — bounded native procedural combat audio

Status: integrated locally; developer listening acceptance remains pending.

### Implemented boundary

- `godot/scripts/procedural_combat_audio.gd` ports the completed isolated 48 kHz,
  file-free `AudioStreamGenerator` synth into the canonical client. It retains the
  exact six-step pitch/filter/decay table, fixed 100 ms melee contact, fixed 85/145
  ms dagger contacts, cue-specific seeded noise, and the 120–142 ms dagger notch.
- `godot/scripts/main.gd` consumes only pre-resolved bridge semantics. Each
  `action.audioCue` dispatches once when its serialized frame activates; each
  `event.audioCues` entry dispatches once at the serialized action result/contact
  anchor. No ability ID, ability name, damage, target, outcome, or cue policy is
  re-derived in GDScript.
- Only `vibro_blade`, `twin_vibro_daggers`, `heavy_smash`, and
  `concussive_shove` render. Every other valid semantic cue is logged once and
  remains silent with no generic fallback. Action and event ledgers are separate;
  the smoke also rejects a `disruptor_interrupt` event that retains a duplicate
  `disruptor` cue.
- `R` and replay wrap share the same reset path: pending playback stops, both
  dispatch ledgers clear, and deterministic variation returns to step 1 of 6.
- Headless smoke sets render-only suppression before the synth enters the scene
  tree, so semantic dispatch and PCM rendering are asserted without creating an
  audible output player. Interactive playback still uses the native generator at
  the configured 48 kHz mix rate and -6 dB local player level.
- `godot/scripts/validate_combat_audio.gd` enforces the four-cue allowlist, rejects
  implicit support for all other v1 cues, renders four cues × six variations twice,
  and requires sample-identical repeats, finite/non-silent buffers, contact bounds,
  and the dagger notch.

### Verification

Runtime: Node v20.20.2 and Godot v4.7.2 stable Compatibility/headless.

1. Godot `--check-only`: exit 0 for all seven canonical GDScripts, including the
   three audio-pass scripts `main.gd`, `procedural_combat_audio.gd`, and
   `validate_combat_audio.gd`.
2. Strict bridge validators: exit 0. The fixture validator accepted schema v1,
   fixture `phase-1-empire-skirmish`, and 25 frames; the contract validator rejected
   all 12 malformed/incompatible cases and accepted the targetless esper case. The
   settled range-band validator accepted 34 frames, exactly two held interrupts,
   empty interrupt-event audio arrays, and the authoritative victory outcome.
3. Deterministic audio validator: exit 0. Four cues × six variations produced
   sample-identical repeat renders. The representative measurements retained the
   isolated spike baseline: Vibro-Blade 14,400 frames / 0.3039 peak / 0.0466 RMS;
   Twin Vibro-Daggers 10,800 / 0.2391 / 0.0201; Heavy Smash 16,320 / 0.4450 /
   0.0660; Concussive Shove 13,920 / 0.2638 / 0.0352. The 120–142 ms dagger notch
   remained `0.00000000` RMS versus 0.0214/0.0407 contact-window RMS.
4. Godot import and 16x canonical replay smoke: exit 0 with 25/25 snapshots and 24
   contact-gated transitions. Audio accounting passed with 25 frame ledger entries,
   24 action frames, 23 non-null action cues, four event cue entries, 11 supported
   renders, 16 unsupported silent dispatches, 11 variation advances, audible output
   suppressed, and the shared `R`/loop reset assertion passing.
5. Repository gates under Node 20: TypeScript/Vite production build exited 0 (40
   modules; existing `node:fs`/`node:path` browser-externalization notices), and
   Vitest exited 0 with 29 files / 134 tests. The first repository-wide lint run
   caught an unrelated helper while concurrent sprite-package edits were incomplete;
   after that owner restored its intended interlace-test use and repaired the late
   mask-test block without changing runtime behavior, the final lint rerun exited 0
   with zero warnings/errors. This audio pass did not edit that file.
6. `git diff --check`: exit 0. A separate trailing-whitespace scan of every Pass 2
   file found no matches.

Environment-only warnings: the rebooted Windows workspace sandbox still failed to
create processes with `helper_unknown_error: apply deny-read ACLs`, so approved
escalated commands and the trusted recovery patch engine were required. The
whitespace command printed only the existing LF-to-CRLF conversion notices for
dirty tracked files. Neither warning represented a failed implementation check.

### Exact limitations and pending acceptance

- The canonical fixture audibly exercises Vibro-Blade and Twin Vibro-Daggers only;
  Heavy Smash and Concussive Shove are covered by deterministic render assertions
  but not by this replay document.
- Generic melee, ranged, disruptor, shield, boost, psionic, reactive, and outcome
  families remain silent. The four current event cue entries (`critical_hit`, two
  `death` entries, and `shield_shatter`) are scheduled once but intentionally do not
  render. Any later reactive-cue support requires an explicit separate voice/mix
  decision before expanding the allowlist.
- Named cue buffers retain the isolated-spike lengths (225–340 ms), so their tails
  extend past the current 200 ms serialized melee visual duration while remaining
  well inside the 1.15 s replay-frame spacing. Contact anchors were not moved.
- Pause/hit-stop synchronization of already queued audio, device/OS cancellation
  after reset, audible contact latency, crackle/underrun behavior, long-run voice
  pressure, spectral/LUFS/true-peak analysis, Web export, and cross-platform
  floating-point identity are not established.
- Headless checks create no audible output and cannot approve timbre, mix,
  loudness, differentiation, weight, or satisfaction. A developer comparison
  against the browser reference on headphones and ordinary speakers remains
  required; this pass must not be described as listening-approved.

No core/gameplay/data/schema/fixture changes, dependencies, audio files, commits, or
pushes were made by this pass.

## Pass 3 — strict dual-fixture selector

Status: implemented locally; presentation review remains pending.

- `godot/scripts/main.gd` now accepts `--fixture=legacy` (the default) or
  `--fixture=range-band` and maps those two explicit names to the existing strict
  bridge documents before loading. Unknown, empty, or duplicate selectors fail
  before bridge loading; no encounter, action, cue, or gameplay state is inferred.
- Both fixtures reuse the same strict loader, contact-gated state reveal, action and
  event audio ledgers, supported-cue allowlist, unsupported-silence policy, replay
  loop, and shared `R`/wrap reset path.
- Smoke expectations remain document-derived. The only selector-specific assertion
  is the established range-band fixture contract: exactly two held interrupts, each
  with an empty event-audio array so neither disruptor can double-play.
- `godot/README.md` now gives exact interactive and 16x smoke commands for both
  fixtures.

### Verification

- `main.gd --check-only`: exit 0.
- Strict legacy fixture validator: exit 0; schema v1, 25 frames,
  `typescript-core` authority.
- Strict range-band fixture validator: exit 0; 34 frames, two held interrupts,
  victory. Strict malformed-contract validator: exit 0; 12 negative cases rejected.
- Default selection without `--fixture`: exit 0 and reported `fixture=legacy`.
- Explicit legacy smoke: exit 0; 25 frames, 24 actions, 23 non-null action cues,
  four event cues, 11 supported renders, 16 intentional silences, 11 variation
  advances, zero held interrupts, and zero duplicate interrupt event audio.
- Explicit range-band smoke: exit 0; 34 frames, 33 actions, 20 non-null action cues,
  three event cues, 18 supported named-melee renders, five intentional silences, 18
  variation advances, exactly two held interrupts, and zero duplicate interrupt
  event audio. All 34 snapshots replayed at 16x and the shared reset assertion
  passed.
- `--fixture=unknown`: expected exit 1 with the selector error before any bridge or
  replay processing.
- Empty `--fixture=`: expected exit 1 with `Unknown fixture ''` before bridge
  loading. Supplying both `--fixture=legacy` and `--fixture=range-band`: expected
  exit 1 with `Fixture selector may be provided only once.` before bridge loading.
- Node 20 production build, repository-wide lint, and Vitest all exited 0; 40
  modules built and 29 files / 134 tests passed. Build output retained the existing
  `node:fs`/`node:path` browser-externalization notices.
- `git diff --check`: exit 0 with only the existing LF-to-CRLF notices. The three
  Pass 3 files had no trailing-whitespace matches.

This remains deterministic static-fixture replay, not live TypeScript/Godot combat
messaging or fixture discovery. It adds no gameplay input, production art, audio
families, device-latency evidence, Web evidence, or subjective acceptance. No
bridge/core/data/exporter/fixture changes, dependencies, audio files, commits, or
pushes were made.

## Pass 4 — isolated nine-layer compositor proof (related evidence)

Status: complete as isolated technical evidence; subjective visual approval, every
art choice, and canonical integration remain pending.

### Overall live-review signal

While the canonical range-band Godot replay was running, the developer's first
direct comparison was: “This is already much better then our custom engine.” This
is an important overall preference signal for Godot presentation versus the
Canvas/custom client. It does not approve the placeholder art, any individual
audio cue, audible latency, or the remaining cutover gates. Canvas remains the
parity and rollback client until those recorded gates pass.

### Implemented boundary

- `experiments/godot-visual-ab-harness/` now expresses the required nine-layer
  compositor as exact-order named and grouped nodes: starfield, far backdrop, stage
  floor, enemy units, party units, emissive pass, foreground occluders,
  bloom/grade/vignette composite, and UI.
- Layer 8 owns a transparent 960×540 `SubViewport`. Layer 9 is a sibling
  `CanvasLayer` at layer 100, outside post-processing. Startup validation checks
  node names, order, groups, z indices, post size, and UI separation and exits
  nonzero on a mismatch.
- `F1`–`F9` toggle the real contract nodes, `F10` restores them, and `D` arranges
  those same nodes into a diagnostic 3×3 mosaic without changing fixture time.
  Cached low-resolution sources and soft-geometry proxies avoid any
  full-resolution per-frame blur.
- Both unapproved Empire skirmish backgrounds remain read-only neutral A/B inputs.
  The canonical `godot/` client was not referenced or modified by this proof, and
  neither candidate was selected or registered.

### Verification and deterministic captures

Runtime: Godot `4.7.2.stable.official.ed1daf0bf`, Compatibility renderer.

- All four changed GDScripts passed `--check-only` with exit 0:
  `scripts/main.gd`, `scripts/compositor_layer.gd`,
  `scripts/post_composite.gd`, and `scripts/diagnostic_overlay.gd`.
- Headless import exited 0.
- The fully composed scene completed a bounded 180-frame smoke with exit 0. The
  diagnostic 3×3 mosaic completed a bounded 60-frame smoke with exit 0. Both
  validated the exact layer contract and 960×540 post/UI separation.
- `docs/screenshots/godot-nine-layer-composite-proof-2026-08-23.png` is a 1280×720
  fixed-state capture with SHA-256
  `3B0707A440461FD98E1740D66CE20D0DCC02796A3E01467942E4D22A6A454D57`.
- `docs/screenshots/godot-nine-layer-diagnostic-proof-2026-08-23.png` is the same
  state arranged as nine real-layer tiles, 1280×720, with SHA-256
  `3BBF737ED0D335583D74B2C5CFAA0CFBA59D367EC36BFE7E9963B8B6E8EF0E24`.
  In both capture runs, the second paused frame was byte-identical to the promoted
  first frame.

### Exact limitations and next gate

- The flat A/B plates do not prove authored far/mid/floor/foreground separation,
  parallax, masks, perspective agreement, or a production depth-blur treatment.
- Procedural blocks and broad bloom proxies do not prove transparent sprite edges,
  animation states, anchors, sockets, battle-scale readability, material response,
  or final shader quality.
- The short paused captures are not a sustained frame-rate, startup, memory, mobile,
  Web-export, browser, or GPU-profiler acceptance result. The fixed 16.667 ms smoke
  delta was command-authored scheduler input, not measured rendering performance.
- The next visual gate is developer review of the neutral background evidence,
  followed by one anonymous transparent combatant and a controlled full-raster
  versus hybrid motion A/B on the recorded study direction.

No gameplay, core, bridge, fixture, canonical Godot source, dependency, runtime art
registration, commit, or push change was made by this isolated proof.

## Pass 5 — canonical nine-layer compositor and true full-scene post

Status: implemented and independently verified; authored art and subjective shader
approval remain open.

- Canonical `godot/main.tscn` now owns exact physical layers 01–09. Layers 01–07
  compose in `WorldSourceViewport` at 960×540; layer 08 samples that exact composed
  texture in a second 960×540 viewport and enlarges it once to 1920×1080; layer 09
  remains `CanvasLayer` 100 outside both viewports.
- `F1`–`F9` toggle real contract nodes, `F8` exposes raw/post bypass, `F10` restores
  the stack, and `D` shows the physical diagnostic mosaic.
- Root independently passed the exact 11 owned canonical GDScript checks, all five
  bridge/audio/compositor validators, and both contact-gated replays: legacy 25/25
  and range-band 34/34 with two held interrupts and zero duplicate event audio.
- Normal capture SHA-256 is
  `EDBB3A40F3E9D652E4B741CC733BFB5F94F72D043C82C29074348DA72A9DC40E`;
  diagnostic SHA-256 is
  `BE323BBA6A317169FB345C26EA75B46505F79A056C511D5848BD08567BD11AB2`.
- Root visual inspection found no inversion, recursion, stale frame, doubled world,
  missing physical layer, or processed UI. Bloom remains a bounded eight-neighbor
  LDR study, not approved HDR/multi-radius production bloom.

Evidence: `docs/development/godot-canonical-compositor-pass-2026-08-23.md` and
`docs/development/godot-full-scene-post-pass-2026-08-23.md`.

## Pass 6 — seven-cue native audio and listening surface

Status: technically integrated; developer listening and real-device acceptance
remain open.

- The canonical file-free synth now renders four named melee cues, the restrained
  540 ms Disruptor, a 370 ms Force Shield containment rise/lock at 240 ms, and a
  455 ms nonmechanical psionic pressure/release at the 320 ms semantic contact.
- All seven cues have six deterministic variations and sample-identical repeat
  renders. New-family individual and combined offline stacks stay below the
  recorded 0.64 peak / 0.10 RMS ceilings.
- Canonical legacy audio accounting is now 19 rendered and eight intentional
  silences across 25 frames; range-band remains 20 rendered, three silent, two held
  interrupts, and zero duplicate interrupt-event audio across 34 frames.
- `experiments/godot-combat-audio-listening-harness/` loads the live production
  synth and exposes exact seven-cue × six-variation review. Root independently
  passed all six harness script checks, the 42-render structural validator, and the
  full 42-step scene scheduler smoke with output suppressed.
- Pinned Node 20 build, zero-warning lint, and all 134 tests passed. Headless
  evidence does not approve timbre, differentiation, device latency, cancellation,
  crackle/underrun behavior, soak stability, or Web output.

Evidence: `docs/development/godot-disruptor-audio-pass-2026-08-23.md`,
`docs/development/godot-combat-audio-listening-harness-2026-08-23.md`, and
`docs/development/godot-shield-psionic-audio-pass-2026-08-23.md`.

## Pass 7 — Power Melee transparent A/B and combatant review harness

Status: useful visual evidence; both choices deliberately fail package readiness.

- Two genuinely transparent, unapproved single-keyframe studies survive. Choice A
  is 1240×1269 RGBA; Choice B is 1024×1536 RGBA. Neither is selected or registered.
- The isolated Godot harness compares both at 320/360/400 px battle heights on
  dark, light, checker, and two neutral Empire backgrounds, with ground/safe-bound
  overlays and fail-loud source/hash/alpha checks.
- Normal structural validation exits 0. Strict readiness intentionally exits 3
  with seven documented blockers. Choice A has one alpha=1 residue pixel at
  `(0,1268)` plus only 13 px substantive top padding; Choice B has 24 px strict /
  28 px substantive bottom padding against the provisional 40 px requirement.
- Both remain one idle-like frame with no clips, timing, events, sockets, masks,
  stationary-foot evidence, normalized cells, or runtime manifest. Six promoted
  capture pairs were byte-identical.

Evidence: `docs/development/godot-power-melee-art-study-2026-08-23.md` and
`docs/development/godot-power-melee-combatant-study-harness-2026-08-23.md`.

## Pass 8 — isolated layered Empire battle-stage A/B

Status: deterministic review evidence; no layer or background choice selected.

- `experiments/godot-empire-layered-battle-study/` combines the existing matching
  Imperial A/B backdrop, stage-floor, and foreground candidates as physically
  separate sources, with neutral units/emissives, one 960×540 full-world post, raw
  bypass, and crisp UI outside post.
- Root passed five script checks, import, strict source/hash/dimension/alpha and
  compositor validation, plus bounded A-post and B-raw scene smokes.
- Repeated 1920×1080 A and B captures were byte-identical; A/B SSIM was 0.491964,
  confirming materially different compositions. Root inspection found valid
  upright output and UI separation; both remain dark around stand-ins and do not
  prove final foot-plane, parallax, masks, or authored combatant integration.

Evidence: `docs/development/godot-empire-layered-battle-study-2026-08-23.md`.

## Pass 9 — Web and concurrent ranged-audio preflights

Status: blockers recorded; neither path is represented as integrated or accepted.

- The runnable Web preset exists, but the matching local Godot 4.7.2 export-template
  directory does not. No payload, startup, performance, browser, or Web-audio result
  was claimed.
- A concurrent isolated Particle/Scatter/Plasma bank now parses and its weakened
  validator passes, but the bank is not connected to canonical playback. Scatter
  variation 1 is only 1.02596× Plasma peak; the original 1.04× hierarchy remains
  unmet even though the concurrent validator relaxed that gate to merely >1.0×.
  No integration pass or canonical consumer exists.

Evidence: `docs/development/godot-web-export-preflight-2026-08-23.md` and
`docs/development/godot-ranged-cue-bank-read-only-audit-2026-08-23.md`.

## Pass 10 — motion-pipeline wrap checkpoint

Status: stopped on developer request as runnable but incomplete evidence.

`experiments/godot-combatant-motion-study/` parses, imports, validates 1,360
timeline/pipeline/asset combinations with zero measured raster/shader anchor error,
and passes a fixed 60-frame contact smoke. No capture was promoted and Choice B,
the remaining states/backgrounds, strict readiness, and final visual QA were not
completed. It is not animation coverage or package approval. Exact state is in
`docs/development/godot-power-melee-motion-pipeline-study-checkpoint-2026-08-23.md`.

No pass in this continuation changed gameplay values, authoritative bridge/core
resolution, fixtures, dependencies, commits, pushes, or the Canvas rollback client.
## Pass 11 — canonical ten-cue audio and current three-role art handoff

Status: technically integrated and verified; subjective audio and art approval
remain open.

- Restored the original 1.04x Scatter-over-Plasma peak gate and raised Scatter
  through one explicit 1.06 pre-output authority gain. The narrowest passing ratio
  is 1.07444x; maximum ranged peak is 0.63139 below the 0.6801 ceiling.
- Canonical Godot now renders Particle, Scatter, and Plasma through the isolated
  ranged bank without duplicating cue policy or combat resolution. Legacy replay
  accounting is 21 rendered / 6 silent; range-band remains 20 / 3.
- The live-source listening harness now covers ten cues x six variations. Its
  60-render structural validator and full 60-step scheduler smoke pass with output
  suppressed.
- The art catalog now records 35 families and replaces the stale Power v1 record
  with normalized Power v2 plus current Critical and Queue Control idle pairs. All
  remain proposed, unselected, unregistered, and incomplete animation packages.
- All 13 canonical scripts and six harness scripts pass check-only. Six canonical
  validators, both replay smokes, build, zero-warning lint, 134 tests, catalog parse,
  and the 21/21 combatant-package self-test pass.
- Subjective ten-cue listening, device/Web evidence, and developer art selection
  remain required. No gameplay, bridge schema, fixture content, dependency, audio
  binary, commit, or push changed.

Evidence: docs/development/godot-ranged-audio-integration-2026-08-23.md.

## Pass 12 — complete range-band party A/B review surface

Status: deterministic visual-review evidence; developer selection remains open.

- Added `experiments/godot-range-band-party-art-review/`, a neutral Godot surface
  that compares current Power, Critical, and Queue Control A/B idle studies as
  complete party families at reversible 320/360/400 px 1080p heights.
- Six live `art/choices/` sources and both optional Empire contexts are pinned by
  path, SHA-256, byte length, dimensions, RGBA encoding, exact alpha bounds, and
  edge safety. Validation exits 0 with four explicit approval/package blockers.
- Formation, complete side-by-side, three-matte role, and six-source diagnostic
  views pass. Three native 1920×1080 captures were promoted after visual inspection;
  no crop, ground-anchor separation, rectangular matte, or label collision was
  observed.
- Choice A descriptively shows stronger role-color separation within a practical
  travel-coat family. Choice B shows stronger hard-surface squad uniformity but more
  cross-role palette overlap. No preference was selected on the developer's behalf.
- No canonical Godot, manifest registration, runtime package, animation, gameplay,
  bridge, audio, dependency, commit, or push change was made.

Evidence: `docs/development/godot-range-band-party-art-review-2026-08-23.md`.

## Pass 13 — range-band party resolved-timeline motion rehearsal

Status: complete as isolated comparison evidence; developer art and motion
selection remain open.

- Finished the interrupted fifth view in
  `experiments/godot-range-band-party-art-review/`. Both full party branches now
  consume the same hash-pinned 34-frame, 25.75-second authoritative range-band
  replay without resolving combat in GDScript.
- Added frame stepping, play/pause and speed controls, contact-gated visible state,
  band-to-band advance interpolation, restrained melee/disruptor poses, procedural
  action traces, HP/band readouts, and deliberately abstract opponent markers.
- The review uses only anchor-preserving whole-raster transforms over each existing
  idle source. It adds no sprite frames, sockets, masks, packages, manifest
  registration, background choice, or canonical Godot integration.
- Godot script check, full source/timeline validation, and three representative
  scene smokes exit 0. Three final 1920×1080 stills and a 194-frame, 6.466667-second
  4× MP4 were promoted after visual inspection.
- `npm.cmd run verify:quality` passes the production build, 0-error/0-warning lint,
  and 134 tests in 29 files. The restricted Windows sandbox initially blocked
  esbuild child-process launch with `spawn EPERM`; the identical escalated rerun
  passed. Balance was not run because this pass changes no gameplay/core/data.
- Headless dummy-renderer Movie Maker crashed before capture; normal headless scene
  smokes remained green, and final evidence was produced through the real OpenGL
  Compatibility renderer on the NVIDIA GeForce RTX 5080.

Evidence:
`docs/development/godot-range-band-party-motion-rehearsal-2026-08-23.md`.
