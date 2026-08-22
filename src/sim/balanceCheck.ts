/**
 * Automated balance assertion runner for Deathstalker RPG.
 * Executes level sweeps across seeds 12345 & 98765 and policy modes,
 * asserting the JRPG difficulty curve and attrition invariants against `balance-targets.json`.
 *
 * Exits with code 0 if ALL assertions pass, or code 1 if ANY active metric is out of band.
 */

import fs from 'node:fs';
import path from 'node:path';
import { runSimulation, runLevelSweep, LevelSweepResult, RunSimulationResult } from './simulator';
import { loadGameData } from '../core/configLoader';

export interface TargetBand {
  min?: number;
  max?: number;
  unit?: string;
  description?: string;
}

export interface BalanceTargets {
  difficultyCurve?: {
    levelPlus1?: TargetBand;
    atRecommended?: TargetBand;
    levelMinus1?: TargetBand;
    levelMinus2?: TargetBand;
  };
  supplySensitivity?: {
    fullVsHalfDelta?: TargetBand;
  };
  runCompletionRate?: TargetBand; // Backwards compatibility
  skirmishHpCost: TargetBand;
  standardHpCost: TargetBand;
  eliteHpCost: TargetBand;
  skirmishRounds: TargetBand;
  standardRounds: TargetBand;
  eliteRounds: TargetBand;
  failureShareOpeningSkirmishes?: TargetBand;
  failureShareStandardEncounters?: TargetBand;
  failureShareFinalElite?: TargetBand;
  partyHpEnteringFinal: TargetBand;
  medkitsEnteringFinal: TargetBand;
  baselineMinusNoBoost: TargetBand;
  baselineMinusNoDisruptor: TargetBand;
  baselineMinusNoEsper: TargetBand;
  seedVariance: TargetBand;
}

export interface AssertionRow {
  metric: string;
  measured: string;
  targetBand: string;
  passed: boolean;
  isInsufficientData?: boolean;
  note?: string;
}

