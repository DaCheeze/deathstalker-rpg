import { describe, expect, it } from 'vitest';

import {
  WORLD_LOOP_SCENARIO_ID,
  WORLD_LOOP_SESSION_FORMAT,
  WORLD_LOOP_SESSION_PROTOCOL_VERSION,
  WorldLoopHostV1,
  type WorldLoopSessionCommandV1,
  type WorldLoopSuccessResponseV1,
} from '../../src/session/worldLoopProtocol';

function send(
  host: WorldLoopHostV1,
  previous: WorldLoopSuccessResponseV1,
  requestId: string,
  command: Exclude<WorldLoopSessionCommandV1, { type: 'create_world_loop' }>
): WorldLoopSuccessResponseV1 {
  const response = host.handle({
    format: WORLD_LOOP_SESSION_FORMAT,
    protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
    requestId,
    sessionId: 'world-loop-test',
    expectedSequence: previous.sequence,
    command,
  });
  if (!response.ok) throw new Error(response.error.message);
  return response;
}

function resolveBattle(
  host: WorldLoopHostV1,
  initial: WorldLoopSuccessResponseV1,
  prefix: string
): WorldLoopSuccessResponseV1 {
  let response = initial;
  let actionIndex = 0;
  while (response.view.awaiting === 'player' || response.view.awaiting === 'ai') {
    if (response.view.awaiting === 'player') {
      const action = response.view.legalActions.find((candidate) => candidate.type === 'Attack')
        ?? response.view.legalActions[0];
      if (action === undefined) throw new Error('World-loop player turn has no legal action');
      response = send(host, response, `${prefix}-player-${actionIndex}`, {
        type: 'apply_action',
        action,
      });
    } else {
      response = send(host, response, `${prefix}-ai-${actionIndex}`, { type: 'advance_ai' });
    }
    actionIndex += 1;
    if (actionIndex > 100) throw new Error('World-loop battle did not resolve');
  }
  expect(response.view.awaiting).toBe('return');
  return send(host, response, `${prefix}-return`, { type: 'return_to_map' });
}

describe('Godot world-loop protocol', () => {
  it('supports town recovery, shops, persistent chests, discrete fights, and respawning grind', () => {
    const host = new WorldLoopHostV1();
    const created = host.handle({
      format: WORLD_LOOP_SESSION_FORMAT,
      protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
      requestId: 'create',
      sessionId: 'world-loop-test',
      expectedSequence: 0,
      command: { type: 'create_world_loop', scenarioId: WORLD_LOOP_SCENARIO_ID, seed: 230825 },
    });
    if (!created.ok) throw new Error(created.error.message);
    let response = created;
    expect(response.view).toMatchObject({
      awaiting: 'explore',
      location: { id: 'safe_hub', kind: 'town', restAvailable: true, shopAvailable: true },
      campaign: { partyLevel: 1, gold: 300, inventory: { medkits: 4, revives: 2 } },
    });

    response = send(host, response, 'buy-medkit', { type: 'buy_consumable', item: 'medkit' });
    expect(response.view.campaign).toMatchObject({ gold: 250, inventory: { medkits: 5 } });
    response = send(host, response, 'travel-field', { type: 'travel', destinationId: 'field_route' });
    response = send(host, response, 'open-chest', { type: 'open_chest', chestId: 'field_cache_a' });
    expect(response.view.campaign.gold).toBe(290);

    response = send(host, response, 'start-patrol', { type: 'start_encounter', nodeId: 'field_patrol' });
    response = resolveBattle(host, response, 'patrol-one');
    expect(response.view).toMatchObject({
      awaiting: 'explore',
      location: { id: 'field_route' },
      campaign: { xp: 35, gold: 315 },
      encounterVictoryCounts: { field_patrol: 1 },
    });
    expect(response.view.encounter).toBeNull();
    expect(response.view.transition).toBeNull();

    response = send(host, response, 'back-to-hub', { type: 'travel', destinationId: 'safe_hub' });
    response = send(host, response, 'rest', { type: 'rest' });
    expect(response.view.campaign.inventory.medkits).toBe(5);
    expect(response.view.party.every((member) => member.hp === member.maxHp)).toBe(true);
    response = send(host, response, 'return-field', { type: 'travel', destinationId: 'field_route' });
    expect(response.view.interactables).toContainEqual(expect.objectContaining({
      id: 'field_patrol', available: true,
    }));
    expect(response.view.interactables).toContainEqual(expect.objectContaining({
      id: 'field_cache_a', available: false,
    }));
  });

  it('keeps the fixed boss unchanged after optional leveling', () => {
    const bossHp = (grindCount: number): number => {
      const host = new WorldLoopHostV1();
      let response = host.handle({
        format: WORLD_LOOP_SESSION_FORMAT,
        protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
        requestId: `boss-create-${grindCount}`,
        sessionId: 'world-loop-test',
        expectedSequence: 0,
        command: { type: 'create_world_loop', scenarioId: WORLD_LOOP_SCENARIO_ID, seed: 230825 },
      });
      if (!response.ok) throw new Error(response.error.message);
      for (let grind = 0; grind < grindCount; grind += 1) {
        response = send(host, response, `grind-field-${grind}`, { type: 'travel', destinationId: 'field_route' });
        response = send(host, response, `grind-start-${grind}`, { type: 'start_encounter', nodeId: 'field_patrol' });
        response = resolveBattle(host, response, `grind-${grind}`);
        response = send(host, response, `grind-hub-${grind}`, { type: 'travel', destinationId: 'safe_hub' });
        response = send(host, response, `grind-rest-${grind}`, { type: 'rest' });
      }
      response = send(host, response, 'boss-field', { type: 'travel', destinationId: 'field_route' });
      response = send(host, response, 'boss-approach', { type: 'travel', destinationId: 'boss_approach' });
      response = send(host, response, 'boss-start', { type: 'start_encounter', nodeId: 'fixed_boss' });
      const enemy = response.view.transition?.state.combatants.find((combatant) => combatant.side === 'enemy');
      if (enemy === undefined) throw new Error('Boss encounter has no enemy');
      if (grindCount >= 3) expect(response.view.campaign.partyLevel).toBeGreaterThan(1);
      return enemy.maxHp;
    };

    expect(bossHp(3)).toBe(bossHp(0));
  });
});
