import { chooseEnemyAction } from '../core/ai';
import { applyAction, getAvailableActions } from '../core/battle';
import { createRng, restoreRng, type SerializableRng } from '../core/random';
import type {
  BattleAction,
  BattleState,
  ExpeditionBeatDefinition,
  ExpeditionExplorationMapDefinition,
  ExpeditionFieldContactAdvantage,
  ExpeditionFieldContactTrigger,
  ExpeditionRecoveryChoice,
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
  chooseOpeningRecovery,
  completeOpeningExploration,
  completeOpeningFieldContactCombat,
  completeOpeningBeatCombat,
  continueOpeningBeat,
  createOpeningExpeditionRuntime,
  currentOpeningBeat,
  failOpeningFieldContactCombat,
  OPENING_EXPEDITION_ID,
  startOpeningBeatCombat,
  startOpeningFieldContactCombat,
  type OpeningExpeditionRuntime,
} from './openingExpeditionScenario';

export const OPENING_SESSION_FORMAT = 'deathstalker-opening-expedition-session';
export const OPENING_SESSION_PROTOCOL_VERSION = 3;
export const OPENING_SCENARIO_ID = OPENING_EXPEDITION_ID;
export const OPENING_CHECKPOINT_FORMAT = 'deathstalker-opening-expedition-checkpoint';
export const OPENING_CHECKPOINT_VERSION = 1;

export type OpeningSessionCommandV1 =
  | { type: 'create_expedition'; scenarioId: typeof OPENING_SCENARIO_ID; seed: number }
  | { type: 'continue' }
  | {
      type: 'complete_exploration';
      mapId: string;
      objectiveLandmarkId: string;
      playerPosition: WorldLoopPoint;
    }
  | {
      type: 'start_field_contact';
      contactId: string;
      trigger: ExpeditionFieldContactTrigger;
      playerPosition: WorldLoopPoint;
    }
  | { type: 'return_to_exploration' }
  | { type: 'apply_action'; action: BattleAction }
  | { type: 'advance_ai' }
  | { type: 'choose_recovery'; choice: ExpeditionRecoveryChoice }
  | { type: 'restart_expedition' };

export interface OpeningSessionRequestV1 {
  format: typeof OPENING_SESSION_FORMAT;
  protocolVersion: typeof OPENING_SESSION_PROTOCOL_VERSION;
  requestId: string;
  sessionId: string;
  expectedSequence: number;
  command: OpeningSessionCommandV1;
}

export type OpeningSessionAwaiting =
  | 'continue'
  | 'field_return'
  | 'player'
  | 'ai'
  | 'choice'
  | 'complete'
  | 'failed';

export interface OpeningBeatViewV1 {
  id: string;
  journeyMovement: string;
  kind: string;
  objectiveKey: string;
  environmentState: string;
  partyIds: string[];
  exploration: ExpeditionExplorationMapDefinition | null;
}

export interface OpeningPartyViewV1 {
  id: string;
  name: string;
  role: string;
  hp: number;
  maxHp: number;
}

export interface OpeningBoundaryTelemetryV1 {
  beatId: string;
  beatIndex: number;
  jobKey: string;
  party: Array<{
    id: string;
    hp: number;
    maxHp: number;
    hpPercentage: number;
  }>;
  inventory: { medkits: number; revives: number };
  recoveryChoice: ExpeditionRecoveryChoice | null;
  encounter: null | {
    id: string;
    status: BattleState['status'];
    turnNumber: number;
    actionCount: number;
  };
}

export interface OpeningSessionViewV1 {
  scenarioId: typeof OPENING_SCENARIO_ID;
  seed: number;
  sequence: number;
  awaiting: OpeningSessionAwaiting;
  beatIndex: number;
  beatCount: number;
  beat: OpeningBeatViewV1;
  party: OpeningPartyViewV1[];
  inventory: { medkits: number; revives: number };
  recoveryChoice: ExpeditionRecoveryChoice | null;
  fieldContactState: {
    activeContactId: string | null;
    clearedContactIds: string[];
    advantage: ExpeditionFieldContactAdvantage | null;
  };
  telemetry: OpeningBoundaryTelemetryV1[];
  encounter: PresentationEncounterV1 | null;
  transition: PresentationTransitionV1 | null;
  legalActions: BattleAction[];
}

