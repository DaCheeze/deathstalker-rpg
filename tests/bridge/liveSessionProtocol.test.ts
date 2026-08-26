import { describe, expect, it } from 'vitest';

import {
  LIVE_SESSION_FORMAT,
  LIVE_SESSION_PROTOCOL_VERSION,
  LiveSessionHostV1,
  RANGE_BAND_SCENARIO_ID,
  type LiveSessionRequestV1,
  type LiveSessionSuccessResponseV1,
} from '../../src/session/liveSessionProtocol';
import { createRng, restoreRng } from '../../src/core/random';

function request(
  requestId: string,
  expectedSequence: number,
  command: LiveSessionRequestV1['command']
): LiveSessionRequestV1 {
  return {
    format: LIVE_SESSION_FORMAT,
    protocolVersion: LIVE_SESSION_PROTOCOL_VERSION,
    requestId,
    sessionId: 'test-session',
    expectedSequence,
    command,
  };
}

function requireSuccess(value: ReturnType<LiveSessionHostV1['handle']>): LiveSessionSuccessResponseV1 {
  expect(value.ok).toBe(true);
  if (!value.ok) throw new Error(`Expected success, received ${value.error.code}`);
  return value;
}

describe('live TypeScript session protocol v1', () => {
  it('creates a deterministic player-facing session with no rules or RNG leakage', () => {
    const host = new LiveSessionHostV1();
    const response = requireSuccess(host.handle(request('create', 0, {
      type: 'create_session',
      scenarioId: RANGE_BAND_SCENARIO_ID,
      seed: 230823,
    })));

    expect(response.sequence).toBe(0);
    expect(response.resultType).toBe('session_created');
    expect(response.view.awaiting).toBe('player');
    expect(response.view.transition.action).toBeNull();
    expect(response.view.legalActions.length).toBeGreaterThan(0);
    expect(response.view.legalActions.some((action) => action.type === 'Attack')).toBe(true);
    expect(response.view.legalActions.some((action) => action.type === 'Advance')).toBe(false);
    expect(response.view.transition.state.combatants.every((combatant) => (
      combatant.range?.band === 'engaged'
    ))).toBe(true);
    expect(response.view.transition.state).not.toHaveProperty('rules');
    expect(response.view).not.toHaveProperty('rng');
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });

  it('resolves player and AI turns while the sequence remains authoritative', () => {
    const host = new LiveSessionHostV1();
    let response = requireSuccess(host.handle(request('create', 0, {
      type: 'create_session',
      scenarioId: RANGE_BAND_SCENARIO_ID,
      seed: 230823,
    })));

    for (let sequence = 1; sequence <= 8; sequence += 1) {
      const command: LiveSessionRequestV1['command'] = response.view.awaiting === 'player'
        ? {
            type: 'apply_action',
            action: response.view.legalActions[0] ?? (() => {
              throw new Error('Player turn had no legal action');
            })(),
          }
        : { type: 'advance_ai' };
      response = requireSuccess(host.handle(request(`step-${sequence}`, sequence - 1, command)));
      expect(response.sequence).toBe(sequence);
      expect(response.view.sequence).toBe(sequence);
      expect(response.view.transition.action).not.toBeNull();
    }
  });

  it('completes the direct-engagement session without exposing movement turns', () => {
    const host = new LiveSessionHostV1();
    let response = requireSuccess(host.handle(request('direct-create', 0, {
      type: 'create_session',
      scenarioId: RANGE_BAND_SCENARIO_ID,
      seed: 230823,
    })));
    let sequence = 0;

    while (response.view.awaiting !== 'complete' && sequence < 160) {
      expect(response.view.legalActions.some((action) => action.type === 'Advance')).toBe(false);
      const command: LiveSessionRequestV1['command'] = response.view.awaiting === 'player'
        ? {
            type: 'apply_action',
            action: response.view.legalActions.find((action) => action.type === 'Attack')
              ?? response.view.legalActions[0]
              ?? (() => { throw new Error('Player turn had no legal action'); })(),
          }
        : { type: 'advance_ai' };
      const expectedSequence = response.sequence;
      sequence += 1;
      response = requireSuccess(host.handle(request(`direct-${sequence}`, expectedSequence, command)));
    }

    expect(response.view.awaiting).toBe('complete');
    expect(sequence).toBeLessThan(160);
  });

  it('deduplicates retries and rejects conflicting or stale requests without advancing state', () => {
    const host = new LiveSessionHostV1();
    const createRequest = request('create', 0, {
      type: 'create_session',
      scenarioId: RANGE_BAND_SCENARIO_ID,
      seed: 230823,
    });
    const created = requireSuccess(host.handle(createRequest));
    expect(host.handle(createRequest)).toEqual(created);

    const action = created.view.legalActions[0];
    if (!action) throw new Error('Expected a legal opening action');
    const actionRequest = request('step', 0, { type: 'apply_action', action });
    const applied = requireSuccess(host.handle(actionRequest));
    expect(host.handle(actionRequest)).toEqual(applied);

    const conflict = host.handle(request('step', 1, { type: 'restart_session' }));
    expect(conflict).toMatchObject({ ok: false, sequence: 1, error: { code: 'duplicate_request_conflict' } });

    const stale = host.handle(request('stale', 0, { type: 'restart_session' }));
    expect(stale).toMatchObject({ ok: false, sequence: 1, error: { code: 'stale_sequence' } });
    expect(host.handle(request('stale', 0, { type: 'restart_session' }))).toEqual(stale);
  });

  it('rejects malformed envelopes, illegal player actions, and AI requests on player turns', () => {
    const host = new LiveSessionHostV1();
    expect(host.handle({ format: LIVE_SESSION_FORMAT })).toMatchObject({
      ok: false,
      error: { code: 'invalid_request' },
    });
    expect(JSON.parse(host.handleJson('{'))).toMatchObject({
      ok: false,
      error: { code: 'invalid_request' },
    });

    requireSuccess(host.handle(request('create', 0, {
      type: 'create_session',
      scenarioId: RANGE_BAND_SCENARIO_ID,
      seed: 230823,
    })));
    expect(host.handle(request('ai-too-soon', 0, { type: 'advance_ai' }))).toMatchObject({
      ok: false,
      sequence: 0,
      error: { code: 'not_ai_turn' },
    });
    expect(host.handle(request('illegal', 0, {
      type: 'apply_action',
      action: { type: 'PassTurn', actorId: 'not-the-active-actor' },
    }))).toMatchObject({
      ok: false,
      sequence: 0,
      error: { code: 'illegal_action' },
    });
  });

  it('restarts from the same deterministic state while keeping sequence numbers monotonic', () => {
    const host = new LiveSessionHostV1();
    const created = requireSuccess(host.handle(request('create', 0, {
      type: 'create_session',
      scenarioId: RANGE_BAND_SCENARIO_ID,
      seed: 230823,
    })));
    const action = created.view.legalActions[0];
    if (!action) throw new Error('Expected a legal opening action');
    const first = requireSuccess(host.handle(request('first', 0, { type: 'apply_action', action })));
    const restarted = requireSuccess(host.handle(request('restart', 1, { type: 'restart_session' })));
    const second = requireSuccess(host.handle(request('second', 2, { type: 'apply_action', action })));

    expect(restarted.sequence).toBe(2);
    expect(restarted.view.transition.state.turnNumber).toBe(created.view.transition.state.turnNumber);
    expect(second.view.transition).toEqual(first.view.transition);
  });
});

describe('serializable deterministic RNG', () => {
  it('restores the exact next value from an exported cursor', () => {
    const rng = createRng(230823);
    rng();
    rng();
    const restored = restoreRng(rng.exportState());
    expect(restored()).toBe(rng());
    expect(restored.exportState()).toEqual(rng.exportState());
  });

  it('rejects invalid cursor state', () => {
    expect(() => restoreRng({ algorithm: 'mulberry32', state: -1 })).toThrow(/Invalid/);
  });
});
