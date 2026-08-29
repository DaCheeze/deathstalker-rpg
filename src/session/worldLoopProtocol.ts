import { chooseEnemyAction } from '../core/ai';
import { applyAction, getAvailableActions } from '../core/battle';
import { getDefaultRules } from '../core/configLoader';
import { createRng, restoreRng, type SerializableRng } from '../core/random';
import { worldLoopLocation } from '../core/worldLoop';
import type {
  BattleAction,
  BattleState,
  ExpeditionFieldContactAdvantage,
  ExpeditionFieldContactTrigger,
  WorldLoopEncounterNodeDefinition,
  WorldLoopInteractablePlacement,
  WorldLoopMapDefinition,
  WorldLoopPoint,
} from '../core/types';
import {
  serializeBattleState,
  serializeBattleTransition,
  serializeEncounter,
  type PresentationEncounterV1,
  type PresentationTransitionV1,
} from '../bridge/presentationBridge';
import {
  buyWorldLoopRuntimeConsumable,
  completeWorldLoopRuntimeBattle,
  createWorldLoopRuntime,
  openWorldLoopRuntimeChest,
  restWorldLoopRuntime,
  startWorldLoopBattle,
  travelWorldLoopRuntime,
  type WorldLoopRuntime,
} from './worldLoopScenario';

export { WORLD_LOOP_SCENARIO_ID } from './worldLoopScenario';

export const WORLD_LOOP_SESSION_FORMAT = 'deathstalker-world-loop-session';
export const WORLD_LOOP_SESSION_PROTOCOL_VERSION = 3;
export const WORLD_LOOP_CHECKPOINT_FORMAT = 'deathstalker-world-loop-checkpoint';
export const WORLD_LOOP_CHECKPOINT_VERSION = 1;

export type WorldLoopSessionCommandV1 =
  | { type: 'create_world_loop'; scenarioId: string; seed: number }
  | { type: 'travel'; destinationId: string }
  | { type: 'open_chest'; chestId: string }
  | { type: 'rest' }
  | { type: 'buy_consumable'; item: 'medkit' | 'revive' }
  | {
      type: 'start_encounter';
      nodeId: string;
      trigger: ExpeditionFieldContactTrigger;
      playerPosition: WorldLoopPoint;
    }
  | { type: 'apply_action'; action: BattleAction }
  | { type: 'advance_ai' }
  | { type: 'return_to_map' }
  | { type: 'restart_world_loop' };

export type WorldLoopCheckpointCommandV1 = Exclude<
  WorldLoopSessionCommandV1,
  { type: 'create_world_loop' }
>;

export interface WorldLoopCheckpointV1 {
  format: typeof WORLD_LOOP_CHECKPOINT_FORMAT;
  checkpointVersion: typeof WORLD_LOOP_CHECKPOINT_VERSION;
  scenarioId: string;
  seed: number;
  sequence: number;
  commands: WorldLoopCheckpointCommandV1[];
}

export interface WorldLoopSessionRequestV1 {
  format: typeof WORLD_LOOP_SESSION_FORMAT;
  protocolVersion: typeof WORLD_LOOP_SESSION_PROTOCOL_VERSION;
  requestId: string;
  sessionId: string;
  expectedSequence: number;
  command: WorldLoopSessionCommandV1;
}

export type WorldLoopAwaiting =
  | 'explore'
  | 'player'
  | 'ai'
  | 'return'
  | 'complete'
  | 'failed';

export interface WorldLoopInteractableViewV1 {
  id: string;
  type: 'travel' | 'chest' | 'encounter' | 'rest' | 'shop';
  label: string;
  available: boolean;
  detail: string;
  position: WorldLoopPoint;
  markerVisibility: 'always' | 'nearby';
  fieldContact: WorldLoopFieldContactViewV1 | null;
}

export interface WorldLoopFieldContactViewV1 {
  facing: WorldLoopPoint;
  awarenessRange: number;
  awarenessHalfAngleDegrees: number;
  fieldStrikeRange: number;
  collisionRadius: number;
}

