# Combat Audio Direction

Status: developer direction after the 2026-08-22 listening rejection. This document
supersedes implementation-level claims that the current procedural cues are
approved. As of 2026-08-23, procedural Web Audio remains the broad migration
reference, while the canonical Godot client has ten procedural identities and an
optional local licensed-audio path for seven named weapon cues. All paths remain
subjectively unapproved. The developer-approved hybrid source policy below
supersedes the earlier file-free-only restriction.

## Decision

Combat should sound **physical first, science-fantasy second**. Every important cue
is built from three readable beats:

1. **Gesture** — what moved, charged, or gathered force.
2. **Material** — what the weapon or power is made of.
3. **Consequence** — what happened at contact.

The shared language is short, dry, sparse, and peak-led. The signature layer is
specific to the move. Technology should feel powerful but imperfect: vibration,
electrical instability, stressed metal, pressure, and controlled failure are more
appropriate than clean musical laser chirps. Psionics should feel like an intrusion
or pressure change rather than another projectile family.

Godot audio uses three runtime modes: `auto`, `procedural`, and `licensed`. Exactly
`vibro_blade`, `twin_vibro_daggers`, `heavy_smash`, `concussive_shove`, `particle`,
`ballistic_scatter`, and `plasma` may select locally staged licensed Humble/GameDev
Market WAVs. `auto` prefers a validated local cue and falls back to its procedural
identity, `procedural` forces the public/repository-safe synthesis path, and
`licensed` requests the validated local bank for eligible cues and reports missing
or invalid staging. `disruptor`, `shield_raise`, and `psionic` remain procedural in
all three modes. Source-library files, purchase records, and staged WAVs remain
owner-controlled; staged WAVs are Git-ignored. Stage the declared assets locally
with `npm run godot:audio:stage -- --source-root "C:\Users\Daniel\Desktop\Sound Effects"`.

The best execution venue is **hybrid**: use high-reasoning agents for synthesis,
analysis tooling, and deterministic tests, then make every acceptance decision in a
same-device local Godot/browser comparison on the developer's actual headphones and
speakers.

## Implementation checkpoint — 2026-08-23

"Full reference" describes cue coverage and routing responsibility, not approval:
the Canvas/Web Audio client still owns the broad procedural reference path for
melee, ranged, disruptor, shield, psionic, reactive, and outcome semantics, but its
sound was rejected in listening review and remains the parity/rollback surface.

The canonical Godot client consumes the same pre-resolved semantic cue names and
retains ten repository-safe procedural 48 kHz identities: `vibro_blade`,
`twin_vibro_daggers`, `heavy_smash`, `concussive_shove`, `disruptor`,
`shield_raise`, `psionic`, `particle`, `ballistic_scatter`, and `plasma`. The seven
eligible weapon cues may instead use their manifest-validated local licensed layers
without changing semantic IDs or contact anchors. Godot does not inspect ability
IDs or derive cue policy. Every other valid bridge cue is intentional silence
rather than a generic substitute.

Deterministic checks establish sample-identical six-step procedural variation,
finite/non-silent buffers, fixed contact anchors, the dagger notch, the shield
rise/lock, psionic gather/contact structure, and conservative offline stack
headroom. Separate licensed-bank checks enforce manifest scope, source hashes, WAV
shape, layer timing, and the valid no-assets public state. Headless output still
does not establish timbre, mix, weight, differentiation, or satisfaction.

The following gates remain open:

- same-device `auto`/`procedural`/`licensed` and Godot-versus-browser listening on
  headphones and ordinary speakers;
- add reactive and outcome families without a generic fallback;
- audible device latency and action/contact synchronization, reset cancellation,
  crackle/underrun behavior, and a ten-minute voice-pressure soak;
- Godot Web-export audio behavior and target-browser evidence; and
- complete spectral-centroid, LUFS, true-peak, real-device stack-headroom, and
  cross-client comparison evidence.

## Evidence hierarchy

