# Godot Range-Band Bridge Fixture — 2026-08-23

## Outcome

A second deterministic presentation-bridge v1 fixture now exercises the authored
three-character range-band encounter and its queue-selected held disruptor opening.
All calculated state comes from validator-backed repository data, seeded RNG,
`getAvailableActions`, and authoritative `applyAction`; no HP, queue, charge,
target, interrupt, or outcome state is hand-authored.

## Added files

- `src/bridge/rangeBandPresentationFixture.ts` — validated setup plus a deterministic
  legal-action policy that advances before selecting existing melee actions.
- `scripts/export-godot-range-band-presentation.ts` — timestamp-free JSON exporter.
- `godot/data/presentation-range-band-replay-v1.json` — generated fixture.
- `godot/scripts/validate_range_band_fixture.gd` — dedicated strict headless check.
- `tests/bridge/rangeBandPresentationFixture.test.ts` — bridge semantic and hash
  regression coverage.

The pass did not modify gameplay values, core rules, prototype data, audio files,
`godot/scripts/main.gd`, `godot/README.md`, or the main transition pass log.

## Locked evidence

- Initial ready charges: party `prototype_duelist`; enemy
  `prototype_opponent_b`; all other charges spent.
- Frame 1: `prototype_opponent_b` interrupts `prototype_duelist`.
- Frame 2: `prototype_duelist` interrupts `prototype_opponent_b`.
- Both transitions serialize as reactor-owned `disruptor` actions with
  `beamStartSeconds=0.22`, `visualContactSeconds=0.46`,
  `durationSeconds=0.54`, and `audioCue=disruptor`.
- Each mirrored `disruptor_interrupt` event remains present with `audioCues=[]`, so
  action/event routing cannot double-play the interrupt.
- Fixture: 34 snapshots, 33 authoritative actions, 25.75 seconds, final core turn
  34, outcome `victory`, 258,541 bytes.
- SHA-256:
  `16d8c17b3ff08263d62a75c43352dd2eeee5c1b5c1bfa13fcc7ecb5783a9219f`.

## Exact verification

Runtime variables:

```powershell
$node20 = 'C:\Users\Daniel\AppData\Local\npm-cache\_npx\185e25162edaacfb\node_modules\node\bin\node.exe'
$godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64_console.exe'
$project = 'F:\RPG v1\godot'
```

Fixture export, executed twice:

```powershell
& $node20 node_modules/tsx/dist/cli.mjs scripts/export-godot-range-band-presentation.ts
```

Both runs exited 0 and produced the same 34-snapshot victory fixture and SHA-256;
the checked-in pre-run bytes, first export, and second export were identical.

Focused TypeScript and lint gates:

```powershell
& $node20 node_modules/vitest/vitest.mjs run tests/bridge/rangeBandPresentationFixture.test.ts tests/bridge/presentationBridge.test.ts
& $node20 node_modules/eslint/bin/eslint.js src/bridge/rangeBandPresentationFixture.ts scripts/export-godot-range-band-presentation.ts tests/bridge/rangeBandPresentationFixture.test.ts --max-warnings=0
```

Results: exit 0; 2 files and 22/22 tests passed in 540 ms; focused lint exited 0
with no warnings or errors.

Dedicated Godot gate:

```powershell
& $godot --headless --path $project --script res://scripts/validate_range_band_fixture.gd --check-only
& $godot --headless --path $project --script res://scripts/validate_range_band_fixture.gd
```

Results: both exited 0 under Godot 4.7.2. Runtime output was
`PASS frames=34 interrupts=2 outcome=victory`.

Full repository gates:

```powershell
& $node20 node_modules/typescript/bin/tsc
& $node20 node_modules/vite/bin/vite.js build
& $node20 node_modules/eslint/bin/eslint.js . --max-warnings=0
& $node20 node_modules/vitest/vitest.mjs run
```

Results: build exited 0 with 40 modules transformed; lint exited 0 with no warnings
or errors; 29 test files and 134/134 tests passed in 1.36 seconds. Vite printed the
existing browser-externalization notices for `node:fs` and `node:path` imported by
`src/sim/balanceCheck.ts`.

## Limitations

- This fixture pass originally left `main.gd` on the legacy document while
  concurrent audio work owned the canonical client. Transition Pass 3 subsequently
  added the strict `--fixture=range-band` selector and validated the same shared
  loader, contact scheduler, audio scheduler, and reset path across both replays;
  see [Pass 3](godot-transition-pass-log-2026-08-23.md#pass-3--strict-dual-fixture-selector).
- The deterministic decision policy is fixture orchestration, not a gameplay or AI
  rule change.
- No visual, motion, browser, or listening acceptance is claimed.
- Balance checks were not required because core mechanics, data, simulation policy,
  and gameplay values were unchanged.
- The rebooted Windows sandbox still failed process startup with
  `helper_unknown_error: apply deny-read ACLs`; approved escalated commands and the
  trusted recovery patch engine were used.

No dependency, commit, or push was added.
