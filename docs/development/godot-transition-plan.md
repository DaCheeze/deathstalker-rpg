# Godot Production Plan

Updated: 2026-08-23

## Production decision and authority boundary

Godot 4 is the sole presentation client. The former Vite/Canvas/Web Audio client is
frozen historical source and is not a fallback, parity target, comparator,
deployable client, acceptance reference, or destination for new work.

The cutover does not move game authority into GDScript:

- pure TypeScript remains authoritative for validated content, seeded RNG, AI,
  action legality, damage, displacement, status, queue state, persistence, outcomes,
  simulation, and replay generation;
- browser-free TypeScript presentation policy resolves semantic action/event audio
  names and visual timing before serialization;
- `godot/` consumes validated, versioned plain data and presents resolved actions;
- Godot never calculates combat outcomes or invents missing bridge semantics; and
- bounded snapshots/events cross the bridge at game transitions. Do not introduce a
  permanent high-frequency TypeScript-to-Godot synchronization loop.

Legacy Canvas source may remain until a deliberate cleanup pass can separate it
from still-shared TypeScript controllers and presentation policy. Its continued
presence does not make it supported production software.

## Non-negotiable boundaries

1. GDScript does not calculate combat, choose targets/actions, advance queues,
   manage cooldowns, roll RNG, or infer outcomes.
2. Godot does not remap ability IDs to audio or feedback policy. It consumes
   semantic cue names and resolved timing from TypeScript.
3. A bridge breaking change increments the schema version. Unsupported documents
   fail before presentation starts.
4. Asset manifests, provenance, transparent sprites, anchors, scale, animation
   states, and fail-loud loading remain required for production assets.
5. Godot Web evaluation uses the Compatibility renderer and a single-threaded
   export first.
6. Owner-staged licensed audio remains Git-ignored. The repository-safe Godot path
   must retain procedural coverage for all seven eligible weapon cues.
7. `disruptor`, `shield_raise`, and `psionic` remain procedural in every mode.
8. No new Canvas rendering, Web Audio, browser UI, parity testing, comparison
   capture, deployment, or performance work is in scope.

## Current production state

- The strict version-1 bridge and deterministic legacy/range-band fixtures are
  implemented.
- The canonical Godot client validates and replays 25-frame legacy and 34-frame
  range-band documents without owning combat resolution.
- The exact nine-layer compositor and true full-scene half-resolution post path are
  integrated in `godot/`; UI remains outside post-processing.
- Ten procedural cue identities are integrated. Seven weapon cues may use the
  strict owner-staged licensed bank through `auto`, `procedural`, or `licensed`.
- Art studies and A/B harnesses remain review evidence. No full production
  combatant animation package or authored stage branch is selected and registered.
- The transport-neutral live-session protocol, Web host bundle, custom shell, Godot
  response client, canonical action menu, transition queue, and restart path are
  implemented. The official matching Web templates are installed locally and a
  complete exported-game keyboard/pointer interaction pass is green. Deliberate
  exported fault injection, touch/multi-browser coverage, device latency, sustained
  soak, complete-encounter coverage, and an approved release pipeline remain open.
- The active live slice starts directly Engaged and exposes immediate melee without
  `Advance`; the older range-band movement loop remains fixture-only evidence. Its
  Godot command card is translucent, follows the active party member, stays clear of
  party names/bodies, and disappears during resolved player and enemy transitions.
- The first manually published Godot Web preview is live on GitHub Pages from an
  isolated artifact-only `gh-pages` branch. This proves remote hosting and one live
  action path, but it is not a reproducible source-to-artifact release pipeline.

## Phase 1 — live authoritative bridge loop

Status: in progress. The representative live player/AI loop and restart path are
connected and exported; an actual exported retry/error-injection proof and complete
encounter coverage remain before closing the phase.

Replace static-fixture-only presentation with bounded live messages from the
authoritative TypeScript game session. Godot sends input intents; TypeScript returns
validated resolved state/action/event documents. Save/load, restart, replay, and
error recovery remain owned at explicit boundaries.

Exit gates:

- representative player actions travel Godot input → TypeScript resolution → Godot
  presentation without GDScript combat logic;
- queue, targeting, cooldown, range-band, damage, displacement, status, and outcome
  changes match authoritative serialized state;
- restart and replay clear pending presentation/audio state safely;
- malformed, stale, duplicated, and unsupported messages fail deterministically;
- bridge fixture regeneration, TypeScript tests, changed GDScript checks, and
  canonical headless smokes pass.

Best venue: local. It requires simultaneous Godot runtime, TypeScript process, and
interactive input debugging.

## Phase 2 — authored production presentation

Status: architecture implemented; art selection and complete packages open.

Select approved environment and party branches, convert combatants into complete
anchored animation packages, register them through strict manifests, and exercise
the canonical compositor with real production assets. Cover idle, advance,
anticipation, contact, recovery, hit, defeat, status, queue, target selection,
pause, replay, resize, and representative accessibility/input states.

Exit gates:

- developer rates readability and impact at least 4/5 in the Godot client;
- all required animation states, anchors, scale, provenance, and fail-loud loading
  pass against real manifests and PNGs;
- input, queue, target, status, action, and outcome information remain legible;
- median frame time is at most 16.7 ms and p99 at most 33.3 ms on each native target;
- relevant captures are reviewed at full resolution; and
- `npm run godot:assets:validate` and canonical scene checks remain green.

Best venue: local. Editor iteration and subjective visual review require the
developer display and direct interaction.