export interface WorldLoopSessionViewV1 {
  scenarioId: string;
  seed: number;
  sequence: number;
  awaiting: WorldLoopAwaiting;
  explorationAvatar: { id: string; name: string };
  location: {
    id: string;
    kind: string;
    connectedLocationIds: string[];
    restAvailable: boolean;
    shopAvailable: boolean;
    map: WorldLoopMapDefinition;
  };
  interactables: WorldLoopInteractableViewV1[];
  campaign: {
    partyLevel: number;
    xp: number;
    nextLevelXp: number | null;
    gold: number;
    inventory: { medkits: number; revives: number };
  };
  party: Array<{ id: string; name: string; role: string; hp: number; maxHp: number }>;
  openedChestIds: string[];
  encounterVictoryCounts: Record<string, number>;
  restCount: number;
  bossDefeated: boolean;
  fieldContactAdvantage: ExpeditionFieldContactAdvantage | null;
  lastEvent: string;
  encounter: PresentationEncounterV1 | null;
  transition: PresentationTransitionV1 | null;
  legalActions: BattleAction[];
}

export type WorldLoopResultType =
  | 'world_loop_created'
  | 'world_loop_resumed'
  | 'location_changed'
  | 'chest_opened'
  | 'party_rested'
  | 'shop_purchase_completed'
  | 'encounter_started'
  | 'action_applied'
  | 'ai_action_applied'
  | 'battle_returned_to_map'
  | 'world_loop_restarted';

export interface WorldLoopSuccessResponseV1 {
  format: typeof WORLD_LOOP_SESSION_FORMAT;
  protocolVersion: typeof WORLD_LOOP_SESSION_PROTOCOL_VERSION;
  ok: true;
  requestId: string;
  sessionId: string;
  sequence: number;
  resultType: WorldLoopResultType;
  view: WorldLoopSessionViewV1;
}

export interface WorldLoopErrorResponseV1 {
  format: typeof WORLD_LOOP_SESSION_FORMAT;
  protocolVersion: typeof WORLD_LOOP_SESSION_PROTOCOL_VERSION;
  ok: false;
  requestId: string | null;
  sessionId: string | null;
  sequence: number | null;
  error: { code: string; message: string };
}

export type WorldLoopResponseV1 = WorldLoopSuccessResponseV1 | WorldLoopErrorResponseV1;

interface CachedResponse {
  signature: string;
  response: WorldLoopResponseV1;
}

interface WorldLoopSessionRecord {
  scenarioId: string;
  seed: number;
  sequence: number;
  runtime: WorldLoopRuntime;
  battle: BattleState | null;
  encounterNodeId: string | null;
  fieldContactAdvantage: ExpeditionFieldContactAdvantage | null;
  transition: PresentationTransitionV1 | null;
  rng: SerializableRng;
  lastEvent: string;
  history: WorldLoopCheckpointCommandV1[];
  responses: Map<string, CachedResponse>;
}

const MAX_CHECKPOINT_COMMANDS = 4096;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(
  value: Record<string, unknown>,
  required: readonly string[],
  optional: readonly string[] = []
): boolean {
  const allowed = new Set([...required, ...optional]);
  return required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key));
}

function nonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseWorldLoopPoint(value: unknown): WorldLoopPoint | null {
  if (!isRecord(value) || !hasExactKeys(value, ['x', 'y'])) return null;
  if (
    typeof value.x !== 'number' ||
    !Number.isFinite(value.x) ||
    typeof value.y !== 'number' ||
    !Number.isFinite(value.y)
  ) return null;
  return { x: value.x, y: value.y };
}

function parseBattleAction(value: unknown): BattleAction | null {
  if (!isRecord(value) || !nonemptyString(value.type) || !nonemptyString(value.actorId)) return null;
  const actorId = value.actorId;
  switch (value.type) {
    case 'Attack':
      return hasExactKeys(value, ['type', 'actorId', 'targetId', 'abilityId']) &&
        nonemptyString(value.targetId) && nonemptyString(value.abilityId)
        ? { type: 'Attack', actorId, targetId: value.targetId, abilityId: value.abilityId }
        : null;
    case 'Disruptor':
      return hasExactKeys(value, ['type', 'actorId', 'targetId']) && nonemptyString(value.targetId)
        ? { type: 'Disruptor', actorId, targetId: value.targetId }
        : null;
    case 'RaiseShield':
      return hasExactKeys(value, ['type', 'actorId']) ? { type: 'RaiseShield', actorId } : null;
    case 'ToggleBoost':
      return hasExactKeys(value, ['type', 'actorId', 'enable']) && typeof value.enable === 'boolean'
        ? { type: 'ToggleBoost', actorId, enable: value.enable }
        : null;
    case 'EsperAbility':
      return hasExactKeys(value, ['type', 'actorId', 'abilityId'], ['targetId']) &&
        nonemptyString(value.abilityId) &&
        (value.targetId === undefined || nonemptyString(value.targetId))
        ? value.targetId === undefined
          ? { type: 'EsperAbility', actorId, abilityId: value.abilityId }
          : { type: 'EsperAbility', actorId, targetId: value.targetId, abilityId: value.abilityId }
        : null;
    case 'UseMedkit':
      return hasExactKeys(value, ['type', 'actorId', 'targetId']) && nonemptyString(value.targetId)
        ? { type: 'UseMedkit', actorId, targetId: value.targetId }
        : null;
    case 'UseRevive':
      return hasExactKeys(value, ['type', 'actorId', 'targetId']) && nonemptyString(value.targetId)
        ? { type: 'UseRevive', actorId, targetId: value.targetId }
        : null;
    case 'PassTurn':
      return hasExactKeys(value, ['type', 'actorId']) ? { type: 'PassTurn', actorId } : null;
    default:
      return null;
  }
}

