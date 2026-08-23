# Production Pass Ledger

Updated: 2026-08-23

## Purpose

This is the chronological source of truth for what changed in each game-development
pass. Detailed technical, art, audio, and verification reports remain authoritative
for their own measurements; this ledger links them into one developer-readable
handoff.

Every completed pass must update this file before work is handed back. Interrupted
passes receive an explicit checkpoint, including unverified edits and the exact
continuation point. A missing ledger entry means the pass is not complete.

## Documentation recovery — pass-ledger enforcement

Status: **complete documentation pass**.

This pass created the cumulative ledger, reconstructed the existing combat and
Godot pass index from their detailed records, recorded the interrupted Pass 13
checkpoint, and made ledger updates mandatory in `AGENTS.md`,
`docs/development/workflow.md`, and `docs/PROJECT-STATE.md`. It intentionally changed
no gameplay, assets, audio, bridge data, or Godot runtime behavior.

Verification is documentation-only:

- `git diff --check -- AGENTS.md docs/PROJECT-STATE.md
  docs/development/workflow.md` exited 0;
- the new ledger has zero trailing-whitespace matches;
- all 19 linked Markdown files exist.

The current game-code parse failure is reported under Pass 13 and is not attributed
to this documentation pass.

## Current position

### Pass 13 — range-band party resolved-timeline motion rehearsal

Status: **complete as isolated comparison evidence; developer selection remains
open**.

The interrupted functions are implemented. The fifth review view now runs complete
Party A and Party B side-by-side through the same hash-pinned 34-frame,
25.75-second authoritative replay. It provides resolved-frame/time stepping,
playback speed control, contact-gated state reveal, advance interpolation,
restrained anchor-preserving whole-raster action poses, procedural disruptor/melee
traces, abstract opponent markers, and clear HP/band/action readouts.

Material scope remains isolated to the review harness, its manifest/instructions,
three promoted PNGs, one short MP4, and pass documentation. No animation frames,
gameplay, bridge schema/fixture content, audio, dependency, raster package,
canonical Godot registration, art decision, commit, or push changed.

Measured verification:

- Godot `scripts/main.gd --check-only`: exit 0;
- scene validation: exit 0 with five intentional approval/package blockers;
- three representative motion scene smokes: exit 0;
- three final 1920×1080 stills inspected at full resolution;
- 4× motion capture: 194 frames, 1920×1080, 30 FPS, 6.466667 seconds;
- `npm.cmd run verify:quality`: build passed, lint 0/0, 134 tests passed in
  29 files.

The restricted Windows sandbox initially blocked esbuild with `spawn EPERM`, and
headless dummy-renderer Movie Maker crashed on a null texture. The identical quality
gate passed outside the process-launch restriction; normal headless scene checks
passed, and final captures succeeded through the real OpenGL Compatibility renderer.
Balance was skipped because the pass is presentation-only.

Detailed evidence: [Pass 13 motion rehearsal](godot-range-band-party-motion-rehearsal-2026-08-23.md).

### Godot 14 — owner-staged hybrid combat-audio replacement bank

Status: **implemented and technically verified; developer listening approval
remains open**.

This pass replaced the source path—not the semantics—for the four melee cues and
Particle, Scatter, and Plasma that had the clearest negative listening feedback.
A strict manifest now allowlists 26 WAVs from the developer's purchased
Humble/GameDev Market library. The safe stager, SHA/WAV validator, aligned playback
bank, `auto`/`procedural`/`licensed` runtime modes, canonical bridge integration,
and 10×6 hybrid listening route are implemented. Purchased sources, proof of
purchase, and staged WAVs remain owner-controlled and Git-ignored. Disruptor,
Shield, and Psionics remain procedural. No combat/core rule, bridge schema,
fixture, dependency, balance value, commit, push, or deployment changed.

Measured verification:

- local staging copied all 26 selected assets; the second run retained 26/26 with
  zero copies, and `git ls-files -- godot/assets/audio/licensed` remained empty;
- 21/21 relevant canonical/harness GDScripts passed `--check-only`, and Godot import
  processed all 26 staged WAVs;
- procedural, ranged, and strict licensed validators passed; the licensed result
  was `state=ready`, seven cues, 26 hash-matched/manifested assets, 13 deterministic
  selected layers, and a passing absent-public-state probe;
- both full fixtures passed in procedural and required-licensed modes: legacy
  routed 13 licensed/8 procedural when licensed was required; range-band routed 18
  licensed/2 procedural and retained its exact two held interrupts;
- listening validator and scheduler smoke each passed all 60 selections with 42
  licensed/18 procedural in `auto`; a procedural scheduler run passed 0/60;
- build passed with 40 modules and the two recorded Vite browser-externalization
  warnings, lint passed at zero warnings/errors, and tests passed 134/134 across
  29/29 files; and
- `git diff --check` passed. Balance was skipped as presentation-only.

All automated playback was output-suppressed, so none of this approves timbre,
impact, mix, device latency, cancellation, soak, ordinary-speaker translation, or
Web behavior. The next step is developer same-device A/B in the harness using
`--audio=auto` and `--audio=procedural`, reviewing the four melee cues first and
then Particle, Scatter, and Plasma.

