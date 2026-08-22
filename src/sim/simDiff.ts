/**
 * Simulation Diff Tool (npm run sim:diff <fileA> <fileB>).
 * Compares two machine-readable simulation JSON outputs metric-by-metric
 * and prints clear deltas.
 */

import fs from 'fs';
import path from 'path';
import { RunSimulationResult } from './simulator';

const norm = (v: number) => (v > 1.0 ? v / 100 : v);

export function formatPercent(n: number): string {
  return `${(norm(n) * 100).toFixed(1)}%`;
}

export function formatDelta(a: number, b: number, isPercent = false): string {
  const diff = isPercent ? norm(b) - norm(a) : b - a;
  const sign = diff >= 0 ? '+' : '';
  if (isPercent) {
    return `${sign}${(diff * 100).toFixed(1)}%`;
  }
  return `${sign}${diff.toFixed(2)}`;
}

export function diffSimulations(fileAPath: string, fileBPath: string): void {
  const absA = path.resolve(process.cwd(), fileAPath);
  const absB = path.resolve(process.cwd(), fileBPath);

  if (!fs.existsSync(absA)) {
    console.error(`Error: File A not found at '${absA}'`);
    process.exit(1);
  }
  if (!fs.existsSync(absB)) {
    console.error(`Error: File B not found at '${absB}'`);
    process.exit(1);
  }

  const rawA = JSON.parse(fs.readFileSync(absA, 'utf-8'));
  const rawB = JSON.parse(fs.readFileSync(absB, 'utf-8'));
  const dataA: RunSimulationResult = rawA.baseline || rawA;
  const dataB: RunSimulationResult = rawB.baseline || rawB;

  console.log('================================================================');
  console.log(`    SIMULATION RUN DELTA COMPARISON`);
  console.log(`    File A: ${path.basename(fileAPath)} (Seed ${dataA.seed})`);
  console.log(`    File B: ${path.basename(fileBPath)} (Seed ${dataB.seed})`);
  console.log('================================================================\n');

  console.log('┌───────────────────────────────────────┬────────────┬────────────┬────────────┐');
  console.log('│ Metric                                │ File A     │ File B     │ Delta (B-A)│');
  console.log('├───────────────────────────────────────┼────────────┼────────────┼────────────┤');

  const rows: [string, string, string, string][] = [
    [
      'Run Completion Rate',
      formatPercent(dataA.runCompletionRate),
      formatPercent(dataB.runCompletionRate),
      formatDelta(dataA.runCompletionRate, dataB.runCompletionRate, true),
    ],
    [
      'Skirmish Tier HP Cost',
      `${dataA.tierAttrition.skirmish.actualPct.toFixed(1)}%`,
      `${dataB.tierAttrition.skirmish.actualPct.toFixed(1)}%`,
      formatDelta(dataA.tierAttrition.skirmish.actualPct, dataB.tierAttrition.skirmish.actualPct, true),
    ],
    [
      'Standard Tier HP Cost',
      `${dataA.tierAttrition.standard.actualPct.toFixed(1)}%`,
      `${dataB.tierAttrition.standard.actualPct.toFixed(1)}%`,
      formatDelta(dataA.tierAttrition.standard.actualPct, dataB.tierAttrition.standard.actualPct, true),
    ],
    [
      'Elite Tier HP Cost',
      `${dataA.tierAttrition.elite.actualPct.toFixed(1)}%`,
      `${dataB.tierAttrition.elite.actualPct.toFixed(1)}%`,
      formatDelta(dataA.tierAttrition.elite.actualPct, dataB.tierAttrition.elite.actualPct, true),
    ],
    [
      'Party HP Entering Final',
      `${dataA.partyHpEnteringFinalPct.toFixed(1)}%`,
      `${dataB.partyHpEnteringFinalPct.toFixed(1)}%`,
      formatDelta(dataA.partyHpEnteringFinalPct, dataB.partyHpEnteringFinalPct, true),
    ],
    [
      'Medkits at Final Encounter',
      dataA.avgMedkitsAtFinal.toFixed(2),
      dataB.avgMedkitsAtFinal.toFixed(2),
      formatDelta(dataA.avgMedkitsAtFinal, dataB.avgMedkitsAtFinal),
    ],
    [
      'Boost Extra DMG / Run',
      `+${dataA.boostDiagnostics.avgExtraDamageDealtPerRun.toFixed(1)}`,
      `+${dataB.boostDiagnostics.avgExtraDamageDealtPerRun.toFixed(1)}`,
      formatDelta(dataA.boostDiagnostics.avgExtraDamageDealtPerRun, dataB.boostDiagnostics.avgExtraDamageDealtPerRun),
    ],
    [
      'Burnout Chip HP Lost / Run',
      dataA.boostDiagnostics.avgBurnoutChipHpPerRun.toFixed(1),
      dataB.boostDiagnostics.avgBurnoutChipHpPerRun.toFixed(1),
      formatDelta(dataA.boostDiagnostics.avgBurnoutChipHpPerRun, dataB.boostDiagnostics.avgBurnoutChipHpPerRun),
    ],
    [
      'Disruptor Carryover %',
      `${dataA.disruptorCoolingPct.toFixed(1)}%`,
      `${dataB.disruptorCoolingPct.toFixed(1)}%`,
      formatDelta(dataA.disruptorCoolingPct, dataB.disruptorCoolingPct, true),
    ],
  ];

  for (const [name, valA, valB, delta] of rows) {
    console.log(`│ ${name.padEnd(37)} │ ${valA.padEnd(10)} │ ${valB.padEnd(10)} │ ${delta.padEnd(10)} │`);
  }

  console.log('└───────────────────────────────────────┴────────────┴────────────┴────────────┘\n');
}

if (process.argv[1]?.includes('simDiff')) {
  const fileA = process.argv[2];
  const fileB = process.argv[3];

  if (!fileA || !fileB) {
    console.log('Usage: npm run sim:diff <fileA.json> <fileB.json>');
    process.exit(1);
  }

  diffSimulations(fileA, fileB);
}
