import { AbilityDefinition, Combatant } from './types';
import { RNG } from './random';

export interface DamageCalculationOptions {
  isCrit?: boolean;
  varianceFactor?: number; // 0.9 to 1.1
  forceIgnoreShield?: boolean;
}

export interface DamageResult {
  rawDamage: number;
  finalDamage: number;
  isCrit: boolean;
  isDisruptor: boolean;
  shieldAbsorbed: boolean;
  shieldDropped: boolean;
}

/**
 * Calculates damage dealt by an attacker to a target using an ability.
 * Supports passing a pure seeded RNG generator or explicit deterministic options.
 */
export function calculateDamage(
  attacker: Combatant,
  target: Combatant,
  ability: AbilityDefinition,
  optionsOrRng?: DamageCalculationOptions | RNG
): DamageResult {
  const isDisruptor = ability.category === 'disruptor';

  // 1. Calculate effective attacker attack power
  let attackPower = attacker.stats.attack;

  // Stance multiplier: Boost gives +50% damage
  if (attacker.isBoosting) {
    attackPower *= 1.5;
  }

  // Ramp-up penalty: 50% damage dealt on the turn entering boost
  if (attacker.enteredBoostThisTurn) {
    attackPower *= 0.5;
  }

  // Check stat debuffs/buffs on attacker
  if (attacker.statModifiers) {
    for (const mod of attacker.statModifiers) {
      if (mod.attackMultiplier !== undefined) {
        attackPower *= mod.attackMultiplier;
      }
    }
  }

  // 2. Calculate effective target defense
  let defensePower = target.stats.defense;
  if (target.statModifiers) {
    for (const mod of target.statModifiers) {
      if (mod.defenseMultiplier !== undefined) {
        defensePower *= mod.defenseMultiplier;
      }
    }
  }

  // 3. Base formula: (attack * powerMultiplier) - (defense * 0.5)
  // Psionic / Esper powers bypass armor defense entirely
  const power = attackPower * ability.powerMultiplier;
  const reduction = ability.category === 'esper' ? 0 : defensePower * 0.5;
  let baseDamage = Math.max(1, power - reduction);

  // 4. Critical hit & Variance (+/- 10%) calculation
  let isCrit = false;
  let variance = 1.0;
  const critChance = 0.10 + (ability.critBonus ?? 0);

  if (typeof optionsOrRng === 'function') {
    // Pure Seeded RNG mode: crit chance [base 10% + ability critBonus], [0.90, 1.10] variance
    isCrit = optionsOrRng() < critChance;
    variance = 0.90 + optionsOrRng() * 0.20;
  } else if (optionsOrRng) {
    isCrit = optionsOrRng.isCrit ?? false;
    variance = optionsOrRng.varianceFactor ?? 1.0;
  }

  if (isCrit) {
    baseDamage *= 1.5;
  }

  const rawDamage = Math.max(1, Math.round(baseDamage * variance));

  // 6. Force Shield absorption check
  // Force shields block next melee or projectile attack completely, but NEVER block disruptors
  let finalDamage = rawDamage;
  let shieldAbsorbed = false;
  let shieldDropped = false;

  if (target.hasForceShield) {
    if (isDisruptor) {
      // Force shields reduce incoming disruptor damage by 50%, then the shield collapses
      shieldAbsorbed = true;
      shieldDropped = true;
      finalDamage = Math.max(1, Math.round(rawDamage * 0.5));
    } else if (ability.category === 'esper') {
      // Psionic/Esper abilities completely bypass force shields; shield remains intact
      shieldAbsorbed = false;
      shieldDropped = false;
      finalDamage = rawDamage;
    } else if (ability.category === 'melee' || ability.category === 'projectile') {
      // Shield absorbs full melee or projectile hit completely (100% block) and then drops
      shieldAbsorbed = true;
      shieldDropped = true;
      finalDamage = 0;
    }
  }

  return {
    rawDamage,
    finalDamage,
    isCrit,
    isDisruptor,
    shieldAbsorbed,
    shieldDropped,
  };
}
