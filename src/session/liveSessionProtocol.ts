import { chooseEnemyAction } from '../core/ai';
import { applyAction, getAvailableActions } from '../core/battle';
import { createRng, restoreRng, type SerializableRng } from '../core/random';
import type { BattleAction, BattleState, EncounterDefinition } from '../core/types';
import {
  serializeBattleState,
  serializeBattleTransition,
  serializeEncounter,
  type PresentationEncounterV1,
  type PresentationTransitionV1,
} from '../bridge/presentationBridge';
import { createRangeBandSessionScenario } from './rangeBandScenario';

export const LIVE_SESSION_FORMAT = 'deathstalker-core-session';
export const LIVE_SESSION_PROTOCOL_VERSION = 1;
export const RANGE_BAND_SCENARIO_ID = 'range-band-prototype';

export type LiveSessionCommandV1 =
  | { type: 'create_session'; scenarioId: typeof RANGE_BAND_SCENARIO_ID; seed: number }
  | { type: 'apply_action'; action: BattleAction }
  | { type: 'advance_ai' }
  | { type: 'restart_session' };

export interface LiveSessionRequestV1 {
  format: typeof LIVE_SESSION_FORMAT;
  protocolVersion: typeof LIVE_SESSION_PROTOCOL_VERSION;
  requestId: string;
  sessionId: string;
  expectedSequence: number;
  command: LiveSessionCommandV1;
}

export type LiveSessionResultType =
  | 'session_created'
  | 'action_applied'
  | 'ai_action_applied'
  | 'session_restarted';

export interface LiveSessionViewV1 {
  scenarioId: typeof RANGE_BAND_SCENARIO_ID;
  seed: number;
  sequence: number;
  awaiting: 'player' | 'ai' | 'complete';
  encounter: PresentationEncounterV1;
  transition: PresentationTransitionV1;
  legalActions: BattleAction[];
}

export interface LiveSessionSuccessResponseV1 {
  format: typeof LIVE_SESSION_FORMAT;
  protocolVersion: typeof LIVE_SESSION_PROTOCOL_VERSION;
  ok: true;
  requestId: string;
  sessionId: string;
  sequence: number;
  resultType: LiveSessionResultType;
  view: LiveSessionViewV1;
}

export type LiveSessionErrorCode =
  | 'invalid_request'
  | 'unsupported_protocol'
  | 'session_exists'
  | 'session_not_found'
  | 'duplicate_request_conflict'
  | 'stale_sequence'
  | 'illegal_action'
  | 'not_ai_turn'
  | 'core_failure';

export interface LiveSessionErrorResponseV1 {
  format: typeof LIVE_SESSION_FORMAT;
  protocolVersion: typeof LIVE_SESSION_PROTOCOL_VERSION;
  ok: false;
  requestId: string | null;
  sessionId: string | null;
  sequence: number | null;
  error: {
    code: LiveSessionErrorCode;
    message: string;
  };
}

export type LiveSessionResponseV1 =
  | LiveSessionSuccessResponseV1
  | LiveSessionErrorResponseV1;

interface CachedResponse {
  signature: string;
  response: LiveSessionResponseV1;
}

interface SessionRecord {
  seed: number;
  sequence: number;
  encounter: EncounterDefinition;
  state: BattleState;
  rng: SerializableRng;
  responses: Map<string, CachedResponse>;
}

interface ParseFailure {
  code: 'invalid_request' | 'unsupported_protocol';
  message: string;
  requestId: string | null;
  sessionId: string | null;
}

const MAX_CACHED_RESPONSES = 128;

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
    case 'Advance':
      return hasExactKeys(value, ['type', 'actorId'], ['targetId']) &&
        (value.targetId === undefined || nonemptyString(value.targetId))
        ? value.targetId === undefined
          ? { type: 'Advance', actorId }
          : { type: 'Advance', actorId, targetId: value.targetId }
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
          : {
              type: 'EsperAbility',
              actorId,
              targetId: value.targetId,
              abilityId: value.abilityId,
            }
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