export function evaluateAssertions(
  targets: BalanceTargets,
  seedA: {
    sweep: LevelSweepResult;
    baseline: RunSimulationResult;
    noBoost: RunSimulationResult;
    noDisruptor: RunSimulationResult;
    noEsper: RunSimulationResult;
  },
  seedB: {
    sweep: LevelSweepResult;
    baseline: RunSimulationResult;
    noBoost: RunSimulationResult;
    noDisruptor: RunSimulationResult;
    noEsper: RunSimulationResult;
  }
): { rows: AssertionRow[]; allPassed: boolean } {
  const rows: AssertionRow[] = [];

  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
  const fmtBand = (b: TargetBand, isPct = true) => {
    if (b.min !== undefined && b.max !== undefined) {
      return isPct ? `${pct(b.min)} – ${pct(b.max)}` : `${b.min.toFixed(1)} – ${b.max.toFixed(1)}`;
    }
    if (b.min !== undefined) return isPct ? `> ${pct(b.min)}` : `> ${b.min.toFixed(1)}`;
    if (b.max !== undefined) return isPct ? `< ${pct(b.max)}` : `< ${b.max.toFixed(1)}`;
    return 'N/A';
  };

  const check = (val: number, b?: TargetBand) => {
    if (!b) return true;
    if (b.min !== undefined && val < b.min - 0.0001) return false;
    if (b.max !== undefined && val > b.max + 0.0001) return false;
    return true;
  };

  const norm = (v: number) => (v > 1.0 ? v / 100 : v);

  // 1. Difficulty Curve Assertions (4 points: rec - 2, rec - 1, rec, rec + 1)
  const recLvl = seedA.sweep.recommendedLevel;
  const getLevelRate = (sweep: LevelSweepResult, offset: number) => {
    const entry = sweep.levels.find((l) => l.offset === offset);
    return entry ? norm(entry.result.runCompletionRate) : norm(sweep.supplySweep.full.runCompletionRate);
  };

  // Curve: Level +1
  if (targets.difficultyCurve?.levelPlus1) {
    const ratePlus1A = getLevelRate(seedA.sweep, 1);
    const ratePlus1B = getLevelRate(seedB.sweep, 1);
    const passPlus1 = check(ratePlus1A, targets.difficultyCurve.levelPlus1) && check(ratePlus1B, targets.difficultyCurve.levelPlus1);
    rows.push({
      metric: `Difficulty Curve: Level +1 (Lvl ${recLvl + 1})`,
      measured: `${pct(ratePlus1A)} (S1), ${pct(ratePlus1B)} (S2)`,
      targetBand: fmtBand(targets.difficultyCurve.levelPlus1),
      passed: passPlus1,
    });
  }

  // Curve: At Recommended Level
  if (targets.difficultyCurve?.atRecommended) {
    const rateRecA = getLevelRate(seedA.sweep, 0);
    const rateRecB = getLevelRate(seedB.sweep, 0);
    const passRec = check(rateRecA, targets.difficultyCurve.atRecommended) && check(rateRecB, targets.difficultyCurve.atRecommended);
    rows.push({
      metric: `Difficulty Curve: At Recommended (Lvl ${recLvl})`,
      measured: `${pct(rateRecA)} (S1), ${pct(rateRecB)} (S2)`,
      targetBand: fmtBand(targets.difficultyCurve.atRecommended),
      passed: passRec,
    });
  } else if (targets.runCompletionRate) {
    const rateRecA = norm(seedA.baseline.runCompletionRate);
    const rateRecB = norm(seedB.baseline.runCompletionRate);
    const passRate = check(rateRecA, targets.runCompletionRate) && check(rateRecB, targets.runCompletionRate);
    rows.push({
      metric: `Run Completion Rate (At Rec Lvl ${recLvl})`,
      measured: `${pct(rateRecA)} (S1), ${pct(rateRecB)} (S2)`,
      targetBand: fmtBand(targets.runCompletionRate),
      passed: passRate,
    });
  }

  // Curve: Level -1
  if (targets.difficultyCurve?.levelMinus1) {
    const rateMinus1A = getLevelRate(seedA.sweep, -1);
    const rateMinus1B = getLevelRate(seedB.sweep, -1);
    const passMinus1 = check(rateMinus1A, targets.difficultyCurve.levelMinus1) && check(rateMinus1B, targets.difficultyCurve.levelMinus1);
    rows.push({
      metric: `Difficulty Curve: Level -1 (Lvl ${Math.max(1, recLvl - 1)})`,
      measured: `${pct(rateMinus1A)} (S1), ${pct(rateMinus1B)} (S2)`,
      targetBand: fmtBand(targets.difficultyCurve.levelMinus1),
      passed: passMinus1,
    });
  }

  // Curve: Level -2
  if (targets.difficultyCurve?.levelMinus2) {
    const rateMinus2A = getLevelRate(seedA.sweep, -2);
    const rateMinus2B = getLevelRate(seedB.sweep, -2);
    const passMinus2 = check(rateMinus2A, targets.difficultyCurve.levelMinus2) && check(rateMinus2B, targets.difficultyCurve.levelMinus2);
    rows.push({
      metric: `Difficulty Curve: Level -2 (Lvl ${Math.max(1, recLvl - 2)})`,
      measured: `${pct(rateMinus2A)} (S1), ${pct(rateMinus2B)} (S2)`,
      targetBand: fmtBand(targets.difficultyCurve.levelMinus2),
      passed: passMinus2,
    });
  }

  // 2. Supply Sensitivity Delta (Full Supply vs Half Supply)
  if (targets.supplySensitivity?.fullVsHalfDelta) {
    const deltaA = norm(seedA.sweep.supplySweep.delta);
    const deltaB = norm(seedB.sweep.supplySweep.delta);
    const passSupply = check(deltaA, targets.supplySensitivity.fullVsHalfDelta) && check(deltaB, targets.supplySensitivity.fullVsHalfDelta);
    rows.push({
      metric: 'Supply Sensitivity (Full vs Half Supply Delta)',
      measured: `+${pct(deltaA)} (S1), +${pct(deltaB)} (S2)`,
      targetBand: fmtBand(targets.supplySensitivity.fullVsHalfDelta),
      passed: passSupply,
    });
  }

  // 3. Seed Variance at Recommended Level
  const recRateA = getLevelRate(seedA.sweep, 0);
  const recRateB = getLevelRate(seedB.sweep, 0);
  const variance = Math.abs(recRateA - recRateB);
  const passVariance = targets.seedVariance.max !== undefined ? variance <= targets.seedVariance.max : true;
  rows.push({
    metric: 'Seed-to-Seed Variance (At Rec Level)',
    measured: pct(variance),
    targetBand: `< ${pct(targets.seedVariance.max ?? 0.05)}`,
    passed: passVariance,
  });

  // 4. Skirmish HP Cost
  const skHpA = norm(seedA.baseline.tierAttrition.skirmish.actualPct);
  const skHpB = norm(seedB.baseline.tierAttrition.skirmish.actualPct);
  const skHpAvg = (skHpA + skHpB) / 2;
  const passSk = check(skHpAvg, targets.skirmishHpCost);
  rows.push({
    metric: 'Skirmish HP Cost (F1 & F2 @ Rec Level)',
    measured: `${pct(skHpA)} (S1), ${pct(skHpB)} (S2)`,
    targetBand: fmtBand(targets.skirmishHpCost),
    passed: passSk,
  });

  // 5. Standard HP Cost
  const stdHpA = norm(seedA.baseline.tierAttrition.standard.actualPct);
  const stdHpB = norm(seedB.baseline.tierAttrition.standard.actualPct);
  const stdHpAvg = (stdHpA + stdHpB) / 2;
  const passStd = check(stdHpAvg, targets.standardHpCost);
  rows.push({
    metric: 'Standard HP Cost (F3 & F4 @ Rec Level)',
    measured: `${pct(stdHpA)} (S1), ${pct(stdHpB)} (S2)`,
    targetBand: fmtBand(targets.standardHpCost),
    passed: passStd,
  });

  // 6. Elite HP Cost
  const eliteHpA = norm(seedA.baseline.tierAttrition.elite.actualPct);
  const eliteHpB = norm(seedB.baseline.tierAttrition.elite.actualPct);
  const eliteHpAvg = (eliteHpA + eliteHpB) / 2;
  const passElite = check(eliteHpAvg, targets.eliteHpCost);
  rows.push({
    metric: 'Elite HP Cost (F5 @ Rec Level)',
    measured: `${pct(eliteHpA)} (S1), ${pct(eliteHpB)} (S2)`,
    targetBand: fmtBand(targets.eliteHpCost),
    passed: passElite,
  });

  // 7. Skirmish Rounds
  const f1Rounds = (seedA.baseline.encounterBreakdowns['enc_empire_skirmish']?.avgRounds ?? 0);
  const f2Rounds = (seedA.baseline.encounterBreakdowns['enc_shub_skirmish']?.avgRounds ?? 0);
  const passSkRounds = check(f1Rounds, targets.skirmishRounds) && check(f2Rounds, targets.skirmishRounds);
  rows.push({
    metric: 'Skirmish Rounds (F1 & F2)',
    measured: `F1: ${f1Rounds.toFixed(1)}r, F2: ${f2Rounds.toFixed(1)}r`,
    targetBand: fmtBand(targets.skirmishRounds, false),
    passed: passSkRounds,
  });

  // 8. Standard Rounds
  const f3Rounds = (seedA.baseline.encounterBreakdowns['enc_empire_patrol']?.avgRounds ?? 0);
  const f4Rounds = (seedA.baseline.encounterBreakdowns['enc_shub_swarm']?.avgRounds ?? 0);
  const passStdRounds = check(f3Rounds, targets.standardRounds) && check(f4Rounds, targets.standardRounds);
  rows.push({
    metric: 'Standard Rounds (F3 & F4)',
    measured: `F3: ${f3Rounds.toFixed(1)}r, F4: ${f4Rounds.toFixed(1)}r`,
    targetBand: fmtBand(targets.standardRounds, false),
    passed: passStdRounds,
  });

  // 9. Elite Rounds
  const f5Rounds = (seedA.baseline.encounterBreakdowns['enc_hadenman_vanguard']?.avgRounds ?? 0);
  const passEliteRounds = check(f5Rounds, targets.eliteRounds);
  rows.push({
    metric: 'Elite Rounds (F5)',
    measured: `F5: ${f5Rounds.toFixed(1)}r`,
    targetBand: fmtBand(targets.eliteRounds, false),
    passed: passEliteRounds,
  });

  // 10. Failure Distribution Assertions with MINIMUM SAMPLE GUARD (< 20 failures)
  const failsA = seedA.baseline.failedRuns;
  const failsB = seedB.baseline.failedRuns;
  const totalFailures = failsA + failsB;
  const hasSufficientFailures = totalFailures >= 20;

  if (targets.failureShareOpeningSkirmishes) {
    if (!hasSufficientFailures) {
      rows.push({
        metric: 'Failure Share: Skirmish (F1 & F2)',
        measured: `Insufficient Data (${failsA} S1 / ${failsB} S2 failures)`,
        targetBand: fmtBand(targets.failureShareOpeningSkirmishes),
        passed: true,
        isInsufficientData: true,
      });
    } else {
      const distA = seedA.baseline.fightsSurvivedDistribution;
      const distB = seedB.baseline.fightsSurvivedDistribution;
      const opShareA = (distA.diedAtFight1 + distA.diedAtFight2) / Math.max(1, failsA);
      const opShareB = (distB.diedAtFight1 + distB.diedAtFight2) / Math.max(1, failsB);
      const opShareAvg = (opShareA + opShareB) / 2;
      const passOpShare = check(opShareAvg, targets.failureShareOpeningSkirmishes);
      rows.push({
        metric: 'Failure Share: Skirmish (F1 & F2)',
        measured: `${pct(opShareA)} (S1), ${pct(opShareB)} (S2)`,
        targetBand: fmtBand(targets.failureShareOpeningSkirmishes),
        passed: passOpShare,
      });
    }
  }

  if (targets.failureShareStandardEncounters) {
    if (!hasSufficientFailures) {
      rows.push({
        metric: 'Failure Share: Standard Combined (F3+F4)',
        measured: `Insufficient Data (${failsA} S1 / ${failsB} S2 failures)`,
        targetBand: fmtBand(targets.failureShareStandardEncounters),
        passed: true,
        isInsufficientData: true,
      });
    } else {
      const distA = seedA.baseline.fightsSurvivedDistribution;
      const distB = seedB.baseline.fightsSurvivedDistribution;
      const stdShareA = (distA.diedAtFight3 + distA.diedAtFight4) / Math.max(1, failsA);
      const stdShareB = (distB.diedAtFight3 + distB.diedAtFight4) / Math.max(1, failsB);
      const stdShareAvg = (stdShareA + stdShareB) / 2;
      const passStdShare = check(stdShareAvg, targets.failureShareStandardEncounters);
      rows.push({
        metric: 'Failure Share: Standard Combined (F3+F4)',
        measured: `${pct(stdShareA)} (S1), ${pct(stdShareB)} (S2)`,
        targetBand: fmtBand(targets.failureShareStandardEncounters),
        passed: passStdShare,
      });
    }
  }

  if (targets.failureShareFinalElite) {
    if (!hasSufficientFailures) {
      rows.push({
        metric: 'Failure Share: Elite / Final (F5)',
        measured: `Insufficient Data (${failsA} S1 / ${failsB} S2 failures)`,
        targetBand: fmtBand(targets.failureShareFinalElite),
        passed: true,
        isInsufficientData: true,
      });
    } else {
      const distA = seedA.baseline.fightsSurvivedDistribution;
      const distB = seedB.baseline.fightsSurvivedDistribution;
      const f5ShareA = distA.diedAtFight5 / Math.max(1, failsA);
      const f5ShareB = distB.diedAtFight5 / Math.max(1, failsB);
      const f5ShareAvg = (f5ShareA + f5ShareB) / 2;
      const passF5Share = check(f5ShareAvg, targets.failureShareFinalElite);
      rows.push({
        metric: 'Failure Share: Elite / Final (F5)',
        measured: `${pct(f5ShareA)} (S1), ${pct(f5ShareB)} (S2)`,
        targetBand: fmtBand(targets.failureShareFinalElite),
        passed: passF5Share,
      });
    }
  }

  // 11. Policy Deltas with Uninformative Guard (< 5 points at high win rate)
  const deltaBoostA = recRateA - norm(seedA.noBoost.runCompletionRate);
  const deltaBoostB = recRateB - norm(seedB.noBoost.runCompletionRate);
  const passBoost = deltaBoostA > (targets.baselineMinusNoBoost.min ?? 0) && deltaBoostB > (targets.baselineMinusNoBoost.min ?? 0);
  const boostUninformative = (recRateA >= 0.90 || recRateB >= 0.90) && Math.abs(deltaBoostA) < 0.05 && Math.abs(deltaBoostB) < 0.05;
  rows.push({
    metric: 'Baseline minus --no-boost',
    measured: `+${pct(deltaBoostA)} (S1), +${pct(deltaBoostB)} (S2)`,
    targetBand: '> 0%',
    passed: passBoost,
    note: boostUninformative ? 'Uninformative at ceiling' : undefined,
  });

  const deltaDisruptorA = recRateA - norm(seedA.noDisruptor.runCompletionRate);
  const deltaDisruptorB = recRateB - norm(seedB.noDisruptor.runCompletionRate);
  const passDisruptor = deltaDisruptorA > (targets.baselineMinusNoDisruptor.min ?? 0) && deltaDisruptorB > (targets.baselineMinusNoDisruptor.min ?? 0);
  const disruptorUninformative = (recRateA >= 0.90 || recRateB >= 0.90) && Math.abs(deltaDisruptorA) < 0.05 && Math.abs(deltaDisruptorB) < 0.05;
  rows.push({
    metric: 'Baseline minus --no-disruptor',
    measured: `+${pct(deltaDisruptorA)} (S1), +${pct(deltaDisruptorB)} (S2)`,
    targetBand: '> 0%',
    passed: passDisruptor,
    note: disruptorUninformative ? 'Uninformative at ceiling' : undefined,
  });

  const deltaEsperA = recRateA - norm(seedA.noEsper.runCompletionRate);
  const deltaEsperB = recRateB - norm(seedB.noEsper.runCompletionRate);
  const passEsper = deltaEsperA > (targets.baselineMinusNoEsper.min ?? 0) && deltaEsperB > (targets.baselineMinusNoEsper.min ?? 0);
  const esperUninformative = (recRateA >= 0.90 || recRateB >= 0.90) && Math.abs(deltaEsperA) < 0.05 && Math.abs(deltaEsperB) < 0.05;
  rows.push({
    metric: 'Baseline minus --no-esper',
    measured: `+${pct(deltaEsperA)} (S1), +${pct(deltaEsperB)} (S2)`,
    targetBand: '> 0%',
    passed: passEsper,
    note: esperUninformative ? 'Uninformative at ceiling' : undefined,
  });

  // 12. Party HP Entering Final Encounter
  const bossHpA = norm(seedA.baseline.partyHpEnteringFinalPct);
  const bossHpB = norm(seedB.baseline.partyHpEnteringFinalPct);
  const passBossHp = check(bossHpA, targets.partyHpEnteringFinal) && check(bossHpB, targets.partyHpEnteringFinal);
  rows.push({
    metric: 'Party HP Entering Final Encounter',
    measured: `${pct(bossHpA)} (S1), ${pct(bossHpB)} (S2)`,
    targetBand: fmtBand(targets.partyHpEnteringFinal),
    passed: passBossHp,
  });

  // 13. Medkits Remaining at Final Encounter
  const bossMedsA = seedA.baseline.avgMedkitsAtFinal;
  const bossMedsB = seedB.baseline.avgMedkitsAtFinal;
  const passBossMeds = check(bossMedsA, targets.medkitsEnteringFinal) && check(bossMedsB, targets.medkitsEnteringFinal);
  const medsDistA = seedA.baseline.medkitsAtFinalDistribution?.pctWithAtLeastOne ?? 0;
  const medsDistB = seedB.baseline.medkitsAtFinalDistribution?.pctWithAtLeastOne ?? 0;
  rows.push({
    metric: 'Medkits at Final Encounter',
    measured: `${bossMedsA.toFixed(2)} (S1), ${bossMedsB.toFixed(2)} (S2) [${medsDistA.toFixed(0)}% S1 / ${medsDistB.toFixed(0)}% S2 >= 1]`,
    targetBand: fmtBand(targets.medkitsEnteringFinal, false),
    passed: passBossMeds,
  });

  const allPassed = rows.every((r) => r.passed);
  return { rows, allPassed };
}

