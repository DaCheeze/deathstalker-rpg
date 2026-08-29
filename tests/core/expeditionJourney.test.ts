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
  it('validates one connected multi-screen exploration map across the first Separation beats', () => {
    const openingMaps = definition.beats.slice(0, 3).map((beat) => beat.exploration);
    expect(openingMaps.every((map) => map?.id === 'virimonde_standing_grounds')).toBe(true);
    expect(openingMaps.map((map) => map?.objectiveLandmarkId)).toEqual([
      'owen_supplies',
      'old_stone_river',
      'private_flyer',
    ]);
    expect(openingMaps[0]?.bounds).toEqual({ minX: 100, minY: 520, maxX: 3700, maxY: 1500 });
    expect(openingMaps[2]?.mainRoute.at(-1)).toEqual({ x: 3420, y: 900 });
    expect(definition.beats[5]?.exploration).toMatchObject({
      id: 'virimonde_escape_pod_site',
      objectiveLandmarkId: 'owen_execution_site',
      fieldContacts: [expect.objectContaining({
        id: 'imperial_execution_guard',
        required: true,
      })],
    });
    expect(definition.beats.slice(3).map((beat) => beat.exploration?.id)).toEqual([
      'virimonde_windbreak_wreck',
      'virimonde_escape_pod_site',
      'virimonde_escape_pod_site',
      'virimonde_lake_route',
      'virimonde_lake_shore',
      'virimonde_lake_shore',
      'hidden_yacht_observation_deck',
    ]);
    expect(definition.beats[7]?.exploration?.fieldContacts[0]).toMatchObject({
      id: 'lake_route_patrol',
      required: false,
    });
    expect(definition.beats[8]?.exploration?.fieldContacts[0]).toMatchObject({
      id: 'yacht_departure_guard',
      required: true,
    });
  });

  it('advances the approved ten-beat sequence without forcing a recovery item', () => {
    let state = initExpeditionJourney(definition);
    expect(currentExpeditionBeat(state, definition).id).toBe('familiar_virimonde');

    for (let index = 0; index < 9; index += 1) {
      state = advanceExpeditionJourney(state, definition, { type: 'continue' });
    }
    expect(state.recoveryChoice).toBeNull();
    expect(state.status).toBe('in_progress');
    expect(currentExpeditionBeat(state, definition).id).toBe('yacht_safety');
    state = advanceExpeditionJourney(state, definition, { type: 'continue' });
    expect(state.status).toBe('completed');
    expect(currentExpeditionBeat(state, definition).id).toBe('yacht_safety');
    expect(state.completedBeatIds).toHaveLength(10);
  });

  it('rejects direct combat completion because field contacts are separate authority', () => {
    let state = initExpeditionJourney(definition);
    expect(() => advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'victory',
    })).toThrow(/cannot accept/);

    for (let index = 0; index < 5; index += 1) {
      state = advanceExpeditionJourney(state, definition, { type: 'continue' });
    }
    expect(currentExpeditionBeat(state, definition).id).toBe('escape_pod_rescue');
    expect(() => advanceExpeditionJourney(state, definition, {
      type: 'combat_completed',
      outcome: 'defeat',
    })).toThrow(/cannot accept/);
    expect(state.status).toBe('in_progress');
    expect(state.currentBeatIndex).toBe(5);
  });
});
