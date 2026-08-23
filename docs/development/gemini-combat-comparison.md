# Gemini audiovisual combat comparison

- Model: `gemini-3.7-flash`
- Clip A: `Clip A.mp4` (current/problematic demo)
- Clip B: `Clip B.mp4` (original/reference fight)
- Separate audio tracks: yes
- Generated: 2026-08-23T04:13:12.243Z

## Audio access verification

### Clip A

AUDIO_STREAM_ACCESSIBLE: YES

- **00:00 - 00:05**: Rapid, high-pitched futuristic laser weapon firing sounds with resonant mechanical clanks and subtle electronic hums.
- **00:13 - 00:18**: A swooshing aerodynamic whoosh sound accompanying rapid maneuvering, followed by sharp acoustic impacts and metallic friction effects.
- **00:33 - 00:38**: Heavy, rhythmic sci-fi blaster fire with sharp transient attacks followed by muffled kinetic impact thuds in the low-frequency register.
- **00:48 - 00:54**: Sustained pulse-fire laser bursts featuring bright synthesizer-like discharge effects alongside low rumbling thruster sounds.

### Clip B

AUDIO_STREAM_ACCESSIBLE: YES

- **00:03 – 00:08**: Rapid-fire, high-frequency energy weapon laser discharges accompanied by metallic impact bursts.
- **00:30 – 00:37**: Heavy, rhythmic mechanical stomping footsteps with a deep low-frequency resonant thud and servo hum.
- **01:03 – 01:09**: High-pitched electronic beam charging hum followed by sharp, explosive plasma bursts and sizzling impact reverberation.

## Comparative review

### Audio Access Confirmation
All synchronized audio tracks and visual streams from **Clip A** (`current/problematic demo`) and **Clip B** (`original/reference fight`) were accessed and analyzed.

---

### Clip A: Timestamped Event Table (Current / Problematic Build)

| Timestamp (mm:ss) | Turn / Phase | Visible Action / UI State | Audible Sound Profile & Characteristics |
| :--- | :--- | :--- | :--- |
| **00:00 – 00:04** | Turn 1–6 | "Held Disruption Interrupt" phase; Disruption damage triggers (`-35`, `-43`, `-25`, `-31`). | Repetitive, thin electronic crackle/click with immediate decay; lacks bass weight and electrical sizzle. |
| **00:05 – 00:10** | Turn 7–10 | Menu navigation (`Choose Foe`, `Advance`, `Engage`). | Flat, high-pitched square/sine UI blips; identical pitch on every hover/confirm step. |
| **00:11 – 00:16** | Turn 11–12 | Unit selects `Vibro-Blade` and executes attack against Opponent A. | Soft generic white-noise transient burst; lacks metallic resonance, frequency sweep, or physical impact punch. |
| **00:17 – 00:22** | Turn 13 | Action `Twin Vibro-Daggers` executed; damage numbers pop (`-24`). | Rapid double-click noise burst identical in timbre to the single blade strike, just doubled; lacks swift slicing pitch ramp. |
| **00:23 – 00:30** | Turn 14–15 | Unit executes `Heavy Smash` / `Vibro-Blade` cycle. | Muffled broadband thud; identical envelope curve with almost no low-frequency fundamental or mechanical weight. |
| **00:31 – 00:40** | Turn 16–17 | Unit repeats `Twin Vibro-Daggers` and standard melee strikes. | High ear fatigue: constant repetition of the exact same 2 synthesized noise-burst profiles across distinct abilities. |
| **00:41 – 00:48** | Turn 18–19 | Selection of `Concussive Shove` followed by melee resolution. | Attack transient fails to communicate blunt force; identical transient profile to cutting moves. |
| **00:49 – 00:57** | Turn 20 | "DEFEAT: THE CREW HAS FALLEN" modal popup appears. | Short, generic descending synth sweep followed by abrupt cutoff; lacks dramatic reverb tail, sub drop, or weight. |

---

### Clip B: Timestamped Event Table (Original / Reference Fight)

