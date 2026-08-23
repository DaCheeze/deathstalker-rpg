import { describe, expect, it } from 'vitest';
import { CombatFeedbackTimeline } from '../../src/render/combatFeedbackTimeline';
import { FEEDBACK_CONFIG } from '../../src/render/feedbackConfig';

describe('combat feedback presentation timeline', () => {
  it('emits melee contact at the lunge midpoint exactly once', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerMelee(1, 200);

    expect(timeline.advance(99)).toEqual([]);
    expect(timeline.advance(1)).toEqual([{ token: 1, kind: 'melee_contact' }]);
    expect(timeline.advance(500)).toEqual([]);
    expect(timeline.pendingTokenCount).toBe(0);
  });

  it('emits projectile contact only after the registered travel time', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerProjectile(2, 240);

    expect(timeline.advance(80)).toEqual([]);
    expect(timeline.advance(80)).toEqual([]);
    expect(timeline.advance(80)).toEqual([{ token: 2, kind: 'projectile_contact' }]);
    expect(timeline.hasToken(2)).toBe(false);
  });

  it('emits psionic contact at the configured ripple travel boundary', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerPsionic(15, FEEDBACK_CONFIG.psionicRippleDurationMs);

    expect(timeline.advance(160)).toEqual([]);
    expect(timeline.advance(159)).toEqual([]);
    expect(timeline.advance(1)).toEqual([{ token: 15, kind: 'psionic_contact' }]);
    expect(timeline.advance(FEEDBACK_CONFIG.psionicRippleDurationMs)).toEqual([]);
  });

  it('emits disruptor beam and contact milestones at their semantic boundaries', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerDisruptor(3, 220, 240);

    expect(timeline.advance(219)).toEqual([]);
    expect(timeline.advance(1)).toEqual([{ token: 3, kind: 'disruptor_beam' }]);
    expect(timeline.advance(239)).toEqual([]);
    expect(timeline.advance(1)).toEqual([{ token: 3, kind: 'disruptor_contact' }]);
    expect(timeline.advance(350)).toEqual([]);
  });

  it('returns every crossed milestone in semantic order after a large frame delta', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerDisruptor(4, 140, 160);

    expect(timeline.advance(500)).toEqual([
      { token: 4, kind: 'disruptor_beam' },
      { token: 4, kind: 'disruptor_contact' },
    ]);
  });

  it('is invariant to variable positive delta partitioning', () => {
    const fixed = new CombatFeedbackTimeline();
    const variable = new CombatFeedbackTimeline();
    fixed.registerDisruptor(5, 140, 160);
    variable.registerDisruptor(5, 140, 160);

    const fixedMilestones = [
      ...fixed.advance(100),
      ...fixed.advance(100),
      ...fixed.advance(100),
    ];
    const variableMilestones = [
      ...variable.advance(17),
      ...variable.advance(41),
      ...variable.advance(83),
      ...variable.advance(159),
    ];

    expect(variableMilestones).toEqual(fixedMilestones);
  });

  it('does not advance or emit during a zero-delta hit-stop frame', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerMelee(6, 200);

    expect(timeline.advance(90)).toEqual([]);
    expect(timeline.advance(0)).toEqual([]);
    expect(timeline.advance(0)).toEqual([]);
    expect(timeline.advance(9)).toEqual([]);
    expect(timeline.advance(1)).toEqual([{ token: 6, kind: 'melee_contact' }]);
  });

  it('orders milestones by crossing time when effects overlap', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerProjectile(7, 100);
    expect(timeline.advance(40)).toEqual([]);

    timeline.registerMelee(8, 100);
    expect(timeline.advance(60)).toEqual([
      { token: 8, kind: 'melee_contact' },
      { token: 7, kind: 'projectile_contact' },
    ]);
  });

  it('keeps equal-time milestones deterministic by registration order', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerProjectile(9, 100);
    timeline.registerProjectile(10, 100);

    expect(timeline.advance(100)).toEqual([
      { token: 9, kind: 'projectile_contact' },
      { token: 10, kind: 'projectile_contact' },
    ]);
  });

  it('resets all pending tokens and permits clean token reuse', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerDisruptor(11, 220, 240);
    expect(timeline.advance(100)).toEqual([]);

    timeline.reset();
    expect(timeline.pendingTokenCount).toBe(0);
    expect(timeline.advance(1_000)).toEqual([]);

    timeline.registerProjectile(11, 20);
    expect(timeline.advance(20)).toEqual([{ token: 11, kind: 'projectile_contact' }]);
  });

  it('rejects duplicate active tokens and invalid timing inputs', () => {
    const timeline = new CombatFeedbackTimeline();
    timeline.registerMelee(12, 200);

    expect(() => timeline.registerProjectile(12, 100)).toThrow(/already registered/);
    expect(() => timeline.registerMelee(0, 200)).toThrow(RangeError);
    expect(() => timeline.registerProjectile(13, 0)).toThrow(RangeError);
    expect(() => timeline.registerDisruptor(14, Number.POSITIVE_INFINITY, 10)).toThrow(RangeError);
    expect(() => timeline.advance(-1)).toThrow(RangeError);
    expect(() => timeline.advance(Number.NaN)).toThrow(RangeError);
  });
});
