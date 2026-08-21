import { describe, it, expect } from 'vitest';
import { applyAction, initBattle } from '../../src/core/battle';
import { Combatant, EncounterDefinition, AbilityDefinition } from '../../src/core/types';

function createTestSetup() {
  const partyMember: Combatant = {
    id: 'p1',
    name: 'Hero',
    faction: 'party',
    role: 'Captain',
    stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 25, defense: 10, speed: 20 },
    canBoost: true,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['slash'],
  };

  const enemy: Combatant = {
    id: 'e1',
    name: 'Target Dummy',
    faction: 'empire',
    role: 'Guard',
    stats: { maxHp: 300, hp: 300, maxEsp: 0, esp: 0, attack: 15, defense: 10, speed: 10 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: true, // Has shield active!
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
      description: 'basic attack',
    },
  };

  const encounter: EncounterDefinition = {
    id: 'enc1',
    name: 'Test Encounter',
    tier: 'standard',
    description: 'test',
    enemyIds: ['e1'],
  };

  const state = initBattle([partyMember], [enemy], abilities, encounter);
  return { state, partyMember, enemy, abilities, encounter };
}

describe('Disruptor Mechanics', () => {
  it('starts battle with disruptor cooldown = 3 by default', () => {
    const unchargedParty: Combatant = {
      id: 'p_def',
      name: 'Hero',
      faction: 'party',
      role: 'Captain',
      stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 25, defense: 10, speed: 20 },
      canBoost: true,
      crashTurns: 0,
      disruptorCooldown: 3,
      isBoosting: false,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      abilityIds: ['slash'],
    };
    const defaultState = initBattle([unchargedParty], [], {}, { id: 'e', name: 'e', tier: 'standard', description: 'e', enemyIds: ['e1'] });
    expect(defaultState.combatants['p_def']?.disruptorCooldown).toBe(3);
  });

  it('deals ~4x damage and penetrates force shield at 50% reduction', () => {
    const { state } = createTestSetup();
    const initialHp = state.combatants['e1']?.stats.hp ?? 0;
    expect(state.combatants['e1']?.hasForceShield).toBe(true);

    const nextState = applyAction(
      state,
      { type: 'Disruptor', actorId: 'p1', targetId: 'e1' },
      { varianceFactor: 1.0, isCrit: false }
    );

    const damageDealt = initialHp - (nextState.combatants['e1']?.stats.hp ?? 0);
    // Base formula: (25 * 3.2) - (10 * 0.5) = 80 - 5 = 75 raw -> 50% absorbed = 38 dmg
    expect(damageDealt).toBe(38);
    expect(nextState.combatants['e1']?.hasForceShield).toBe(false);
    expect(nextState.combatants['p1']?.disruptorCooldown).toBe(6);
  });

  it('cooldown decrements only on that combatant own turns', () => {
    const { state } = createTestSetup();

    // 1. Hero fires disruptor
    let current = applyAction(state, { type: 'Disruptor', actorId: 'p1', targetId: 'e1' });
    expect(current.combatants['p1']?.disruptorCooldown).toBe(6);

    // 2. Enemy takes a turn (Pass)
    current = applyAction(current, { type: 'PassTurn', actorId: 'e1' });
    // Hero cooldown should NOT decrement on enemy's turn
    expect(current.combatants['p1']?.disruptorCooldown).toBe(6);

    // 3. Hero takes 1st subsequent turn (Pass)
    current = applyAction(current, { type: 'PassTurn', actorId: 'p1' });
    expect(current.combatants['p1']?.disruptorCooldown).toBe(5);

    // 4. Enemy takes another turn
    current = applyAction(current, { type: 'PassTurn', actorId: 'e1' });
    expect(current.combatants['p1']?.disruptorCooldown).toBe(5);

    // 5. Advance Hero 5 more turns
    for (let i = 0; i < 5; i++) {
      current = applyAction(current, { type: 'PassTurn', actorId: 'p1' });
      if (current.combatants['e1']?.stats.hp ?? 0 > 0) {
        current = applyAction(current, { type: 'PassTurn', actorId: 'e1' });
      }
    }

    // Now disruptor is fully recharged
    expect(current.combatants['p1']?.disruptorCooldown).toBe(0);
  });
});
