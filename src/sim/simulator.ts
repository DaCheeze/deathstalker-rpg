/**
 * Headless Run-Based Battle Simulator.
 * Simulates complete multi-encounter runs with persistent party state,
 * limited healing economy, deterministic seeded PRNG, and deep telemetry.
 */

import {
  AbilityDefinition,
  BattleAction,
  Combatant,
  EncounterDefinition,
  EncounterTier,
  EquipmentItem,
  RunInventory,
} from '../core/types';
import { applyAction } from '../core/battle';
import {
  applyIntermissionMedkit,
  applyIntermissionRevive,
  completeRunEncounter,
  initRun,
  startRunEncounter,
} from '../core/run';
import { computeCombatantStats } from '../core/progression';
import { chooseEnemyAction, choosePartyActionForSim, PartyAIPolicy } from '../core/ai';
import { createRng } from '../core/random';
import { GameRules, getDefaultRules } from '../core/configLoader';

export interface AbilityDiag {
  casts: number;
  damage: number;
  displacementTicks: number;
  displacementTurns: number;
}

export interface BattleReplay {
  seed: number;
  encounterId: string;
  encounterName: string;
  encounterTier: EncounterTier;
  initialParty: Combatant[];
  initialEnemies: Combatant[];
  actions: BattleAction[];
  summary: {
    winner: 'party' | 'enemies' | 'timeout';
    totalActions: number;
    totalRounds: number;
  };
}

export interface EncounterRunTelemetry {
  id: string;
  name: string;
  tier: EncounterTier;
  index: number;
  starts: number;
  wins: number;
  winRate: number;
  avgActions: number;
  minActions: number;
  maxActions: number;
  avgRounds: number;
  minRounds: number;
  maxRounds: number;
  partyDamageReceived: {
    weapon: number;
    disruptor: number;
    esper: number;
    burnout: number;
    total: number;
  };
  avgHpLostBeforeHealing: number;
  avgHpLostPct: number;
  crewDamageDealt: Record<string, number>;
  disruptorCoolingStarts: number;
  voluntaryBoostExits: number;
  forcedBoostCrashes: number;
  crashTurns: number;
  medkitsUsed: number;
  revivesUsed: number;
}

export interface BoostDiagnostics {
  totalBurnoutChipHpLost: number;
  avgBurnoutChipHpPerRun: number;
  totalExtraDamageDealtByBoost: number;
  avgExtraDamageDealtPerRun: number;
  totalBoostActivations: number;
  totalBoostExits: number;
  avgTurnsSpentBoostingPerActivation: number;
  avgBurnoutAtEntry: number;
  avgBurnoutAtExit: number;
  isNetPositive: boolean;
  damageToHpRatio: number;
}

export interface MedkitsAtFinalDistribution {
  zero: number;
  one: number;
  twoOrMore: number;
  pctWithAtLeastOne: number;
}

export interface RunSimulationResult {
  seed: number;
  totalRuns: number;
  completedRuns: number;
  failedRuns: number;
  runCompletionRate: number;

  fightsSurvivedDistribution: {
    diedAtFight1: number;
    diedAtFight2: number;
    diedAtFight3: number;
    diedAtFight4: number;
    diedAtFight5: number;
    completed: number;
  };

  partyHpEnteringFinalPct: number;
  avgPartyHpEnteringFinal: number;
  partyHpEnteringFinalStandardPct: number;
  avgPartyHpEnteringFinalStandard: number;
  avgMedkitsConsumedBeforeFinalPct: number;
  totalPartyMaxHp: number;

  avgMedkitsAtFinal: number;
  medkitsAtFinalDistribution?: MedkitsAtFinalDistribution;
  avgRevivesAtFinal: number;

  disruptorCoolingStarts: number;
  totalEncounterStarts: number;
  disruptorCoolingPct: number;

  totalMedkitsUsed: number;
  totalRevivesUsed: number;
  totalBoostsActivated: number;
  totalVoluntaryBoostExits: number;
  totalForcedBoostCrashes: number;
  totalCrashTurns: number;
  avgCrashTurnsPerRun: number;

  boostDiagnostics: BoostDiagnostics;

