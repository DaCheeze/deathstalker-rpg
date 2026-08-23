# Godot HD-2D Spike — Decision Checklist

This experiment answers one question: does Godot create enough presentation and
workflow advantage to justify a deeper prototype? It does not authorize migration.

## Developer visual review

Score each item from 1 (poor) to 5 (strong):

- [ ] Scene depth and shallow-diorama impression: ___ / 5
- [ ] Combatant readability at normal browser size: ___ / 5
- [ ] Held/direct disruptor beat clarity: ___ / 5
- [ ] Force-shield response clarity: ___ / 5
- [ ] Melee contact weight: ___ / 5
- [ ] UI hierarchy and lack of clutter: ___ / 5
- [ ] Overall preference versus the Canvas demo: ___ / 5

Visual gate for a deeper spike: developer preference plus at least 4/5 for depth,
readability, and impact after no more than three focused revisions.

## Engineering gates for a deeper spike

- [ ] Compatibility/Web median frame time ≤ 16.7 ms and p99 ≤ 33.3 ms on target devices.
- [ ] Proposed compressed startup payload ≤ 15 MiB.
- [ ] Interactive startup ≤ 4 s desktop and ≤ 8 s required mobile device.
- [ ] Chrome, Edge, Firefox, required Safari, and required mobile browsers pass.
- [ ] Procedural audio retains attack identity with p95 action-to-sound ≤ 80 ms.
- [ ] Ten-minute audio soak has no crackle, underrun, or drift.
- [ ] Existing TypeScript core replay reaches an identical final hash across 100 runs.
- [ ] Godot calculates no combat and no per-frame TS↔Godot bridge is introduced.
- [ ] One-command headless web export works in CI and GitHub Pages headers/cache are documented.
- [ ] Three equivalent visual revisions take no more than half the Canvas implementation time.

## Stop conditions

Stop the engine evaluation if browser support, audio identity/latency, deterministic
test continuity, or payload/startup performance fails. If the visual and authoring
advantage is not obvious to the developer, keep the production Canvas stack and use
the spike only as presentation reference.

## Best execution venue

Hybrid: author and profile locally in the Godot editor and target browsers; add a
cloud export check only after the local web artifact is stable. Subjective art and
audio review stays local with the developer.
