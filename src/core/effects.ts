/**
 * Combatant state effects, stance transitions, and turn-start/end processing.
 * Pure state transformations.
 */

import { Combatant, BattleEvent } from './types';

const BURNOUT_CHIP_THRESHOLD = 5;
const BURNOUT_CRASH_THRESHOLD = 8;
const BURNOUT_CHIP_PERCENT = 0.08; // 8% max HP chip damage per turn
const ESP_REGEN_PER_TURN = 4;

export interface TurnStartResult {
  combatant: Combatant;
  events: BattleEvent[];
  canAct: boolean;
}

export interface TurnEndResult {
  combatant: Combatant;
  events: BattleEvent[];
}

/**
 * Processes turn-start effects: stun check, burnout escalation & chip damage, forced boost exit / crash, ESP regen.
 */
export function processTurnStart(combatant: Combatant): TurnStartResult {
  const c: Combatant = {
    ...combatant,
    stats: { ...combatant.stats },
    statModifiers: combatant.statModifiers ? combatant.statModifiers.map((m) => ({ ...m })) : [],
  };
  const events: BattleEvent[] = [];

  // Check if dead
  if (c.stats.hp <= 0) {
    return { combatant: c, events, canAct: false };
  }

  // 1. ESP passive regeneration for esper combatants
  if (c.stats.maxEsp > 0 && c.stats.esp < c.stats.maxEsp) {
    const newEsp = Math.min(c.stats.maxEsp, c.stats.esp + ESP_REGEN_PER_TURN);
    c.stats.esp = newEsp;
  }

  // 2. Handle Stun state
  if (c.stunnedTurns > 0) {
    c.stunnedTurns -= 1;
    // Stunned combatant cannot act this turn
    return {
      combatant: c,
      events,
      canAct: false,
    };
  }

  // 3. Boost & Burnout escalation or decay
  if (c.isBoosting) {
    c.turnsSpentBoosting = (c.turnsSpentBoosting || 0) + 1;
    c.burnout += 1;
    events.push({
      type: 'BOOST_CHANGED',
      actorId: c.id,
      isBoosting: true,
      burnout: c.burnout,
    });

    // Burnout 8+: forced out of boost into CRASH state (replaces stun)
    if (c.burnout >= BURNOUT_CRASH_THRESHOLD) {
      c.isBoosting = false;
      const crashDuration = Math.max(2, Math.min(4, Math.ceil(c.turnsSpentBoosting / 2)));
      c.crashTurns = crashDuration;
      c.turnsSpentBoosting = 0;
      events.push({
        type: 'BOOST_CRASHED',
        actorId: c.id,
        crashTurns: crashDuration,
      });
    }
  } else if (c.burnout > 0) {
    // Burnout decays 1 per turn spent NOT boosting, floored at 0
    c.burnout = Math.max(0, c.burnout - 1);
  }

  // 4. Burnout 5+: take chip damage (whether boosting or recovering)
  if (c.burnout >= BURNOUT_CHIP_THRESHOLD) {
    const chipDamage = Math.max(1, Math.round(c.stats.maxHp * BURNOUT_CHIP_PERCENT));
    const newHp = Math.max(0, c.stats.hp - chipDamage);
    c.stats.hp = newHp;

    events.push({
      type: 'BURNOUT_CHIP_DAMAGE',
      actorId: c.id,
      damage: chipDamage,
      killed: newHp <= 0,
    });

    if (newHp <= 0) {
      return { combatant: c, events, canAct: false };
    }
  }

  return {
    combatant: c,
    events,
    canAct: true,
  };
}

/**
 * Processes turn-end effects: decrements crash turns, disruptor cooldown, stat modifier durations.
 */
export function processTurnEnd(combatant: Combatant): TurnEndResult {
  const c: Combatant = {
    ...combatant,
    stats: { ...combatant.stats },
    statModifiers: combatant.statModifiers ? combatant.statModifiers.map((m) => ({ ...m })) : [],
  };
  const events: BattleEvent[] = [];

  // Crash recovery turns tick down on turn end
  if (c.crashTurns > 0) {
    c.crashTurns -= 1;
  }

  // Disruptor cooldown ticks on that combatant's own turn
  if (c.disruptorCooldown > 0) {
    c.disruptorCooldown -= 1;
    events.push({
      type: 'DISRUPTOR_COOLDOWN_TICK',
      actorId: c.id,
      remaining: c.disruptorCooldown,
    });
  }

  // Stat modifiers tick down
  if (c.statModifiers && c.statModifiers.length > 0) {
    c.statModifiers = c.statModifiers
      .map((mod) => ({ ...mod, turnsRemaining: mod.turnsRemaining - 1 }))
      .filter((mod) => mod.turnsRemaining > 0);
  }

  return {
    combatant: c,
    events,
  };
}
