import { LiveSessionHostV1 } from '../session/liveSessionProtocol';
import {
  OpeningExpeditionHostV1,
  type OpeningCheckpointV1,
} from '../session/openingExpeditionProtocol';
import {
  WorldLoopHostV1,
  type WorldLoopCheckpointV1,
} from '../session/worldLoopProtocol';

export interface OpeningPersistenceStatusV1 {
  available: boolean;
  checkpointFound: boolean;
  sequence: number | null;
}

export interface OpeningExplorationPresentationCheckpointV1 {
  format: 'deathstalker-opening-exploration-presentation-checkpoint';
  checkpointVersion: 1;
  sequence: number;
  beatId: string;
  mapId: string;
  position: { x: number; y: number };
  suppliesInspected: boolean;
}

export interface WorldLoopPresentationCheckpointV1 {
  format: 'deathstalker-world-loop-presentation-checkpoint';
  checkpointVersion: 1;
  sequence: number;
  locationId: string;
  position: { x: number; y: number };
}

export interface DeathstalkerCoreWebApiV1 {
  handle(requestJson: string): string;
  handleOpeningExpedition(requestJson: string): string;
  resumeOpeningExpedition(sessionId: string): string;
  getOpeningPersistenceStatus(sessionId: string): string;
  saveOpeningPresentationState(sessionId: string, stateJson: string): boolean;
  loadOpeningPresentationState(sessionId: string): string;
  handleWorldLoop(requestJson: string): string;
  resumeWorldLoop(sessionId: string): string;
  getWorldLoopPersistenceStatus(sessionId: string): string;
  saveWorldLoopPresentationState(sessionId: string, stateJson: string): boolean;
  loadWorldLoopPresentationState(sessionId: string): string;
}

const OPENING_STORAGE_PREFIX = 'deathstalker.opening-expedition.v1.';
const OPENING_PRESENTATION_STORAGE_PREFIX = 'deathstalker.opening-exploration-presentation.v1.';
const WORLD_LOOP_STORAGE_PREFIX = 'deathstalker.world-loop.v1.';
const WORLD_LOOP_PRESENTATION_STORAGE_PREFIX = 'deathstalker.world-loop-presentation.v1.';

function openingStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function storageKey(sessionId: string): string {
  return `${OPENING_STORAGE_PREFIX}${sessionId}`;
}

function openingPresentationStorageKey(sessionId: string): string {
  return `${OPENING_PRESENTATION_STORAGE_PREFIX}${sessionId}`;
}

function worldLoopStorageKey(sessionId: string): string {
  return `${WORLD_LOOP_STORAGE_PREFIX}${sessionId}`;
}

function worldLoopPresentationStorageKey(sessionId: string): string {
  return `${WORLD_LOOP_PRESENTATION_STORAGE_PREFIX}${sessionId}`;
}

function readCheckpoint(sessionId: string): unknown | null {
  const storage = openingStorage();
  if (storage === null) return null;
  try {
    const saved = storage.getItem(storageKey(sessionId));
    return saved === null ? null : JSON.parse(saved) as unknown;
  } catch {
    return { invalidStoredCheckpoint: true };
  }
}

function persistCheckpoint(host: OpeningExpeditionHostV1, sessionId: string): boolean {
  const storage = openingStorage();
  const checkpoint = host.exportCheckpoint(sessionId);
  if (storage === null || checkpoint === null) return false;
  try {
    storage.setItem(storageKey(sessionId), JSON.stringify(checkpoint));
    return true;
  } catch {
    return false;
  }
}

function persistenceStatus(sessionId: string): OpeningPersistenceStatusV1 {
  const storage = openingStorage();
  if (storage === null) return { available: false, checkpointFound: false, sequence: null };
  try {
    const saved = storage.getItem(storageKey(sessionId));
    if (saved === null) return { available: true, checkpointFound: false, sequence: null };
    const checkpoint = JSON.parse(saved) as Partial<OpeningCheckpointV1>;
    return {
      available: true,
      checkpointFound: true,
      sequence: Number.isSafeInteger(checkpoint.sequence) ? checkpoint.sequence ?? null : null,
    };
  } catch {
    return { available: true, checkpointFound: true, sequence: null };
  }
}

function readWorldLoopCheckpoint(sessionId: string): unknown | null {
  const storage = openingStorage();
  if (storage === null) return null;
  try {
    const saved = storage.getItem(worldLoopStorageKey(sessionId));
    return saved === null ? null : JSON.parse(saved) as unknown;
  } catch {
    return { invalidStoredCheckpoint: true };
  }
}

