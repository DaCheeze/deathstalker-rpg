import { initBattle } from '../core/battle';
import { getDefaultRules } from '../core/configLoader';
import { createCampaign, prepareExpeditionParty } from '../core/progression';
import { requireValue } from '../core/invariant';
import {
  buyWorldLoopConsumable,
  completeWorldLoopEncounter,
  initWorldLoop,
  openWorldLoopChest,
  restWorldLoopParty,
  travelWorldLoop,
  validateWorldLoopDefinition,
  worldLoopEncounterNode,
  resolveWorldLoopEncounterTrigger,
} from '../core/worldLoop';
import type {
  AbilityDefinition,
  BattleState,
  Combatant,
  EncounterDefinition,
  EquipmentItem,
  ExpeditionFieldContactAdvantage,
  ExpeditionFieldContactTrigger,
  WorldLoopDefinition,
  WorldLoopPoint,
  WorldLoopState,
} from '../core/types';
import {
  validateAbilities,
  validateCombatants,
  validateEncounters,
} from '../core/validator';
import abilitiesData from '../data/abilities.json';
import rangeBandPrototypeData from '../data/range-band-prototype.json';
import worldLoopData from '../data/world-loop-proving.json';
import worldLoopEncountersData from '../data/world-loop-proving-encounters.json';

export const WORLD_LOOP_SCENARIO_ID = 'world_loop_proving_fixture';

export interface WorldLoopRuntime {
  definition: WorldLoopDefinition;
  state: WorldLoopState;
  encounters: Record<string, EncounterDefinition>;
  abilities: Record<string, AbilityDefinition>;
  partyDefinitions: Combatant[];
  enemies: Record<string, Combatant>;
  equipment: Record<string, EquipmentItem>;
}

export function createWorldLoopRuntime(
  scenarioId: string = WORLD_LOOP_SCENARIO_ID
): WorldLoopRuntime {
  if (scenarioId !== WORLD_LOOP_SCENARIO_ID) {
    throw new Error(`Unknown world-loop scenario '${scenarioId}'`);
  }
  const definition = validateWorldLoopDefinition(worldLoopData);
  if (definition.id !== WORLD_LOOP_SCENARIO_ID) {
    throw new Error(`World-loop data must use ID '${WORLD_LOOP_SCENARIO_ID}'`);
  }
  const partyRecord = validateCombatants(
    rangeBandPrototypeData.party,
    'rangeBandPrototype.party'
  );
  const enemies = validateCombatants(
    rangeBandPrototypeData.enemies,
    'rangeBandPrototype.enemies'
  );
  const partyDefinitions = Object.values(partyRecord);
  const rules = getDefaultRules();
  const campaign = createCampaign(partyDefinitions, rules, 'world-loop-proving-campaign');
  const equipment: Record<string, EquipmentItem> = {};
  return {
    definition,
    state: initWorldLoop(definition, campaign, partyDefinitions, equipment, rules),
    encounters: validateEncounters(worldLoopEncountersData),
    abilities: validateAbilities(abilitiesData),
    partyDefinitions,
    enemies,
    equipment,
  };
}

export function travelWorldLoopRuntime(
  runtime: WorldLoopRuntime,
  destinationId: string
): WorldLoopRuntime {
  return {
    ...runtime,
    state: travelWorldLoop(runtime.state, runtime.definition, destinationId),
  };
}

export function openWorldLoopRuntimeChest(
  runtime: WorldLoopRuntime,
  chestId: string
): WorldLoopRuntime {
  return {
    ...runtime,
    state: openWorldLoopChest(runtime.state, runtime.definition, chestId),
  };
}

export function restWorldLoopRuntime(runtime: WorldLoopRuntime): WorldLoopRuntime {
  return {
    ...runtime,
    state: restWorldLoopParty(
      runtime.state,
      runtime.definition,
      runtime.partyDefinitions,
      runtime.equipment
    ),
  };
}

export function buyWorldLoopRuntimeConsumable(
  runtime: WorldLoopRuntime,
  item: 'medkit' | 'revive'
): WorldLoopRuntime {
  return {
    ...runtime,
    state: buyWorldLoopConsumable(runtime.state, runtime.definition, item),
  };
}

