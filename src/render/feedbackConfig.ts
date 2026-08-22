/**
 * Centralized Configuration for Combat Impact Timings, Screen Shake, Hit-Stop,
 * HD-2D Compositor Bloom, Vignette, and Post-Processing.
 * Single source of truth for combat feel calibration and visual animation parameters.
 */

export const FEEDBACK_CONFIG = {
  // Hit-stop duration in milliseconds (freezes the visual frame on impact)
  hitStopNormalMs: 60,
  hitStopCritMs: 110,
  hitStopDisruptorMs: 190,

  // Screen shake configuration
  shakeNormalMagnitude: 4,
  shakeNormalDurationMs: 120,
  shakeCritMagnitude: 8,
  shakeCritDurationMs: 180,
  shakeDisruptorMagnitude: 15,
  shakeDisruptorDurationMs: 380,

  // Target flinch displacement on hit (pixels)
  flinchDistanceNormal: 8,
  flinchDistanceHeavy: 16,
  flinchDurationMs: 140,

  // Attacker lunge movement
  lungeDistanceNormal: 22,
  lungeDurationMs: 200,

  // Projectile animation
  projectileSpeed: 16,
  projectileLifeTicks: 24,

  // Psionic wave animation
  psionicRippleDurationMs: 320,

  // Disruptor 3-beat sequence timings
  disruptorChargeDurationMs: 220,
  disruptorBeamDurationMs: 240,
  disruptorImpactDurationMs: 350,

  // Death fragmentation particles
  deathFragmentCount: 18,
  deathFragmentLifeTicks: 45,

  // Damage popup scaling and life
  damageLifeTicks: 60,
  damageFloatSpeed: 0.75,

  // Scatter shot stagger interval (ms between consecutive target impacts)
  scatterStaggerMs: 42,

  // Full-screen flash duration (ms)
  flashDurationMs: 220,

  // HD-2D Compositor Post-Processing Settings
  bloomBaseIntensity: 0.85,
  bloomSpikeIntensity: 2.6,
  bloomBlurRadiusPx: 8,
  bloomResolutionScale: 0.5, // Half-resolution offscreen buffer
  vignetteDefaultStrength: 0.60,
  ambientParticleCount: 12,
  parallaxMaxOffsetPx: 8,
};
