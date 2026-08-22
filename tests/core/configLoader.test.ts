import { describe, it, expect } from 'vitest';
import { deepMerge, applyOverrides, getDefaultRules, loadGameData } from '../../src/core/configLoader';

describe('ConfigLoader & Dynamic Overrides', () => {
  it('should deeply merge nested objects immutably', () => {
    const target = {
      boost: { entryBurnout: 2, chipThreshold: 6 },
      nested: { a: 1, b: { c: 3 } },
    };
    const source = {
      boost: { chipThreshold: 7 },
      nested: { b: { c: 4 } },
    };

    const merged = deepMerge(target, source);
    expect(merged.boost.entryBurnout).toBe(2);
    expect(merged.boost.chipThreshold).toBe(7);
    expect(merged.nested.b.c).toBe(4);
    expect(target.boost.chipThreshold).toBe(6); // Immutability test
  });

  it('should apply rule and enemy stat overrides onto GameData', () => {
    const baseData = loadGameData();
    const overrides = {
      rules: {
        inventory: {
          medkits: 9,
          medkitHealPercent: 0.75,
        },
      },
      enemies: {
        emp_legionnaire: {
          stats: {
            attack: 42,
          },
        },
      },
    };

    const updated = applyOverrides(baseData, overrides);
    expect(updated.rules.inventory.medkits).toBe(9);
    expect(updated.rules.inventory.medkitHealPercent).toBe(0.75);
    expect(updated.rules.inventory.revives).toBe(baseData.rules.inventory.revives);
    expect(updated.enemies.emp_legionnaire.stats.attack).toBe(42);
    expect(updated.enemies.emp_legionnaire.stats.hp).toBe(baseData.enemies.emp_legionnaire.stats.hp);
  });

  it('should return a fresh cloned default rules object from getDefaultRules()', () => {
    const rules1 = getDefaultRules();
    const rules2 = getDefaultRules();
    expect(rules1).toEqual(rules2);
    expect(rules1).not.toBe(rules2);
  });
});
