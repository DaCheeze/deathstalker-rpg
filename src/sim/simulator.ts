/**
 * Headless Battle Simulator.
 * Runs 1000+ battles headlessly with deterministic seeded PRNG to balance combat, gather statistics,
 * and record deterministic battle replays for the replay viewer.
 */

import {
  AbilityDefinition,
  BattleAction,
  BattleState,
  Combatant,
  EncounterDefinition,
  EncounterTier,
} from '../core/types';
import { initBattle, applyAction } from '../core/battle';
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

export interface EncounterTelemetry {
  encounterName: string;
  tier: EncounterTier;
  battles: number;
  wins: number;
  winRate: number;
  avgTurns: number;
  minTurns: number;
  maxTurns: number;
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
  crewDamageDealt: Record<string, number>;
  scatterShotStats: {
    casts: number;
    damage: number;
    totalTargetsHit: number;
    avgTargetsHit: number;
  };
  psiBlockerKills: {
    directKills: number;
    splashKills: number;
  };
  firstDeathByCrew: Record<string, number>;
  avgFirstDeathTurn: number;
  partyTotalActions: number;
  partyShieldActions: number;
  partyShieldActionPct: number;
  crashes: number;
  crashTurns: number;
  avgCrashTurns: number;
  abilityDiagnostics: Record<string, AbilityDiag>;
  esperDiagnostics: Record<string, AbilityDiag>;
}

export interface SimulationResult {
  seed: number;
  totalBattles: number;
  victories: number;
  defeats: number;
  timeouts: number;
  winRate: number;
  averageTurns: number;
  minTurns: number;
  maxTurns: number;
  averageActions: number;
  minActions: number;
  maxActions: number;
  averageRounds: number;
  minRounds: number;
  maxRounds: number;
  partyDisruptorFired: number;
  enemyDisruptorFired: number;
  totalDisruptorFired: number;
  partyDisruptorKills: number;
  enemyDisruptorKills: number;
  totalDisruptorKills: number;

  avgDisruptorDmgPct: number;
  partyAvgDisruptorDmgPct: number;
  disruptorHighHpKillPct: number;
  partyDisruptorHighHpKillPct: number;

  totalBoostsActivated: number;
  totalBurnoutStuns: number;
  totalCrashes: number;
  totalCrashTurns: number;
  avgCrashTurnsPerBattle: number;
  totalShieldsRaised: number;
  totalShieldsAbsorbed: number;

  partyTotalActions: number;
  partyShieldActions: number;
  partyShieldActionPct: number;

  encounterBreakdowns: Record<string, EncounterTelemetry>;
  sampleReplays?: Record<string, { shortest: BattleReplay; median: BattleReplay; longest: BattleReplay }>;
  allReplays?: BattleReplay[];
}

