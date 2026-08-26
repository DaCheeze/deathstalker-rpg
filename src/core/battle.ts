/**
 * Pure state transition functions for the battle engine.
 * Immutably processes actions, turns, events, and victory/defeat resolution.
 */

import {
  AbilityDefinition,
  BattleAction,
  BattleEvent,
  BattleLogEntry,
  BattleState,
  Combatant,
  EncounterDefinition,
  RangeBand,
  RunInventory,
} from './types';
import { calculateDamage, DamageCalculationOptions } from './damage';
import { processTurnEnd, processTurnStart } from './effects';
import { RNG } from './random';
import { getDefaultRules } from './configLoader';
import {
  advanceTurnQueue,
  displaceActorInQueue,
  initTurnQueue,
  purgeDeadFromQueue,
  refreshTurnQueue,
} from './turnQueue';

/**
 * Checks if any living combatant is a psi-blocker projecting a psionic dampening field.
 */
export function isEspBlocked(state: BattleState): boolean {
  return Object.values(state.combatants).some(
    (c) => (c.role === 'Psi-Blocker' || c.id.startsWith('psi_blocker')) && c.stats.hp > 0
  );
}

/**
 * Initializes a new battle state from party members, enemies, encounter data, and optional inventory/seed.
 */
export function initBattle(
  party: Combatant[],
  enemies: Combatant[],
  abilities: Record<string, AbilityDefinition>,
  encounter: EncounterDefinition,
  inventoryOrSeed?: Partial<RunInventory> | number,
  optionalSeed?: number
): BattleState {
  const battleMode = encounter.battleMode ?? 'legacy';
  let inventory: RunInventory = { medkits: 3, revives: 1 };
  let seed: number | undefined = undefined;

  if (typeof inventoryOrSeed === 'number') {
    seed = inventoryOrSeed;
  } else if (inventoryOrSeed && typeof inventoryOrSeed === 'object') {
    inventory = {
      medkits: inventoryOrSeed.medkits ?? 3,
      revives: inventoryOrSeed.revives ?? 1,
    };
    seed = optionalSeed;
  }

  const combatants: Record<string, Combatant> = {};
  const partyIds: string[] = [];
  const enemyIds: string[] = [];

  const partyAccentPalette = ['#38bdf8', '#c084fc', '#fb923c', '#4ade80'];
  party.forEach((p, idx) => {
    combatants[p.id] = {
      ...p,
      displayName: p.displayName || p.name,
      accentColor: p.accentColor || partyAccentPalette[idx % partyAccentPalette.length],
      stats: { ...p.stats },
      canBoost: battleMode === 'range_band_prototype' ? false : p.canBoost,
      disruptorCooldown: p.disruptorCooldown !== undefined ? p.disruptorCooldown : 3, // Starts at cooldown 3
      isBoosting: p.isBoosting ?? false,
      turnsSpentBoosting: p.turnsSpentBoosting ?? 0,
      crashTurns: p.crashTurns ?? 0,
      burnout: p.burnout ?? 0,
      hasForceShield: battleMode === 'range_band_prototype' ? false : p.hasForceShield ?? false,
      stunnedTurns: p.stunnedTurns ?? 0,
      abilityIds: [...p.abilityIds],
      rangeBand: battleMode === 'range_band_prototype' ? 'ranged' : p.rangeBand,
      engagedTargetId: battleMode === 'range_band_prototype' ? undefined : p.engagedTargetId,
      disruptorReady: battleMode === 'range_band_prototype' ? p.disruptorReady ?? true : p.disruptorReady,
    };
    partyIds.push(p.id);
  });

  // Calculate duplicate enemy names for suffix generation (e.g. "Drone A", "Drone B")
  const nameCounts: Record<string, number> = {};
  for (const e of enemies) {
    const base = e.name.replace(/\s+[A-Z]$/, '');
    nameCounts[base] = (nameCounts[base] || 0) + 1;
  }
  const nameIndex: Record<string, number> = {};
  const enemyAccentPalette = ['#f43f5e', '#fb7185', '#f87171', '#e11d48', '#fda4af', '#fbbf24'];

  enemies.forEach((e, idx) => {
    const base = e.name.replace(/\s+[A-Z]$/, '');
    const isMultiple = (nameCounts[base] || 0) > 1;
    const currentIdx = nameIndex[base] || 0;
    nameIndex[base] = currentIdx + 1;
    const suffix = isMultiple ? ` ${String.fromCharCode(65 + currentIdx)}` : '';
    const assignedDisplayName = isMultiple ? `${base}${suffix}` : e.name;
    const accentColor = e.role === 'Psi-Blocker' ? '#a855f7' : enemyAccentPalette[idx % enemyAccentPalette.length];

    combatants[e.id] = {
      ...e,
      displayName: assignedDisplayName,
      accentColor: e.accentColor || accentColor,
      stats: { ...e.stats },
      canBoost: battleMode === 'range_band_prototype' ? false : e.canBoost,
      disruptorCooldown: e.disruptorCooldown !== undefined ? e.disruptorCooldown : 3, // Starts at cooldown 3
      isBoosting: e.isBoosting ?? false,
      turnsSpentBoosting: e.turnsSpentBoosting ?? 0,
      crashTurns: e.crashTurns ?? 0,
      burnout: e.burnout ?? 0,
      hasForceShield: battleMode === 'range_band_prototype' ? false : e.hasForceShield ?? false,
      stunnedTurns: e.stunnedTurns ?? 0,
      abilityIds: [...e.abilityIds],
      rangeBand: battleMode === 'range_band_prototype' ? 'ranged' : e.rangeBand,
      engagedTargetId: battleMode === 'range_band_prototype' ? undefined : e.engagedTargetId,
      disruptorReady: battleMode === 'range_band_prototype' ? e.disruptorReady ?? true : e.disruptorReady,
    };
    enemyIds.push(e.id);
  });

  const allActiveIds = [...partyIds, ...enemyIds];
  const turnQueue = initTurnQueue(combatants, allActiveIds);
  const firstActorId = turnQueue.entries[0]?.actorId ?? partyIds[0] ?? '';

  const initialState: BattleState = {
    encounterId: encounter.id,
    battleMode,
    disruptorPowerMultiplier: encounter.disruptorPowerMultiplier,
    seed,
    turnNumber: 1,
    activeActorId: firstActorId,
    turnQueue,
    combatants,
    partyIds,
    enemyIds,
    abilities,
    inventory,
    status: 'in_progress',
    recentEvents: [],
    log: [
      {
        turnNumber: 1,
        message: `Battle commenced: ${encounter.name}.`,
        eventType: 'TURN_STARTED',
      },
    ],
  };

  if (isEspBlocked(initialState)) {
    initialState.log.push({
      turnNumber: 1,
      message: `PSI-BLOCKER DEVICE DETECTED! Psionic abilities disabled while device is operational.`,
      eventType: 'STATUS_APPLIED',
    });
  }

  // Process turn-start for first actor
  const firstActor = combatants[firstActorId];
  if (firstActor && firstActor.stats.hp > 0) {
    const startRes = processTurnStart(firstActor);
    initialState.combatants[firstActorId] = startRes.combatant;
    initialState.recentEvents.push(...startRes.events);
  }

  return initialState;
}

