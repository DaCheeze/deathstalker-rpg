import { describe, expect, it } from 'vitest';

import {
  OPENING_SCENARIO_ID,
  OPENING_SESSION_FORMAT,
  OPENING_SESSION_PROTOCOL_VERSION,
  OpeningExpeditionHostV1,
  type OpeningSessionCommandV1,
  type OpeningSessionRequestV1,
  type OpeningSessionSuccessResponseV1,
} from '../../src/session/openingExpeditionProtocol';

function request(
  requestId: string,
  expectedSequence: number,
  command: OpeningSessionCommandV1,
  sessionId = 'opening-test'
): OpeningSessionRequestV1 {
  return {
    format: OPENING_SESSION_FORMAT,
    protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
    requestId,
    sessionId,
    expectedSequence,
    command,
  };
}

function requireSuccess(
  value: ReturnType<OpeningExpeditionHostV1['handle']>
): OpeningSessionSuccessResponseV1 {
  expect(value.ok).toBe(true);
  if (!value.ok) throw new Error(`${value.error.code}: ${value.error.message}`);
  return value;
}

function send(
  host: OpeningExpeditionHostV1,
  response: OpeningSessionSuccessResponseV1,
  label: string,
  command: OpeningSessionCommandV1,
  sessionId = 'opening-test'
): OpeningSessionSuccessResponseV1 {
  return requireSuccess(host.handle(request(label, response.sequence, command, sessionId)));
}

function continueBoundaryCommand(
  response: OpeningSessionSuccessResponseV1
): OpeningSessionCommandV1 {
  const map = response.view.beat.exploration;
  if (map === null) return { type: 'continue' };
  const objective = map.landmarks.find((landmark) => landmark.id === map.objectiveLandmarkId);
  if (objective === undefined) {
    throw new Error(`Opening map '${map.id}' is missing objective '${map.objectiveLandmarkId}'`);
  }
  return {
    type: 'complete_exploration',
    mapId: map.id,
    objectiveLandmarkId: map.objectiveLandmarkId,
    playerPosition: { ...objective.position },
  };
}

function startFirstFieldContact(
  host: OpeningExpeditionHostV1,
  response: OpeningSessionSuccessResponseV1,
  label: string,
  sessionId = 'opening-test'
): OpeningSessionSuccessResponseV1 {
  const map = response.view.beat.exploration;
  const contact = map?.fieldContacts[0];
  if (map === null || contact === undefined) {
    throw new Error(`Opening beat '${response.view.beat.id}' has no field contact`);
  }
  const approachDistance = contact.fieldStrikeRange * 0.75;
  return send(host, response, label, {
    type: 'start_field_contact',
    contactId: contact.id,
    trigger: 'player_strike',
    playerPosition: {
      x: contact.position.x - contact.facing.x * approachDistance,
      y: contact.position.y - contact.facing.y * approachDistance,
    },
  }, sessionId);
}

function reachRescueExploration(
  host: OpeningExpeditionHostV1,
  sessionId: string
): OpeningSessionSuccessResponseV1 {
  let response = requireSuccess(host.handle(request(`${sessionId}-create`, 0, {
    type: 'create_expedition',
    scenarioId: OPENING_SCENARIO_ID,
    seed: 230825,
  }, sessionId)));
  for (let beat = 0; beat < 5; beat += 1) {
    response = send(
      host,
      response,
      `${sessionId}-beat-${beat}`,
      continueBoundaryCommand(response),
      sessionId
    );
  }
  expect(response.view.beat.id).toBe('escape_pod_rescue');
  return response;
}

function resolveCurrentCombat(
  host: OpeningExpeditionHostV1,
  initial: OpeningSessionSuccessResponseV1,
  label: string,
  sessionId = 'opening-test'
): OpeningSessionSuccessResponseV1 {
  let response = initial;
  for (
    let actionIndex = 0;
    actionIndex < 160 &&
      response.view.awaiting !== 'continue' &&
      response.view.awaiting !== 'field_return';
    actionIndex += 1
  ) {
    expect(response.view.awaiting === 'player' || response.view.awaiting === 'ai').toBe(true);
    const state = response.view.transition?.state;
    const injuredPartyMember = state?.combatants
      .filter((combatant) => (
        combatant.side === 'party' && combatant.alive && combatant.hp / combatant.maxHp <= 0.5
      ))
      .sort((left, right) => (
        left.hp / left.maxHp - right.hp / right.maxHp || left.id.localeCompare(right.id)
      ))[0];
    const recoveryAction = injuredPartyMember === undefined
      ? undefined
      : response.view.legalActions.find((action) => (
          action.type === 'UseMedkit' && action.targetId === injuredPartyMember.id
        ));
    const command: OpeningSessionCommandV1 = response.view.awaiting === 'player'
      ? {
          type: 'apply_action',
          action: recoveryAction
            ?? response.view.legalActions.find((action) => action.type === 'Attack')
            ?? response.view.legalActions[0]
            ?? (() => { throw new Error('Opening player turn exposed no legal action'); })(),
        }
      : { type: 'advance_ai' };
    response = send(host, response, `${label}-${actionIndex}`, command, sessionId);
    expect(response.view.legalActions.some((action) => action.type === 'Advance')).toBe(false);
    if (response.view.awaiting === 'failed') {
      throw new Error(
        `Opening combat '${label}' failed under deterministic acceptance strategy: ${JSON.stringify({
          party: response.view.party,
          inventory: response.view.inventory,
          combatants: response.view.transition?.state.combatants,
        })}`
      );
    }
  }
  expect(['continue', 'field_return']).toContain(response.view.awaiting);
  return response;
}

