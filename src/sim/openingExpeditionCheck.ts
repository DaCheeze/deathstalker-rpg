import {
  OPENING_SCENARIO_ID,
  OPENING_SESSION_FORMAT,
  OPENING_SESSION_PROTOCOL_VERSION,
  OpeningExpeditionHostV1,
  type OpeningSessionCommandV1,
  type OpeningSessionSuccessResponseV1,
} from '../session/openingExpeditionProtocol';

export const OPENING_ACCEPTANCE_SEEDS = [12345, 98765] as const;

export interface OpeningExpeditionRunReport {
  seed: number;
  status: 'complete' | 'failed';
  sequence: number;
  beatId: string;
  boundaryCount: number;
  encounterActionCounts: Array<{ id: string; actions: number; turns: number; status: string }>;
  recoveryChoice: 'use_medkit' | 'continue' | null;
  medkitsRemaining: number;
  revivesRemaining: number;
  partyHpPercentage: number;
}

function successful(
  response: ReturnType<OpeningExpeditionHostV1['handle']>
): OpeningSessionSuccessResponseV1 {
  if (!response.ok) throw new Error(`${response.error.code}: ${response.error.message}`);
  return response;
}

function selectPlayerCommand(
  response: OpeningSessionSuccessResponseV1
): OpeningSessionCommandV1 {
  if (response.view.legalActions.some((action) => action.type === 'Advance')) {
    throw new Error('Opening acceptance run exposed rejected Advance movement');
  }
  const state = response.view.transition?.state;
  const injured = state?.combatants
    .filter((combatant) => (
      combatant.side === 'party' && combatant.alive && combatant.hp / combatant.maxHp <= 0.5
    ))
    .sort((left, right) => (
      left.hp / left.maxHp - right.hp / right.maxHp || left.id.localeCompare(right.id)
    ))[0];
  const medkit = injured === undefined
    ? undefined
    : response.view.legalActions.find((action) => (
        action.type === 'UseMedkit' && action.targetId === injured.id
      ));
  const action = medkit
    ?? response.view.legalActions.find((candidate) => candidate.type === 'Attack')
    ?? response.view.legalActions[0];
  if (action === undefined) throw new Error('Opening acceptance run exposed no legal player action');
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
          throw new Error(`Opening map '${map.id}' is missing its objective landmark`);
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
      return selectPlayerCommand(response);
    case 'ai':
      return { type: 'advance_ai' };
    case 'choice': {
      const hasInjury = response.view.party.some((member) => member.hp < member.maxHp);
      return {
        type: 'choose_recovery',
        choice: hasInjury && response.view.inventory.medkits > 0 ? 'use_medkit' : 'continue',
      };
    }
    case 'complete':
    case 'failed':
      return null;
  }
}

export function runOpeningExpeditionCheck(seed: number): OpeningExpeditionRunReport {
  const host = new OpeningExpeditionHostV1();
  const sessionId = `opening-acceptance-${seed}`;
  let response = successful(host.handle({
    format: OPENING_SESSION_FORMAT,
    protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
    requestId: `${sessionId}-create`,
    sessionId,
    expectedSequence: 0,
    command: { type: 'create_expedition', scenarioId: OPENING_SCENARIO_ID, seed },
  }));
  for (let step = 0; step < 600; step += 1) {
    const command = nextCommand(response);
    if (command === null) break;
    response = successful(host.handle({
      format: OPENING_SESSION_FORMAT,
      protocolVersion: OPENING_SESSION_PROTOCOL_VERSION,
      requestId: `${sessionId}-${step.toString().padStart(3, '0')}`,
      sessionId,
      expectedSequence: response.sequence,
      command,
    }));
  }
  const hp = response.view.party.reduce((total, member) => total + member.hp, 0);
  const maxHp = response.view.party.reduce((total, member) => total + member.maxHp, 0);
  return {
    seed,
    status: response.view.awaiting === 'complete' ? 'complete' : 'failed',
    sequence: response.sequence,
    beatId: response.view.beat.id,
    boundaryCount: response.view.telemetry.length,
    encounterActionCounts: response.view.telemetry.flatMap((boundary) => (
      boundary.encounter === null
        ? []
        : [{
            id: boundary.encounter.id,
            actions: boundary.encounter.actionCount,
            turns: boundary.encounter.turnNumber,
            status: boundary.encounter.status,
          }]
    )),
    recoveryChoice: response.view.recoveryChoice,
    medkitsRemaining: response.view.inventory.medkits,
    revivesRemaining: response.view.inventory.revives,
    partyHpPercentage: maxHp === 0 ? 0 : hp / maxHp,
  };
}

if (typeof process !== 'undefined' && process.argv[1]?.includes('openingExpeditionCheck')) {
  const reports = OPENING_ACCEPTANCE_SEEDS.map(runOpeningExpeditionCheck);
  console.log(JSON.stringify({ reports }, null, 2));
  if (reports.some((report) => report.status !== 'complete')) process.exitCode = 1;
}
