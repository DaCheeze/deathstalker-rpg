# Godot HD-2D Presentation Spike

Status: exploratory, presentation-only, developer approval pending.

This isolated Godot 4 project is an A/B evaluation artifact. It does not replace
the production TypeScript/Vite/Canvas/Web Audio game, calculate combat, or add a
production dependency. It reads `data/static_replay.json` and renders a deterministic
24-second presentation loop containing a 3v3 formation, advance, held disruptor,
targeted engagement, melee contact, force-shield response, and direct disruptor.

## Run now

The official self-contained Godot 4.7.2 editor was extracted to the local Temp
folder for this evaluation. From PowerShell:

```powershell
& 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64.exe' --path 'F:\RPG v1\experiments\godot-hd2d-spike' --editor
```

Press F6/F5 in the editor, or run the scene directly:

```powershell
& 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64.exe' --path 'F:\RPG v1\experiments\godot-hd2d-spike'
```

Controls: Space pauses, `R` restarts the replay, Tab toggles the evaluation panels,
and Escape quits.

## Verified on 2026-08-22

- Runtime: official Godot `4.7.2.stable.official.ed1daf0bf`.
- `scripts/main.gd --check-only`: exit 0.
- Headless import: exit 0.
- Full fixed-step 24-second replay: exit 0 and loaded nine static events.
- Compatibility/OpenGL capture: 1,440 frames at 1280×720.
- Offline capture averages reported by Godot: 0.43 ms CPU render and 0.06 ms GPU
  render per frame. These are local offline-render measurements, not browser or
  target-device performance evidence.
- Review MP4: `C:\Users\Daniel\AppData\Local\Temp\godot-hd2d-spike-fixed-review.mp4`
  (2.11 MiB, generated locally, not a repository runtime asset).
- Still: `C:\Users\Daniel\AppData\Local\Temp\godot-hd2d-spike-fixed-preview00000000.png`
  (1280×720, generated locally, not a repository runtime asset).

Run `--check-only` before trusting a capture. Godot was observed returning exit 0
and writing a movie when an earlier scene script had failed to load; the explicit
parse gate caught that failure.

## What this proves

- A Godot Compatibility project can consume a static replay without owning combat.
- Layered scene composition, deterministic replay-driven motion, procedural units,
  particles, impact effects, force-shield treatment, and an evaluation overlay fit
  in one inspectable project.
- It creates a concrete presentation A/B target for developer review.

## What this does not prove

- No Web export is claimed. Godot export templates are not installed yet.
- No browser, mobile, startup-size, audio latency, or cross-browser gate is measured.
- This fast script-driven loop does not yet demonstrate that editor-authored
  AnimationPlayer revisions are twice as fast as Canvas revisions.
- It has no procedural audio; production Web Audio remains the reference.
- The shapes are exploratory stand-ins, not approved runtime combatants or assets.

## Current visual assessment

The scene hierarchy, spacing, effect readability, and evaluation workflow are clean,
but this first capture is not a visual win over the browser demo. Its procedural
block combatants, sparse architecture, limited material response, and script-driven
motion still read as prototype art. Godot has proven a viable authoring/runtime path;
it has not solved the project's art, sprite, animation, or environment-quality gap.

The next visual revision should use this same static replay while replacing only the
presentation: approved production-direction combatants or animation studies, a more
specific layered environment, stronger materials/light response, and authored
contact/camera animation. Do not port combat rules to obtain that comparison.

## Capture recipe

Parse and run before capture:

```powershell
$godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64_console.exe'
$spike = 'F:\RPG v1\experiments\godot-hd2d-spike'

Get-ChildItem $spike -Recurse -Filter '*.gd' | ForEach-Object {
    $resource = 'res://' + $_.FullName.Substring($spike.Length + 1).Replace('\', '/')
    & $godot --headless --path $spike --script $resource --check-only
    if ($LASTEXITCODE) { throw "Parse failed: $resource" }
}

& $godot --headless --path $spike --import
& $godot --headless --path $spike --scene 'res://main.tscn' --fixed-fps 60 --quit-after 1440
```

Godot Movie Maker can capture the full loop with the Windows display driver and
Compatibility/OpenGL renderer. Keep captures outside the repository or under the
ignored `captures/` directory.

## Web export status

`export_presets.cfg` defines a single-threaded Web preset, but Web export was not
run because the matching Godot 4.7.2 export templates are absent. The missing files
are `web_nothreads_debug.zip` and `web_nothreads_release.zip`. Do not count Web,
startup-size, browser-performance, or compatibility gates as passed.

## Review

Compare the same beats with the production demo and score depth, focal hierarchy,
combat readability, impact, and iteration potential. A score is evidence only when
the developer records it; this README makes no subjective acceptance claim.

The full go/no-go gates are in
`docs/development/godot-hd2d-evaluation-2026-08-22.md`.
