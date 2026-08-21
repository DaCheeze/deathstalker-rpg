import { describe, it, expect } from 'vitest';
import { applyAction, initBattle } from '../../src/core/battle';
import { Combatant, EncounterDefinition, AbilityDefinition } from '../../src/core/types';

function createDuelSetup() {
  const p1: Combatant = {
    id: 'p1',
    name: 'Hero',
    faction: 'party',
    role: 'Captain',
    stats: { maxHp: 50, hp: 50, maxEsp: 0, esp: 0, attack: 100, defense: 0, speed: 20 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['strike'],
  };

  const e1: Combatant = {
    id: 'e1',
    name: 'Enemy',
    faction: 'empire',
    role: 'Guard',
    stats: { maxHp: 50, hp: 50, maxEsp: 0, esp: 0, attack: 100, defense: 0, speed: 10 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['strike'],
  };

  const abilities: Record<string, AbilityDefinition> = {
    strike: {
      id: 'strike',
      name: 'Strike',
      category: 'melee',
      espCost: 0,
      powerMultiplier: 1.0,
      targetScope: 'single_enemy',
      description: 'strike',
    },
  };

  const encounter: EncounterDefinition = {
    id: 'duel',
    name: 'Duel',
    tier: 'standard',
    description: 'test',
    enemyIds: ['e1'],
  };

  const state = initBattle([p1], [e1], abilities, encounter);
  return { state };
}

describe('Battle Resolution (Win / Defeat)', () => {
  it('resolves victory when all enemies reach 0 HP', () => {
    const { state } = createDuelSetup();
    expect(state.status).toBe('in_progress');

    // Hero strikes Enemy for lethal damage
    const victoryState = applyAction(
      state,
      { type: 'Attack', actorId: 'p1', targetId: 'e1', abilityId: 'strike' },
      { varianceFactor: 1.0, isCrit: false }
    );

    expect(victoryState.combatants['e1']?.stats.hp).toBe(0);
    expect(victoryState.status).toBe('victory');
  });

  it('resolves defeat when all party members reach 0 HP', () => {
    const { state } = createDuelSetup();

    // Hero passes turn, Enemy strikes Hero for lethal damage
    let current = applyAction(state, { type: 'PassTurn', actorId: 'p1' });
    current = applyAction(
      current,
      { type: 'Attack', actorId: 'e1', targetId: 'p1', abilityId: 'strike' },
      { varianceFactor: 1.0, isCrit: false }
    );

    expect(current.combatants['p1']?.stats.hp).toBe(0);
    expect(current.status).toBe('defeat');
  });
});