function parseCommand(value: unknown): LiveSessionCommandV1 | null {
  if (!isRecord(value) || !nonemptyString(value.type)) return null;
  switch (value.type) {
    case 'create_session':
      return hasExactKeys(value, ['type', 'scenarioId', 'seed']) &&
        value.scenarioId === RANGE_BAND_SCENARIO_ID &&
        Number.isSafeInteger(value.seed)
        ? { type: 'create_session', scenarioId: RANGE_BAND_SCENARIO_ID, seed: value.seed as number }
        : null;
    case 'apply_action': {
      if (!hasExactKeys(value, ['type', 'action'])) return null;
      const action = parseBattleAction(value.action);
      return action ? { type: 'apply_action', action } : null;
    }
    case 'advance_ai':
      return hasExactKeys(value, ['type']) ? { type: 'advance_ai' } : null;
    case 'restart_session':
      return hasExactKeys(value, ['type']) ? { type: 'restart_session' } : null;
    default:
      return null;
  }
}

function parseRequest(value: unknown): LiveSessionRequestV1 | ParseFailure {
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
  if (value.format !== LIVE_SESSION_FORMAT || value.protocolVersion !== LIVE_SESSION_PROTOCOL_VERSION) {
    return {
      code: 'unsupported_protocol',
      message: `Expected ${LIVE_SESSION_FORMAT} protocol v${LIVE_SESSION_PROTOCOL_VERSION}`,
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
    format: LIVE_SESSION_FORMAT,
    protocolVersion: LIVE_SESSION_PROTOCOL_VERSION,
    requestId,
    sessionId,
    expectedSequence: value.expectedSequence,
    command,
  };
}

function errorResponse(
  code: LiveSessionErrorCode,
  message: string,
  requestId: string | null,
  sessionId: string | null,
  sequence: number | null
): LiveSessionErrorResponseV1 {
  return {
    format: LIVE_SESSION_FORMAT,
    protocolVersion: LIVE_SESSION_PROTOCOL_VERSION,
    ok: false,
    requestId,
    sessionId,
    sequence,
    error: { code, message },
  };
}

function actionsEqual(left: BattleAction, right: BattleAction): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function currentLegalActions(state: BattleState): BattleAction[] {
  if (state.status !== 'in_progress' || !state.partyIds.includes(state.activeActorId)) return [];
  return getAvailableActions(state, state.activeActorId);
}

function awaiting(state: BattleState): LiveSessionViewV1['awaiting'] {
  if (state.status !== 'in_progress') return 'complete';
  return state.partyIds.includes(state.activeActorId) ? 'player' : 'ai';
}

function viewFor(
  record: SessionRecord,
  transition: PresentationTransitionV1
): LiveSessionViewV1 {
  return {
    scenarioId: RANGE_BAND_SCENARIO_ID,
    seed: record.seed,
    sequence: record.sequence,
    awaiting: awaiting(record.state),
    encounter: serializeEncounter(record.encounter),
    transition,
    legalActions: currentLegalActions(record.state),
  };
}

function initialTransition(state: BattleState): PresentationTransitionV1 {
  return { action: null, state: serializeBattleState(state) };
}

function cacheResponse(record: SessionRecord, request: LiveSessionRequestV1, response: LiveSessionResponseV1): void {
  record.responses.set(request.requestId, { signature: JSON.stringify(request), response });
  while (record.responses.size > MAX_CACHED_RESPONSES) {
    const oldest = record.responses.keys().next().value as string | undefined;
    if (oldest === undefined) break;
    record.responses.delete(oldest);
  }
}

/**
 * Transport-neutral authoritative session host. It accepts plain request objects and
 * returns plain response objects; Web, native process, and test adapters own I/O.
 */
export class LiveSessionHostV1 {
  private readonly sessions = new Map<string, SessionRecord>();

  handle(value: unknown): LiveSessionResponseV1 {
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

    if (request.command.type === 'create_session') {
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
          'A new session must start at sequence 0',
          request.requestId,
          request.sessionId,
          null
        );
      }
      const scenario = createRangeBandSessionScenario();
      const record: SessionRecord = {
        seed: request.command.seed,
        sequence: 0,
        encounter: scenario.encounter,
        state: scenario.initialState,
        rng: createRng(request.command.seed),
        responses: new Map(),
      };
      this.sessions.set(request.sessionId, record);
      const response: LiveSessionSuccessResponseV1 = {
        format: LIVE_SESSION_FORMAT,
        protocolVersion: LIVE_SESSION_PROTOCOL_VERSION,
        ok: true,
        requestId: request.requestId,
        sessionId: request.sessionId,
        sequence: record.sequence,
        resultType: 'session_created',
        view: viewFor(record, initialTransition(record.state)),
      };
      cacheResponse(record, request, response);
      return response;
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

    if (request.command.type === 'restart_session') {
      const scenario = createRangeBandSessionScenario();
      existing.sequence += 1;
      existing.encounter = scenario.encounter;
      existing.state = scenario.initialState;
      existing.rng = createRng(existing.seed);
      const response: LiveSessionSuccessResponseV1 = {
        format: LIVE_SESSION_FORMAT,
        protocolVersion: LIVE_SESSION_PROTOCOL_VERSION,
        ok: true,
        requestId: request.requestId,
        sessionId: request.sessionId,
        sequence: existing.sequence,
        resultType: 'session_restarted',
        view: viewFor(existing, initialTransition(existing.state)),
      };
      cacheResponse(existing, request, response);
      return response;
    }

    const before = existing.state;
    let action: BattleAction;
    const workingRng = restoreRng(existing.rng.exportState());
    if (request.command.type === 'advance_ai') {
      if (before.status !== 'in_progress' || before.partyIds.includes(before.activeActorId)) {
        const response = errorResponse(
          'not_ai_turn',
          'The authoritative session is not awaiting an AI action',
          request.requestId,
          request.sessionId,
          existing.sequence
        );
        cacheResponse(existing, request, response);
        return response;
      }
      action = chooseEnemyAction(before, before.activeActorId, workingRng);
    } else if (request.command.type === 'apply_action') {
      const legalActions = currentLegalActions(before);
      const requestedAction = request.command.action;
      const legalAction = legalActions.find((candidate) => actionsEqual(candidate, requestedAction));
      if (!legalAction) {
        const response = errorResponse(
          'illegal_action',
          'Action is not legal for the current authoritative state',
          request.requestId,
          request.sessionId,
          existing.sequence
        );
        cacheResponse(existing, request, response);
        return response;
      }
      action = legalAction;
    } else {
      return errorResponse(
        'invalid_request',
        'Command cannot resolve an action',
        request.requestId,
        request.sessionId,
        existing.sequence
      );
    }

    try {
      const after = applyAction(before, action, workingRng);
      existing.state = after;
      existing.rng = workingRng;
      existing.sequence += 1;
      const response: LiveSessionSuccessResponseV1 = {
        format: LIVE_SESSION_FORMAT,
        protocolVersion: LIVE_SESSION_PROTOCOL_VERSION,
        ok: true,
        requestId: request.requestId,
        sessionId: request.sessionId,
        sequence: existing.sequence,
        resultType: request.command.type === 'advance_ai' ? 'ai_action_applied' : 'action_applied',
        view: viewFor(existing, serializeBattleTransition(before, action, after)),
      };
      cacheResponse(existing, request, response);
      return response;
    } catch {
      const response = errorResponse(
        'core_failure',
        'Authoritative action resolution failed without changing session state',
        request.requestId,
        request.sessionId,
        existing.sequence
      );
      cacheResponse(existing, request, response);
      return response;
    }
  }

  handleJson(requestJson: string): string {
    let request: unknown;
    try {
      request = JSON.parse(requestJson);
    } catch {
      return JSON.stringify(errorResponse(
        'invalid_request',
        'Request is not valid JSON',
        null,
        null,
        null
      ));
    }
    return JSON.stringify(this.handle(request));
  }
}