function parseCommand(value: unknown): WorldLoopSessionCommandV1 | null {
  if (!isRecord(value) || !nonemptyString(value.type)) return null;
  switch (value.type) {
    case 'create_world_loop':
      return hasExactKeys(value, ['type', 'scenarioId', 'seed']) &&
        nonemptyString(value.scenarioId) && Number.isSafeInteger(value.seed)
        ? { type: 'create_world_loop', scenarioId: value.scenarioId, seed: value.seed as number }
        : null;
    case 'travel':
      return hasExactKeys(value, ['type', 'destinationId']) && nonemptyString(value.destinationId)
        ? { type: 'travel', destinationId: value.destinationId }
        : null;
    case 'open_chest':
      return hasExactKeys(value, ['type', 'chestId']) && nonemptyString(value.chestId)
        ? { type: 'open_chest', chestId: value.chestId }
        : null;
    case 'rest':
      return hasExactKeys(value, ['type']) ? { type: 'rest' } : null;
    case 'buy_consumable':
      return hasExactKeys(value, ['type', 'item']) && (value.item === 'medkit' || value.item === 'revive')
        ? { type: 'buy_consumable', item: value.item }
        : null;
    case 'start_encounter':
      if (
        !hasExactKeys(value, ['type', 'nodeId', 'trigger', 'playerPosition']) ||
        !nonemptyString(value.nodeId) ||
        !['player_strike', 'enemy_contact', 'mutual_contact'].includes(
          String(value.trigger)
        )
      ) return null;
      {
        const playerPosition = parseWorldLoopPoint(value.playerPosition);
        return playerPosition === null
          ? null
          : {
              type: 'start_encounter',
              nodeId: value.nodeId,
              trigger: value.trigger as ExpeditionFieldContactTrigger,
              playerPosition,
            };
      }
    case 'apply_action': {
      if (!hasExactKeys(value, ['type', 'action'])) return null;
      const action = parseBattleAction(value.action);
      return action ? { type: 'apply_action', action } : null;
    }
    case 'advance_ai':
      return hasExactKeys(value, ['type']) ? { type: 'advance_ai' } : null;
    case 'return_to_map':
      return hasExactKeys(value, ['type']) ? { type: 'return_to_map' } : null;
    case 'restart_world_loop':
      return hasExactKeys(value, ['type']) ? { type: 'restart_world_loop' } : null;
    default:
      return null;
  }
}

function parseRequest(value: unknown): WorldLoopSessionRequestV1 | null {
  if (!isRecord(value) || !hasExactKeys(value, [
    'format', 'protocolVersion', 'requestId', 'sessionId', 'expectedSequence', 'command',
  ])) return null;
  const command = parseCommand(value.command);
  if (
    value.format !== WORLD_LOOP_SESSION_FORMAT ||
    value.protocolVersion !== WORLD_LOOP_SESSION_PROTOCOL_VERSION ||
    !nonemptyString(value.requestId) ||
    !nonemptyString(value.sessionId) ||
    !Number.isSafeInteger(value.expectedSequence) ||
    (value.expectedSequence as number) < 0 ||
    command === null
  ) return null;
  return {
    format: WORLD_LOOP_SESSION_FORMAT,
    protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
    requestId: value.requestId,
    sessionId: value.sessionId,
    expectedSequence: value.expectedSequence as number,
    command,
  };
}

