# Godot Combat Audio Listening Harness

Status: isolated review tool; subjective developer listening approval is pending.

This Godot 4 project auditions the ten current production combat cues across all
six deterministic variations. In `auto` mode, the four melee and three ranged
weapon cues use the owner-staged licensed bank when it is valid; Disruptor, Force
Shield, and Psionics remain procedural. It dynamically loads the live production
synth, ranged bank, licensed bank, and manifest, so the harness carries no copied
audio, synthesis fork, combat inference, or gameplay policy.

## Interactive launch

From PowerShell:

    & 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64.exe' --path 'F:\RPG v1\experiments\godot-combat-audio-listening-harness'

Use `-- --audio=procedural` for the repository-safe baseline or
`-- --audio=licensed` to require the staged bank. The default `--audio=auto`
prefers the valid local bank and otherwise uses procedural fallback. Before local
licensed review, stage the manifest-declared files from the repository root:

    npm run godot:audio:stage -- --source-root "C:\Users\Daniel\Desktop\Sound Effects"

The harness starts its local output at -9 dB. Begin with conservative operating-
system volume. Selecting a cue or variation is silent; playback starts only from a
replay or automated review command.

## Controls

| Input | Action |
|---|---|
| 1–9, 0, or a cue button | Select one of the ten named melee, field, psionic, or ranged cues |
| Left / Q | Select the previous variation, wrapping from 1 to 6 |
| Right / E | Select the next variation, wrapping from 6 to 1 |
| Variation buttons 1–6 | Select an exact deterministic variation |
| Space / Enter | Replay the selected cue and variation |
| A | Play all six variations of the selected cue |
| F | Play the complete ten-cue × six-variation matrix |
| S | Stop the current cue and cancel an automated review |
| M | Toggle harness output mute |
| R | Stop, reset, and select Vibro-Blade variation 1 |
| Output slider | Adjust this harness from -24 to 0 dB |
| Escape | Quit |

Automated reviews leave 400 ms of dry silence after each variation and 850 ms
between cue families. Starting a new action replaces queued production playback.

## Review labels and timing

The interface states the intended material story and the failure modes to listen
for. Its authored-buffer timeline is illustrative; it is not synchronized to the
audio device.

| Cue | Contact onset(s) | Render length | Additional marker |
|---|---:|---:|---:|
| Vibro-Blade | 100 ms | 300 ms | — |
| Twin Vibro-Daggers | 85 / 145 ms | 225 ms | measured 120–142 ms notch |
| Heavy Smash | 100 ms | 340 ms | — |
| Concussive Shove | 100 ms | 290 ms | — |
| Disruptor | 460 ms | 540 ms | narrow beam event at 220 ms |
| Force Shield | 240 ms | 370 ms | stable containment lock at 240 ms |
| Psionics | 320 ms | 455 ms | nonmechanical pressure release |
| Particle Carbine | 250 ms | 320 ms | three separated contained packets |
| Scatter Shot | 210 ms | 300 ms | routine ranged peak apex and uneven pellets |
| Plasma Burst | 250 ms | 345 ms | containment stress, hot release, and sputter |

Exact variation selection resets the live production sequence, schedules any
earlier steps with output suppressed, discards that playback synchronously, and then
queues the requested step. This changes no production source or variation data.

## Deterministic validation

The standalone validator and scene smoke both suppress production output before
the synth enters the scene tree:

    $godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64_console.exe'
    $harness = 'F:\RPG v1\experiments\godot-combat-audio-listening-harness'

    Get-ChildItem -LiteralPath "$harness\scripts" -Filter '*.gd' | Sort-Object Name | ForEach-Object {
        $resource = 'res://scripts/' + $_.Name
        & $godot --headless --path $harness --check-only --script $resource
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    & $godot --headless --path $harness --script 'res://scripts/validate_listening_harness.gd'
    & $godot --headless --path $harness --scene 'res://main.tscn' --quit-after 1200 -- --smoke-test

The shared checks verify the ten supported IDs, six-step catalog, full ordered
60-step matrix, unique cue/variation coverage, exact variation selection, review
gaps, licensed playback plans, positive finite procedural renders, timing metadata,
production deterministic-repeat invariants, the dagger notch, disruptor windows,
Shield Raise rise/lock contrast, Psionics mid/side pressure structure, stack
headroom, stop clearing, and absence of an output player in headless mode. With the
local bank staged, the matrix contains 42 licensed and 18 procedural selections.
The scene smoke also runs the actual full 60-step scheduler at an accelerated time
scale while keeping output suppressed.

## Boundaries and limitations

- The developer's live listening judgment is authoritative. Headless validation
  does not approve timbre, differentiation, weight, loudness, mix, or satisfaction.
- This harness does not measure audio-device latency, audible contact sync,
  cancellation already handed to an operating-system/device buffer, crackle,
  underruns, drift, or a real-device soak.
- The timeline cursor uses process time and marks authored buffer coordinates only.
- Review gaps are audition pacing, not canonical combat cadence.
- The live-source loader depends on this repository layout: the harness must remain
  two directories below the repository root beside the production godot folder.
- There is no bridge input, ability-ID mapping, combat state, gameplay resolution,
  Web export evidence, copied licensed asset, or added dependency in this harness.
  The owner-local staged assets stay under the canonical Godot project and remain
  Git-ignored.