export type OpeningSessionResultType =
  | 'expedition_created'
  | 'expedition_resumed'
  | 'beat_advanced'
  | 'exploration_completed'
  | 'field_contact_started'
  | 'field_contact_cleared'
  | 'action_applied'
  | 'ai_action_applied'
  | 'recovery_chosen'
  | 'expedition_restarted';

export interface OpeningSessionSuccessResponseV1 {
  format: typeof OPENING_SESSION_FORMAT;
  protocolVersion: typeof OPENING_SESSION_PROTOCOL_VERSION;
  ok: true;
  requestId: string;
  sessionId: string;
  sequence: number;
  resultType: OpeningSessionResultType;
  view: OpeningSessionViewV1;
}

export type OpeningSessionErrorCode =
  | 'invalid_request'
  | 'unsupported_protocol'
  | 'session_exists'
  | 'session_not_found'
  | 'duplicate_request_conflict'
  | 'stale_sequence'
  | 'illegal_command'
  | 'illegal_action'
  | 'checkpoint_not_found'
  | 'invalid_checkpoint'
  | 'core_failure';

export type OpeningCheckpointCommandV1 = Exclude<
  OpeningSessionCommandV1,
  { type: 'create_expedition' }
>;

export interface OpeningCheckpointV1 {
  format: typeof OPENING_CHECKPOINT_FORMAT;
  checkpointVersion: typeof OPENING_CHECKPOINT_VERSION;
  scenarioId: typeof OPENING_SCENARIO_ID;
  seed: number;
  sequence: number;
  commands: OpeningCheckpointCommandV1[];
}

export interface OpeningSessionErrorResponseV1 {
  format: typeof OPENING_SESSION_FORMAT;
  protocolVersion: typeof OPENING_SESSION_PROTOCOL_VERSION;
  ok: false;
  requestId: string | null;
  sessionId: string | null;
  sequence: number | null;
  error: { code: OpeningSessionErrorCode; message: string };
}

export type OpeningSessionResponseV1 =
  | OpeningSessionSuccessResponseV1
  | OpeningSessionErrorResponseV1;

interface CachedResponse {
  signature: string;
  response: OpeningSessionResponseV1;
}

interface OpeningSessionRecord {
  seed: number;
  sequence: number;
  runtime: OpeningExpeditionRuntime;
  battle: BattleState | null;
  transition: PresentationTransitionV1 | null;
  rng: SerializableRng;
  history: OpeningCheckpointCommandV1[];
  telemetry: OpeningBoundaryTelemetryV1[];
  currentCombatActionCount: number;
  activeFieldContactId: string | null;
  fieldContactAdvantage: ExpeditionFieldContactAdvantage | null;
  responses: Map<string, CachedResponse>;
}

interface ParseFailure {
  code: 'invalid_request' | 'unsupported_protocol';
  message: string;
  requestId: string | null;
  sessionId: string | null;
}

const MAX_CACHED_RESPONSES = 256;
const MAX_CHECKPOINT_COMMANDS = 2048;

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

function safeNonnegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function parsePoint(value: unknown): WorldLoopPoint | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['x', 'y']) ||
    typeof value.x !== 'number' ||
    !Number.isFinite(value.x) ||
    typeof value.y !== 'number' ||
    !Number.isFinite(value.y)
  ) {
    return null;
  }
  return { x: value.x, y: value.y };
}