## Phase 3 — production audio, device, and Web acceptance

Status: structural audio integration complete; listening/device/Web acceptance open.

Approve or revise the ten current cue families, add reactive/outcome families,
measure audible-device behavior, and produce a single-threaded Compatibility Web
build. All source modes continue to consume the same TypeScript-resolved semantic
cues and timing.

Exit gates:

- p95 semantic trigger-to-audible latency is at most 80 ms with no crackle or
  underrun during a 10-minute stress run;
- restart, pause, hit-stop, replay speed, and device cancellation behavior are
  explicitly accepted;
- proposed compressed Web payload is at most 15 MiB;
- interactive startup is at most 4 seconds on required desktop targets and 8
  seconds on required mobile targets;
- median frame time is at most 16.7 ms and p99 at most 33.3 ms on every Web target;
- required browsers load with zero console errors; and
- 100 repeated fixture/session runs produce the same final state/event hash.

Best venue: hybrid. Author and profile locally; use CI or cloud only for repeatable
exports and multi-environment artifact checks after local proof.

## Phase 4 — Godot release pipeline

Status: in progress. A manual artifact-only GitHub Pages preview is deployed;
repeatable export, verification, promotion, and rollback automation are not.

Add one-command native and Web exports, preview deployment, cache/header policy,
release diagnostics, and CI artifact verification. The old Canvas Pages bundle is
not deployed while this work is incomplete.

Exit gates:

- build/export and preview deployment are reproducible locally and in CI;
- representative combat/run paths, save/load, restart/replay, and recovery pass;
- release artifacts meet Phase 2 and Phase 3 performance and acceptance gates;
- rollback means reverting to a prior known-good Godot artifact, schema, and
  TypeScript core revision—not switching presentation clients; and
- the developer explicitly authorizes public Godot deployment.

Best venue: hybrid. Export and first-run diagnosis are local; repeatable packaging
and preview delivery belong in CI after local success.

## Phase 5 — legacy source cleanup

Status: deferred until the live bridge replaces shared browser wiring.

Remove frozen Canvas renderer, browser UI/input, Web Audio, Vite entry point, and
obsolete browser-only tests only after imports and tests prove they are not carrying
authoritative core, bridge, simulation, or shared semantic policy. Preserve useful
historical evidence in Git history and pass records rather than keeping it active.

Exit gates:

- `src/core/`, `src/data/`, `src/bridge/`, and `src/sim/` remain browser-free and
  fully verified;
- no Godot production path imports legacy browser presentation code;
- package scripts and CI contain no Canvas build, preview, benchmark, or deploy;
- no authoritative behavior or required diagnostic is lost; and
- build, zero-warning lint, tests, bridge fixtures, and affected Godot checks pass.

Best venue: local. Import-graph inspection and deletion verification are repository
work with no benefit from remote execution.

## Production readiness matrix

| Area | Current evidence | Required for release |
|---|---|---|
| Core authority | Deterministic TypeScript core, strict fixtures, and exported bounded player/AI loop | Complete-session and injected-failure coverage |
| Combat rules | TypeScript only | Remain TypeScript unless separately authorized |
| Queue/status | Serialized IDs, order, ticks, bars, and fields | Complete Godot input and edge-state presentation |
| Feedback timing | Shared duration/contact/beam anchors | Accepted hit-stop, pause, speed, and contact behavior |
| Audio | Ten Godot-native semantic identities and seven-cue licensed option | Listening, latency, reset, soak, reactive/outcome, and Web acceptance |
| Compositor | Canonical exact nine-layer Godot implementation | Selected authored assets and sustained target performance |
| Assets | Studies plus strict package validator | Approved manifests, provenance, anchors, scale, and animation states |
| Web | Local export: 10.06 MiB gzip-simulated, 533.70 ms startup, keyboard/pointer interaction | Hosted transfer, p99 frame, multi-browser/mobile, and deployment gates |
| Deployment | Quality-only source CI plus manually published Godot `gh-pages` preview | One-command verified exports and approved preview/release pipeline |
| Accessibility/input | Not claimed | Required keyboard, pointer, touch, and readability paths |

Passing native/headless metrics does not substitute for Web evidence. Automated
checks do not substitute for subjective visual or audio acceptance.

## Schema and source policy

- `src/bridge/` owns the browser-free TypeScript contract and serializer.
- `godot/schema/` owns the checked-in machine-readable schema copy.
- `godot/scripts/presentation_bridge_loader.gd` independently validates supported
  documents and fails before presentation starts.
- `godot/data/` fixtures are deterministic generated artifacts, not hand-authored
  combat outcomes.
- Licensed source files, purchase records, and staged WAVs remain owner-controlled
  and outside Git; their absence is a supported repository state.
- Additive compatible fields still require tests and consumer handling. Breaking
  fields, changed meaning, enum removal, or unit changes require a new schema.

## Recovery policy

Recovery uses known-good Godot artifacts, bridge schemas, fixtures, and TypeScript
core revisions. The frozen Canvas client is not a runtime rollback path. Before a
public release, retain the last known-good Godot artifact and its compatible bridge
and core revisions for at least one subsequent milestone.

## Durable reporting

Each production pass records exact files, commands, measured results, deferred
gates, and developer decisions in
`docs/development/production-pass-ledger.md`. Historical transition evidence remains
in `docs/development/godot-transition-pass-log-2026-08-23.md` and is not rewritten to
pretend the earlier staged decision never existed.