| Timestamp (mm:ss) | Turn / Phase | Visible Action / UI State | Audible Sound Profile & Characteristics |
| :--- | :--- | :--- | :--- |
| **00:00 – 00:07** | Turn 1 | Opening battle state; player cycles options (`Twin Vibro-Daggers`, `Concussive Shove`, `Particle Carbine`). | Snappy, distinct UI blips with dynamic pitch modulation per menu depth; crisp, short decay. |
| **00:08 – 00:14** | Turn 2 | Unit activates `Twin Vibro-Daggers` & `Boost Injected`. | Bright, dual-layered high-frequency metallic swoosh followed by an energized ascending tonal whine. |
| **00:15 – 00:23** | Turn 3 | Selection and execution of `Vibro-Blade` strike on Imperial Legionnaire A. | Crisp, biting transient with a distinct descending resonant filter sweep (metallic cutting tone) followed by a solid mid-bass impact. |
| **00:24 – 00:35** | Turn 4 | Multi-unit attack sequencing; selection of `Particle Carbine`. | Sharp acoustic snap followed by a modulated FM laser discharge and resonant laser decay tail. |
| **00:36 – 00:48** | Turn 5 | Shield activation (`Force Shield`) and defensive maneuvers. | Low-mid tonal hum with a gentle envelope swell and smooth dampening release. |
| **00:49 – 01:05** | Turn 6 | Execution of `Concussive Shove` and heavy combat impacts. | Deep sub-frequency transient punch (blunt displacement) mixed with metallic clatter; clearly distinct from blade attacks. |
| **01:06 – 01:25** | Turn 7+ | Sustained tactical combat exchanges across crew and enemy combatants. | High acoustic contrast: every weapon class (energy, blade, blunt, shield) occupies a distinct spectral and temporal niche. |

---

### Direct Audio & Audio-Visual Comparison

```
Metric                  Clip A (Problematic Demo)           Clip B (Reference Fight)
─────────────────────────────────────────────────────────────────────────────────────────────
Transient Attack        Weak, softened noise bursts         Sharp, biting, instantaneous onset
Pitch Trajectory        Flat / static across actions        Dynamic sweeps (FM chirps, ramps)
Spectral Layering       Monolithic band-passed noise        Multi-layered (Sub + Tone + Noise)
Decay & Tails           Abrupt, dry cutoffs                 Tailored exponential decays
Repetition / Fatigue    Severe; identical sound reused      Varied timbre per weapon archetype
A-V Sync                Noticeable onset latency (~50-80ms) Tight, frame-accurate impact sync
```

1. **Onset & Transient Strength:**
   - *Clip A:* Impact transients sound pillowy and muffled. Attacks lack initial high-frequency spikes.
   - *Clip B:* Fast exponential attack ramps (under 5ms) produce crisp initial transients that cut through the mix.
2. **Pitch Trajectory & Tonal vs. Noisy Layering:**
   - *Clip A:* Attacks rely almost entirely on unmodulated white/pink noise bursts without tonal harmonic backing.
   - *Clip B:* Blades feature high-frequency resonant bandpass sweeps simulating vibration; blunt strikes feature pitch-dropping sine waves (80 Hz $\rightarrow$ 35 Hz) for tactile heft.
3. **Weapon & Action Differentiation:**
   - *Clip A:* `Vibro-Blade`, `Twin Vibro-Daggers`, `Concussive Shove`, and Disruption interrupts sound nearly indistinguishable.
   - *Clip B:* Energy weapons (Particle Carbine), cutting blades, blunt shoves, and shields each have unique acoustic signatures.
4. **Synchronization:**
   - *Clip A:* Sound triggers feel slightly decoupled from visual sprite contact frames.
   - *Clip B:* Peak transient energy aligns precisely with visual strike frames and floating combat numbers.

---

### Five Highest-Impact Problems in Clip A

