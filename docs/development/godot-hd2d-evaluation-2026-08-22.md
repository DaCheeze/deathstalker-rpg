# Godot HD-2D Evaluation

Updated: 2026-08-22

## Decision

Evaluate Godot with one disposable presentation spike, but do not migrate the
production game yet.

Godot offers a materially better authoring environment for layered 2D scenes,
lights and occluders, particles, shaders, parallax, and animation. Those are the
areas where the current hand-built Canvas renderer costs the most iteration time.
However, a migration would also put the browser build, low-latency procedural Web
Audio, deterministic TypeScript core, Vitest coverage, simulations, and replay
tooling at risk before Godot has demonstrated a visible advantage in this game.

This record does not authorize an engine change or add a dependency. `AGENTS.md`
continues to define TypeScript, Vite, Canvas 2D, and Web Audio as the production
stack until the developer explicitly approves a different decision.

Evaluation runtime: official Godot `4.7.2.stable.official.ed1daf0bf`, downloaded as
the self-contained Windows x86_64 editor to a temporary local folder. It is not
installed system-wide, checked into the repository, or used by the production build.
The official Windows page states that this package is self-contained and requires
only extraction: <https://godotengine.org/download/windows/>.

## Why Godot is worth testing

- Godot has a dedicated 2D renderer and editor workflows for 2D scenes, animation,
  tilemaps, particles, and parallax.
- `PointLight2D`, `DirectionalLight2D`, `CanvasModulate`, normal/specular maps, and
  light occluders directly support the layered-lighting side of an HD-2D look.
- Canvas-item and particle shaders could replace some bespoke per-effect Canvas
  implementation with reusable, artist-tunable effects.
- `AnimationPlayer` and `AnimationTree` provide a visual timing workflow that is
  better suited to iterating attacks, hit reactions, camera beats, and ambient
  motion than hand-editing each timeline in TypeScript.

Official capability references:

- <https://docs.godotengine.org/en/stable/tutorials/2d/index.html>
- <https://docs.godotengine.org/en/stable/tutorials/2d/2d_lights_and_shadows.html>
- <https://docs.godotengine.org/en/stable/tutorials/shaders/introduction_to_shaders.html>
- <https://docs.godotengine.org/en/stable/tutorials/animation/animation_tree.html>

## Why production should not move yet

### Browser renderer constraints

Godot Web exports use WebAssembly and WebGL 2 and are limited to the Compatibility
renderer. Several features visible in native Godot showcase material are not
available in that renderer, so a native Forward+ prototype would not answer this
project's browser question. Mobile browser performance also needs direct testing.

References:

- <https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html>
- <https://docs.godotengine.org/en/stable/tutorials/rendering/renderers.html>

### Procedural audio risk

The current game creates its combat identity with procedural Web Audio and no audio
files. Godot's low-latency Web sample mode does not provide procedural generation or
audio effects. Stream mode restores more audio features but adds latency,
particularly in a non-threaded Web export. `AudioStreamGenerator` also recommends
compiled code for performance, while Godot 4 C# projects cannot currently export to
the Web. This is the strongest technical reason not to rewrite first and test later.

References:

- <https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html>
- <https://docs.godotengine.org/en/stable/classes/class_audiostreamgenerator.html>
- <https://docs.godotengine.org/en/stable/classes/class_javascriptbridge.html>

### Rewrite and verification risk

The existing pure TypeScript core already provides explicit RNG, deterministic
replays, headless simulations, and unit tests. Reimplementing that logic in an
engine would create two sources of truth until parity was proven. A renderer test
therefore must consume recorded results from the current core and must not calculate
combat itself.

## Approved shape of a future spike

Best venue: hybrid. Build and profile locally in the Godot editor and target
browsers; add cloud/CI export only after the local Web artifact works.

Use a separate scratch branch or disposable project and the current stable Godot
4 release. Export with the Compatibility renderer from the first iteration. Build
one 20-30 second deterministic battle replay containing:

- one layered battlefield with depth and parallax;
- three party and three enemy positions using current assets or explicit stand-ins;
- one melee attack, one disruptor attack, and one force-shield response;
- `AnimationPlayer` timing, hit-stop, particles, 2D lights or additive effects, and
  Compatibility-safe color grading;
- a static JSON replay emitted by the existing TypeScript core;
- a single-threaded Web export before any threaded variant;
- an A/B audio check between Godot streaming/generation and the existing Web Audio
  synthesizer reached through `JavaScriptBridge`.

The bridge is acceptable for measuring a spike. It is not presumed to be a healthy
permanent architecture.

## Go/no-go gates

The spike earns a detailed migration estimate only if all hard gates pass:

| Gate | Required evidence |
|---|---|
| Visual | Developer prefers the Godot A/B and rates depth, readability, and impact at least 4/5 |
| Iteration | Three representative lighting/animation revisions take no more than half the Canvas implementation time |
| Performance | Median frame time at most 16.7 ms and p99 at most 33.3 ms on every target browser/device |
| Startup | Proposed compressed budget at most 15 MiB; load at most 4 s desktop and 8 s target mobile |
| Audio | p95 trigger-to-audible latency at most 80 ms; no crackle/underruns in a 10-minute stress run; procedural identity retained |
| Compatibility | Required Chrome, Edge, Firefox, Safari, and mobile targets load without console errors |
| Determinism | Identical final replay event/state hash across 100 repeated runs |
| Deployment | One-command headless export, successful Pages preview, and verified cache refresh |
| Architecture | No duplicated authoritative combat rules and no permanent per-frame TypeScript-to-Godot state bridge |

If audio, target-browser performance, or deterministic-test continuity fails, stop
the migration evaluation. If the visual and workflow advantages do not pass, Godot
has not earned the rewrite cost.

Headless export reference:
<https://docs.godotengine.org/en/stable/tutorials/editor/command_line_tutorial.html>.

## First local spike result

The isolated project now exists at `experiments/godot-hd2d-spike/`. It consumes a
static nine-event JSON fixture and calculates no combat. The 24-second loop contains
3v3 formations, advance, a held disruptor, targeted engagement, two melee contacts,
a force-shield response, and a direct disruptor.

Measured local results:

- Godot 4.7.2 parsed the active GDScript with exit 0.
- Headless import and a full 1,440-frame fixed-step run exited 0.
- The replay logged that all nine static events loaded and no combat logic ran.
- Compatibility/OpenGL captured 1,440 frames at 1280×720. Godot reported 0.43 ms
  average CPU render and 0.06 ms average GPU render during offline capture. These
  values are not browser or target-device performance evidence.
- The captured MP4 is 2.11 MiB and remains a local review artifact, not a runtime
  asset.

Visual QA found clean spacing, readable effect beats, and a useful A/B harness, but
the block combatants, sparse architecture, limited material response, and scripted
motion still read as prototype art. This first render proves the engine/project
path, not a superior visual result. It does not pass the visual gate.

The Web preset is configured for a single-threaded export, but the matching Godot
4.7.2 Web templates are not installed. Web payload, startup, browser performance,
compatibility, procedural audio, and workflow-speed gates remain unmeasured. Godot
was also observed returning a successful movie-capture exit code after an earlier
script-load failure, so all future captures must be preceded by explicit per-script
`--check-only` validation.

## Current recommendation

Keep the production engine unchanged. Use the working Godot project as a technical
baseline for one art-focused revision, then install matching Web templates only if
that revision creates an obvious visual/workflow advantage. The next comparison
should improve combatants, environment specificity, materials, and authored contact
animation without porting combat rules, campaign state, or simulation code. A full
migration estimate remains premature.
