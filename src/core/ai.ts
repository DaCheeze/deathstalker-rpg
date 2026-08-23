/**
 * AI Decision Engine for Enemies and Headless Simulator.
 * Implements faction behaviors: Empire (balanced), Shub (relentless focus fire), Hadenman (heavy burst).
 */

import { BattleAction, BattleState, Combatant, AbilityDefinition } from './types';
import { isEspBlocked } from './battle';
import { RNG } from './random';
import { getDefaultRules } from './configLoader';
import { requireValue } from './invariant';

export function chooseEnemyAction(state: BattleState, actorId: string, rng: RNG): BattleAction {
  const actor = state.combatants[actorId];
  if (!actor || actor.stats.hp <= 0) {
    return { type: 'PassTurn', actorId };
  }

  const getRandom = rng;

  // Living party targets
  const livingParty = state.partyIds
    .map((id) => state.combatants[id])
    .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);

  if (livingParty.length === 0 || actor.crashTurns > 0) {
    return { type: 'PassTurn', actorId };
  }

  // Helper to find lowest HP target
  const lowestHpTarget = [...livingParty].sort((a, b) => a.stats.hp - b.stats.hp)[0] as Combatant;
  
  // Helper to find target without shield
  const unshieldedTarget = livingParty.find((c) => !c.hasForceShield) || lowestHpTarget;

  if (state.battleMode === 'range_band_prototype') {
    const band = actor.rangeBand ?? 'ranged';
    if (band === 'ranged') {
      return { type: 'Advance', actorId };
    }

    const engagedTarget = actor.engagedTargetId
      ? state.combatants[actor.engagedTargetId]
      : undefined;
    if (band === 'closing' || !engagedTarget || engagedTarget.stats.hp <= 0) {
      const claimedTargetIds = new Set(
        state.enemyIds
          .filter((enemyId) => enemyId !== actorId)
          .map((enemyId) => state.combatants[enemyId]?.engagedTargetId)
          .filter((targetId): targetId is string => (
            targetId !== undefined && (state.combatants[targetId]?.stats.hp ?? 0) > 0
          ))
      );
      const mirroredTargetId = state.partyIds[state.enemyIds.indexOf(actorId)];
      const mirroredTarget = livingParty.find((target) => (
        target.id === mirroredTargetId && !claimedTargetIds.has(target.id)
      ));
      const unclaimedTarget = livingParty.find((target) => !claimedTargetIds.has(target.id));
      const engagementTarget = mirroredTarget ?? unclaimedTarget ?? lowestHpTarget;
      return { type: 'Advance', actorId, targetId: engagementTarget.id };
    }

    const meleeAbility = actor.abilityIds
      .map((id) => state.abilities[id])
      .filter((ability): ability is AbilityDefinition => ability?.category === 'melee')
      .sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];
    return meleeAbility
      ? { type: 'Attack', actorId, targetId: engagedTarget.id, abilityId: meleeAbility.id }
      : { type: 'PassTurn', actorId };
  }

  // 1. Shub Faction (Rogue AI) - Relentless, coordinated, focus fire on lowest HP
  if (actor.faction === 'shub') {
    // If disruptor is ready, fire on lowest HP target immediately
    if (actor.disruptorCooldown === 0) {
      return { type: 'Disruptor', actorId, targetId: lowestHpTarget.id };
    }

    // Boost if combatant can boost and burnout is safe (< 3)
    if (actor.canBoost && !actor.isBoosting && actor.burnout < 3 && getRandom() < 0.4) {
      return { type: 'ToggleBoost', actorId, enable: true };
    }

    // Otherwise use best available attack on lowest HP target
    const attackAbility = actor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a): a is AbilityDefinition => a !== undefined && (a.category === 'melee' || a.category === 'projectile'))
      .sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];

    if (attackAbility) {
      return { type: 'Attack', actorId, targetId: lowestHpTarget.id, abilityId: attackAbility.id };
    }
  }

  // 2. Hadenman Faction (Augmented Post-Humans) - Heavy damage, punishes errors
  if (actor.faction === 'hadenman') {
    // If disruptor ready, fire at highest threat or unshielded target
    if (actor.disruptorCooldown === 0) {
      return { type: 'Disruptor', actorId, targetId: lowestHpTarget.id };
    }

    // If HP is low (<35%) and no shield, raise shield
    if (actor.stats.hp < actor.stats.maxHp * 0.35 && !actor.hasForceShield && getRandom() < 0.5) {
      return { type: 'RaiseShield', actorId };
    }

    // Heavy attack
    const bestAttack = actor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a): a is AbilityDefinition => a !== undefined && (a.category === 'melee' || a.category === 'projectile'))
      .sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];

    if (bestAttack) {
      return { type: 'Attack', actorId, targetId: unshieldedTarget.id, abilityId: bestAttack.id };
    }
  }

  // 3. Empire Faction (Soldiers / House Guards) - Balanced, standard tactical doctrine
  if (actor.disruptorCooldown === 0 && getRandom() < 0.6) {
    return { type: 'Disruptor', actorId, targetId: lowestHpTarget.id };
  }

  if (actor.stats.hp < actor.stats.maxHp * 0.4 && !actor.hasForceShield && getRandom() < 0.4) {
    return { type: 'RaiseShield', actorId };
  }

  const basicAttack = actor.abilityIds
    .map((id) => state.abilities[id])
    .filter((a): a is AbilityDefinition => a !== undefined && (a.category === 'melee' || a.category === 'projectile'))[0];

  if (basicAttack) {
    return { type: 'Attack', actorId, targetId: unshieldedTarget.id, abilityId: basicAttack.id };
  }

  return { type: 'PassTurn', actorId };
}

