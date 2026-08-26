import { initBattle } from '../core/battle';
import type { BattleState, EncounterDefinition } from '../core/types';
import { validateAbilities, validateCombatants, validateEncounter } from '../core/validator';
import abilitiesData from '../data/abilities.json';
import rangeBandPrototypeData from '../data/range-band-prototype.json';

export interface RangeBandSessionScenario {
  encounter: EncounterDefinition;
  initialState: BattleState;
}

/** Creates a fresh validated authoritative state for the bounded prototype. */
export function createRangeBandSessionScenario(): RangeBandSessionScenario {
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

/** Creates the live JRPG slice with immediate melee access and no movement turns. */
export function createDirectEngagementSessionScenario(): RangeBandSessionScenario {
  const scenario = createRangeBandSessionScenario();
  const state = scenario.initialState;
  scenario.encounter = {
    ...scenario.encounter,
    name: 'Combat Prototype',
    description: 'A neutral one-encounter test of immediate attack rhythm.',
  };
  state.directEngagement = true;

  for (let index = 0; index < state.partyIds.length; index += 1) {
    const partyId = state.partyIds[index];
    const enemyId = state.enemyIds[index];
    if (!partyId || !enemyId) {
      throw new Error('Direct engagement requires mirrored party and enemy combatants');
    }
    const partyCombatant = state.combatants[partyId];
    const enemyCombatant = state.combatants[enemyId];
    if (!partyCombatant || !enemyCombatant) {
      throw new Error(`Direct engagement could not pair '${partyId}' with '${enemyId}'`);
    }
    partyCombatant.rangeBand = 'engaged';
    partyCombatant.engagedTargetId = enemyId;
    enemyCombatant.rangeBand = 'engaged';
    enemyCombatant.engagedTargetId = partyId;
  }

  return scenario;
}
