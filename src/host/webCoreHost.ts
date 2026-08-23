import { LiveSessionHostV1 } from '../session/liveSessionProtocol';

export interface DeathstalkerCoreWebApiV1 {
  handle(requestJson: string): string;
}

const sessionHost = new LiveSessionHostV1();

export const deathstalkerCoreWebApi: DeathstalkerCoreWebApiV1 = Object.freeze({
  handle(requestJson: string): string {
    return sessionHost.handleJson(requestJson);
  },
});

const webScope = globalThis as typeof globalThis & {
  DeathstalkerCore?: DeathstalkerCoreWebApiV1;
};

webScope.DeathstalkerCore = deathstalkerCoreWebApi;
