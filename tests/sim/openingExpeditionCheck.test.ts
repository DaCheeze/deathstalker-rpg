import { describe, expect, it } from 'vitest';

import {
  OPENING_ACCEPTANCE_SEEDS,
  runOpeningExpeditionCheck,
} from '../../src/sim/openingExpeditionCheck';

describe('opening expedition full-route acceptance check', () => {
  it.each(OPENING_ACCEPTANCE_SEEDS)('completes seed %i with full boundary telemetry', (seed) => {
    const report = runOpeningExpeditionCheck(seed);
    expect(report).toMatchObject({
      seed,
      status: 'complete',
      beatId: 'yacht_safety',
      boundaryCount: 10,
    });
    expect(report.encounterActionCounts).toHaveLength(3);
    expect(report.encounterActionCounts.every((encounter) => (
      encounter.status === 'victory' && encounter.actions > 0 && encounter.turns > 0
    ))).toBe(true);
    expect(report.partyHpPercentage).toBeGreaterThan(0);
    expect(report.medkitsRemaining).toBeGreaterThanOrEqual(0);
    expect(report.recoveryChoice).toBeNull();
  });
});
