import { describe, expect, it } from 'vitest';
import { choosePartyActionForSim } from '../../src/core/ai';
import { initBattle } from '../../src/core/battle';
import { Combatant, EncounterDefinition } from '../../src/core/types';

function combatant(overrides: Partial<Combatant> & Pick<Combatant, 'id' | 'name' | 'faction'>): Combatant {
  return {
    role: 'Soldier',
    stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 10, defense: 10, speed: 10 },
    abilityIds: [],
    canBoost: false,
    disruptorCooldown: 3,
    isBoosting: false,
    turnsSpentBoosting: 0,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    crashTurns: 0,
    ...overrides,
  };
}

describe('simulation party policy', () => {
  const encounter: EncounterDefinition = {
    id: 'enc_policy_test',
    name: 'Policy Test',
    tier: 'standard',
    description: 'Policy ordering fixture',
    enemyIds: ['enemy'],
  };

  it('voluntarily exits boost before spending a turn on emergency healing or shielding', () => {
    const captain = combatant({
      id: 'captain',
      name: 'Captain',
      faction: 'party',
      role: 'Captain',
      canBoost: true,
      isBoosting: true,
      burnout: 7,
      stats: { maxHp: 100, hp: 20, maxEsp: 0, esp: 0, attack: 10, defense: 10, speed: 10 },
    });
    const ally = combatant({
      id: 'ally',
      name: 'Ally',
      faction: 'party',
      stats: { maxHp: 100, hp: 10, maxEsp: 0, esp: 0, attack: 10, defense: 10, speed: 30 },
    });
    const enemy = combatant({
      id: 'enemy',
      name: 'Enemy',
      faction: 'empire',
      disruptorCooldown: 0,
    });
    const state = initBattle([captain, ally], [enemy], {}, encounter, { medkits: 1, revives: 0 }, 12345);

    expect(choosePartyActionForSim(state, 'captain', undefined, () => 0.5)).toEqual({
      type: 'ToggleBoost',
      actorId: 'captain',
      enable: false,
    });
  });

  it('preserves the no-boost ablation policy', () => {
    const captain = combatant({
      id: 'captain',
      name: 'Captain',
      faction: 'party',
      role: 'Captain',
      canBoost: true,
      isBoosting: true,
      burnout: 7,
    });
    const ally = combatant({
      id: 'ally',
      name: 'Ally',
      faction: 'party',
      stats: { maxHp: 100, hp: 10, maxEsp: 0, esp: 0, attack: 10, defense: 10, speed: 30 },
    });
    const enemy = combatant({ id: 'enemy', name: 'Enemy', faction: 'empire' });
    const state = initBattle([captain, ally], [enemy], {}, encounter, { medkits: 1, revives: 0 }, 12345);

    expect(choosePartyActionForSim(state, 'captain', { disableBoost: true }, () => 0.5)).toEqual({
      type: 'UseMedkit',
      actorId: 'captain',
      targetId: 'ally',
    });
  });
});
