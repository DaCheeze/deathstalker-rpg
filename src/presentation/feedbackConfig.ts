/**
 * Engine-neutral semantic timing and impact policy shared by TypeScript bridge
 * serialization and presentation clients.
 */
export const FEEDBACK_CONFIG = {
  hitStopNormalMs: 60,
  hitStopCritMs: 110,
  hitStopDisruptorMs: 190,
  prototypeDisruptorHitStopMs: 90,

  shakeNormalMagnitude: 4,
  shakeNormalDurationMs: 120,
  shakeCritMagnitude: 8,
  shakeCritDurationMs: 180,
  shakeDisruptorMagnitude: 15,
  shakeDisruptorDurationMs: 380,
  prototypeDisruptorShakeMagnitude: 7,
  prototypeDisruptorShakeDurationMs: 220,

  flinchDistanceNormal: 8,
  flinchDistanceHeavy: 16,
  flinchDurationMs: 140,

  lungeDistanceNormal: 22,
  lungeDurationMs: 200,

  projectileSpeed: 16,
  projectileLifeTicks: 24,
  projectileTravelDurationMs: 250,
  scatterProjectileTravelDurationMs: 210,

  psionicRippleDurationMs: 320,

  disruptorChargeDurationMs: 220,
  disruptorBeamDurationMs: 240,
  disruptorImpactDurationMs: 350,
  prototypeDisruptorChargeDurationMs: 220,
  prototypeDisruptorBeamDurationMs: 240,
  prototypeDisruptorImpactDurationMs: 80,
  prototypeDisruptorFlashDurationMs: 140,
  prototypeDisruptorFlashAlpha: 0.16,

  deathFragmentCount: 18,
  deathFragmentLifeTicks: 45,

  damageLifeTicks: 60,
  damageFloatSpeed: 0.75,

  scatterStaggerMs: 42,
  flashDurationMs: 220,

  bloomBaseIntensity: 0.85,
  bloomSpikeIntensity: 2.6,
  bloomBlurRadiusPx: 8,
  bloomResolutionScale: 0.125,
  vignetteDefaultStrength: 0.60,
  ambientParticleCount: 12,
  parallaxMaxOffsetPx: 8,
};

