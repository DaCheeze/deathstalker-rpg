# Range-band party A/B art review

This isolated Godot 4 review surface compares the current Power Melee, Critical
Melee, and Queue Control Melee idle studies as complete Choice A and Choice B
families. It loads the six source PNGs directly from `art/choices/`, pins their
SHA-256 identities and measured alpha bounds, and fails loudly if an input changes.
The fifth view also loads the hash-pinned 34-frame authoritative range-band replay
and applies the same restrained whole-raster rehearsal to Choice A and Choice B.

It does **not** select a direction, create animation frames, approve anchors or
scale, register a combatant package, or modify the canonical `godot/` client.

## Run

From the repository root, replace `<godot>` with the Godot 4.7.2 executable:

```powershell
<godot> --path experiments/godot-range-band-party-art-review
```

Validation and script checks:

```powershell
<godot> --editor --quit --check-only --path experiments/godot-range-band-party-art-review --script res://scripts/main.gd
<godot> --headless --path experiments/godot-range-band-party-art-review --scene res://main.tscn -- --validate-only
```

## Controls

- `1` / `F1`: active full party at proposed battle scale.
- `2` / `F2`: complete Party A and Party B side-by-side.
- `3` / `F3`: one role's A/B pair on dark, light, and mid mattes.
- `4` / `F4`: all six source/alpha/anchor diagnostics.
- `5` / `F5`: Choice A/B resolved-timeline motion rehearsal.
- `Space`: play or pause the motion rehearsal.
- `Left` / `Right`: step by 0.10 seconds; `Page Up` / `Page Down`: step by
  resolved frame.
- `S`: toggle 0.25× and 1× playback; `Home`: return to the initial frame.
- `A` / `B`: show that complete wardrobe branch; `C` or `Tab` toggles.
- `Q` / `W` / `E`: Power, Critical, or Queue role in matte view.
- `G`: neutral stage, Empire A, or Empire B context. Background choice remains a
  separate unapproved decision.
- `O`: source and alpha-bound overlays.
- `Z`: proposed visible height `320 / 360 / 400` at 1080p.
- `R`: reset; `Esc`: quit.

CLI equivalents are `--view=formation|compare|mattes|diagnostic|motion`,
`--branch=a|b`, `--role=power|critical|queue`, `--height=320|360|400`,
`--background=neutral|empire-a|empire-b`, `--overlays=on|off`, `--paused`,
`--time=<nonnegative seconds>`, and `--speed=<positive multiplier>`.

The equal-height rule uses the measured nonzero-alpha silhouette, not the full
1024×1536 padded source canvas. All displayed anchors and heights are reversible
review proposals.

The motion view does not invent animation frames. It uses anchor-preserving
whole-raster translation, slight rotation/scale, procedural action traces, and
abstract opponent markers to expose silhouette behavior against pre-resolved action
timing. It is comparison evidence, not an animation package or motion-pipeline
selection.
