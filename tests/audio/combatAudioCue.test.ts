import { describe, expect, it } from 'vitest';
import type { AbilityDefinition, BattleAction } from '../../src/core/types';
import {
  resolveCombatAudioCue,
  resolveCombatEventAudioCues,
  resolveCombatOutcomeAudioCue,
} from '../../src/audio/combatAudioCue';

const meleeAbility: AbilityDefinition = {
  id: 'vibro_blade',
  name: 'Vibro-Blade',
  category: 'melee',
  audioProfile: 'vibro_blade',
  espCost: 0,
  powerMultiplier: 1,
  targetScope: 'single_enemy',
  description: 'Test melee ability',
};

const projectileAbility: AbilityDefinition = {
  id: 'particle_carbine',
  name: 'Particle Carbine',
  category: 'projectile',
  audioProfile: 'particle',
  espCost: 0,
  powerMultiplier: 1,
  targetScope: 'single_enemy',
  description: 'Test projectile ability',
};

function attack(abilityId: string): BattleAction {
  return { type: 'Attack', actorId: 'actor', targetId: 'target', abilityId };
}

describe('combat audio cue routing', () => {
  it('routes each configured melee signature to a distinct cue', () => {
    const cues = [
      resolveCombatAudioCue(attack('vibro_blade'), meleeAbility),
      resolveCombatAudioCue(attack('twin_daggers'), { ...meleeAbility, audioProfile: 'twin_vibro_daggers' }),
      resolveCombatAudioCue(attack('heavy_smash'), { ...meleeAbility, audioProfile: 'heavy_smash' }),
      resolveCombatAudioCue(attack('physical_shove'), { ...meleeAbility, audioProfile: 'concussive_shove' }),
    ];

    expect(cues).toEqual([
      'vibro_blade',
      'twin_vibro_daggers',
      'heavy_smash',
      'concussive_shove',
    ]);
    expect(new Set(cues).size).toBe(4);
  });

  it('keeps generic melee fallbacks and projectile families routed', () => {
    expect(resolveCombatAudioCue(attack('generic_blade'), { ...meleeAbility, audioProfile: 'blade' })).toBe('blade');
    expect(resolveCombatAudioCue(attack('generic_blunt'), { ...meleeAbility, audioProfile: 'blunt' })).toBe('blunt');
    expect(resolveCombatAudioCue(attack('particle_carbine'), projectileAbility)).toBe('particle');
    expect(resolveCombatAudioCue(attack('rifle'), { ...projectileAbility, audioProfile: 'ballistic' })).toBe('ballistic');
    expect(resolveCombatAudioCue(attack('scatter_shot'), { ...projectileAbility, audioProfile: 'ballistic_scatter' })).toBe('ballistic_scatter');
    expect(resolveCombatAudioCue(attack('plasma_burst'), { ...projectileAbility, audioProfile: 'plasma' })).toBe('plasma');
    expect(resolveCombatAudioCue(attack('laser'), { ...projectileAbility, audioProfile: 'laser' })).toBe('laser');
  });

  it('routes tactical actions and psionics', () => {
    expect(resolveCombatAudioCue({ type: 'Disruptor', actorId: 'actor', targetId: 'target' })).toBe('disruptor');
    expect(resolveCombatAudioCue({ type: 'RaiseShield', actorId: 'actor' })).toBe('shield_raise');
    expect(resolveCombatAudioCue({ type: 'ToggleBoost', actorId: 'actor', enable: true })).toBe('boost_enter');
    expect(resolveCombatAudioCue({ type: 'ToggleBoost', actorId: 'actor', enable: false })).toBe('boost_exit');
    expect(
      resolveCombatAudioCue({ type: 'EsperAbility', actorId: 'actor', targetId: 'target', abilityId: 'mind_flay' })
    ).toBe('psionic');
  });

  it('stays silent for actions without a dedicated combat cue', () => {
    expect(resolveCombatAudioCue({ type: 'PassTurn', actorId: 'actor' })).toBeNull();
    expect(resolveCombatAudioCue({ type: 'UseMedkit', actorId: 'actor', targetId: 'target' })).toBeNull();
    expect(resolveCombatAudioCue(attack('unknown'))).toBeNull();
    expect(resolveCombatAudioCue(attack('unprofiled'), { ...projectileAbility, audioProfile: undefined })).toBeNull();
  });

  it('limits damage contacts to one reactive consequence cue', () => {
    expect(resolveCombatEventAudioCues({
      type: 'DAMAGE_DEALT', actorId: 'actor', targetId: 'target', abilityName: 'Strike',
      damage: 10, isCrit: true, isDisruptor: false, shieldAbsorbed: false, targetKilled: true,
    })).toEqual(['death']);
    expect(resolveCombatEventAudioCues({
      type: 'DAMAGE_DEALT', actorId: 'actor', targetId: 'target', abilityName: 'Strike',
      damage: 10, isCrit: true, isDisruptor: false, shieldAbsorbed: false, targetKilled: false,
    })).toEqual(['critical_hit']);
    expect(resolveCombatEventAudioCues({
      type: 'DAMAGE_DEALT', actorId: 'actor', targetId: 'target', abilityName: 'Strike',
      damage: 0, isCrit: false, isDisruptor: false, shieldAbsorbed: true, targetKilled: false,
    })).toEqual(['shield_shatter']);
    expect(resolveCombatEventAudioCues({
      type: 'BURNOUT_CHIP_DAMAGE', actorId: 'actor', damage: 8, killed: true,
    })).toEqual(['burnout_damage', 'death']);
    expect(resolveCombatEventAudioCues({
      type: 'BOOST_CRASHED', actorId: 'actor', crashTurns: 2,
    })).toEqual(['boost_crash']);
  });

  it('suppresses reactive and outcome cues for MAX replay speed', () => {
    expect(resolveCombatEventAudioCues({
      type: 'BURNOUT_CHIP_DAMAGE', actorId: 'actor', damage: 8, killed: true,
    }, true)).toEqual([]);
    expect(resolveCombatOutcomeAudioCue('in_progress', 'victory', true)).toBeNull();
  });

  it('routes battle outcomes only on a transition from in progress', () => {
    expect(resolveCombatOutcomeAudioCue('in_progress', 'victory')).toBe('victory');
    expect(resolveCombatOutcomeAudioCue('in_progress', 'defeat')).toBe('defeat');
    expect(resolveCombatOutcomeAudioCue('victory', 'victory')).toBeNull();
    expect(resolveCombatOutcomeAudioCue('in_progress', 'in_progress')).toBeNull();
  });
});
