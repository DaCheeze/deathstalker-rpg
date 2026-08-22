import { describe, it, expect } from 'vitest';
import { evaluateAssertions, BalanceTargets } from '../../src/sim/balanceCheck';
import { RunSimulationResult, LevelSweepResult } from '../../src/sim/simulator';

describe('Balance Assertions Evaluator', () => {
  const mockTargets: BalanceTargets = {
    difficultyCurve: {
      levelPlus1: { min: 0.95, unit: 'percent' },
      atRecommended: { min: 0.85, max: 0.90, unit: 'percent' },
      levelMinus1: { min: 0.55, max: 0.65, unit: 'percent' },
      levelMinus2: { min: 0.20, max: 0.30, unit: 'percent' },
    },
    supplySensitivity: {
      fullVsHalfDelta: { min: 0.10, unit: 'percent_delta' },
    },
    skirmishHpCost: { min: 0.07, max: 0.13, unit: 'percent' },
    standardHpCost: { min: 0.22, max: 0.28, unit: 'percent' },
    eliteHpCost: { min: 0.30, max: 0.40, unit: 'percent' },
    skirmishRounds: { min: 3.0, max: 5.0, unit: 'number' },
    standardRounds: { min: 5.0, max: 7.0, unit: 'number' },
    eliteRounds: { min: 6.0, max: 8.0, unit: 'number' },
    failureShareOpeningSkirmishes: { min: 0.00, max: 0.05, unit: 'percent' },
    failureShareStandardEncounters: { min: 0.05, max: 0.25, unit: 'percent' },
    failureShareFinalElite: { min: 0.60, max: 0.90, unit: 'percent' },
    partyHpEnteringFinal: { min: 0.50, max: 0.70, unit: 'percent' },
    medkitsEnteringFinal: { min: 1.0, max: 2.0, unit: 'count' },
    baselineMinusNoBoost: { min: 0.001, unit: 'percent_delta' },
    baselineMinusNoDisruptor: { min: 0.001, unit: 'percent_delta' },
    baselineMinusNoEsper: { min: 0.001, unit: 'percent_delta' },
    seedVariance: { max: 0.05, unit: 'percent_delta' },
  };

  const createMockResult = (rate: number, stdCost: number, totalRuns = 200): RunSimulationResult => {
    const completed = Math.round(rate * totalRuns);
    const failed = totalRuns - completed;
    // Distribute failures across encounters with sufficient sample (>20 failures)
    const f1 = 0;
    const f2 = 0;
    const f3 = Math.round(failed * 0.05);
    const f4 = Math.round(failed * 0.15);
    const f5 = failed - (f1 + f2 + f3 + f4);

    return {
      seed: 12345,
      totalRuns,
      completedRuns: completed,
      failedRuns: failed,
      runCompletionRate: rate * 100,
      fightsSurvivedDistribution: { diedAtFight1: f1, diedAtFight2: f2, diedAtFight3: f3, diedAtFight4: f4, diedAtFight5: f5, completed },
      partyHpEnteringFinalPct: 60,
      avgPartyHpEnteringFinal: 260,
      partyHpEnteringFinalStandardPct: 65,
      avgPartyHpEnteringFinalStandard: 282,
      avgMedkitsConsumedBeforeFinalPct: 75,
      totalPartyMaxHp: 435,
      avgMedkitsAtFinal: 1.5,
      medkitsAtFinalDistribution: { zero: 20, one: 50, twoOrMore: 30, pctWithAtLeastOne: 80 },
      avgRevivesAtFinal: 0.5,
      disruptorCoolingStarts: 10,
      totalEncounterStarts: 400,
      disruptorCoolingPct: 2.5,
      totalMedkitsUsed: 200,
      totalRevivesUsed: 50,
      totalBoostsActivated: 100,
      totalVoluntaryBoostExits: 90,
      totalForcedBoostCrashes: 10,
      totalCrashTurns: 20,
      avgCrashTurnsPerRun: 0.2,
      boostDiagnostics: {
        totalBurnoutChipHpLost: 500,
        avgBurnoutChipHpPerRun: 5,
        totalExtraDamageDealtByBoost: 2000,
        avgExtraDamageDealtPerRun: 20,
        totalBoostActivations: 100,
        totalBoostExits: 100,
        avgTurnsSpentBoostingPerActivation: 3.5,
        avgBurnoutAtEntry: 2.1,
        avgBurnoutAtExit: 6.8,
        isNetPositive: true,
        damageToHpRatio: 4.0,
      },
      tierAttrition: {
        skirmish: { targetPct: 10, actualPct: 9.5, avgHpLost: 41 },
        standard: { targetPct: 25, actualPct: stdCost, avgHpLost: 108 },
        elite: { targetPct: 35, actualPct: 34.0, avgHpLost: 147 },
      },
      encounterBreakdowns: {
        enc_empire_skirmish: { id: 'enc_empire_skirmish', name: 'Empire Skirmish', tier: 'skirmish', index: 1, starts: totalRuns, wins: totalRuns, winRate: 1, avgActions: 16, minActions: 12, maxActions: 20, avgRounds: 4.0, minRounds: 3, maxRounds: 5, partyDamageReceived: { weapon: 0, disruptor: 0, esper: 0, burnout: 0, total: 40 }, avgHpLostBeforeHealing: 40, avgHpLostPct: 9.2, crewDamageDealt: { 'Captain Valen': 100, Lyra: 100, Kaelen: 100, Tarek: 100 }, disruptorCoolingStarts: 0, voluntaryBoostExits: 0, forcedBoostCrashes: 0, crashTurns: 0, medkitsUsed: 0, revivesUsed: 0 },
        enc_shub_skirmish: { id: 'enc_shub_skirmish', name: 'Shub Skirmish', tier: 'skirmish', index: 2, starts: totalRuns, wins: totalRuns, winRate: 1, avgActions: 14, minActions: 10, maxActions: 18, avgRounds: 3.5, minRounds: 2.5, maxRounds: 4.5, partyDamageReceived: { weapon: 0, disruptor: 0, esper: 0, burnout: 0, total: 30 }, avgHpLostBeforeHealing: 30, avgHpLostPct: 7.0, crewDamageDealt: { 'Captain Valen': 100, Lyra: 100, Kaelen: 100, Tarek: 100 }, disruptorCoolingStarts: 0, voluntaryBoostExits: 0, forcedBoostCrashes: 0, crashTurns: 0, medkitsUsed: 0, revivesUsed: 0 },
        enc_empire_patrol: { id: 'enc_empire_patrol', name: 'Empire Patrol', tier: 'standard', index: 3, starts: totalRuns, wins: totalRuns, winRate: 1, avgActions: 26, minActions: 20, maxActions: 32, avgRounds: 6.5, minRounds: 5, maxRounds: 8, partyDamageReceived: { weapon: 0, disruptor: 0, esper: 0, burnout: 0, total: 110 }, avgHpLostBeforeHealing: 110, avgHpLostPct: 25.0, crewDamageDealt: { 'Captain Valen': 100, Lyra: 100, Kaelen: 100, Tarek: 100 }, disruptorCoolingStarts: 0, voluntaryBoostExits: 0, forcedBoostCrashes: 0, crashTurns: 0, medkitsUsed: 0, revivesUsed: 0 },
        enc_shub_swarm: { id: 'enc_shub_swarm', name: 'Shub Swarm', tier: 'standard', index: 4, starts: totalRuns, wins: totalRuns - f4, winRate: 0.93, avgActions: 25, minActions: 20, maxActions: 30, avgRounds: 6.2, minRounds: 5, maxRounds: 7.5, partyDamageReceived: { weapon: 0, disruptor: 0, esper: 0, burnout: 0, total: 105 }, avgHpLostBeforeHealing: 105, avgHpLostPct: 24.0, crewDamageDealt: { 'Captain Valen': 100, Lyra: 100, Kaelen: 100, Tarek: 100 }, disruptorCoolingStarts: 0, voluntaryBoostExits: 0, forcedBoostCrashes: 0, crashTurns: 0, medkitsUsed: 0, revivesUsed: 0 },
        enc_hadenman_vanguard: { id: 'enc_hadenman_vanguard', name: 'Hadenman Vanguard', tier: 'elite', index: 5, starts: totalRuns - f4, wins: completed, winRate: 0.59, avgActions: 27, minActions: 20, maxActions: 36, avgRounds: 6.8, minRounds: 5.5, maxRounds: 8.5, partyDamageReceived: { weapon: 0, disruptor: 0, esper: 0, burnout: 0, total: 150 }, avgHpLostBeforeHealing: 150, avgHpLostPct: 34.5, crewDamageDealt: { 'Captain Valen': 100, Lyra: 100, Kaelen: 100, Tarek: 100 }, disruptorCoolingStarts: 0, voluntaryBoostExits: 0, forcedBoostCrashes: 0, crashTurns: 0, medkitsUsed: 0, revivesUsed: 0 },
      },
    };
  };

  const createMockSweep = (stdCost: number): LevelSweepResult => ({
    recommendedLevel: 3,
    levels: [
      { level: 1, offset: -2, result: createMockResult(0.25, stdCost) },
      { level: 2, offset: -1, result: createMockResult(0.60, stdCost) },
      { level: 3, offset: 0, result: createMockResult(0.88, stdCost) },
      { level: 4, offset: 1, result: createMockResult(0.98, stdCost) },
    ],
    supplySweep: {
      full: createMockResult(0.88, stdCost),
      half: createMockResult(0.70, stdCost),
      delta: 18.0,
    },
  });

  it('should pass when all difficulty curve metrics and invariants are in band', () => {
    const seedA = {
      sweep: createMockSweep(25.0),
      baseline: createMockResult(0.88, 25.0),
      noBoost: createMockResult(0.70, 25.0),
      noDisruptor: createMockResult(0.65, 25.0),
      noEsper: createMockResult(0.60, 25.0),
    };
    const seedB = {
      sweep: createMockSweep(25.2),
      baseline: createMockResult(0.87, 25.2),
      noBoost: createMockResult(0.71, 25.2),
      noDisruptor: createMockResult(0.66, 25.2),
      noEsper: createMockResult(0.61, 25.2),
    };

    const { allPassed, rows } = evaluateAssertions(mockTargets, seedA, seedB);
    expect(allPassed).toBe(true);
    expect(rows.every((r) => r.passed)).toBe(true);
  });

  it('should fail when standard HP cost is out of band (e.g. 35.4%)', () => {
    const seedA = {
      sweep: createMockSweep(35.4),
      baseline: createMockResult(0.88, 35.4),
      noBoost: createMockResult(0.70, 35.4),
      noDisruptor: createMockResult(0.65, 35.4),
      noEsper: createMockResult(0.60, 35.4),
    };
    const seedB = {
      sweep: createMockSweep(35.4),
      baseline: createMockResult(0.87, 35.4),
      noBoost: createMockResult(0.71, 35.4),
      noDisruptor: createMockResult(0.66, 35.4),
      noEsper: createMockResult(0.61, 35.4),
    };

    const { allPassed, rows } = evaluateAssertions(mockTargets, seedA, seedB);
    expect(allPassed).toBe(false);
    const stdRow = rows.find((r) => r.metric.includes('Standard HP Cost'));
    expect(stdRow?.passed).toBe(false);
  });

  it('requires pacing targets to pass for both seeds', () => {
    const seedA = {
      sweep: createMockSweep(25.0),
      baseline: createMockResult(0.88, 25.0),
      noBoost: createMockResult(0.70, 25.0),
      noDisruptor: createMockResult(0.65, 25.0),
      noEsper: createMockResult(0.60, 25.0),
    };
    const seedBBaseline = createMockResult(0.87, 25.0);
    const shubSkirmish = seedBBaseline.encounterBreakdowns.enc_shub_skirmish;
    if (!shubSkirmish) throw new Error('Missing Shub skirmish test fixture');
    shubSkirmish.avgRounds = 8;
    const seedB = {
      sweep: createMockSweep(25.0),
      baseline: seedBBaseline,
      noBoost: createMockResult(0.71, 25.0),
      noDisruptor: createMockResult(0.66, 25.0),
      noEsper: createMockResult(0.61, 25.0),
    };

    const { rows } = evaluateAssertions(mockTargets, seedA, seedB);
    expect(rows.find((row) => row.metric.includes('Skirmish Rounds'))?.passed).toBe(false);
  });

  it('treats exactly one percent as 1%, not 100%', () => {
    const sweepA = createMockSweep(25.0);
    const sweepB = createMockSweep(25.0);
    const minusTwoA = sweepA.levels.find((entry) => entry.offset === -2);
    const minusTwoB = sweepB.levels.find((entry) => entry.offset === -2);
    if (!minusTwoA || !minusTwoB) throw new Error('Missing level -2 test fixture');
    minusTwoA.result.runCompletionRate = 1;
    minusTwoB.result.runCompletionRate = 1;
    const seedA = {
      sweep: sweepA,
      baseline: createMockResult(0.88, 25.0),
      noBoost: createMockResult(0.70, 25.0),
      noDisruptor: createMockResult(0.65, 25.0),
      noEsper: createMockResult(0.60, 25.0),
    };
    const seedB = {
      sweep: sweepB,
      baseline: createMockResult(0.87, 25.0),
      noBoost: createMockResult(0.71, 25.0),
      noDisruptor: createMockResult(0.66, 25.0),
      noEsper: createMockResult(0.61, 25.0),
    };

    const { rows } = evaluateAssertions(mockTargets, seedA, seedB);
    const row = rows.find((entry) => entry.metric.includes('Level -2'));
    expect(row?.measured).toContain('1.0%');
    expect(row?.passed).toBe(false);
  });

  it('fails loudly when an expected level sweep result is missing', () => {
    const sweep = createMockSweep(25.0);
    sweep.levels = sweep.levels.filter((entry) => entry.offset !== -2);
    const seed = {
      sweep,
      baseline: createMockResult(0.88, 25.0),
      noBoost: createMockResult(0.70, 25.0),
      noDisruptor: createMockResult(0.65, 25.0),
      noEsper: createMockResult(0.60, 25.0),
    };

    expect(() => evaluateAssertions(mockTargets, seed, seed)).toThrow(
      'Missing level sweep result for offset -2'
    );
  });

  it('does not report overall success when failure distribution has no data', () => {
    const result = createMockResult(1, 25.0);
    const sweep = createMockSweep(25.0);
    const seed = {
      sweep,
      baseline: result,
      noBoost: createMockResult(0.70, 25.0),
      noDisruptor: createMockResult(0.65, 25.0),
      noEsper: createMockResult(0.60, 25.0),
    };

    const { rows, allPassed } = evaluateAssertions(mockTargets, seed, seed);
    expect(rows.some((row) => row.isInsufficientData)).toBe(true);
    expect(allPassed).toBe(false);
  });
});
