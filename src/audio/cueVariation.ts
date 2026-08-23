export interface CueVariation {
  pitchScale: number;
  filterScale: number;
  decayScale: number;
}

const GOLDEN_PHASE_STEP = 0.3819660112501051;

const CUE_VARIATIONS: readonly CueVariation[] = [
  { pitchScale: 1, filterScale: 1, decayScale: 1 },
  { pitchScale: 0.982, filterScale: 1.04, decayScale: 1.02 },
  { pitchScale: 1.014, filterScale: 0.95, decayScale: 0.98 },
  { pitchScale: 0.993, filterScale: 1.06, decayScale: 1.01 },
  { pitchScale: 1.018, filterScale: 0.97, decayScale: 0.97 },
  { pitchScale: 0.987, filterScale: 1.02, decayScale: 1.03 },
];

export const COMBAT_AUDIO_TIMING = {
  meleeImpactSeconds: 0.1,
  twinFirstImpactSeconds: 0.085,
  twinSecondImpactSeconds: 0.145,
  disruptorChargeEndSeconds: 0.22,
  disruptorBeamEndSeconds: 0.44,
  disruptorImpactSeconds: 0.46,
} as const;

/**
 * Named-melee mix and envelope values live beside their immutable contact anchors
 * so synthesis changes cannot quietly collapse the four silhouettes back together.
 */
export const NAMED_MELEE_AUDIO_DESIGN = {
  vibroBlade: {
    swingPeakLevel: 0.36,
    motorPeakLevel: 0.045,
    impactPeakLevel: 0.48,
    ringPeakLevel: 0.065,
  },
  twinVibroDaggers: {
    contacts: [
      {
        timeSeconds: COMBAT_AUDIO_TIMING.twinFirstImpactSeconds,
        noiseDurationSeconds: 0.03,
        ringDurationSeconds: 0.032,
        noisePeakLevel: 0.19,
        ringPeakLevel: 0.035,
        filterStartFrequency: 2800,
        filterEndFrequency: 1550,
        ringStartFrequency: 1750,
        ringEndFrequency: 1320,
      },
      {
        timeSeconds: COMBAT_AUDIO_TIMING.twinSecondImpactSeconds,
        noiseDurationSeconds: 0.042,
        ringDurationSeconds: 0.05,
        noisePeakLevel: 0.28,
        ringPeakLevel: 0.05,
        filterStartFrequency: 3650,
        filterEndFrequency: 1900,
        ringStartFrequency: 2250,
        ringEndFrequency: 1580,
      },
    ],
  },
  heavySmash: {
    impactPeakLevel: 0.48,
    bodyPeakLevel: 0.26,
    subPeakLevel: 0.14,
  },
  concussiveShove: {
    contactPeakLevel: 0.24,
    bodyPeakLevel: 0.09,
    pressurePeakLevel: 0.2,
  },
} as const;

function positiveModulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

/** Returns a small deterministic timbre variation without moving impact anchors. */
export function cueVariationForSequence(sequence: number): CueVariation {
  const safeSequence = Number.isFinite(sequence) ? Math.trunc(sequence) : 0;
  const index = positiveModulo(safeSequence, CUE_VARIATIONS.length);
  const variation = CUE_VARIATIONS[index];
  if (!variation) {
    throw new Error(`Missing cue variation at index ${index}`);
  }
  return variation;
}

/**
 * Selects a deterministic phase within the reusable noise buffer. Consecutive
 * sources begin on unrelated samples instead of replaying the buffer from zero.
 */
export function noiseOffsetForSequence(sequence: number, bufferDuration: number): number {
  if (!Number.isFinite(bufferDuration) || bufferDuration <= 0) return 0;
  const safeSequence = Number.isFinite(sequence) ? Math.max(0, Math.trunc(sequence)) : 0;
  const phase = ((safeSequence + 1) * GOLDEN_PHASE_STEP) % 1;
  return phase * bufferDuration;
}