describe('opening expedition session protocol v3', () => {
  it('plays the complete source-aligned opening through temporary safety', () => {
    const host = new OpeningExpeditionHostV1();
    let response = requireSuccess(host.handle(request('create', 0, {
      type: 'create_expedition',
      scenarioId: OPENING_SCENARIO_ID,
      seed: 230825,
    })));

    expect(response.view.beat.id).toBe('familiar_virimonde');
    expect(response.view.awaiting).toBe('continue');
    expect(response.view.transition).toBeNull();
    expect(response.view.party.map((member) => member.id)).toEqual(['owen']);
    expect(response.view.beat.exploration).toMatchObject({
      id: 'virimonde_standing_grounds',
      objectiveLandmarkId: 'owen_supplies',
    });

    for (let beat = 0; beat < 2; beat += 1) {
      response = send(host, response, `opening-beat-${beat}`, continueBoundaryCommand(response));
      expect(response.view.beat.exploration?.id).toBe('virimonde_standing_grounds');
    }
    expect(response.view.beat.id).toBe('standing_escape');
    expect(response.view.beat.exploration?.objectiveLandmarkId).toBe('private_flyer');
    response = send(host, response, 'opening-beat-2', continueBoundaryCommand(response));
    expect(response.view.beat.id).toBe('flyer_last_stand');
    expect(response.view.beat.exploration).toMatchObject({
      id: 'virimonde_windbreak_wreck',
      objectiveLandmarkId: 'windbreak_tree',
    });
    expect(response.view.party).toEqual([
      expect.objectContaining({ id: 'owen', hp: 90, maxHp: 120 }),
    ]);
    for (let beat = 3; beat < 5; beat += 1) {
      response = send(host, response, `opening-beat-${beat}`, continueBoundaryCommand(response));
    }
    expect(response.view.beat.id).toBe('escape_pod_rescue');
    expect(response.view.beat.partyIds).toEqual(['hazel']);
    expect(response.view.party.map((member) => member.id)).toEqual(['hazel']);
    expect(response.view.party.find((member) => member.id === 'hazel')?.role)
      .toBe('Clonelegger / Smuggler / Pirate');
    expect(response.view.transition).toBeNull();
    expect(response.view.fieldContactState).toEqual({
      activeContactId: null,
      clearedContactIds: [],
      advantage: null,
    });

    response = startFirstFieldContact(host, response, 'start-rescue-contact');
    expect(response.resultType).toBe('field_contact_started');
    expect(response.view.fieldContactState).toMatchObject({
      activeContactId: 'imperial_execution_guard',
      advantage: 'player',
    });
    expect(response.view.transition?.state.activeActorId).toBe('hazel');
    response = resolveCurrentCombat(host, response, 'rescue');
    expect(response.view.awaiting).toBe('field_return');
    response = send(host, response, 'return-from-rescue', { type: 'return_to_exploration' });
    expect(response.view.fieldContactState.clearedContactIds)
      .toContain('imperial_execution_guard');
    response = send(host, response, 'leave-rescue', continueBoundaryCommand(response));
    expect(response.view.beat.id).toBe('flight_to_lake');
    expect(response.view.beat.partyIds).toEqual(['owen', 'hazel']);
    expect(response.view.party.map((member) => member.id)).toEqual(['owen', 'hazel']);

    response = send(host, response, 'leave-flight', continueBoundaryCommand(response));
    expect(response.view.beat.id).toBe('lake_recovery');
    expect(response.view.awaiting).toBe('continue');

    response = startFirstFieldContact(host, response, 'start-optional-lake-contact');
    expect(response.view.fieldContactState).toMatchObject({
      activeContactId: 'lake_route_patrol',
      advantage: 'player',
    });
    response = resolveCurrentCombat(host, response, 'lake-patrol');
    response = send(host, response, 'return-from-lake-patrol', {
      type: 'return_to_exploration',
    });
    const recoveryInventoryBefore = response.view.inventory.medkits;
    const recoveryHpBefore = response.view.party.reduce((total, member) => total + member.hp, 0);

    response = send(host, response, 'lake-continue', continueBoundaryCommand(response));
    expect(response.view.beat.id).toBe('hidden_yacht_departure');
    expect(response.view.recoveryChoice).toBeNull();
    expect(response.view.inventory.medkits).toBe(recoveryInventoryBefore);
    expect(response.view.party.reduce((total, member) => total + member.hp, 0))
      .toBe(recoveryHpBefore);

    response = startFirstFieldContact(host, response, 'start-departure-contact');
    response = resolveCurrentCombat(host, response, 'departure');
    response = send(host, response, 'return-from-departure', {
      type: 'return_to_exploration',
    });
    response = send(host, response, 'leave-departure', continueBoundaryCommand(response));
    expect(response.view.beat.id).toBe('yacht_safety');
    expect(response.view.awaiting).toBe('continue');
    expect(response.view.beat.exploration?.id).toBe('hidden_yacht_observation_deck');
    response = send(host, response, 'finish-yacht-safety', continueBoundaryCommand(response));
    expect(response.view.awaiting).toBe('complete');
    expect(response.view.beatIndex).toBe(9);
    expect(response.view.party.every((member) => member.hp > 0)).toBe(true);
    expect(response.view.telemetry.map((boundary) => boundary.beatId)).toEqual([
      'familiar_virimonde',
      'death_order',
      'standing_escape',
      'flyer_last_stand',
      'escape_pod_crash',
      'escape_pod_rescue',
      'flight_to_lake',
      'lake_recovery',
      'hidden_yacht_departure',
      'yacht_safety',
    ]);
    expect(response.view.telemetry.every((boundary) => boundary.jobKey.startsWith('opening.')))
      .toBe(true);
    expect(response.view.telemetry
      .filter((boundary) => boundary.encounter !== null)
      .map((boundary) => boundary.encounter))
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'opening_escape_pod_rescue', status: 'victory' }),
        expect.objectContaining({ id: 'opening_flight_to_lake', status: 'victory' }),
        expect.objectContaining({ id: 'opening_hidden_yacht_departure', status: 'victory' }),
      ]));
    expect(response.view.telemetry
      .filter((boundary) => boundary.encounter !== null)
      .every((boundary) => (boundary.encounter?.actionCount ?? 0) > 0))
      .toBe(true);
    expect(response.view.telemetry[7]).toMatchObject({
      beatId: 'lake_recovery',
      recoveryChoice: null,
    });
    expect(JSON.parse(JSON.stringify(response))).toEqual(response);
  });

  it('rejects commands at the wrong boundary and restarts deterministically', () => {
    const host = new OpeningExpeditionHostV1();
    const created = requireSuccess(host.handle(request('create', 0, {
      type: 'create_expedition',
      scenarioId: OPENING_SCENARIO_ID,
      seed: 230825,
    })));
    expect(host.handle(request('bad-action', 0, { type: 'advance_ai' }))).toMatchObject({
      ok: false,
      sequence: 0,
      error: { code: 'illegal_command' },
    });
    const restarted = requireSuccess(host.handle(request('restart', 0, {
      type: 'restart_expedition',
    })));
    expect(restarted.sequence).toBe(1);
    expect(restarted.view.beat).toEqual(created.view.beat);
    expect(restarted.view.party).toEqual(created.view.party);
    expect(restarted.view.inventory).toEqual(created.view.inventory);
  });

  it('carries enemy detection and mutual contact into authoritative opening state', () => {
    const enemyHost = new OpeningExpeditionHostV1();
    let enemyResponse = reachRescueExploration(enemyHost, 'opening-enemy-contact');
    const enemyContact = enemyResponse.view.beat.exploration?.fieldContacts[0]
      ?? (() => { throw new Error('Enemy-contact test has no field contact'); })();
    enemyResponse = send(enemyHost, enemyResponse, 'enemy-detected', {
      type: 'start_field_contact',
      contactId: enemyContact.id,
      trigger: 'enemy_contact',
      playerPosition: {
        x: enemyContact.position.x + enemyContact.facing.x * 100,
        y: enemyContact.position.y + enemyContact.facing.y * 100,
      },
    }, 'opening-enemy-contact');
    expect(enemyResponse.view.fieldContactState.advantage).toBe('enemy');
    expect(enemyResponse.view.transition?.state.activeActorId).toBe('opening_guard_a');

    const mutualHost = new OpeningExpeditionHostV1();
    let mutualResponse = reachRescueExploration(mutualHost, 'opening-mutual-contact');
    const mutualContact = mutualResponse.view.beat.exploration?.fieldContacts[0]
      ?? (() => { throw new Error('Mutual-contact test has no field contact'); })();
    mutualResponse = send(mutualHost, mutualResponse, 'mutual-collision', {
      type: 'start_field_contact',
      contactId: mutualContact.id,
      trigger: 'mutual_contact',
      playerPosition: {
        x: mutualContact.position.x - mutualContact.facing.x * 35,
        y: mutualContact.position.y - mutualContact.facing.y * 35,
      },
    }, 'opening-mutual-contact');
    expect(mutualResponse.view.fieldContactState.advantage).toBe('normal');
  });

  it('exports and deterministically restores a strict mid-combat checkpoint', () => {
    const originalHost = new OpeningExpeditionHostV1();
    let original = requireSuccess(originalHost.handle(request('save-create', 0, {
      type: 'create_expedition',
      scenarioId: OPENING_SCENARIO_ID,
      seed: 230825,
    }, 'opening-save-source')));
    for (let beat = 0; beat < 5; beat += 1) {
      original = requireSuccess(originalHost.handle(request(
        `save-beat-${beat}`,
        original.sequence,
        continueBoundaryCommand(original),
        'opening-save-source'
      )));
    }
    original = startFirstFieldContact(
      originalHost,
      original,
      'save-start-rescue-contact',
      'opening-save-source'
    );
    const firstCombatCommand: OpeningSessionCommandV1 = original.view.awaiting === 'player'
      ? {
          type: 'apply_action',
          action: original.view.legalActions[0]
            ?? (() => { throw new Error('Opening save test exposed no legal action'); })(),
        }
      : { type: 'advance_ai' };
    original = requireSuccess(originalHost.handle(request(
      'save-first-combat-command',
      original.sequence,
      firstCombatCommand,
      'opening-save-source'
    )));

    const checkpoint = originalHost.exportCheckpoint('opening-save-source');
    expect(checkpoint).not.toBeNull();
    expect(JSON.parse(JSON.stringify(checkpoint))).toEqual(checkpoint);
    expect(checkpoint?.sequence).toBe(original.sequence);

    const restoredHost = new OpeningExpeditionHostV1();
    const restored = requireSuccess(restoredHost.restoreCheckpoint(
      'opening-save-restored',
      JSON.parse(JSON.stringify(checkpoint)) as unknown,
      'resume-opening'
    ));
    expect(restored.resultType).toBe('expedition_resumed');
    expect(restored.sequence).toBe(original.sequence);
    expect(restored.view).toEqual({
      ...original.view,
      transition: original.view.transition === null
        ? null
        : { action: null, state: original.view.transition.state },
    });

    const nextCommand: OpeningSessionCommandV1 = restored.view.awaiting === 'player'
      ? {
          type: 'apply_action',
          action: restored.view.legalActions[0]
            ?? (() => { throw new Error('Restored opening exposed no legal action'); })(),
        }
      : { type: 'advance_ai' };
    const originalNext = requireSuccess(originalHost.handle(request(
      'save-original-next',
      original.sequence,
      nextCommand,
      'opening-save-source'
    )));
    const restoredNext = requireSuccess(restoredHost.handle(request(
      'save-restored-next',
      restored.sequence,
      nextCommand,
      'opening-save-restored'
    )));
    expect(restoredNext.view).toEqual(originalNext.view);

    expect(new OpeningExpeditionHostV1().restoreCheckpoint(
      'opening-missing',
      null
    )).toMatchObject({ ok: false, error: { code: 'checkpoint_not_found' } });
    expect(new OpeningExpeditionHostV1().restoreCheckpoint(
      'opening-invalid',
      checkpoint === null ? null : { ...checkpoint, sequence: checkpoint.sequence + 1 }
    )).toMatchObject({ ok: false, error: { code: 'invalid_checkpoint' } });
  });

  it('rejects the retired scripted recovery command and continues without spending', () => {
    const host = new OpeningExpeditionHostV1();
    let response = requireSuccess(host.handle(request('branch-create', 0, {
      type: 'create_expedition',
      scenarioId: OPENING_SCENARIO_ID,
      seed: 230825,
    }, 'opening-branch-test')));
    for (let beat = 0; beat < 5; beat += 1) {
      response = requireSuccess(host.handle(request(
        `branch-beat-${beat}`,
        response.sequence,
        continueBoundaryCommand(response),
        'opening-branch-test'
      )));
    }
    response = startFirstFieldContact(
      host,
      response,
      'branch-start-rescue-contact',
      'opening-branch-test'
    );
    response = resolveCurrentCombat(host, response, 'branch-rescue', 'opening-branch-test');
    response = requireSuccess(host.handle(request(
      'branch-return-rescue',
      response.sequence,
      { type: 'return_to_exploration' },
      'opening-branch-test'
    )));
    response = requireSuccess(host.handle(request(
      'branch-leave-rescue',
      response.sequence,
      continueBoundaryCommand(response),
      'opening-branch-test'
    )));
    response = requireSuccess(host.handle(request(
      'branch-leave-flight',
      response.sequence,
      continueBoundaryCommand(response),
      'opening-branch-test'
    )));
    const medkitsBefore = response.view.inventory.medkits;
    expect(host.handle(request(
      'retired-recovery',
      response.sequence,
      { type: 'choose_recovery', choice: 'use_medkit' },
      'opening-branch-test'
    ))).toMatchObject({ ok: false, error: { code: 'illegal_command' } });
    response = requireSuccess(host.handle(request(
      'branch-continue',
      response.sequence,
      continueBoundaryCommand(response),
      'opening-branch-test'
    )));
    expect(response.view.beat.id).toBe('hidden_yacht_departure');
    expect(response.view.inventory.medkits).toBe(medkitsBefore);
    expect(response.view.recoveryChoice).toBeNull();
    expect(response.view.telemetry[7]).toMatchObject({
      beatId: 'lake_recovery',
      recoveryChoice: null,
    });
    response = startFirstFieldContact(
      host,
      response,
      'branch-start-departure-contact',
      'opening-branch-test'
    );
    response = resolveCurrentCombat(
      host,
      response,
      'branch-departure',
      'opening-branch-test'
    );
    response = requireSuccess(host.handle(request(
      'branch-return-departure',
      response.sequence,
      { type: 'return_to_exploration' },
      'opening-branch-test'
    )));
    response = requireSuccess(host.handle(request(
      'branch-leave-departure',
      response.sequence,
      continueBoundaryCommand(response),
      'opening-branch-test'
    )));
    expect(response.view.beat.id).toBe('yacht_safety');
    response = requireSuccess(host.handle(request(
      'branch-finish-yacht',
      response.sequence,
      continueBoundaryCommand(response),
      'opening-branch-test'
    )));
    expect(response.view.awaiting).toBe('complete');
    expect(response.view.party.every((member) => member.hp > 0)).toBe(true);
  });

  it('records defeat and restarts the expedition from its failed boundary', () => {
    const host = new OpeningExpeditionHostV1();
    let response = requireSuccess(host.handle(request('defeat-create', 0, {
      type: 'create_expedition',
      scenarioId: OPENING_SCENARIO_ID,
      seed: 230825,
    }, 'opening-defeat-test')));
    for (let beat = 0; beat < 5; beat += 1) {
      response = requireSuccess(host.handle(request(
        `defeat-beat-${beat}`,
        response.sequence,
        continueBoundaryCommand(response),
        'opening-defeat-test'
      )));
    }
    response = startFirstFieldContact(
      host,
      response,
      'defeat-start-rescue-contact',
      'opening-defeat-test'
    );
    for (let actionIndex = 0; actionIndex < 160 && response.view.awaiting !== 'failed'; actionIndex += 1) {
      const command: OpeningSessionCommandV1 = response.view.awaiting === 'player'
        ? {
            type: 'apply_action',
            action: response.view.legalActions.find((action) => action.type === 'PassTurn')
              ?? (() => { throw new Error('Opening defeat path exposed no PassTurn'); })(),
          }
        : { type: 'advance_ai' };
      response = requireSuccess(host.handle(request(
        `defeat-action-${actionIndex}`,
        response.sequence,
        command,
        'opening-defeat-test'
      )));
    }
    expect(response.view.awaiting).toBe('failed');
    expect(response.view.telemetry[5]?.encounter).toMatchObject({ status: 'defeat' });

    const restarted = requireSuccess(host.handle(request(
      'defeat-restart',
      response.sequence,
      { type: 'restart_expedition' },
      'opening-defeat-test'
    )));
    expect(restarted.view.beat.id).toBe('familiar_virimonde');
    expect(restarted.view.awaiting).toBe('continue');
    expect(restarted.view.telemetry).toHaveLength(1);
    expect(restarted.view.party.map((member) => member.id)).toEqual(['owen']);
  });
});
