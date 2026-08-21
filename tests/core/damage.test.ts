import { describe, it, expect } from 'vitest';
import { calculateDamage } from '../../src/core/damage';
import { Combatant, AbilityDefinition } from '../../src/core/types';

function createMockCombatant(attack: number, defense: number): Combatant {
  return {
    id: 'c1',
    name: 'Combatant',
    faction: 'party',
    role: 'Role',
    stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack, defense, speed: 10 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: [],
  };
}

const mockAbility: AbilityDefinition = {
  id: 'sword',
  name: 'Sword',
  category: 'melee',
  espCost: 0,
  powerMultiplier: 1.0,
  targetScope: 'single_enemy',
  description: 'test',
};

describe('Centralized Damage Formula', () => {
  it('calculates (attack * mult) - (defense * 0.5)', () => {
    const attacker = createMockCombatant(30, 0);
    const target = createMockCombatant(0, 20);

    // Power = 30 * 1.0 = 30. Reduction = 20 * 0.5 = 10. Damage = 20.
    const result = calculateDamage(attacker, target, mockAbility, { varianceFactor: 1.0, isCrit: false });
    expect(result.finalDamage).toBe(20);
  });

  it('applies boost multiplier of +50%', () => {
    const attacker = createMockCombatant(30, 0);
    attacker.isBoosting = true;
    const target = createMockCombatant(0, 20);

    // Effective attack = 45. Power = 45. Reduction = 10. Damage = 35.
    const result = calculateDamage(attacker, target, mockAbility, { varianceFactor: 1.0, isCrit: false });
    expect(result.finalDamage).toBe(35);
  });

  it('applies crit multiplier (1.5x)', () => {
    const attacker = createMockCombatant(30, 0);
    const target = createMockCombatant(0, 20);

    // Base damage = 20. Crit = 30.
    const result = calculateDamage(attacker, target, mockAbility, { varianceFactor: 1.0, isCrit: true });
    expect(result.finalDamage).toBe(30);
  });

  it('enforces minimum damage floor of 1 on heavy armor', () => {
    const attacker = createMockCombatant(10, 0);
    const target = createMockCombatant(0, 500); // Massive defense

    const result = calculateDamage(attacker, target, mockAbility, { varianceFactor: 1.0, isCrit: false });
    expect(result.finalDamage).toBe(1);
  });
});
