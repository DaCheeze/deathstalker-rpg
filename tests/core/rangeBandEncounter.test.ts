import { describe, expect, it } from 'vitest';
import { chooseEnemyAction } from '../../src/core/ai';
import { applyAction, getAvailableActions, initBattle } from '../../src/core/battle';
import type { BattleAction, Combatant } from '../../src/core/types';
import { validateAbilities, validateCombatants, validateEncounter } from '../../src/core/validator';
import abilitiesData from '../../src/data/abilities.json';
import rangeBandPrototypeData from '../../src/data/range-band-prototype.json';

function loadAuthoredEncounter() {
  const abilities = validateAbilities(abilitiesData);
  const party = Object.values(validateCombatants(rangeBandPrototypeData.party, 'rangeBandPrototype.party'));
  const enemies = Object.values(validateCombatants(rangeBandPrototypeData.enemies, 'rangeBandPrototype.enemies'));
  const encounter = validateEncounter(
    rangeBandPrototypeData.encounter,
    'rangeBandPrototype.encounter'
  );
  return initBattle(party, enemies, abilities, encounter);
}

function choosePartyAdvance(state: ReturnType<typeof loadAuthoredEncounter>, actor: Combatant): BattleAction {
  if (actor.rangeBand === 'ranged') {
    return { type: 'Advance', actorId: actor.id };
  }
  if (actor.rangeBand === 'engaged') {
    return { type: 'PassTurn', actorId: actor.id };
  }

  const mirroredTargetId = state.enemyIds[state.partyIds.indexOf(actor.id)];
  const targetId = mirroredTargetId && (state.combatants[mirroredTargetId]?.stats.hp ?? 0) > 0
    ? mirroredTargetId
    : state.enemyIds.find((id) => (state.combatants[id]?.stats.hp ?? 0) > 0);
  if (!targetId) return { type: 'PassTurn', actorId: actor.id };
  return { type: 'Advance', actorId: actor.id, targetId };
}

describe('authored range-band encounter opening', () => {
  it('caps the opening at one ready charge per side and reaches distributed melee', () => {
    let state = loadAuthoredEncounter();
    let interruptCount = 0;

    expect(state.partyIds.filter((id) => state.combatants[id]?.disruptorReady)).toEqual([
      'prototype_duelist',
    ]);
    expect(state.enemyIds.filter((id) => state.combatants[id]?.disruptorReady)).toEqual([
      'prototype_opponent_b',
    ]);

    for (let step = 0; step < 30; step++) {
      const allEngaged = [...state.partyIds, ...state.enemyIds].every((id) => (
        (state.combatants[id]?.stats.hp ?? 0) <= 0 || state.combatants[id]?.rangeBand === 'engaged'
      ));
      if (allEngaged) break;

      const actor = state.combatants[state.activeActorId];
      if (!actor) throw new Error(`Missing active actor ${state.activeActorId}`);
      const action = actor.faction === 'party'
        ? choosePartyAdvance(state, actor)
        : chooseEnemyAction(state, actor.id, () => 0.5);
      state = applyAction(state, action, { varianceFactor: 1, isCrit: false });
      interruptCount += state.recentEvents.filter((event) => event.type === 'DISRUPTOR_INTERRUPT').length;
    }

    expect(interruptCount).toBe(2);
    expect(state.partyIds.every((id) => (state.combatants[id]?.stats.hp ?? 0) > 0)).toBe(true);
    expect(state.partyIds.every((id) => state.combatants[id]?.rangeBand === 'engaged')).toBe(true);
    expect(state.enemyIds.every((id) => state.combatants[id]?.rangeBand === 'engaged')).toBe(true);

    const enemyTargets = state.enemyIds.map((id) => state.combatants[id]?.engagedTargetId);
    expect(new Set(enemyTargets).size).toBe(3);
    for (const partyId of state.partyIds) {
      expect(getAvailableActions(state, partyId).some((action) => action.type === 'Attack')).toBe(true);
    }
  });
});
