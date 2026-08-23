# Godot Procedural Combat Audio Audition Spike

Status: isolated presentation experiment; developer listening approval is pending.

This Godot 4.7.2 project auditions the four current named melee identities with
native, file-free synthesis. It does not read or resolve combat state, change the
TypeScript core, or modify the canonical `godot/` client. The browser route remains
the parity and rollback reference.

## Run

From PowerShell:

```powershell
& 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64.exe' --path 'F:\RPG v1\experiments\godot-combat-audio-spike'
```

The project requests a 48 kHz mix rate and starts at -6 dB on its local output
player. Keep operating-system volume conservative for the first audition.

## Controls

| Input | Action |
|---|---|
| `1` | Vibro-Blade |
| `2` | Twin Vibro-Daggers |
| `3` | Heavy Smash |
| `4` | Concussive Shove |
| `Space` | Play all four in the displayed order with 240 ms dry gaps |
| `R` | Stop playback and reset deterministic variation to step 1 of 6 |
| `M` | Toggle this spike's output mute |
| On-screen slider | Adjust local player output from -18 to 0 dB |
| `Escape` | Quit |

Mouse/touch activation of the four labeled buttons is equivalent to keys `1`–`4`.
Starting another audition intentionally replaces the queued audition.

## Immutable timing and identities

All cues use a physical `gesture → material → consequence` structure. Variation
may change pitch, filter region, noise realization, and decay by a few percent; it
does not move contact onsets.

| Move | Contact onset(s) | Render length | Intended physical read |
|---|---:|---:|---|
| Vibro-Blade | 100 ms | 300 ms | Accelerating air cut, broad steel/body contact, quiet unstable edge residue |
| Twin Vibro-Daggers | 85 / 145 ms | 225 ms | Opposed light contacts, a measured silent notch, stronger second punctuation |
| Heavy Smash | 100 ms | 340 ms | Low displaced air, audible 120–350 Hz crushing body, supporting sub, stressed-metal tick |
| Concussive Shove | 100 ms | 290 ms | Compact armor/body contact followed by two decorrelated pressure lobes moving outward |

The six bounded `(pitch, filter, decay)` states mirror
`src/audio/cueVariation.ts`. Each cue also receives deterministic, cue-specific
noise from its resettable sequence index. The Twin Vibro-Daggers smoke invariant
measures the 120–142 ms inter-contact notch against both contact windows.

## Architecture

- `main.tscn` is one responsive `Control` scene.
- `scripts/main.gd` owns only the labeled audition UI, hotkeys, illustrative
  semantic timeline, and headless smoke orchestration.
- `scripts/procedural_combat_audio.gd` renders short stereo PCM buffers in memory,
  then pumps bounded chunks into Godot's `AudioStreamGeneratorPlayback`.
- Every noise source uses a locally seeded `RandomNumberGenerator`. There are no
  calls to global random state.
- Broad one-pole low/high/band filtering, inharmonic residues, and stereo motion
  are calculated at 48 kHz. The four moves use different layer graphs rather than
  routing through one generic energy-weapon helper.
- Starting a cue stops and recreates generator playback before the new buffer is
  queued. No audio data is read from or written to disk.

## Validation

The explicit parse gate is important because Godot can return exit code 0 even when
a scene script fails to load. Validate every script by inspecting output for parse
or load errors:

```powershell
$godot = 'C:\Users\Daniel\AppData\Local\Temp\Godot_v4.7.2-stable-win64\Godot_v4.7.2-stable_win64_console.exe'
$spike = 'F:\RPG v1\experiments\godot-combat-audio-spike'

Get-ChildItem $spike -Recurse -Filter '*.gd' | ForEach-Object {
    $resource = 'res://' + $_.FullName.Substring($spike.Length + 1).Replace('\', '/')
    & $godot --headless --log-file "$spike\godot-check.log" --path $spike --script $resource --check-only
}

& $godot --headless --log-file "$spike\godot-smoke.log" --path $spike --scene 'res://main.tscn' --quit-after 600 -- --smoke-test
```

The smoke path renders every cue, checks frame count, finite/non-silent samples,
contact bounds, and the dagger notch, queues the four-cue generator sequence, pumps
it for 12 process frames, and prints pending frames plus generator skips. It does
not create audio files.

### Latest deterministic headless render

Run with official Godot `4.7.2.stable.official.ed1daf0bf` at 48 kHz. Values below
are direct full-buffer linear sample peak/RMS measurements after the spike's soft
limiter and before the `AudioStreamPlayer` -6 dB output setting.

