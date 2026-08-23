import { applyAction, getAvailableActions, initBattle } from '../core/battle';
import { createRng } from '../core/random';
import type { BattleAction, BattleState, Combatant, EncounterDefinition } from '../core/types';
import { validateAbilities, validateCombatants, validateEncounter } from '../core/validator';
import abilitiesData from '../data/abilities.json';
import rangeBandPrototypeData from '../data/range-band-prototype.json';
import {
  createPresentationBridgeDocument,
  type PresentationBridgeDocumentV1,
} from './presentationBridge';

export const RANGE_BAND_PRESENTATION_FIXTURE_ID = 'phase-1-range-band-held-interrupt';
export const RANGE_BAND_PRESENTATION_FIXTURE_SEED = 230823;
export const RANGE_BAND_PRESENTATION_MAX_ACTIONS = 160;

function loadValidatedRangeBandEncounter(): {
  encounter: EncounterDefinition;
  initialState: BattleState;
} {
  const abilities = validateAbilities(abilitiesData);
  const party = Object.values(
    validateCombatants(rangeBandPrototypeData.party, 'rangeBandPrototype.party')
  );
  const enemies = Object.values(
    validateCombatants(rangeBandPrototypeData.enemies, 'rangeBandPrototype.enemies')
  );
  const encounter = validateEncounter(
    rangeBandPrototypeData.encounter,
    'rangeBandPrototype.encounter'
  );
  return {
    encounter,
    initialState: initBattle(party, enemies, abilities, encounter),
  };
}

function mirroredTargetId(state: BattleState, actor: Combatant): string | undefined {
  const actorIds = actor.faction === 'party' ? state.partyIds : state.enemyIds;
  const targetIds = actor.faction === 'party' ? state.enemyIds : state.partyIds;
  const mirrored = targetIds[actorIds.indexOf(actor.id)];
  return mirrored && (state.combatants[mirrored]?.stats.hp ?? 0) > 0 ? mirrored : undefined;
}

function chooseDeterministicPrototypeAction(state: BattleState): BattleAction {
  const actor = state.combatants[state.activeActorId];
  if (!actor || actor.stats.hp <= 0) {
    throw new Error(`Prototype fixture has invalid active actor '${state.activeActorId}'`);
  }

  const legalActions = getAvailableActions(state, actor.id);
  const advances = legalActions.filter(
    (action): action is Extract<BattleAction, { type: 'Advance' }> => action.type === 'Advance'
  );
  if (advances.length > 0) {
    const mirrored = mirroredTargetId(state, actor);
    return advances.find((action) => action.targetId === mirrored) ?? advances[0] as BattleAction;
  }

  const attacks = legalActions
    .filter(
      (action): action is Extract<BattleAction, { type: 'Attack' }> => action.type === 'Attack'
    )
    .sort((left, right) => {
      const powerDifference =
        (state.abilities[right.abilityId]?.powerMultiplier ?? 0) -
        (state.abilities[left.abilityId]?.powerMultiplier ?? 0);
      return powerDifference || left.abilityId.localeCompare(right.abilityId);
    });
  const attack = attacks[0];
  if (attack) return attack;

  const pass = legalActions.find(
    (action): action is Extract<BattleAction, { type: 'PassTurn' }> => action.type === 'PassTurn'
  );
  if (pass) return pass;
  throw new Error(`Prototype fixture found no deterministic legal action for '${actor.id}'`);
}

export function createRangeBandPresentationFixture(): PresentationBridgeDocumentV1 {
  const { encounter, initialState } = loadValidatedRangeBandEncounter();
  const rng = createRng(RANGE_BAND_PRESENTATION_FIXTURE_SEED);
  const states: BattleState[] = [initialState];
  const actions: BattleAction[] = [];
  let state = initialState;

  while (state.status === 'in_progress' && actions.length < RANGE_BAND_PRESENTATION_MAX_ACTIONS) {
    const action = chooseDeterministicPrototypeAction(state);
    state = applyAction(state, action, rng);
    actions.push(action);
    states.push(state);
  }

  if (state.status === 'in_progress') {
    throw new Error(
      `Range-band fixture exceeded the authoritative ${RANGE_BAND_PRESENTATION_MAX_ACTIONS}-action safety cap`
    );
  }

  return createPresentationBridgeDocument({
    fixtureId: RANGE_BAND_PRESENTATION_FIXTURE_ID,
    seed: RANGE_BAND_PRESENTATION_FIXTURE_SEED,
    encounter,
    states,
    actions,
    frameStepSeconds: 0.75,
    endHoldSeconds: 1,
  });
}
