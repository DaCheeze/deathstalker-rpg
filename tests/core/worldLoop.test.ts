import { describe, expect, it } from 'vitest';

import {
  openWorldLoopChest,
  restWorldLoopParty,
  travelWorldLoop,
  validateWorldLoopDefinition,
} from '../../src/core/worldLoop';
import worldLoopData from '../../src/data/world-loop-proving.json';
import { createWorldLoopRuntime } from '../../src/session/worldLoopScenario';

describe('authoritative town-field-boss world loop', () => {
  it('validates connected locations and persistent one-time chests', () => {
    const runtime = createWorldLoopRuntime();
    const definition = validateWorldLoopDefinition(worldLoopData);
    let state = travelWorldLoop(runtime.state, definition, 'field_route');
    state = openWorldLoopChest(state, definition, 'field_cache_a');

    expect(state.currentLocationId).toBe('field_route');
    expect(state.openedChestIds).toEqual(['field_cache_a']);
    expect(state.campaign.gold).toBe(runtime.state.campaign.gold + 40);
    expect(() => openWorldLoopChest(state, definition, 'field_cache_a'))
      .toThrow(/already open/);

    state = travelWorldLoop(state, definition, 'safe_hub');
    state = travelWorldLoop(state, definition, 'field_route');
    expect(state.openedChestIds).toEqual(['field_cache_a']);
  });

  it('restores party condition at the hub without consuming a medkit', () => {
    const runtime = createWorldLoopRuntime();
    const firstId = runtime.state.partyIds[0];
    if (firstId === undefined) throw new Error('World-loop fixture has no party member');
    const damaged = {
      ...runtime.state,
      party: {
        ...runtime.state.party,
        [firstId]: {
          ...runtime.state.party[firstId],
          stats: { ...runtime.state.party[firstId]?.stats, hp: 1 },
        },
      },
    };
    const medkitsBefore = damaged.campaign.reserveInventory.medkits;
    const rested = restWorldLoopParty(
      damaged,
      runtime.definition,
      runtime.partyDefinitions,
      runtime.equipment
    );

    expect(rested.party[firstId]?.stats.hp).toBe(rested.party[firstId]?.stats.maxHp);
    expect(rested.campaign.reserveInventory.medkits).toBe(medkitsBefore);
    expect(rested.restCount).toBe(1);
  });
});
