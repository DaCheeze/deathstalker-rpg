/**
 * Web Worker for the Browser Tuning Dashboard.
 * Imports src/core/ and simulation engine directly without DOM dependencies.
 * Executes headless simulations in background thread with chunked progress reporting.
 */

import { runSimulation, runLevelSweep, RunSimulationResult, LevelSweepResult } from '../sim/simulator';
import { evaluateAssertions, BalanceTargets, AssertionRow } from '../sim/balanceCheck';
import { loadGameData, applyOverrides, BalanceOverrides } from '../core/configLoader';
import defaultTargetsJson from '../../balance-targets.json';

export interface TunerWorkerRequest {
  type: 'START_SIMULATION';
  overrides?: BalanceOverrides;
  runs?: number;
  seedA?: number;
  seedB?: number;
  partyLevel?: number;
  supplyMode?: 'full' | 'half' | 'none';
}

export interface TunerWorkerProgress {
  type: 'PROGRESS';
  phase: string;
  completedRuns: number;
  totalRuns: number;
  percent: number;
}

export interface SimulationResultSet {
  sweep: LevelSweepResult;
  baseline: RunSimulationResult;
  noBoost: RunSimulationResult;
  noDisruptor: RunSimulationResult;
  noEsper: RunSimulationResult;
}

export interface TunerWorkerComplete {
  type: 'COMPLETE';
  seedA: SimulationResultSet;
  seedB: SimulationResultSet;
  assertions: {
    rows: AssertionRow[];
    allPassed: boolean;
  };
}

self.onmessage = (e: MessageEvent<TunerWorkerRequest>) => {
  if (e.data.type === 'START_SIMULATION') {
    const { overrides, runs = 200, seedA = 12345, seedB = 98765, partyLevel, supplyMode } = e.data;

    const baseGameData = loadGameData();
    const activeGameData = overrides ? applyOverrides(baseGameData, overrides) : baseGameData;
    const targets = defaultTargetsJson as BalanceTargets;
    const recLevel = partyLevel ?? activeGameData.rules.progression?.recommendedLevel ?? 3;

    // Report starting progress
    self.postMessage({
      type: 'PROGRESS',
      phase: `Simulating Seed ${seedA} Level Sweep & Baseline...`,
      completedRuns: 0,
      totalRuns: runs * 12,
      percent: 0,
    } as TunerWorkerProgress);

    // 1. Seed A Simulations
    const sweepA = runLevelSweep(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, activeGameData.equipment, runs, seedA, activeGameData.rules);
    const baselineA = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, undefined, seedA, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);
    self.postMessage({ type: 'PROGRESS', phase: `Simulating Seed ${seedA} Policies...`, completedRuns: runs * 4, totalRuns: runs * 12, percent: 33 } as TunerWorkerProgress);

    const noBoostA = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, { disableBoost: true }, seedA, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);
    const noDisruptorA = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, { disableDisruptor: true }, seedA, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);
    const noEsperA = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, { disableEsper: true }, seedA, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);
    self.postMessage({ type: 'PROGRESS', phase: `Simulating Seed ${seedB} Level Sweep & Baseline...`, completedRuns: runs * 6, totalRuns: runs * 12, percent: 50 } as TunerWorkerProgress);

    // 2. Seed B Simulations
    const sweepB = runLevelSweep(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, activeGameData.equipment, runs, seedB, activeGameData.rules);
    const baselineB = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, undefined, seedB, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);
    self.postMessage({ type: 'PROGRESS', phase: `Simulating Seed ${seedB} Policies...`, completedRuns: runs * 9, totalRuns: runs * 12, percent: 75 } as TunerWorkerProgress);

    const noBoostB = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, { disableBoost: true }, seedB, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);
    const noDisruptorB = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, { disableDisruptor: true }, seedB, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);
    const noEsperB = runSimulation(activeGameData.party, activeGameData.enemies, activeGameData.abilities, activeGameData.encounters, runs, { disableEsper: true }, seedB, undefined, undefined, activeGameData.rules, recLevel, activeGameData.equipment, undefined, supplyMode);

    self.postMessage({ type: 'PROGRESS', phase: 'Evaluating Difficulty Curve & Assertions...', completedRuns: runs * 12, totalRuns: runs * 12, percent: 100 } as TunerWorkerProgress);

    const seedAData: SimulationResultSet = { sweep: sweepA, baseline: baselineA, noBoost: noBoostA, noDisruptor: noDisruptorA, noEsper: noEsperA };
    const seedBData: SimulationResultSet = { sweep: sweepB, baseline: baselineB, noBoost: noBoostB, noDisruptor: noDisruptorB, noEsper: noEsperB };
    const assertions = evaluateAssertions(targets, seedAData, seedBData);

    self.postMessage({
      type: 'COMPLETE',
      seedA: seedAData,
      seedB: seedBData,
      assertions,
    } as TunerWorkerComplete);
  }
};