function parseCheckpointCommand(value: unknown): WorldLoopCheckpointCommandV1 | null {
  const command = parseCommand(value);
  return command === null || command.type === 'create_world_loop' ? null : command;
}

function parseCheckpoint(value: unknown): WorldLoopCheckpointV1 | null {
  if (!isRecord(value) || !hasExactKeys(value, [
    'format',
    'checkpointVersion',
    'scenarioId',
    'seed',
    'sequence',
    'commands',
  ])) {
    return null;
  }
  if (
    value.format !== WORLD_LOOP_CHECKPOINT_FORMAT ||
    value.checkpointVersion !== WORLD_LOOP_CHECKPOINT_VERSION ||
    !nonemptyString(value.scenarioId) ||
    !Number.isSafeInteger(value.seed) ||
    !Number.isSafeInteger(value.sequence) ||
    (value.sequence as number) < 0 ||
    !Array.isArray(value.commands) ||
    value.commands.length > MAX_CHECKPOINT_COMMANDS ||
    value.sequence !== value.commands.length
  ) {
    return null;
  }
  const commands: WorldLoopCheckpointCommandV1[] = [];
  for (const candidate of value.commands) {
    const command = parseCheckpointCommand(candidate);
    if (command === null) return null;
    commands.push(command);
  }
  return {
    format: WORLD_LOOP_CHECKPOINT_FORMAT,
    checkpointVersion: WORLD_LOOP_CHECKPOINT_VERSION,
    scenarioId: value.scenarioId,
    seed: value.seed as number,
    sequence: value.sequence as number,
    commands,
  };
}

function actionsEqual(left: BattleAction, right: BattleAction): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function awaiting(record: WorldLoopSessionRecord): WorldLoopAwaiting {
  if (record.battle !== null) {
    if (record.battle.status === 'victory') return 'return';
    if (record.battle.status === 'defeat') return 'failed';
    return record.battle.partyIds.includes(record.battle.activeActorId) ? 'player' : 'ai';
  }
  return record.runtime.state.status === 'completed' ? 'complete' : 'explore';
}

function legalActions(record: WorldLoopSessionRecord): BattleAction[] {
  return awaiting(record) === 'player' && record.battle !== null
    ? getAvailableActions(record.battle, record.battle.activeActorId)
    : [];
}

function placementFor(
  map: WorldLoopMapDefinition,
  interactableId: string
): WorldLoopInteractablePlacement {
  const placement = map.interactablePlacements.find(
    (candidate) => candidate.interactableId === interactableId
  );
  if (placement === undefined) {
    throw new Error(`World-loop interactable '${interactableId}' has no map placement`);
  }
  return placement;
}

function placedInteractable(
  map: WorldLoopMapDefinition,
  interactable: Omit<WorldLoopInteractableViewV1, 'position' | 'markerVisibility'>
): WorldLoopInteractableViewV1 {
  const placement = placementFor(map, interactable.id);
  return {
    ...interactable,
    position: { ...placement.position },
    markerVisibility: placement.markerVisibility,
  };
}

function fieldContactFor(node: WorldLoopEncounterNodeDefinition): WorldLoopFieldContactViewV1 {
  return {
    facing: { ...node.facing },
    awarenessRange: node.awarenessRange,
    awarenessHalfAngleDegrees: node.awarenessHalfAngleDegrees,
    fieldStrikeRange: node.fieldStrikeRange,
    collisionRadius: node.collisionRadius,
  };
}

function cloneWorldLoopMap(map: WorldLoopMapDefinition): WorldLoopMapDefinition {
  return {
    bounds: { ...map.bounds },
    defaultEntryPosition: { ...map.defaultEntryPosition },
    entryPoints: map.entryPoints.map((entry) => ({
      sourceLocationId: entry.sourceLocationId,
      position: { ...entry.position },
    })),
    walkableAreas: map.walkableAreas.map((area) => ({ ...area })),
    mainRoute: map.mainRoute.map((point) => ({ ...point })),
    secondaryRoutes: map.secondaryRoutes.map((route) => (
      route.map((point) => ({ ...point }))
    )),
    interactablePlacements: map.interactablePlacements.map((placement) => ({
      interactableId: placement.interactableId,
      position: { ...placement.position },
      markerVisibility: placement.markerVisibility,
    })),
  };
}

