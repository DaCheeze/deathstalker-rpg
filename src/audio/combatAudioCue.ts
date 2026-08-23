import type {
  AbilityAudioProfile,
  AbilityDefinition,
  BattleAction,
  BattleEvent,
  BattleState,
} from '../core/types';

export type CombatAudioCue =
  | AbilityAudioProfile
  | 'psionic'
  | 'disruptor'
  | 'shield_raise'
  | 'boost_enter'
  | 'boost_exit'
  | 'shield_shatter'
  | 'critical_hit'
  | 'death'
  | 'burnout_damage'
  | 'boost_crash'
  | 'victory'
  | 'defeat';

/**
 * Keeps live combat and replay playback on the same audio routing rules.
 * The resolver is browser-free so cue selection can be verified in Node.
 */
export function resolveCombatAudioCue(
  action: BattleAction,
  ability?: AbilityDefinition
): CombatAudioCue | null {
  switch (action.type) {
    case 'Disruptor':
      return 'disruptor';
    case 'RaiseShield':
      return 'shield_raise';
    case 'ToggleBoost':
      return action.enable ? 'boost_enter' : 'boost_exit';
    case 'EsperAbility':
      return 'psionic';
    case 'Attack':
      if (ability?.category === 'melee' || ability?.category === 'projectile') {
        return ability.audioProfile ?? null;
      }
      return null;
    case 'UseMedkit':
    case 'UseRevive':
    case 'Advance':
    case 'PassTurn':
      return null;
  }
}

/**
 * Resolves audio caused by the events emitted for a completed action. Returning
 * an array preserves compound feedback such as burnout damage that also kills.
 */
export function resolveCombatEventAudioCues(
  event: BattleEvent,
  suppress: boolean = false
): CombatAudioCue[] {
  if (suppress) return [];

  switch (event.type) {
    case 'DAMAGE_DEALT': {
      // A contact already has its core weapon cue. Resolve at most one short
      // consequence so lethal crits and shield breaks do not become a second hit.
      if (event.targetKilled) return ['death'];
      if (event.shieldAbsorbed) return ['shield_shatter'];
      if (event.isCrit) return ['critical_hit'];
      return [];
    }
    case 'BURNOUT_CHIP_DAMAGE':
      return event.killed ? ['burnout_damage', 'death'] : ['burnout_damage'];
    case 'BOOST_CRASHED':
      return ['boost_crash'];
    case 'DISRUPTOR_INTERRUPT':
      return ['disruptor'];
    case 'SHIELD_RAISED':
    case 'BOOST_CHANGED':
    case 'BURNOUT_STUNNED':
    case 'ITEM_USED':
    case 'COMBATANT_REVIVED':
    case 'TURN_DISPLACED':
    case 'STATUS_APPLIED':
    case 'DISRUPTOR_COOLDOWN_TICK':
    case 'RANGE_CHANGED':
    case 'TURN_STARTED':
    case 'TURN_ENDED':
    case 'BATTLE_ENDED':
      return [];
  }
}

/** Resolves the one-shot battle result cue for a state transition. */
export function resolveCombatOutcomeAudioCue(
  previous: BattleState['status'],
  next: BattleState['status'],
  suppress: boolean = false
): CombatAudioCue | null {
  if (suppress || previous !== 'in_progress') return null;
  if (next === 'victory') return 'victory';
  if (next === 'defeat') return 'defeat';
  return null;
}
