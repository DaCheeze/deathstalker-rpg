# Empire Skirmish A/B and Nine-Layer Compositor Harness

This isolated Godot 4.7.2 Compatibility project keeps the existing neutral Empire
skirmish background comparison while proving the presentation contract as an
inspectable Godot scene hierarchy. It records no A/B preference and integrates
neither unapproved asset. The canonical `godot/` client is not referenced or
modified.

Godot reads `data/presentation_state.json` and performs presentation only. It does
not calculate legal actions, targets, damage, queue order, cooldowns, persistence,
or outcomes. A and B always receive the same fixture time, unit state, camera,
floor, grade, post pass, foreground, UI, and procedural effects.

## Inspectable compositor contract

`main.tscn` contains the contract in exact child/z order. Every contract node is in
the shared `compositor_layer` group and its numbered semantic group.

| Order | Godot node/group | Update policy |
|---:|---|---|
| 1 | `Layer01Starfield` / `compositor_layer_01_starfield` | cached 480x270 procedural source, linearly enlarged |
| 2 | `Layer02FarBackdrop` / `compositor_layer_02_far_backdrop` | both read-only plates receive the same one-time 960x540 low-pass cache |
| 3 | `Layer03StageFloor` / `compositor_layer_03_stage_floor` | sharp static CanvasItem commands |
| 4 | `Layer04EnemyUnits` / `compositor_layer_04_enemy_units` | per-frame presentation |
| 5 | `Layer05PartyUnits` / `compositor_layer_05_party_units` | per-frame presentation |
| 6 | `Layer06EmissivePass` / `compositor_layer_06_emissive_pass` | per-frame emissive cores and authored effects; bloom source |
| 7 | `Layer07ForegroundOccluders` / `compositor_layer_07_foreground_occluders` | cached layered soft-edge proxy; no blur kernel |
| 8 | `Layer08BloomGradeVignetteComposite` / `compositor_layer_08_half_resolution_post` | transparent 960x540 `SubViewport`, enlarged once for composition |
| 9 | `Layer09UI` / `compositor_layer_09_ui` | `CanvasLayer` 100, sibling of the world stack and never post-processed |

The controller validates node names, order, groups, z indices, the 960x540 post
viewport, and UI separation at startup. A violation fails loudly and exits nonzero.
Static layers redraw only when their source or diagnostic presentation changes.
There is no full-resolution per-frame blur.

## Controlled state and source status

The shared fixture remains a 12-second loop with six anonymous procedural
stand-ins and four authored presentation events. Melee contacts at `+0.10 s`
inside a `0.42 s` gesture. The disruptor charges through `+0.22 s`, contacts at
`+0.46 s`, and ends at `+0.54 s` after an `0.08 s` aftermath.

The harness loads these files read-only from the existing repository paths. It does
not copy, alter, import, register, or select them:

- `art/choices/backgrounds/enc_empire_skirmish-choice-a.png` — 1920x1080 opaque
  PNG, proposed/unapproved.
- `art/choices/backgrounds/enc_empire_skirmish-choice-b.png` — 1920x1080 opaque
  PNG, proposed/unapproved.

Both receive the exact same one-time downsample. Stand-ins, starfield, floor,
emissive marks, foreground, post overlay, and UI are procedural architecture aids,
not approved runtime art. No name, lore, plot, dialogue, gameplay rule, or missing
runtime asset was introduced.

## Run and inspect

```powershell
$godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64.exe'
$project = 'F:\RPG v1\experiments\godot-visual-ab-harness'
& $godot --path $project
```

Controls:

- `Tab`: toggle A/B without resetting time; `1`/`2`: choose A/B; `S`: split wipe.
- `Space`: pause/resume; `R`: restart; `Esc`: quit.
- `F1` through `F9`: toggle the corresponding contract layer; `F10`: restore all.
- `D`: switch between the fully composed view and a physical 3x3 mosaic of the
  nine real render nodes at the same fixture time.
- `T`: toggle frame/contract telemetry; `O`: toggle the neutral-scope note.

Deterministic overrides:

```powershell
& $godot --path $project -- --variant=SPLIT --time=6.70 --pause
& $godot --path $project -- --variant=SPLIT --time=6.70 --pause --diagnostic
& $godot --path $project -- --variant=A --time=2.72 --pause --hide-layer=8
```