1. The developer's live listening judgment is authoritative.
2. `Clip B.mp4` is the primary tonal and mix reference; `Clip A.mp4` is the current
   contrast. Measurements come from their actual 48 kHz stereo tracks and local
   FFmpeg, not the contradictory Gemini timestamp report.
3. External games are craft references only. No referenced game sound is copied,
   sampled, traced, or shipped. Approved Humble/GameDev Market WAVs are a separate
   licensed source governed by the local manifest/staging policy.
4. Automated measurements detect regressions; they cannot approve taste.

## What the supplied clips establish

The absolute capture level depends on Windows and browser volume, so the figures
below are comparative, not mastering specifications.

| Evidence | Clip B (reference) | Clip A (contrast) | Direction |
|---|---:|---:|---|
| Duration | 100.224 s | 58.240 s | Do not compare integrated level without accounting for silence. |
| Integrated loudness | -44.8 LUFS | -42.5 LUFS | The reference is quieter on average. |
| True peak | -20.6 dBFS | -22.9 dBFS | The reference still permits stronger isolated peaks. |
| Whole-track RMS | -58.0 dBFS | -49.7 dBFS | Reduce constant acoustic density; preserve space between actions. |
| Loudness range | 14.1 LU | 16.4 LU | This whole-track number is secondary to per-cue hierarchy. |

Clip B's strong generic blade events are approximately 245–248 ms, around -27 dBFS
peak and -44 to -45 dBFS RMS. A representative blade begins with a fast bright
sweep: its short-window spectral centroid rises from roughly 1 kHz to 5.6 kHz in
the first 50 ms, then falls to a roughly 2 kHz decay with a 1.7 kHz rolloff after
about 120 ms. That bright-to-low motion reads better than a stationary oscillator.

Clip B also demonstrates a useful hierarchy. Force Shield is approximately 257 ms
at -25.7 dBFS peak/-39.8 dBFS RMS. Scatter Shot's main active event is approximately
139 ms at -20.6 dBFS peak/-36.7 dBFS RMS: about 6 dB more peak and 8 dB more RMS
than the reference blade. These are relative relationships, not output targets.

Clip B is **not** a differentiation model. Its captured Twin Vibro-Daggers and
Vibro-Blade attacks reuse essentially the same old generic blade signature: nearly
the same length, level, and spectral arc. Preserve its sparsity, transient shape,
and hierarchy; do not restore its one-sound-for-every-blade routing.

## Reference-quality matrix

| Reference | Quality to borrow | Translation for this game | Do not borrow |
|---|---|---|---|
| Developer Clip B | Sparse mix, isolated peaks, fast bright-to-low blade arc, ranged impact above routine melee | Give every move one dominant gesture and leave headroom around it | Generic blade reuse or its capture volume |
| *Horizon Forbidden West* audio direction | Melee builds toward contact; ranged attacks identify themselves through weapon-specific charge/projectile cues | Separate anticipation, travel, and contact at the semantic visual milestones | Long real-time telegraphs that slow turn cadence |
| *Destiny 2* weapon-audio process | Begin with concept, narrative, art, and VFX; make fictitious weapons believable through a deliberate material language | Write a one-line material story before touching oscillators; review sound with animation/VFX | A preset chosen because it sounds generically futuristic |
| *Returnal* combat mix | Distinct weapon discharges and power reserved for the moments that need it | Use relative loudness and spectral silhouette as gameplay information | Making every cue maximum-power or relying on spatial audio |
| *God of War Ragnarök: Valhalla* weapon treatment | A common underpinning can carry a weapon-specific layer without becoming distracting | Share timing/mix grammar, not the same audible oscillator | Musical ornament on every routine hit |

