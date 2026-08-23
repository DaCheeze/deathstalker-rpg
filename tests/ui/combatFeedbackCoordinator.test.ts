import { afterEach, describe, expect, it } from 'vitest';
import type {
  AbilityDefinition,
  BattleAction,
  BattleEvent,
  BattleState,
  Combatant,
} from '../../src/core/types';
import { resetCombatantFeedback } from '../../src/render/drawCombatants';
import { resetCombatEffects } from '../../src/render/drawFx';
import { resetCombatUiFeedback } from '../../src/render/drawUI';
import { FEEDBACK_CONFIG } from '../../src/render/feedbackConfig';
import { CombatFeedbackCoordinator } from '../../src/ui/combatFeedbackCoordinator';

const meleeAbility: AbilityDefinition = {
  id: 'vibro_blade',
  name: 'Vibro-Blade',
  category: 'melee',
  audioProfile: 'vibro_blade',
  espCost: 0,
  powerMultiplier: 1,
  targetScope: 'single_enemy',
  description: 'Test blade.',
};

const projectileAbility: AbilityDefinition = {
  id: 'particle_carbine',
  name: 'Particle Carbine',
  category: 'projectile',
  audioProfile: 'particle',
  espCost: 0,
  powerMultiplier: 1,
  targetScope: 'single_enemy',
  description: 'Test projectile.',
};

function combatant(id: string, faction: 'party' | 'empire'): Combatant {
  return {
    id,
    name: id,
    faction,
    role: 'Test',
    stats: {
      maxHp: 100,
      hp: 100,
      maxEsp: 0,
      esp: 0,
      attack: 20,
      defense: 10,
      speed: 10,
    },
    canBoost: false,
    disruptorCooldown: 0,
    isBoosting: false,
    crashTurns: 0,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: [meleeAbility.id, projectileAbility.id],
  };
}

function state(events: BattleEvent[] = []): BattleState {
  return {
    encounterId: 'feedback-test',
    battleMode: 'legacy',
    turnNumber: 1,
    activeActorId: 'p1',
    turnQueue: {
      entries: [{ queueId: 'p1-1', actorId: 'p1', predictedTick: 1 }],
      accumulators: { p1: 0, e1: 0 },
    },
    combatants: {
      p1: combatant('p1', 'party'),
      e1: combatant('e1', 'empire'),
    },
    partyIds: ['p1'],
    enemyIds: ['e1'],
    abilities: {
      [meleeAbility.id]: meleeAbility,
      [projectileAbility.id]: projectileAbility,
    },
    inventory: { medkits: 0, revives: 0 },
    status: 'in_progress',
    recentEvents: events,
    log: [],
  };
}

function damageEvent(isDisruptor = false): BattleEvent {
  return {
    type: 'DAMAGE_DEALT',
    actorId: 'p1',
    targetId: 'e1',
    abilityName: isDisruptor ? 'Disruptor Bolt' : 'Vibro-Blade',
    damage: 20,
    isCrit: false,
    isDisruptor,
    shieldAbsorbed: false,
    targetKilled: false,
  };
}

afterEach(() => {
  resetCombatEffects();
  resetCombatantFeedback();
  resetCombatUiFeedback();
});

describe('combat feedback coordinator contact gating', () => {
  it('keeps melee impact pending until the lunge midpoint', () => {
    const coordinator = new CombatFeedbackCoordinator();
    const previous = state();
    const next = state([damageEvent()]);
    const action: BattleAction = {
      type: 'Attack',
      actorId: 'p1',
      targetId: 'e1',
      abilityId: meleeAbility.id,
    };

    coordinator.spawn(previous, action, next);
    expect(coordinator.pendingImpactCount).toBe(1);
    coordinator.advance(FEEDBACK_CONFIG.lungeDurationMs / 2 - 1);
    expect(coordinator.pendingImpactCount).toBe(1);
    coordinator.advance(1);
    expect(coordinator.pendingImpactCount).toBe(0);
  });

  it('gates projectile impact by elapsed milliseconds and freezes at zero delta', () => {
    const coordinator = new CombatFeedbackCoordinator();
    const previous = state();
    const next = state([damageEvent()]);
    const action: BattleAction = {
      type: 'Attack',
      actorId: 'p1',
      targetId: 'e1',
      abilityId: projectileAbility.id,
    };

    coordinator.spawn(previous, action, next);
    coordinator.advance(FEEDBACK_CONFIG.projectileTravelDurationMs - 1);
    coordinator.advance(0);
    expect(coordinator.pendingImpactCount).toBe(1);
    coordinator.advance(1);
    expect(coordinator.pendingImpactCount).toBe(0);
  });

  it('uses the disruptor beam boundary and cancels pending impact on reset', () => {
    const coordinator = new CombatFeedbackCoordinator();
    const previous = { ...state(), battleMode: 'range_band_prototype' as const };
    const interrupt: BattleEvent = {
      type: 'DISRUPTOR_INTERRUPT',
      actorId: 'p1',
      targetId: 'e1',
    };
    const next = {
      ...state([damageEvent(true), interrupt]),
      battleMode: 'range_band_prototype' as const,
    };
    const action: BattleAction = { type: 'Advance', actorId: 'e1' };
    const contactMs = FEEDBACK_CONFIG.prototypeDisruptorChargeDurationMs
      + FEEDBACK_CONFIG.prototypeDisruptorBeamDurationMs;

    coordinator.spawn(previous, action, next);
    coordinator.advance(contactMs - 1);
    expect(coordinator.pendingImpactCount).toBe(1);
    coordinator.reset();
    coordinator.advance(1);
    expect(coordinator.pendingImpactCount).toBe(0);
  });
});
