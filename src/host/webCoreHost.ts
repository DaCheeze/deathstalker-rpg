import { LiveSessionHostV1 } from '../session/liveSessionProtocol';
import {
  OpeningExpeditionHostV1,
  type OpeningCheckpointV1,
} from '../session/openingExpeditionProtocol';
import { WorldLoopHostV1 } from '../session/worldLoopProtocol';

export interface OpeningPersistenceStatusV1 {
  available: boolean;
  checkpointFound: boolean;
  sequence: number | null;
}

export interface DeathstalkerCoreWebApiV1 {
  handle(requestJson: string): string;
  handleOpeningExpedition(requestJson: string): string;
  resumeOpeningExpedition(sessionId: string): string;
  getOpeningPersistenceStatus(sessionId: string): string;
  handleWorldLoop(requestJson: string): string;
}

const OPENING_STORAGE_PREFIX = 'deathstalker.opening-expedition.v1.';

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
    handleWorldLoop(requestJson: string): string {
      return worldLoopHost.handleJson(requestJson);
    },
  });
}

export const deathstalkerCoreWebApi = createDeathstalkerCoreWebApi();

const webScope = globalThis as typeof globalThis & {
  DeathstalkerCore?: DeathstalkerCoreWebApiV1;
};

webScope.DeathstalkerCore = deathstalkerCoreWebApi;
