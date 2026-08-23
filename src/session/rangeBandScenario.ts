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

