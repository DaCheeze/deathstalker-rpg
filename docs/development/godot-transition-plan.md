# Staged Godot Transition Plan

Updated: 2026-08-23

## Decision and authority boundary

The developer has authorized a staged transition to a Godot-first presentation
client. This is not an authorization to port combat rules or retire the browser
client.

During the initial phases:

- the pure TypeScript core is authoritative for game data validation, seeded RNG,
  AI, action legality, damage, displacement, status, queue state, persistence,
  outcomes, simulation, and replay generation;
- shared browser-free TypeScript presentation policy resolves semantic action/event
  audio cue names and visual contact timing before serialization;
- `godot/` is the canonical production migration client and may render only
  validated, versioned bridge data;
- the Vite/Canvas/Web Audio client remains functional, test-covered, deployable,
  and the reference/rollback client;
- `experiments/godot-hd2d-spike/` remains historical evidence and is not promoted
  in place or rewritten.

Godot may become the preferred presentation authoring and runtime surface before
any wider architecture decision. TypeScript core authority can remain permanent if
that is the healthiest production boundary.

Detailed presentation authority lives in `docs/design/presentation.md`. The
portable combatant-raster package contract and its implemented validator live in
`docs/design/godot-combatant-raster-asset-contract-v1.md`; passing that validator
does not select or approve art. Canonical-client operation and current limitations
are documented in `godot/README.md`, while isolated visual architecture evidence is
documented in `experiments/godot-visual-ab-harness/README.md`.

## Non-negotiable boundaries

1. GDScript does not calculate combat, choose targets/actions, advance queues,
   manage cooldowns, roll RNG, or infer outcomes.
2. Godot does not remap ability IDs to audio or feedback policy. It consumes
   semantic cue names and resolved timing from TypeScript.
3. No per-frame TypeScript-to-Godot state bridge is introduced. Production
   integration uses bounded snapshots/events at game transitions.
4. A bridge breaking change increments the schema version. A v1 consumer must fail
   loudly on an unsupported document.
5. Browser capabilities are not deleted, weakened, or hidden to make Godot appear
   complete. Parity is measured against the working reference.
6. Existing asset manifest, provenance, transparent sprite, anchor, scale,
   animation-state, and fail-loud requirements apply before any art is integrated.
7. Web evaluation uses the Compatibility renderer and a single-threaded export
   first. Native-only quality is not browser evidence.
8. Licensed Humble/GameDev Market source files, purchase records, and locally staged
   WAVs remain owner-controlled; staged WAVs are Git-ignored. A public checkout must
   remain functional through repository-safe procedural synthesis.
9. Only `vibro_blade`, `twin_vibro_daggers`, `heavy_smash`, `concussive_shove`,
   `particle`, `ballistic_scatter`, and `plasma` may select licensed assets.
   `disruptor`, `shield_raise`, and `psionic` remain procedural, and source mode
   selection never changes semantic cue IDs or contact timing.

## Phases

### Phase 0 — decision and technical baseline

Status: complete.

The isolated spike established that Godot 4.7.2 Compatibility can load static JSON,
render a deterministic presentation loop, run headlessly, and expose an A/B review
surface without owning combat. It did not pass the visual, Web, audio, browser,
startup, workflow-speed, or deployment gates. Its hand-shaped fixture and prototype
script remain evidence only.

Exit condition: explicit developer authorization for a staged presentation
transition with the TypeScript/browser safety boundary recorded.

### Phase 1 — canonical bridge and replay client

Status: implemented locally; developer review pending.

Create `godot/`, version 1 of the presentation schema, a strict GDScript validator,
a pure TypeScript `BattleState` serializer, shared semantic audio/timing fields,
unit coverage, and deterministic fixture exporters. The canonical Godot scene must
load and replay the generated fixtures without calculations.

Exit gates:

- build, lint, and all Vitest tests pass;
- fixture regeneration is byte-identical for the same seed/data/core revision;
- strict Godot validation and a complete accelerated replay exit zero;
- malformed or incompatible inputs fail before rendering;
- the browser production build remains unchanged in behavior and passes its gates;
- the developer accepts the architecture boundary, not necessarily the stand-in
  visual quality.

### Phase 2 — authored presentation parity

Status: isolated nine-layer architecture proof complete; canonical authored
integration and developer acceptance remain open.

