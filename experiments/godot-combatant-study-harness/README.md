# Godot combatant idle-study review harness

This portable Godot 4 experiment is a neutral visual-QA harness for two unapproved
Power Melee idle-keyframe studies. It does not select either choice, register a
runtime asset, create missing animation frames, or integrate anything into the
canonical `godot/` client.

Each source PNG and both neutral Empire background studies are copied beneath this
experiment's own `res://study/` tree. `study/study_manifest.json` pins provenance,
SHA-256, byte length, PNG encoding, decoded dimensions, exact alpha counts, measured
bounds, and review-only anchor/scale proposals. Missing or changed inputs fail
loudly.

## Run

From the repository root, replace `<godot>` with a Godot 4.7.2 console executable:

```powershell
<godot> --path experiments/godot-combatant-study-harness --editor --quit --check-only --script res://scripts/main.gd
<godot> --headless --path experiments/godot-combatant-study-harness --import --quit
<godot> --headless --path experiments/godot-combatant-study-harness --scene res://main.tscn -- --validate-only
<godot> --headless --path experiments/godot-combatant-study-harness --scene res://main.tscn -- --validate-only --strict
<godot> --path experiments/godot-combatant-study-harness
```

Normal structural validation exits `0`. Unexpected files, hashes, dimensions,
encoding, alpha measurements, or layouts request exit `2`. `--strict` deliberately
requests exit `3` while either study remains package-incomplete or fails the pinned
review gates.

## Controls

- `1`: dark, light, and checker mattes at the same proposed battle height.
- `2` / `3`: neutral Empire background A or B with both choices at equal visible
  height.
- `4`: exact source-alpha, bounds, margin, and proposed-anchor diagnostic for the
  active choice.
- `C`: toggle active Choice A / Choice B for matte and diagnostic views.
- `P`: toggle the full-frame-raster / deliberate-hybrid motion-pipeline placeholder.
  This changes review telemetry only; it never changes or invents combatant pixels.
- `O`: toggle source, safe-margin, strict-bound, substantive-bound, and anchor
  overlays.
- `Z`: cycle proposed visible-height candidates `320 / 360 / 400` at 1080p design
  scale (`213.33 / 240 / 266.67` in the 1280x720 review window).
- `R`: reset; `Esc`: quit.

CLI equivalents are `--view=mattes|background-a|background-b|source`,
`--combatant=a|b`, `--pipeline=full-frame-raster|deliberate-hybrid`,
`--height=320|360|400`, and `--overlays=off`.

## Evidence and limits

The dedicated report is
[`docs/development/godot-power-melee-combatant-study-harness-2026-08-23.md`](../../docs/development/godot-power-melee-combatant-study-harness-2026-08-23.md).
The harness is static and contains no blur, post-processing, animation, gameplay,
audio, or package-compliance claim. All anchors and scales are proposals for review,
not approvals.
