/**
 * Config & Data Loader with Dynamic Overrides Support.
 * Pure state transformations with zero browser / DOM dependencies.
 * Loads base JSON datasets and optionally applies caller-supplied deep-merged
 * balance overrides. Filesystem policy belongs to CLI/tooling adapters.
 */

import defaultEquipmentJson from '../data/equipment.json';
import { AbilityDefinition, Combatant, EncounterDefinition, EquipmentItem } from './types';
import { validateAbilities, validateCombatants, validateEncounters } from './validator';
import defaultAbilitiesJson from '../data/abilities.json';
import defaultPartyJson from '../data/party.json';
import defaultEnemiesJson from '../data/enemies.json';
import defaultEncountersJson from '../data/encounters.json';
import defaultRulesJson from '../data/rules.json';

export interface BoostRules {
  entryBurnout: number;
  perTurnAccrual: number;
  perTurnDecay: number;
  chipThreshold: number;
  crashThreshold: number;
  chipDamagePercent: number;
  damageMultiplier: number;
  speedMultiplier: number;
  entryTurnDamagePenalty: number;
  aiDropThreshold: number;
}

export interface DisruptorRules {
  baseCooldownTurns: number;
  shieldMitigationPercent: number;
  targetHpPercent: number;
}

export interface EspRules {
  perTurnRegen: number;
  intermissionRegenPercent: number;
}

export interface InventoryRules {
  medkits: number;
  medkitHealPercent: number;
  revives: number;
  reviveHealPercent: number;
  inCombatHealThreshold: number;
  intermissionHealThreshold: number;
}

export interface ProgressionRules {
  levelCap: number;
  recommendedLevel: number;
  xpThresholds: number[];
  xpByTier: Record<string, number>;
  goldByTier: Record<string, number>;
  medkitCost: number;
  reviveCost: number;
  maxMedkitsPerExpedition: number;
  maxRevivesPerExpedition: number;
  expeditionBonusGold: number;
  expeditionBonusXp: number;
}

export interface GameRules {
  boost: BoostRules;
  disruptor: DisruptorRules;
  esp: EspRules;
  inventory: InventoryRules;
  progression?: ProgressionRules;
}

export interface BalanceOverrides {
  rules?: Partial<{
    boost: Partial<BoostRules>;
    disruptor: Partial<DisruptorRules>;
    esp: Partial<EspRules>;
    inventory: Partial<InventoryRules>;
    progression: Partial<ProgressionRules>;
  }>;
  enemies?: Record<string, Partial<Combatant> | { stats?: Partial<Combatant['stats']> }>;
  party?: Record<string, Partial<Combatant> | { stats?: Partial<Combatant['stats']> }>;
  abilities?: Record<string, Partial<AbilityDefinition>>;
  equipment?: Record<string, Partial<EquipmentItem>>;
  run?: Partial<InventoryRules>;
}

export interface GameData {
  abilities: Record<string, AbilityDefinition>;
  party: Combatant[];
  enemies: Record<string, Combatant>;
  encounters: EncounterDefinition[];
  equipment: Record<string, EquipmentItem>;
  rules: GameRules;
}

/**
 * Pure deep merge for objects and records.
 */
export function deepMerge<T>(target: T, source: unknown): T {
  if (!source || typeof source !== 'object') {
    return target;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    return source.map((item, idx) => {
      if (idx < target.length && typeof target[idx] === 'object' && target[idx] !== null) {
        return deepMerge(target[idx], item);
      }
      return item;
    }) as unknown as T;
  }

  const result = { ...(target as Record<string, unknown>) };
  for (const key of Object.keys(source as Record<string, unknown>)) {
    const sourceVal = (source as Record<string, unknown>)[key];
    const targetVal = result[key];

    if (
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result as T;
}

/**
 * Returns a cloned copy of the default game rules.
 */
export function getDefaultRules(): GameRules {
  return JSON.parse(JSON.stringify(defaultRulesJson));
}

/**
 * Applies balance overrides to base data in a pure, immutable manner.
 */
export function applyOverrides(baseData: GameData, overrides?: BalanceOverrides | null): GameData {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseData;
  }

  let mergedRules = baseData.rules;
  if (overrides.rules) {
    mergedRules = deepMerge(baseData.rules, overrides.rules);
  }
  if (overrides.run) {
    // Map legacy 'run' key to inventory rules if provided
    mergedRules = deepMerge(mergedRules, { inventory: overrides.run });
  }

  const mergedEnemies = { ...baseData.enemies };
  if (overrides.enemies) {
    for (const [id, enemyOverride] of Object.entries(overrides.enemies)) {
      if (mergedEnemies[id]) {
        mergedEnemies[id] = deepMerge(mergedEnemies[id], enemyOverride);
      }
    }
  }

  let mergedParty = baseData.party.map((hero) => ({ ...hero, stats: { ...hero.stats } }));
  if (overrides.party) {
    mergedParty = baseData.party.map((hero) => {
      if (overrides.party && overrides.party[hero.id]) {
        return deepMerge(hero, overrides.party[hero.id]);
      }
      return hero;
    });
  }

  const mergedAbilities = { ...baseData.abilities };
  if (overrides.abilities) {
    for (const [id, abilityOverride] of Object.entries(overrides.abilities)) {
      if (mergedAbilities[id]) {
        mergedAbilities[id] = deepMerge(mergedAbilities[id], abilityOverride);
      }
    }
  }

  const mergedEquipment = { ...baseData.equipment };
  if (overrides.equipment) {
    for (const [id, equipOverride] of Object.entries(overrides.equipment)) {
      if (mergedEquipment[id]) {
        mergedEquipment[id] = deepMerge(mergedEquipment[id], equipOverride);
      }
    }
  }

  return {
    abilities: mergedAbilities,
    party: mergedParty,
    enemies: mergedEnemies,
    encounters: baseData.encounters,
    equipment: mergedEquipment,
    rules: mergedRules,
  };
}

/**
 * Pure loader that builds the full GameData model from repository data and
 * explicitly supplied overrides.
 */
export function loadGameData(customOverrides?: BalanceOverrides | null): GameData {
  const validatedAbilities = validateAbilities(defaultAbilitiesJson);
  const validatedParty = Object.values(validateCombatants(defaultPartyJson, 'party'));
  const validatedEnemies = validateCombatants(defaultEnemiesJson, 'enemies');
  const validatedEncounters = Object.values(validateEncounters(defaultEncountersJson));

  const equipmentMap: Record<string, EquipmentItem> = {};
  for (const item of defaultEquipmentJson as EquipmentItem[]) {
    equipmentMap[item.id] = item;
  }

  const baseData: GameData = {
    abilities: validatedAbilities,
    party: validatedParty,
    enemies: validatedEnemies,
    encounters: validatedEncounters,
    equipment: equipmentMap,
    rules: getDefaultRules(),
  };

  return applyOverrides(baseData, customOverrides);
}
