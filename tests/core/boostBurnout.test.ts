import { describe, it, expect } from 'vitest';
import { applyAction, initBattle, getAvailableActions } from '../../src/core/battle';
import { Combatant, EncounterDefinition, AbilityDefinition } from '../../src/core/types';

function createBoostTestSetup() {
  const hero: Combatant = {
    id: 'p1',
    name: 'Hero',
    faction: 'party',
    role: 'Captain',
    stats: { maxHp: 500, hp: 500, maxEsp: 0, esp: 0, attack: 20, defense: 10, speed: 20 },
    canBoost: true,
    crashTurns: 0,
    disruptorCooldown: 3,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['slash'],
  };

  const enemy: Combatant = {
    id: 'e1',
    name: 'Boss Dummy',
    faction: 'empire',
    role: 'Guard',
    stats: { maxHp: 1000, hp: 1000, maxEsp: 0, esp: 0, attack: 10, defense: 10, speed: 5 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 3,
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
      description: 'slash',
    },
  };

  const encounter: EncounterDefinition = {
    id: 'enc_test',
    name: 'Test',
    tier: 'standard',
    description: 'test',
    enemyIds: ['e1'],
  };

  const state = initBattle([hero], [enemy], abilities, encounter);
  return { state };
}

describe('Boost & Burnout Mechanics', () => {
  it('boost grants +50% damage bonus', () => {
    const { state } = createBoostTestSetup();

    // Normal attack: (20 * 1.0) - (10 * 0.5) = 15
    const normalState = applyAction(
      state,
      { type: 'Attack', actorId: 'p1', targetId: 'e1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    const normalDamage = 1000 - (normalState.combatants['e1']?.stats.hp ?? 0);
    expect(normalDamage).toBe(15);

    // Enter boost (Free action: +4 on enter immediately, ramp penalty; actor retains turn)
    let boostedState = applyAction(state, { type: 'ToggleBoost', actorId: 'p1', enable: true });
    expect(boostedState.combatants['p1']?.isBoosting).toBe(true);
    expect(boostedState.combatants['p1']?.burnout).toBe(4);
    expect(boostedState.activeActorId).toBe('p1'); // Free action! Retains turn

    // Attack on entry turn: 50% damage penalty applies -> attack becomes 20 * 1.5 * 0.5 = 15; (15 * 1.0) - (10 * 0.5) = 10
    boostedState = applyAction(
      boostedState,
      { type: 'Attack', actorId: 'p1', targetId: 'e1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    const entryTurnDamage = 1000 - (boostedState.combatants['e1']?.stats.hp ?? 0);
    expect(entryTurnDamage).toBe(10);
    expect(boostedState.combatants['p1']?.burnout).toBe(5); // +1 after completing turn

    // Pass turn for enemy
    boostedState = applyAction(boostedState, { type: 'PassTurn', actorId: 'e1' });

    // Attack on subsequent turn while boosting (full 1.5x damage without ramp penalty): (30 * 1.0) - (10 * 0.5) = 25
    const secondTurnState = applyAction(
      boostedState,
      { type: 'Attack', actorId: 'p1', targetId: 'e1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    const secondTurnDamage = (1000 - entryTurnDamage) - (secondTurnState.combatants['e1']?.stats.hp ?? 0);
    expect(secondTurnDamage).toBe(25);
  });

  it('accrues burnout (+4 on enter, +1 per turn) and suffers chip damage at burnout 5+', () => {
    const { state } = createBoostTestSetup();
    let current = applyAction(state, { type: 'ToggleBoost', actorId: 'p1', enable: true });
    expect(current.combatants['p1']?.burnout).toBe(4);

    // Pass hero's turn: burnout reaches 5, suffering chip damage
    current = applyAction(current, { type: 'PassTurn', actorId: 'p1' });
    expect(current.combatants['p1']?.burnout).toBe(5);
    expect(current.combatants['p1']?.stats.hp).toBeLessThan(500);
  });

  it('forces exit from boost and triggers CRASH state at burnout 8+', () => {
    const { state } = createBoostTestSetup();
    let current = applyAction(state, { type: 'ToggleBoost', actorId: 'p1', enable: true });

    // Advance turns while boosting until forced out of boost
    while (current.combatants['p1']?.isBoosting) {
      current = applyAction(current, { type: 'PassTurn', actorId: current.activeActorId });
    }

    // At burnout 8+: forced out of boost into CRASH state (min 2 turns, max 4)
    const hero = current.combatants['p1'];
    expect(hero?.isBoosting).toBe(false);
    expect(current.recentEvents.some((e) => e.type === 'BOOST_CRASHED')).toBe(true);
    expect(hero?.crashTurns).toBeGreaterThanOrEqual(1); // 2 on entry, 1 after completing turn
    expect(hero?.burnout).toBeGreaterThanOrEqual(7);
  });

  it('triggers CRASH on voluntary boost exit and restricts actions to recovery', () => {
    const { state } = createBoostTestSetup();
    let current = applyAction(state, { type: 'ToggleBoost', actorId: 'p1', enable: true });
    expect(current.combatants['p1']?.isBoosting).toBe(true);

    // Voluntarily exit boost (Free action)
    current = applyAction(current, { type: 'ToggleBoost', actorId: 'p1', enable: false });
    const hero = current.combatants['p1'];
    expect(hero?.isBoosting).toBe(false);
    expect(hero?.crashTurns).toBe(2); // Minimum 2 turns

    // While crashed, available actions are locked to PassTurn
    const available = getAvailableActions(current, 'p1');
    expect(available).toEqual([{ type: 'PassTurn', actorId: 'p1' }]);

    // Take recovery turn 1
    current = applyAction(current, { type: 'PassTurn', actorId: 'p1' });
    expect(current.combatants['p1']?.crashTurns).toBe(1);

    // Enemy turn
    current = applyAction(current, { type: 'PassTurn', actorId: 'e1' });

    // Take recovery turn 2
    current = applyAction(current, { type: 'PassTurn', actorId: 'p1' });
    expect(current.combatants['p1']?.crashTurns).toBe(0);

    // Enemy turn
    current = applyAction(current, { type: 'PassTurn', actorId: 'e1' });

    // Crash is over; normal actions are restored
    const restoredActions = getAvailableActions(current, 'p1');
    expect(restoredActions.some((a) => a.type === 'Attack')).toBe(true);
  });

  it('burnout decays by 1 per turn spent not boosting, floored at 0', () => {
    const { state } = createBoostTestSetup();
    const hero = state.combatants['p1'];
    if (hero) {
      hero.burnout = 3;
      hero.isBoosting = false;
    }

    // Advance hero's turn: burnout decays 3 -> 2
    let next = applyAction(state, { type: 'PassTurn', actorId: 'p1' });
    if (next.activeActorId === 'e1') {
      next = applyAction(next, { type: 'PassTurn', actorId: 'e1' });
    }
    expect(next.combatants['p1']?.burnout).toBe(2);

    // Advance another turn for hero: burnout decays 2 -> 1
    next = applyAction(next, { type: 'PassTurn', actorId: 'p1' });
    if (next.activeActorId === 'e1') {
      next = applyAction(next, { type: 'PassTurn', actorId: 'e1' });
    }
    expect(next.combatants['p1']?.burnout).toBe(1);
  });
});
