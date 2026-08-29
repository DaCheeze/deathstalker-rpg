import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  OPENING_SCENARIO_ID,
  OPENING_SESSION_FORMAT,
  OPENING_SESSION_PROTOCOL_VERSION,
  OpeningExpeditionHostV1,
  type OpeningSessionCommandV1,
  type OpeningSessionRequestV1,
  type OpeningSessionSuccessResponseV1,
} from '../src/session/openingExpeditionProtocol';

const FIXTURE_SEED = 230825;
const SESSION_ID = 'godot-opening-fixture';
const MAX_COMMANDS = 400;

function choosePlayerCommand(response: OpeningSessionSuccessResponseV1): OpeningSessionCommandV1 {
  const state = response.view.transition?.state;
  const injured = state?.combatants
    .filter((combatant) => (
      combatant.side === 'party' && combatant.alive && combatant.hp / combatant.maxHp <= 0.5
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
  if (!action) throw new Error('Opening fixture player turn exposed no legal action');
  return { type: 'apply_action', action };
}

function nextCommand(response: OpeningSessionSuccessResponseV1): OpeningSessionCommandV1 | null {
  switch (response.view.awaiting) {
    case 'continue': {
      const map = response.view.beat.exploration;
      if (map !== null) {
        const contact = map.fieldContacts.find((candidate) => (
          candidate.required &&
          !response.view.fieldContactState.clearedContactIds.includes(candidate.id)
        ));
        if (contact !== undefined) {
          const approachDistance = contact.fieldStrikeRange * 0.75;
          return {
            type: 'start_field_contact',
            contactId: contact.id,
            trigger: 'player_strike',
            playerPosition: {
              x: contact.position.x - contact.facing.x * approachDistance,
              y: contact.position.y - contact.facing.y * approachDistance,
            },
          };
        }
        const objective = map.landmarks.find((landmark) => (
          landmark.id === map.objectiveLandmarkId
        ));
        if (objective === undefined) {
          throw new Error(`Opening map '${map.id}' has no objective landmark`);
        }
        return {
          type: 'complete_exploration',
          mapId: map.id,
          objectiveLandmarkId: map.objectiveLandmarkId,
          playerPosition: { ...objective.position },
        };
      }
      return { type: 'continue' };
    }
    case 'field_return':
      return { type: 'return_to_exploration' };
    case 'player':
      return choosePlayerCommand(response);
    case 'ai':
      return { type: 'advance_ai' };
    case 'choice':
      return { type: 'choose_recovery', choice: 'use_medkit' };
    case 'complete':
      return null;
    case 'failed':
      throw new Error(`Opening fixture failed at beat '${response.view.beat.id}'`);
  }
}

function main(): void {
  const host = new OpeningExpeditionHostV1();
  const exchanges: Array<{
    request: OpeningSessionRequestV1;
    response: OpeningSessionSuccessResponseV1;
  }> = [];
  let requestIndex = 0;
  let sequence = 0;

  function dispatch(command: OpeningSessionCommandV1): OpeningSessionSuccessResponseV1 {
    const request: OpeningSessionRequestV1 = {
      format: OPENING_SESSION_FORMAT,
      protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
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
    type: 'create_expedition',
    scenarioId: OPENING_SCENARIO_ID,
    seed: FIXTURE_SEED,
  });
  for (let commandIndex = 0; commandIndex < MAX_COMMANDS; commandIndex += 1) {
    const command = nextCommand(response);
    if (command === null) break;
    response = dispatch(command);
  }
  if (response.view.awaiting !== 'complete') {
    throw new Error(`Opening fixture exceeded ${MAX_COMMANDS} commands without completion`);
  }

  const fixture = {
    format: 'deathstalker-opening-expedition-transcript',
    schemaVersion: 1,
    source: {
      authoritativeRuntime: 'typescript-core',
      generator: 'scripts/export-godot-opening-expedition.ts',
      scenarioId: OPENING_SCENARIO_ID,
      seed: FIXTURE_SEED,
      sessionId: SESSION_ID,
    },
    commandCount: exchanges.length,
    exchanges,
    final: {
      sequence: response.sequence,
      beatId: response.view.beat.id,
      awaiting: response.view.awaiting,
      party: response.view.party,
      inventory: response.view.inventory,
      recoveryChoice: response.view.recoveryChoice,
    },
  };

  const scriptDirectory = dirname(fileURLToPath(import.meta.url));
  const outputPath = resolve(scriptDirectory, '../godot/data/opening-expedition-transcript-v1.json');
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(fixture, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `Wrote ${exchanges.length} authoritative opening exchanges to ${outputPath}\n`
  );
}

main();