Primary craft sources: [Guerrilla on distinct melee and ranged attack cues](https://blog.playstation.com/2021/12/06/horizon-forbidden-west-outsmart-your-enemies/),
[Bungie on building fictitious weapon audio from concept and cross-discipline work](https://www.bungie.net/7/en/News/article/51457),
[Housemarque on distinct discharges and battlefield mix priority](https://blog.playstation.com/2021/05/10/ps5s-3d-audio-returnal-resident-evil-village-creators-detail-tempest-implementation/),
and [Santa Monica Studio on a shared underpinning plus a weapon-specific signature](https://sms.playstation.com/stories/sparring-with-tyr/media/1155).

## Move identity matrix

| Move/family | Material story | Gesture and contact | Weight/mix goal | Avoid |
|---|---|---|---|---|
| Vibro-Blade | Military steel driven beyond an ordinary edge | 70–100 ms accelerating air cut; broad low-mid contact; short unstable vibration residue | Baseline medium melee; one clear contact | Sawtooth motor dominating the hit, melodic ring, lightsaber-like sustain |
| Twin Vibro-Daggers | Two lighter high-speed vibro edges | Two unequal, directionally opposed contacts 55–80 ms apart; second is the punctuation | Each contact lighter than Vibro-Blade; pair no more than about +2 dB perceived | One generic slash, evenly spaced metronome hits, two identical pings |
| Heavy Smash | Cybernetic mass through armor and deck plating | Short low air displacement; crushing low-mid body; stressed-metal tick after the body | +3 to +5 dB perceived weight over baseline, carried at 120–350 Hz so laptop speakers retain it | Sub-bass as the whole sound, sword ring, bright laser crack |
| Concussive Shove | Body impact that transfers momentum rather than penetrates | Compact chest/armor contact followed by an outward pressure tail tied to queue displacement | Similar peak to baseline but less sustain and less sub than Heavy Smash | Explosion, firearm crack, or Heavy Smash with only pitch changed |
| Particle Carbine | Rapid contained packets with an unstable ion wake | Two or three dry micro-pulses, each with a hard launch and tiny descending residue | Above routine melee articulation, below Scatter Shot authority | A single smooth oscillator chirp or the plasma envelope at a higher pitch |
| Scatter Shot | Wide kinetic discharge and simultaneous surface strikes | One immediate crack/body followed by a tight 20–60 ms scatter of smaller impacts | Reference apex for routine weapons: about +5–7 dB peak and +6–9 dB RMS over blade | Long boom, energy zap, evenly repeated pellets |
| Plasma Burst | Containment stress releasing a hot, viscous charge | Audible pre-contact instability; dense release; short cooling/sputter tail | Heavier and longer than Particle Carbine, below disruptor rarity | Clean pitch sweep, ballistic crack, interchangeable energy helper |
| Disruptor | Rare catastrophic field failure | Restrained charge, narrow beam event, compact detonation at 460 ms, then only the approved 80 ms aftermath | Strong contrast through structure and spectral collapse, not continuous volume | Wall-of-noise beam, giant sub for the full 540 ms, repeated laser note |
| Force Shield | A field locking into stable containment | Rising electrical texture resolves into one stable lock tone | Clearer/denser than baseline blade but below Scatter Shot's peak | Attack-like impact, alarm sound, long musical chord |
| Psionics | Pressure inside perception, not machinery in the room | Non-mechanical onset, unstable phase/air movement, contact at the 320 ms visual boundary | Distinct by absence of weapon transients; protect midrange intelligibility | Laser, projectile whoosh, electric gun, generic magic sparkle |
| Crit/death/reactive layer | Consequence, never a second weapon | One compact accent attached to semantic contact | Audible under the move without doubling its envelope | Stacking a full new attack sound over the core cue |

## Mix and envelope targets

- Keep routine cues dry and normally below 350 ms. Tails end before the next action
  becomes readable. The disruptor's approved 540 ms exception remains explicit.
- Preserve the semantic contact anchors already implemented: melee 100 ms, twin
  contacts 85/145 ms, disruptor 460 ms, psionics 320 ms. Change an anchor only with
  the matching visual timeline.
- Make a cue's loudest event the gameplay-relevant contact, not its oscillator
  startup. Avoid clicks by beginning generated sources at zero gain while retaining
  a 3–10 ms transient attack where a hard impact needs it.
- Treat Vibro-Blade as 0 dB reference. Target the relative hierarchy in the move
  matrix. Do not normalize every cue to the same RMS.
- Keep the simultaneous action + reactive stack below -3 dBFS in deterministic
  offline renders. Reserve at least 3 dB of headroom for browser/device differences.
- For a blade, seek a broad first-50-ms sweep that can reach a 3–6 kHz centroid,
  followed by a 1.5–2.5 kHz centroid decay. This is a starting region from Clip B,
  not a fingerprint to clone.
- Heavy attacks need usable 120–350 Hz energy; energy families must be separable in
  both the 300 Hz–2 kHz body and the 2–8 kHz signature, not only below 100 Hz.
- Never allow more than one core action cue plus one short consequence accent at
  full level. Duck or omit redundant shield/crit/death layers rather than sum every
  event independently.
- Deterministic variation may change pitch, filter, phase, and decay within a small
  family range, but must not move contact anchors or erase the move's silhouette.

## Anti-references

- A clean sine/square/saw sweep standing in for “future weapon.”
- The same band-passed noise burst with only pitch or duration changed.
- Tonal pings that make metal-on-body contact read as a menu confirmation.
- Constant sub-bass used as a substitute for weight.
- Every attack at the same loudness, brightness, and duration.
- Long tails that mask queue cadence or overlap the next actor.
- Literal imitation of another game's signature weapon or any extracted audio.

## Prioritized implementation passes

### P0 — Make the four current melee moves unmistakable

1. Add a deterministic `OfflineAudioContext` analysis harness that measures peak,
   RMS, duration, early/late spectral centroid, and core+reactive stack headroom
   without writing audio files.
2. Rebuild Vibro-Blade around broad gesture/contact noise and make its tonal motor a
   quiet material residue, not the foreground.
3. Give Twin Vibro-Daggers two unequal contacts with a true silence/notch between
   them. Do not call the shared full blade cue twice.
4. Put Heavy Smash's identity in audible low-mid body and Concussive Shove's identity
   in the outward pressure tail.
5. Add a developer A/B route that plays one named cue at a time, then a short combat
   sequence, at matched master level.

Technical checkpoint: bounded browser and Godot synths now embody the construction
goals in items 2–4, and Godot regression checks cover peak, RMS, duration, contact,
deterministic variation, and the dagger notch. That does not complete the requested
spectral/mix analysis or the developer A/B route, and it does not satisfy P0's
listening goal.

### P1 — Replace the generic energy-weapon helper

Build Particle Carbine and Plasma Burst from different gesture/material/consequence
graphs. Keep Scatter Shot kinetic. Apply the same analysis and blind-identification
review before expanding the roster.

### P2 — Establish mix governance

Introduce cue-family buses or equivalent gain staging, a one-core/one-consequence
voice budget, and deterministic offline stack tests. Then tune shield, disruptor,
psionics, crit, death, victory, and defeat against the approved melee/ranged anchors.

### P3 — Acceptance

- Developer can identify at least 8 of 10 randomized named cues without seeing the
  move name in two consecutive local trials.
- No cue is described as “the same noise,” “laser-like melee,” or generically
  futuristic in the listening notes.
- Headphones and ordinary laptop speakers both preserve Heavy Smash versus Shove,
  Particle versus Plasma, and blade versus daggers.
- Browser combat has no clipping, crackle, or unintended cue overlap for ten minutes.
- Automated measurements pass, but the pass remains unapproved until the developer
  signs off on the local listening route.

## Immediate low-risk changes suggested by Clip B

These are recommendations, not changes made by this document:

1. In Vibro-Blade, lower the foreground sawtooth motor and triangle ring by roughly
   4–6 dB and restore a broader bright-to-low noise/contact arc. This directly
   addresses the tonal/laser character while keeping the current timing and routing.
2. Cap a contact at one full core cue plus one short reactive accent. Clip B's impact
   comes from sparse isolated peaks; summing every routed event makes the current
   fight denser even when each individual source is quieter.