  tierAttrition: {
    skirmish: { targetPct: number; actualPct: number; avgHpLost: number };
    standard: { targetPct: number; actualPct: number; avgHpLost: number };
    elite: { targetPct: number; actualPct: number; avgHpLost: number };
  };

  encounterBreakdowns: Record<string, EncounterRunTelemetry>;
  sampleReplays?: Record<string, { shortest: BattleReplay; median: BattleReplay; longest: BattleReplay }>;
  allReplays?: BattleReplay[];
}

export interface SimulationOptions {
  policy?: PartyAIPolicy;
  startingInventory?: Partial<RunInventory>;
  recordOptions?: { recordAll?: boolean; recordSamples?: boolean };
  rules?: GameRules;
  partyLevel?: number;
  equipmentMap?: Record<string, EquipmentItem>;
  equipped?: Record<string, { weaponId?: string; accessoryId?: string }>;
  supplyMode?: 'full' | 'half' | 'none';
}

export function runSimulation(
  partyData: Combatant[],
  enemiesData: Record<string, Combatant>,
  abilitiesData: Record<string, AbilityDefinition>,
  encountersData: EncounterDefinition[],
  iterations: number = 500,
  policy?: PartyAIPolicy,
  seed: number = 12345,
  startingInventory?: Partial<RunInventory>,
  recordOptions?: { recordAll?: boolean; recordSamples?: boolean },
  rules?: GameRules,
  partyLevel?: number,
  equipmentMap?: Record<string, EquipmentItem>,
  equipped?: Record<string, { weaponId?: string; accessoryId?: string }>,
  supplyMode?: 'full' | 'half' | 'none'
): RunSimulationResult {
  const activeRules = rules || getDefaultRules();
  const rng = createRng(seed);

  // Compute scaled party stats based on level and equipment
  const effectiveLevel = partyLevel ?? activeRules.progression?.recommendedLevel ?? 1;
  const scaledPartyData = partyData.map((c) => {
    const charEquip = equipped?.[c.id] || {};
    const weapon = charEquip.weaponId && equipmentMap ? equipmentMap[charEquip.weaponId] : undefined;
    const accessory = charEquip.accessoryId && equipmentMap ? equipmentMap[charEquip.accessoryId] : undefined;
    return computeCombatantStats(c, effectiveLevel, undefined, weapon, accessory, activeRules);
  });

  let activeStartingInventory: Partial<RunInventory> | undefined = startingInventory;
  if (!activeStartingInventory && supplyMode) {
    const maxMeds = activeRules.progression?.maxMedkitsPerExpedition ?? 4;
    const maxRevs = activeRules.progression?.maxRevivesPerExpedition ?? 2;
    if (supplyMode === 'half') {
      activeStartingInventory = { medkits: Math.floor(maxMeds / 2), revives: Math.floor(maxRevs / 2) };
    } else if (supplyMode === 'none') {
      activeStartingInventory = { medkits: 0, revives: 0 };
    } else {
      activeStartingInventory = { medkits: maxMeds, revives: maxRevs };
    }
  }

  // Canonical 5-fight run sequence
  const runSequence: EncounterDefinition[] = [
    encountersData.find((e) => e.id === 'enc_empire_skirmish') || encountersData[0]!,
    encountersData.find((e) => e.id === 'enc_shub_skirmish') || encountersData[1]!,
    encountersData.find((e) => e.id === 'enc_empire_patrol') || encountersData[2]!,
    encountersData.find((e) => e.id === 'enc_shub_swarm') || encountersData[3]!,
    encountersData.find((e) => e.id === 'enc_hadenman_vanguard') || encountersData[4]!,
  ];

  let completedRuns = 0;
  let failedRuns = 0;

  const fightsSurvivedDist = {
    diedAtFight1: 0,
    diedAtFight2: 0,
    diedAtFight3: 0,
    diedAtFight4: 0,
    diedAtFight5: 0,
    completed: 0,
  };

  let totalPartyHpAtFinalSum = 0;
  let runsReachingFinalCount = 0;
  let totalPartyHpAtFinalStandardSum = 0;
  let runsReachingFinalStandardCount = 0;
  let medkitsConsumedBeforeFinalPctSum = 0;
  let medkitsAtFinalSum = 0;
  let medkitsAtFinalZeroCount = 0;
  let medkitsAtFinalOneCount = 0;
  let medkitsAtFinalTwoOrMoreCount = 0;
  let revivesAtFinalSum = 0;

  let totalDisruptorCoolingStarts = 0;
  let totalNonFirstEncounterStarts = 0;

  let totalMedkitsUsed = 0;
  let totalRevivesUsed = 0;
  let totalBoosts = 0;
  let totalVoluntaryExits = 0;
  let totalForcedCrashes = 0;
  let totalCrashTurns = 0;

  // Detailed Boost Diagnostics counters
  let totalBurnoutChipHpLost = 0;
  let totalExtraDamageDealtByBoost = 0;
  let totalTurnsSpentBoosting = 0;
  let totalBoostExits = 0;
  let burnoutAtEntrySum = 0;
  let burnoutAtExitSum = 0;

  const encounterBreakdowns: Record<string, EncounterRunTelemetry> = {};
  const recordedBattlesByEnc: Record<string, { replay: BattleReplay; actionCount: number }[]> = {};

  runSequence.forEach((enc, idx) => {
    encounterBreakdowns[enc.id] = {
      id: enc.id,
      name: enc.name,
      tier: enc.tier,
      index: idx + 1,
      starts: 0,
      wins: 0,
      winRate: 0,
      avgActions: 0,
      minActions: Infinity,
      maxActions: 0,
      avgRounds: 0,
      minRounds: Infinity,
      maxRounds: 0,
      partyDamageReceived: { weapon: 0, disruptor: 0, esper: 0, burnout: 0, total: 0 },
      avgHpLostBeforeHealing: 0,
      avgHpLostPct: 0,
      crewDamageDealt: { 'Captain Valen': 0, 'Lyra': 0, 'Kaelen': 0, 'Tarek': 0 },
      disruptorCoolingStarts: 0,
      voluntaryBoostExits: 0,
      forcedBoostCrashes: 0,
      crashTurns: 0,
      medkitsUsed: 0,
      revivesUsed: 0,
    };
    recordedBattlesByEnc[enc.id] = [];
  });

  const totalPartyMaxHp = scaledPartyData.reduce((sum, c) => sum + c.stats.maxHp, 0);

  // Execute runs
  for (let runIdx = 0; runIdx < iterations; runIdx++) {
    const runSeed = Math.floor(rng() * 10000000);
    const runRng = createRng(runSeed);

    let run = initRun(scaledPartyData, runSequence, runSeed, activeStartingInventory, activeRules);

    while (run.status === 'in_progress') {
      const encIndex = run.currentEncounterIndex;
      const encDef = run.encounterSequence[encIndex]!;
      const encTelemetry = encounterBreakdowns[encDef.id]!;
      encTelemetry.starts++;

      // Intermission AI healing policy before fight (fights 2-5)
      if (encIndex > 0) {
        // Revive dead party member if revive stims available
        for (const pid of run.partyIds) {
          if (run.party[pid]!.stats.hp <= 0 && run.inventory.revives > 0) {
            run = applyIntermissionRevive(run, pid, activeRules);
            totalRevivesUsed++;
            encTelemetry.revivesUsed++;
          }
        }
        // Patch up heavily injured party members (<50% HP) if medkits available
        for (const pid of run.partyIds) {
          const member = run.party[pid]!;
          if (member.stats.hp > 0 && member.stats.hp < member.stats.maxHp * activeRules.inventory.intermissionHealThreshold && run.inventory.medkits > 0) {
            run = applyIntermissionMedkit(run, pid, activeRules);
            totalMedkitsUsed++;
            encTelemetry.medkitsUsed++;
          }
        }

        // Track disruptor carryover at start of fight
        totalNonFirstEncounterStarts++;
        const hasCoolingDisruptor = run.partyIds.some((id) => (run.party[id]?.disruptorCooldown ?? 0) > 0);
        if (hasCoolingDisruptor) {
          totalDisruptorCoolingStarts++;
          encTelemetry.disruptorCoolingStarts++;
        }
      }

      // Track conditions entering the final standard encounter (Fight 4 - Shub Swarm)
      if (encIndex === 3) {
        runsReachingFinalStandardCount++;
        const currentPartyHp = run.partyIds.reduce((sum, id) => sum + (run.party[id]?.stats.hp ?? 0), 0);
        totalPartyHpAtFinalStandardSum += currentPartyHp;
      }

      // Track conditions entering the final encounter (Fight 5 - Hadenman Vanguard)
      if (encIndex === 4) {
        runsReachingFinalCount++;
        const currentPartyHp = run.partyIds.reduce((sum, id) => sum + (run.party[id]?.stats.hp ?? 0), 0);
        totalPartyHpAtFinalSum += currentPartyHp;
        medkitsAtFinalSum += run.inventory.medkits;
        revivesAtFinalSum += run.inventory.revives;
        if (run.inventory.medkits === 0) medkitsAtFinalZeroCount++;
        else if (run.inventory.medkits === 1) medkitsAtFinalOneCount++;
        else medkitsAtFinalTwoOrMoreCount++;

        const startingMeds = Math.max(1, activeRules.inventory.medkits);
        const consumedPct = (startingMeds - run.inventory.medkits) / startingMeds;
        medkitsConsumedBeforeFinalPctSum += Math.max(0, consumedPct);
      }

      // Start the encounter
      let battle = startRunEncounter(run, enemiesData, abilitiesData, activeRules);
      const replayActions: BattleAction[] = [];

      let actionCount = 0;
      const MAX_ACTIONS = 140;

      while (battle.status === 'in_progress' && actionCount < MAX_ACTIONS) {
        actionCount++;
        const actorId = battle.activeActorId;
        const actor = battle.combatants[actorId];
        if (!actor || actor.stats.hp <= 0) {
          break;
        }

        const isParty = battle.partyIds.includes(actorId);
        const action = isParty
          ? choosePartyActionForSim(battle, actorId, policy, runRng)
          : chooseEnemyAction(battle, actorId, runRng);

        if (recordOptions) {
          replayActions.push(action);
        }

        if (action.type === 'UseMedkit') {
          totalMedkitsUsed++;
          encTelemetry.medkitsUsed++;
        } else if (action.type === 'UseRevive') {
          totalRevivesUsed++;
          encTelemetry.revivesUsed++;
        } else if (action.type === 'ToggleBoost') {
          if (action.enable) {
            totalBoosts++;
            burnoutAtEntrySum += (actor.burnout + activeRules.boost.entryBurnout);
          } else {
            totalVoluntaryExits++;
            totalBoostExits++;
            burnoutAtExitSum += actor.burnout;
            encTelemetry.voluntaryBoostExits++;
          }
        }

        // Track active turns spent boosting (actions taken while boosted)
        if (actor.isBoosting && action.type !== 'ToggleBoost') {
          totalTurnsSpentBoosting++;
        }

        battle = applyAction(battle, action, runRng);

        // Process battle event telemetry
        for (const ev of battle.recentEvents) {
          if (ev.type === 'DAMAGE_DEALT') {
            if (battle.partyIds.includes(ev.actorId)) {
              const actorName = battle.combatants[ev.actorId]?.name ?? ev.actorId;
              encTelemetry.crewDamageDealt[actorName] = (encTelemetry.crewDamageDealt[actorName] || 0) + ev.damage;

              // Track extra damage gained from boost
              const actingUnit = battle.combatants[ev.actorId];
              if (actingUnit?.isBoosting) {
                // Boost is +50% multiplier (1.5x)
                // Base damage = ev.damage / 1.5; Extra damage = ev.damage - Base damage = ev.damage / 3
                const extraDmg = Math.round(ev.damage / 3);
                totalExtraDamageDealtByBoost += Math.max(0, extraDmg);
              }
            } else if (battle.partyIds.includes(ev.targetId)) {
              encTelemetry.partyDamageReceived.total += ev.damage;
              if (ev.isDisruptor) encTelemetry.partyDamageReceived.disruptor += ev.damage;
              else encTelemetry.partyDamageReceived.weapon += ev.damage;
            }
          } else if (ev.type === 'BURNOUT_CHIP_DAMAGE') {
            encTelemetry.partyDamageReceived.burnout += ev.damage;
            encTelemetry.partyDamageReceived.total += ev.damage;
            totalBurnoutChipHpLost += ev.damage;
          } else if (ev.type === 'BOOST_CRASHED') {
            totalForcedCrashes++;
            totalBoostExits++;
            totalCrashTurns += ev.crashTurns;
            burnoutAtExitSum += activeRules.boost.crashThreshold; // Crashed at crash threshold
            encTelemetry.forcedBoostCrashes++;
            encTelemetry.crashTurns += ev.crashTurns;
          }
        }
      }

      run = completeRunEncounter(run, battle, activeRules);

      // Calculate rounds for this fight (4 party members per round)
      const rounds = actionCount / 4;

      encTelemetry.avgActions += actionCount;
      encTelemetry.minActions = Math.min(encTelemetry.minActions, actionCount);
      encTelemetry.maxActions = Math.max(encTelemetry.maxActions, actionCount);
      encTelemetry.avgRounds += rounds;
      encTelemetry.minRounds = Math.min(encTelemetry.minRounds, rounds);
      encTelemetry.maxRounds = Math.max(encTelemetry.maxRounds, rounds);

      if (battle.status === 'victory') {
        encTelemetry.wins++;
      }

      // Record sample battle replay if enabled
      if (recordOptions && encTelemetry.starts <= 50) {
        recordedBattlesByEnc[encDef.id]!.push({
          actionCount,
          replay: {
            seed: runSeed,
            encounterId: encDef.id,
            encounterName: encDef.name,
            encounterTier: encDef.tier,
            initialParty: run.partyIds.map((id) => ({ ...run.party[id]!, stats: { ...run.party[id]!.stats }, abilityIds: [...run.party[id]!.abilityIds] })),
            initialEnemies: encDef.enemyIds.map((eid, idx) => ({ ...enemiesData[eid]!, id: `${eid}_${idx + 1}`, stats: { ...enemiesData[eid]!.stats }, abilityIds: [...enemiesData[eid]!.abilityIds] })),
            actions: replayActions,
            summary: {
              winner: battle.status === 'victory' ? 'party' : 'enemies',
              totalActions: actionCount,
              totalRounds: Math.round(rounds * 10) / 10,
            },
          },
        });
      }
    }

    // Run finished: record outcome
    if (run.status === 'completed') {
      completedRuns++;
      fightsSurvivedDist.completed++;
    } else {
      failedRuns++;
      const diedAt = run.currentEncounterIndex + 1;
      if (diedAt === 1) fightsSurvivedDist.diedAtFight1++;
      else if (diedAt === 2) fightsSurvivedDist.diedAtFight2++;
      else if (diedAt === 3) fightsSurvivedDist.diedAtFight3++;
      else if (diedAt === 4) fightsSurvivedDist.diedAtFight4++;
      else if (diedAt === 5) fightsSurvivedDist.diedAtFight5++;
    }
  }

  // Compute aggregated rates
  const runCompletionRate = (completedRuns / iterations) * 100;
  const avgPartyHpEnteringFinal = runsReachingFinalCount > 0 ? totalPartyHpAtFinalSum / runsReachingFinalCount : 0;
  const partyHpEnteringFinalPct = totalPartyMaxHp > 0 ? (avgPartyHpEnteringFinal / totalPartyMaxHp) * 100 : 0;
  const avgPartyHpEnteringFinalStandard = runsReachingFinalStandardCount > 0 ? totalPartyHpAtFinalStandardSum / runsReachingFinalStandardCount : 0;
  const partyHpEnteringFinalStandardPct = totalPartyMaxHp > 0 ? (avgPartyHpEnteringFinalStandard / totalPartyMaxHp) * 100 : 0;
  const avgMedkitsConsumedBeforeFinalPct = runsReachingFinalCount > 0 ? (medkitsConsumedBeforeFinalPctSum / runsReachingFinalCount) * 100 : 0;
  const avgMedkitsAtFinal = runsReachingFinalCount > 0 ? medkitsAtFinalSum / runsReachingFinalCount : 0;
  const medkitsAtFinalDistribution: MedkitsAtFinalDistribution = {
    zero: runsReachingFinalCount > 0 ? (medkitsAtFinalZeroCount / runsReachingFinalCount) * 100 : 0,
    one: runsReachingFinalCount > 0 ? (medkitsAtFinalOneCount / runsReachingFinalCount) * 100 : 0,
    twoOrMore: runsReachingFinalCount > 0 ? (medkitsAtFinalTwoOrMoreCount / runsReachingFinalCount) * 100 : 0,
    pctWithAtLeastOne: runsReachingFinalCount > 0 ? ((medkitsAtFinalOneCount + medkitsAtFinalTwoOrMoreCount) / runsReachingFinalCount) * 100 : 0,
  };
  const avgRevivesAtFinal = runsReachingFinalCount > 0 ? revivesAtFinalSum / runsReachingFinalCount : 0;
  const disruptorCoolingPct = totalNonFirstEncounterStarts > 0 ? (totalDisruptorCoolingStarts / totalNonFirstEncounterStarts) * 100 : 0;

  for (const enc of Object.values(encounterBreakdowns)) {
    enc.winRate = enc.starts > 0 ? (enc.wins / enc.starts) * 100 : 0;
    enc.avgActions = enc.starts > 0 ? enc.avgActions / enc.starts : 0;
    enc.avgRounds = enc.starts > 0 ? enc.avgRounds / enc.starts : 0;
    enc.avgHpLostBeforeHealing = enc.starts > 0 ? enc.partyDamageReceived.total / enc.starts : 0;
    enc.avgHpLostPct = totalPartyMaxHp > 0 ? (enc.avgHpLostBeforeHealing / totalPartyMaxHp) * 100 : 0;
  }

  // Calculate Tier Attrition
  const f1 = encounterBreakdowns['enc_empire_skirmish'];
  const f2 = encounterBreakdowns['enc_shub_skirmish'];
  const f3 = encounterBreakdowns['enc_empire_patrol'];
  const f4 = encounterBreakdowns['enc_shub_swarm'];
  const f5 = encounterBreakdowns['enc_hadenman_vanguard'];

  const skirmishAvgDmg = ((f1?.avgHpLostBeforeHealing || 0) + (f2?.avgHpLostBeforeHealing || 0)) / 2;
  const standardAvgDmg = ((f3?.avgHpLostBeforeHealing || 0) + (f4?.avgHpLostBeforeHealing || 0)) / 2;
  const eliteAvgDmg = f5?.avgHpLostBeforeHealing || 0;

  const tierAttrition = {
    skirmish: {
      targetPct: 10,
      actualPct: (skirmishAvgDmg / totalPartyMaxHp) * 100,
      avgHpLost: skirmishAvgDmg,
    },
    standard: {
      targetPct: 25,
      actualPct: (standardAvgDmg / totalPartyMaxHp) * 100,
      avgHpLost: standardAvgDmg,
    },
    elite: {
      targetPct: 35,
      actualPct: (eliteAvgDmg / totalPartyMaxHp) * 100,
      avgHpLost: eliteAvgDmg,
    },
  };

  // Boost Diagnostics calculation
  const avgBurnoutChipHpPerRun = totalBurnoutChipHpLost / iterations;
  const avgExtraDamageDealtPerRun = totalExtraDamageDealtByBoost / iterations;
  const avgTurnsSpentBoostingPerActivation = totalBoosts > 0 ? totalTurnsSpentBoosting / totalBoosts : 0;
  const avgBurnoutAtEntry = totalBoosts > 0 ? burnoutAtEntrySum / totalBoosts : 0;
  const avgBurnoutAtExit = totalBoostExits > 0 ? burnoutAtExitSum / totalBoostExits : 0;
  const isNetPositive = avgExtraDamageDealtPerRun > avgBurnoutChipHpPerRun;
  const damageToHpRatio = avgBurnoutChipHpPerRun > 0 ? avgExtraDamageDealtPerRun / avgBurnoutChipHpPerRun : avgExtraDamageDealtPerRun;

  const boostDiagnostics: BoostDiagnostics = {
    totalBurnoutChipHpLost,
    avgBurnoutChipHpPerRun,
    totalExtraDamageDealtByBoost,
    avgExtraDamageDealtPerRun,
    totalBoostActivations: totalBoosts,
    totalBoostExits,
    avgTurnsSpentBoostingPerActivation,
    avgBurnoutAtEntry,
    avgBurnoutAtExit,
    isNetPositive,
    damageToHpRatio,
  };

  // Build sample replays if requested
  const sampleReplays: Record<string, { shortest: BattleReplay; median: BattleReplay; longest: BattleReplay }> = {};
  if (recordOptions?.recordSamples) {
    for (const [encId, list] of Object.entries(recordedBattlesByEnc)) {
      if (list.length === 0) continue;
      const sorted = [...list].sort((a, b) => a.actionCount - b.actionCount);
      const shortest = sorted[0]!.replay;
      const median = sorted[Math.floor(sorted.length / 2)]!.replay;
      const longest = sorted[sorted.length - 1]!.replay;
      sampleReplays[encId] = { shortest, median, longest };
    }
  }

  return {
    seed,
    totalRuns: iterations,
    completedRuns,
    failedRuns,
    runCompletionRate,
    fightsSurvivedDistribution: fightsSurvivedDist,
    partyHpEnteringFinalPct,
    avgPartyHpEnteringFinal,
    partyHpEnteringFinalStandardPct,
    avgPartyHpEnteringFinalStandard,
    avgMedkitsConsumedBeforeFinalPct,
    totalPartyMaxHp,
    avgMedkitsAtFinal,
    medkitsAtFinalDistribution,
    avgRevivesAtFinal,
    disruptorCoolingStarts: totalDisruptorCoolingStarts,
    totalEncounterStarts: totalNonFirstEncounterStarts,
    disruptorCoolingPct,
    totalMedkitsUsed,
    totalRevivesUsed,
    totalBoostsActivated: totalBoosts,
    totalVoluntaryBoostExits: totalVoluntaryExits,
    totalForcedBoostCrashes: totalForcedCrashes,
    totalCrashTurns,
    avgCrashTurnsPerRun: totalCrashTurns / iterations,
    boostDiagnostics,
    tierAttrition,
    encounterBreakdowns,
    sampleReplays: recordOptions?.recordSamples ? sampleReplays : undefined,
  };
}

