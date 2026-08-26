import { requireValue } from './invariant';
import type {
  ExpeditionBeatDefinition,
  ExpeditionJourneyDefinition,
  ExpeditionJourneyState,
  ExpeditionRecoveryChoice,
} from './types';

export type ExpeditionJourneyInput =
  | { type: 'continue' }
  | { type: 'combat_completed'; outcome: 'victory' | 'defeat' }
  | { type: 'choose_recovery'; choice: ExpeditionRecoveryChoice };

export function initExpeditionJourney(
  definition: ExpeditionJourneyDefinition
): ExpeditionJourneyState {
  return {
    expeditionId: definition.id,
    currentBeatIndex: 0,
    completedBeatIds: [],
    recoveryChoice: null,
    status: definition.beats[0]?.interaction === 'complete' ? 'completed' : 'in_progress',
  };
}

export function currentExpeditionBeat(
  state: ExpeditionJourneyState,
  definition: ExpeditionJourneyDefinition
): ExpeditionBeatDefinition {
  if (state.expeditionId !== definition.id) {
    throw new Error(
      `Expedition state '${state.expeditionId}' does not match definition '${definition.id}'`
    );
  }
  return requireValue(
    definition.beats[state.currentBeatIndex],
    `Expedition beat index ${state.currentBeatIndex} is outside '${definition.id}'`
  );
}

export function advanceExpeditionJourney(
  state: ExpeditionJourneyState,
  definition: ExpeditionJourneyDefinition,
  input: ExpeditionJourneyInput
): ExpeditionJourneyState {
  if (state.status !== 'in_progress') {
    throw new Error(`Cannot advance expedition journey while status is '${state.status}'`);
  }
  const beat = currentExpeditionBeat(state, definition);
  assertInputMatchesBeat(beat, input);

  if (input.type === 'combat_completed' && input.outcome === 'defeat') {
    return { ...state, status: 'failed' };
  }

  const nextBeatIndex = state.currentBeatIndex + 1;
  const nextBeat = requireValue(
    definition.beats[nextBeatIndex],
    `Expedition '${definition.id}' has no beat after '${beat.id}'`
  );
  return {
    ...state,
    currentBeatIndex: nextBeatIndex,
    completedBeatIds: [...state.completedBeatIds, beat.id],
    recoveryChoice: input.type === 'choose_recovery' ? input.choice : state.recoveryChoice,
    status: nextBeat.interaction === 'complete' ? 'completed' : 'in_progress',
  };
}

function assertInputMatchesBeat(
  beat: ExpeditionBeatDefinition,
  input: ExpeditionJourneyInput
): void {
  const matches =
    (beat.interaction === 'continue' && input.type === 'continue') ||
    (beat.interaction === 'combat' && input.type === 'combat_completed') ||
    (beat.interaction === 'recovery_choice' && input.type === 'choose_recovery');
  if (!matches) {
    throw new Error(
      `Expedition beat '${beat.id}' awaiting '${beat.interaction}' cannot accept '${input.type}'`
    );
  }
}
