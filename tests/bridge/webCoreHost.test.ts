import { describe, expect, it } from 'vitest';

import {
  LIVE_SESSION_FORMAT,
  LIVE_SESSION_PROTOCOL_VERSION,
  RANGE_BAND_SCENARIO_ID,
} from '../../src/session/liveSessionProtocol';
import { deathstalkerCoreWebApi } from '../../src/host/webCoreHost';

describe('Godot Web TypeScript host adapter', () => {
  it('exposes the transport-neutral JSON handler on the Web global', () => {
    const response = JSON.parse(deathstalkerCoreWebApi.handle(JSON.stringify({
      format: LIVE_SESSION_FORMAT,
      protocolVersion: LIVE_SESSION_PROTOCOL_VERSION,
      requestId: 'create',
      sessionId: 'web-adapter-test',
      expectedSequence: 0,
      command: {
        type: 'create_session',
        scenarioId: RANGE_BAND_SCENARIO_ID,
        seed: 230823,
      },
    }))) as unknown;

    expect(response).toMatchObject({
      ok: true,
      sequence: 0,
      resultType: 'session_created',
      view: { awaiting: 'player' },
    });
    expect((globalThis as { DeathstalkerCore?: unknown }).DeathstalkerCore).toBe(
      deathstalkerCoreWebApi
    );
  });
});