export interface PartyAIPolicy {
  disableDisruptor?: boolean;
  disableBoost?: boolean;
  disableEsper?: boolean;
}

/**
 * Intelligent heuristic AI for party members in headless simulation mode.
 */
export function choosePartyActionForSim(
  state: BattleState,
  actorId: string,
  policy: PartyAIPolicy | undefined,
  rng: RNG
): BattleAction {
  const actor = state.combatants[actorId];
  if (!actor || actor.stats.hp <= 0) {
    return { type: 'PassTurn', actorId };
  }

  const getRandom = rng;

  const livingEnemies = state.enemyIds
    .map((id) => state.combatants[id])
    .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);

  if (livingEnemies.length === 0) {
    return { type: 'PassTurn', actorId };
  }

  // Psi-Blocker Priority: prioritize pylon ONLY when fewer than half of living enemies have charged disruptor OR party is above 60% total HP
  const hasLivingEspers = state.partyIds
    .map((id) => state.combatants[id])
    .some((c) => c !== undefined && c.stats.hp > 0 && c.stats.maxEsp > 0);

  const livingParty = state.partyIds
    .map((id) => state.combatants[id])
    .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);

  const totalPartyHp = livingParty.reduce((sum, c) => sum + c.stats.hp, 0);
  const totalPartyMaxHp = livingParty.reduce((sum, c) => sum + c.stats.maxHp, 0);
  const partyHpRatio = totalPartyMaxHp > 0 ? totalPartyHp / totalPartyMaxHp : 0;

  const chargedDisruptorCount = livingEnemies.filter((e) => e.disruptorCooldown === 0).length;
  const fewerThanHalfCharged = chargedDisruptorCount < (livingEnemies.length / 2);
  const isPartyHealthy = partyHpRatio > 0.60;

  const shouldFocusPsiBlocker = hasLivingEspers && (fewerThanHalfCharged || isPartyHealthy);
  const psiBlocker = shouldFocusPsiBlocker ? livingEnemies.find((e) => e.role === 'Psi-Blocker') : undefined;

  const lowestHpEnemy = [...livingEnemies].sort((a, b) => a.stats.hp - b.stats.hp)[0] as Combatant;
  const unshieldedEnemy = livingEnemies.find((c) => !c.hasForceShield) || lowestHpEnemy;

  const primaryTarget = psiBlocker || lowestHpEnemy;
  const attackTarget = psiBlocker || (getRandom() < 0.25 ? lowestHpEnemy : unshieldedEnemy);

  // If actor is crashed, must pass turn to recover
  if (actor.crashTurns > 0) {
    return { type: 'PassTurn', actorId };
  }

  const activeRules = state.rules || getDefaultRules();

  // Leaving boost is a free safety action. Evaluate it before actions that consume
  // the actor's turn so emergency healing or shielding cannot force an avoidable crash.
  if (
    actor.canBoost &&
    !policy?.disableBoost &&
    actor.isBoosting &&
    (actor.burnout >= activeRules.boost.aiDropThreshold ||
      (livingEnemies.length === 1 && primaryTarget.stats.hp <= 30))
  ) {
    return { type: 'ToggleBoost', actorId, enable: false };
  }

  // 1. Emergency Revive: if a teammate is down and party has a revive stim, prioritize reviving them
  const deadParty = state.partyIds
    .map((id) => state.combatants[id])
    .filter((c): c is Combatant => c !== undefined && c.stats.hp <= 0);

  if ((state.inventory?.revives ?? 0) > 0 && deadParty.length > 0) {
    // Revive captain first or highest max HP member
    const reviveTarget = requireValue(
      [...deadParty].sort((a, b) => b.stats.maxHp - a.stats.maxHp)[0],
      'Revive target list unexpectedly empty'
    );
    return { type: 'UseRevive', actorId, targetId: reviveTarget.id };
  }

  // 2. Emergency Field Medkit: if any teammate is critically low (under threshold) and medkits exist, heal them
  if ((state.inventory?.medkits ?? 0) > 0) {
    const criticalAlly = [...livingParty]
      .filter((c) => c.stats.hp < c.stats.maxHp * activeRules.inventory.inCombatHealThreshold)
      .sort((a, b) => (a.stats.hp / a.stats.maxHp) - (b.stats.hp / b.stats.maxHp))[0];

    if (criticalAlly) {
      return { type: 'UseMedkit', actorId, targetId: criticalAlly.id };
    }
  }

  // 3. Force Shield reaction: if an enemy has disruptor ready, raise force shield
  const enemyDisruptorThreat = livingEnemies.some((e) => e.disruptorCooldown === 0);
  if (!actor.hasForceShield && (enemyDisruptorThreat || actor.stats.hp < actor.stats.maxHp * 0.35)) {
    return { type: 'RaiseShield', actorId };
  }

  // 4. Free action: Boost stance (enter boost on heavy threats; exit voluntarily at aiDropThreshold)
  const isHighThreat = (state.encounterId && !state.encounterId.includes('skirmish')) || livingEnemies.some((e) => e.stats.hp > 150);
  const anyEnemyAbove50PctHp = livingEnemies.some((e) => e.stats.hp > e.stats.maxHp * 0.5);
  const shouldEnterBoost = isHighThreat && (livingEnemies.length >= 2 || anyEnemyAbove50PctHp);

  if (actor.canBoost && !policy?.disableBoost) {
    if (!actor.isBoosting && actor.crashTurns === 0 && actor.burnout <= 1 && shouldEnterBoost && actor.stats.hp > actor.stats.maxHp * 0.35) {
      return { type: 'ToggleBoost', actorId, enable: true };
    }
  }

  // 3. If disruptor is charged and allowed, fire at high-value targets (do not waste 6-turn CD overkilling <35 HP when only 1 enemy remains)
  const isWorthDisruptor = primaryTarget.stats.hp > 35 || livingEnemies.length > 1;
  if (!policy?.disableDisruptor && actor.disruptorCooldown === 0 && isWorthDisruptor) {
    return { type: 'Disruptor', actorId, targetId: primaryTarget.id };
  }

  // 4. Multi-target Scatter Shot: use scatter_shot when 3+ enemies are alive
  if (actor.abilityIds.includes('scatter_shot') && livingEnemies.length >= 3) {
    return { type: 'Attack', actorId, targetId: primaryTarget.id, abilityId: 'scatter_shot' };
  }

  // 5. Esper abilities if allowed, no active psi-blocker, and actor has ESP
  if (!policy?.disableEsper && !isEspBlocked(state) && actor.stats.esp >= 8) {
    const esperAbilities = actor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a): a is AbilityDefinition => a !== undefined && a.category === 'esper' && actor.stats.esp >= a.espCost);

    if (esperAbilities.length > 0) {
      // Prioritize kinetic_blast for direct armor-bypassing damage, or mind_flay if target not debuffed
      const debuffed = lowestHpEnemy.statModifiers && lowestHpEnemy.statModifiers.length > 0;
      const mindFlay = esperAbilities.find((a) => a.id === 'mind_flay');
      const kineticBlast = esperAbilities.find((a) => a.id === 'kinetic_blast');

      if (!debuffed && mindFlay && lowestHpEnemy.stats.defense >= 14) {
        return { type: 'EsperAbility', actorId, targetId: lowestHpEnemy.id, abilityId: mindFlay.id };
      }
      if (kineticBlast) {
        return { type: 'EsperAbility', actorId, targetId: lowestHpEnemy.id, abilityId: kineticBlast.id };
      }
      const fallbackEsperAbility = requireValue(
        esperAbilities[0],
        'Esper ability list unexpectedly empty'
      );
      return { type: 'EsperAbility', actorId, targetId: lowestHpEnemy.id, abilityId: fallbackEsperAbility.id };
    }
  }

  // 6. Physical Shove for Fast Striker: delay immediate enemy threats
  if (actor.abilityIds.includes('physical_shove')) {
    const immediateThreat = livingEnemies.find((e) => e.disruptorCooldown <= 1 && e.stats.hp > 30);
    if (immediateThreat && getRandom() < 0.5) {
      return { type: 'Attack', actorId, targetId: immediateThreat.id, abilityId: 'physical_shove' };
    }
  }

  // 7. Standard single-target attack
  const standardAttack = actor.abilityIds
    .map((id) => state.abilities[id])
    .filter((a): a is AbilityDefinition => a !== undefined && (a.category === 'melee' || a.category === 'projectile') && a.targetScope !== 'all_enemies')
    .sort((a, b) => b.powerMultiplier - a.powerMultiplier)[0];

  if (standardAttack) {
    return { type: 'Attack', actorId, targetId: attackTarget.id, abilityId: standardAttack.id };
  }

  return { type: 'PassTurn', actorId };
}