function persistWorldLoopCheckpoint(host: WorldLoopHostV1, sessionId: string): boolean {
  const storage = openingStorage();
  const checkpoint = host.exportCheckpoint(sessionId);
  if (storage === null || checkpoint === null) return false;
  try {
    storage.setItem(worldLoopStorageKey(sessionId), JSON.stringify(checkpoint));
    return true;
  } catch {
    return false;
  }
}

function worldLoopPersistenceStatus(sessionId: string): OpeningPersistenceStatusV1 {
  const storage = openingStorage();
  if (storage === null) return { available: false, checkpointFound: false, sequence: null };
  try {
    const saved = storage.getItem(worldLoopStorageKey(sessionId));
    if (saved === null) return { available: true, checkpointFound: false, sequence: null };
    const checkpoint = JSON.parse(saved) as Partial<WorldLoopCheckpointV1>;
    return {
      available: true,
      checkpointFound: true,
      sequence: Number.isSafeInteger(checkpoint.sequence) ? checkpoint.sequence ?? null : null,
    };
  } catch {
    return { available: true, checkpointFound: true, sequence: null };
  }
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}

function parseOpeningPresentationCheckpoint(
  value: unknown
): OpeningExplorationPresentationCheckpointV1 | null {
  if (
    typeof value !== 'object' || value === null || Array.isArray(value) ||
    !exactKeys(value as Record<string, unknown>, [
      'format', 'checkpointVersion', 'sequence', 'beatId', 'mapId', 'position',
      'suppliesInspected',
    ])
  ) return null;
  const checkpoint = value as Record<string, unknown>;
  const position = checkpoint.position;
  if (
    checkpoint.format !== 'deathstalker-opening-exploration-presentation-checkpoint' ||
    checkpoint.checkpointVersion !== 1 ||
    !Number.isSafeInteger(checkpoint.sequence) ||
    (checkpoint.sequence as number) < 0 ||
    typeof checkpoint.beatId !== 'string' || checkpoint.beatId.trim().length === 0 ||
    typeof checkpoint.mapId !== 'string' || checkpoint.mapId.trim().length === 0 ||
    typeof checkpoint.suppliesInspected !== 'boolean' ||
    typeof position !== 'object' || position === null || Array.isArray(position) ||
    !exactKeys(position as Record<string, unknown>, ['x', 'y'])
  ) return null;
  const point = position as Record<string, unknown>;
  if (
    typeof point.x !== 'number' || !Number.isFinite(point.x) ||
    typeof point.y !== 'number' || !Number.isFinite(point.y)
  ) return null;
  return {
    format: 'deathstalker-opening-exploration-presentation-checkpoint',
    checkpointVersion: 1,
    sequence: checkpoint.sequence as number,
    beatId: checkpoint.beatId,
    mapId: checkpoint.mapId,
    position: { x: point.x, y: point.y },
    suppliesInspected: checkpoint.suppliesInspected,
  };
}

function parseWorldLoopPresentationCheckpoint(
  value: unknown
): WorldLoopPresentationCheckpointV1 | null {
  if (
    typeof value !== 'object' || value === null || Array.isArray(value) ||
    !exactKeys(value as Record<string, unknown>, [
      'format', 'checkpointVersion', 'sequence', 'locationId', 'position',
    ])
  ) return null;
  const checkpoint = value as Record<string, unknown>;
  const position = checkpoint.position;
  if (
    checkpoint.format !== 'deathstalker-world-loop-presentation-checkpoint' ||
    checkpoint.checkpointVersion !== 1 ||
    !Number.isSafeInteger(checkpoint.sequence) ||
    (checkpoint.sequence as number) < 0 ||
    typeof checkpoint.locationId !== 'string' ||
    checkpoint.locationId.trim().length === 0 ||
    typeof position !== 'object' || position === null || Array.isArray(position) ||
    !exactKeys(position as Record<string, unknown>, ['x', 'y'])
  ) return null;
  const point = position as Record<string, unknown>;
  if (
    typeof point.x !== 'number' || !Number.isFinite(point.x) ||
    typeof point.y !== 'number' || !Number.isFinite(point.y)
  ) return null;
  return {
    format: 'deathstalker-world-loop-presentation-checkpoint',
    checkpointVersion: 1,
    sequence: checkpoint.sequence as number,
    locationId: checkpoint.locationId,
    position: { x: point.x, y: point.y },
  };
}

