/**
 * Versioned, presentation-only bridge from the authoritative TypeScript battle
 * core to renderer clients. This module is pure and has no DOM or Godot runtime
 * dependencies.
 */

import type {
  AbilityCategory,
  BattleAction,
  BattleEvent,
  BattleState,
  EncounterDefinition,
  EncounterTier,
  Faction,
  RangeBand,
} from '../core/types';
import {
  resolveCombatAudioCue,
  resolveCombatEventAudioCues,
  type CombatAudioCue,
} from '../audio/combatAudioCue';
import { FEEDBACK_CONFIG } from '../render/feedbackConfig';

export const PRESENTATION_BRIDGE_FORMAT = 'deathstalker-godot-presentation-bridge';
export const PRESENTATION_BRIDGE_SCHEMA_VERSION = 1;
export const PRESENTATION_BRIDGE_GENERATOR = 'scripts/export-godot-presentation.ts';

export type PresentationSide = 'party' | 'enemy';
export type PresentationStatus = BattleState['status'];

export type PresentationActionType =
  | 'attack'
  | 'disruptor'
  | 'advance'
  | 'raise_shield'
  | 'toggle_boost'
  | 'esper_ability'
  | 'use_medkit'
  | 'use_revive'
  | 'pass_turn';

export type PresentationEventType =
  | 'damage'
  | 'shield_raised'
  | 'boost_changed'
  | 'boost_crashed'
  | 'burnout_damage'
  | 'burnout_stunned'
  | 'item_used'
  | 'revived'
  | 'turn_displaced'
  | 'status_applied'
  | 'disruptor_cooldown'
  | 'range_changed'
  | 'disruptor_interrupt'
  | 'turn_started'
  | 'turn_ended'
  | 'battle_ended';

export interface PresentationDisruptorStateV1 {
  ready: boolean;
  cooldownTurns: number;
}

export interface PresentationRangeStateV1 {
  band: RangeBand | null;
  targetId: string | null;
}

export interface PresentationCombatantV1 {
  id: string;
  displayName: string;
  side: PresentationSide;
  faction: Faction;
  role: string;
  slot: number;
  hp: number;
  maxHp: number;
  esp: number;
  maxEsp: number;
  alive: boolean;
  accentColor: string;
  isBoosting: boolean;
  burnout: number;
  crashTurns: number;
  hasForceShield: boolean;
  stunnedTurns: number;
  disruptor: PresentationDisruptorStateV1;
  range: PresentationRangeStateV1;
}

export interface PresentationQueueEntryV1 {
  order: number;
  actorId: string;
  predictedTick: number;
}

/** A normalized cue. All keys are present so JSON never relies on `undefined`. */
export interface PresentationEventV1 {
  type: PresentationEventType;
  actorId: string | null;
  targetId: string | null;
  label: string;
  amount: number | null;
  critical: boolean;
  disruptor: boolean;
  shieldAbsorbed: boolean;
  lethal: boolean;
  fromBand: RangeBand | null;
  toBand: RangeBand | null;
  audioCues: CombatAudioCue[];
}

export interface PresentationBattleStateV1 {
  encounterId: string;
  battleMode: NonNullable<BattleState['battleMode']>;
  turnNumber: number;
  activeActorId: string;
  status: PresentationStatus;
  inventory: {
    medkits: number;
    revives: number;
  };
  combatants: PresentationCombatantV1[];
  turnQueue: PresentationQueueEntryV1[];
  events: PresentationEventV1[];
}

export interface PresentationActionV1 {
  type: PresentationActionType;
  actorId: string;
  targetId: string | null;
  abilityId: string | null;
  abilityName: string | null;
  abilityCategory: AbilityCategory | null;
  boostEnabled: boolean | null;
  audioCue: CombatAudioCue | null;
  timing: PresentationActionTimingV1;
}

export interface PresentationActionTimingV1 {
  durationSeconds: number;
  visualContactSeconds: number | null;
  beamStartSeconds: number | null;
}