`--variant=A|B|SPLIT`, `--time=SECONDS`, `--pause`, `--diagnostic`,
`--hide-layer=1..9`, `--telemetry=off`, and `--overlay=off` are presentation-only.

## Verification

```powershell
$godotConsole = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64_console.exe'
$project = 'F:\RPG v1\experiments\godot-visual-ab-harness'

Get-ChildItem $project -Recurse -Filter '*.gd' | ForEach-Object {
    $resource = 'res://' + $_.FullName.Substring($project.Length + 1).Replace('\', '/')
    & $godotConsole --headless --path $project --script $resource --check-only
    if ($LASTEXITCODE) { throw "Parse failed: $resource" }
}

& $godotConsole --headless --path $project --import
if ($LASTEXITCODE) { throw 'Godot import failed.' }

& $godotConsole --headless --path $project --scene 'res://main.tscn' --fixed-fps 60 --quit-after 180 -- --variant=SPLIT --time=6.70 --pause
if ($LASTEXITCODE) { throw 'Godot composite smoke failed.' }

& $godotConsole --headless --path $project --scene 'res://main.tscn' --fixed-fps 60 --quit-after 60 -- --variant=SPLIT --time=6.70 --pause --diagnostic
if ($LASTEXITCODE) { throw 'Godot diagnostic smoke failed.' }
```

Measured locally with Godot `4.7.2.stable.official.ed1daf0bf`:

- all four GDScripts passed `--check-only`;
- headless import exited `0`;
- the 180-frame composite and 60-frame diagnostic smokes exited `0`, validated the
  exact node order, and reported the expected 960x540 post viewport/UI separation;
- fixed-FPS smoke process deltas were average/p95/max `16.667 ms` by construction.
  That is deterministic scheduler input, not a GPU performance result;
- two-frame 1280x720 Compatibility Movie Maker captures on an NVIDIA GeForce RTX
  5080 reported average CPU render submission of `0.33 ms/frame` for the composite
  and `0.11 ms/frame` for the diagnostic mosaic. Godot printed GPU render time as
  `0.00 ms/frame` at its output precision. PNG encoding cost `241.19 ms/frame` and
  `43.12 ms/frame`, respectively, and dominates these two-frame measurements.

These short paused captures are deterministic evidence, not a sustained frame-rate,
startup, memory, Web-export, or GPU-profiler benchmark. No 60 fps acceptance claim
is made from them.

## Deterministic evidence

Both promoted PNGs are exact frame-zero copies. In each run, frame one produced the
same SHA-256, proving repeated fixed-state frames were byte-identical.

- `docs/screenshots/godot-nine-layer-composite-proof-2026-08-23.png` — 1280x720,
  split background, all nine layers at `6.700 s`, SHA-256
  `3B0707A440461FD98E1740D66CE20D0DCC02796A3E01467942E4D22A6A454D57`.
- `docs/screenshots/godot-nine-layer-diagnostic-proof-2026-08-23.png` — 1280x720,
  same state physically arranged as nine layer tiles, SHA-256
  `3BBF737ED0D335583D74B2C5CFAA0CFBA59D367EC36BFE7E9963B8B6E8EF0E24`.

## Limitations

- The source backgrounds are flat review plates, not production far/mid/floor/
  foreground separations. The far-backdrop node proves the boundary, not final
  authored depth or parallax.
- Downsample/upscale is a deterministic cached low-pass proxy, not a production
  Gaussian depth blur. The foreground uses cached layered soft geometry for the same
  reason. Diagnostic-only neutral mattes reveal dark passes and never enter the
  composite view.
- Half-resolution bloom is represented with broad procedural bright-pass shapes;
  shader quality and scene-authored emissive masks remain unproved.
- Block stand-ins test ordering, separation, anchors, and contrast only. They do not
  prove sprites, alpha edges, animation coverage, sockets, material response, or
  final visual quality.
- External unapproved files remain outside `res://`, so this local harness is not a
  portable Web build. Audio, mobile, payload, startup, sustained performance, and
  Web export were not tested.
- Subjective visual approval and every A/B selection remain with the developer.