export function createDeathstalkerCoreWebApi(): DeathstalkerCoreWebApiV1 {
  const sessionHost = new LiveSessionHostV1();
  const openingExpeditionHost = new OpeningExpeditionHostV1();
  const worldLoopHost = new WorldLoopHostV1();
  return Object.freeze({
    handle(requestJson: string): string {
      return sessionHost.handleJson(requestJson);
    },
    handleOpeningExpedition(requestJson: string): string {
      const responseJson = openingExpeditionHost.handleJson(requestJson);
      try {
        const response = JSON.parse(responseJson) as { ok?: unknown; sessionId?: unknown };
        if (response.ok === true && typeof response.sessionId === 'string') {
          persistCheckpoint(openingExpeditionHost, response.sessionId);
        }
      } catch {
        // The protocol host already returned a deterministic invalid-JSON response.
      }
      return responseJson;
    },
    resumeOpeningExpedition(sessionId: string): string {
      const response = openingExpeditionHost.restoreCheckpoint(
        sessionId,
        readCheckpoint(sessionId)
      );
      if (response.ok) persistCheckpoint(openingExpeditionHost, sessionId);
      return JSON.stringify(response);
    },
    getOpeningPersistenceStatus(sessionId: string): string {
      return JSON.stringify(persistenceStatus(sessionId));
    },
    saveOpeningPresentationState(sessionId: string, stateJson: string): boolean {
      const storage = openingStorage();
      if (storage === null || sessionId.trim().length === 0) return false;
      try {
        const checkpoint = parseOpeningPresentationCheckpoint(JSON.parse(stateJson) as unknown);
        if (checkpoint === null) return false;
        storage.setItem(openingPresentationStorageKey(sessionId), JSON.stringify(checkpoint));
        return true;
      } catch {
        return false;
      }
    },
    loadOpeningPresentationState(sessionId: string): string {
      const storage = openingStorage();
      if (storage === null || sessionId.trim().length === 0) return 'null';
      try {
        const saved = storage.getItem(openingPresentationStorageKey(sessionId));
        if (saved === null) return 'null';
        const checkpoint = parseOpeningPresentationCheckpoint(JSON.parse(saved) as unknown);
        return JSON.stringify(checkpoint);
      } catch {
        return 'null';
      }
    },
    handleWorldLoop(requestJson: string): string {
      const responseJson = worldLoopHost.handleJson(requestJson);
      try {
        const response = JSON.parse(responseJson) as { ok?: unknown; sessionId?: unknown };
        if (response.ok === true && typeof response.sessionId === 'string') {
          persistWorldLoopCheckpoint(worldLoopHost, response.sessionId);
        }
      } catch {
        // The protocol host already returned a deterministic invalid-JSON response.
      }
      return responseJson;
    },
    resumeWorldLoop(sessionId: string): string {
      const response = worldLoopHost.restoreCheckpoint(
        sessionId,
        readWorldLoopCheckpoint(sessionId)
      );
      if (response.ok) persistWorldLoopCheckpoint(worldLoopHost, sessionId);
      return JSON.stringify(response);
    },
    getWorldLoopPersistenceStatus(sessionId: string): string {
      return JSON.stringify(worldLoopPersistenceStatus(sessionId));
    },
    saveWorldLoopPresentationState(sessionId: string, stateJson: string): boolean {
      const storage = openingStorage();
      if (storage === null || sessionId.trim().length === 0) return false;
      try {
        const checkpoint = parseWorldLoopPresentationCheckpoint(JSON.parse(stateJson) as unknown);
        if (checkpoint === null) return false;
        storage.setItem(worldLoopPresentationStorageKey(sessionId), JSON.stringify(checkpoint));
        return true;
      } catch {
        return false;
      }
    },
    loadWorldLoopPresentationState(sessionId: string): string {
      const storage = openingStorage();
      if (storage === null || sessionId.trim().length === 0) return 'null';
      try {
        const saved = storage.getItem(worldLoopPresentationStorageKey(sessionId));
        if (saved === null) return 'null';
        const checkpoint = parseWorldLoopPresentationCheckpoint(JSON.parse(saved) as unknown);
        return JSON.stringify(checkpoint);
      } catch {
        return 'null';
      }
    },
  });
}

export const deathstalkerCoreWebApi = createDeathstalkerCoreWebApi();

const webScope = globalThis as typeof globalThis & {
  DeathstalkerCore?: DeathstalkerCoreWebApiV1;
};

webScope.DeathstalkerCore = deathstalkerCoreWebApi;
