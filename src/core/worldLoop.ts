import { getDefaultRules, type GameRules } from './configLoader';
import { requireValue } from './invariant';
import { resolveExpeditionFieldContactTrigger } from './expeditionFieldContact';
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
  ExpeditionExplorationFieldContactDefinition,
  ExpeditionFieldContactAdvantage,
  ExpeditionFieldContactTrigger,
  PartyMemberDefinition,
  WorldLoopChestDefinition,
  WorldLoopDefinition,
  WorldLoopEncounterNodeDefinition,
  WorldLoopLocationDefinition,
  WorldLoopMapDefinition,
  WorldLoopPoint,
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

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${path} must be a finite number`);
  }
  return value;
}

function exactKeys(value: Record<string, unknown>, keys: string[], path: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    throw new Error(`${path} must contain exactly ${expected.join(', ')}`);
  }
}

function worldLoopPoint(value: unknown, path: string): WorldLoopPoint {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  exactKeys(value, ['x', 'y'], path);
  return {
    x: finiteNumber(value.x, `${path}.x`),
    y: finiteNumber(value.y, `${path}.y`),
  };
}

function pointInsideBounds(point: WorldLoopPoint, map: WorldLoopMapDefinition): boolean {
  return point.x >= map.bounds.minX && point.x <= map.bounds.maxX &&
    point.y >= map.bounds.minY && point.y <= map.bounds.maxY;
}

function pointInsideWalkableArea(point: WorldLoopPoint, map: WorldLoopMapDefinition): boolean {
  return map.walkableAreas.some((area) => (
    point.x >= area.x && point.x <= area.x + area.width &&
    point.y >= area.y && point.y <= area.y + area.height
  ));
}

function validateWorldLoopMap(value: unknown, path: string): WorldLoopMapDefinition {
  if (!isRecord(value)) throw new Error(`${path} must be an object`);
  exactKeys(value, [
    'bounds',
    'defaultEntryPosition',
    'entryPoints',
    'walkableAreas',
    'mainRoute',
    'secondaryRoutes',
    'interactablePlacements',
  ], path);
  if (!isRecord(value.bounds)) throw new Error(`${path}.bounds must be an object`);
  exactKeys(value.bounds, ['minX', 'minY', 'maxX', 'maxY'], `${path}.bounds`);
  const bounds = {
    minX: finiteNumber(value.bounds.minX, `${path}.bounds.minX`),
    minY: finiteNumber(value.bounds.minY, `${path}.bounds.minY`),
    maxX: finiteNumber(value.bounds.maxX, `${path}.bounds.maxX`),
    maxY: finiteNumber(value.bounds.maxY, `${path}.bounds.maxY`),
  };
  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) {
    throw new Error(`${path}.bounds must have positive width and height`);
  }
  if (!Array.isArray(value.entryPoints) || !Array.isArray(value.walkableAreas) ||
    !Array.isArray(value.mainRoute) || !Array.isArray(value.secondaryRoutes) ||
    !Array.isArray(value.interactablePlacements)) {
    throw new Error(`${path} route and placement collections must be arrays`);
  }
  const map: WorldLoopMapDefinition = {
    bounds,
    defaultEntryPosition: worldLoopPoint(
      value.defaultEntryPosition,
      `${path}.defaultEntryPosition`
    ),
    entryPoints: value.entryPoints.map((entry, index) => {
      if (!isRecord(entry)) throw new Error(`${path}.entryPoints[${index}] must be an object`);
      exactKeys(entry, ['sourceLocationId', 'position'], `${path}.entryPoints[${index}]`);
      return {
        sourceLocationId: nonemptyString(
          entry.sourceLocationId,
          `${path}.entryPoints[${index}].sourceLocationId`
        ),
        position: worldLoopPoint(entry.position, `${path}.entryPoints[${index}].position`),
      };
    }),
    walkableAreas: value.walkableAreas.map((area, index) => {
      if (!isRecord(area)) throw new Error(`${path}.walkableAreas[${index}] must be an object`);
      exactKeys(area, ['x', 'y', 'width', 'height'], `${path}.walkableAreas[${index}]`);
      const parsed = {
        x: finiteNumber(area.x, `${path}.walkableAreas[${index}].x`),
        y: finiteNumber(area.y, `${path}.walkableAreas[${index}].y`),
        width: finiteNumber(area.width, `${path}.walkableAreas[${index}].width`),
        height: finiteNumber(area.height, `${path}.walkableAreas[${index}].height`),
      };
      if (parsed.width <= 0 || parsed.height <= 0) {
        throw new Error(`${path}.walkableAreas[${index}] must have positive size`);
      }
      return parsed;
    }),
    mainRoute: value.mainRoute.map((point, index) => (
      worldLoopPoint(point, `${path}.mainRoute[${index}]`)
    )),
    secondaryRoutes: value.secondaryRoutes.map((route, routeIndex) => {
      if (!Array.isArray(route) || route.length < 2) {
        throw new Error(`${path}.secondaryRoutes[${routeIndex}] must contain at least two points`);
      }
      return route.map((point, pointIndex) => (
        worldLoopPoint(point, `${path}.secondaryRoutes[${routeIndex}][${pointIndex}]`)
      ));
    }),
    interactablePlacements: value.interactablePlacements.map((placement, index) => {
      if (!isRecord(placement)) {
        throw new Error(`${path}.interactablePlacements[${index}] must be an object`);
      }
      exactKeys(
        placement,
        ['interactableId', 'position', 'markerVisibility'],
        `${path}.interactablePlacements[${index}]`
      );
      if (placement.markerVisibility !== 'always' && placement.markerVisibility !== 'nearby') {
        throw new Error(`${path}.interactablePlacements[${index}].markerVisibility is unsupported`);
      }
      return {
        interactableId: nonemptyString(
          placement.interactableId,
          `${path}.interactablePlacements[${index}].interactableId`
        ),
        position: worldLoopPoint(
          placement.position,
          `${path}.interactablePlacements[${index}].position`
        ),
        markerVisibility: placement.markerVisibility,
      };
    }),
  };
  if (map.walkableAreas.length === 0 || map.mainRoute.length < 2) {
    throw new Error(`${path} must define walkable space and a main route`);
  }
  const allPoints = [
    map.defaultEntryPosition,
    ...map.entryPoints.map((entry) => entry.position),
    ...map.mainRoute,
    ...map.secondaryRoutes.flat(),
    ...map.interactablePlacements.map((placement) => placement.position),
  ];
  if (allPoints.some((point) => !pointInsideBounds(point, map))) {
    throw new Error(`${path} contains a point outside its bounds`);
  }
  const interactivePoints = [
    map.defaultEntryPosition,
    ...map.entryPoints.map((entry) => entry.position),
    ...map.interactablePlacements.map((placement) => placement.position),
  ];
  if (interactivePoints.some((point) => !pointInsideWalkableArea(point, map))) {
    throw new Error(`${path} contains an entry or interactable outside walkable space`);
  }
  return map;
}

export function validateWorldLoopDefinition(value: unknown): WorldLoopDefinition {
  if (!isRecord(value)) throw new Error('worldLoop must be an object');
  const id = nonemptyString(value.id, 'worldLoop.id');
  const startLocationId = nonemptyString(value.startLocationId, 'worldLoop.startLocationId');
  if (!isRecord(value.explorationAvatar)) {
    throw new Error('worldLoop.explorationAvatar must be an object');
  }
  exactKeys(value.explorationAvatar, ['id', 'name'], 'worldLoop.explorationAvatar');
  const explorationAvatar = {
    id: nonemptyString(value.explorationAvatar.id, 'worldLoop.explorationAvatar.id'),
    name: nonemptyString(value.explorationAvatar.name, 'worldLoop.explorationAvatar.name'),
  };
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
      map: validateWorldLoopMap(item.map, `worldLoop.locations[${index}].map`),
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
      exactKeys(item, [
        'id',
        'locationId',
        'encounterId',
        'repeatable',
        'boss',
        'facing',
        'awarenessRange',
        'awarenessHalfAngleDegrees',
        'fieldStrikeRange',
        'collisionRadius',
      ], `worldLoop.encounterNodes[${index}]`);
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
      const facing = worldLoopPoint(item.facing, `worldLoop.encounterNodes[${index}].facing`);
      const awarenessRange = finiteNumber(
        item.awarenessRange,
        `worldLoop.encounterNodes[${index}].awarenessRange`
      );
      const awarenessHalfAngleDegrees = finiteNumber(
        item.awarenessHalfAngleDegrees,
        `worldLoop.encounterNodes[${index}].awarenessHalfAngleDegrees`
      );
      const fieldStrikeRange = finiteNumber(
        item.fieldStrikeRange,
        `worldLoop.encounterNodes[${index}].fieldStrikeRange`
      );
      const collisionRadius = finiteNumber(
        item.collisionRadius,
        `worldLoop.encounterNodes[${index}].collisionRadius`
      );
      if (
        Math.hypot(facing.x, facing.y) <= Number.EPSILON ||
        awarenessRange <= 0 ||
        awarenessHalfAngleDegrees <= 0 ||
        awarenessHalfAngleDegrees > 180 ||
        fieldStrikeRange <= 0 ||
        collisionRadius <= 0 ||
        awarenessRange < collisionRadius ||
        fieldStrikeRange < collisionRadius
      ) {
        throw new Error(`worldLoop.encounterNodes[${index}] field-contact geometry is invalid`);
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
        facing,
        awarenessRange,
        awarenessHalfAngleDegrees,
        fieldStrikeRange,
        collisionRadius,
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
    const expectedPlacementIds = [
      ...location.connectedLocationIds,
      ...location.chestIds,
      ...location.encounterNodeIds,
      ...(location.restAvailable ? ['rest'] : []),
      ...(location.shopAvailable ? ['buy_medkit', 'buy_revive'] : []),
    ].sort();
    const actualPlacementIds = location.map.interactablePlacements
      .map((placement) => placement.interactableId)
      .sort();
    if (
      actualPlacementIds.length !== expectedPlacementIds.length ||
      actualPlacementIds.some((placementId, index) => placementId !== expectedPlacementIds[index])
    ) {
      throw new Error(`Location '${location.id}' map placements do not match its interactables`);
    }
    const entrySourceIds = location.map.entryPoints.map((entry) => entry.sourceLocationId).sort();
    const connectedIds = [...location.connectedLocationIds].sort();
    if (
      entrySourceIds.length !== connectedIds.length ||
      entrySourceIds.some((sourceId, index) => sourceId !== connectedIds[index])
    ) {
      throw new Error(`Location '${location.id}' entry points do not match its connections`);
    }
  }
  return { id, startLocationId, explorationAvatar, locations, chests, encounterNodes };
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

export function worldLoopEncounterContact(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  nodeId: string
): ExpeditionExplorationFieldContactDefinition {
  const node = worldLoopEncounterNode(state, definition, nodeId);
  const location = worldLoopLocation(definition, state.currentLocationId);
  const placement = requireValue(
    location.map.interactablePlacements.find(
      (candidate) => candidate.interactableId === node.id
    ),
    `World-loop encounter node '${node.id}' placement`
  );
  return {
    id: node.id,
    encounterId: node.encounterId,
    position: { ...placement.position },
    facing: { ...node.facing },
    awarenessRange: node.awarenessRange,
    awarenessHalfAngleDegrees: node.awarenessHalfAngleDegrees,
    fieldStrikeRange: node.fieldStrikeRange,
    collisionRadius: node.collisionRadius,
    required: node.boss,
    persistent: !node.repeatable,
  };
}

export function resolveWorldLoopEncounterTrigger(
  state: WorldLoopState,
  definition: WorldLoopDefinition,
  nodeId: string,
  playerPosition: WorldLoopPoint,
  trigger: ExpeditionFieldContactTrigger
): ExpeditionFieldContactAdvantage {
  const location = worldLoopLocation(definition, state.currentLocationId);
  const contact = worldLoopEncounterContact(state, definition, nodeId);
  return resolveExpeditionFieldContactTrigger(
    location.map,
    contact,
    playerPosition,
    trigger
  );
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
