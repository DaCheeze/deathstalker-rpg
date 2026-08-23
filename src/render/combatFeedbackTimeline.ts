/**
 * Pure presentation-time scheduler for semantic combat feedback milestones.
 *
 * The timeline owns no browser state and performs no audio or rendering work.
 * Callers register an effect token with its visual timing, advance the timeline
 * with the same delta used by the visual effect, and consume the returned
 * milestones exactly once.
 */

export type CombatFeedbackToken = number;

export type CombatFeedbackMilestoneKind =
  | 'melee_contact'
  | 'projectile_contact'
  | 'psionic_contact'
  | 'disruptor_beam'
  | 'disruptor_contact';

export interface CombatFeedbackMilestone {
  token: CombatFeedbackToken;
  kind: CombatFeedbackMilestoneKind;
}

interface ScheduledMilestone {
  kind: CombatFeedbackMilestoneKind;
  atMs: number;
  emitted: boolean;
  order: number;
}

interface TimelineEntry {
  token: CombatFeedbackToken;
  elapsedMs: number;
  registrationOrder: number;
  milestones: ScheduledMilestone[];
}

interface CrossedMilestone {
  milestone: CombatFeedbackMilestone;
  crossedAfterMs: number;
  registrationOrder: number;
  milestoneOrder: number;
}

function requireToken(token: CombatFeedbackToken): void {
  if (!Number.isSafeInteger(token) || token <= 0) {
    throw new RangeError(`Combat feedback token must be a positive safe integer; received ${token}`);
  }
}

function requirePositiveDuration(durationMs: number, label: string): void {
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    throw new RangeError(`${label} must be a positive finite duration; received ${durationMs}`);
  }
}

function requireAdvanceDelta(deltaMs: number): void {
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new RangeError(`Combat feedback delta must be finite and non-negative; received ${deltaMs}`);
  }
}

export class CombatFeedbackTimeline {
  private readonly entries = new Map<CombatFeedbackToken, TimelineEntry>();
  private nextRegistrationOrder = 0;

  public get pendingTokenCount(): number {
    return this.entries.size;
  }

  public hasToken(token: CombatFeedbackToken): boolean {
    return this.entries.has(token);
  }

  public registerMelee(token: CombatFeedbackToken, durationMs: number): void {
    requirePositiveDuration(durationMs, 'Melee duration');
    this.register(token, [{ kind: 'melee_contact', atMs: durationMs / 2 }]);
  }

  public registerProjectile(token: CombatFeedbackToken, contactAfterMs: number): void {
    requirePositiveDuration(contactAfterMs, 'Projectile contact time');
    this.register(token, [{ kind: 'projectile_contact', atMs: contactAfterMs }]);
  }

  public registerPsionic(token: CombatFeedbackToken, contactAfterMs: number): void {
    requirePositiveDuration(contactAfterMs, 'Psionic contact time');
    this.register(token, [{ kind: 'psionic_contact', atMs: contactAfterMs }]);
  }

  public registerDisruptor(
    token: CombatFeedbackToken,
    chargeDurationMs: number,
    beamDurationMs: number
  ): void {
    requirePositiveDuration(chargeDurationMs, 'Disruptor charge duration');
    requirePositiveDuration(beamDurationMs, 'Disruptor beam duration');
    const contactAtMs = chargeDurationMs + beamDurationMs;
    requirePositiveDuration(contactAtMs, 'Disruptor contact time');
    this.register(token, [
      { kind: 'disruptor_beam', atMs: chargeDurationMs },
      { kind: 'disruptor_contact', atMs: contactAtMs },
    ]);
  }

  public advance(deltaMs: number): CombatFeedbackMilestone[] {
    requireAdvanceDelta(deltaMs);
    if (deltaMs === 0 || this.entries.size === 0) return [];

    const crossed: CrossedMilestone[] = [];
    const completedTokens: CombatFeedbackToken[] = [];

    for (const entry of this.entries.values()) {
      const previousElapsedMs = entry.elapsedMs;
      const nextElapsedMs = previousElapsedMs + deltaMs;

      for (const scheduled of entry.milestones) {
        if (scheduled.emitted || scheduled.atMs > nextElapsedMs) continue;

        scheduled.emitted = true;
        crossed.push({
          milestone: { token: entry.token, kind: scheduled.kind },
          crossedAfterMs: Math.max(0, scheduled.atMs - previousElapsedMs),
          registrationOrder: entry.registrationOrder,
          milestoneOrder: scheduled.order,
        });
      }

      entry.elapsedMs = nextElapsedMs;
      if (entry.milestones.every((scheduled) => scheduled.emitted)) {
        completedTokens.push(entry.token);
      }
    }

    for (const token of completedTokens) {
      this.entries.delete(token);
    }

    crossed.sort((a, b) =>
      a.crossedAfterMs - b.crossedAfterMs
      || a.registrationOrder - b.registrationOrder
      || a.milestoneOrder - b.milestoneOrder
    );
    return crossed.map(({ milestone }) => milestone);
  }

  public reset(): void {
    this.entries.clear();
    this.nextRegistrationOrder = 0;
  }

  private register(
    token: CombatFeedbackToken,
    milestones: ReadonlyArray<Omit<ScheduledMilestone, 'emitted' | 'order'>>
  ): void {
    requireToken(token);
    if (this.entries.has(token)) {
      throw new Error(`Combat feedback token ${token} is already registered`);
    }

    this.entries.set(token, {
      token,
      elapsedMs: 0,
      registrationOrder: this.nextRegistrationOrder++,
      milestones: milestones.map((milestone, order) => ({
        ...milestone,
        emitted: false,
        order,
      })),
    });
  }
}
