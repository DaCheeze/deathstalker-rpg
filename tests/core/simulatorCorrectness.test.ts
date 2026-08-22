import { describe, expect, it } from 'vitest';
import { runSimulation } from '../../src/sim/simulator';
import { Combatant, EncounterDefinition } from '../../src/core/types';

function inertCombatant(id: string, faction: Combatant['faction'], disruptorCooldown: number): Combatant {
  return {
    id,
    name: id,
    role: 'Soldier',
    faction,
    stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 1, defense: 100, speed: 10 },
    abilityIds: [],
    canBoost: false,
    disruptorCooldown,
    isBoosting: false,
    turnsSpentBoosting: 0,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    crashTurns: 0,
  };
}

describe('headless simulator correctness guards', () => {
  it('throws a detailed diagnostic instead of treating an action-capped battle as cleared', () => {
    const party = [inertCombatant('party_member', 'party', 3)];
    const enemy = inertCombatant('inert_enemy', 'empire', 999);
    const encounterIds = [
      'enc_empire_skirmish',
      'enc_shub_skirmish',
      'enc_empire_patrol',
      'enc_shub_swarm',
      'enc_hadenman_vanguard',
    ];
    const encounters: EncounterDefinition[] = encounterIds.map((id) => ({
      id,
      name: id,
      tier: id.includes('vanguard') ? 'elite' : id.includes('patrol') || id.includes('swarm') ? 'standard' : 'skirmish',
      description: 'Action-cap fixture',
      enemyIds: ['inert_enemy'],
    }));

    expect(() => runSimulation(
      party,
      { inert_enemy: enemy },
      {},
      encounters,
      1,
      { disableDisruptor: true, disableBoost: true, disableEsper: true },
      12345
    )).toThrow(
      /\[simulation-action-cap\].*seed=12345.*encounter=enc_empire_skirmish.*actions=140.*queueTurn=/
    );
  });
});
