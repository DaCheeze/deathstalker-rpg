import { describe, expect, it } from 'vitest';
import {
  COMBAT_AUDIO_TIMING,
  NAMED_MELEE_AUDIO_DESIGN,
  cueVariationForSequence,
  noiseOffsetForSequence,
} from '../../src/audio/cueVariation';

describe('procedural combat audio variation', () => {
  it('keeps deterministic timbre variation inside conservative bounds', () => {
    const variations = Array.from({ length: 12 }, (_, index) => cueVariationForSequence(index));

    for (const variation of variations) {
      expect(variation.pitchScale).toBeGreaterThanOrEqual(0.982);
      expect(variation.pitchScale).toBeLessThanOrEqual(1.018);
      expect(variation.filterScale).toBeGreaterThanOrEqual(0.95);
      expect(variation.filterScale).toBeLessThanOrEqual(1.06);
      expect(variation.decayScale).toBeGreaterThanOrEqual(0.97);
      expect(variation.decayScale).toBeLessThanOrEqual(1.03);
    }

    expect(variations.slice(0, 6)).toEqual(variations.slice(6, 12));
    for (let index = 1; index < variations.length; index += 1) {
      expect(variations[index]).not.toEqual(variations[index - 1]);
    }
  });

  it('starts consecutive reusable-noise sources at distinct in-buffer offsets', () => {
    const offsets = Array.from({ length: 12 }, (_, index) => noiseOffsetForSequence(index, 1));

    for (const offset of offsets) {
      expect(offset).toBeGreaterThanOrEqual(0);
      expect(offset).toBeLessThan(1);
    }
    expect(new Set(offsets.map((offset) => offset.toFixed(9))).size).toBe(offsets.length);
    expect(noiseOffsetForSequence(0, 0)).toBe(0);
  });

  it('keeps signature rhythm and disruptor beats ordered', () => {
    expect(COMBAT_AUDIO_TIMING.meleeImpactSeconds).toBe(0.1);
    expect(
      COMBAT_AUDIO_TIMING.twinSecondImpactSeconds - COMBAT_AUDIO_TIMING.twinFirstImpactSeconds
    ).toBeCloseTo(0.06, 8);
    expect(COMBAT_AUDIO_TIMING.disruptorChargeEndSeconds).toBeLessThan(
      COMBAT_AUDIO_TIMING.disruptorBeamEndSeconds
    );
    expect(COMBAT_AUDIO_TIMING.disruptorBeamEndSeconds).toBeLessThan(
      COMBAT_AUDIO_TIMING.disruptorImpactSeconds
    );
  });

  it('keeps Vibro-Blade noise in front of its tonal residues', () => {
    const design = NAMED_MELEE_AUDIO_DESIGN.vibroBlade;

    expect(design.motorPeakLevel / design.swingPeakLevel).toBeLessThan(0.15);
    expect(design.ringPeakLevel / design.impactPeakLevel).toBeLessThan(0.15);
  });

  it('preserves a real notch between unequal Twin Vibro-Dagger contacts', () => {
    const [first, second] = NAMED_MELEE_AUDIO_DESIGN.twinVibroDaggers.contacts;
    const maximumDecayScale = 1.03;
    const firstEnd =
      first.timeSeconds +
      Math.max(first.noiseDurationSeconds, first.ringDurationSeconds) * maximumDecayScale;

    expect(first.timeSeconds).toBe(COMBAT_AUDIO_TIMING.twinFirstImpactSeconds);
    expect(second.timeSeconds).toBe(COMBAT_AUDIO_TIMING.twinSecondImpactSeconds);
    expect(second.timeSeconds - firstEnd).toBeGreaterThan(0.025);
    expect(second.noisePeakLevel).toBeGreaterThan(first.noisePeakLevel);
    expect(second.noiseDurationSeconds).not.toBe(first.noiseDurationSeconds);
  });

  it('separates Heavy Smash body from Concussive Shove pressure', () => {
    const heavy = NAMED_MELEE_AUDIO_DESIGN.heavySmash;
    const shove = NAMED_MELEE_AUDIO_DESIGN.concussiveShove;

    expect(heavy.bodyPeakLevel).toBeGreaterThan(shove.bodyPeakLevel * 2.5);
    expect(heavy.bodyPeakLevel).toBeGreaterThan(heavy.subPeakLevel);
    expect(shove.pressurePeakLevel).toBeGreaterThan(shove.bodyPeakLevel * 2);
  });
});