function viewFor(record: WorldLoopSessionRecord): WorldLoopSessionViewV1 {
  const state = record.runtime.state;
  const location = worldLoopLocation(record.runtime.definition, state.currentLocationId);
  const rules = getDefaultRules();
  const thresholds = rules.progression?.xpThresholds ?? [];
  const nextThreshold = thresholds[state.campaign.partyLevel];
  const interactables: WorldLoopInteractableViewV1[] = [];
  for (const destinationId of location.connectedLocationIds) {
    interactables.push(placedInteractable(location.map, {
      id: destinationId,
      type: 'travel',
      label: destinationId.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
      available: awaiting(record) === 'explore',
      detail: 'Travel and keep the current party condition.',
      fieldContact: null,
    }));
  }
  for (const chestId of location.chestIds) {
    const opened = state.openedChestIds.includes(chestId);
    interactables.push(placedInteractable(location.map, {
      id: chestId,
      type: 'chest',
      label: opened ? 'Opened Chest' : 'Unopened Chest',
      available: awaiting(record) === 'explore' && !opened,
      detail: opened ? 'This reward is already claimed.' : 'Open once; contents persist.',
      fieldContact: null,
    }));
  }
  for (const nodeId of location.encounterNodeIds) {
    const node = record.runtime.definition.encounterNodes.find((candidate) => candidate.id === nodeId);
    const cleared = state.clearedEncounterNodeIds.includes(nodeId);
    interactables.push(placedInteractable(location.map, {
      id: nodeId,
      type: 'encounter',
      label: node?.boss ? 'Fixed Boss' : 'Optional Encounter',
      available: awaiting(record) === 'explore' && !cleared && !(node?.boss && state.bossDefeated),
      detail: node?.repeatable
        ? 'Returns after leaving and re-entering this area.'
        : 'Fixed strength; it never scales to the party.',
      fieldContact: node === undefined ? null : fieldContactFor(node),
    }));
  }
  if (location.restAvailable) {
    interactables.push(placedInteractable(location.map, {
      id: 'rest', type: 'rest', label: 'Rest', available: awaiting(record) === 'explore',
      detail: 'Restore party condition without consuming a medkit.',
      fieldContact: null,
    }));
  }
  if (location.shopAvailable) {
    interactables.push(placedInteractable(location.map, {
      id: 'buy_medkit', type: 'shop', label: 'Buy Medkit', available: awaiting(record) === 'explore',
      detail: `${rules.progression?.medkitCost ?? 50} gold`,
      fieldContact: null,
    }));
    interactables.push(placedInteractable(location.map, {
      id: 'buy_revive', type: 'shop', label: 'Buy Revive', available: awaiting(record) === 'explore',
      detail: `${rules.progression?.reviveCost ?? 120} gold`,
      fieldContact: null,
    }));
  }
  const encounter = record.encounterNodeId === null
    ? null
    : record.runtime.encounters[
      record.runtime.definition.encounterNodes.find(
        (node) => node.id === record.encounterNodeId
      )?.encounterId ?? ''
    ];
  return {
    scenarioId: record.scenarioId,
    seed: record.seed,
    sequence: record.sequence,
    awaiting: awaiting(record),
    explorationAvatar: { ...record.runtime.definition.explorationAvatar },
    location: {
      id: location.id,
      kind: location.kind,
      connectedLocationIds: [...location.connectedLocationIds],
      restAvailable: location.restAvailable,
      shopAvailable: location.shopAvailable,
      map: cloneWorldLoopMap(location.map),
    },
    interactables,
    campaign: {
      partyLevel: state.campaign.partyLevel,
      xp: state.campaign.xp,
      nextLevelXp: nextThreshold ?? null,
      gold: state.campaign.gold,
      inventory: { ...state.campaign.reserveInventory },
    },
    party: state.partyIds.map((id) => {
      const member = state.party[id];
      if (member === undefined) throw new Error(`World-loop party member '${id}' is missing`);
      return {
        id: member.id,
        name: member.name,
        role: member.role,
        hp: member.stats.hp,
        maxHp: member.stats.maxHp,
      };
    }),
    openedChestIds: [...state.openedChestIds],
    encounterVictoryCounts: { ...state.encounterVictoryCounts },
    restCount: state.restCount,
    bossDefeated: state.bossDefeated,
    fieldContactAdvantage: record.fieldContactAdvantage,
    lastEvent: record.lastEvent,
    encounter: encounter ? serializeEncounter(encounter) : null,
    transition: record.transition,
    legalActions: legalActions(record),
  };
}

