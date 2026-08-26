import { describe, expect, it } from 'vitest';

import {
  advanceExpeditionJourney,
  currentExpeditionBeat,
  initExpeditionJourney,
} from '../../src/core/expeditionJourney';
import { validateExpeditionJourney } from '../../src/core/validator';
import openingExpeditionData from '../../src/data/opening-expedition.json';

const definition = validateExpeditionJourney(openingExpeditionData);

describe('authoritative opening expedition journey', () => {
  it('advances the approved ten-beat sequence without forcing a recovery item', () => {
    let state = initExpeditionJourney(definition);
    expect(currentExpeditionBeat(state, definition).id).toBe('familiar_virimonde');

    for (let index = 0; index < 5; index += 1) {
      state = advanceExpeditionJourney(state, definition, { type: 'continue' });
    }
    expect(currentExpeditionBeat(state, definition).id).toBe('escape_pod_rescue');

    state = advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'victory',
    });
    state = advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'victory',
    });
    expect(currentExpeditionBeat(state, definition).id).toBe('lake_recovery');

    state = advanceExpeditionJourney(state, definition, { type: 'continue' });
    expect(state.recoveryChoice).toBeNull();

    state = advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'victory',
    });
    expect(state.status).toBe('completed');
    expect(currentExpeditionBeat(state, definition).id).toBe('yacht_safety');
    expect(state.completedBeatIds).toHaveLength(9);
  });

  it('fails on combat defeat and rejects commands for the wrong beat', () => {
    let state = initExpeditionJourney(definition);
    expect(() => advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'victory',
    })).toThrow(/cannot accept/);

    for (let index = 0; index < 5; index += 1) {
      state = advanceExpeditionJourney(state, definition, { type: 'continue' });
    }
    state = advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'defeat',
    });
    expect(state.status).toBe('failed');
    expect(state.currentBeatIndex).toBe(5);
    expect(() => advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'victory',
    })).toThrow(/status is 'failed'/);
  });
});