export function runBalanceCheck(iterations = 500): boolean {
  const targetsPath = path.resolve(process.cwd(), 'balance-targets.json');
  if (!fs.existsSync(targetsPath)) {
    console.error(`Error: 'balance-targets.json' not found at ${targetsPath}`);
    process.exit(1);
  }

  const targetsJson = JSON.parse(fs.readFileSync(targetsPath, 'utf-8')) as BalanceTargets;
  const gameData = loadGameData();
  const recLevel = gameData.rules.progression?.recommendedLevel ?? 3;

  console.log('================================================================');
  console.log(`    AUTOMATED BALANCE ASSERTION RUNNER (Pass 15: Progression)`);
  console.log(`    Recommended Level: ${recLevel} | Iterations: ${iterations} | Seeds: 12345 & 98765`);
  console.log('================================================================\n');

  console.log(`Executing Seed 12345 difficulty curve sweep (Lvl ${Math.max(1, recLevel - 2)} to ${recLevel + 1}) & policies...`);
  const seed12345 = {
    sweep: runLevelSweep(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, gameData.equipment, iterations, 12345, gameData.rules),
    baseline: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, undefined, 12345, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
    noBoost: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, { disableBoost: true }, 12345, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
    noDisruptor: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, { disableDisruptor: true }, 12345, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
    noEsper: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, { disableEsper: true }, 12345, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
  };

  console.log(`Executing Seed 98765 difficulty curve sweep (Lvl ${Math.max(1, recLevel - 2)} to ${recLevel + 1}) & policies...`);
  const seed98765 = {
    sweep: runLevelSweep(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, gameData.equipment, iterations, 98765, gameData.rules),
    baseline: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, undefined, 98765, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
    noBoost: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, { disableBoost: true }, 98765, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
    noDisruptor: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, { disableDisruptor: true }, 98765, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
    noEsper: runSimulation(gameData.party, gameData.enemies, gameData.abilities, gameData.encounters, iterations, { disableEsper: true }, 98765, undefined, undefined, gameData.rules, recLevel, gameData.equipment),
  };

  const { rows, allPassed } = evaluateAssertions(targetsJson, seed12345, seed98765);

  console.log('\n--- BALANCE TARGET ASSERTIONS TABLE ---');
  console.log('┌──────────────────────────────────────────┬──────────────────────────────────────┬────────────────────┬────────┐');
  console.log('│ Metric                                   │ Measured Value                       │ Target Band        │ Status │');
  console.log('├──────────────────────────────────────────┼──────────────────────────────────────┼────────────────────┼────────┤');

  for (const r of rows) {
    const metricCol = r.metric.padEnd(40);
    const valCol = r.measured.padEnd(36);
    const bandCol = r.targetBand.padEnd(18);
    let statusCol = r.passed ? '\x1b[32mPASS\x1b[0m  ' : '\x1b[31mFAIL\x1b[0m  ';
    if (r.isInsufficientData) {
      statusCol = '\x1b[33mNO DATA\x1b[0m';
    }
    console.log(`│ ${metricCol} │ ${valCol} │ ${bandCol} │ ${statusCol} │`);
  }
  console.log('└──────────────────────────────────────────┴──────────────────────────────────────┴────────────────────┴────────┘');

  // Print difficulty curve summary
  console.log('\n--- JRPG DIFFICULTY CURVE SUMMARY ---');
  console.log(`  Level +1 (Lvl ${recLevel + 1}):   ${(seed12345.sweep.levels.find((l) => l.offset === 1)?.result.runCompletionRate ?? 0).toFixed(1)}% (S1) | ${(seed98765.sweep.levels.find((l) => l.offset === 1)?.result.runCompletionRate ?? 0).toFixed(1)}% (S2) [Target: 95%+]`);
  console.log(`  Rec Level (Lvl ${recLevel}):  ${(seed12345.sweep.levels.find((l) => l.offset === 0)?.result.runCompletionRate ?? 0).toFixed(1)}% (S1) | ${(seed98765.sweep.levels.find((l) => l.offset === 0)?.result.runCompletionRate ?? 0).toFixed(1)}% (S2) [Target: 85–90%]`);
  console.log(`  Level -1 (Lvl ${Math.max(1, recLevel - 1)}):   ${(seed12345.sweep.levels.find((l) => l.offset === -1)?.result.runCompletionRate ?? 0).toFixed(1)}% (S1) | ${(seed98765.sweep.levels.find((l) => l.offset === -1)?.result.runCompletionRate ?? 0).toFixed(1)}% (S2) [Target: 55–65%]`);
  console.log(`  Level -2 (Lvl ${Math.max(1, recLevel - 2)}):   ${(seed12345.sweep.levels.find((l) => l.offset === -2)?.result.runCompletionRate ?? 0).toFixed(1)}% (S1) | ${(seed98765.sweep.levels.find((l) => l.offset === -2)?.result.runCompletionRate ?? 0).toFixed(1)}% (S2) [Target: 20–30%]`);
  console.log(`  Supply Delta (Full vs Half): +${seed12345.sweep.supplySweep.delta.toFixed(1)}% (S1) | +${seed98765.sweep.supplySweep.delta.toFixed(1)}% (S2) [Target: > 10%]`);

  const uninformativeRows = rows.filter((r) => r.note);
  if (uninformativeRows.length > 0) {
    console.log('\n\x1b[33m* Note: Policy deltas below 5.0 points indicate the comparison is uninformative at the current difficulty ceiling (win rate ~100%).\x1b[0m');
  }

  if (allPassed) {
    console.log('\n\x1b[32m✓ ALL BALANCE TARGETS PASSED CLEANLY.\x1b[0m\n');
    return true;
  } else {
    const failedCount = rows.filter((r) => !r.passed).length;
    console.log(`\n\x1b[31m✗ BALANCE CHECK FAILED: ${failedCount} metrics out of band.\x1b[0m\n`);
    return false;
  }
}

if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('balanceCheck')) {
  const passed = runBalanceCheck();
  process.exit(passed ? 0 : 1);
}