function errorResponse(
  code: string,
  message: string,
  requestId: string | null,
  sessionId: string | null,
  sequence: number | null
): WorldLoopErrorResponseV1 {
  return {
    format: WORLD_LOOP_SESSION_FORMAT,
    protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
    ok: false,
    requestId,
    sessionId,
    sequence,
    error: { code, message },
  };
}

function signature(request: WorldLoopSessionRequestV1): string {
  return JSON.stringify({ expectedSequence: request.expectedSequence, command: request.command });
}

export class WorldLoopHostV1 {
  private readonly sessions = new Map<string, WorldLoopSessionRecord>();

  constructor(
    private readonly runtimeFactory: (scenarioId: string) => WorldLoopRuntime = createWorldLoopRuntime
  ) {}

  exportCheckpoint(sessionId: string): WorldLoopCheckpointV1 | null {
    const record = this.sessions.get(sessionId);
    if (record === undefined) return null;
    return {
      format: WORLD_LOOP_CHECKPOINT_FORMAT,
      checkpointVersion: WORLD_LOOP_CHECKPOINT_VERSION,
      scenarioId: record.scenarioId,
      seed: record.seed,
      sequence: record.sequence,
      commands: record.history.map((command) => {
        const copy = parseCheckpointCommand(command);
        if (copy === null) throw new Error('World-loop checkpoint history became invalid');
        return copy;
      }),
    };
  }

  restoreCheckpoint(
    sessionId: string,
    value: unknown,
    requestId = `${sessionId}-resume`
  ): WorldLoopResponseV1 {
    if (!nonemptyString(sessionId) || !nonemptyString(requestId)) {
      return errorResponse(
        'invalid_checkpoint',
        'Checkpoint sessionId and requestId must not be empty',
        nonemptyString(requestId) ? requestId : null,
        nonemptyString(sessionId) ? sessionId : null,
        null
      );
    }
    const existing = this.sessions.get(sessionId);
    if (existing !== undefined) {
      return errorResponse(
        'session_exists',
        'World-loop session already exists',
        requestId,
        sessionId,
        existing.sequence
      );
    }
    if (value === null || value === undefined) {
      return errorResponse(
        'checkpoint_not_found',
        'No saved world loop exists',
        requestId,
        sessionId,
        null
      );
    }
    const checkpoint = parseCheckpoint(value);
    if (checkpoint === null) {
      return errorResponse(
        'invalid_checkpoint',
        'Saved world-loop checkpoint is malformed or unsupported',
        requestId,
        sessionId,
        null
      );
    }
    try {
      const runtime = this.runtimeFactory(checkpoint.scenarioId);
      if (runtime.definition.id !== checkpoint.scenarioId) {
        throw new Error('Scenario factory returned a mismatched world-loop definition');
      }
      const record: WorldLoopSessionRecord = {
        scenarioId: checkpoint.scenarioId,
        seed: checkpoint.seed,
        sequence: 0,
        runtime,
        battle: null,
        encounterNodeId: null,
        fieldContactAdvantage: null,
        transition: null,
        rng: createRng(checkpoint.seed),
        lastEvent: 'World loop ready',
        history: [],
        responses: new Map(),
      };
      for (const command of checkpoint.commands) {
        if (command.type === 'restart_world_loop') {
          this.resetRecord(record);
        } else {
          this.applyCommand(record, command);
        }
        record.sequence += 1;
        record.history.push(command);
      }
      if (record.sequence !== checkpoint.sequence) {
        throw new Error('Checkpoint sequence does not match replayed history');
      }
      record.transition = record.battle === null
        ? null
        : { action: null, state: serializeBattleState(record.battle) };
      this.sessions.set(sessionId, record);
      return {
        format: WORLD_LOOP_SESSION_FORMAT,
        protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
        ok: true,
        requestId,
        sessionId,
        sequence: record.sequence,
        resultType: 'world_loop_resumed',
        view: viewFor(record),
      };
    } catch (error) {
      return errorResponse(
        'invalid_checkpoint',
        error instanceof Error
          ? `Saved world loop could not be replayed: ${error.message}`
          : 'Saved world loop could not be replayed',
        requestId,
        sessionId,
        null
      );
    }
  }

