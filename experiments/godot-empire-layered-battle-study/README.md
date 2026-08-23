# Imperial Layered Battle-Stage Study

This is an isolated, review-only Godot 4 study. It does not select, approve,
register, or canonically integrate any art. It loads the current Imperial
Skirmish backdrop, Imperial stage-floor, and Imperial foreground-occluder A/B
candidates directly from their catalog paths and fails on path, SHA-256,
dimension, or alpha-contract drift.

The world is composed in physically separate nodes at 960 x 540, post-processed
once, and enlarged to the normal 1920 x 1080 battle frame. `Layer09UI` is a
sibling `CanvasLayer` outside post-processing. Procedural units and emissives are
neutral stand-ins and are not gameplay or art selections.

Controls:

- `Tab`, `1`, `2`: switch matching-letter A/B sets immediately.
- `P`: toggle raw/full-world-post comparison.
- `Esc`: quit.

Matching letters are grouped only for this study. Backdrop, floor, and
foreground remain independent developer decisions.

Validation and deterministic capture examples:

```powershell
godot --headless --path experiments/godot-empire-layered-battle-study --script res://scripts/validate_study.gd
godot --path experiments/godot-empire-layered-battle-study --resolution 1920x1080 -- --choice=A --post --capture=docs/screenshots/godot-empire-layered-battle-study-choice-a-post-2026-08-23.png
godot --path experiments/godot-empire-layered-battle-study --resolution 1920x1080 -- --choice=B --post --capture=docs/screenshots/godot-empire-layered-battle-study-choice-b-post-2026-08-23.png
```

The deterministic validator is headless. Pixel capture requires a real rendering
driver because Godot's headless dummy renderer intentionally has no framebuffer;
the capture path fails loudly instead of producing an empty image in that mode.