function parseBattleAction(value: unknown): BattleAction | null {
  if (!isRecord(value) || !nonemptyString(value.type) || !nonemptyString(value.actorId)) {
    return null;
  }
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

function parseCommand(value: unknown): OpeningSessionCommandV1 | null {
  if (!isRecord(value) || !nonemptyString(value.type)) return null;
  switch (value.type) {
    case 'create_expedition':
      return hasExactKeys(value, ['type', 'scenarioId', 'seed']) &&
        value.scenarioId === OPENING_SCENARIO_ID && Number.isSafeInteger(value.seed)
        ? { type: 'create_expedition', scenarioId: OPENING_SCENARIO_ID, seed: value.seed as number }
        : null;
    case 'continue':
      return hasExactKeys(value, ['type']) ? { type: 'continue' } : null;
    case 'complete_exploration': {
      if (!hasExactKeys(value, [
        'type',
        'mapId',
        'objectiveLandmarkId',
        'playerPosition',
      ])) return null;
      const playerPosition = parsePoint(value.playerPosition);
      return nonemptyString(value.mapId) &&
        nonemptyString(value.objectiveLandmarkId) &&
        playerPosition !== null
        ? {
            type: 'complete_exploration',
            mapId: value.mapId,
            objectiveLandmarkId: value.objectiveLandmarkId,
            playerPosition,
          }
        : null;
    }
    case 'start_field_contact': {
      if (!hasExactKeys(value, ['type', 'contactId', 'trigger', 'playerPosition'])) return null;
      const playerPosition = parsePoint(value.playerPosition);
      const trigger = value.trigger;
      return nonemptyString(value.contactId) &&
        (trigger === 'player_strike' ||
          trigger === 'enemy_contact' ||
          trigger === 'mutual_contact') &&
        playerPosition !== null
        ? { type: 'start_field_contact', contactId: value.contactId, trigger, playerPosition }
        : null;
    }
    case 'return_to_exploration':
      return hasExactKeys(value, ['type']) ? { type: 'return_to_exploration' } : null;
    case 'apply_action': {
      if (!hasExactKeys(value, ['type', 'action'])) return null;
      const action = parseBattleAction(value.action);
      return action ? { type: 'apply_action', action } : null;
    }
    case 'advance_ai':
      return hasExactKeys(value, ['type']) ? { type: 'advance_ai' } : null;
    case 'choose_recovery':
      return hasExactKeys(value, ['type', 'choice']) &&
        (value.choice === 'use_medkit' || value.choice === 'continue')
        ? { type: 'choose_recovery', choice: value.choice }
        : null;
    case 'restart_expedition':
      return hasExactKeys(value, ['type']) ? { type: 'restart_expedition' } : null;
    default:
      return null;
  }
}

function parseRequest(value: unknown): OpeningSessionRequestV1 | ParseFailure {
  const requestId = isRecord(value) && nonemptyString(value.requestId) ? value.requestId : null;
  const sessionId = isRecord(value) && nonemptyString(value.sessionId) ? value.sessionId : null;
  if (!isRecord(value) || !hasExactKeys(value, [
    'format',
    'protocolVersion',
    'requestId',
    'sessionId',
    'expectedSequence',
    'command',
  ])) {
    return { code: 'invalid_request', message: 'Request envelope is malformed', requestId, sessionId };
  }
  if (value.format !== OPENING_SESSION_FORMAT || value.protocolVersion !== OPENING_SESSION_PROTOCOL_VERSION) {
    return {
      code: 'unsupported_protocol',
      message: `Expected ${OPENING_SESSION_FORMAT} protocol v${OPENING_SESSION_PROTOCOL_VERSION}`,
      requestId,
      sessionId,
    };
  }
  if (!requestId || !sessionId || !safeNonnegativeInteger(value.expectedSequence)) {
    return {
      code: 'invalid_request',
      message: 'requestId, sessionId, and expectedSequence are invalid',
      requestId,
      sessionId,
    };
  }
  const command = parseCommand(value.command);
  if (!command) {
    return { code: 'invalid_request', message: 'Command is malformed or unsupported', requestId, sessionId };
  }
  return {
    format: OPENING_SESSION_FORMAT,
    protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
    requestId,
    sessionId,
    expectedSequence: value.expectedSequence,
    command,
  };
}

function parseCheckpointCommand(value: unknown): OpeningCheckpointCommandV1 | null {
  const command = parseCommand(value);
  return command === null || command.type === 'create_expedition' ? null : command;
}

function parseCheckpoint(value: unknown): OpeningCheckpointV1 | null {
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
    value.format !== OPENING_CHECKPOINT_FORMAT ||
    value.checkpointVersion !== OPENING_CHECKPOINT_VERSION ||
    value.scenarioId !== OPENING_SCENARIO_ID ||
    !Number.isSafeInteger(value.seed) ||
    !safeNonnegativeInteger(value.sequence) ||
    !Array.isArray(value.commands) ||
    value.commands.length > MAX_CHECKPOINT_COMMANDS ||
    value.sequence !== value.commands.length
  ) {
    return null;
  }
  const commands: OpeningCheckpointCommandV1[] = [];
  for (const candidate of value.commands) {
    const command = parseCheckpointCommand(candidate);
    if (command === null) return null;
    commands.push(command);
  }
  return {
    format: OPENING_CHECKPOINT_FORMAT,
    checkpointVersion: OPENING_CHECKPOINT_VERSION,
    scenarioId: OPENING_SCENARIO_ID,
    seed: value.seed as number,
    sequence: value.sequence,
    commands,
  };
}

