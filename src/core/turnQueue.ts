/**
 * First-class discrete Turn Queue system.
 *
 * Computes deterministic upcoming turn order based on combatant speed and stances,
 * and supports direct queue manipulation (e.g. telekinetic displacement, boost speed modifier).
 */

import { Combatant, TurnQueueEntry, TurnQueueState } from './types';

const QUEUE_PREVIEW_LENGTH = 10;
const BASE_TURN_DELAY = 100;

/**
 * Calculates effective speed accounting for stances (such as Boost +30% speed).
 * Stationary devices (such as Psi-Blockers with speed = 0) return 0.
 */
export function getEffectiveSpeed(combatant: Combatant): number {
  if (combatant.stats.hp <= 0 || combatant.stats.speed <= 0 || combatant.role === 'Psi-Blocker') {
    return 0;
  }
  let speed = combatant.stats.speed;
  if (combatant.isBoosting) {
    // Combat drug boosts speed by +30%
    speed *= 1.3;
  }
  return Math.max(1, speed);
}

export function isActingCombatant(combatant: Combatant | undefined): boolean {
  return combatant !== undefined && combatant.stats.hp > 0 && getEffectiveSpeed(combatant) > 0;
}

/**
 * Generates the upcoming discrete turn queue entries by projecting combatant speeds forward.
 */
export function generateUpcomingTurns(
  combatants: Record<string, Combatant>,
  activeIds: string[],
  currentAccumulators: Record<string, number>,
  count: number = QUEUE_PREVIEW_LENGTH
): TurnQueueEntry[] {
  // Only consider living, active combatants (excludes dead units and stationary psi-blockers)
  const livingIds = activeIds.filter((id) => isActingCombatant(combatants[id]));

  if (livingIds.length === 0) {
    return [];
  }

  // Clone virtual timers for projection
  const simDelays: Record<string, number> = {};
  for (const id of livingIds) {
    simDelays[id] = currentAccumulators[id] ?? 0;
  }

  const entries: TurnQueueEntry[] = [];
  let seq = 0;

  while (entries.length < count) {
    // Find actor with smallest delay (soonest to act)
    let minActorId = livingIds[0] as string;
    let minDelay = simDelays[minActorId] ?? 0;

    for (let i = 1; i < livingIds.length; i++) {
      const id = livingIds[i] as string;
      const delay = simDelays[id] ?? 0;
      if (delay < minDelay) {
        minDelay = delay;
        minActorId = id;
      }
    }

    const combatant = combatants[minActorId];
    if (!combatant) {
      break;
    }

    entries.push({
      queueId: `turn-${seq++}-${minActorId}`,
      actorId: minActorId,
      predictedTick: Math.round(minDelay),
    });

    // Advance this actor's virtual timer for their next projected turn
    const speed = getEffectiveSpeed(combatant);
    const cost = BASE_TURN_DELAY / speed;
    simDelays[minActorId] = minDelay + cost;
  }

  return entries;
}

/**
 * Initializes the turn queue at battle start.
 */
export function initTurnQueue(
  combatants: Record<string, Combatant>,
  activeIds: string[]
): TurnQueueState {
  const accumulators: Record<string, number> = {};
  const livingIds = activeIds.filter((id) => isActingCombatant(combatants[id]));

  // Fast combatants start with initial delay closer to 0
  for (const id of livingIds) {
    const combatant = combatants[id];
    if (combatant) {
      const speed = getEffectiveSpeed(combatant);
      // Higher speed means smaller starting tick delay
      accumulators[id] = Math.max(0, BASE_TURN_DELAY / speed - 5);
    }
  }

  const entries = generateUpcomingTurns(combatants, livingIds, accumulators, QUEUE_PREVIEW_LENGTH);

  return {
    entries,
    accumulators,
  };
}

/**
 * Gives one side the first action without granting free damage or replacing the
 * normal speed projection. After the prioritized actor takes that first turn, its
 * ordinary speed delay is added and the queue resumes its standard behavior.
 */