/**
 * Checks if the battle has concluded (all enemies dead or all party members dead).
 */
export function checkBattleStatus(
  combatants: Record<string, Combatant>,
  partyIds: string[],
  enemyIds: string[]
): 'in_progress' | 'victory' | 'defeat' {
  const anyPartyAlive = partyIds.some((id) => (combatants[id]?.stats.hp ?? 0) > 0);
  const anyEnemyAlive = enemyIds.some((id) => (combatants[id]?.stats.hp ?? 0) > 0);

  if (!anyPartyAlive) {
    return 'defeat';
  }
  if (!anyEnemyAlive) {
    return 'victory';
  }
  return 'in_progress';
}

/**
 * Returns the list of valid actions available for a given actor in the current state.
 */
export function getAvailableActions(state: BattleState, actorId: string): BattleAction[] {
  const actor = state.combatants[actorId];
  if (!actor || actor.stats.hp <= 0) {
    return []; // Dead combatants have NO valid actions
  }

  if (actor.stunnedTurns > 0 || actor.crashTurns > 0 || state.status !== 'in_progress') {
    return [{ type: 'PassTurn', actorId }];
  }

  const actions: BattleAction[] = [];
  const livingEnemies = state.enemyIds.filter((id) => (state.combatants[id]?.stats.hp ?? 0) > 0);
  const livingAllies = state.partyIds.filter((id) => (state.combatants[id]?.stats.hp ?? 0) > 0);
  const deadAllies = state.partyIds.filter((id) => (state.combatants[id]?.stats.hp ?? 0) <= 0);

  const validTargets = actor.faction === 'party' ? livingEnemies : livingAllies;

  if (state.battleMode === 'range_band_prototype') {
    const band = actor.rangeBand ?? 'ranged';

    if (state.directEngagement) {
      const currentTarget = actor.engagedTargetId
        ? state.combatants[actor.engagedTargetId]
        : undefined;
      const targetId = currentTarget && currentTarget.stats.hp > 0
        ? currentTarget.id
        : validTargets[0];
      if (targetId) {
        for (const abilityId of actor.abilityIds) {
          const ability = state.abilities[abilityId];
          if (ability?.category === 'melee') {
            actions.push({ type: 'Attack', actorId, targetId, abilityId });
          }
        }
      }
      actions.push({ type: 'PassTurn', actorId });
      return actions;
    }

    if (actor.disruptorReady && band !== 'engaged') {
      for (const targetId of validTargets) {
        actions.push({ type: 'Disruptor', actorId, targetId });
      }
    }

    if (band === 'ranged') {
      actions.push({ type: 'Advance', actorId });
    } else {
      const engagedTarget = actor.engagedTargetId
        ? state.combatants[actor.engagedTargetId]
        : undefined;
      const needsTarget = band === 'closing' || !engagedTarget || engagedTarget.stats.hp <= 0;
      if (needsTarget) {
        for (const targetId of validTargets) {
          actions.push({ type: 'Advance', actorId, targetId });
        }
      }
    }

    if (band === 'engaged' && actor.engagedTargetId) {
      const target = state.combatants[actor.engagedTargetId];
      if (target && target.stats.hp > 0) {
        for (const abilityId of actor.abilityIds) {
          const ability = state.abilities[abilityId];
          if (ability?.category === 'melee') {
            actions.push({ type: 'Attack', actorId, targetId: target.id, abilityId });
          }
        }
      }
    }

    actions.push({ type: 'PassTurn', actorId });
    return actions;
  }

  // 1. In-Combat Medkit (if party has medkits, targets any living ally missing HP)
  if (actor.faction === 'party' && (state.inventory?.medkits ?? 0) > 0) {
    for (const allyId of livingAllies) {
      const ally = state.combatants[allyId];
      if (ally && ally.stats.hp < ally.stats.maxHp) {
        actions.push({ type: 'UseMedkit', actorId, targetId: allyId });
      }
    }
  }

  // 2. In-Combat Revive (if party has revives, targets any dead ally)
  if (actor.faction === 'party' && (state.inventory?.revives ?? 0) > 0) {
    for (const allyId of deadAllies) {
      actions.push({ type: 'UseRevive', actorId, targetId: allyId });
    }
  }

  // 3. Disruptor (if ready)
  if (actor.disruptorCooldown === 0) {
    for (const targetId of validTargets) {
      actions.push({ type: 'Disruptor', actorId, targetId });
    }
  }

  // 4. Force Shield (if not already active)
  if (!actor.hasForceShield) {
    actions.push({ type: 'RaiseShield', actorId });
  }

  // 5. Boost stance toggle (Captain only; cannot enter while crashed)
  if (actor.canBoost && (actor.isBoosting || actor.crashTurns === 0)) {
    actions.push({ type: 'ToggleBoost', actorId, enable: !actor.isBoosting });
  }

  // 6. Configured abilities
  for (const abilityId of actor.abilityIds) {
    const ability = state.abilities[abilityId];
    if (!ability) continue;

    // ESP blocker check
    if (ability.category === 'esper') {
      if (isEspBlocked(state)) {
        continue; // Blocked while any psi-blocker is operational
      }
      if (actor.stats.esp < ability.espCost) {
        continue; // Insufficient ESP
      }
      for (const targetId of validTargets) {
        actions.push({ type: 'EsperAbility', actorId, targetId, abilityId });
      }
    } else if (ability.category === 'melee' || ability.category === 'projectile') {
      for (const targetId of validTargets) {
        actions.push({ type: 'Attack', actorId, targetId, abilityId });
      }
    }
  }

  // Pass turn is always a valid fallback
  actions.push({ type: 'PassTurn', actorId });

  return actions;
}

