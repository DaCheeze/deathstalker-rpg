/**
 * Runtime schema validator for JSON content in src/data/.
 * Fails loudly with descriptive error messages when malformed data is encountered.
 */

import {
  AbilityDefinition,
  Combatant,
  EncounterDefinition,
  Faction,
  AbilityCategory,
  AbilityAudioProfile,
  EsperSchool,
  TargetScope,
} from './types';

export class ValidationError extends Error {
  constructor(public readonly path: string, message: string) {
    super(`[Data Validation Error at '${path}']: ${message}`);
    this.name = 'ValidationError';
  }
}

function assertObject(val: unknown, path: string): Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new ValidationError(path, `Expected object, got ${typeof val}`);
  }
  return val as Record<string, unknown>;
}

function assertString(val: unknown, path: string): string {
  if (typeof val !== 'string' || val.trim() === '') {
    throw new ValidationError(path, `Expected non-empty string, got ${JSON.stringify(val)}`);
  }
  return val;
}

function assertNumber(val: unknown, path: string, min = 0): number {
  if (typeof val !== 'number' || Number.isNaN(val) || val < min) {
    throw new ValidationError(path, `Expected number >= ${min}, got ${JSON.stringify(val)}`);
  }
  return val;
}

function assertBoolean(val: unknown, path: string): boolean {
  if (typeof val !== 'boolean') {
    throw new ValidationError(path, `Expected boolean, got ${typeof val}`);
  }
  return val;
}

function assertArray<T>(val: unknown, path: string, itemValidator: (item: unknown, itemPath: string) => T): T[] {
  if (!Array.isArray(val)) {
    throw new ValidationError(path, `Expected array, got ${typeof val}`);
  }
  return val.map((item, idx) => itemValidator(item, `${path}[${idx}]`));
}

const VALID_FACTIONS: Faction[] = ['party', 'empire', 'shub', 'hadenman'];
const VALID_CATEGORIES: AbilityCategory[] = ['melee', 'projectile', 'disruptor', 'esper', 'defense', 'stance'];
const VALID_AUDIO_PROFILES: AbilityAudioProfile[] = [
  'blade',
  'blunt',
  'vibro_blade',
  'twin_vibro_daggers',
  'heavy_smash',
  'concussive_shove',
  'ballistic',
  'ballistic_scatter',
  'particle',
  'plasma',
  'laser',
];
const MELEE_AUDIO_PROFILES: AbilityAudioProfile[] = [
  'blade',
  'blunt',
  'vibro_blade',
  'twin_vibro_daggers',
  'heavy_smash',
  'concussive_shove',
];
const VALID_ESPER_SCHOOLS: EsperSchool[] = ['telepath', 'telekinetic', 'precog'];
const VALID_TARGET_SCOPES: TargetScope[] = ['single_enemy', 'all_enemies', 'single_ally', 'all_allies', 'self', 'none'];

