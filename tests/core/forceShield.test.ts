import { describe, it, expect } from 'vitest';
import { applyAction, initBattle } from '../../src/core/battle';
import { Combatant, EncounterDefinition, AbilityDefinition } from '../../src/core/types';

function createShieldTestSetup() {
  const p1: Combatant = {
    id: 'p1',
    name: 'Hero',
    faction: 'party',
    role: 'Captain',
    stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 30, defense: 10, speed: 20 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['slash'],
  };

  const e1: Combatant = {
    id: 'e1',
    name: 'Enemy',
    faction: 'empire',
    role: 'Guard',
    stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 30, defense: 10, speed: 10 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['slash'],
  };

  const abilities: Record<string, AbilityDefinition> = {
    slash: {
      id: 'slash',
      name: 'Slash',
      category: 'melee',
      espCost: 0,
      powerMultiplier: 1.0,
      targetScope: 'single_enemy',
      description: 'melee',
    },
  };

  const encounter: EncounterDefinition = {
    id: 'enc1',
    name: 'Test',
    tier: 'standard',
    description: 'test',
    enemyIds: ['e1'],
  };

  const state = initBattle([p1], [e1], abilities, encounter);
  return { state };
}

describe('Force Shield Mechanics', () => {
  it('raising shield sets hasForceShield and blocks next incoming normal attack completely', () => {
    const { state } = createShieldTestSetup();

    // Hero attacks Enemy without shield -> Enemy takes damage
    let current = applyAction(
      state,
      { type: 'Attack', actorId: 'p1', targetId: 'e1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    expect(current.combatants['e1']?.stats.hp).toBe(75);

    // Enemy raises force shield
    current = applyAction(current, { type: 'RaiseShield', actorId: 'e1' });
    expect(current.combatants['e1']?.hasForceShield).toBe(true);

    // Hero attacks again -> absorbed by shield (0 damage), shield drops
    current = applyAction(
      current,
      { type: 'Attack', actorId: 'p1', targetId: 'e1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    expect(current.combatants['e1']?.stats.hp).toBe(75); // No damage taken
    expect(current.combatants['e1']?.hasForceShield).toBe(false); // Shield collapsed

    // Next attack hits HP again because shield is down
    current = applyAction(current, { type: 'PassTurn', actorId: 'e1' });
    current = applyAction(
      current,
      { type: 'Attack', actorId: 'p1', targetId: 'e1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    expect(current.combatants['e1']?.stats.hp).toBe(50);
  });

  it('reduces incoming disruptor bolt damage by 50% and collapses shield', () => {
    const { state } = createShieldTestSetup();

    // Give enemy shield
    let current = applyAction(state, { type: 'PassTurn', actorId: 'p1' });
    current = applyAction(current, { type: 'RaiseShield', actorId: 'e1' });
    expect(current.combatants['e1']?.hasForceShield).toBe(true);

    // Hero fires disruptor: 30 * 3.2 - 5 = 91 raw -> 50% absorbed = 46 final damage
    current = applyAction(
      current,
      { type: 'Disruptor', actorId: 'p1', targetId: 'e1' },
      { varianceFactor: 1.0, isCrit: false }
    );

    // Enemy took 46 damage (100 - 46 = 54 HP remaining) instead of dying from full 91 dmg
    expect(current.combatants['e1']?.stats.hp).toBe(54);
    expect(current.combatants['e1']?.hasForceShield).toBe(false);
  });
});
