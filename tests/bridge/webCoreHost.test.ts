import { describe, expect, it } from 'vitest';

import {
  LIVE_SESSION_FORMAT,
  LIVE_SESSION_PROTOCOL_VERSION,
  RANGE_BAND_SCENARIO_ID,
} from '../../src/session/liveSessionProtocol';
import {
  OPENING_SCENARIO_ID,
  OPENING_SESSION_FORMAT,
  OPENING_SESSION_PROTOCOL_VERSION,
} from '../../src/session/openingExpeditionProtocol';
import {
  createDeathstalkerCoreWebApi,
  deathstalkerCoreWebApi,
} from '../../src/host/webCoreHost';
import {
  WORLD_LOOP_SCENARIO_ID,
  WORLD_LOOP_SESSION_FORMAT,
  WORLD_LOOP_SESSION_PROTOCOL_VERSION,
} from '../../src/session/worldLoopProtocol';

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

  it('exposes the authoritative opening expedition without replacing the combat host', () => {
    const response = JSON.parse(deathstalkerCoreWebApi.handleOpeningExpedition(JSON.stringify({
      format: OPENING_SESSION_FORMAT,
      protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
      requestId: 'opening-create',
      sessionId: 'opening-web-test',
      expectedSequence: 0,
      command: {
        type: 'create_expedition',
        scenarioId: OPENING_SCENARIO_ID,
        seed: 230825,
      },
    }))) as unknown;

    expect(response).toMatchObject({
      ok: true,
      resultType: 'expedition_created',
      view: {
        scenarioId: OPENING_SCENARIO_ID,
        awaiting: 'continue',
        beat: { id: 'familiar_virimonde' },
      },
    });
  });

  it('exposes the authoritative town-field-boss proving loop', () => {
    const response = JSON.parse(deathstalkerCoreWebApi.handleWorldLoop(JSON.stringify({
      format: WORLD_LOOP_SESSION_FORMAT,
      protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
      requestId: 'world-create',
      sessionId: 'world-web-test',
      expectedSequence: 0,
      command: {
        type: 'create_world_loop',
        scenarioId: WORLD_LOOP_SCENARIO_ID,
        seed: 230825,
      },
    }))) as unknown;

    expect(response).toMatchObject({
      ok: true,
      resultType: 'world_loop_created',
      view: {
        scenarioId: WORLD_LOOP_SCENARIO_ID,
        awaiting: 'explore',
        location: { id: 'safe_hub', kind: 'town' },
      },
    });
  });

  it('autosaves and resumes the opening through replaceable Web storage', () => {
    const values = new Map<string, string>();
    const memoryStorage: Storage = {
      get length() { return values.size; },
      clear() { values.clear(); },
      getItem(key: string) { return values.get(key) ?? null; },
      key(index: number) { return [...values.keys()][index] ?? null; },
      removeItem(key: string) { values.delete(key); },
      setItem(key: string, value: string) { values.set(key, value); },
    };
    const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memoryStorage,
    });
    try {
      const firstPage = createDeathstalkerCoreWebApi();
      const created = JSON.parse(firstPage.handleOpeningExpedition(JSON.stringify({
        format: OPENING_SESSION_FORMAT,
        protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
        requestId: 'persist-create',
        sessionId: 'opening-persist-test',
        expectedSequence: 0,
        command: {
          type: 'create_expedition',
          scenarioId: OPENING_SCENARIO_ID,
          seed: 230825,
        },
      }))) as { sequence: number };
      const advanced = JSON.parse(firstPage.handleOpeningExpedition(JSON.stringify({
        format: OPENING_SESSION_FORMAT,
        protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
        requestId: 'persist-continue',
        sessionId: 'opening-persist-test',
        expectedSequence: created.sequence,
        command: { type: 'continue' },
      }))) as { sequence: number };
      expect(JSON.parse(firstPage.getOpeningPersistenceStatus('opening-persist-test')))
        .toEqual({ available: true, checkpointFound: true, sequence: advanced.sequence });

      const reloadedPage = createDeathstalkerCoreWebApi();
      expect(JSON.parse(reloadedPage.resumeOpeningExpedition('opening-persist-test')))
        .toMatchObject({
          ok: true,
          sequence: advanced.sequence,
          resultType: 'expedition_resumed',
          view: { beat: { id: 'death_order' }, awaiting: 'continue' },
        });
    } finally {
      if (originalDescriptor === undefined) {
        delete (globalThis as { localStorage?: Storage }).localStorage;
      } else {
        Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
      }
    }
  });
});