export function prioritizeOpeningSide(
  queue: TurnQueueState,
  favoredIds: string[],
  combatants: Record<string, Combatant>,
  activeIds: string[]
): TurnQueueState {
  const favored = new Set(favoredIds.filter((id) => isActingCombatant(combatants[id])));
  if (favored.size === 0 || favored.has(queue.entries[0]?.actorId ?? '')) return queue;
  const prioritizedActorId = queue.entries.find((entry) => favored.has(entry.actorId))?.actorId;
  if (prioritizedActorId === undefined) return queue;

  const accumulators = { ...queue.accumulators };
  const activeDelays = activeIds
    .filter((id) => isActingCombatant(combatants[id]))
    .map((id) => accumulators[id] ?? 0);
  const earliestDelay = activeDelays.length === 0 ? 0 : Math.min(...activeDelays);
  accumulators[prioritizedActorId] = earliestDelay - 0.001;
  return {
    accumulators,
    entries: generateUpcomingTurns(combatants, activeIds, accumulators, QUEUE_PREVIEW_LENGTH),
  };
}

/**
 * Advances the turn queue to the next turn after the current actor's turn completes.
 */
export function advanceTurnQueue(
  queue: TurnQueueState,
  combatants: Record<string, Combatant>,
  activeIds: string[],
  lastActorId: string
): { nextActorId: string; updatedQueue: TurnQueueState } {
  const livingIds = activeIds.filter((id) => isActingCombatant(combatants[id]));

  if (livingIds.length === 0) {
    return {
      nextActorId: '',
      updatedQueue: { entries: [], accumulators: {} },
    };
  }

  const accumulators = { ...queue.accumulators };
  const lastActor = combatants[lastActorId];

  if (lastActor && lastActor.stats.hp > 0 && isActingCombatant(lastActor)) {
    const speed = getEffectiveSpeed(lastActor);
    const delay = BASE_TURN_DELAY / speed;
    const currentVal = accumulators[lastActorId] ?? 0;
    accumulators[lastActorId] = currentVal + delay;
  } else {
    delete accumulators[lastActorId];
  }

  // Normalize delays to prevent number overflow
  const minDelay = Math.min(...livingIds.map((id) => accumulators[id] ?? 0));
  if (minDelay > 0 && Number.isFinite(minDelay)) {
    for (const id of livingIds) {
      if (accumulators[id] !== undefined) {
        accumulators[id] -= minDelay;
      }
    }
  }

  const entries = generateUpcomingTurns(combatants, livingIds, accumulators, QUEUE_PREVIEW_LENGTH);
  const nextActorId = entries[0]?.actorId ?? '';

  return {
    nextActorId,
    updatedQueue: {
      entries,
      accumulators,
    },
  };
}

/**
 * Manipulates the turn queue by pushing a combatant back (e.g. Telekinetic Displace).
 */
export function displaceActorInQueue(
  queue: TurnQueueState,
  targetId: string,
  displaceTicks: number,
  combatants: Record<string, Combatant>,
  activeIds: string[]
): TurnQueueState {
  const accumulators = { ...queue.accumulators };
  if (accumulators[targetId] !== undefined) {
    accumulators[targetId] += displaceTicks;
  }

  const livingIds = activeIds.filter((id) => isActingCombatant(combatants[id]));
  const entries = generateUpcomingTurns(combatants, livingIds, accumulators, QUEUE_PREVIEW_LENGTH);

  return {
    entries,
    accumulators,
  };
}

/**
 * Recalculates turn queue when speed changes (e.g. entering/leaving boost) or death occurs.
 */
export function refreshTurnQueue(
  queue: TurnQueueState,
  combatants: Record<string, Combatant>,
  activeIds: string[]
): TurnQueueState {
  const livingIds = activeIds.filter((id) => isActingCombatant(combatants[id]));
  const accumulators: Record<string, number> = {};
  for (const id of livingIds) {
    if (queue.accumulators[id] !== undefined) {
      accumulators[id] = queue.accumulators[id];
    } else {
      const c = combatants[id];
      if (c) {
        accumulators[id] = Math.max(0, BASE_TURN_DELAY / getEffectiveSpeed(c) - 5);
      }
    }
  }

  const entries = generateUpcomingTurns(combatants, livingIds, accumulators, QUEUE_PREVIEW_LENGTH);

  return {
    entries,
    accumulators,
  };
}

/**
 * Immediately purges any dead combatants (hp <= 0) from turn queue entries and accumulators.
 */
export function purgeDeadFromQueue(
  queue: TurnQueueState,
  combatants: Record<string, Combatant>,
  activeIds: string[]
): TurnQueueState {
  return refreshTurnQueue(queue, combatants, activeIds);
}
