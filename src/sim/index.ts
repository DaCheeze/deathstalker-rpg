/**
 * CLI runner for the Headless Combat Simulator (`npm run sim`).
 * Supports run-based simulations across full 5-encounter persistence runs.
 * Reports Run Completion Rate, survival distribution, party health entering boss,
 * medkit economy telemetry, and cross-encounter disruptor carryover.
 */

import * as fs from 'fs';
import * as path from 'path';
import { runSimulation, RunSimulationResult, BattleReplay } from './simulator';
import {
  validateAbilities,
  validateCombatants,
  validateEncounters,
} from '../core/validator';
import { PartyAIPolicy } from '../core/ai';

import abilitiesJson from '../data/abilities.json';
import partyJson from '../data/party.json';
import enemiesJson from '../data/enemies.json';
import encountersJson from '../data/encounters.json';

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

  console.log('\nFinal Encounter (Boss) Ingress State:');
  console.log(`  Party Health Entering Boss: ${results.partyHpEnteringFinalPct.toFixed(1)}% (${results.avgPartyHpEnteringFinal.toFixed(0)} / ${results.totalPartyMaxHp} Max HP) [Target: 50–70%]`);
  console.log(`  Medkits Remaining at Boss:  ${results.avgMedkitsAtFinal.toFixed(2)} [Target: 0–1]`);
  console.log(`  Revives Remaining at Boss:  ${results.avgRevivesAtFinal.toFixed(2)}`);

  console.log('\nCross-Encounter Resource Carryover:');
  console.log(`  Disruptor Cooling Starts:   ${results.disruptorCoolingStarts} / ${results.totalEncounterStarts} encounter starts (${results.disruptorCoolingPct.toFixed(1)}% of non-first battles started with >=1 disruptor cooling)`);
  console.log(`  Items Consumed Per Run:     Avg ${(results.totalMedkitsUsed / results.totalRuns).toFixed(2)} Medkits, ${(results.totalRevivesUsed / results.totalRuns).toFixed(2)} Revives`);
  console.log(`  Boost Crashes Per Run:      Avg ${(results.totalCrashes / results.totalRuns).toFixed(2)} crashes, ${results.avgCrashTurnsPerRun.toFixed(2)} recovery turns`);

  console.log('\nPer-Encounter Win Rates & Pacing in Run Context:');
  for (const [_id, enc] of Object.entries(results.encounterBreakdowns)) {
    console.log(`  [Fight ${enc.index}] ${enc.name} (${enc.tier.toUpperCase()}):`);
    console.log(`    Encounter Win Rate: ${enc.winRate.toFixed(1)}% (${enc.wins} wins / ${enc.starts} attempts)`);
    console.log(`    Actions: Avg ${enc.avgActions.toFixed(1)} | Rounds: Avg ${enc.avgRounds.toFixed(1)} (Min ${enc.minRounds === Infinity ? 0 : enc.minRounds.toFixed(1)} - Max ${enc.maxRounds.toFixed(1)})`);
    console.log(`    Disruptor Cooling Starts: ${enc.disruptorCoolingStarts} (${enc.starts > 0 ? ((enc.disruptorCoolingStarts / enc.starts) * 100).toFixed(1) : 0}%)`);
  }
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

