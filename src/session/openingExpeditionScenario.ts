import { initBattle } from '../core/battle';
import { getDefaultRules } from '../core/configLoader';
import {
  advanceExpeditionJourney,
  currentExpeditionBeat,
  initExpeditionJourney,
} from '../core/expeditionJourney';
import { requireValue } from '../core/invariant';
import { applyIntermissionMedkit, completeRunEncounter } from '../core/run';
import type {
  AbilityDefinition,
  BattleState,
  Combatant,
  EncounterDefinition,
  ExpeditionBeatDefinition,
  ExpeditionJourneyDefinition,
  ExpeditionJourneyState,
  RunInventory,
  RunState,
} from '../core/types';
import {
  validateAbilities,
  validateCombatants,
  validateEncounters,
  validateExpeditionJourney,
} from '../core/validator';
import abilitiesData from '../data/abilities.json';
import openingEncountersData from '../data/opening-expedition-encounters.json';
import openingExpeditionData from '../data/opening-expedition.json';
import rangeBandPrototypeData from '../data/range-band-prototype.json';

export const OPENING_EXPEDITION_ID = 'opening_virimonde_forced_departure';

export interface OpeningExpeditionRuntime {
  definition: ExpeditionJourneyDefinition;
  journey: ExpeditionJourneyState;
  encounters: Record<string, EncounterDefinition>;
  abilities: Record<string, AbilityDefinition>;
  party: Record<string, Combatant>;
  enemies: Record<string, Combatant>;
  inventory: RunInventory;
}

export function createOpeningExpeditionRuntime(): OpeningExpeditionRuntime {
  const definition = validateExpeditionJourney(openingExpeditionData);
  if (definition.id !== OPENING_EXPEDITION_ID) {
    throw new Error(`Opening expedition data must use ID '${OPENING_EXPEDITION_ID}'`);
  }
  const prototypeParty = validateCombatants(
    rangeBandPrototypeData.party,
    'rangeBandPrototype.party'
  );
  const prototypeEnemies = validateCombatants(
    rangeBandPrototypeData.enemies,
    'rangeBandPrototype.enemies'
  );
  const owenSource = requireValue(prototypeParty['prototype_power'], 'Opening Owen source');
  const hazelSource = requireValue(prototypeParty['prototype_duelist'], 'Opening Hazel source');
  const guardASource = requireValue(prototypeEnemies['prototype_opponent_a'], 'Opening guard A source');
  const guardBSource = requireValue(prototypeEnemies['prototype_opponent_b'], 'Opening guard B source');
  const guardCSource = requireValue(prototypeEnemies['prototype_opponent_c'], 'Opening guard C source');
  const rules = getDefaultRules();
  return {
    definition,
    journey: initExpeditionJourney(definition),
    encounters: validateEncounters(openingEncountersData),
    abilities: validateAbilities(abilitiesData),
    party: {
      owen: openingCombatant(owenSource, 'owen', 'Owen', 'Deathstalker', ['vibro_blade']),
      hazel: openingCombatant(
        hazelSource,
        'hazel',
        'Hazel',
        'Clonelegger / Smuggler / Pirate',
        ['vibro_blade', 'particle_carbine']
      ),
    },
    enemies: {
      opening_guard_a: openingCombatant(
        guardASource,
        'opening_guard_a',
        'Imperial Guard',
        'Imperial Guard',
        ['vibro_blade']
      ),
      opening_guard_b: openingCombatant(
        guardBSource,
        'opening_guard_b',
        'Imperial Guard',
        'Imperial Guard',
        ['vibro_blade']
      ),
      opening_guard_c: openingCombatant(
        guardCSource,
        'opening_guard_c',
        'Imperial Guard',
        'Imperial Guard',
        ['vibro_blade']
      ),
    },
    inventory: {
      medkits: rules.inventory.medkits,
      revives: rules.inventory.revives,
    },
  };
}

export function currentOpeningBeat(runtime: OpeningExpeditionRuntime): ExpeditionBeatDefinition {
  return currentExpeditionBeat(runtime.journey, runtime.definition);
}

export function startOpeningBeatCombat(
  runtime: OpeningExpeditionRuntime,
  seed: number
): BattleState {
  const beat = currentOpeningBeat(runtime);
  if (beat.interaction !== 'combat' || beat.encounterId === undefined) {
    throw new Error(`Opening beat '${beat.id}' is not a combat beat`);
  }
  const encounter = requireValue(
    runtime.encounters[beat.encounterId],
    `Opening encounter '${beat.encounterId}'`
  );
  const party = beat.partyIds.map((id) => cloneCombatant(
    requireValue(runtime.party[id], `Opening party member '${id}'`)
  ));
  const enemies = encounter.enemyIds.map((id) => cloneCombatant(
    requireValue(runtime.enemies[id], `Opening enemy '${id}'`)
  ));
  const state = initBattle(party, enemies, runtime.abilities, encounter, runtime.inventory, seed);
  state.directEngagement = true;
  for (let index = 0; index < state.partyIds.length; index += 1) {
    const partyId = requireValue(state.partyIds[index], `Opening party index ${index}`);
    const enemyId = requireValue(
      state.enemyIds[index % state.enemyIds.length],
      `Opening enemy pairing ${index}`
    );
    const partyCombatant = requireValue(state.combatants[partyId], `Opening party '${partyId}'`);
    partyCombatant.rangeBand = 'engaged';
    partyCombatant.engagedTargetId = enemyId;
  }
  for (let index = 0; index < state.enemyIds.length; index += 1) {
    const enemyId = requireValue(state.enemyIds[index], `Opening enemy index ${index}`);
    const partyId = requireValue(
      state.partyIds[index % state.partyIds.length],
      `Opening party pairing ${index}`
    );
    const enemyCombatant = requireValue(state.combatants[enemyId], `Opening enemy '${enemyId}'`);
    enemyCombatant.rangeBand = 'engaged';
    enemyCombatant.engagedTargetId = partyId;
  }
  return state;
}