The isolated `experiments/godot-visual-ab-harness/` project now proves the exact
nine-layer hierarchy as inspectable Godot nodes, a half-resolution post boundary,
UI outside post-processing, layer toggles, and deterministic composite/diagnostic
captures. It intentionally does not modify `godot/`, integrate either unapproved
background, or prove authored combatant art, animation, parallax, shader quality,
sustained performance, or visual preference. This is architecture evidence, not a
Phase 2 exit.

Next, reproduce representative browser encounters in the canonical Godot client
using the v1 bridge and
approved assets or explicitly labeled procedural studies. Build the nine-layer
equivalent as inspectable nodes/resources, preserve transparent anchors and battle
scale, and author idle/advance/anticipation/contact/recovery/hit/defeat coverage.
Exercise live-size UI, target selection, queue changes, accessibility, pause/replay,
resize, and representative state/status combinations.

No gameplay values change in this phase. Any missing bridge semantic is added in
TypeScript and versioned; it is not inferred in GDScript.

Exit gates:

- the same authoritative snapshots/actions/events produce equivalent visible state
  in Canvas and Godot;
- developer review prefers Godot for depth/workflow and rates readability and impact
  at least 4/5;
- three representative authored revisions take no more than half the Canvas time;
- required animation states, anchors, asset provenance, and fail-loud loading pass;
- `npm run godot:assets:validate` remains green and every integrated package passes
  the same validator against its real manifest and PNGs;
- no regression in input legibility, status/queue information, or effect contact.

Best venue: local. Editor iteration, captured A/B review, and subjective visual
judgment require the developer's display and direct interaction.

### Phase 3 — Web and hybrid-audio integration

Status: ten-cue procedural baseline and seven-cue local licensed mode implemented
and structurally validated; device, Web, and listening parity remain open.

The canonical replay client now schedules pre-resolved action and event cue
occurrences exactly once and retains deterministic Godot-native procedural
identities for `vibro_blade`, `twin_vibro_daggers`, `heavy_smash`,
`concussive_shove`, `particle`, `ballistic_scatter`, `plasma`, `disruptor`,
`shield_raise`, and `psionic`. Unsupported valid cues are explicit silence rather
than a generic fallback. Headless validation proves buffer determinism, timing
bounds, routing, and reset behavior; it does not prove timbre, mix, device latency,
underrun safety, or subjective impact.

The approved hybrid extension permits the first seven weapon cues to use validated
locally staged licensed WAVs. Runtime modes are `auto`, `procedural`, and
`licensed`: `auto` prefers a valid local cue and otherwise uses procedural fallback;
`procedural` forces the public path; `licensed` requests the validated local bank
and reports unavailable or invalid staging. Disruptor, shield, and psionic audio
remain procedural in every mode. Stage declared assets only with
`npm run godot:audio:stage -- --source-root "C:\Users\Daniel\Desktop\Sound Effects"`.

Retain the current structural validation for all three modes and produce a
single-threaded Compatibility Web build.
Keep both Godot audio sources driven by the bridge's pre-resolved semantic cues and
timing, and keep procedural Web Audio operational as the parity/reference client.
Godot must reproduce the approved audio grammar without deriving cue policy from
ability IDs. Measure action to audible contact, startup, payload, frame time,
memory, cache refresh, and browser support on actual required devices.

Exit gates:

- median frame time at most 16.7 ms and p99 at most 33.3 ms on every target;
- proposed compressed payload at most 15 MiB;
- interactive startup at most 4 s desktop and 8 s required mobile;
- p95 semantic trigger-to-audible latency at most 80 ms with no crackle/underrun in
  a 10-minute stress run;
- Chrome, Edge, Firefox, required Safari, and required mobile targets load with zero
  console errors;
- 100 repeated fixture runs produce the same final state/event hash;
- `auto` and `procedural` remain valid with no staged licensed WAVs, while
  `licensed` reports unavailable or invalid local staging rather than silently
  changing source policy;
- existing TypeScript tests, simulation, and replay tooling stay authoritative and
  green.

Best venue: hybrid. Author and profile locally; use cloud/CI only for repeatable Web
export, artifact measurement, and multi-environment verification after local proof.

### Phase 4 — deployable parallel client

Status: not started.

