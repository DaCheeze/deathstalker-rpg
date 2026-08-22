/**
 * Combatant state effects, stance transitions, and turn-start/end processing.
 * Pure state transformations with zero DOM dependencies.
 */

import { Combatant, BattleEvent } from './types';
import { GameRules, getDefaultRules } from './configLoader';

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
export function processTurnStart(combatant: Combatant, rules?: GameRules): TurnStartResult {
  const activeRules = rules || getDefaultRules();
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
    const newEsp = Math.min(c.stats.maxEsp, c.stats.esp + activeRules.esp.perTurnRegen);
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
    c.burnout += activeRules.boost.perTurnAccrual;
    events.push({
      type: 'BOOST_CHANGED',
      actorId: c.id,
      isBoosting: true,
      burnout: c.burnout,
    });

    // Forced out of boost into CRASH state at crash threshold
    if (c.burnout >= activeRules.boost.crashThreshold) {
      c.isBoosting = false;
      const crashDuration = Math.max(2, Math.min(4, Math.ceil((c.turnsSpentBoosting || 1) / 2)));
      c.crashTurns = crashDuration;
      c.turnsSpentBoosting = 0;
      events.push({
        type: 'BOOST_CRASHED',
        actorId: c.id,
        crashTurns: crashDuration,
      });
    }
  } else if (c.burnout > 0) {
    // Burnout decays per turn spent NOT boosting, floored at 0
    c.burnout = Math.max(0, c.burnout - activeRules.boost.perTurnDecay);
  }

  // 4. Burnout at chip threshold: take chip damage
  if (c.burnout >= activeRules.boost.chipThreshold) {
    const chipDamage = Math.max(1, Math.round(c.stats.maxHp * activeRules.boost.chipDamagePercent));
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
