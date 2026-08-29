import { describe, expect, it } from 'vitest';

import {
  WORLD_LOOP_SCENARIO_ID,
  WORLD_LOOP_SESSION_FORMAT,
  WORLD_LOOP_SESSION_PROTOCOL_VERSION,
  WorldLoopHostV1,
  type WorldLoopSessionCommandV1,
  type WorldLoopSuccessResponseV1,
} from '../../src/session/worldLoopProtocol';
import { createWorldLoopRuntime } from '../../src/session/worldLoopScenario';

function send(
  host: WorldLoopHostV1,
  previous: WorldLoopSuccessResponseV1,
  requestId: string,
  command: Exclude<WorldLoopSessionCommandV1, { type: 'create_world_loop' }>,
  sessionId = 'world-loop-test'
): WorldLoopSuccessResponseV1 {
  const response = host.handle({
    format: WORLD_LOOP_SESSION_FORMAT,
    protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
    requestId,
    sessionId,
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

function fieldPatrolStart(
  trigger: 'player_strike' | 'enemy_contact' | 'mutual_contact' = 'player_strike'
): Extract<WorldLoopSessionCommandV1, { type: 'start_encounter' }> {
  const playerPosition = trigger === 'player_strike'
    ? { x: 1570, y: 900 }
    : trigger === 'enemy_contact'
      ? { x: 1200, y: 900 }
      : { x: 1450, y: 965 };
  return { type: 'start_encounter', nodeId: 'field_patrol', trigger, playerPosition };
}

describe('Godot world-loop protocol', () => {
  it('accepts an injected validated scenario without coupling the host to the proving ID', () => {
    const injectedScenarioId = 'functional_campaign_area_test';
    const host = new WorldLoopHostV1((scenarioId) => {
      if (scenarioId !== injectedScenarioId) throw new Error(`Unknown test scenario '${scenarioId}'`);
      const runtime = createWorldLoopRuntime();
      return {
        ...runtime,
        definition: { ...runtime.definition, id: injectedScenarioId },
        state: { ...runtime.state, loopId: injectedScenarioId },
      };
    });
    const created = host.handle({
      format: WORLD_LOOP_SESSION_FORMAT,
      protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
      requestId: 'injected-create',
      sessionId: 'injected-session',
      expectedSequence: 0,
      command: { type: 'create_world_loop', scenarioId: injectedScenarioId, seed: 230825 },
    });
    expect(created).toMatchObject({
      ok: true,
      resultType: 'world_loop_created',
      view: { scenarioId: injectedScenarioId, location: { id: 'safe_hub' } },
    });
    const unknown = new WorldLoopHostV1().handle({
      format: WORLD_LOOP_SESSION_FORMAT,
      protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
      requestId: 'unknown-create',
      sessionId: 'unknown-session',
      expectedSequence: 0,
      command: { type: 'create_world_loop', scenarioId: injectedScenarioId, seed: 230825 },
    });
    expect(unknown).toMatchObject({ ok: false, error: { code: 'unknown_scenario' } });
  });

  it('exports and deterministically restores a strict authoritative checkpoint', () => {
    const originalHost = new WorldLoopHostV1();
    const created = originalHost.handle({
      format: WORLD_LOOP_SESSION_FORMAT,
      protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
      requestId: 'save-create',
      sessionId: 'world-loop-save-source',
      expectedSequence: 0,
      command: { type: 'create_world_loop', scenarioId: WORLD_LOOP_SCENARIO_ID, seed: 230825 },
    });
    if (!created.ok) throw new Error(created.error.message);
    let original = send(
      originalHost,
      created,
      'save-travel',
      { type: 'travel', destinationId: 'field_route' },
      'world-loop-save-source'
    );
    original = send(
      originalHost,
      original,
      'save-chest',
      { type: 'open_chest', chestId: 'field_cache_a' },
      'world-loop-save-source'
    );
    const checkpoint = originalHost.exportCheckpoint('world-loop-save-source');
    expect(checkpoint).not.toBeNull();
    expect(JSON.parse(JSON.stringify(checkpoint))).toEqual(checkpoint);
    expect(checkpoint?.sequence).toBe(original.sequence);

    const restoredHost = new WorldLoopHostV1();
    const restored = restoredHost.restoreCheckpoint(
      'world-loop-save-restored',
      checkpoint,
      'save-resume'
    );
    expect(restored).toMatchObject({
      ok: true,
      resultType: 'world_loop_resumed',
      sequence: original.sequence,
      view: {
        awaiting: 'explore',
        location: { id: 'field_route' },
        openedChestIds: ['field_cache_a'],
        campaign: { gold: 340 },
      },
    });
    if (!restored.ok) throw new Error(restored.error.message);
    const originalEncounter = send(
      originalHost,
      original,
      'save-original-encounter',
      fieldPatrolStart(),
      'world-loop-save-source'
    );
    const restoredEncounter = send(
      restoredHost,
      restored,
      'save-restored-encounter',
      fieldPatrolStart(),
      'world-loop-save-restored'
    );
    expect(restoredEncounter.view).toEqual(originalEncounter.view);

    const malformed = checkpoint === null
      ? null
      : { ...checkpoint, sequence: checkpoint.sequence + 1 };
    expect(new WorldLoopHostV1().restoreCheckpoint('world-loop-invalid', malformed))
      .toMatchObject({ ok: false, error: { code: 'invalid_checkpoint' } });
  });

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
      explorationAvatar: { id: 'owen', name: 'Owen' },
      location: {
        id: 'safe_hub',
        kind: 'town',
        restAvailable: true,
        shopAvailable: true,
        map: { defaultEntryPosition: { x: 600, y: 930 } },
      },
      campaign: { partyLevel: 1, gold: 300, inventory: { medkits: 4, revives: 2 } },
    });
    expect(response.view.party).toHaveLength(3);

    response = send(host, response, 'buy-medkit', { type: 'buy_consumable', item: 'medkit' });
    expect(response.view.campaign).toMatchObject({ gold: 250, inventory: { medkits: 5 } });
    response = send(host, response, 'travel-field', { type: 'travel', destinationId: 'field_route' });
    expect(response.view.interactables).toContainEqual(expect.objectContaining({
      id: 'field_cache_a',
      position: { x: 900, y: 620 },
      markerVisibility: 'nearby',
    }));
    expect(response.view.interactables).toContainEqual(expect.objectContaining({
      id: 'field_side_patrol',
      position: { x: 2600, y: 1080 },
      available: true,
    }));
    response = send(host, response, 'open-chest', { type: 'open_chest', chestId: 'field_cache_a' });
    expect(response.view.campaign.gold).toBe(290);

    response = send(host, response, 'start-patrol', fieldPatrolStart());
    expect(response.view.fieldContactAdvantage).toBe('player');
    expect(response.view.transition?.state.combatants.find(
      (combatant) => combatant.id === response.view.transition?.state.activeActorId
    )?.side).toBe('party');
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
        response = send(host, response, `grind-start-${grind}`, fieldPatrolStart());
        response = resolveBattle(host, response, `grind-${grind}`);
        response = send(host, response, `grind-hub-${grind}`, { type: 'travel', destinationId: 'safe_hub' });
        response = send(host, response, `grind-rest-${grind}`, { type: 'rest' });
      }
      response = send(host, response, 'boss-field', { type: 'travel', destinationId: 'field_route' });
      response = send(host, response, 'boss-approach', { type: 'travel', destinationId: 'boss_approach' });
      response = send(host, response, 'boss-start', {
        type: 'start_encounter',
        nodeId: 'fixed_boss',
        trigger: 'enemy_contact',
        playerPosition: { x: 2100, y: 720 },
      });
      const enemy = response.view.transition?.state.combatants.find((combatant) => combatant.side === 'enemy');
      if (enemy === undefined) throw new Error('Boss encounter has no enemy');
      if (grindCount >= 3) expect(response.view.campaign.partyLevel).toBeGreaterThan(1);
      return enemy.maxHp;
    };

    expect(bossHp(3)).toBe(bossHp(0));
  });

  it('authoritatively validates player, enemy, and mutual visible-contact initiation', () => {
    for (const trigger of ['player_strike', 'enemy_contact', 'mutual_contact'] as const) {
      const host = new WorldLoopHostV1();
      const sessionId = `world-loop-${trigger}`;
      const created = host.handle({
        format: WORLD_LOOP_SESSION_FORMAT,
        protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
        requestId: `${trigger}-create`,
        sessionId,
        expectedSequence: 0,
        command: { type: 'create_world_loop', scenarioId: WORLD_LOOP_SCENARIO_ID, seed: 230825 },
      });
      if (!created.ok) throw new Error(created.error.message);
      const field = send(
        host,
        created,
        `${trigger}-field`,
        { type: 'travel', destinationId: 'field_route' },
        sessionId
      );
      const started = send(host, field, `${trigger}-start`, fieldPatrolStart(trigger), sessionId);
      expect(started.view.fieldContactAdvantage).toBe(
        trigger === 'player_strike' ? 'player' : trigger === 'enemy_contact' ? 'enemy' : 'normal'
      );
      const active = started.view.transition?.state.combatants.find(
        (combatant) => combatant.id === started.view.transition?.state.activeActorId
      );
      if (trigger !== 'mutual_contact') {
        expect(active?.side).toBe(trigger === 'player_strike' ? 'party' : 'enemy');
      }
    }
  });
});