Detailed evidence: [Hybrid licensed combat audio](godot-hybrid-licensed-combat-audio-pass-2026-08-23.md).

### Godot 15 — hybrid-audio project reconciliation

Status: **complete integration audit and workflow hardening; developer listening
approval remains open**.

This pass confirmed that the owner-staged bank is wired through the canonical
Godot client and shared 10×6 listening harness, that its exact seven-cue allowlist
uses all 26 declared assets, and that Disruptor, Shield, and Psionics remain
procedural. The staging command now refuses to copy unless Git confirms the
destination is ignored. Project status now recognizes Godot work and recommends
the required GDScript and headless gates. No cue recipe, gain, timing, licensed
binary, gameplay rule, bridge fixture, dependency, commit, push, or deployment
changed.

Measured verification:

- staging was idempotent at 0 copied / 26 verified, with zero tracked licensed
  files;
- manifest audit found seven exact cues, 26 assets, 21 variations, 39 layer
  definitions, and zero missing or unused assets;
- 21/21 canonical and listening-harness GDScripts passed `--check-only`;
- the strict licensed validator passed seven cues / 26 assets / 13 deterministic
  selected layers plus the empty-public-state probe;
- required-licensed legacy and range-band replays passed 25/25 and 34/34 snapshots,
  routing 13/8 and 18/2 licensed/procedural cues respectively;
- listening auto passed 42 licensed / 18 procedural selections, and forced
  procedural passed 0 / 60; and
- `npm run verify:quality` passed a 40-module build, lint 0/0, and 134/134 tests in
  29 files on installed Node 24.19.0. The project still requires Node 20.

Balance and bridge-fixture regeneration were correctly skipped. Automated output
was suppressed, so listening/device/Web approval remains open. Next, perform the
same-device `auto` versus `procedural` listening review and record per-cue decisions.

Detailed evidence: [Hybrid audio reconciliation](godot-hybrid-audio-reconciliation-2026-08-23.md).

### Commit preparation — external art archive and coherent local history

Status: **complete locally; main-repository push remains developer-controlled**.

The root ignore policy now hides nested Godot caches, generated GDScript UID
and shader UID sidecars, TypeScript build-info artifacts, and unreferenced
one-frame Movie Maker WAV stubs without deleting them. The remaining
audit found 501.10 MiB across 294 untracked media files, including 216.59 MiB of
current catalog media and 72.67 MiB of exact duplicate bytes. The asset register
deliberately preserves superseded provenance, so no art was deleted or silently
selected. Licensed audio remains ignored and untracked.

Ordinary Git would bring this actively changing Pages source repository close to
GitHub's recommended 1 GiB envelope, while Git LFS cannot back a GitHub Pages source
repository. The developer approved the separate repository. The 265-file art tree
was copied with zero SHA-256 mismatches, committed to private Git LFS repository
`DaCheeze/deathstalker-rpg-art` as `e1a26c4`, and pushed successfully. LFS uploaded
236 unique objects (430 MiB after deduplication), remote `main` equals the verified
local commit, and `git lfs fsck` passes. The game repository now ignores optional
exploratory binaries below `art/` while retaining its metadata and local review
files. No candidate was deleted, selected, or integrated.

The main repository is split into three implementation commits:
`f862af6` restores the combat presentation and range-band prototype, `59b7104`
separates exploratory art storage, and `6f11675` adds the Godot presentation bridge
and hybrid audio. The main repository has not been pushed. The Windows ACL failure
was traced to a 22-byte NUL-corrupted Codex `deny_read_acl_state.json`, preserved as
a backup and regenerated as valid state. Native sandbox setup and ordinary commands
now complete under the configured `elevated` Windows sandbox. This task's managed
profile intentionally keeps `.git` read-only, so Git metadata writes correctly use
the approval path; that remaining boundary is policy rather than ACL corruption.

Verification: diff checks pass; build passes with the existing Vite Node builtin
warnings; lint reports 0 warnings/0 errors; tests pass 134/134 in 29 files; all 38
staged GDScripts pass `--check-only`; both fixtures regenerate and all canonical
bridge, compositor, audio, licensed-bank, replay, listening-harness, and study
checks exit 0. The two-seed balance gate still fails the recorded baseline at 14
out-of-band metrics, although both recommended-level seeds complete at 100%.
Installed Node is 24.19.0 rather than required Node 20 LTS. Visual quality,
same-device listening, and Web audio approval remain subjective developer gates.

Detailed evidence: [Commit-preparation checkpoint](repository-commit-preparation-checkpoint-2026-08-23.md).

## Recorded pass index

### 2026-08-22 — combat restoration sequence