export interface PresentationFrameV1 {
  index: number;
  atSeconds: number;
  action: PresentationActionV1 | null;
  state: PresentationBattleStateV1;
}

export interface PresentationEncounterV1 {
  id: string;
  name: string;
  tier: EncounterTier;
  environment: {
    type: string;
    lightSourceX: number;
    lightSourceY: number;
    lightColor: string;
    floorTint: string;
    hazeColor: string;
    stoneColor: string;
    metalColor: string;
    shadowColor: string;
    accentColor: string;
  };
}

export interface PresentationBridgeDocumentV1 {
  format: typeof PRESENTATION_BRIDGE_FORMAT;
  schemaVersion: typeof PRESENTATION_BRIDGE_SCHEMA_VERSION;
  source: {
    authoritativeRuntime: 'typescript-core';
    generator: typeof PRESENTATION_BRIDGE_GENERATOR;
    fixtureId: string;
    seed: number;
  };
  encounter: PresentationEncounterV1;
  timing: {
    frameStepSeconds: number;
    endHoldSeconds: number;
    durationSeconds: number;
  };
  frames: PresentationFrameV1[];
}

export interface CreatePresentationBridgeOptions {
  fixtureId: string;
  seed: number;
  encounter: EncounterDefinition;
  states: readonly BattleState[];
  actions: readonly BattleAction[];
  frameStepSeconds: number;
  endHoldSeconds: number;
}

