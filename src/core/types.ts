/**
 * Core domain types and discriminated unions for the turn-based JRPG combat system.
 * Strict pure definitions with zero browser/DOM dependencies.
 */

export type Faction = 'party' | 'empire' | 'shub' | 'hadenman';

export type AbilityCategory = 'melee' | 'projectile' | 'disruptor' | 'esper' | 'defense' | 'stance';

export type EsperSchool = 'telepath' | 'telekinetic' | 'precog';

export type TargetScope =
  | 'single_enemy'
  | 'all_enemies'
  | 'single_ally'
  | 'all_allies'
  | 'self'
  | 'none';

export interface CombatStats {
  maxHp: number;
  hp: number;
  maxEsp: number;
  esp: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface AbilityDefinition {
  id: string;
  name: string;
  category: AbilityCategory;
  esperSchool?: EsperSchool;
  espCost: number;
  powerMultiplier: number;
  critBonus?: number;     // Extra critical strike chance
  targetScope: TargetScope;
  description: string;
  displaceTicks?: number; // For turn queue displacement
  debuffStats?: {
    attackMultiplier?: number;
    defenseMultiplier?: number;
    durationTurns?: number;
  };
}

export interface Combatant {
  id: string;
  name: string;
  displayName?: string;      // Disambiguated name for display (e.g. "Drone A", "Drone B")
  accentColor?: string;      // Unique accent color shared across card, queue, and targeting cursor
  faction: Faction;
  role: string;
  stats: CombatStats;
  canBoost: boolean;         // True only for Captain
  disruptorCooldown: number; // 0 = ready; 6 turns cooldown once fired
  isBoosting: boolean;       // Combat drug stance (+50% damage, +30% speed)
  enteredBoostThisTurn?: boolean; // True on the exact turn boost is entered (50% ramp-up penalty)
  turnsSpentBoosting?: number;    // Turns spent in current boost state (used for crash duration formula)
  crashTurns: number;        // Number of recovery turns after exiting boost (cannot attack/abilities/disruptor)
  burnout: number;           // Accrues +1 per turn boosting; >=5 chip damage; >=8 forced exit + crash
  hasForceShield: boolean;   // Blocks next melee/projectile completely then drops
  stunnedTurns: number;      // Number of remaining turns skipped due to stun
  abilityIds: string[];      // Configured ability definitions
  statModifiers?: {
    attackMultiplier?: number;
    defenseMultiplier?: number;
    turnsRemaining: number;
  }[];
}

export interface TurnQueueEntry {
  queueId: string;           // Unique identifier for the turn slot
  actorId: string;           // Combatant whose turn this is
  predictedTick: number;     // Simulation tick or delay at which turn occurs
}

export interface TurnQueueState {
  entries: TurnQueueEntry[]; // Upcoming ~8-12 turns
  accumulators: Record<string, number>; // Accumulated speed points for next turns
}

export interface RunInventory {
  medkits: number;
  revives: number;
}

export type BattleAction =
  | { type: 'Attack'; actorId: string; targetId: string; abilityId: string }
  | { type: 'Disruptor'; actorId: string; targetId: string }
  | { type: 'RaiseShield'; actorId: string }
  | { type: 'ToggleBoost'; actorId: string; enable: boolean }
  | { type: 'EsperAbility'; actorId: string; targetId?: string; abilityId: string }
  | { type: 'UseMedkit'; actorId: string; targetId: string }
  | { type: 'UseRevive'; actorId: string; targetId: string }
  | { type: 'PassTurn'; actorId: string };

export type BattleEvent =
  | {
      type: 'DAMAGE_DEALT';
      actorId: string;
      targetId: string;
      abilityName: string;
      damage: number;
      isCrit: boolean;
      isDisruptor: boolean;
      shieldAbsorbed: boolean;
      targetKilled: boolean;
    }
  | {
      type: 'SHIELD_RAISED';
      actorId: string;
    }
  | {
      type: 'BOOST_CHANGED';
      actorId: string;
      isBoosting: boolean;
      burnout: number;
    }
  | {
      type: 'BOOST_CRASHED';
      actorId: string;
      crashTurns: number;
    }
  | {
      type: 'BURNOUT_CHIP_DAMAGE';
      actorId: string;
      damage: number;
      killed: boolean;
    }
  | {
      type: 'BURNOUT_STUNNED';
      actorId: string;
    }
  | {
      type: 'ITEM_USED';
      actorId: string;
      targetId: string;
      item: 'medkit' | 'revive';
      amountHealed: number;
    }
  | {
      type: 'COMBATANT_REVIVED';
      targetId: string;
      hpRestored: number;
    }
  | {
      type: 'TURN_DISPLACED';
      targetId: string;
      ticks: number;
    }
  | {
      type: 'STATUS_APPLIED';
      targetId: string;
      description: string;
    }
  | {
      type: 'DISRUPTOR_COOLDOWN_TICK';
      actorId: string;
      remaining: number;
    }
  | {
      type: 'TURN_STARTED';
      actorId: string;
      turnNumber: number;
    }
  | {
      type: 'TURN_ENDED';
      actorId: string;
    }
  | {
      type: 'BATTLE_ENDED';
      outcome: 'victory' | 'defeat';
    };

export interface BattleLogEntry {
  turnNumber: number;
  message: string;
  eventType: BattleEvent['type'];
}

export interface StatGrowth {
  hpPerLevel: number;
  espPerLevel: number;
  attackPerLevel: number;
  defensePerLevel: number;
  speedPerLevel: number;
}

export type EquipmentSlot = 'weapon' | 'accessory';

export interface EquipmentModifiers {
  attackBonus?: number;
  defenseBonus?: number;
  speedBonus?: number;
  maxHpBonus?: number;
  maxEspBonus?: number;
  critBonus?: number;
  disruptorCooldownReduction?: number; // e.g. -1 or -2 cooldown turns
  shieldCharges?: number;              // blocks N attacks before dropping
  espRegenBonus?: number;              // extra ESP regen per turn
  chipThresholdBonus?: number;         // raises chip damage threshold (e.g. +1)
  burnoutAccrualReduction?: number;    // reduces burnout accrued
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: EquipmentSlot;
  tier: number;
  cost: number;
  description: string;
  allowedRoles?: string[];             // If defined, only these roles can equip (e.g. Captain only for Boost Regulator)
  modifiers: EquipmentModifiers;
}

export interface PartyMemberDefinition {
  id: string;
  name: string;
  faction: Faction;
  role: string;
  stats: CombatStats;
  growth: StatGrowth;
  canBoost: boolean;
  disruptorCooldown: number;
  isBoosting: boolean;
  burnout: number;
  hasForceShield: boolean;
  stunnedTurns: number;
  abilityIds: string[];
}

export interface CampaignState {
  campaignId: string;
  partyLevel: number;
  xp: number;
  gold: number;
  reserveInventory: RunInventory;
  ownedEquipment: string[]; // List of equipment IDs owned in inventory
  equipped: Record<string, { weaponId?: string; accessoryId?: string }>; // character ID -> equipped item IDs
  completedExpeditions: string[];
}

export type EncounterTier = 'skirmish' | 'standard' | 'elite' | 'boss';

export interface EncounterReward {
  xp: number;
  gold: number;
}

export interface EncounterGradeConfig {
  multiplyWash: string;
  screenLift: string;
  vignetteStrength: number;
  particleType?: 'dust' | 'sparks' | 'embers' | 'debris';
  particleColor?: string;
  particleDensity?: number;
}

export interface EncounterEnvironmentConfig {
  type: 'empire_hall' | 'shub_facility' | 'hadenman_derelict' | string;
  lightSourceX: number;
  lightSourceY: number;
  lightColor: string;
  floorTint: string;
  hazeColor: string;
}

export interface EncounterDefinition {
  id: string;
  name: string;
  tier: EncounterTier;
  description: string;
  enemyIds: string[];
  rewards?: EncounterReward;
  grade?: EncounterGradeConfig;
  environment?: EncounterEnvironmentConfig;
}

export interface ExpeditionDefinition {
  id: string;
  name: string;
  description: string;
  recommendedLevel: number;
  encounters: EncounterDefinition[];
  completionBonusGold: number;
  completionBonusXp: number;
}

export interface BattleState {
  encounterId: string;
  seed?: number;
  turnNumber: number;
  activeActorId: string;
  turnQueue: TurnQueueState;
  combatants: Record<string, Combatant>;
  partyIds: string[];
  enemyIds: string[];
  abilities: Record<string, AbilityDefinition>;
  inventory: RunInventory;
  rules?: import('./configLoader').GameRules;
  status: 'in_progress' | 'victory' | 'defeat';
  recentEvents: BattleEvent[];
  log: BattleLogEntry[];
}

export interface ExpeditionState {
  runId: string;
  seed: number;
  partyLevel: number;
  expeditionId?: string;
  encounterSequence: EncounterDefinition[];
  currentEncounterIndex: number;
  party: Record<string, Combatant>;
  partyIds: string[];
  inventory: RunInventory;
  status: 'in_progress' | 'completed' | 'failed';
  history: {
    encounterId: string;
    encounterName: string;
    encounterTier: EncounterTier;
    outcome: 'victory' | 'defeat';
    totalActions: number;
    partyEndingHp: Record<string, number>;
  }[];
}

/**
 * Backwards-compatible alias for ExpeditionState
 */
export type RunState = ExpeditionState;

export interface RunTelemetry {
  runId: string;
  seed: number;
  completed: boolean;
  fightsSurvived: number;
  endingEncounterIndex: number;
  endingEncounterId: string;
  partyHpEnteringFinalPct: number;
  partyHpEnteringFinal: number;
  partyMaxHpTotal: number;
  medkitsAtFinal: number;
  revivesAtFinal: number;
  disruptorCoolingStarts: number;
  totalEncounterStarts: number;
}