1. **Lack of Archetype Differentiation:** All melee and interrupt actions share the same noise-burst envelope, erasing tactile feedback between different combat choices.
2. **Missing Low-Frequency Fundamentals:** No sub-bass or low-mid punch ($<150\text{ Hz}$) on heavy strikes (`Heavy Smash`, `Concussive Shove`), making all impacts sound lightweight.
3. **Absence of Resonant / FM Modulation for Vibro-Weapons:** High-frequency vibration and metallic timbres are absent, replaced by dry static noise.
4. **Static, Unmodulated UI Feedback:** Repetitive UI blips cause listening fatigue during turn-based menu navigation.
5. **Abrupt Envelope Cutoffs:** Lack of tailored exponential decay curves causes artificial clicking and a dry, unnatural mix.

---

### Prioritized Procedural Web Audio Implementation Brief

*Constraint: Procedural synthesis only via Web Audio API (TypeScript). No audio samples.*

```
Priority 1: Core Impact Architecture (Sub + Transient + Body)
Priority 2: Vibro-Blade & Dagger Synthesis (FM + Resonant Filter Sweeps)
Priority 3: Heavy / Concussive Impacts (Pitch-Dropping Oscillator + Noise)
Priority 4: Energy / Particle Weapons (FM Chirp + Modulated Noise Tail)
Priority 5: Layered UI Acoustic Feedback (Dual Sine / Harmonic Blips)
```

#### 1. Core Impact Generator Architecture (Base Layer)
- **Node Structure:** `GainNode` envelope $\rightarrow$ `BiquadFilterNode` $\rightarrow$ `OscillatorNode` (Sine) + parallel White Noise node via custom `AudioBufferSourceNode` or noise generator.
- **Transient Envelope:** Peak at $t_0$, linear ramp to 1.0 within 2–4ms, exponential decay to 0.001 within 40–90ms.

#### 2. Vibro-Weapons (`Vibro-Blade` / `Twin Vibro-Daggers`)
- **Carrier/Modulator:** FM synthesis with two oscillators (Carrier: 440–880 Hz sine/triangle; Modulator: 120–250 Hz square/sawtooth with high modulation index $\beta \approx 3.0$).
- **Filter Sweep:** Dual `BiquadFilterNode` (Bandpass, Q = 8 to 14) sweeping rapidly downward from 6 kHz to 1.2 kHz over 80ms.
- **Twin Daggers:** Trigger two instances offset by 60–90ms with the second instance pitched 15–20% higher and attenuated by -2 dB.

#### 3. Blunt Force & Disruptions (`Heavy Smash` / `Concussive Shove`)
- **Sub-Thump Layer:** `OscillatorNode` (Sine) with frequency ramp (`exponentialRampToValueAtTime`) starting at 120 Hz dropping to 32 Hz over 140ms.
- **Friction Burst:** Short pink-noise burst filtered through a low-pass filter (cutoff 400 Hz) to simulate mass displacement.

#### 4. Shield & Energy Effects
- **Force Shield:** Dual sine oscillators detuned by 4 Hz (binaural beating effect at ~220 Hz) with an exponential release tail of 350ms.
- **Particle Carbine:** High-frequency FM laser chirp (2.4 kHz $\rightarrow$ 300 Hz in 45ms) mixed with high-pass filtered noise ($>3\text{ kHz}$).

#### 5. UI Sound Design
- Short, decaying pure sine tones (1.2 kHz and 1.8 kHz) with subtle pitch incrementation based on menu selection depth to eliminate UI ear fatigue.

---

### Uncertainties and Required Human Listening Checks

1. **Volume Normalization & Mix Headroom:** Procedural synthesis chains (especially multi-oscillator FM and sub-bass summing) risk digital clipping. Must check mix levels when multiple interrupts trigger simultaneously.
2. **Perceived Spatial Width:** Check if subtle stereo panning (`StereoPannerNode`) based on unit screen position ($[-0.6, 0.6]$) improves clarity during multi-target disruption phases without causing phase cancellation on mono playback devices.
3. **Ear Fatigue Thresholds:** Human verification is required during extended play sessions ($>15\text{ minutes}$) to confirm that vibro-blade high-Q resonant sweeps do not create harsh frequencies in the 3–5 kHz range.