function finiteNumber(value: number, path: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${path} must be finite; received ${value}`);
  }
  return value;
}

function roundMilliseconds(value: number): number {
  return Number(value.toFixed(3));
}

function normalizedPositiveMilliseconds(value: number, path: string): number {
  const normalized = roundMilliseconds(value);
  if (normalized <= 0) {
    throw new Error(`${path} must remain positive at millisecond precision`);
  }
  return normalized;
}

function baseEvent(type: PresentationEventType): PresentationEventV1 {
  return {
    type,
    actorId: null,
    targetId: null,
    label: '',
    amount: null,
    critical: false,
    disruptor: false,
    shieldAbsorbed: false,
    lethal: false,
    fromBand: null,
    toBand: null,
    audioCues: [],
  };
}

function serializeEventWithoutAudio(event: BattleEvent): PresentationEventV1 {
  switch (event.type) {
    case 'DAMAGE_DEALT':
      return {
        ...baseEvent('damage'),
        actorId: event.actorId,
        targetId: event.targetId,
        label: event.abilityName,
        amount: event.damage,
        critical: event.isCrit,
        disruptor: event.isDisruptor,
        shieldAbsorbed: event.shieldAbsorbed,
        lethal: event.targetKilled,
      };
    case 'SHIELD_RAISED':
      return { ...baseEvent('shield_raised'), actorId: event.actorId, label: 'Force Shield' };
    case 'BOOST_CHANGED':
      return {
        ...baseEvent('boost_changed'),
        actorId: event.actorId,
        label: event.isBoosting ? 'Boost enabled' : 'Boost disabled',
        amount: event.burnout,
      };
    case 'BOOST_CRASHED':
      return {
        ...baseEvent('boost_crashed'),
        actorId: event.actorId,
        label: 'Boost crash',
        amount: event.crashTurns,
      };
    case 'BURNOUT_CHIP_DAMAGE':
      return {
        ...baseEvent('burnout_damage'),
        actorId: event.actorId,
        label: 'Burnout',
        amount: event.damage,
        lethal: event.killed,
      };
    case 'BURNOUT_STUNNED':
      return { ...baseEvent('burnout_stunned'), actorId: event.actorId, label: 'Burnout stun' };
    case 'ITEM_USED':
      return {
        ...baseEvent('item_used'),
        actorId: event.actorId,
        targetId: event.targetId,
        label: event.item,
        amount: event.amountHealed,
      };
    case 'COMBATANT_REVIVED':
      return {
        ...baseEvent('revived'),
        targetId: event.targetId,
        label: 'Revived',
        amount: event.hpRestored,
      };
    case 'TURN_DISPLACED':
      return {
        ...baseEvent('turn_displaced'),
        targetId: event.targetId,
        label: 'Queue displaced',
        amount: event.ticks,
      };
    case 'STATUS_APPLIED':
      return {
        ...baseEvent('status_applied'),
        targetId: event.targetId,
        label: event.description,
      };
    case 'DISRUPTOR_COOLDOWN_TICK':
      return {
        ...baseEvent('disruptor_cooldown'),
        actorId: event.actorId,
        label: 'Disruptor cooldown',
        amount: event.remaining,
      };
    case 'RANGE_CHANGED':
      return {
        ...baseEvent('range_changed'),
        actorId: event.actorId,
        targetId: event.engagedTargetId ?? null,
        label: 'Range changed',
        fromBand: event.from,
        toBand: event.to,
      };
    case 'DISRUPTOR_INTERRUPT':
      return {
        ...baseEvent('disruptor_interrupt'),
        actorId: event.actorId,
        targetId: event.targetId,
        label: 'Held disruptor interrupt',
        disruptor: true,
      };
    case 'TURN_STARTED':
      return {
        ...baseEvent('turn_started'),
        actorId: event.actorId,
        label: 'Turn started',
        amount: event.turnNumber,
      };
    case 'TURN_ENDED':
      return { ...baseEvent('turn_ended'), actorId: event.actorId, label: 'Turn ended' };
    case 'BATTLE_ENDED':
      return { ...baseEvent('battle_ended'), label: event.outcome };
  }
}

function serializeEvent(event: BattleEvent): PresentationEventV1 {
  return {
    ...serializeEventWithoutAudio(event),
    audioCues: resolveCombatEventAudioCues(event),
  };
}

function serializeCombatant(
  state: BattleState,
  id: string,
  side: PresentationSide,
  slot: number
): PresentationCombatantV1 {
  const combatant = state.combatants[id];
  if (!combatant) {
    throw new Error(`BattleState references missing ${side} combatant '${id}'`);
  }

  return {
    id: combatant.id,
    displayName: combatant.displayName ?? combatant.name,
    side,
    faction: combatant.faction,
    role: combatant.role,
    slot,
    hp: finiteNumber(combatant.stats.hp, `${id}.stats.hp`),
    maxHp: finiteNumber(combatant.stats.maxHp, `${id}.stats.maxHp`),
    esp: finiteNumber(combatant.stats.esp, `${id}.stats.esp`),
    maxEsp: finiteNumber(combatant.stats.maxEsp, `${id}.stats.maxEsp`),
    alive: combatant.stats.hp > 0,
    accentColor: combatant.accentColor ?? (side === 'party' ? '#38bdf8' : '#f43f5e'),
    isBoosting: combatant.isBoosting,
    burnout: finiteNumber(combatant.burnout, `${id}.burnout`),
    crashTurns: finiteNumber(combatant.crashTurns, `${id}.crashTurns`),
    hasForceShield: combatant.hasForceShield,
    stunnedTurns: finiteNumber(combatant.stunnedTurns, `${id}.stunnedTurns`),
    disruptor: {
      ready:
        state.battleMode === 'range_band_prototype'
          ? combatant.disruptorReady === true
          : combatant.disruptorCooldown <= 0,
      cooldownTurns: finiteNumber(combatant.disruptorCooldown, `${id}.disruptorCooldown`),
    },
    range: {
      band: combatant.rangeBand ?? null,
      targetId: combatant.engagedTargetId ?? null,
    },
  };
}

/**
 * Serializes one authoritative core snapshot. The result intentionally excludes
 * abilities, attack/defense formulas, rules, accumulators, logs, and RNG state.
 */
export function serializeBattleState(state: BattleState): PresentationBattleStateV1 {
  const combatants = [
    ...state.partyIds.map((id, slot) => serializeCombatant(state, id, 'party', slot)),
    ...state.enemyIds.map((id, slot) => serializeCombatant(state, id, 'enemy', slot)),
  ];

  return {
    encounterId: state.encounterId,
    battleMode: state.battleMode ?? 'legacy',
    turnNumber: state.turnNumber,
    activeActorId: state.activeActorId,
    status: state.status,
    inventory: {
      medkits: state.inventory.medkits,
      revives: state.inventory.revives,
    },
    combatants,
    turnQueue: state.turnQueue.entries.map((entry, order) => ({
      order,
      actorId: entry.actorId,
      predictedTick: finiteNumber(entry.predictedTick, `turnQueue.entries[${order}].predictedTick`),
    })),
    events: state.recentEvents.map(serializeEvent),
  };
}

export function serializeBattleAction(
  stateBefore: BattleState,
  action: BattleAction,
  stateAfter?: BattleState
): PresentationActionV1 {
  if (action.type === 'Advance' && stateAfter) {
    const interrupt = stateAfter.recentEvents.find(
      (event) => event.type === 'DISRUPTOR_INTERRUPT' && event.targetId === action.actorId
    );
    if (interrupt?.type === 'DISRUPTOR_INTERRUPT') {
      const damage = stateAfter.recentEvents.find(
        (event) =>
          event.type === 'DAMAGE_DEALT' &&
          event.actorId === interrupt.actorId &&
          event.targetId === interrupt.targetId &&
          event.isDisruptor
      );
      if (damage?.type !== 'DAMAGE_DEALT') {
        throw new Error('Held disruptor interrupt is missing its authoritative damage event');
      }
      const audioCue = resolveCombatEventAudioCues(interrupt)[0];
      if (audioCue !== 'disruptor') {
        throw new Error('Held disruptor interrupt did not resolve the shared disruptor audio cue');
      }
      return {
        type: 'disruptor',
        actorId: interrupt.actorId,
        targetId: interrupt.targetId,
        abilityId: null,
        abilityName: damage.abilityName,
        abilityCategory: 'disruptor',
        boostEnabled: null,
        audioCue,
        timing: resolveDisruptorTiming(true),
      };
    }
  }

  let type: PresentationActionType;
  let targetId: string | null = null;
  let abilityId: string | null = null;
  let abilityName: string | null = null;
  let abilityCategory: AbilityCategory | null = null;
  let boostEnabled: boolean | null = null;

  switch (action.type) {
    case 'Attack':
    case 'EsperAbility': {
      const ability = stateBefore.abilities[action.abilityId];
      if (!ability) {
        throw new Error(`Action references missing ability '${action.abilityId}'`);
      }
      type = action.type === 'Attack' ? 'attack' : 'esper_ability';
      targetId = action.targetId ?? null;
      abilityId = ability.id;
      abilityName = ability.name;
      abilityCategory = ability.category;
      break;
    }
    case 'Disruptor':
      type = 'disruptor';
      targetId = action.targetId;
      abilityCategory = 'disruptor';
      break;
    case 'Advance':
      type = 'advance';
      targetId = action.targetId ?? null;
      break;
    case 'RaiseShield':
      type = 'raise_shield';
      break;
    case 'ToggleBoost':
      type = 'toggle_boost';
      boostEnabled = action.enable;
      break;
    case 'UseMedkit':
      type = 'use_medkit';
      targetId = action.targetId;
      break;
    case 'UseRevive':
      type = 'use_revive';
      targetId = action.targetId;
      break;
    case 'PassTurn':
      type = 'pass_turn';
      break;
  }

  return {
    type,
    actorId: action.actorId,
    targetId,
    abilityId,
    abilityName,
    abilityCategory,
    boostEnabled,
    audioCue: resolveCombatAudioCue(
      action,
      action.type === 'Attack' || action.type === 'EsperAbility'
        ? stateBefore.abilities[action.abilityId]
        : undefined
    ),
    timing: resolvePresentationActionTiming(stateBefore, action),
  };
}

function serializeTransitionState(
  state: BattleState,
  action: PresentationActionV1 | null
): PresentationBattleStateV1 {
  const serialized = serializeBattleState(state);
  if (action?.type !== 'disruptor') return serialized;

  const promotedInterrupt = serialized.events.find(
    (event) =>
      event.type === 'disruptor_interrupt' &&
      event.actorId === action.actorId &&
      event.targetId === action.targetId
  );
  if (!promotedInterrupt || promotedInterrupt.audioCues.length === 0) return serialized;

  return {
    ...serialized,
    events: serialized.events.map((event) =>
      event === promotedInterrupt ? { ...event, audioCues: [] } : event
    ),
  };
}

function resolvePresentationActionTiming(
  stateBefore: BattleState,
  action: BattleAction
): PresentationActionTimingV1 {
  const seconds = (milliseconds: number): number => roundMilliseconds(milliseconds / 1000);
  const generic: PresentationActionTimingV1 = {
    durationSeconds: 0.3,
    visualContactSeconds: null,
    beamStartSeconds: null,
  };

  if (action.type === 'Disruptor') {
    return resolveDisruptorTiming(stateBefore.battleMode === 'range_band_prototype');
  }

  if (action.type === 'EsperAbility') {
    const duration = seconds(FEEDBACK_CONFIG.psionicRippleDurationMs);
    return {
      durationSeconds: duration,
      visualContactSeconds: duration,
      beamStartSeconds: null,
    };
  }

  if (action.type !== 'Attack') {
    return generic;
  }

  const ability = stateBefore.abilities[action.abilityId];
  if (!ability) {
    throw new Error(`Action references missing ability '${action.abilityId}'`);
  }
  if (ability.category === 'melee') {
    const duration = seconds(FEEDBACK_CONFIG.lungeDurationMs);
    return {
      durationSeconds: duration,
      visualContactSeconds: roundMilliseconds(duration / 2),
      beamStartSeconds: null,
    };
  }
  if (ability.category === 'projectile') {
    const duration = seconds(
      action.abilityId === 'scatter_shot'
        ? FEEDBACK_CONFIG.scatterProjectileTravelDurationMs
        : FEEDBACK_CONFIG.projectileTravelDurationMs
    );
    return {
      durationSeconds: duration,
      visualContactSeconds: duration,
      beamStartSeconds: null,
    };
  }
  return generic;
}

function resolveDisruptorTiming(prototype: boolean): PresentationActionTimingV1 {
  const charge = prototype
    ? FEEDBACK_CONFIG.prototypeDisruptorChargeDurationMs
    : FEEDBACK_CONFIG.disruptorChargeDurationMs;
  const beam = prototype
    ? FEEDBACK_CONFIG.prototypeDisruptorBeamDurationMs
    : FEEDBACK_CONFIG.disruptorBeamDurationMs;
  const impact = prototype
    ? FEEDBACK_CONFIG.prototypeDisruptorImpactDurationMs
    : FEEDBACK_CONFIG.disruptorImpactDurationMs;
  return {
    durationSeconds: roundMilliseconds((charge + beam + impact) / 1000),
    visualContactSeconds: roundMilliseconds((charge + beam) / 1000),
    beamStartSeconds: roundMilliseconds(charge / 1000),
  };
}

/** Builds a deterministic v1 replay document from already-calculated core states. */
export function createPresentationBridgeDocument(
  options: CreatePresentationBridgeOptions
): PresentationBridgeDocumentV1 {
  if (options.fixtureId.trim().length === 0) {
    throw new Error('fixtureId must not be empty');
  }
  if (!Number.isSafeInteger(options.seed)) {
    throw new Error(`seed must be a safe integer; received ${options.seed}`);
  }
  if (options.states.length === 0) {
    throw new Error('Presentation bridge requires at least one BattleState');
  }
  if (options.actions.length !== options.states.length - 1) {
    throw new Error(
      `Presentation bridge requires one action per state transition; received ${options.actions.length} actions and ${options.states.length} states`
    );
  }
  if (!Number.isFinite(options.frameStepSeconds) || options.frameStepSeconds <= 0) {
    throw new Error('frameStepSeconds must be positive');
  }
  if (!Number.isFinite(options.endHoldSeconds) || options.endHoldSeconds < 0) {
    throw new Error('endHoldSeconds cannot be negative');
  }

  for (const [index, state] of options.states.entries()) {
    if (state.encounterId !== options.encounter.id) {
      throw new Error(
        `State ${index} belongs to encounter '${state.encounterId}', expected '${options.encounter.id}'`
      );
    }
  }

  const environment = options.encounter.environment;
  const frameStepSeconds = normalizedPositiveMilliseconds(
    options.frameStepSeconds,
    'frameStepSeconds'
  );
  const endHoldSeconds = roundMilliseconds(options.endHoldSeconds);
  const frames = options.states.map((state, index): PresentationFrameV1 => {
    const action =
      index === 0
        ? null
        : serializeBattleAction(
            options.states[index - 1] as BattleState,
            options.actions[index - 1] as BattleAction,
            state
          );
    return {
      index,
      atSeconds: roundMilliseconds(index * frameStepSeconds),
      action,
      state: serializeTransitionState(state, action),
    };
  });
  for (const frame of frames) {
    if (frame.action && frame.action.timing.durationSeconds > frameStepSeconds) {
      throw new Error(
        `Frame ${frame.index} action duration ${frame.action.timing.durationSeconds}s exceeds frameStepSeconds ${frameStepSeconds}s`
      );
    }
  }
  const lastFrame = frames[frames.length - 1];
  if (!lastFrame) {
    throw new Error('Presentation bridge frame creation failed');
  }
  if (lastFrame.action && lastFrame.action.timing.durationSeconds > endHoldSeconds) {
    throw new Error(
      `Final action duration ${lastFrame.action.timing.durationSeconds}s exceeds endHoldSeconds ${endHoldSeconds}s`
    );
  }
  const durationSeconds = roundMilliseconds(lastFrame.atSeconds + endHoldSeconds);
  if (durationSeconds <= 0) {
    throw new Error('Presentation bridge durationSeconds must be positive');
  }

  return {
    format: PRESENTATION_BRIDGE_FORMAT,
    schemaVersion: PRESENTATION_BRIDGE_SCHEMA_VERSION,
    source: {
      authoritativeRuntime: 'typescript-core',
      generator: PRESENTATION_BRIDGE_GENERATOR,
      fixtureId: options.fixtureId,
      seed: options.seed,
    },
    encounter: {
      id: options.encounter.id,
      name: options.encounter.name,
      tier: options.encounter.tier,
      environment: {
        type: environment?.type ?? 'unconfigured',
        lightSourceX: finiteNumber(environment?.lightSourceX ?? 0.5, 'environment.lightSourceX'),
        lightSourceY: finiteNumber(environment?.lightSourceY ?? 0.2, 'environment.lightSourceY'),
        lightColor: environment?.lightColor ?? '#ffe080',
        floorTint: environment?.floorTint ?? '#202530',
        hazeColor: environment?.hazeColor ?? '#25354a',
        stoneColor: environment?.stoneColor ?? '#343948',
        metalColor: environment?.metalColor ?? '#252c3a',
        shadowColor: environment?.shadowColor ?? '#080c14',
        accentColor: environment?.accentColor ?? '#63e6ff',
      },
    },
    timing: {
      frameStepSeconds,
      endHoldSeconds,
      durationSeconds,
    },
    frames,
  };
}
