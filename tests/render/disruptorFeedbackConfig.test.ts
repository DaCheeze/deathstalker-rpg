import { describe, expect, it } from 'vitest';
import { FEEDBACK_CONFIG } from '../../src/render/feedbackConfig';

describe('range-band disruptor presentation', () => {
  it('uses a shorter and lighter prototype profile than the legacy showcase', () => {
    const legacyDuration = FEEDBACK_CONFIG.disruptorChargeDurationMs
      + FEEDBACK_CONFIG.disruptorBeamDurationMs
      + FEEDBACK_CONFIG.disruptorImpactDurationMs;
    const prototypeDuration = FEEDBACK_CONFIG.prototypeDisruptorChargeDurationMs
      + FEEDBACK_CONFIG.prototypeDisruptorBeamDurationMs
      + FEEDBACK_CONFIG.prototypeDisruptorImpactDurationMs;

    expect(prototypeDuration).toBeLessThan(legacyDuration);
    expect(FEEDBACK_CONFIG.prototypeDisruptorHitStopMs).toBeLessThan(
      FEEDBACK_CONFIG.hitStopDisruptorMs
    );
    expect(FEEDBACK_CONFIG.prototypeDisruptorShakeMagnitude).toBeLessThan(
      FEEDBACK_CONFIG.shakeDisruptorMagnitude
    );
    expect(FEEDBACK_CONFIG.prototypeDisruptorShakeDurationMs).toBeLessThan(
      FEEDBACK_CONFIG.shakeDisruptorDurationMs
    );
    expect(FEEDBACK_CONFIG.prototypeDisruptorFlashAlpha).toBeLessThan(0.4);
  });
});