export function runSimulation(
  partyData: Combatant[],
  enemiesData: Record<string, Combatant>,
  abilitiesData: Record<string, AbilityDefinition>,
  encountersData: EncounterDefinition[],
  iterations: number = 1000,
  policy?: PartyAIPolicy,
  seed: number = 42,
  recordOptions?: { recordAll?: boolean; recordSamples?: boolean }
): SimulationResult {
  const rng = createRng(seed);

  let victories = 0;
  let defeats = 0;
  let timeouts = 0;

  let partyDisruptorFired = 0;
  let enemyDisruptorFired = 0;
  let partyDisruptorKills = 0;
  let enemyDisruptorKills = 0;
  let totalDisruptorDmg = 0;
  let totalDisruptorTargetMaxHp = 0;
  let partyDisruptorDmg = 0;
  let partyDisruptorTargetMaxHp = 0;
  let disruptorHighHpKills = 0;
  let partyDisruptorHighHpKills = 0;

  let totalBoostsActivated = 0;
  let totalBurnoutStuns = 0;
  let totalCrashes = 0;
  let totalCrashTurns = 0;
  let totalShieldsRaised = 0;
  let totalShieldsAbsorbed = 0;

  let globalPartyTotalActions = 0;
  let globalPartyShieldActions = 0;

  let totalBattleActions = 0;
  let minBattleActions = Infinity;
  let maxBattleActions = 0;

  let totalBattleRounds = 0;
  let minBattleRounds = Infinity;
  let maxBattleRounds = 0;

  const encounterStats: Record<string, {
    name: string;
    tier: EncounterTier;
    battles: number;
    wins: number;
    totalActions: number;
    minActions: number;
    maxActions: number;
    totalRounds: number;
    minRounds: number;
    maxRounds: number;
    weaponDmg: number;
    disruptorDmg: number;
    esperDmg: number;
    burnoutDmg: number;
    crewDamage: Record<string, number>;
    scatterCasts: number;
    scatterDmg: number;
    scatterHits: number;
    psiDirectKills: number;
    psiSplashKills: number;
    firstDeaths: Record<string, number>;
    firstDeathTurnSum: number;
    firstDeathCount: number;
    partyTotalActions: number;
    partyShieldActions: number;
    crashes: number;
    crashTurns: number;
    abilityUsage: Record<string, AbilityDiag>;
    esperUsage: Record<string, AbilityDiag>;
    recordedBattles: { replay: BattleReplay; actionCount: number }[];
  }> = {};

  for (const enc of encountersData) {
    encounterStats[enc.id] = {
      name: enc.name,
      tier: enc.tier,
      battles: 0,
      wins: 0,
      totalActions: 0,
      minActions: Infinity,
      maxActions: 0,
      totalRounds: 0,
      minRounds: Infinity,
      maxRounds: 0,
      weaponDmg: 0,
      disruptorDmg: 0,
      esperDmg: 0,
      burnoutDmg: 0,
      crewDamage: {},
      scatterCasts: 0,
      scatterDmg: 0,
      scatterHits: 0,
      psiDirectKills: 0,
      psiSplashKills: 0,
      firstDeaths: {},
      firstDeathTurnSum: 0,
      firstDeathCount: 0,
      partyTotalActions: 0,
      partyShieldActions: 0,
      crashes: 0,
      crashTurns: 0,
      abilityUsage: {},
      esperUsage: {},
      recordedBattles: [],
    };
  }

  const allRecordedReplays: BattleReplay[] = [];

  for (let i = 0; i < iterations; i++) {
    const encounter = encountersData[i % encountersData.length] as EncounterDefinition;
    const encStat = encounterStats[encounter.id];
    if (encStat) {
      encStat.battles++;
    }

    // Instantiate fresh party
    const party = partyData.map((p) => ({
      ...p,
      stats: { ...p.stats },
      abilityIds: [...p.abilityIds],
    }));

    // Instantiate fresh enemies
    const enemies = encounter.enemyIds.map((enemyId, idx) => {
      const template = enemiesData[enemyId];
      if (!template) {
        throw new Error(`Unknown enemy ID: ${enemyId}`);
      }
      return {
        ...template,
        id: `${enemyId}_${idx}`,
        stats: { ...template.stats },
        abilityIds: [...template.abilityIds],
      };
    });

    const recordedInitialParty = JSON.parse(JSON.stringify(party));
    const recordedInitialEnemies = JSON.parse(JSON.stringify(enemies));
    const recordedActions: BattleAction[] = [];

    let state: BattleState = initBattle(party, enemies, abilitiesData, encounter);
    let actions = 0;
    let completedRounds = 0;
    const actedInCurrentRound = new Set<string>();
    const MAX_SAFETY_ACTIONS = 350;
    let firstDeathRecordedInBattle = false;

    while (state.status === 'in_progress' && actions < MAX_SAFETY_ACTIONS) {
      actions++;
      const actorId = state.activeActorId;
      const actor = state.combatants[actorId];

      if (!actor || actor.stats.hp <= 0) {
        break;
      }

      actedInCurrentRound.add(actorId);
      const livingIds = [...state.partyIds, ...state.enemyIds].filter(
        (id) => (state.combatants[id]?.stats.hp ?? 0) > 0
      );
      if (livingIds.length > 0 && livingIds.every((id) => actedInCurrentRound.has(id))) {
        completedRounds++;
        actedInCurrentRound.clear();
      }

      const isParty = state.partyIds.includes(actorId);
      const action = isParty
        ? choosePartyActionForSim(state, actorId, policy, rng)
        : chooseEnemyAction(state, actorId, rng);

      if (recordOptions?.recordAll || recordOptions?.recordSamples) {
        recordedActions.push(JSON.parse(JSON.stringify(action)));
      }

      if (isParty) {
        globalPartyTotalActions++;
        if (encStat) encStat.partyTotalActions++;
        if (action.type === 'RaiseShield') {
          globalPartyShieldActions++;
          if (encStat) encStat.partyShieldActions++;
        }
        if (action.type === 'Attack' && action.abilityId === 'scatter_shot' && encStat) {
          encStat.scatterCasts++;
        }
        if ((action.type === 'Attack' || action.type === 'EsperAbility') && encStat) {
          const abKey = action.abilityId;
          encStat.abilityUsage[abKey] = encStat.abilityUsage[abKey] || { casts: 0, damage: 0, displacementTicks: 0, displacementTurns: 0 };
          encStat.abilityUsage[abKey].casts++;

          if (action.type === 'EsperAbility') {
            encStat.esperUsage[abKey] = encStat.esperUsage[abKey] || { casts: 0, damage: 0, displacementTicks: 0, displacementTurns: 0 };
            encStat.esperUsage[abKey].casts++;
          }
        }
      }

      let targetHpBefore = 0;
      let targetMaxHp = 1;
      if (action.type === 'Disruptor') {
        const target = state.combatants[action.targetId];
        targetHpBefore = target?.stats.hp ?? 0;
        targetMaxHp = target?.stats.maxHp ?? 1;

        if (isParty) {
          partyDisruptorFired++;
        } else {
          enemyDisruptorFired++;
        }
      } else if (action.type === 'ToggleBoost' && action.enable) {
        totalBoostsActivated++;
      } else if (action.type === 'RaiseShield') {
        totalShieldsRaised++;
      }

      state = applyAction(state, action, rng);

      // Event inspections
      for (const ev of state.recentEvents) {
        if (ev.type === 'DAMAGE_DEALT') {
          const isTargetParty = state.partyIds.includes(ev.targetId);
          const isActorParty = state.partyIds.includes(ev.actorId);

          if (isActorParty && encStat) {
            const actorName = state.combatants[ev.actorId]?.name ?? ev.actorId;
            encStat.crewDamage[actorName] = (encStat.crewDamage[actorName] || 0) + ev.damage;

            if (action.type === 'Attack' || action.type === 'EsperAbility') {
              const abKey = action.abilityId;
              encStat.abilityUsage[abKey] = encStat.abilityUsage[abKey] || { casts: 0, damage: 0, displacementTicks: 0, displacementTurns: 0 };
              encStat.abilityUsage[abKey].damage += ev.damage;

              if (action.type === 'EsperAbility') {
                encStat.esperUsage[abKey] = encStat.esperUsage[abKey] || { casts: 0, damage: 0, displacementTicks: 0, displacementTurns: 0 };
                encStat.esperUsage[abKey].damage += ev.damage;
              }
            }

            if (action.type === 'Attack' && action.abilityId === 'scatter_shot') {
              encStat.scatterHits++;
              encStat.scatterDmg += ev.damage;
              if (ev.targetId.includes('psi_blocker') && ev.targetKilled) {
                encStat.psiSplashKills++;
              }
            } else if (ev.targetId.includes('psi_blocker') && ev.targetKilled) {
              encStat.psiDirectKills++;
            }
          }

          if (ev.isDisruptor) {
            totalDisruptorDmg += ev.damage;
            totalDisruptorTargetMaxHp += targetMaxHp;
            const wasHighHp = targetHpBefore > 0.80 * targetMaxHp;

            if (isParty) {
              partyDisruptorDmg += ev.damage;
              partyDisruptorTargetMaxHp += targetMaxHp;
              if (ev.targetKilled && wasHighHp) {
                partyDisruptorHighHpKills++;
              }
            }

            if (ev.targetKilled && wasHighHp) {
              disruptorHighHpKills++;
            }
          }

          if (isTargetParty && encStat) {
            if (ev.isDisruptor) {
              encStat.disruptorDmg += ev.damage;
            } else {
              const ability = state.abilities[ev.abilityName] || Object.values(state.abilities).find(a => a.name === ev.abilityName);
              if (ability?.category === 'esper') {
                encStat.esperDmg += ev.damage;
              } else {
                encStat.weaponDmg += ev.damage;
              }
            }
          }

          if (ev.isDisruptor && ev.targetKilled) {
            if (state.partyIds.includes(ev.actorId)) {
              partyDisruptorKills++;
            } else {
              enemyDisruptorKills++;
            }
          }
          if (ev.shieldAbsorbed) {
            totalShieldsAbsorbed++;
          }

          if (isTargetParty && ev.targetKilled && !firstDeathRecordedInBattle && encStat) {
            firstDeathRecordedInBattle = true;
            const targetName = state.combatants[ev.targetId]?.name ?? ev.targetId;
            encStat.firstDeaths[targetName] = (encStat.firstDeaths[targetName] ?? 0) + 1;
            encStat.firstDeathTurnSum += actions;
            encStat.firstDeathCount++;
          }
        } else if (ev.type === 'TURN_DISPLACED') {
          if (isParty && encStat && (action.type === 'Attack' || action.type === 'EsperAbility')) {
            const abKey = action.abilityId;
            encStat.abilityUsage[abKey] = encStat.abilityUsage[abKey] || { casts: 0, damage: 0, displacementTicks: 0, displacementTurns: 0 };
            encStat.abilityUsage[abKey].displacementTicks += ev.ticks;
            encStat.abilityUsage[abKey].displacementTurns += ev.ticks / 15;

            if (action.type === 'EsperAbility') {
              encStat.esperUsage[abKey] = encStat.esperUsage[abKey] || { casts: 0, damage: 0, displacementTicks: 0, displacementTurns: 0 };
              encStat.esperUsage[abKey].displacementTicks += ev.ticks;
              encStat.esperUsage[abKey].displacementTurns += ev.ticks / 15;
            }
          }
        } else if (ev.type === 'BURNOUT_CHIP_DAMAGE') {
          if (state.partyIds.includes(ev.actorId) && encStat) {
            encStat.burnoutDmg += ev.damage;
            if (ev.killed && !firstDeathRecordedInBattle) {
              firstDeathRecordedInBattle = true;
              const name = state.combatants[ev.actorId]?.name ?? ev.actorId;
              encStat.firstDeaths[name] = (encStat.firstDeaths[name] ?? 0) + 1;
              encStat.firstDeathTurnSum += actions;
              encStat.firstDeathCount++;
            }
          }
        } else if (ev.type === 'BOOST_CRASHED') {
          totalCrashes++;
          totalCrashTurns += ev.crashTurns;
          if (encStat) {
            encStat.crashes++;
            encStat.crashTurns += ev.crashTurns;
          }
        } else if (ev.type === 'BURNOUT_STUNNED') {
          totalBurnoutStuns++;
        }
      }
    }

    const livingCountAtEnd = [...state.partyIds, ...state.enemyIds].filter(
      (id) => (state.combatants[id]?.stats.hp ?? 0) > 0
    ).length;
    const partialRound = livingCountAtEnd > 0 ? (actedInCurrentRound.size / livingCountAtEnd) : 0;
    const battleRounds = completedRounds + partialRound;

    const winner = state.status === 'victory' ? 'party' : state.status === 'defeat' ? 'enemies' : 'timeout';

    if (state.status === 'victory') {
      victories++;
      if (encStat) encStat.wins++;
    } else if (state.status === 'defeat') {
      defeats++;
    } else {
      timeouts++;
    }

    totalBattleActions += actions;
    if (encStat) {
      encStat.totalActions += actions;
      if (actions < encStat.minActions) encStat.minActions = actions;
      if (actions > encStat.maxActions) encStat.maxActions = actions;

      encStat.totalRounds += battleRounds;
      if (battleRounds < encStat.minRounds) encStat.minRounds = battleRounds;
      if (battleRounds > encStat.maxRounds) encStat.maxRounds = battleRounds;

      if (recordOptions?.recordAll || recordOptions?.recordSamples) {
        const battleReplay: BattleReplay = {
          seed,
          encounterId: encounter.id,
          encounterName: encounter.name,
          encounterTier: encounter.tier,
          initialParty: recordedInitialParty,
          initialEnemies: recordedInitialEnemies,
          actions: recordedActions,
          summary: {
            winner,
            totalActions: actions,
            totalRounds: Math.round(battleRounds * 10) / 10,
          },
        };
        encStat.recordedBattles.push({ replay: battleReplay, actionCount: actions });
        allRecordedReplays.push(battleReplay);
      }
    }
    if (actions < minBattleActions) minBattleActions = actions;
    if (actions > maxBattleActions) maxBattleActions = actions;

    totalBattleRounds += battleRounds;
    if (battleRounds < minBattleRounds) minBattleRounds = battleRounds;
    if (battleRounds > maxBattleRounds) maxBattleRounds = battleRounds;
  }

  const encounterBreakdowns: SimulationResult['encounterBreakdowns'] = {};
  const sampleReplays: Record<string, { shortest: BattleReplay; median: BattleReplay; longest: BattleReplay }> = {};

  for (const [id, stat] of Object.entries(encounterStats)) {
    const totalPartyDmg = stat.weaponDmg + stat.disruptorDmg + stat.esperDmg + stat.burnoutDmg;
    const avgActs = stat.battles > 0 ? stat.totalActions / stat.battles : 0;
    const avgRnds = stat.battles > 0 ? stat.totalRounds / stat.battles : 0;

    encounterBreakdowns[id] = {
      encounterName: stat.name,
      tier: stat.tier,
      battles: stat.battles,
      wins: stat.wins,
      winRate: stat.battles > 0 ? (stat.wins / stat.battles) * 100 : 0,
      avgTurns: avgActs,
      minTurns: stat.minActions === Infinity ? 0 : stat.minActions,
      maxTurns: stat.maxActions,
      avgActions: avgActs,
      minActions: stat.minActions === Infinity ? 0 : stat.minActions,
      maxActions: stat.maxActions,
      avgRounds: avgRnds,
      minRounds: stat.minRounds === Infinity ? 0 : Math.round(stat.minRounds * 10) / 10,
      maxRounds: Math.round(stat.maxRounds * 10) / 10,
      partyDamageReceived: {
        weapon: stat.weaponDmg,
        disruptor: stat.disruptorDmg,
        esper: stat.esperDmg,
        burnout: stat.burnoutDmg,
        total: totalPartyDmg,
      },
      crewDamageDealt: stat.crewDamage,
      scatterShotStats: {
        casts: stat.scatterCasts,
        damage: stat.scatterDmg,
        totalTargetsHit: stat.scatterHits,
        avgTargetsHit: stat.scatterCasts > 0 ? Math.round((stat.scatterHits / stat.scatterCasts) * 10) / 10 : 0,
      },
      psiBlockerKills: {
        directKills: stat.psiDirectKills,
        splashKills: stat.psiSplashKills,
      },
      firstDeathByCrew: stat.firstDeaths,
      avgFirstDeathTurn: stat.firstDeathCount > 0 ? stat.firstDeathTurnSum / stat.firstDeathCount : 0,
      partyTotalActions: stat.partyTotalActions,
      partyShieldActions: stat.partyShieldActions,
      partyShieldActionPct: stat.partyTotalActions > 0 ? (stat.partyShieldActions / stat.partyTotalActions) * 100 : 0,
      crashes: stat.crashes,
      crashTurns: stat.crashTurns,
      avgCrashTurns: stat.battles > 0 ? stat.crashTurns / stat.battles : 0,
      abilityDiagnostics: stat.abilityUsage,
      esperDiagnostics: stat.esperUsage,
    };

    if (recordOptions?.recordSamples && stat.recordedBattles.length > 0) {
      // Sort battles by action count
      const sorted = [...stat.recordedBattles].sort((a, b) => a.actionCount - b.actionCount);
      const shortest = sorted[0]?.replay as BattleReplay;
      const median = sorted[Math.floor(sorted.length / 2)]?.replay as BattleReplay;
      const longest = sorted[sorted.length - 1]?.replay as BattleReplay;
      if (shortest && median && longest) {
        sampleReplays[id] = { shortest, median, longest };
      }
    }
  }

  const totalDisruptorFired = partyDisruptorFired + enemyDisruptorFired;
  const totalDisruptorKills = partyDisruptorKills + enemyDisruptorKills;

  const avgDisruptorDmgPct = totalDisruptorTargetMaxHp > 0
    ? (totalDisruptorDmg / totalDisruptorTargetMaxHp) * 100
    : 0;

  const partyAvgDisruptorDmgPct = partyDisruptorTargetMaxHp > 0
    ? (partyDisruptorDmg / partyDisruptorTargetMaxHp) * 100
    : 0;

  const disruptorHighHpKillPct = totalDisruptorFired > 0
    ? (disruptorHighHpKills / totalDisruptorFired) * 100
    : 0;

  const partyDisruptorHighHpKillPct = partyDisruptorFired > 0
    ? (partyDisruptorHighHpKills / partyDisruptorFired) * 100
    : 0;

  const partyShieldActionPct = globalPartyTotalActions > 0
    ? (globalPartyShieldActions / globalPartyTotalActions) * 100
    : 0;

  return {
    seed,
    totalBattles: iterations,
    victories,
    defeats,
    timeouts,
    winRate: (victories / iterations) * 100,
    averageTurns: totalBattleActions / iterations,
    minTurns: minBattleActions === Infinity ? 0 : minBattleActions,
    maxTurns: maxBattleActions,
    averageActions: totalBattleActions / iterations,
    minActions: minBattleActions === Infinity ? 0 : minBattleActions,
    maxActions: maxBattleActions,
    averageRounds: totalBattleRounds / iterations,
    minRounds: minBattleRounds === Infinity ? 0 : Math.round(minBattleRounds * 10) / 10,
    maxRounds: Math.round(maxBattleRounds * 10) / 10,
    partyDisruptorFired,
    enemyDisruptorFired,
    totalDisruptorFired,
    partyDisruptorKills,
    enemyDisruptorKills,
    totalDisruptorKills,
    avgDisruptorDmgPct,
    partyAvgDisruptorDmgPct,
    disruptorHighHpKillPct,
    partyDisruptorHighHpKillPct,
    totalBoostsActivated,
    totalBurnoutStuns,
    totalCrashes,
    totalCrashTurns,
    avgCrashTurnsPerBattle: iterations > 0 ? totalCrashTurns / iterations : 0,
    totalShieldsRaised,
    totalShieldsAbsorbed,
    partyTotalActions: globalPartyTotalActions,
    partyShieldActions: globalPartyShieldActions,
    partyShieldActionPct,
    encounterBreakdowns,
    sampleReplays: recordOptions?.recordSamples ? sampleReplays : undefined,
    allReplays: recordOptions?.recordAll ? allRecordedReplays : undefined,
  };
}