export interface LevelSweepResult {
  recommendedLevel: number;
  levels: {
    level: number;
    offset: number; // e.g. -2, -1, 0, +1
    result: RunSimulationResult;
  }[];
  supplySweep: {
    full: RunSimulationResult;
    half: RunSimulationResult;
    delta: number;
  };
}

/**
 * Sweeps party level from (recLevel - 2) to (recLevel + 1) and tests supply sensitivity.
 */
export function runLevelSweep(
  partyData: Combatant[],
  enemiesData: Record<string, Combatant>,
  abilitiesData: Record<string, AbilityDefinition>,
  encountersData: EncounterDefinition[],
  equipmentMap?: Record<string, EquipmentItem>,
  iterations: number = 500,
  seed: number = 12345,
  rules?: GameRules
): LevelSweepResult {
  const activeRules = rules || getDefaultRules();
  const recLevel = activeRules.progression?.recommendedLevel ?? 3;
  const offsets = [-2, -1, 0, 1];

  const levels = offsets.map((offset) => {
    const lvl = Math.max(1, recLevel + offset);
    const result = runSimulation(
      partyData,
      enemiesData,
      abilitiesData,
      encountersData,
      iterations,
      undefined,
      seed,
      undefined,
      undefined,
      activeRules,
      lvl,
      equipmentMap
    );
    return { level: lvl, offset, result };
  });

  // Supply sweep at recommended level
  const fullSupplyResult = runSimulation(
    partyData,
    enemiesData,
    abilitiesData,
    encountersData,
    iterations,
    undefined,
    seed,
    undefined,
    undefined,
    activeRules,
    recLevel,
    equipmentMap,
    undefined,
    'full'
  );

  const halfSupplyResult = runSimulation(
    partyData,
    enemiesData,
    abilitiesData,
    encountersData,
    iterations,
    undefined,
    seed,
    undefined,
    undefined,
    activeRules,
    recLevel,
    equipmentMap,
    undefined,
    'half'
  );

  const delta = fullSupplyResult.runCompletionRate - halfSupplyResult.runCompletionRate;

  return {
    recommendedLevel: recLevel,
    levels,
    supplySweep: {
      full: fullSupplyResult,
      half: halfSupplyResult,
      delta,
    },
  };
}