| Pass | Outcome | State | Detailed record |
|---|---|---|---|
| Restoration 0 | Recovered audiovisual evidence and isolated reported failures. | Complete evidence pass | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-0---evidence-recovery-and-failure-isolation) |
| Restoration 1 | Reduced range-band opening pressure and restored restart recovery. | Implemented and verified | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-1---range-band-opening-pressure-and-restart-recovery) |
| Restoration 2 | Added named attack identities and bounded transient variation. | Implemented; listening remained open | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-2---named-attack-identities-and-transient-variation) |
| Restoration 3 | Unified semantic audio/visual contact timing for live combat and replay. | Implemented and verified | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-3---shared-audiovisual-contact-timing) |
| Restoration 4 | Ran the full regression and produced the developer review route. | Complete technical handoff | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-4---full-regression-and-review-handoff) |
| Restoration 5 | Revised melee audio from the clean-room reference analysis. | Implemented; listening remained open | [Combat restoration log](combat-restoration-pass-log-2026-08-22.md#pass-5---reference-driven-melee-audio-revision) |

Supporting records from this sequence include the
[cloud-chat recovery](cloud-chat-recovery-2026-08-22.md),
[balance diagnosis](balance-diagnosis-2026-08-22.md), and
[Gemini audiovisual workflow](gemini-audiovisual-review.md).

### 2026-08-23 — staged Godot transition

| Pass | Outcome | State | Detailed record |
|---|---|---|---|
| Godot 0 | Recorded the engine decision, authority boundary, and cutover gates. | Complete decision baseline | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-0--decision-baseline) |
| Godot 1 | Added the strict TypeScript presentation bridge and canonical replay client. | Implemented; architecture review open | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-1--canonical-bridge-and-replay-client) |
| Godot 2 | Added bounded Godot-native procedural combat audio. | Implemented; listening open | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-2--bounded-native-procedural-combat-audio) |
| Godot 3 | Added strict legacy/range-band fixture selection and replay validation. | Implemented; presentation review open | [Transition log](godot-transition-pass-log-2026-08-23.md#pass-3--strict-dual-fixture-selector) |
| Godot 4 | Proved the isolated nine-layer compositor architecture. | Complete technical evidence; visual approval open | [Compositor proof](godot-nine-layer-compositor-proof-2026-08-23.md) |
| Godot 5 | Integrated the canonical nine-layer compositor and true full-scene post path. | Implemented and verified; authored-art review open | [Canonical compositor](godot-canonical-compositor-pass-2026-08-23.md) and [full-scene post](godot-full-scene-post-pass-2026-08-23.md) |
| Godot 6 | Expanded native audio to seven cues and added a listening surface. | Technically integrated; listening/device approval open | [Listening harness](godot-combat-audio-listening-harness-2026-08-23.md) |
| Godot 7 | Built transparent Power Melee A/B sources and a strict review harness. | Reviewable evidence; both packages intentionally blocked | [Art study](godot-power-melee-art-study-2026-08-23.md) and [study harness](godot-power-melee-combatant-study-harness-2026-08-23.md) |
| Godot 8 | Built an isolated layered Empire battle-stage A/B study. | Deterministic evidence; selection open | [Layered stage study](godot-empire-layered-battle-study-2026-08-23.md) |
| Godot 9 | Audited Web export and concurrent ranged-audio readiness. | Blockers recorded; not integrated | [Web preflight](godot-web-export-preflight-2026-08-23.md) and [ranged audit](godot-ranged-cue-bank-read-only-audit-2026-08-23.md) |
| Godot 10 | Built and wrapped the isolated Power Melee motion-pipeline checkpoint. | Runnable but intentionally incomplete | [Motion checkpoint](godot-power-melee-motion-pipeline-study-checkpoint-2026-08-23.md) |
| Godot 11 | Integrated ten native cue identities and reconciled current three-role art. | Technically verified; audio/art approval open | [Ranged integration](godot-ranged-audio-integration-2026-08-23.md), [disruptor pass](godot-disruptor-audio-pass-2026-08-23.md), and [shield/psionic pass](godot-shield-psionic-audio-pass-2026-08-23.md) |
| Godot 12 | Built the complete three-role party A/B review surface with pinned sources and captures. | Runnable deterministic evidence; developer selection open | [Party A/B review](godot-range-band-party-art-review-2026-08-23.md) |
| Godot 13 | Ran both party branches through one pinned resolved timeline with restrained whole-raster motion and promoted still/video evidence. | Complete isolated comparison; developer selection open | [Motion rehearsal](godot-range-band-party-motion-rehearsal-2026-08-23.md) |
| Godot 14 | Added a strict owner-staged licensed replacement bank for four melee and three ranged cues while preserving procedural fallback. | Implemented and verified; listening/device/Web approval open | [Hybrid licensed audio](godot-hybrid-licensed-combat-audio-pass-2026-08-23.md) |
| Godot 15 | Reconciled hybrid audio with repository safety and verification workflow, adding a fail-closed ignore preflight and Godot-aware project status. | Complete integration audit; listening/device/Web approval open | [Hybrid audio reconciliation](godot-hybrid-audio-reconciliation-2026-08-23.md) |

## Required entry format for the next pass

Each new entry must include:

1. objective and state: complete, incomplete, blocked, or rejected;
2. material files and player-visible behavior changed;
3. exact commands, exit codes, test counts, captures, or measurements;
4. skipped checks and subjective developer-review gates;
5. the next concrete continuation point.
