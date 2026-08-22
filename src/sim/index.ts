/**
 * CLI runner for the Headless Combat Simulator (`npm run sim`).
 * Supports run-based simulations across full 5-encounter persistence runs.
 * Reports Run Completion Rate, survival distribution, party health entering boss,
 * boost diagnostics (§1.1), attrition budget measurements, policy comparisons,
 * and machine-readable JSON output (`--json`).
 */

import * as fs from 'fs';
import * as path from 'path';
import { runSimulation, runLevelSweep, RunSimulationResult, BattleReplay } from './simulator';
import { loadGameData } from '../core/configLoader';
import { PartyAIPolicy } from '../core/ai';
import { requireValue } from '../core/invariant';

function printRunDetails(results: RunSimulationResult) {
  console.log('\n--- RUN TELEMETRY & PERSISTENCE BREAKDOWN (BASELINE) ---');
  console.log(`Total Runs: ${results.totalRuns} | Completed: ${results.completedRuns} (${results.runCompletionRate.toFixed(1)}%) | Failed: ${results.failedRuns}`);
  
  const dist = results.fightsSurvivedDistribution;
  console.log('\nFights Survived Distribution:');
  console.log(`  Died at Fight 1 (Empire Skirmish):  ${dist.diedAtFight1} (${((dist.diedAtFight1 / results.totalRuns) * 100).toFixed(1)}%)`);
  console.log(`  Died at Fight 2 (Shub Skirmish):    ${dist.diedAtFight2} (${((dist.diedAtFight2 / results.totalRuns) * 100).toFixed(1)}%)`);
  console.log(`  Died at Fight 3 (Empire Patrol):    ${dist.diedAtFight3} (${((dist.diedAtFight3 / results.totalRuns) * 100).toFixed(1)}%)`);
  console.log(`  Died at Fight 4 (Shub Swarm):       ${dist.diedAtFight4} (${((dist.diedAtFight4 / results.totalRuns) * 100).toFixed(1)}%)`);
  console.log(`  Died at Fight 5 (Hadenman Vanguard): ${dist.diedAtFight5} (${((dist.diedAtFight5 / results.totalRuns) * 100).toFixed(1)}%)`);
  console.log(`  Completed Full Run (5/5 Victories): ${dist.completed} (${((dist.completed / results.totalRuns) * 100).toFixed(1)}%)`);

  console.log('\nBoost Economy Diagnostics (Pass 12 §1.1):');
  const diag = results.boostDiagnostics;
  console.log(`  HP Lost to Burnout Chip Per Run:    ${diag.avgBurnoutChipHpPerRun.toFixed(1)} HP`);
  console.log(`  Extra Damage Dealt by Boost/Run:    +${diag.avgExtraDamageDealtPerRun.toFixed(1)} DMG (+50% bonus)`);
  console.log(`  Average Turns Boosting/Activation:  ${diag.avgTurnsSpentBoostingPerActivation.toFixed(2)} turns`);
  console.log(`  Avg Burnout Value at Entry / Drop:  BN ${diag.avgBurnoutAtEntry.toFixed(1)} at entry  -->  BN ${diag.avgBurnoutAtExit.toFixed(1)} at exit`);
  console.log(`  Damage Return per HP Spent:         ${diag.damageToHpRatio.toFixed(2)}x DMG / HP`);
  console.log(`  Economic Evaluation:                ${diag.isNetPositive ? 'NET POSITIVE (Damage gain EXCEEDS HP cost)' : 'NET NEGATIVE (HP cost exceeds damage gain)'}`);

  console.log('\nAttrition Budget Verification (HP Lost Before Healing / 435 Total Max HP):');
  const att = results.tierAttrition;
  console.log(`  Skirmish Tier (F1 & F2): Target ~10%  | Actual: ${att.skirmish.actualPct.toFixed(1)}% (${att.skirmish.avgHpLost.toFixed(1)} HP lost/fight)`);
  console.log(`  Standard Tier (F3 & F4): Target ~25%  | Actual: ${att.standard.actualPct.toFixed(1)}% (${att.standard.avgHpLost.toFixed(1)} HP lost/fight)`);
  console.log(`  Elite Tier (F5):         Target ~35%  | Actual: ${att.elite.actualPct.toFixed(1)}% (${att.elite.avgHpLost.toFixed(1)} HP lost/fight)`);
  const totalCost = (att.skirmish.actualPct * 2) + (att.standard.actualPct * 2) + att.elite.actualPct;
  console.log(`  Total 5-Fight Run HP Cost Budget: ~105% | Actual: ${totalCost.toFixed(1)}% (${((totalCost / 100) * results.totalPartyMaxHp).toFixed(1)} HP total)`);

  console.log('\nFinal Encounter (Boss) Ingress State:');
  console.log(`  Party Health Entering Boss: ${results.partyHpEnteringFinalPct.toFixed(1)}% (${results.avgPartyHpEnteringFinal.toFixed(0)} / ${results.totalPartyMaxHp} Max HP) [Target: 50–70%]`);
  console.log(`  Medkits Remaining at Boss:  Avg ${results.avgMedkitsAtFinal.toFixed(2)} [Target: 0–1]`);
  if (results.medkitsAtFinalDistribution) {
    const d = results.medkitsAtFinalDistribution;
    console.log(`  Medkits Ingress Distribution: 0 Medkits: ${d.zero.toFixed(1)}% | 1 Medkit: ${d.one.toFixed(1)}% | 2+ Medkits: ${d.twoOrMore.toFixed(1)}% (Runs with >= 1 Medkit: ${d.pctWithAtLeastOne.toFixed(1)}%)`);
  }
  console.log(`  Revives Remaining at Boss:  ${results.avgRevivesAtFinal.toFixed(2)}`);

  console.log('\nCross-Encounter Resource Carryover:');
  console.log(`  Disruptor Cooling Starts:   ${results.disruptorCoolingStarts} / ${results.totalEncounterStarts} encounter starts (${results.disruptorCoolingPct.toFixed(1)}% of non-first battles started with >=1 disruptor cooling)`);
  console.log(`  Items Consumed Per Run:     Avg ${(results.totalMedkitsUsed / results.totalRuns).toFixed(2)} Medkits, ${(results.totalRevivesUsed / results.totalRuns).toFixed(2)} Revives`);

  console.log('\nPer-Encounter Win Rates, Pacing & Attrition:');
  Object.values(results.encounterBreakdowns).forEach((enc) => {
    console.log(`  [Fight ${enc.index}] ${enc.name} (${enc.tier.toUpperCase()}):`);
    console.log(`    Encounter Win Rate: ${enc.winRate.toFixed(1)}% (${enc.wins} wins / ${enc.starts} attempts)`);
    console.log(`    Pacing: Avg ${enc.avgRounds.toFixed(1)} rounds (Min ${enc.minRounds.toFixed(1)} - Max ${enc.maxRounds.toFixed(1)}) | Avg ${enc.avgActions.toFixed(1)} actions`);
    console.log(`    HP Cost (pre-heal): ${enc.avgHpLostPct.toFixed(1)}% (${enc.avgHpLostBeforeHealing.toFixed(1)} HP lost)`);
    console.log(`    Disruptor Cooling Starts: ${enc.disruptorCoolingStarts} (${((enc.disruptorCoolingStarts / Math.max(1, enc.starts)) * 100).toFixed(1)}%)`);
  });
}