/**
 * Pure function: applies a player or enemy action, resolves combat mechanics, and advances turn.
 */
export function applyAction(
  state: BattleState,
  action: BattleAction,
  optionsOrRng?: DamageCalculationOptions | RNG
): BattleState {
  if (state.status !== 'in_progress') {
    return state;
  }

  const actorId = action.actorId;
  const actor = state.combatants[actorId];
  if (!actor) {
    return state;
  }

  // STRICT INVARIANT: Dead combatants CANNOT act!
  if (actor.stats.hp <= 0) {
    throw new Error(`Dead combatant cannot act: ${actor.displayName || actor.name} (${actorId}) has ${actor.stats.hp} HP.`);
  }

  // Deep clone combatants and log for pure state output
  const combatants: Record<string, Combatant> = {};
  for (const [id, c] of Object.entries(state.combatants)) {
    combatants[id] = {
      ...c,
      stats: { ...c.stats },
      abilityIds: [...c.abilityIds],
      statModifiers: c.statModifiers ? c.statModifiers.map((m) => ({ ...m })) : [],
    };
  }

  const activeRules = state.rules || getDefaultRules();
  const events: BattleEvent[] = [];
  const logEntries: BattleLogEntry[] = [];
  let turnQueue = { ...state.turnQueue };
  const inventory: RunInventory = {
    medkits: state.inventory?.medkits ?? 0,
    revives: state.inventory?.revives ?? 0,
  };
  const allActiveIds = [...state.partyIds, ...state.enemyIds];

  const currentActor = combatants[actorId] as Combatant;
  const disruptorAbility: AbilityDefinition = {
    id: 'disruptor_bolt',
    name: 'Disruptor Bolt',
    category: 'disruptor',
    espCost: 0,
    powerMultiplier: state.disruptorPowerMultiplier ?? 3.2,
    targetScope: 'single_enemy',
    description: 'Devastating particle beam.',
  };

  // --- ACTION RESOLUTION ---
  switch (action.type) {
    case 'UseMedkit': {
      if (inventory.medkits <= 0) {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} attempted to use a Medkit, but inventory was empty!`,
          eventType: 'ITEM_USED',
        });
        break;
      }
      const target = combatants[action.targetId];
      if (!target || target.stats.hp <= 0) {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} attempted to use a Medkit, but the target was already down!`,
          eventType: 'ITEM_USED',
        });
        break;
      }

      inventory.medkits--;
      const healAmount = Math.max(1, Math.round(target.stats.maxHp * 0.45)); // 45% max HP
      const oldHp = target.stats.hp;
      target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + healAmount);
      const actualHealed = target.stats.hp - oldHp;

      events.push({
        type: 'ITEM_USED',
        actorId,
        targetId: target.id,
        item: 'medkit',
        amountHealed: actualHealed,
      });

      logEntries.push({
        turnNumber: state.turnNumber,
        message: `${currentActor.name} applied a FIELD MEDKIT to ${target.displayName || target.name} (+${actualHealed} HP, ${inventory.medkits} remaining)!`,
        eventType: 'ITEM_USED',
      });
      break;
    }

    case 'UseRevive': {
      if (inventory.revives <= 0) {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} attempted to use a Revive Stim, but inventory was empty!`,
          eventType: 'ITEM_USED',
        });
        break;
      }
      const target = combatants[action.targetId];
      if (!target || target.stats.hp > 0) {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} attempted to use a Revive Stim, but ${target ? target.displayName || target.name : 'the target'} was already conscious!`,
          eventType: 'ITEM_USED',
        });
        break;
      }

      inventory.revives--;
      const reviveHp = Math.max(1, Math.round(target.stats.maxHp * 0.30)); // 30% max HP
      target.stats.hp = reviveHp;
      target.isBoosting = false;
      target.burnout = 0;
      target.crashTurns = 0;
      target.stunnedTurns = 0;
      target.hasForceShield = false;

      events.push({
        type: 'ITEM_USED',
        actorId,
        targetId: target.id,
        item: 'revive',
        amountHealed: reviveHp,
      });

      events.push({
        type: 'COMBATANT_REVIVED',
        targetId: target.id,
        hpRestored: reviveHp,
      });

      logEntries.push({
        turnNumber: state.turnNumber,
        message: `${currentActor.name} administered an EMERGENCY REVIVE STIM to ${target.displayName || target.name}! Revived with ${reviveHp} HP (${inventory.revives} remaining)!`,
        eventType: 'ITEM_USED',
      });

      // Re-insert revived combatant into the turn queue
      turnQueue = refreshTurnQueue(turnQueue, combatants, allActiveIds);
      break;
    }

    case 'Disruptor': {
      if (
        state.battleMode === 'range_band_prototype' &&
        (!currentActor.disruptorReady || currentActor.rangeBand === 'engaged')
      ) {
        throw new Error(`Illegal prototype disruptor action for ${actorId}`);
      }

      const target = combatants[action.targetId];
      if (!target || target.stats.hp <= 0) {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} discharged a DISRUPTOR BOLT, but the target had already fallen!`,
          eventType: 'DAMAGE_DEALT',
        });
        break;
      }

      const dmgResult = calculateDamage(currentActor, target, disruptorAbility, optionsOrRng);
      if (dmgResult.shieldDropped) {
        target.hasForceShield = false;
      }
      target.stats.hp = Math.max(0, target.stats.hp - dmgResult.finalDamage);

      const killed = target.stats.hp <= 0;
      events.push({
        type: 'DAMAGE_DEALT',
        actorId,
        targetId: target.id,
        abilityName: 'Disruptor Bolt',
        damage: dmgResult.finalDamage,
        isCrit: dmgResult.isCrit,
        isDisruptor: true,
        shieldAbsorbed: dmgResult.shieldAbsorbed,
        targetKilled: killed,
      });

      if (dmgResult.shieldAbsorbed) {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${target.name}'s Force Shield absorbed 50% of the DISRUPTOR BOLT (${dmgResult.finalDamage} damage penetrated)! Shield collapsed!`,
          eventType: 'DAMAGE_DEALT',
        });
      } else {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} fired a DISRUPTOR BOLT at ${target.name} for ${dmgResult.finalDamage} damage!${killed ? ' (FATAL)' : ''}`,
          eventType: 'DAMAGE_DEALT',
        });
      }

      if (killed) {
        turnQueue = purgeDeadFromQueue(turnQueue, combatants, allActiveIds);
      }
      if (state.battleMode === 'range_band_prototype') {
        currentActor.disruptorReady = false;
      }
      break;
    }

    case 'Advance': {
      if (state.battleMode !== 'range_band_prototype') {
        throw new Error('Advance is only available in the range-band prototype');
      }

      const from: RangeBand = currentActor.rangeBand ?? 'ranged';
      if (from === 'ranged') {
        const opposingIds = currentActor.faction === 'party' ? state.enemyIds : state.partyIds;
        const queueOrder = state.turnQueue.entries.map((entry) => entry.actorId);
        const orderedReactors = [...queueOrder, ...opposingIds].filter(
          (id, index, ids) => ids.indexOf(id) === index && opposingIds.includes(id)
        );
        const reactorId = orderedReactors.find((id) => {
          const reactor = combatants[id];
          return Boolean(
            reactor &&
            reactor.stats.hp > 0 &&
            reactor.disruptorReady &&
            reactor.rangeBand !== 'engaged'
          );
        });

        if (reactorId) {
          const reactor = combatants[reactorId] as Combatant;
          const dmgResult = calculateDamage(reactor, currentActor, disruptorAbility, optionsOrRng);
          currentActor.stats.hp = Math.max(0, currentActor.stats.hp - dmgResult.finalDamage);
          reactor.disruptorReady = false;
          const killed = currentActor.stats.hp <= 0;

          events.push({
            type: 'DAMAGE_DEALT',
            actorId: reactor.id,
            targetId: currentActor.id,
            abilityName: 'Held Disruptor Interrupt',
            damage: dmgResult.finalDamage,
            isCrit: dmgResult.isCrit,
            isDisruptor: true,
            shieldAbsorbed: false,
            targetKilled: killed,
          });
          events.push({ type: 'DISRUPTOR_INTERRUPT', actorId: reactor.id, targetId: currentActor.id });
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${reactor.name} interrupted ${currentActor.name}'s advance for ${dmgResult.finalDamage} damage!${killed ? ' (FATAL)' : ''}`,
            eventType: 'DISRUPTOR_INTERRUPT',
          });

          if (killed) {
            turnQueue = purgeDeadFromQueue(turnQueue, combatants, allActiveIds);
          }
        }

        if (currentActor.stats.hp > 0) {
          currentActor.rangeBand = 'closing';
          currentActor.engagedTargetId = undefined;
          events.push({ type: 'RANGE_CHANGED', actorId, from, to: 'closing' });
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${currentActor.name} advanced from Ranged to Closing.`,
            eventType: 'RANGE_CHANGED',
          });
        }
      } else {
        const target = action.targetId ? combatants[action.targetId] : undefined;
        const opposingIds = currentActor.faction === 'party' ? state.enemyIds : state.partyIds;
        if (!target || target.stats.hp <= 0 || !opposingIds.includes(target.id)) {
          throw new Error(`${currentActor.name} must select a living opponent to engage`);
        }
        if (from === 'engaged' && currentActor.engagedTargetId) {
          const existingTarget = combatants[currentActor.engagedTargetId];
          if (existingTarget && existingTarget.stats.hp > 0) {
            throw new Error(`${currentActor.name} is already engaged with a living opponent`);
          }
        }

        currentActor.rangeBand = 'engaged';
        currentActor.engagedTargetId = target.id;
        events.push({
          type: 'RANGE_CHANGED',
          actorId,
          from,
          to: 'engaged',
          engagedTargetId: target.id,
        });
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} engaged ${target.name}.`,
          eventType: 'RANGE_CHANGED',
        });
      }
      break;
    }

    case 'Attack': {
      const ability = state.abilities[action.abilityId];
      if (!ability) break;

      if (state.battleMode === 'range_band_prototype') {
        const opposingIds = state.partyIds.includes(actorId) ? state.enemyIds : state.partyIds;
        if (
          currentActor.rangeBand !== 'engaged' ||
          ability.category !== 'melee' ||
          !opposingIds.includes(action.targetId) ||
          (!state.directEngagement && currentActor.engagedTargetId !== action.targetId)
        ) {
          throw new Error(`Illegal prototype melee action for ${actorId}`);
        }
        if (state.directEngagement) {
          currentActor.engagedTargetId = action.targetId;
        }
      }

      const isParty = state.partyIds.includes(actorId);
      const opposingIds = isParty ? state.enemyIds : state.partyIds;

      let targets: Combatant[] = [];
      if (ability.targetScope === 'all_enemies') {
        targets = opposingIds
          .map((id) => combatants[id])
          .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);
      } else {
        const singleTarget = combatants[action.targetId];
        if (singleTarget && singleTarget.stats.hp > 0) {
          targets = [singleTarget];
        }
      }

      if (targets.length === 0) {
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} attacked with ${ability.name}, but no valid living targets remained!`,
          eventType: 'DAMAGE_DEALT',
        });
        break;
      }

      let anyKilled = false;
      for (const target of targets) {
        if (target.stats.hp <= 0) continue;

        const dmgResult = calculateDamage(currentActor, target, ability, optionsOrRng);
        
        if (dmgResult.shieldDropped) {
          target.hasForceShield = false;
        }
        
        target.stats.hp = Math.max(0, target.stats.hp - dmgResult.finalDamage);
        const killed = target.stats.hp <= 0;
        if (killed) anyKilled = true;

        events.push({
          type: 'DAMAGE_DEALT',
          actorId,
          targetId: target.id,
          abilityName: ability.name,
          damage: dmgResult.finalDamage,
          isCrit: dmgResult.isCrit,
          isDisruptor: false,
          shieldAbsorbed: dmgResult.shieldAbsorbed,
          targetKilled: killed,
        });

        if (dmgResult.shieldAbsorbed) {
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${target.displayName || target.name}'s Force Shield absorbed ${currentActor.name}'s ${ability.name}! Shield collapsed!`,
            eventType: 'DAMAGE_DEALT',
          });
        } else {
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${currentActor.name} used ${ability.name} on ${target.displayName || target.name} for ${dmgResult.finalDamage} damage.${killed ? ' (FATAL)' : ''}`,
            eventType: 'DAMAGE_DEALT',
          });
        }

        // Support displacement on melee/physical attacks (e.g. physical_shove)
        if (ability.displaceTicks && ability.displaceTicks > 0 && target.stats.hp > 0) {
          turnQueue = displaceActorInQueue(
            turnQueue,
            target.id,
            ability.displaceTicks,
            combatants,
            allActiveIds
          );
          events.push({
            type: 'TURN_DISPLACED',
            targetId: target.id,
            ticks: ability.displaceTicks,
          });
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${target.displayName || target.name} was displaced in the turn queue (+${ability.displaceTicks} delay)!`,
            eventType: 'TURN_DISPLACED',
          });
        }
      }

      if (anyKilled) {
        turnQueue = purgeDeadFromQueue(turnQueue, combatants, allActiveIds);
      }
      break;
    }

    case 'EsperAbility': {
      const ability = state.abilities[action.abilityId];
      if (!ability) break;

      if (isEspBlocked(state) || currentActor.stats.esp < ability.espCost) {
        break;
      }

      currentActor.stats.esp -= ability.espCost;
      const target = action.targetId ? combatants[action.targetId] : undefined;

      if (target) {
        if (target.stats.hp <= 0) {
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${currentActor.name} channeled ${ability.name}, but the target had already fallen!`,
            eventType: 'DAMAGE_DEALT',
          });
          break;
        }

        // Calculate damage if offensive esper power
        if (ability.powerMultiplier > 0) {
          const dmgResult = calculateDamage(currentActor, target, ability, optionsOrRng);
          if (dmgResult.shieldDropped) {
            target.hasForceShield = false;
          }
          target.stats.hp = Math.max(0, target.stats.hp - dmgResult.finalDamage);
          const killed = target.stats.hp <= 0;

          events.push({
            type: 'DAMAGE_DEALT',
            actorId,
            targetId: target.id,
            abilityName: ability.name,
            damage: dmgResult.finalDamage,
            isCrit: dmgResult.isCrit,
            isDisruptor: false,
            shieldAbsorbed: dmgResult.shieldAbsorbed,
            targetKilled: killed,
          });

          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${currentActor.name} channeled psionic power: ${ability.name} on ${target.displayName || target.name} for ${dmgResult.finalDamage} damage!${killed ? ' (FATAL)' : ''}`,
            eventType: 'DAMAGE_DEALT',
          });

          if (killed) {
            turnQueue = purgeDeadFromQueue(turnQueue, combatants, allActiveIds);
          }
        }

        // Telekinetic Turn Queue displacement
        if (ability.displaceTicks && ability.displaceTicks > 0 && target.stats.hp > 0) {
          turnQueue = displaceActorInQueue(
            turnQueue,
            target.id,
            ability.displaceTicks,
            combatants,
            allActiveIds
          );
          events.push({
            type: 'TURN_DISPLACED',
            targetId: target.id,
            ticks: ability.displaceTicks,
          });
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${target.displayName || target.name} was telekinetically displaced in the turn queue (+${ability.displaceTicks} delay)!`,
            eventType: 'TURN_DISPLACED',
          });
        }

        // Telepathic debuffs
        if (ability.debuffStats && target.stats.hp > 0) {
          target.statModifiers = target.statModifiers || [];
          target.statModifiers.push({
            attackMultiplier: ability.debuffStats.attackMultiplier,
            defenseMultiplier: ability.debuffStats.defenseMultiplier,
            turnsRemaining: ability.debuffStats.durationTurns || 2,
          });
          events.push({
            type: 'STATUS_APPLIED',
            targetId: target.id,
            description: `${ability.name} debuff`,
          });
          logEntries.push({
            turnNumber: state.turnNumber,
            message: `${target.displayName || target.name}'s mental faculties were disrupted by ${ability.name}!`,
            eventType: 'STATUS_APPLIED',
          });
        }
      }
      break;
    }

    case 'RaiseShield': {
      currentActor.hasForceShield = true;
      events.push({ type: 'SHIELD_RAISED', actorId });
      logEntries.push({
        turnNumber: state.turnNumber,
        message: `${currentActor.name} raised arm-mounted Force Shield!`,
        eventType: 'SHIELD_RAISED',
      });
      break;
    }

    case 'ToggleBoost': {
      currentActor.isBoosting = action.enable;
      if (action.enable) {
        currentActor.burnout += 2; // +2 on entering boost (Pass 12 entry cost)
        currentActor.enteredBoostThisTurn = true; // 50% damage penalty on entry turn
        currentActor.turnsSpentBoosting = 0;
        events.push({
          type: 'BOOST_CHANGED',
          actorId,
          isBoosting: true,
          burnout: currentActor.burnout,
        });
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} INJECTED COMBAT DRUGS (BOOST ACTIVE - +2 BN, 50% RAMP)! (Free Action)`,
          eventType: 'BOOST_CHANGED',
        });
      } else {
        currentActor.enteredBoostThisTurn = false;
        currentActor.isBoosting = false;
        currentActor.turnsSpentBoosting = 0;
        currentActor.crashTurns = 0; // Voluntary exit has NO crash
        events.push({
          type: 'BOOST_CHANGED',
          actorId,
          isBoosting: false,
          burnout: currentActor.burnout,
        });
        logEntries.push({
          turnNumber: state.turnNumber,
          message: `${currentActor.name} vented combat drugs (BOOST DEACTIVATED - Clean Exit, No Crash). (Free Action)`,
          eventType: 'BOOST_CHANGED',
        });
      }
      // Boost alters speed; update upcoming queue projection
      turnQueue = refreshTurnQueue(turnQueue, combatants, allActiveIds);

      // Boost entry / exit is a FREE ACTION: do not advance turn queue, actor retains their turn
      return {
        ...state,
        combatants,
        turnQueue,
        inventory,
        recentEvents: events,
        log: [...state.log, ...logEntries],
      };
    }

    case 'PassTurn': {
      logEntries.push({
        turnNumber: state.turnNumber,
        message: `${currentActor.name} stood fast.`,
        eventType: 'TURN_ENDED',
      });
      break;
    }
  }

  if (state.battleMode === 'range_band_prototype') {
    for (const combatant of Object.values(combatants)) {
      if (!combatant.engagedTargetId) continue;
      const target = combatants[combatant.engagedTargetId];
      if (!target || target.stats.hp <= 0) {
        combatant.engagedTargetId = undefined;
      }
    }
  }

  // --- PROCESS END OF CURRENT ACTOR'S TURN ---
  const endRes = processTurnEnd(currentActor);
  combatants[actorId] = endRes.combatant;
  combatants[actorId].enteredBoostThisTurn = false; // Reset boost entry ramp penalty after turn action completes
  events.push(...endRes.events);

  // If actor died from chip damage at turn end, purge queue immediately
  if (combatants[actorId].stats.hp <= 0) {
    turnQueue = purgeDeadFromQueue(turnQueue, combatants, allActiveIds);
  }

  // If disruptor was fired this turn, set its full cooldown for future turns
  if (action.type === 'Disruptor' && state.battleMode !== 'range_band_prototype') {
    combatants[actorId].disruptorCooldown = activeRules.disruptor.baseCooldownTurns;
  }

  // --- CHECK WIN / DEFEAT CONDITIONS ---
  const statusAfterAction = checkBattleStatus(combatants, state.partyIds, state.enemyIds);
  if (statusAfterAction !== 'in_progress') {
    events.push({ type: 'BATTLE_ENDED', outcome: statusAfterAction });
    logEntries.push({
      turnNumber: state.turnNumber,
      message: statusAfterAction === 'victory' ? 'VICTORY: All hostiles eliminated!' : 'DEFEAT: The crew has fallen.',
      eventType: 'BATTLE_ENDED',
    });

    return {
      ...state,
      turnNumber: state.turnNumber + 1,
      combatants,
      turnQueue,
      inventory,
      status: statusAfterAction,
      recentEvents: events,
      log: [...state.log, ...logEntries],
    };
  }

  // --- ADVANCE TO NEXT ACTOR IN TURN QUEUE ---
  let nextQueue = advanceTurnQueue(turnQueue, combatants, allActiveIds, actorId);
  let nextActorId = nextQueue.nextActorId;
  let currentTurnNumber = state.turnNumber + 1;

  // Process turn start effects (burnout chip damage, stun, etc.)
  while (nextActorId) {
    const nextActor = combatants[nextActorId];
    if (!nextActor || nextActor.stats.hp <= 0) {
      // Remove dead combatant and advance further
      nextQueue = advanceTurnQueue(nextQueue.updatedQueue, combatants, allActiveIds, nextActorId);
      nextActorId = nextQueue.nextActorId;
      continue;
    }

    const startRes = processTurnStart(nextActor, activeRules);
    combatants[nextActorId] = startRes.combatant;
    events.push(...startRes.events);

    // If actor died from turn-start chip damage, purge queue
    if (combatants[nextActorId].stats.hp <= 0) {
      nextQueue.updatedQueue = purgeDeadFromQueue(nextQueue.updatedQueue, combatants, allActiveIds);
    }

    // Check if burnout chip damage killed actor or ended the battle
    const midBattleStatus = checkBattleStatus(combatants, state.partyIds, state.enemyIds);
    if (midBattleStatus !== 'in_progress') {
      events.push({ type: 'BATTLE_ENDED', outcome: midBattleStatus });
      return {
        ...state,
        turnNumber: currentTurnNumber,
        activeActorId: nextActorId,
        turnQueue: nextQueue.updatedQueue,
        combatants,
        inventory,
        status: midBattleStatus,
        recentEvents: events,
        log: [...state.log, ...logEntries],
      };
    }

    // If next actor can act, stop here; otherwise advance past their turn
    if (startRes.canAct && combatants[nextActorId] && combatants[nextActorId].stats.hp > 0) {
      events.push({
        type: 'TURN_STARTED',
        actorId: nextActorId,
        turnNumber: currentTurnNumber,
      });
      break;
    } else {
      // Actor is stunned or unable to act: process their turn end & advance queue
      const stunnedEnd = processTurnEnd(combatants[nextActorId] as Combatant);
      combatants[nextActorId] = stunnedEnd.combatant;
      events.push(...stunnedEnd.events);

      logEntries.push({
        turnNumber: currentTurnNumber,
        message: `${nextActor.name} was stunned and could not act.`,
        eventType: 'BURNOUT_STUNNED',
      });

      nextQueue = advanceTurnQueue(nextQueue.updatedQueue, combatants, allActiveIds, nextActorId);
      nextActorId = nextQueue.nextActorId;
      currentTurnNumber++;
    }
  }

  return {
    ...state,
    turnNumber: currentTurnNumber,
    activeActorId: nextActorId,
    turnQueue: nextQueue.updatedQueue,
    combatants,
    inventory,
    status: 'in_progress',
    recentEvents: events,
    log: [...state.log, ...logEntries],
  };
}