function errorResponse(
  code: OpeningSessionErrorCode,
  message: string,
  requestId: string | null,
  sessionId: string | null,
  sequence: number | null
): OpeningSessionErrorResponseV1 {
  return {
    format: OPENING_SESSION_FORMAT,
    protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
    ok: false,
    requestId,
    sessionId,
    sequence,
    error: { code, message },
  };
}

function currentLegalActions(record: OpeningSessionRecord): BattleAction[] {
  const state = record.battle;
  if (!state || state.status !== 'in_progress' || !state.partyIds.includes(state.activeActorId)) {
    return [];
  }
  return getAvailableActions(state, state.activeActorId);
}

function awaiting(record: OpeningSessionRecord): OpeningSessionAwaiting {
  if (record.runtime.journey.status === 'failed') return 'failed';
  if (record.runtime.journey.status === 'completed') return 'complete';
  if (record.activeFieldContactId !== null) {
    const battle = record.battle;
    if (!battle) {
      throw new Error(`Opening field contact '${record.activeFieldContactId}' has no battle state`);
    }
    if (battle.status === 'victory') return 'field_return';
    if (battle.status === 'defeat') return 'failed';
    return battle.partyIds.includes(battle.activeActorId) ? 'player' : 'ai';
  }
  const beat = currentOpeningBeat(record.runtime);
  if (beat.interaction === 'recovery_choice') return 'choice';
  if (beat.interaction === 'continue') return 'continue';
  if (beat.interaction === 'complete') return 'complete';
  const battle = record.battle;
  if (!battle) throw new Error(`Combat beat '${beat.id}' has no authoritative battle state`);
  if (battle.status === 'victory') return 'continue';
  if (battle.status === 'defeat') return 'failed';
  return battle.partyIds.includes(battle.activeActorId) ? 'player' : 'ai';
}

function beatView(beat: ExpeditionBeatDefinition): OpeningBeatViewV1 {
  return {
    id: beat.id,
    journeyMovement: beat.journeyMovement,
    kind: beat.kind,
    objectiveKey: beat.objectiveKey,
    environmentState: beat.environmentState,
    partyIds: [...beat.partyIds],
    exploration: beat.exploration === undefined
      ? null
      : {
          ...beat.exploration,
          bounds: { ...beat.exploration.bounds },
          defaultEntryPosition: { ...beat.exploration.defaultEntryPosition },
          walkableAreas: beat.exploration.walkableAreas.map((area) => ({ ...area })),
          mainRoute: beat.exploration.mainRoute.map((point) => ({ ...point })),
          secondaryRoutes: beat.exploration.secondaryRoutes.map((route) => (
            route.map((point) => ({ ...point }))
          )),
          landmarks: beat.exploration.landmarks.map((landmark) => ({
            ...landmark,
            position: { ...landmark.position },
          })),
          fieldContacts: beat.exploration.fieldContacts.map((contact) => ({
            ...contact,
            position: { ...contact.position },
            facing: { ...contact.facing },
          })),
        },
  };
}