interface ComparativeRow {
  Mode: string;
  'Run Win %': string;
  'Fight 1': string;
  'Fight 2': string;
  'Fight 3': string;
  'Fight 4': string;
  'Fight 5': string;
  'Boss HP %': string;
  'Boss Meds': string;
  'CD Carry %': string;
  'Crash T/R': string;
}

export function main(): void {
  const args = process.argv.slice(2);
  let seed = 12345;
  let runs = 500;
  let recordAll = false;
  let recordSamples = false;
  let jsonOutput: boolean = false;
  let jsonFilePath: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && args[i + 1]) {
      seed = parseInt(requireValue(args[i + 1], 'Missing --seed value'), 10);
      i++;
    } else if (args[i] === '--runs' && args[i + 1]) {
      runs = parseInt(requireValue(args[i + 1], 'Missing --runs value'), 10);
      i++;
    } else if (args[i] === '--record-all') {
      recordAll = true;
    } else if (args[i] === '--record-samples') {
      recordSamples = true;
    } else if (args[i] === '--json') {
      jsonOutput = true;
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        jsonFilePath = nextArg;
        i++;
      }
    }
  }

  const gameData = loadGameData();
  const partyList = gameData.party;
  const enemiesRecord = gameData.enemies;
  const abilities = gameData.abilities;
  const encountersList = gameData.encounters;

  if (!jsonOutput) {
    console.log('================================================================');
    console.log(`    DEATHSTALKER COMBAT ENGINE - RUN-BASED SIM SUITE (PASS 13) `);
    console.log(`    PRNG Seed: ${seed} | Simulated Full Runs: ${runs}    `);
    console.log(`    Inventory: ${gameData.rules.inventory.medkits} Medkits (${(gameData.rules.inventory.medkitHealPercent * 100).toFixed(0)}% Heal) | ${gameData.rules.inventory.revives} Revive (${(gameData.rules.inventory.reviveHealPercent * 100).toFixed(0)}% Revive)     `);
    console.log(`    Boost Economy: Entry +${gameData.rules.boost.entryBurnout} BN | Chip at BN${gameData.rules.boost.chipThreshold} | Drop at BN${gameData.rules.boost.aiDropThreshold}      `);
    if (recordSamples) console.log('    Replay Recording: Active (Samples Mode)                     ');
    console.log('================================================================');
  }

  const modes: { name: string; policy?: PartyAIPolicy }[] = [
    { name: 'Baseline (Full AI)' },
    { name: '--no-disruptor (No Disruptor)', policy: { disableDisruptor: true } },
    { name: '--no-boost (No Boost)', policy: { disableBoost: true } },
    { name: '--no-esper (No Psionics)', policy: { disableEsper: true } },
  ];

  const comparativeRows: ComparativeRow[] = [];
  let baselineResult: RunSimulationResult | null = null;
  const policyResults: Record<string, RunSimulationResult> = {};

  for (const m of modes) {
    const isBaseline = m.name.startsWith('Baseline');
    const recOpts = isBaseline && (recordAll || recordSamples)
      ? { recordAll, recordSamples }
      : undefined;

    const res = runSimulation(partyList, enemiesRecord, abilities, encountersList, runs, m.policy, seed, undefined, recOpts, gameData.rules);
    policyResults[m.name] = res;

    if (isBaseline) {
      baselineResult = res;
    }

    const b = res.encounterBreakdowns;
    const f1 = (b['enc_empire_skirmish']?.winRate ?? 0).toFixed(0);
    const f2 = (b['enc_shub_skirmish']?.winRate ?? 0).toFixed(0);
    const f3 = (b['enc_empire_patrol']?.winRate ?? 0).toFixed(0);
    const f4 = (b['enc_shub_swarm']?.winRate ?? 0).toFixed(0);
    const f5 = (b['enc_hadenman_vanguard']?.winRate ?? 0).toFixed(0);

    comparativeRows.push({
      Mode: m.name,
      'Run Win %': `${res.runCompletionRate.toFixed(1)}%`,
      'Fight 1': `${f1}%`,
      'Fight 2': `${f2}%`,
      'Fight 3': `${f3}%`,
      'Fight 4': `${f4}%`,
      'Fight 5': `${f5}%`,
      'Boss HP %': `${res.partyHpEnteringFinalPct.toFixed(1)}%`,
      'Boss Meds': `${res.avgMedkitsAtFinal.toFixed(2)}`,
      'CD Carry %': `${res.disruptorCoolingPct.toFixed(1)}%`,
      'Crash T/R': `${res.avgCrashTurnsPerRun.toFixed(2)}`,
    });
  }

  // Handle machine-readable JSON output
  if (jsonOutput && baselineResult) {
    const outputPayload = {
      timestamp: new Date().toISOString(),
      seed,
      runs,
      rules: gameData.rules,
      baseline: baselineResult,
      policyModes: policyResults,
    };
    const jsonStr = JSON.stringify(outputPayload, null, 2);

    if (jsonFilePath) {
      const outAbsPath = path.resolve(process.cwd(), jsonFilePath);
      fs.writeFileSync(outAbsPath, jsonStr, 'utf-8');
      console.log(`[JSON Output] Simulation results saved to '${jsonFilePath}'`);
    } else {
      console.log(jsonStr);
    }
    return;
  }

  const sweep = runLevelSweep(partyList, enemiesRecord, abilities, encountersList, gameData.equipment, runs, seed, gameData.rules);

  if (baselineResult) {
    printRunDetails(baselineResult);

    console.log('\n--- JRPG DIFFICULTY CURVE SWEEP (Levels & Supply) ---');
    console.log(`  Recommended Level: Lvl ${sweep.recommendedLevel}`);
    for (const lvl of sweep.levels) {
      const offsetLabel = lvl.offset === 0 ? ' (Recommended)' : ` (${lvl.offset > 0 ? '+' : ''}${lvl.offset})`;
      console.log(`  Party Level ${lvl.level}${offsetLabel.padEnd(16)}: ${lvl.result.runCompletionRate.toFixed(1)}% clear rate (Avg HP at Boss: ${lvl.result.partyHpEnteringFinalPct.toFixed(1)}% | Boss Meds: ${lvl.result.avgMedkitsAtFinal.toFixed(2)})`);
    }
    console.log('\n  Supply Dimension Sensitivity:');
    console.log(`    Full Supply (4 Meds):  ${sweep.supplySweep.full.runCompletionRate.toFixed(1)}%`);
    console.log(`    Half Supply (2 Meds):  ${sweep.supplySweep.half.runCompletionRate.toFixed(1)}%`);
    console.log(`    Supply Sensitivity:    +${sweep.supplySweep.delta.toFixed(1)}% win rate delta`);

    // Save Replay Samples if requested
    if (recordSamples && baselineResult.sampleReplays) {
      saveReplaySamples(baselineResult.sampleReplays, seed);
    }
  }

  console.log('\n========================================================================================================================');
  console.log(`                                  COMPARATIVE POLICY RUN SUMMARY (Seed: ${seed})                                       `);
  console.log('========================================================================================================================');
  console.table(comparativeRows);
}

