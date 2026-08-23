import { afterEach, describe, expect, it } from 'vitest';
import {
  advanceCombatantFeedback,
  getCombatantFlinchOffset,
  resetCombatantFeedback,
  triggerCombatantFlinch,
} from '../../src/render/drawCombatants';

afterEach(() => {
  resetCombatantFeedback();
});

describe('combatant feedback timing', () => {
  it('freezes flinch progression on a zero active delta', () => {
    triggerCombatantFlinch('target', 12, 120);

    expect(getCombatantFlinchOffset('target')).toBe(-12);
    advanceCombatantFeedback(0);
    expect(getCombatantFlinchOffset('target')).toBe(-12);

    advanceCombatantFeedback(60);
    expect(getCombatantFlinchOffset('target')).toBe(-6);
    advanceCombatantFeedback(60);
    expect(getCombatantFlinchOffset('target')).toBe(0);
  });

  it('clears active flinch feedback on reset', () => {
    triggerCombatantFlinch('target', 8, 140);
    resetCombatantFeedback();
    expect(getCombatantFlinchOffset('target')).toBe(0);
  });
});