export function main() {
  const args = process.argv.slice(2);
  const noDisruptor = args.includes('--no-disruptor');
  const noBoost = args.includes('--no-boost');
  const noEsper = args.includes('--no-esper');
  const recordAll = args.includes('--record');
  const recordSamples = args.includes('--record-samples');

  let seed = 12345;
  const seedArgIdx = args.indexOf('--seed');
  if (seedArgIdx !== -1 && args[seedArgIdx + 1]) {
    const parsed = parseInt(args[seedArgIdx + 1]!, 10);
    if (!isNaN(parsed)) {
      seed = parsed;
    }
  }

  // Load and validate definitions
  const abilities = validateAbilities(abilitiesJson);
  const partyRecord = validateCombatants(partyJson, 'party');
  const partyList = Object.values(partyRecord);
  const enemiesRecord = validateCombatants(enemiesJson, 'enemies');
  const encountersRecord = validateEncounters(encountersJson);
  const encountersList = Object.values(encountersRecord);

  const RUN_COUNT = 500;

  console.log('================================================================');
  console.log(`    DEATHSTALKER COMBAT ENGINE - RUN-BASED SIM SUITE (PASS 10) `);
  console.log(`    PRNG Seed: ${seed} | Simulated Full Runs: ${RUN_COUNT}    `);
  console.log(`    Inventory: 3 Medkits (40% Heal) | 1 Revive (30% Revive)     `);
  console.log(`    AI Healing Policy: In-Combat <30% HP | Intermission <50% HP `);
  if (recordSamples) {
    console.log(`    Replay Recording: Active (Samples Mode)                     `);
  } else if (recordAll) {
    console.log(`    Replay Recording: Active (Full Recording Mode)             `);
  }
  console.log('================================================================');

  let modes: { name: string; policy: PartyAIPolicy }[] = [
    { name: 'Baseline (Full AI)', policy: {} },
    { name: '--no-disruptor (No Disruptor)', policy: { disableDisruptor: true } },
    { name: '--no-boost (No Boost)', policy: { disableBoost: true } },
    { name: '--no-esper (No Psionics)', policy: { disableEsper: true } },
  ];

  if (noDisruptor) {
    modes = [{ name: '--no-disruptor (No Disruptor)', policy: { disableDisruptor: true } }];
  } else if (noBoost) {
    modes = [{ name: '--no-boost (No Boost)', policy: { disableBoost: true } }];
  } else if (noEsper) {
    modes = [{ name: '--no-esper (No Psionics)', policy: { disableEsper: true } }];
  }

  const comparativeRows: ComparativeRow[] = [];
  let baselineResult: RunSimulationResult | null = null;

  for (const m of modes) {
    const isBaseline = m.name.startsWith('Baseline');
    const recOpts = isBaseline && (recordAll || recordSamples)
      ? { recordAll, recordSamples }
      : undefined;

    const res = runSimulation(partyList, enemiesRecord, abilities, encountersList, RUN_COUNT, m.policy, seed, undefined, recOpts);
    if (isBaseline) {
      baselineResult = res;
    }

    const b = res.encounterBreakdowns;
    const f1 = b['enc_empire_skirmish']?.winRate.toFixed(0) ?? 'N/A';
    const f2 = b['enc_shub_skirmish']?.winRate.toFixed(0) ?? 'N/A';
    const f3 = b['enc_empire_patrol']?.winRate.toFixed(0) ?? 'N/A';
    const f4 = b['enc_shub_swarm']?.winRate.toFixed(0) ?? 'N/A';
    const f5 = b['enc_hadenman_vanguard']?.winRate.toFixed(0) ?? 'N/A';

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

  if (baselineResult) {
    printRunDetails(baselineResult);

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

  const manifest: Record<string, any> = {
    seed,
    generatedAt: new Date().toISOString(),
    samples: {},
  };

  const sampleExportData: Record<string, BattleReplay> = {};

  for (const [encId, sampleSet] of Object.entries(samples)) {
    manifest.samples[encId] = {};

    for (const type of ['shortest', 'median', 'longest'] as const) {
      const replay = sampleSet[type];
      if (!replay) continue;

      const fileName = `sample_${encId}_${type}.json`;
      const filePath = path.join(replaysDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(replay, null, 2), 'utf-8');

      manifest.samples[encId][type] = {
        file: fileName,
        actions: replay.summary.totalActions,
        rounds: replay.summary.totalRounds,
        winner: replay.summary.winner,
      };

      const exportKey = `${encId}_${type}`;
      sampleExportData[exportKey] = replay;
    }
  }

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