export function validateAbility(data: unknown, path = 'ability'): AbilityDefinition {
  const obj = assertObject(data, path);
  const id = assertString(obj['id'], `${path}.id`);
  const name = assertString(obj['name'], `${path}.name`);
  const categoryStr = assertString(obj['category'], `${path}.category`);
  if (!VALID_CATEGORIES.includes(categoryStr as AbilityCategory)) {
    throw new ValidationError(`${path}.category`, `Invalid category '${categoryStr}'. Valid: ${VALID_CATEGORIES.join(', ')}`);
  }
  const category = categoryStr as AbilityCategory;

  let audioProfile: AbilityAudioProfile | undefined;
  if (obj['audioProfile'] !== undefined) {
    const profileStr = assertString(obj['audioProfile'], `${path}.audioProfile`);
    if (!VALID_AUDIO_PROFILES.includes(profileStr as AbilityAudioProfile)) {
      throw new ValidationError(
        `${path}.audioProfile`,
        `Invalid audio profile '${profileStr}'. Valid: ${VALID_AUDIO_PROFILES.join(', ')}`
      );
    }
    audioProfile = profileStr as AbilityAudioProfile;
  }

  if (category === 'melee') {
    if (!audioProfile || !MELEE_AUDIO_PROFILES.includes(audioProfile)) {
      throw new ValidationError(
        `${path}.audioProfile`,
        `Melee abilities require one of: ${MELEE_AUDIO_PROFILES.join(', ')}`
      );
    }
  } else if (category === 'projectile') {
    const projectileProfiles: AbilityAudioProfile[] = [
      'ballistic',
      'ballistic_scatter',
      'particle',
      'plasma',
      'laser',
    ];
    if (!audioProfile || !projectileProfiles.includes(audioProfile)) {
      throw new ValidationError(
        `${path}.audioProfile`,
        `Projectile abilities require one of: ${projectileProfiles.join(', ')}`
      );
    }
  } else if (audioProfile !== undefined) {
    throw new ValidationError(`${path}.audioProfile`, 'Only melee and projectile abilities use weapon audio profiles');
  }

  let esperSchool: EsperSchool | undefined;
  if (obj['esperSchool'] !== undefined) {
    const schoolStr = assertString(obj['esperSchool'], `${path}.esperSchool`);
    if (!VALID_ESPER_SCHOOLS.includes(schoolStr as EsperSchool)) {
      throw new ValidationError(`${path}.esperSchool`, `Invalid esper school '${schoolStr}'. Valid: ${VALID_ESPER_SCHOOLS.join(', ')}`);
    }
    esperSchool = schoolStr as EsperSchool;
  }

  const espCost = assertNumber(obj['espCost'], `${path}.espCost`, 0);
  const powerMultiplier = assertNumber(obj['powerMultiplier'], `${path}.powerMultiplier`, 0);
  
  const targetScopeStr = assertString(obj['targetScope'], `${path}.targetScope`);
  if (!VALID_TARGET_SCOPES.includes(targetScopeStr as TargetScope)) {
    throw new ValidationError(`${path}.targetScope`, `Invalid targetScope '${targetScopeStr}'. Valid: ${VALID_TARGET_SCOPES.join(', ')}`);
  }
  const targetScope = targetScopeStr as TargetScope;
  const description = assertString(obj['description'], `${path}.description`);

  let displaceTicks: number | undefined;
  if (obj['displaceTicks'] !== undefined) {
    displaceTicks = assertNumber(obj['displaceTicks'], `${path}.displaceTicks`, 0);
  }

  let debuffStats: AbilityDefinition['debuffStats'] | undefined;
  if (obj['debuffStats'] !== undefined) {
    const debuffObj = assertObject(obj['debuffStats'], `${path}.debuffStats`);
    debuffStats = {
      attackMultiplier: debuffObj['attackMultiplier'] !== undefined ? assertNumber(debuffObj['attackMultiplier'], `${path}.debuffStats.attackMultiplier`, 0) : undefined,
      defenseMultiplier: debuffObj['defenseMultiplier'] !== undefined ? assertNumber(debuffObj['defenseMultiplier'], `${path}.debuffStats.defenseMultiplier`, 0) : undefined,
      durationTurns: debuffObj['durationTurns'] !== undefined ? assertNumber(debuffObj['durationTurns'], `${path}.debuffStats.durationTurns`, 1) : undefined,
    };
  }

  return {
    id,
    name,
    category,
    audioProfile,
    esperSchool,
    espCost,
    powerMultiplier,
    targetScope,
    description,
    displaceTicks,
    debuffStats,
  };
}

export function validateAbilities(data: unknown): Record<string, AbilityDefinition> {
  const arr = assertArray(data, 'abilities', validateAbility);
  const result: Record<string, AbilityDefinition> = {};
  for (const item of arr) {
    if (result[item.id]) {
      throw new ValidationError(`abilities`, `Duplicate ability ID '${item.id}'`);
    }
    result[item.id] = item;
  }
  return result;
}

export function validateCombatant(data: unknown, path = 'combatant'): Combatant {
  const obj = assertObject(data, path);
  const id = assertString(obj['id'], `${path}.id`);
  const name = assertString(obj['name'], `${path}.name`);
  const factionStr = assertString(obj['faction'], `${path}.faction`);
  if (!VALID_FACTIONS.includes(factionStr as Faction)) {
    throw new ValidationError(`${path}.faction`, `Invalid faction '${factionStr}'. Valid: ${VALID_FACTIONS.join(', ')}`);
  }
  const faction = factionStr as Faction;
  const role = assertString(obj['role'], `${path}.role`);

  const statsObj = assertObject(obj['stats'], `${path}.stats`);
  const maxHp = assertNumber(statsObj['maxHp'], `${path}.stats.maxHp`, 1);
  const hp = statsObj['hp'] !== undefined ? assertNumber(statsObj['hp'], `${path}.stats.hp`, 0) : maxHp;
  const maxEsp = assertNumber(statsObj['maxEsp'], `${path}.stats.maxEsp`, 0);
  const esp = statsObj['esp'] !== undefined ? assertNumber(statsObj['esp'], `${path}.stats.esp`, 0) : maxEsp;
  const attack = assertNumber(statsObj['attack'], `${path}.stats.attack`, 0);
  const defense = assertNumber(statsObj['defense'], `${path}.stats.defense`, 0);
  const speed = assertNumber(statsObj['speed'], `${path}.stats.speed`, 0);

  const abilityIds = assertArray(obj['abilityIds'], `${path}.abilityIds`, (item, itemPath) => assertString(item, itemPath));

  return {
    id,
    name,
    faction,
    role,
    stats: {
      maxHp,
      hp,
      maxEsp,
      esp,
      attack,
      defense,
      speed,
    },
    canBoost: obj['canBoost'] !== undefined ? assertBoolean(obj['canBoost'], `${path}.canBoost`) : false,
    disruptorCooldown: obj['disruptorCooldown'] !== undefined ? assertNumber(obj['disruptorCooldown'], `${path}.disruptorCooldown`, 0) : 0,
    isBoosting: obj['isBoosting'] !== undefined ? assertBoolean(obj['isBoosting'], `${path}.isBoosting`) : false,
    burnout: obj['burnout'] !== undefined ? assertNumber(obj['burnout'], `${path}.burnout`, 0) : 0,
    crashTurns: obj['crashTurns'] !== undefined ? assertNumber(obj['crashTurns'], `${path}.crashTurns`, 0) : 0,
    turnsSpentBoosting: obj['turnsSpentBoosting'] !== undefined ? assertNumber(obj['turnsSpentBoosting'], `${path}.turnsSpentBoosting`, 0) : 0,
    hasForceShield: obj['hasForceShield'] !== undefined ? assertBoolean(obj['hasForceShield'], `${path}.hasForceShield`) : false,
    stunnedTurns: obj['stunnedTurns'] !== undefined ? assertNumber(obj['stunnedTurns'], `${path}.stunnedTurns`, 0) : 0,
    disruptorReady: obj['disruptorReady'] !== undefined
      ? assertBoolean(obj['disruptorReady'], `${path}.disruptorReady`)
      : undefined,
    abilityIds,
  };
}