| Cue | Frames | Peak | RMS |
|---|---:|---:|---:|
| Vibro-Blade | 14,400 | 0.3039 | 0.0466 |
| Twin Vibro-Daggers | 10,800 | 0.2391 | 0.0201 |
| Heavy Smash | 16,320 | 0.4450 | 0.0660 |
| Concussive Shove | 13,920 | 0.2638 | 0.0352 |

The dagger notch measured `0.00000000` RMS from 120–142 ms versus `0.0214`
and `0.0407` RMS in its first and second contact windows. The queued headless
sequence reported `generator_skips=0` over the smoke window.

These numbers are regression evidence, not mastering targets or perceptual
acceptance. Heavy Smash intentionally carries the highest measured peak/RMS; equal
normalization would erase part of the approved identity hierarchy.

## Exact limitations

- No timbre, mix, loudness, impact, or satisfaction claim is made. The developer's
  headphone and ordinary-speaker review is authoritative.
- The scene is an audition launcher, not a presentation-bridge consumer. It has no
  combat logic, resolved-action input, animation milestone, hit-stop, reactive cue,
  voice budget, ducking bus, or action/consequence stacking policy.
- The on-screen timeline cursor advances from `Time.get_ticks_msec()`. It marks the
  authored buffer coordinates only; it is not synchronized to the audio driver and
  is not evidence of audible contact sync.
- `AudioStreamGenerator` buffering, the operating-system mixer, and device hardware
  add unmeasured latency. The signal emitted when a buffer is queued is not an
  audible-onset measurement. No p95 action-to-sound gate is claimed.
- Replacing a cue discards generator playback, but samples already handed to the OS
  or device may still sound briefly. Reset/cancellation behavior is not proven.
- The render smoke measures buffer peak/RMS and one dagger-notch window. It does not
  yet calculate spectral centroid, LUFS, true peak, core+reactive headroom, or
  perceptual differentiation.
- Seeded generation is repeatable for this Godot runtime and reset sequence. This is
  not a bit-exact cross-platform floating-point determinism claim.
- Headless audio uses a dummy device. It can prove render/queue integrity, but not
  audible output, latency, crackle, drift, underruns on a real device, or Web export.
- Only the four P0 melee identities exist here. Disruptor, ranged weapons, shields,
  psionics, UI sounds, reactive accents, outcomes, and music are outside this spike.
- There are no audio files, exported clips, third-party libraries, external assets,
  copyrighted samples, or production dependencies.

## Browser comparison checklist

Start the parity client with `npm run dev`, then open
`http://127.0.0.1:5173/?mode=range-band` with sound on. Compare on the same machine,
output device, operating-system volume, and enhancement settings. The browser's
master and Godot's -6 dB player are not automatically level-matched; adjust by ear
or measurement before judging identity rather than raw loudness.

- [ ] Press `R` in Godot before a comparison set so variation order is repeatable.
- [ ] In the browser, advance Critical Melee into MELEE and alternate Vibro-Blade
      with Twin Vibro-Daggers; in Godot alternate keys `1` and `2` at similar gaps.
- [ ] Vibro-Blade reads as one broad accelerating cut and steel/body contact, not a
      laser, tonal menu ping, or sustained motor.
- [ ] Twin Vibro-Daggers exposes two unequal contacts 60 ms apart, with a true notch
      and a stronger second punctuation; neither contact equals the full blade cue.
- [ ] In the browser, alternate Heavy Smash and Concussive Shove with Power Melee;
      in Godot alternate keys `3` and `4`.
- [ ] Heavy Smash remains heavier on ordinary laptop speakers through low-mid body,
      not only headphone sub-bass.
- [ ] Concussive Shove reads as transferred momentum and outward pressure, not an
      explosion, firearm, or pitch-shifted Heavy Smash.
- [ ] Have a helper press randomized keys while the listener looks away. Record at
      least 8/10 correct identifications twice before considering the P3 identity
      criterion met; the default UI deliberately keeps move labels obvious.
- [ ] Repeat on headphones and ordinary laptop speakers. Record identity,
      repetition, relative weight, physicality, and satisfaction for each pair.
- [ ] Judge browser contact sync only against its combat visuals. Do not score this
      standalone Godot cursor as synchronization evidence.
- [ ] Run a real-device ten-minute audition for clipping, crackle, unintended tails,
      and drift. Headless `generator_skips=0` does not satisfy that soak gate.
- [ ] Record any description such as “same noise,” “laser-like melee,” or “generic
      futuristic” as a rejection requiring another focused revision.
- [ ] Keep the result marked listening-pending until the developer explicitly signs
      off; automated checks and this checklist cannot accept timbre.
