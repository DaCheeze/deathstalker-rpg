import { getDefaultRules, type GameRules } from './configLoader';
import { requireValue } from './invariant';
import {
  awardEncounterRewards,
  buyConsumable,
  prepareExpeditionParty,
} from './progression';
import type {
  BattleState,
  CampaignState,
  Combatant,
  EncounterDefinition,
  EquipmentItem,
  PartyMemberDefinition,
  WorldLoopChestDefinition,
  WorldLoopDefinition,
  WorldLoopEncounterNodeDefinition,
  WorldLoopLocationDefinition,
  WorldLoopState,
} from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonemptyString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string`);
  }
  return value;
}

function nonnegativeInteger(value: unknown, path: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`${path} must be a nonnegative safe integer`);
  }
  return value as number;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
  return value.map((item, index) => nonemptyString(item, `${path}[${index}]`));
}

export function validateWorldLoopDefinition(value: unknown): WorldLoopDefinition {
  if (!isRecord(value)) throw new Error('worldLoop must be an object');
  const id = nonemptyString(value.id, 'worldLoop.id');
  const startLocationId = nonemptyString(value.startLocationId, 'worldLoop.startLocationId');
  if (!Array.isArray(value.locations) || value.locations.length === 0) {
    throw new Error('worldLoop.locations must be a non-empty array');
  }
  const locations: WorldLoopLocationDefinition[] = value.locations.map((item, index) => {
    if (!isRecord(item)) throw new Error(`worldLoop.locations[${index}] must be an object`);
    const kind = item.kind;
    if (kind !== 'town' && kind !== 'field' && kind !== 'boss_approach') {
      throw new Error(`worldLoop.locations[${index}].kind is unsupported`);
    }
    if (typeof item.restAvailable !== 'boolean' || typeof item.shopAvailable !== 'boolean') {
      throw new Error(`worldLoop.locations[${index}] availability flags must be Boolean`);
    }
    return {
      id: nonemptyString(item.id, `worldLoop.locations[${index}].id`),
      kind,
      connectedLocationIds: stringArray(
        item.connectedLocationIds,
        `worldLoop.locations[${index}].connectedLocationIds`
      ),
      chestIds: stringArray(item.chestIds, `worldLoop.locations[${index}].chestIds`),
      encounterNodeIds: stringArray(
        item.encounterNodeIds,
        `worldLoop.locations[${index}].encounterNodeIds`
      ),
      restAvailable: item.restAvailable,
      shopAvailable: item.shopAvailable,
    };
  });
  const locationIds = new Set(locations.map((location) => location.id));
  if (locationIds.size !== locations.length || !locationIds.has(startLocationId)) {
    throw new Error('worldLoop location IDs must be unique and include startLocationId');
  }

  if (!Array.isArray(value.chests) || !Array.isArray(value.encounterNodes)) {
    throw new Error('worldLoop chests and encounterNodes must be arrays');
  }
  const chests: WorldLoopChestDefinition[] = value.chests.map((item, index) => {
    if (!isRecord(item) || !isRecord(item.reward)) {
      throw new Error(`worldLoop.chests[${index}] must include a reward object`);
    }
    const locationId = nonemptyString(item.locationId, `worldLoop.chests[${index}].locationId`);
    if (!locationIds.has(locationId)) {
      throw new Error(`worldLoop.chests[${index}] references unknown location '${locationId}'`);
    }
    return {
      id: nonemptyString(item.id, `worldLoop.chests[${index}].id`),
      locationId,
      reward: {
        gold: nonnegativeInteger(item.reward.gold, `worldLoop.chests[${index}].reward.gold`),
        medkits: nonnegativeInteger(
          item.reward.medkits,
          `worldLoop.chests[${index}].reward.medkits`
        ),
        revives: nonnegativeInteger(
          item.reward.revives,
          `worldLoop.chests[${index}].reward.revives`
        ),
      },
    };
  });
  const encounterNodes: WorldLoopEncounterNodeDefinition[] = value.encounterNodes.map(
    (item, index) => {
      if (!isRecord(item)) {
        throw new Error(`worldLoop.encounterNodes[${index}] must be an object`);
      }
      const locationId = nonemptyString(
        item.locationId,
        `worldLoop.encounterNodes[${index}].locationId`
      );
      if (!locationIds.has(locationId)) {
        throw new Error(
          `worldLoop.encounterNodes[${index}] references unknown location '${locationId}'`
        );
      }
      if (typeof item.repeatable !== 'boolean' || typeof item.boss !== 'boolean') {
        throw new Error(`worldLoop.encounterNodes[${index}] flags must be Boolean`);
      }
      return {
        id: nonemptyString(item.id, `worldLoop.encounterNodes[${index}].id`),
        locationId,
        encounterId: nonemptyString(
          item.encounterId,
          `worldLoop.encounterNodes[${index}].encounterId`
        ),
        repeatable: item.repeatable,
        boss: item.boss,
      };
    }
  );
  const chestIds = new Set(chests.map((chest) => chest.id));
  const encounterNodeIds = new Set(encounterNodes.map((node) => node.id));
  if (chestIds.size !== chests.length || encounterNodeIds.size !== encounterNodes.length) {
    throw new Error('worldLoop chest and encounter-node IDs must be unique');
  }
  for (const location of locations) {
    for (const connectedId of location.connectedLocationIds) {
      if (!locationIds.has(connectedId)) {
        throw new Error(`Location '${location.id}' connects to unknown '${connectedId}'`);
      }
    }
    for (const chestId of location.chestIds) {
      const chest = chests.find((candidate) => candidate.id === chestId);
      if (chest?.locationId !== location.id) {
        throw new Error(`Location '${location.id}' has invalid chest '${chestId}'`);
      }
    }
    for (const nodeId of location.encounterNodeIds) {
      const node = encounterNodes.find((candidate) => candidate.id === nodeId);
      if (node?.locationId !== location.id) {
        throw new Error(`Location '${location.id}' has invalid encounter node '${nodeId}'`);
      }
    }
  }
  return { id, startLocationId, locations, chests, encounterNodes };
}

export function worldLoopLocation(
  definition: WorldLoopDefinition,
  locationId: string
): WorldLoopLocationDefinition {
  return requireValue(
    definition.locations.find((location) => location.id === locationId),
    `World-loop location '${locationId}'`
  );
}

export function initWorldLoop(
  definition: WorldLoopDefinition,
  campaign: CampaignState,
  partyDefs: Array<PartyMemberDefinition | Combatant>,
  equipmentDefs: Record<string, EquipmentItem>,
  rules?: GameRules
): WorldLoopState {
  return {
    loopId: definition.id,
    currentLocationId: definition.startLocationId,
    campaign: {
      ...campaign,
      reserveInventory: { ...campaign.reserveInventory },
      ownedEquipment: [...campaign.ownedEquipment],
      equipped: Object.fromEntries(
        Object.entries(campaign.equipped).map(([id, equipment]) => [id, { ...equipment }])
      ),
      completedExpeditions: [...campaign.completedExpeditions],
    },
    party: prepareExpeditionParty(campaign, partyDefs, equipmentDefs, rules),
    partyIds: partyDefs.map((member) => member.id),
    openedChestIds: [],
    clearedEncounterNodeIds: [],
    encounterVictoryCounts: {},
    restCount: 0,
    bossDefeated: false,
    status: 'in_progress',
  };
}

export function travelWorldLoop(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  destinationId: string
): WorldLoopState {
  const current = worldLoopLocation(definition, state.currentLocationId);
  if (!current.connectedLocationIds.includes(destinationId)) {
    throw new Error(`Location '${destinationId}' is not connected to '${current.id}'`);
  }
  const destination = worldLoopLocation(definition, destinationId);
  const repeatableAtDestination = new Set(
    definition.encounterNodes
      .filter((node) => node.locationId === destination.id && node.repeatable)
      .map((node) => node.id)
  );
  return {
    ...state,
    currentLocationId: destination.id,
    clearedEncounterNodeIds: state.clearedEncounterNodeIds.filter(
      (nodeId) => !repeatableAtDestination.has(nodeId)
    ),
  };
}

export function openWorldLoopChest(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  chestId: string
): WorldLoopState {
  const chest = requireValue(
    definition.chests.find((candidate) => candidate.id === chestId),
    `World-loop chest '${chestId}'`
  );
  if (chest.locationId !== state.currentLocationId) {
    throw new Error(`Chest '${chestId}' is not in '${state.currentLocationId}'`);
  }
  if (state.openedChestIds.includes(chestId)) {
    throw new Error(`Chest '${chestId}' is already open`);
  }
  return {
    ...state,
    campaign: {
      ...state.campaign,
      gold: state.campaign.gold + chest.reward.gold,
      reserveInventory: {
        medkits: state.campaign.reserveInventory.medkits + chest.reward.medkits,
        revives: state.campaign.reserveInventory.revives + chest.reward.revives,
      },
    },
    openedChestIds: [...state.openedChestIds, chestId],
  };
}

export function restWorldLoopParty(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  partyDefs: Array<PartyMemberDefinition | Combatant>,
  equipmentDefs: Record<string, EquipmentItem>,
  rules?: GameRules
): WorldLoopState {
  const location = worldLoopLocation(definition, state.currentLocationId);
  if (!location.restAvailable) throw new Error(`Location '${location.id}' has no rest point`);
  return {
    ...state,
    party: prepareExpeditionParty(state.campaign, partyDefs, equipmentDefs, rules),
    restCount: state.restCount + 1,
  };
}

export function buyWorldLoopConsumable(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  item: 'medkit' | 'revive',
  rules?: GameRules
): WorldLoopState {
  const location = worldLoopLocation(definition, state.currentLocationId);
  if (!location.shopAvailable) throw new Error(`Location '${location.id}' has no shop`);
  return { ...state, campaign: buyConsumable(state.campaign, item, 1, rules) };
}

export function worldLoopEncounterNode(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  nodeId: string
): WorldLoopEncounterNodeDefinition {
  const node = requireValue(
    definition.encounterNodes.find((candidate) => candidate.id === nodeId),
    `World-loop encounter node '${nodeId}'`
  );
  if (node.locationId !== state.currentLocationId) {
    throw new Error(`Encounter node '${nodeId}' is not in '${state.currentLocationId}'`);
  }
  if (state.clearedEncounterNodeIds.includes(nodeId)) {
    throw new Error(`Encounter node '${nodeId}' is currently cleared`);
  }
  return node;
}

export function completeWorldLoopEncounter(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  nodeId: string,
  encounter: EncounterDefinition,
  battle: BattleState,
  rules?: GameRules
): WorldLoopState {
  const node = worldLoopEncounterNode(state, definition, nodeId);
  if (node.encounterId !== encounter.id || battle.encounterId !== encounter.id) {
    throw new Error(`Encounter result does not match node '${nodeId}'`);
  }
  if (battle.status !== 'victory') throw new Error(`Encounter '${encounter.id}' was not won`);
  const party = { ...state.party };
  for (const partyId of state.partyIds) {
    const result = requireValue(battle.combatants[partyId], `Battle party member '${partyId}'`);
    party[partyId] = {
      ...result,
      stats: { ...result.stats },
      abilityIds: [...result.abilityIds],
    };
  }
  const campaignWithInventory: CampaignState = {
    ...state.campaign,
    reserveInventory: { ...battle.inventory },
  };
  const rewardedCampaign = awardEncounterRewards(
    campaignWithInventory,
    encounter,
    rules ?? getDefaultRules()
  );
  return {
    ...state,
    campaign: rewardedCampaign,
    party,
    clearedEncounterNodeIds: [...state.clearedEncounterNodeIds, node.id],
    encounterVictoryCounts: {
      ...state.encounterVictoryCounts,
      [node.id]: (state.encounterVictoryCounts[node.id] ?? 0) + 1,
    },
    bossDefeated: state.bossDefeated || node.boss,
    status: node.boss ? 'completed' : 'in_progress',
  };
}