export function validateCombatants(data: unknown, path = 'combatants'): Record<string, Combatant> {
  const arr = assertArray(data, path, validateCombatant);
  const result: Record<string, Combatant> = {};
  for (const item of arr) {
    if (result[item.id]) {
      throw new ValidationError(path, `Duplicate combatant ID '${item.id}'`);
    }
    result[item.id] = item;
  }
  return result;
}

export function validateEncounter(data: unknown, path = 'encounter'): EncounterDefinition {
  const obj = assertObject(data, path);
  const id = assertString(obj['id'], `${path}.id`);
  const name = assertString(obj['name'], `${path}.name`);
  const rawTier = assertString(obj['tier'], `${path}.tier`);
  if (!['skirmish', 'standard', 'elite', 'boss'].includes(rawTier)) {
    throw new ValidationError(`${path}.tier`, `Invalid encounter tier '${rawTier}'. Must be 'skirmish' | 'standard' | 'elite' | 'boss'`);
  }
  const tier = rawTier as EncounterDefinition['tier'];
  const description = assertString(obj['description'], `${path}.description`);
  const enemyIds = assertArray(obj['enemyIds'], `${path}.enemyIds`, (item, itemPath) => assertString(item, itemPath));
  if (enemyIds.length === 0) {
    throw new ValidationError(`${path}.enemyIds`, `Encounter must have at least 1 enemy`);
  }
  if (enemyIds.length > 6) {
    throw new ValidationError(`${path}.enemyIds`, `Encounter cannot have more than 6 enemies in this vertical slice`);
  }

  let rewards: EncounterDefinition['rewards'] | undefined;
  if (obj['rewards'] !== undefined) {
    const rObj = assertObject(obj['rewards'], `${path}.rewards`);
    rewards = {
      xp: assertNumber(rObj['xp'], `${path}.rewards.xp`, 0),
      gold: assertNumber(rObj['gold'], `${path}.rewards.gold`, 0),
    };
  }

  let grade: EncounterDefinition['grade'] | undefined;
  if (obj['grade'] !== undefined) {
    const gObj = assertObject(obj['grade'], `${path}.grade`);
    grade = {
      multiplyWash: assertString(gObj['multiplyWash'], `${path}.grade.multiplyWash`),
      screenLift: assertString(gObj['screenLift'], `${path}.grade.screenLift`),
      vignetteStrength: assertNumber(gObj['vignetteStrength'], `${path}.grade.vignetteStrength`, 0),
      particleType: gObj['particleType'] !== undefined ? assertString(gObj['particleType'], `${path}.grade.particleType`) as 'dust' | 'sparks' | 'embers' | 'debris' : undefined,
      particleColor: gObj['particleColor'] !== undefined ? assertString(gObj['particleColor'], `${path}.grade.particleColor`) : undefined,
      particleDensity: gObj['particleDensity'] !== undefined ? assertNumber(gObj['particleDensity'], `${path}.grade.particleDensity`, 0) : undefined,
    };
  }

  let battleMode: EncounterDefinition['battleMode'] | undefined;
  if (obj['battleMode'] !== undefined) {
    const rawMode = assertString(obj['battleMode'], `${path}.battleMode`);
    if (rawMode !== 'legacy' && rawMode !== 'range_band_prototype') {
      throw new ValidationError(
        `${path}.battleMode`,
        `Invalid battle mode '${rawMode}'. Must be 'legacy' | 'range_band_prototype'`
      );
    }
    battleMode = rawMode;
  }

  const disruptorPowerMultiplier = obj['disruptorPowerMultiplier'] !== undefined
    ? assertNumber(obj['disruptorPowerMultiplier'], `${path}.disruptorPowerMultiplier`, 0.1)
    : undefined;

  return {
    id,
    name,
    tier,
    description,
    enemyIds,
    rewards,
    grade,
    battleMode,
    disruptorPowerMultiplier,
  };
}

export function validateEncounters(data: unknown): Record<string, EncounterDefinition> {
  const arr = assertArray(data, 'encounters', validateEncounter);
  const result: Record<string, EncounterDefinition> = {};
  for (const item of arr) {
    if (result[item.id]) {
      throw new ValidationError('encounters', `Duplicate encounter ID '${item.id}'`);
    }
    result[item.id] = item;
  }
  return result;
}
