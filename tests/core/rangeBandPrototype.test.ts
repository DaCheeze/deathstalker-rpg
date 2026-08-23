import { describe, expect, it } from 'vitest';
import { applyAction, getAvailableActions, initBattle } from '../../src/core/battle';
import type { AbilityDefinition, BattleState, Combatant, EncounterDefinition } from '../../src/core/types';

const abilities: Record<string, AbilityDefinition> = {
  slash: {
    id: 'slash',
    name: 'Slash',
    category: 'melee',
    audioProfile: 'blade',
    espCost: 0,
    powerMultiplier: 1,
    targetScope: 'single_enemy',
    description: 'Test melee strike.',
  },
  shove: {
    id: 'shove',
    name: 'Shove',
    category: 'melee',
    audioProfile: 'blunt',
    espCost: 0,
    powerMultiplier: 0.5,
    targetScope: 'single_enemy',
    description: 'Test control strike.',
    displaceTicks: 10,
  },
};

function combatant(
  id: string,
  faction: 'party' | 'empire',
  speed: number,
  disruptorReady?: boolean
): Combatant {
  return {
    id,
    name: id.toUpperCase(),
    faction,
    role: 'Prototype Loadout',
    stats: {
      maxHp: 500,
      hp: 500,
      maxEsp: 0,
      esp: 0,
      attack: 20,
      defense: 10,
      speed,
    },
    canBoost: true,
    disruptorCooldown: 0,
    isBoosting: false,
    crashTurns: 0,
    burnout: 0,
    hasForceShield: true,
    stunnedTurns: 0,
    disruptorReady,
    abilityIds: ['slash', 'shove'],
  };
}

function setup(enemyCount = 1) {
  const party = [combatant('p1', 'party', 20)];
  const enemies = Array.from({ length: enemyCount }, (_, index) =>
    combatant(`e${index + 1}`, 'empire', 15 - index)
  );
  const encounter: EncounterDefinition = {
    id: 'prototype',
    name: 'Prototype',
    tier: 'standard',
    description: 'Range-band test.',
    enemyIds: enemies.map((enemy) => enemy.id),
    battleMode: 'range_band_prototype',
  };
  return initBattle(party, enemies, abilities, encounter);
}

describe('three-character range-band prototype rules', () => {
  it('initializes explicit prototype state and excludes legacy actions', () => {
    const state = setup();
    const actor = state.combatants['p1'];
    const actions = getAvailableActions(state, 'p1');

    expect(state.battleMode).toBe('range_band_prototype');
    expect(actor?.rangeBand).toBe('ranged');
    expect(actor?.disruptorReady).toBe(true);
    expect(actor?.canBoost).toBe(false);
    expect(actor?.hasForceShield).toBe(false);
    expect(actions).toContainEqual({ type: 'Advance', actorId: 'p1' });
    expect(actions.some((action) => action.type === 'Attack')).toBe(false);
    expect(actions.some((action) => action.type === 'RaiseShield')).toBe(false);
    expect(actions.some((action) => action.type === 'ToggleBoost')).toBe(false);
    expect(actions.some((action) => action.type === 'EsperAbility')).toBe(false);
  });

  it('spends a normally fired disruptor permanently for the encounter', () => {
    let state = setup();
    state = applyAction(
      state,
      { type: 'Disruptor', actorId: 'p1', targetId: 'e1' },
      { varianceFactor: 1, isCrit: false }
    );

    expect(state.combatants['p1']?.disruptorReady).toBe(false);
    expect(getAvailableActions(state, 'p1').some((action) => action.type === 'Disruptor')).toBe(false);

    for (let index = 0; index < 8; index++) {
      state = applyAction(state, { type: 'PassTurn', actorId: 'p1' });
    }
    expect(state.combatants['p1']?.disruptorReady).toBe(false);
  });

  it('preserves explicitly spent starting charges instead of rearming every combatant', () => {
    const party = [combatant('p1', 'party', 20, false), combatant('p2', 'party', 18, true)];
    const enemies = [combatant('e1', 'empire', 16, false), combatant('e2', 'empire', 15, true)];
    const encounter: EncounterDefinition = {
      id: 'prototype-limited-opening',
      name: 'Prototype Limited Opening',
      tier: 'standard',
      description: 'Range-band opening-pressure test.',
      enemyIds: enemies.map((enemy) => enemy.id),
      battleMode: 'range_band_prototype',
    };

    const state = initBattle(party, enemies, abilities, encounter);

    expect(state.partyIds.filter((id) => state.combatants[id]?.disruptorReady)).toEqual(['p2']);
    expect(state.enemyIds.filter((id) => state.combatants[id]?.disruptorReady)).toEqual(['e2']);
    expect(getAvailableActions(state, 'p1').some((action) => action.type === 'Disruptor')).toBe(false);
    expect(getAvailableActions(state, 'p2').some((action) => action.type === 'Disruptor')).toBe(true);
  });

  it('uses the encounter-specific disruptor strength without changing legacy damage', () => {
    let state: BattleState = { ...setup(), disruptorPowerMultiplier: 1.6 };
    state = applyAction(
      state,
      { type: 'Disruptor', actorId: 'p1', targetId: 'e1' },
      { varianceFactor: 1, isCrit: false }
    );

    expect(state.combatants['e1']?.stats.hp).toBe(473);
  });

  it('uses projected queue order to resolve one held interrupt before movement', () => {
    let state = setup(2);
    state = {
      ...state,
      turnQueue: {
        ...state.turnQueue,
        entries: [
          { queueId: 'e2-first', actorId: 'e2', predictedTick: 1 },
          { queueId: 'e1-second', actorId: 'e1', predictedTick: 2 },
          ...state.turnQueue.entries,
        ],
      },
    };

    state = applyAction(
      state,
      { type: 'Advance', actorId: 'p1' },
      { varianceFactor: 1, isCrit: false }
    );

    expect(state.combatants['e2']?.disruptorReady).toBe(false);
    expect(state.combatants['e1']?.disruptorReady).toBe(true);
    expect(state.combatants['p1']?.rangeBand).toBe('closing');
    expect(state.recentEvents).toContainEqual({
      type: 'DISRUPTOR_INTERRUPT',
      actorId: 'e2',
      targetId: 'p1',
    });
  });

  it('requires targeted engagement before melee and bans Engaged disruptor use', () => {
    let state = setup();
    const enemy = state.combatants['e1'];
    if (!enemy) throw new Error('Missing test enemy');
    state = {
      ...state,
      combatants: {
        ...state.combatants,
        e1: { ...enemy, disruptorReady: false },
      },
    };

    state = applyAction(state, { type: 'Advance', actorId: 'p1' });
    expect(state.combatants['p1']?.rangeBand).toBe('closing');
    expect(getAvailableActions(state, 'p1')).toContainEqual({
      type: 'Advance',
      actorId: 'p1',
      targetId: 'e1',
    });

    state = applyAction(state, { type: 'Advance', actorId: 'p1', targetId: 'e1' });
    expect(state.combatants['p1']?.rangeBand).toBe('engaged');
    expect(state.combatants['p1']?.engagedTargetId).toBe('e1');
    expect(getAvailableActions(state, 'p1')).toContainEqual({
      type: 'Attack',
      actorId: 'p1',
      targetId: 'e1',
      abilityId: 'slash',
    });
    expect(getAvailableActions(state, 'p1').some((action) => action.type === 'Disruptor')).toBe(false);
    expect(() =>
      applyAction(state, { type: 'Disruptor', actorId: 'p1', targetId: 'e1' })
    ).toThrow('Illegal prototype disruptor action');
  });
});