Add one-command headless export, a non-default preview deployment, cache/header
policy, release diagnostics, and an explicit selector that keeps Canvas available.
Run representative encounter/run chains through bounded bridge messages rather than
a static fixture. Campaign and combat remain in TypeScript.

Exit gates:

- build/export and preview deployment are reproducible locally and in CI;
- required play paths, save/load boundary, restart/replay, and error recovery pass;
- no permanent high-frequency cross-runtime synchronization exists;
- the preview meets all Phase 2/3 gates over a sustained review period;
- the developer explicitly authorizes changing the default presentation client.

### Phase 5 — default-client decision and later cleanup

Status: not authorized.

Only after Phase 4 evidence may the developer choose Godot as the default Web
presentation. Retiring Canvas, changing the audio architecture, or moving any
authoritative game logic requires separate decisions and rollback plans. There is no
assumption that those later migrations are desirable.

## Parity matrix

| Area | Phase 1 evidence | Required before default switch |
|---|---|---|
| Core state | Serialized complete presentation snapshots | Representative full-run state/event parity |
| Combat rules | TypeScript only | Still TypeScript unless separately authorized |
| Queue/status | IDs, order, ticks, bars, fields in v1 | All visible changes and edge states reviewed |
| Feedback timing | Shared duration/contact/beam anchors | Hit-stop, pause, speed, and contact behavior parity |
| Audio routing | Shared semantic names, ten-cue procedural baseline, and optional local licensed path for seven weapon cues | All modes preserve identity/timing and pass device, latency, stress, listening, and Web gates |
| Compositor | Isolated exact nine-layer Godot architecture proof | Canonical authored integration and representative visual parity |
| Assets | Procedural stand-ins plus implemented package validator | Approved manifest, provenance, anchors, scale, states |
| Web | Preset only | Payload/startup/performance/browser gates |
| Deployment | None | One-command export and preview/cache verification |
| Workflow | Headless checks | Measured editor iteration advantage |
| Accessibility/input | Not claimed | Required keyboard/pointer/touch/readability paths |

Passing a native/headless metric does not substitute for Web evidence. Automated
checks do not substitute for subjective visual/audio acceptance.

## Schema and source policy

- `src/bridge/` owns the browser-free TypeScript contract and serializer.
- `godot/schema/` owns the checked-in machine-readable schema copy for each supported
  version.
- `godot/scripts/presentation_bridge_loader.gd` enforces the supported runtime
  contract independently and fails before presentation starts.
- `godot/data/` fixtures are generated artifacts committed for deterministic review.
- Exporters have a fixed seed and no timestamps. They use validator-backed data and
  existing core transitions; they never hand-author calculated HP, queue, or outcome.
- The repository may contain licensed-audio manifest metadata and validation code,
  but not the licensed source vault, purchase records, or staged WAVs. The staged
  root remains Git-ignored and absence is a valid public-checkout state.
- Additive compatible fields still require tests and consumer handling. Breaking
  fields, changed meaning, enum removal, or unit changes require v2.
- Outcome audio is deferred in v1 because the shared resolver requires previous and
  next status. It must be serialized with that context later, not inferred from an
  event in Godot.

## Rollback and reference policy

The Canvas client is the rollback, parity, and deployable reference until an
explicit later decision. Every phase must leave these commands viable:

```text
npm run build
npm run lint
npm run test
npm run dev
```

Rollback is phase-local:

- a failed Phase 1 removes/ignores `godot/`, `src/bridge/`, its exporters/tests, and
  package command without converting saves or game data;
- a failed Phase 2 retains useful Godot studies under `experiments/` and returns
  presentation work to Canvas;
- a failed Phase 3/4 keeps the parallel client non-default and continues shipping
  Canvas;
- no phase deletes historical spike evidence, accepted A/B captures, schema
  fixtures, or pass-log measurements needed to understand the decision.

Do not remove the Canvas renderer, Web Audio synthesizer, Vite build, browser input,
or deployment path in the same change that switches defaults. If retirement is ever
approved, first tag/reference the last known-good browser artifact and keep a tested
rollback release for at least one subsequent milestone.

## Durable reporting

Each transition pass appends exact files, commands, measured results, deferred gates,
and developer decisions to
`docs/development/godot-transition-pass-log-2026-08-23.md`. The pass log records what
happened; this plan remains the forward architecture and gate contract.
