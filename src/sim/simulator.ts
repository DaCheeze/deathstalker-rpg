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
import { chooseEnemyAction, choosePartyActionForSim, PartyAIPolicy } from '../core/ai';
import { createRng } from '../core/random';

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
  totalPartyMaxHp: number;

  avgMedkitsAtFinal: number;
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

  tierAttrition: {
    skirmish: { targetPct: number; actualPct: number; avgHpLost: number };
    standard: { targetPct: number; actualPct: number; avgHpLost: number };
    elite: { targetPct: number; actualPct: number; avgHpLost: number };
  };

  encounterBreakdowns: Record<string, EncounterRunTelemetry>;
  sampleReplays?: Record<string, { shortest: BattleReplay; median: BattleReplay; longest: BattleReplay }>;
  allReplays?: BattleReplay[];
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
  recordOptions?: { recordAll?: boolean; recordSamples?: boolean }
): RunSimulationResult {
  const rng = createRng(seed);

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
  let medkitsAtFinalSum = 0;
  let revivesAtFinalSum = 0;

  let totalDisruptorCoolingStarts = 0;
  let totalNonFirstEncounterStarts = 0;

  let totalMedkitsUsed = 0;
  let totalRevivesUsed = 0;
  let totalBoosts = 0;
  let totalVoluntaryExits = 0;
  let totalForcedCrashes = 0;
  let totalCrashTurns = 0;

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

  const totalPartyMaxHp = partyData.reduce((sum, c) => sum + c.stats.maxHp, 0);

  // Execute runs
  for (let runIdx = 0; runIdx < iterations; runIdx++) {
    const runSeed = Math.floor(rng() * 10000000);
    const runRng = createRng(runSeed);

    let run = initRun(partyData, runSequence, runSeed, startingInventory);

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
            run = applyIntermissionRevive(run, pid);
            totalRevivesUsed++;
            encTelemetry.revivesUsed++;
          }
        }
        // Patch up heavily injured party members (<50% HP) if medkits available
        for (const pid of run.partyIds) {
          const member = run.party[pid]!;
          if (member.stats.hp > 0 && member.stats.hp < member.stats.maxHp * 0.50 && run.inventory.medkits > 0) {
            run = applyIntermissionMedkit(run, pid);
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

      // Track conditions entering the final encounter (Fight 5 - Hadenman Vanguard)
      if (encIndex === 4) {
        runsReachingFinalCount++;
        const currentPartyHp = run.partyIds.reduce((sum, id) => sum + (run.party[id]?.stats.hp ?? 0), 0);
        totalPartyHpAtFinalSum += currentPartyHp;
        medkitsAtFinalSum += run.inventory.medkits;
        revivesAtFinalSum += run.inventory.revives;
      }

      // Start the encounter
      let battle = startRunEncounter(run, enemiesData, abilitiesData);
      const replayActions: BattleAction[] = [];

      let actionCount = 0;
      const MAX_ACTIONS = 120;

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
          } else {
            totalVoluntaryExits++;
            encTelemetry.voluntaryBoostExits++;
          }
        }

        battle = applyAction(battle, action, runRng);

        // Process battle event telemetry
        for (const ev of battle.recentEvents) {
          if (ev.type === 'DAMAGE_DEALT') {
            if (battle.partyIds.includes(ev.actorId)) {
              const actorName = battle.combatants[ev.actorId]?.name ?? ev.actorId;
              encTelemetry.crewDamageDealt[actorName] = (encTelemetry.crewDamageDealt[actorName] || 0) + ev.damage;
            } else if (battle.partyIds.includes(ev.targetId)) {
              encTelemetry.partyDamageReceived.total += ev.damage;
              if (ev.isDisruptor) encTelemetry.partyDamageReceived.disruptor += ev.damage;
              else encTelemetry.partyDamageReceived.weapon += ev.damage;
            }
          } else if (ev.type === 'BURNOUT_CHIP_DAMAGE') {
            encTelemetry.partyDamageReceived.burnout += ev.damage;
            encTelemetry.partyDamageReceived.total += ev.damage;
          } else if (ev.type === 'BOOST_CRASHED') {
            totalForcedCrashes++;
            totalCrashTurns += ev.crashTurns;
            encTelemetry.forcedBoostCrashes++;
            encTelemetry.crashTurns += ev.crashTurns;
          }
        }
      }

      // Record telemetry for this fight
      const livingUnits = [...battle.partyIds, ...battle.enemyIds].filter((id) => (battle.combatants[id]?.stats.hp ?? 0) > 0).length;
      const rounds = battle.turnNumber > 0 && livingUnits > 0 ? battle.turnNumber / Math.max(1, livingUnits) : 1;

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

      // Complete encounter in run
      run = completeRunEncounter(run, battle);
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
  const avgMedkitsAtFinal = runsReachingFinalCount > 0 ? medkitsAtFinalSum / runsReachingFinalCount : 0;
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
    totalPartyMaxHp,
    avgMedkitsAtFinal,
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
    tierAttrition,
    encounterBreakdowns,
    sampleReplays: recordOptions?.recordSamples ? sampleReplays : undefined,
  };
}
