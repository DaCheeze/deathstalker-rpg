import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  WORLD_LOOP_SCENARIO_ID,
  WORLD_LOOP_SESSION_FORMAT,
  WORLD_LOOP_SESSION_PROTOCOL_VERSION,
  WorldLoopHostV1,
  type WorldLoopSessionCommandV1,
  type WorldLoopSessionRequestV1,
  type WorldLoopSuccessResponseV1,
} from '../src/session/worldLoopProtocol';

const FIXTURE_SEED = 230825;
const SESSION_ID = 'godot-world-loop-fixture';
const MAX_COMMANDS = 800;

function choosePlayerCommand(response: WorldLoopSuccessResponseV1): WorldLoopSessionCommandV1 {
  const state = response.view.transition?.state;
  const injured = state?.combatants
    .filter((combatant) => (
      combatant.side === 'party' && combatant.alive && combatant.hp / combatant.maxHp <= 0.35
    ))
    .sort((left, right) => (
      left.hp / left.maxHp - right.hp / right.maxHp || left.id.localeCompare(right.id)
    ))[0];
  const recovery = injured === undefined
    ? undefined
    : response.view.legalActions.find((action) => (
        action.type === 'UseMedkit' && action.targetId === injured.id
      ));
  const action = recovery
    ?? response.view.legalActions.find((candidate) => candidate.type === 'Attack')
    ?? response.view.legalActions[0];
  if (!action) throw new Error('World-loop fixture player turn exposed no legal action');
  return { type: 'apply_action', action };
}

function runCombat(
  response: WorldLoopSuccessResponseV1,
  dispatch: (command: WorldLoopSessionCommandV1) => WorldLoopSuccessResponseV1
): WorldLoopSuccessResponseV1 {
  let current = response;
  for (let commandIndex = 0; commandIndex < MAX_COMMANDS; commandIndex += 1) {
    if (current.view.awaiting === 'player') current = dispatch(choosePlayerCommand(current));
    else if (current.view.awaiting === 'ai') current = dispatch({ type: 'advance_ai' });
    else if (current.view.awaiting === 'return') return dispatch({ type: 'return_to_map' });
    else if (current.view.awaiting === 'failed') {
      throw new Error(`World-loop fixture lost encounter '${current.view.encounter?.id ?? 'unknown'}'`);
    } else {
      throw new Error(`World-loop combat stopped at unexpected awaiting '${current.view.awaiting}'`);
    }
  }
  throw new Error(`World-loop fixture exceeded ${MAX_COMMANDS} combat commands`);
}

function main(): void {
  const host = new WorldLoopHostV1();
  const exchanges: Array<{
    request: WorldLoopSessionRequestV1;
    response: WorldLoopSuccessResponseV1;
  }> = [];
  let requestIndex = 0;
  let sequence = 0;

  function dispatch(command: WorldLoopSessionCommandV1): WorldLoopSuccessResponseV1 {
    const request: WorldLoopSessionRequestV1 = {
      format: WORLD_LOOP_SESSION_FORMAT,
      protocolVersion: WORLD_LOOP_SESSION_PROTOCOL_VERSION,
      requestId: `${SESSION_ID}-${String(requestIndex).padStart(6, '0')}`,
      sessionId: SESSION_ID,
      expectedSequence: sequence,
      command,
    };
    requestIndex += 1;
    const response = host.handle(request);
    if (!response.ok) throw new Error(`${response.error.code}: ${response.error.message}`);
    exchanges.push({ request, response });
    sequence = response.sequence;
    return response;
  }

  let response = dispatch({
    type: 'create_world_loop',
    scenarioId: WORLD_LOOP_SCENARIO_ID,
    seed: FIXTURE_SEED,
  });
  response = dispatch({ type: 'buy_consumable', item: 'medkit' });
  response = dispatch({ type: 'rest' });
  response = dispatch({ type: 'travel', destinationId: 'field_route' });
  response = dispatch({ type: 'open_chest', chestId: 'field_cache_a' });
  response = dispatch({ type: 'open_chest', chestId: 'field_cache_b' });

  for (let patrolIndex = 0; patrolIndex < 3; patrolIndex += 1) {
    response = dispatch({ type: 'start_encounter', nodeId: 'field_patrol' });
    response = runCombat(response, dispatch);
    response = dispatch({ type: 'travel', destinationId: 'safe_hub' });
    response = dispatch({ type: 'rest' });
    response = dispatch({ type: 'travel', destinationId: 'field_route' });
  }

  response = dispatch({ type: 'travel', destinationId: 'boss_approach' });
  response = dispatch({ type: 'start_encounter', nodeId: 'fixed_boss' });
  response = runCombat(response, dispatch);
  if (response.view.awaiting !== 'complete' || !response.view.bossDefeated) {
    throw new Error('World-loop fixture did not finish after the fixed boss');
  }

  const fixture = {
    format: 'deathstalker-world-loop-transcript',
    schemaVersion: 1,
    source: {
      authoritativeRuntime: 'typescript-core',
      generator: 'scripts/export-godot-world-loop.ts',
      scenarioId: WORLD_LOOP_SCENARIO_ID,
      seed: FIXTURE_SEED,
      sessionId: SESSION_ID,
    },
    commandCount: exchanges.length,
    exchanges,
    final: {
      sequence: response.sequence,
      awaiting: response.view.awaiting,
      locationId: response.view.location.id,
      partyLevel: response.view.campaign.partyLevel,
      bossDefeated: response.view.bossDefeated,
      openedChestIds: response.view.openedChestIds,
      encounterVictoryCounts: response.view.encounterVictoryCounts,
      restCount: response.view.restCount,
    },
  };

  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const outputPath = resolve(scriptDirectory, '../godot/data/world-loop-transcript-v1.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
  process.stdout.write(`Wrote ${exchanges.length} authoritative world-loop exchanges to ${outputPath}\n`);
}

main();