  handle(value: unknown): WorldLoopResponseV1 {
    const request = parseRequest(value);
    if (request === null) return errorResponse('invalid_request', 'World-loop request is malformed', null, null, null);
    const existing = this.sessions.get(request.sessionId);
    if (existing !== undefined) {
      const cached = existing.responses.get(request.requestId);
      if (cached !== undefined) {
        return cached.signature === signature(request)
          ? cached.response
          : errorResponse(
            'duplicate_request_conflict',
            'requestId was reused with different content',
            request.requestId,
            request.sessionId,
            existing.sequence
          );
      }
    }

    if (request.command.type === 'create_world_loop') {
      if (existing !== undefined) {
        return errorResponse('session_exists', 'World-loop session already exists', request.requestId, request.sessionId, existing.sequence);
      }
      if (request.expectedSequence !== 0) {
        return errorResponse('stale_sequence', 'World-loop creation expects sequence 0', request.requestId, request.sessionId, null);
      }
      let runtime: WorldLoopRuntime;
      try {
        runtime = this.runtimeFactory(request.command.scenarioId);
        if (runtime.definition.id !== request.command.scenarioId) {
          throw new Error('Scenario factory returned a mismatched world-loop definition');
        }
      } catch (error) {
        return errorResponse(
          'unknown_scenario',
          error instanceof Error ? error.message : 'World-loop scenario could not be created',
          request.requestId,
          request.sessionId,
          null
        );
      }
      const record: WorldLoopSessionRecord = {
        scenarioId: request.command.scenarioId,
        seed: request.command.seed,
        sequence: 0,
        runtime,
        battle: null,
        encounterNodeId: null,
        fieldContactAdvantage: null,
        transition: null,
        rng: createRng(request.command.seed),
        lastEvent: 'World loop ready',
        history: [],
        responses: new Map(),
      };
      this.sessions.set(request.sessionId, record);
      return this.success(record, request, 'world_loop_created');
    }
    if (existing === undefined) {
      return errorResponse('session_not_found', 'World-loop session does not exist', request.requestId, request.sessionId, null);
    }
    if (request.expectedSequence !== existing.sequence) {
      return errorResponse('stale_sequence', `Expected sequence ${existing.sequence}`, request.requestId, request.sessionId, existing.sequence);
    }
    if (request.command.type === 'restart_world_loop') {
      this.resetRecord(existing);
      existing.sequence += 1;
      existing.history.push(request.command);
      return this.success(existing, request, 'world_loop_restarted');
    }
    try {
      const resultType = this.applyCommand(existing, request.command);
      existing.sequence += 1;
      existing.history.push(request.command);
      return this.success(existing, request, resultType);
    } catch (error) {
      return errorResponse(
        'illegal_command',
        error instanceof Error ? error.message : 'Authoritative world-loop command failed',
        request.requestId,
        request.sessionId,
        existing.sequence
      );
    }
  }

  handleJson(requestJson: string): string {
    try {
      return JSON.stringify(this.handle(JSON.parse(requestJson) as unknown));
    } catch {
      return JSON.stringify(errorResponse('invalid_request', 'Request is not valid JSON', null, null, null));
    }
  }