export function startWorldLoopBattle(
  runtime: WorldLoopRuntime,
  nodeId: string,
  trigger: ExpeditionFieldContactTrigger,
  playerPosition: WorldLoopPoint,
  seed: number
): {
  nodeId: string;
  encounter: EncounterDefinition;
  battle: BattleState;
  advantage: ExpeditionFieldContactAdvantage;
} {
  const node = worldLoopEncounterNode(runtime.state, runtime.definition, nodeId);
  const advantage = resolveWorldLoopEncounterTrigger(
    runtime.state,
    runtime.definition,
    nodeId,
    playerPosition,
    trigger
  );
  const encounter = requireValue(
    runtime.encounters[node.encounterId],
    `World-loop encounter '${node.encounterId}'`
  );
  const party = runtime.state.partyIds.map((id) => cloneCombatant(
    requireValue(runtime.state.party[id], `World-loop party member '${id}'`)
  ));
  const enemies = encounter.enemyIds.map((id) => cloneCombatant(
    requireValue(runtime.enemies[id], `World-loop enemy '${id}'`)
  ));
  const battle = initBattle(
    party,
    enemies,
    runtime.abilities,
    encounter,
    runtime.state.campaign.reserveInventory,
    seed,
    advantage === 'player' ? 'party' : advantage
  );
  battle.directEngagement = true;
  for (let index = 0; index < battle.partyIds.length; index += 1) {
    const partyId = requireValue(battle.partyIds[index], `World-loop party index ${index}`);
    const enemyId = requireValue(
      battle.enemyIds[index % battle.enemyIds.length],
      `World-loop enemy pairing ${index}`
    );
    const member = requireValue(battle.combatants[partyId], `World-loop party '${partyId}'`);
    member.rangeBand = 'engaged';
    member.engagedTargetId = enemyId;
  }
  for (let index = 0; index < battle.enemyIds.length; index += 1) {
    const enemyId = requireValue(battle.enemyIds[index], `World-loop enemy index ${index}`);
    const partyId = requireValue(
      battle.partyIds[index % battle.partyIds.length],
      `World-loop party pairing ${index}`
    );
    const enemy = requireValue(battle.combatants[enemyId], `World-loop enemy '${enemyId}'`);
    enemy.rangeBand = 'engaged';
    enemy.engagedTargetId = partyId;
  }
  return { nodeId, encounter, battle, advantage };
}

export function completeWorldLoopRuntimeBattle(
  runtime: WorldLoopRuntime,
  nodeId: string,
  encounter: EncounterDefinition,
  battle: BattleState
): WorldLoopRuntime {
  const previousLevel = runtime.state.campaign.partyLevel;
  let state = completeWorldLoopEncounter(
    runtime.state,
    runtime.definition,
    nodeId,
    encounter,
    battle
  );
  if (state.campaign.partyLevel > previousLevel) {
    const leveledParty = prepareExpeditionParty(
      state.campaign,
      runtime.partyDefinitions,
      runtime.equipment
    );
    for (const partyId of state.partyIds) {
      const before = requireValue(state.party[partyId], `World-loop party '${partyId}'`);
      const after = requireValue(leveledParty[partyId], `Leveled world-loop party '${partyId}'`);
      const hpIncrease = after.stats.maxHp - before.stats.maxHp;
      const espIncrease = after.stats.maxEsp - before.stats.maxEsp;
      after.stats.hp = before.stats.hp > 0
        ? Math.min(after.stats.maxHp, before.stats.hp + Math.max(0, hpIncrease))
        : 0;
      after.stats.esp = Math.min(
        after.stats.maxEsp,
        before.stats.esp + Math.max(0, espIncrease)
      );
    }
    state = { ...state, party: leveledParty };
  }
  return { ...runtime, state };
}

function cloneCombatant(combatant: Combatant): Combatant {
  return {
    ...combatant,
    stats: { ...combatant.stats },
    abilityIds: [...combatant.abilityIds],
  };
}