function boundaryTelemetry(record: OpeningSessionRecord): OpeningBoundaryTelemetryV1 {
  const beat = currentOpeningBeat(record.runtime);
  const battle = record.battle;
  return {
    beatId: beat.id,
    beatIndex: record.runtime.journey.currentBeatIndex,
    jobKey: beat.objectiveKey,
    party: beat.partyIds.map((memberId) => {
      const member = record.runtime.party[memberId];
      if (member === undefined) {
        throw new Error(`Opening telemetry party member '${memberId}' is missing`);
      }
      return {
        id: member.id,
        hp: member.stats.hp,
        maxHp: member.stats.maxHp,
        hpPercentage: member.stats.maxHp === 0 ? 0 : member.stats.hp / member.stats.maxHp,
      };
    }),
    inventory: { ...record.runtime.inventory },
    recoveryChoice: record.runtime.journey.recoveryChoice,
    encounter: battle === null
      ? null
      : {
          id: battle.encounterId,
          status: battle.status,
          turnNumber: battle.turnNumber,
          actionCount: record.currentCombatActionCount,
        },
  };
}

function recordCurrentBoundary(record: OpeningSessionRecord): void {
  const telemetry = boundaryTelemetry(record);
  const current = record.telemetry.at(-1);
  if (current?.beatId === telemetry.beatId && current.beatIndex === telemetry.beatIndex) {
    record.telemetry[record.telemetry.length - 1] = telemetry;
  } else {
    record.telemetry.push(telemetry);
  }
}

function cloneBoundaryTelemetry(
  telemetry: OpeningBoundaryTelemetryV1
): OpeningBoundaryTelemetryV1 {
  return {
    ...telemetry,
    party: telemetry.party.map((member) => ({ ...member })),
    inventory: { ...telemetry.inventory },
    encounter: telemetry.encounter === null ? null : { ...telemetry.encounter },
  };
}

function viewFor(record: OpeningSessionRecord): OpeningSessionViewV1 {
  const beat = currentOpeningBeat(record.runtime);
  const activeEncounterId = record.battle?.encounterId ?? beat.encounterId;
  const encounter = activeEncounterId === undefined
    ? null
    : serializeEncounter(record.runtime.encounters[activeEncounterId] ?? (() => {
        throw new Error(`Opening encounter '${activeEncounterId}' is missing`);
      })());
  return {
    scenarioId: OPENING_SCENARIO_ID,
    seed: record.seed,
    sequence: record.sequence,
    awaiting: awaiting(record),
    beatIndex: record.runtime.journey.currentBeatIndex,
    beatCount: record.runtime.definition.beats.length,
    beat: beatView(beat),
    party: beat.partyIds.map((memberId) => {
      const member = record.runtime.party[memberId];
      if (member === undefined) {
        throw new Error(`Opening party member '${memberId}' is missing`);
      }
      return {
        id: member.id,
        name: member.displayName ?? member.name,
        role: member.role,
        hp: member.stats.hp,
        maxHp: member.stats.maxHp,
      };
    }),
    inventory: { ...record.runtime.inventory },
    recoveryChoice: record.runtime.journey.recoveryChoice,
    fieldContactState: {
      activeContactId: record.activeFieldContactId,
      clearedContactIds: [...record.runtime.clearedFieldContactIds],
      advantage: record.fieldContactAdvantage,
    },
    telemetry: record.telemetry.map(cloneBoundaryTelemetry),
    encounter,
    transition: record.transition,
    legalActions: currentLegalActions(record),
  };
}

function enterCurrentBeat(record: OpeningSessionRecord): void {
  const beat = currentOpeningBeat(record.runtime);
  record.currentCombatActionCount = 0;
  record.activeFieldContactId = null;
  record.fieldContactAdvantage = null;
  if (beat.interaction === 'combat') {
    record.battle = startOpeningBeatCombat(
      record.runtime,
      record.seed + record.runtime.journey.currentBeatIndex
    );
    record.transition = { action: null, state: serializeBattleState(record.battle) };
  } else {
    record.battle = null;
    record.transition = null;
  }
  recordCurrentBoundary(record);
}

