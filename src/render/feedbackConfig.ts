/**
 * Centralized Configuration for Combat Impact Timings, Screen Shake, Hit-Stop, and Animations.
 * Single source of truth for combat feel calibration.
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

  // Damage popup scaling and life
  damageLifeTicks: 60,
  damageFloatSpeed: 0.75,

  // Scatter shot stagger interval (ms between consecutive target impacts)
  scatterStaggerMs: 42,

  // Full-screen flash duration (ms)
  flashDurationMs: 220,
};