function saveReplaySamples(
  samples: Record<string, { shortest: BattleReplay; median: BattleReplay; longest: BattleReplay }>,
  seed: number
): void {
  const replaysDir = path.resolve(process.cwd(), 'replays');
  if (!fs.existsSync(replaysDir)) {
    fs.mkdirSync(replaysDir, { recursive: true });
  }

  const samplesManifest: Record<string, Record<string, unknown>> = {};

  const sampleExportData: Record<string, BattleReplay> = {};

  for (const [encId, sampleSet] of Object.entries(samples)) {
    samplesManifest[encId] = {};

    for (const type of ['shortest', 'median', 'longest'] as const) {
      const replay = sampleSet[type];
      if (!replay) continue;

      const fileName = `sample_${encId}_${type}.json`;
      const filePath = path.join(replaysDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(replay, null, 2), 'utf-8');

      requireValue(samplesManifest[encId], `Sample manifest entry not found: ${encId}`)[type] = {
        file: fileName,
        actions: replay.summary.totalActions,
        rounds: replay.summary.totalRounds,
        winner: replay.summary.winner,
      };

      const exportKey = `${encId}_${type}`;
      sampleExportData[exportKey] = replay;
    }
  }

  const manifest = {
    seed,
    generatedAt: new Date().toISOString(),
    samples: samplesManifest,
  };

  fs.writeFileSync(path.join(replaysDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // Also write src/data/sampleReplays.ts so Vite/Browser loads them seamlessly
  const tsContent = `/**
 * Auto-generated sample replay bundle from simulator (\`--record-samples\`).
 * Allows instant replay viewing in browser without local HTTP file server configuration.
 */

import { BattleReplay } from '../sim/simulator';

export const SAMPLE_REPLAYS: Record<string, BattleReplay> = ${JSON.stringify(sampleExportData, null, 2)};
`;

  const tsDir = path.resolve(process.cwd(), 'src', 'data');
  fs.writeFileSync(path.join(tsDir, 'sampleReplays.ts'), tsContent, 'utf-8');

  console.log(`\n[Replay Recorder] Successfully saved sample replays to '${replaysDir}' and 'src/data/sampleReplays.ts'`);
}

if (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')) {
  main();
}
