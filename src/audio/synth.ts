/**
 * Pure Web Audio API Synthesizer.
 * Generates dry, punchy tactical sci-fi sound effects with zero external audio files or libraries.
 * Features noise burst generators, multi-stage biquad filters, harmonic synthesis, and 3-beat disruptor events.
 */

import type { AbilityDefinition, BattleAction, BattleEvent, BattleState } from '../core/types';
import {
  type CombatAudioCue,
  resolveCombatAudioCue,
  resolveCombatEventAudioCues,
  resolveCombatOutcomeAudioCue,
} from './combatAudioCue';
import {
  COMBAT_AUDIO_TIMING,
  NAMED_MELEE_AUDIO_DESIGN,
  cueVariationForSequence,
  noiseOffsetForSequence,
  type CueVariation,
} from './cueVariation';

export class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;
  private cueVariationSequence: number = 0;
  private noiseSequence: number = 0;

  constructor() {
    // Try to load saved mute state
    try {
      this.muted = localStorage.getItem('deathstalker_muted') === 'true';
    } catch {
      this.muted = false;
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.28, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);

        // Pre-render 1-second white noise buffer for procedural transients
        const bufferSize = this.ctx.sampleRate * 1;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem('deathstalker_muted', String(this.muted));
    } catch {
      // Ignore if localStorage unavailable
    }

    if (!this.muted) {
      this.initContext();
    }

    if (this.masterGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.28, now, 0.008);
    }
    return this.muted;
  }

  public playBattleAction(action: BattleAction, ability?: AbilityDefinition): void {
    const cue = resolveCombatAudioCue(action, ability);
    if (cue) this.playCombatAudioCue(cue);
  }

  public playBattleEvent(event: BattleEvent, suppress: boolean = false): void {
    for (const cue of resolveCombatEventAudioCues(event, suppress)) {
      this.playCombatAudioCue(cue);
    }
  }

  public playBattleOutcome(
    previous: BattleState['status'],
    next: BattleState['status'],
    suppress: boolean = false
  ): void {
    const cue = resolveCombatOutcomeAudioCue(previous, next, suppress);
    if (cue) this.playCombatAudioCue(cue);
  }

  private playCombatAudioCue(cue: CombatAudioCue): void {
    switch (cue) {
      case 'blade':
        this.playSwordHit();
        break;
      case 'blunt':
        this.playBluntHit();
        break;
      case 'vibro_blade':
        this.playVibroBlade();
        break;
      case 'twin_vibro_daggers':
        this.playTwinVibroDaggers();
        break;
      case 'heavy_smash':
        this.playHeavySmash();
        break;
      case 'concussive_shove':
        this.playConcussiveShove();
        break;
      case 'ballistic':
        this.playBallisticShot();
        break;
      case 'ballistic_scatter':
        this.playBallisticScatter();
        break;
      case 'particle':
        this.playParticleCarbine();
        break;
      case 'plasma':
        this.playPlasmaBurst();
        break;
      case 'laser':
        this.playLaserShot();
        break;
      case 'psionic':
        this.playPsionicHit();
        break;
      case 'disruptor':
        this.playDisruptorFire();
        break;
      case 'shield_raise':
        this.playShieldRaise();
        break;
      case 'boost_enter':
        this.playBoostToggle(true);
        break;
      case 'boost_exit':
        this.playBoostToggle(false);
        break;
      case 'shield_shatter':
        this.playShieldShatter();
        break;
      case 'critical_hit':
        this.playCritHit();
        break;
      case 'death':
        this.playDeath();
        break;
      case 'burnout_damage':
        this.playBurnoutDamage();
        break;
      case 'boost_crash':
        this.playCrash();
        break;
      case 'victory':
        this.playVictory();
        break;
      case 'defeat':
        this.playDefeat();
        break;
    }
  }

  private getNoiseNode(ctx: AudioContext): AudioBufferSourceNode | null {
    if (!this.noiseBuffer) return null;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    noise.loop = true;
    return noise;
  }

  private nextCueVariation(): CueVariation {
    const variation = cueVariationForSequence(this.cueVariationSequence);
    this.cueVariationSequence += 1;
    return variation;
  }

  private startNoise(noise: AudioBufferSourceNode, when: number): void {
    const duration = noise.buffer?.duration ?? 0;
    const offset = noiseOffsetForSequence(this.noiseSequence, duration);
    this.noiseSequence += 1;
    noise.start(when, offset);
  }

  // --- UI SOUNDS ---

  public playMenuMove(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(1160, t + 0.025);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  public playMenuConfirm(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.setValueAtTime(659.25, t + 0.04); // E5

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.10);
  }

  public playMenuCancel(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // --- COMBAT WEAPONS ---

  public playSwordHit(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;

    // Airy swing first, then a separated body impact and metallic contact ring.
    const swing = this.getNoiseNode(ctx);
    if (swing) {
      const swingFilter = ctx.createBiquadFilter();
      swingFilter.type = 'bandpass';
      swingFilter.frequency.setValueAtTime(650, t);
      swingFilter.frequency.exponentialRampToValueAtTime(2800, t + 0.075);
      swingFilter.Q.value = 0.8;
      const swingGain = ctx.createGain();
      swingGain.gain.setValueAtTime(0.001, t);
      swingGain.gain.linearRampToValueAtTime(0.52, t + 0.05);
      swingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.13);
      swing.connect(swingFilter);
      swingFilter.connect(swingGain);
      swingGain.connect(this.masterGain);
      this.startNoise(swing, t);
      swing.stop(t + 0.13);
    }

    const impactTime = t + 0.065;
    const impact = this.getNoiseNode(ctx);
    if (impact) {
      const impactFilter = ctx.createBiquadFilter();
      impactFilter.type = 'lowpass';
      impactFilter.frequency.setValueAtTime(1100, impactTime);
      impactFilter.frequency.exponentialRampToValueAtTime(180, impactTime + 0.11);
      const impactGain = ctx.createGain();
      impactGain.gain.setValueAtTime(0.62, impactTime);
      impactGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.11);
      impact.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(this.masterGain);
      this.startNoise(impact, impactTime);
      impact.stop(impactTime + 0.11);
    }

    [1180, 1760].forEach((frequency, index) => {
      const ring = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ring.type = index === 0 ? 'triangle' : 'sine';
      ring.frequency.setValueAtTime(frequency, impactTime);
      ring.frequency.exponentialRampToValueAtTime(frequency * 0.82, impactTime + 0.24);
      ringGain.gain.setValueAtTime(index === 0 ? 0.24 : 0.13, impactTime);
      ringGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.24);
      ring.connect(ringGain);
      ringGain.connect(masterGain);
      ring.start(impactTime);
      ring.stop(impactTime + 0.24);
    });
  }

  public playBluntHit(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;

    const impact = this.getNoiseNode(ctx);
    if (impact) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(120, t + 0.14);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.62, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      impact.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(impact, t);
      impact.stop(t + 0.14);
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.17);
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.17);
  }

  public playVibroBlade(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;
    const variation = this.nextCueVariation();
    const design = NAMED_MELEE_AUDIO_DESIGN.vibroBlade;
    const swingEnd = t + 0.098 * variation.decayScale;
    const impactTime = t + COMBAT_AUDIO_TIMING.meleeImpactSeconds;

    const swing = this.getNoiseNode(ctx);
    if (swing) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900 * variation.filterScale, t);
      filter.frequency.exponentialRampToValueAtTime(4800 * variation.filterScale, t + 0.052);
      filter.frequency.exponentialRampToValueAtTime(1800 * variation.filterScale, swingEnd);
      filter.Q.value = 0.55;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(design.swingPeakLevel, t + 0.045);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.082);
      gain.gain.exponentialRampToValueAtTime(0.001, swingEnd);
      swing.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(swing, t);
      swing.stop(swingEnd);
    }

    const motor = ctx.createOscillator();
    const motorFilter = ctx.createBiquadFilter();
    const motorGain = ctx.createGain();
    const motorStart = t + 0.018;
    const motorEnd = t + 0.17 * variation.decayScale;
    motor.type = 'sawtooth';
    motor.frequency.setValueAtTime(138 * variation.pitchScale, motorStart);
    motor.frequency.exponentialRampToValueAtTime(178 * variation.pitchScale, motorEnd);
    motorFilter.type = 'lowpass';
    motorFilter.frequency.setValueAtTime(850 * variation.filterScale, motorStart);
    motorGain.gain.setValueAtTime(0.001, motorStart);
    motorGain.gain.linearRampToValueAtTime(design.motorPeakLevel, t + 0.05);
    motorGain.gain.exponentialRampToValueAtTime(0.001, motorEnd);
    motor.connect(motorFilter);
    motorFilter.connect(motorGain);
    motorGain.connect(masterGain);
    motor.start(motorStart);
    motor.stop(motorEnd);

    const impact = this.getNoiseNode(ctx);
    if (impact) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const impactEnd = impactTime + 0.125 * variation.decayScale;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800 * variation.filterScale, impactTime);
      filter.frequency.exponentialRampToValueAtTime(240 * variation.filterScale, impactEnd);
      gain.gain.setValueAtTime(0.001, impactTime);
      gain.gain.linearRampToValueAtTime(design.impactPeakLevel, impactTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, impactEnd);
      impact.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(impact, impactTime);
      impact.stop(impactEnd);
    }

    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    const ringEnd = impactTime + 0.105 * variation.decayScale;
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(1120 * variation.pitchScale, impactTime);
    ring.frequency.exponentialRampToValueAtTime(840 * variation.pitchScale, ringEnd);
    ringGain.gain.setValueAtTime(0.001, impactTime);
    ringGain.gain.linearRampToValueAtTime(design.ringPeakLevel, impactTime + 0.003);
    ringGain.gain.exponentialRampToValueAtTime(0.001, ringEnd);
    ring.connect(ringGain);
    ringGain.connect(masterGain);
    ring.start(impactTime);
    ring.stop(ringEnd);
  }

  public playTwinVibroDaggers(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const variation = this.nextCueVariation();
    for (const contact of NAMED_MELEE_AUDIO_DESIGN.twinVibroDaggers.contacts) {
      this.scheduleDaggerContact(ctx, this.masterGain, t, contact, variation);
    }
  }

  private scheduleDaggerContact(
    ctx: AudioContext,
    masterGain: GainNode,
    baseTime: number,
    contactDesign: (typeof NAMED_MELEE_AUDIO_DESIGN.twinVibroDaggers.contacts)[number],
    variation: CueVariation
  ): void {
    const impactTime = baseTime + contactDesign.timeSeconds;
    const contact = this.getNoiseNode(ctx);
    if (contact) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const contactEnd =
        impactTime + contactDesign.noiseDurationSeconds * variation.decayScale;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(
        contactDesign.filterStartFrequency * variation.filterScale,
        impactTime
      );
      filter.frequency.exponentialRampToValueAtTime(
        contactDesign.filterEndFrequency * variation.filterScale,
        contactEnd
      );
      filter.Q.value = 0.8;
      gain.gain.setValueAtTime(0.001, impactTime);
      gain.gain.linearRampToValueAtTime(contactDesign.noisePeakLevel, impactTime + 0.0025);
      gain.gain.exponentialRampToValueAtTime(0.001, contactEnd);
      contact.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(contact, impactTime);
      contact.stop(contactEnd);
    }

    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    const ringEnd = impactTime + contactDesign.ringDurationSeconds * variation.decayScale;
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(
      contactDesign.ringStartFrequency * variation.pitchScale,
      impactTime
    );
    ring.frequency.exponentialRampToValueAtTime(
      contactDesign.ringEndFrequency * variation.pitchScale,
      ringEnd
    );
    ringGain.gain.setValueAtTime(0.001, impactTime);
    ringGain.gain.linearRampToValueAtTime(contactDesign.ringPeakLevel, impactTime + 0.0025);
    ringGain.gain.exponentialRampToValueAtTime(0.001, ringEnd);
    ring.connect(ringGain);
    ringGain.connect(masterGain);
    ring.start(impactTime);
    ring.stop(ringEnd);
  }

  public playHeavySmash(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;
    const variation = this.nextCueVariation();
    const design = NAMED_MELEE_AUDIO_DESIGN.heavySmash;
    const impactTime = t + COMBAT_AUDIO_TIMING.meleeImpactSeconds;

    const windUp = this.getNoiseNode(ctx);
    if (windUp) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const windEnd = t + 0.09 * variation.decayScale;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520 * variation.filterScale, t);
      filter.frequency.exponentialRampToValueAtTime(220 * variation.filterScale, windEnd);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, windEnd);
      windUp.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(windUp, t);
      windUp.stop(windEnd);
    }

    const impact = this.getNoiseNode(ctx);
    if (impact) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const impactEnd = impactTime + 0.18 * variation.decayScale;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1350 * variation.filterScale, impactTime);
      filter.frequency.exponentialRampToValueAtTime(160 * variation.filterScale, impactEnd);
      gain.gain.setValueAtTime(0.001, impactTime);
      gain.gain.linearRampToValueAtTime(design.impactPeakLevel, impactTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, impactEnd);
      impact.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(impact, impactTime);
      impact.stop(impactEnd);
    }

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    const bodyEnd = impactTime + 0.18 * variation.decayScale;
    body.type = 'triangle';
    body.frequency.setValueAtTime(285 * variation.pitchScale, impactTime);
    body.frequency.exponentialRampToValueAtTime(125 * variation.pitchScale, bodyEnd);
    bodyGain.gain.setValueAtTime(0.001, impactTime);
    bodyGain.gain.linearRampToValueAtTime(design.bodyPeakLevel, impactTime + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, bodyEnd);
    body.connect(bodyGain);
    bodyGain.connect(masterGain);
    body.start(impactTime);
    body.stop(bodyEnd);

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subEnd = impactTime + 0.2 * variation.decayScale;
    sub.type = 'sine';
    sub.frequency.setValueAtTime(88 * variation.pitchScale, impactTime);
    sub.frequency.exponentialRampToValueAtTime(44 * variation.pitchScale, subEnd);
    subGain.gain.setValueAtTime(0.001, impactTime);
    subGain.gain.linearRampToValueAtTime(design.subPeakLevel, impactTime + 0.006);
    subGain.gain.exponentialRampToValueAtTime(0.001, subEnd);
    sub.connect(subGain);
    subGain.connect(masterGain);
    sub.start(impactTime);
    sub.stop(subEnd);
  }

  public playConcussiveShove(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;
    const variation = this.nextCueVariation();
    const design = NAMED_MELEE_AUDIO_DESIGN.concussiveShove;
    const impactTime = t + COMBAT_AUDIO_TIMING.meleeImpactSeconds;

    const contact = this.getNoiseNode(ctx);
    if (contact) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const contactEnd = impactTime + 0.055 * variation.decayScale;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(520 * variation.filterScale, impactTime);
      filter.frequency.exponentialRampToValueAtTime(900 * variation.filterScale, contactEnd);
      filter.Q.value = 0.7;
      gain.gain.setValueAtTime(0.001, impactTime);
      gain.gain.linearRampToValueAtTime(design.contactPeakLevel, impactTime + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, contactEnd);
      contact.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(contact, impactTime);
      contact.stop(contactEnd);
    }

    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    const bodyEnd = impactTime + 0.065 * variation.decayScale;
    body.type = 'triangle';
    body.frequency.setValueAtTime(300 * variation.pitchScale, impactTime);
    body.frequency.exponentialRampToValueAtTime(190 * variation.pitchScale, bodyEnd);
    bodyGain.gain.setValueAtTime(0.001, impactTime);
    bodyGain.gain.linearRampToValueAtTime(design.bodyPeakLevel, impactTime + 0.004);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, bodyEnd);
    body.connect(bodyGain);
    bodyGain.connect(masterGain);
    body.start(impactTime);
    body.stop(bodyEnd);

    const pressureTail = this.getNoiseNode(ctx);
    if (pressureTail) {
      const tailStart = impactTime + 0.018;
      const tailEnd = impactTime + 0.17 * variation.decayScale;
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650 * variation.filterScale, tailStart);
      filter.frequency.exponentialRampToValueAtTime(2300 * variation.filterScale, tailEnd);
      filter.Q.value = 0.45;
      gain.gain.setValueAtTime(0.001, tailStart);
      gain.gain.linearRampToValueAtTime(design.pressurePeakLevel, tailStart + 0.055);
      gain.gain.exponentialRampToValueAtTime(0.001, tailEnd);
      pressureTail.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(pressureTail, tailStart);
      pressureTail.stop(tailEnd);
    }
  }

  public playBallisticShot(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const crack = this.getNoiseNode(ctx);
    if (crack) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(1700, t);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.72, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);
      crack.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      this.startNoise(crack, t);
      crack.stop(t + 0.055);
    }
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(170, t);
    body.frequency.exponentialRampToValueAtTime(52, t + 0.12);
    bodyGain.gain.setValueAtTime(0.46, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    body.connect(bodyGain);
    bodyGain.connect(this.masterGain);
    body.start(t);
    body.stop(t + 0.12);
  }

  public playBallisticScatter(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;

    const blast = this.getNoiseNode(ctx);
    if (blast) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1500, t);
      filter.frequency.exponentialRampToValueAtTime(240, t + 0.16);
      filter.Q.value = 0.55;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.82, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      blast.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      this.startNoise(blast, t);
      blast.stop(t + 0.16);
    }
    const body = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    body.type = 'sine';
    body.frequency.setValueAtTime(125, t);
    body.frequency.exponentialRampToValueAtTime(38, t + 0.2);
    bodyGain.gain.setValueAtTime(0.64, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    body.connect(bodyGain);
    bodyGain.connect(this.masterGain);
    body.start(t);
    body.stop(t + 0.2);
  }

  public playParticleCarbine(): void {
    this.playEnergyShot(210, 1750, 280, 0.14, 'square');
  }

  public playPlasmaBurst(): void {
    this.playEnergyShot(145, 920, 58, 0.26, 'sawtooth', 0.58);
  }

  public playLaserShot(): void {
    this.playEnergyShot(2300, 3500, 1550, 0.16, 'sine', 0.38);
  }

  private playEnergyShot(
    startFrequency: number,
    peakFrequency: number,
    endFrequency: number,
    duration: number,
    type: OscillatorType,
    level: number = 0.44
  ): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;
    const t = ctx.currentTime;
    const peakTime = t + Math.min(0.045, duration * 0.3);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(startFrequency, t);
    osc.frequency.exponentialRampToValueAtTime(peakFrequency, peakTime);
    osc.frequency.exponentialRampToValueAtTime(endFrequency, t + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.max(peakFrequency * 1.4, 2800), t);
    gain.gain.setValueAtTime(level, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration);
  }

  public playPsionicHit(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoDepth = ctx.createGain();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(360, t);
    osc1.frequency.linearRampToValueAtTime(840, t + 0.09);
    osc1.frequency.exponentialRampToValueAtTime(280, t + 0.20);

    osc2.frequency.setValueAtTime(368, t); // Chorus detune
    osc2.frequency.linearRampToValueAtTime(852, t + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(285, t + 0.20);

    // Slow vibrato separates psionics from the straight weapon envelopes.
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(7, t);
    lfoDepth.gain.setValueAtTime(9, t);
    lfo.connect(lfoDepth);
    lfoDepth.connect(osc1.detune);
    lfoDepth.connect(osc2.detune);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(t);
    osc2.start(t);
    lfo.start(t);
    osc1.stop(t + 0.20);
    osc2.stop(t + 0.20);
    lfo.stop(t + 0.20);
  }

  // --- DISRUPTOR THREE-BEAT EVENT ---

  public playDisruptorFire(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;
    const variation = this.nextCueVariation();
    const chargeEnd = t + COMBAT_AUDIO_TIMING.disruptorChargeEndSeconds;
    const beamEnd = t + COMBAT_AUDIO_TIMING.disruptorBeamEndSeconds;
    const impactTime = t + COMBAT_AUDIO_TIMING.disruptorImpactSeconds;

    // Beat 1: a restrained rise that leaves headroom for the later contact.
    const charge = ctx.createOscillator();
    const chargeGain = ctx.createGain();
    charge.type = 'triangle';
    charge.frequency.setValueAtTime(100 * variation.pitchScale, t);
    charge.frequency.exponentialRampToValueAtTime(720 * variation.pitchScale, chargeEnd);
    chargeGain.gain.setValueAtTime(0.001, t);
    chargeGain.gain.linearRampToValueAtTime(0.1, chargeEnd - 0.05);
    chargeGain.gain.exponentialRampToValueAtTime(0.001, chargeEnd);
    charge.connect(chargeGain);
    chargeGain.connect(masterGain);
    charge.start(t);
    charge.stop(chargeEnd);

    // Beat 2: a narrow, beating beam rather than one loud square-wave block.
    [650, 674].forEach((frequency) => {
      const beam = ctx.createOscillator();
      const gain = ctx.createGain();
      beam.type = 'triangle';
      beam.frequency.setValueAtTime(frequency * variation.pitchScale, chargeEnd);
      beam.frequency.exponentialRampToValueAtTime(frequency * 0.362 * variation.pitchScale, beamEnd);
      gain.gain.setValueAtTime(0.001, chargeEnd);
      gain.gain.linearRampToValueAtTime(0.09, chargeEnd + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, beamEnd);
      beam.connect(gain);
      gain.connect(masterGain);
      beam.start(chargeEnd);
      beam.stop(beamEnd);
    });

    const beamTexture = this.getNoiseNode(ctx);
    if (beamTexture) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1600 * variation.filterScale, chargeEnd);
      filter.frequency.exponentialRampToValueAtTime(900 * variation.filterScale, beamEnd);
      filter.Q.value = 0.7;
      gain.gain.setValueAtTime(0.1, chargeEnd);
      gain.gain.exponentialRampToValueAtTime(0.001, beamEnd);
      beamTexture.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(beamTexture, chargeEnd);
      beamTexture.stop(beamEnd);
    }

    // Beat 3: one compact detonation after the beam reaches the target.
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    const subEnd = impactTime + 0.22 * variation.decayScale;
    sub.type = 'sine';
    sub.frequency.setValueAtTime(135 * variation.pitchScale, impactTime);
    sub.frequency.exponentialRampToValueAtTime(48 * variation.pitchScale, subEnd);
    subGain.gain.setValueAtTime(0.28, impactTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, subEnd);
    sub.connect(subGain);
    subGain.connect(masterGain);
    sub.start(impactTime);
    sub.stop(subEnd);

    const crunch = this.getNoiseNode(ctx);
    if (crunch) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      const crunchEnd = impactTime + 0.16 * variation.decayScale;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400 * variation.filterScale, impactTime);
      filter.frequency.exponentialRampToValueAtTime(180 * variation.filterScale, crunchEnd);
      gain.gain.setValueAtTime(0.18, impactTime);
      gain.gain.exponentialRampToValueAtTime(0.001, crunchEnd);
      crunch.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(crunch, impactTime);
      crunch.stop(crunchEnd);
    }

    const crack = this.getNoiseNode(ctx);
    if (crack) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2600 * variation.filterScale, impactTime);
      gain.gain.setValueAtTime(0.09, impactTime);
      gain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.03);
      crack.connect(filter);
      filter.connect(gain);
      gain.connect(masterGain);
      this.startNoise(crack, impactTime);
      crack.stop(impactTime + 0.03);
    }
  }

  // --- DEFENSE & TACTICAL ---

  public playShieldRaise(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;
    // Field builds from a low electrical hum into a bright energy spike.
    [0, 7].forEach((detune) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = detune === 0 ? 'sawtooth' : 'triangle';
      osc.detune.setValueAtTime(detune, t);
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(2100, t + 0.19);
      osc.frequency.exponentialRampToValueAtTime(1380, t + 0.29);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(detune === 0 ? 0.34 : 0.22, t + 0.17);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.29);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + 0.29);
    });

    const spike = this.getNoiseNode(ctx);
    if (spike) {
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, t + 0.16);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.setValueAtTime(0.38, t + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      spike.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      this.startNoise(spike, t);
      spike.stop(t + 0.24);
    }
  }

  public playShieldShatter(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;

    // Noise shatter
    const noise = this.getNoiseNode(ctx);
    if (noise) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(3600, t);
      filter.frequency.exponentialRampToValueAtTime(300, t + 0.20);
      filter.Q.value = 4.0;

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.42, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      this.startNoise(noise, t);
      noise.stop(t + 0.20);
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.20);

    gain.gain.setValueAtTime(0.30, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.20);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.20);
  }

  public playBoostToggle(enable: boolean): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';

    if (enable) {
      // Turbine spin up
      osc.frequency.setValueAtTime(240, t);
      osc.frequency.exponentialRampToValueAtTime(960, t + 0.16);
    } else {
      // Turbine spin down
      osc.frequency.setValueAtTime(960, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.16);
    }

    gain.gain.setValueAtTime(0.30, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playBurnoutDamage(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(740, t + 0.04);

    gain.gain.setValueAtTime(0.20, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playCrash(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.30);

    gain.gain.setValueAtTime(0.40, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.30);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.30);
  }

  public playCritHit(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const end = t + 0.055;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1500, t);
    osc.frequency.exponentialRampToValueAtTime(2400, t + 0.012);
    osc.frequency.exponentialRampToValueAtTime(1100, end);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, end);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(end);
  }

  public playDeath(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.32);

    gain.gain.setValueAtTime(0.38, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.32);
  }

  public playVictory(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      const noteTime = t + i * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  public playDefeat(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    const masterGain = this.masterGain;
    const notes = [311.13, 261.63, 207.65, 155.56]; // Eb4, C4, Ab3, Eb3
    notes.forEach((freq, i) => {
      const noteTime = t + i * 0.10;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.28);
    });
  }
}

export const globalAudio = new AudioSynthesizer();