function actionsEqual(left: BattleAction, right: BattleAction): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function cacheResponse(
  record: OpeningSessionRecord,
  request: OpeningSessionRequestV1,
  response: OpeningSessionResponseV1
): void {
  record.responses.set(request.requestId, { signature: JSON.stringify(request), response });
  while (record.responses.size > MAX_CACHED_RESPONSES) {
    const oldest = record.responses.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    record.responses.delete(oldest);
  }
}

export class OpeningExpeditionHostV1 {
  private readonly sessions = new Map<string, OpeningSessionRecord>();

  exportCheckpoint(sessionId: string): OpeningCheckpointV1 | null {
    const record = this.sessions.get(sessionId);
    if (!record) return null;
    return {
      format: OPENING_CHECKPOINT_FORMAT,
      checkpointVersion: OPENING_CHECKPOINT_VERSION,
      scenarioId: OPENING_SCENARIO_ID,
      seed: record.seed,
      sequence: record.sequence,
      commands: record.history.map((command) => {
        const copy = parseCheckpointCommand(command);
        if (copy === null) throw new Error('Opening checkpoint history became invalid');
        return copy;
      }),
    };
  }

  restoreCheckpoint(
    sessionId: string,
    value: unknown,
    requestId = `${sessionId}-resume`
  ): OpeningSessionResponseV1 {
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
    if (existing) {
      return errorResponse(
        'session_exists',
        'Session already exists',
        requestId,
        sessionId,
        existing.sequence
      );
    }
    if (value === null || value === undefined) {
      return errorResponse(
        'checkpoint_not_found',
        'No saved opening expedition exists',
        requestId,
        sessionId,
        null
      );
    }
    const checkpoint = parseCheckpoint(value);
    if (checkpoint === null) {
      return errorResponse(
        'invalid_checkpoint',
        'Saved opening expedition checkpoint is malformed or unsupported',
        requestId,
        sessionId,
        null
      );
    }
    const record = this.createRecord(checkpoint.seed);
    try {
      for (const command of checkpoint.commands) {
        if (command.type === 'restart_expedition') {
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
    } catch (error) {
      return errorResponse(
        'invalid_checkpoint',
        error instanceof Error
          ? `Saved opening expedition could not be replayed: ${error.message}`
          : 'Saved opening expedition could not be replayed',
        requestId,
        sessionId,
        null
      );
    }
    this.sessions.set(sessionId, record);
    return {
      format: OPENING_SESSION_FORMAT,
      protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
      ok: true,
      requestId,
      sessionId,
      sequence: record.sequence,
      resultType: 'expedition_resumed',
      view: viewFor(record),
    };
  }

  handle(value: unknown): OpeningSessionResponseV1 {
    const parsed = parseRequest(value);
    if ('code' in parsed) {
      return errorResponse(parsed.code, parsed.message, parsed.requestId, parsed.sessionId, null);
    }
    const request = parsed;
    const existing = this.sessions.get(request.sessionId);
    const cached = existing?.responses.get(request.requestId);
    if (cached) {
      return cached.signature === JSON.stringify(request)
        ? cached.response
        : errorResponse(
            'duplicate_request_conflict',
            'requestId was already used for a different request',
            request.requestId,
            request.sessionId,
            existing?.sequence ?? null
          );
    }

    if (request.command.type === 'create_expedition') {
      if (existing) {
        return errorResponse(
          'session_exists',
          'Session already exists',
          request.requestId,
          request.sessionId,
          existing.sequence
        );
      }
      if (request.expectedSequence !== 0) {
        return errorResponse(
          'stale_sequence',
          'A new expedition must start at sequence 0',
          request.requestId,
          request.sessionId,
          null
        );
      }
      const record = this.createRecord(request.command.seed);
      this.sessions.set(request.sessionId, record);
      return this.success(record, request, 'expedition_created');
    }

    if (!existing) {
      return errorResponse(
        'session_not_found',
        'Session does not exist',
        request.requestId,
        request.sessionId,
        null
      );
    }
    if (request.expectedSequence !== existing.sequence) {
      const response = errorResponse(
        'stale_sequence',
        `Expected sequence ${existing.sequence}`,
        request.requestId,
        request.sessionId,
        existing.sequence
      );
      cacheResponse(existing, request, response);
      return response;
    }

    if (request.command.type === 'restart_expedition') {
      this.resetRecord(existing);
      existing.sequence += 1;
      existing.history.push(request.command);
      return this.success(existing, request, 'expedition_restarted');
    }

    try {
      const resultType = this.applyCommand(existing, request.command);
      existing.sequence += 1;
      existing.history.push(request.command);
      return this.success(existing, request, resultType);
    } catch (error) {
      const response = errorResponse(
        error instanceof Error && error.message.startsWith('Illegal ')
          ? 'illegal_command'
          : 'core_failure',
        error instanceof Error ? error.message : 'Authoritative expedition command failed',
        request.requestId,
        request.sessionId,
        existing.sequence
      );
      cacheResponse(existing, request, response);
      return response;
    }
  }

  handleJson(requestJson: string): string {
    try {
      return JSON.stringify(this.handle(JSON.parse(requestJson) as unknown));
    } catch {
      return JSON.stringify(errorResponse(
        'invalid_request',
        'Request is not valid JSON',
        null,
        null,
        null
      ));
    }
  }

  private createRecord(seed: number): OpeningSessionRecord {
    const record: OpeningSessionRecord = {
      seed,
      sequence: 0,
      runtime: createOpeningExpeditionRuntime(),
      battle: null,
      transition: null,
      rng: createRng(seed),
      history: [],
      telemetry: [],
      currentCombatActionCount: 0,
      activeFieldContactId: null,
      fieldContactAdvantage: null,
      responses: new Map(),
    };
    enterCurrentBeat(record);
    return record;
  }

  private resetRecord(record: OpeningSessionRecord): void {
    record.runtime = createOpeningExpeditionRuntime();
    record.battle = null;
    record.transition = null;
    record.rng = createRng(record.seed);
    record.telemetry = [];
    record.currentCombatActionCount = 0;
    record.activeFieldContactId = null;
    record.fieldContactAdvantage = null;
    enterCurrentBeat(record);
  }

  private applyCommand(
    record: OpeningSessionRecord,
    command: Exclude<OpeningSessionCommandV1, { type: 'create_expedition' | 'restart_expedition' }>
  ): OpeningSessionResultType {
    const waitState = awaiting(record);
    if (command.type === 'continue') {
      if (waitState !== 'continue') throw new Error(`Illegal continue while awaiting '${waitState}'`);
      const beat = currentOpeningBeat(record.runtime);
      if (beat.exploration !== undefined) {
        throw new Error(`Illegal continue while exploration map '${beat.exploration.id}' is active`);
      }
      if (record.battle?.status === 'victory') {
        record.runtime = completeOpeningBeatCombat(record.runtime, record.battle);
      } else {
        record.runtime = continueOpeningBeat(record.runtime);
      }
      enterCurrentBeat(record);
      return 'beat_advanced';
    }
    if (command.type === 'complete_exploration') {
      if (waitState !== 'continue' || record.battle !== null) {
        throw new Error(`Illegal exploration completion while awaiting '${waitState}'`);
      }
      record.runtime = completeOpeningExploration(
        record.runtime,
        command.mapId,
        command.objectiveLandmarkId,
        command.playerPosition
      );
      enterCurrentBeat(record);
      return 'exploration_completed';
    }
    if (command.type === 'start_field_contact') {
      if (waitState !== 'continue' || record.battle !== null) {
        throw new Error(`Illegal field contact start while awaiting '${waitState}'`);
      }
      const started = startOpeningFieldContactCombat(
        record.runtime,
        command.contactId,
        command.trigger,
        command.playerPosition,
        record.seed + record.sequence + 1
      );
      record.battle = started.battle;
      record.transition = { action: null, state: serializeBattleState(record.battle) };
      record.activeFieldContactId = command.contactId;
      record.fieldContactAdvantage = started.advantage;
      record.currentCombatActionCount = 0;
      recordCurrentBoundary(record);
      return 'field_contact_started';
    }
    if (command.type === 'return_to_exploration') {
      if (
        waitState !== 'field_return' ||
        record.battle === null ||
        record.activeFieldContactId === null
      ) {
        throw new Error(`Illegal field return while awaiting '${waitState}'`);
      }
      record.runtime = completeOpeningFieldContactCombat(
        record.runtime,
        record.activeFieldContactId,
        record.battle
      );
      record.battle = null;
      record.transition = null;
      record.activeFieldContactId = null;
      record.fieldContactAdvantage = null;
      record.currentCombatActionCount = 0;
      return 'field_contact_cleared';
    }
    if (command.type === 'choose_recovery') {
      if (waitState !== 'choice') throw new Error(`Illegal recovery choice while awaiting '${waitState}'`);
      const recoveryBeat = currentOpeningBeat(record.runtime);
      record.runtime = chooseOpeningRecovery(record.runtime, command.choice);
      const recoveryBoundary = record.telemetry.at(-1);
      if (recoveryBoundary?.beatId !== recoveryBeat.id) {
        throw new Error('Opening recovery boundary telemetry is missing');
      }
      recoveryBoundary.party = recoveryBeat.partyIds.map((memberId) => {
        const member = record.runtime.party[memberId];
        if (member === undefined) {
          throw new Error(`Opening recovery party member '${memberId}' is missing`);
        }
        return {
          id: member.id,
          hp: member.stats.hp,
          maxHp: member.stats.maxHp,
          hpPercentage: member.stats.maxHp === 0 ? 0 : member.stats.hp / member.stats.maxHp,
        };
      });
      recoveryBoundary.inventory = { ...record.runtime.inventory };
      recoveryBoundary.recoveryChoice = command.choice;
      enterCurrentBeat(record);
      return 'recovery_chosen';
    }
    if (command.type === 'advance_ai') {
      if (waitState !== 'ai' || !record.battle) {
        throw new Error(`Illegal AI advance while awaiting '${waitState}'`);
      }
      const workingRng = restoreRng(record.rng.exportState());
      const action = chooseEnemyAction(record.battle, record.battle.activeActorId, workingRng);
      return this.applyBattleAction(record, action, true, workingRng);
    }
    if (command.type === 'apply_action') {
      if (waitState !== 'player' || !record.battle) {
        throw new Error(`Illegal player action while awaiting '${waitState}'`);
      }
      const legalAction = currentLegalActions(record).find((candidate) => (
        actionsEqual(candidate, command.action)
      ));
      if (!legalAction) throw new Error('Illegal player action for the authoritative state');
      return this.applyBattleAction(record, legalAction, false);
    }
    throw new Error(`Illegal command '${(command as { type: string }).type}'`);
  }

  private applyBattleAction(
    record: OpeningSessionRecord,
    action: BattleAction,
    aiAction: boolean,
    suppliedRng?: SerializableRng
  ): OpeningSessionResultType {
    const before = record.battle;
    if (!before) throw new Error('Illegal battle action without an active battle');
    const workingRng = suppliedRng ?? restoreRng(record.rng.exportState());
    const after = applyAction(before, action, workingRng);
    record.battle = after;
    record.rng = workingRng;
    record.currentCombatActionCount += 1;
    record.transition = serializeBattleTransition(before, action, after);
    if (after.status === 'defeat') {
      record.runtime = record.activeFieldContactId === null
        ? completeOpeningBeatCombat(record.runtime, after)
        : failOpeningFieldContactCombat(record.runtime, record.activeFieldContactId, after);
    }
    recordCurrentBoundary(record);
    return aiAction ? 'ai_action_applied' : 'action_applied';
  }

  private success(
    record: OpeningSessionRecord,
    request: OpeningSessionRequestV1,
    resultType: OpeningSessionResultType
  ): OpeningSessionSuccessResponseV1 {
    const response: OpeningSessionSuccessResponseV1 = {
      format: OPENING_SESSION_FORMAT,
      protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
      ok: true,
      requestId: request.requestId,
      sessionId: request.sessionId,
      sequence: record.sequence,
      resultType,
      view: viewFor(record),
    };
    cacheResponse(record, request, response);
    return response;
  }
}