export function completeOpeningBeatCombat(
  runtime: OpeningExpeditionRuntime,
  battle: BattleState
): OpeningExpeditionRuntime {
  const beat = currentOpeningBeat(runtime);
  if (beat.interaction !== 'combat' || beat.encounterId === undefined) {
    throw new Error(`Opening beat '${beat.id}' is not awaiting combat completion`);
  }
  const encounter = requireValue(runtime.encounters[beat.encounterId], `Opening encounter '${beat.encounterId}'`);
  const run: RunState = {
    runId: `${runtime.definition.id}-${beat.id}`,
    seed: runtime.journey.currentBeatIndex,
    partyLevel: 1,
    expeditionId: runtime.definition.id,
    encounterSequence: [encounter],
    currentEncounterIndex: 0,
    party: Object.fromEntries(beat.partyIds.map((id) => [
      id,
      cloneCombatant(requireValue(runtime.party[id], `Opening party member '${id}'`)),
    ])),
    partyIds: [...beat.partyIds],
    inventory: { ...runtime.inventory },
    status: 'in_progress',
    history: [],
  };
  const completedRun = completeRunEncounter(run, battle);
  const nextJourney = advanceExpeditionJourney(runtime.journey, runtime.definition, {
    type: 'combat_completed',
    outcome: battle.status === 'victory' ? 'victory' : 'defeat',
  });
  return applyCurrentBeatEntryHpCaps({
    ...runtime,
    journey: nextJourney,
    party: {
      ...runtime.party,
      ...completedRun.party,
    },
    inventory: { ...completedRun.inventory },
  });
}

export function continueOpeningBeat(runtime: OpeningExpeditionRuntime): OpeningExpeditionRuntime {
  return applyCurrentBeatEntryHpCaps({
    ...runtime,
    journey: advanceExpeditionJourney(runtime.journey, runtime.definition, { type: 'continue' }),
  });
}

export function chooseOpeningRecovery(
  runtime: OpeningExpeditionRuntime,
  choice: 'use_medkit' | 'continue'
): OpeningExpeditionRuntime {
  const beat = currentOpeningBeat(runtime);
  if (beat.interaction !== 'recovery_choice') {
    throw new Error(`Opening beat '${beat.id}' is not awaiting a recovery choice`);
  }
  let party = runtime.party;
  let inventory = runtime.inventory;
  if (choice === 'use_medkit' && inventory.medkits > 0) {
    const targetId = mostInjuredLivingPartyId(party, beat.partyIds);
    if (targetId !== null) {
      const recoveryRun: RunState = {
        runId: `${runtime.definition.id}-recovery`,
        seed: runtime.journey.currentBeatIndex,
        partyLevel: 1,
        expeditionId: runtime.definition.id,
        encounterSequence: [],
        currentEncounterIndex: 0,
        party,
        partyIds: [...beat.partyIds],
        inventory,
        status: 'in_progress',
        history: [],
      };
      const recovered = applyIntermissionMedkit(recoveryRun, targetId);
      party = recovered.party;
      inventory = recovered.inventory;
    }
  }
  return {
    ...runtime,
    party,
    inventory,
    journey: advanceExpeditionJourney(runtime.journey, runtime.definition, {
      type: 'choose_recovery',
      choice,
    }),
  };
}

function openingCombatant(
  source: Combatant,
  id: string,
  name: string,
  role: string,
  abilityIds: string[]
): Combatant {
  return {
    ...cloneCombatant(source),
    id,
    name,
    displayName: name,
    role,
    abilityIds,
  };
}

function applyCurrentBeatEntryHpCaps(
  runtime: OpeningExpeditionRuntime
): OpeningExpeditionRuntime {
  const beat = currentOpeningBeat(runtime);
  if (beat.entryPartyHpPercentageCaps === undefined) return runtime;
  const party = { ...runtime.party };
  for (const [partyId, percentage] of Object.entries(beat.entryPartyHpPercentageCaps)) {
    const member = requireValue(party[partyId], `Opening entry HP party member '${partyId}'`);
    const hpCap = Math.max(1, Math.floor(member.stats.maxHp * percentage));
    party[partyId] = {
      ...member,
      stats: {
        ...member.stats,
        hp: Math.min(member.stats.hp, hpCap),
      },
    };
  }
  return { ...runtime, party };
}

function cloneCombatant(combatant: Combatant): Combatant {
  return {
    ...combatant,
    stats: { ...combatant.stats },
    abilityIds: [...combatant.abilityIds],
  };
}

function mostInjuredLivingPartyId(
  party: Record<string, Combatant>,
  partyIds: string[]
): string | null {
  return partyIds
    .map((id) => requireValue(party[id], `Opening party member '${id}'`))
    .filter((member) => member.stats.hp > 0 && member.stats.hp < member.stats.maxHp)
    .sort((left, right) => {
      const leftRatio = left.stats.hp / left.stats.maxHp;
      const rightRatio = right.stats.hp / right.stats.maxHp;
      return leftRatio - rightRatio || left.id.localeCompare(right.id);
    })[0]?.id ?? null;
}