  private applyCommand(
    record: WorldLoopSessionRecord,
    command: Exclude<WorldLoopSessionCommandV1, { type: 'create_world_loop' | 'restart_world_loop' }>
  ): WorldLoopResultType {
    const waitState = awaiting(record);
    if (command.type === 'travel') {
      if (waitState !== 'explore') throw new Error(`Cannot travel while awaiting '${waitState}'`);
      record.runtime = travelWorldLoopRuntime(record.runtime, command.destinationId);
      record.lastEvent = `Travelled to ${command.destinationId.replaceAll('_', ' ')}`;
      return 'location_changed';
    }
    if (command.type === 'open_chest') {
      if (waitState !== 'explore') throw new Error(`Cannot open a chest while awaiting '${waitState}'`);
      record.runtime = openWorldLoopRuntimeChest(record.runtime, command.chestId);
      record.lastEvent = 'Chest reward added to campaign inventory';
      return 'chest_opened';
    }
    if (command.type === 'rest') {
      if (waitState !== 'explore') throw new Error(`Cannot rest while awaiting '${waitState}'`);
      record.runtime = restWorldLoopRuntime(record.runtime);
      record.lastEvent = 'Party condition fully restored';
      return 'party_rested';
    }
    if (command.type === 'buy_consumable') {
      if (waitState !== 'explore') throw new Error(`Cannot shop while awaiting '${waitState}'`);
      record.runtime = buyWorldLoopRuntimeConsumable(record.runtime, command.item);
      record.lastEvent = `Purchased one ${command.item}`;
      return 'shop_purchase_completed';
    }
    if (command.type === 'start_encounter') {
      if (waitState !== 'explore') throw new Error(`Cannot start combat while awaiting '${waitState}'`);
      const started = startWorldLoopBattle(
        record.runtime,
        command.nodeId,
        command.trigger,
        command.playerPosition,
        record.rng.exportState().state
      );
      record.encounterNodeId = started.nodeId;
      record.fieldContactAdvantage = started.advantage;
      record.battle = started.battle;
      record.transition = {
        action: null,
        state: serializeBattleState(started.battle),
      };
      record.lastEvent = started.advantage === 'player'
        ? 'Player field strike secured opening initiative'
        : started.advantage === 'enemy'
          ? 'Enemy detection secured opening initiative'
          : 'Mutual contact entered the normal speed queue';
      return 'encounter_started';
    }
    if (command.type === 'return_to_map') {
      if (waitState !== 'return' || record.battle === null || record.encounterNodeId === null) {
        throw new Error(`Cannot return to the map while awaiting '${waitState}'`);
      }
      const node = record.runtime.definition.encounterNodes.find(
        (candidate) => candidate.id === record.encounterNodeId
      );
      const encounter = node === undefined ? undefined : record.runtime.encounters[node.encounterId];
      if (node === undefined || encounter === undefined) throw new Error('Completed encounter node is missing');
      record.runtime = completeWorldLoopRuntimeBattle(
        record.runtime,
        record.encounterNodeId,
        encounter,
        record.battle
      );
      const defeatedBoss = node.boss;
      record.battle = null;
      record.encounterNodeId = null;
      record.fieldContactAdvantage = null;
      record.transition = null;
      record.lastEvent = defeatedBoss
        ? 'Fixed boss defeated'
        : 'Victory rewards received; returned to exploration';
      return 'battle_returned_to_map';
    }
    if (command.type === 'advance_ai') {
      if (waitState !== 'ai' || record.battle === null) {
        throw new Error(`Cannot advance AI while awaiting '${waitState}'`);
      }
      const workingRng = restoreRng(record.rng.exportState());
      const action = chooseEnemyAction(record.battle, record.battle.activeActorId, workingRng);
      return this.applyBattleAction(record, action, true, workingRng);
    }
    if (command.type === 'apply_action') {
      if (waitState !== 'player' || record.battle === null) {
        throw new Error(`Cannot apply a player action while awaiting '${waitState}'`);
      }
      const action = legalActions(record).find((candidate) => actionsEqual(candidate, command.action));
      if (action === undefined) throw new Error('Player action is not legal for the authoritative state');
      return this.applyBattleAction(record, action, false);
    }
    throw new Error(`Unsupported world-loop command '${(command as { type: string }).type}'`);
  }

  private resetRecord(record: WorldLoopSessionRecord): void {
    record.runtime = this.runtimeFactory(record.scenarioId);
    record.battle = null;
    record.encounterNodeId = null;
    record.fieldContactAdvantage = null;
    record.transition = null;
    record.rng = createRng(record.seed);
    record.lastEvent = 'World loop restarted';
  }

  private applyBattleAction(
    record: WorldLoopSessionRecord,
    action: BattleAction,
    aiAction: boolean,
    suppliedRng?: SerializableRng
  ): WorldLoopResultType {
    if (record.battle === null) throw new Error('Battle action has no active battle');
    const before = record.battle;
    const workingRng = suppliedRng ?? restoreRng(record.rng.exportState());
    const after = applyAction(before, action, workingRng);
    record.battle = after;
    record.rng = workingRng;
    record.transition = serializeBattleTransition(before, action, after);
    record.lastEvent = aiAction ? 'Enemy action resolved' : 'Player action resolved';
    return aiAction ? 'ai_action_applied' : 'action_applied';
  }

  private success(
    record: WorldLoopSessionRecord,
    request: WorldLoopSessionRequestV1,
    resultType: WorldLoopResultType
  ): WorldLoopSuccessResponseV1 {
    const response: WorldLoopSuccessResponseV1 = {
      format: WORLD_LOOP_SESSION_FORMAT,
      protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
      ok: true,
      requestId: request.requestId,
      sessionId: request.sessionId,
      sequence: record.sequence,
      resultType,
      view: viewFor(record),
    };
    record.responses.set(request.requestId, { signature: signature(request), response });
    return response;
  }
}
