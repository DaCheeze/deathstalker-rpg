import { describe, expect, it } from 'vitest';
import { AbilityDefinition, Combatant, EncounterDefinition } from '../../src/core/types';
import { applyAction, getAvailableActions, initBattle } from '../../src/core/battle';

describe('KIA Strict Validation & Invariants', () => {
  const dummyParty: Combatant[] = [
    {
      id: 'valen',
      name: 'Captain Valen',
      role: 'Captain',
      faction: 'party',
      stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 20, defense: 10, speed: 12 },
      abilityIds: ['basic_slash'],
      canBoost: true,
      disruptorCooldown: 0,
      isBoosting: false,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      crashTurns: 0,
    },
    {
      id: 'lyra',
      name: 'Lyra',
      role: 'Esper Support',
      faction: 'party',
      stats: { maxHp: 80, hp: 80, maxEsp: 30, esp: 30, attack: 12, defense: 6, speed: 14 },
      abilityIds: ['kinetic_blast'],
      canBoost: false,
      disruptorCooldown: 0,
      isBoosting: false,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      crashTurns: 0,
    },
  ];

  const dummyEnemies: Combatant[] = [
    {
      id: 'enemy_1',
      name: 'Legionnaire A',
      role: 'Vanguard',
      faction: 'empire',
      stats: { maxHp: 50, hp: 50, maxEsp: 0, esp: 0, attack: 14, defense: 8, speed: 10 },
      abilityIds: ['carbine_burst'],
      canBoost: false,
      disruptorCooldown: 0,
      isBoosting: false,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      crashTurns: 0,
    },
    {
      id: 'enemy_2',
      name: 'Legionnaire B',
      role: 'Vanguard',
      faction: 'empire',
      stats: { maxHp: 50, hp: 50, maxEsp: 0, esp: 0, attack: 14, defense: 8, speed: 9 },
      abilityIds: ['carbine_burst'],
      canBoost: false,
      disruptorCooldown: 0,
      isBoosting: false,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      crashTurns: 0,
    },
  ];

  const dummyAbilities: Record<string, AbilityDefinition> = {
    basic_slash: {
      id: 'basic_slash',
      name: 'Basic Slash',
      category: 'melee',
      espCost: 0,
      powerMultiplier: 1.0,
      targetScope: 'single_enemy',
      description: 'Standard slash',
    },
    kinetic_blast: {
      id: 'kinetic_blast',
      name: 'Kinetic Blast',
      category: 'esper',
      espCost: 8,
      powerMultiplier: 1.2,
      targetScope: 'single_enemy',
      description: 'Psionic blast',
    },
    carbine_burst: {
      id: 'carbine_burst',
      name: 'Carbine Burst',
      category: 'projectile',
      espCost: 0,
      powerMultiplier: 1.0,
      targetScope: 'single_enemy',
      description: 'Carbine shot',
    },
  };

  const dummyEncounter: EncounterDefinition = {
    id: 'enc_test',
    name: 'Test Encounter',
    tier: 'skirmish',
    description: 'Test',
    enemyIds: ['enemy_1', 'enemy_2'],
  };

  it('throws an error if a dead combatant attempts to take any action', () => {
    const battle = initBattle(dummyParty, dummyEnemies, dummyAbilities, dummyEncounter);
    // Force Valen to 0 HP
    battle.combatants['valen']!.stats.hp = 0;

    expect(() => {
      applyAction(battle, { type: 'PassTurn', actorId: 'valen' });
    }).toThrow(/Dead combatant cannot act/);

    expect(() => {
      applyAction(battle, { type: 'Attack', actorId: 'valen', targetId: 'enemy_1', abilityId: 'basic_slash' });
    }).toThrow(/Dead combatant cannot act/);

    expect(() => {
      applyAction(battle, { type: 'Disruptor', actorId: 'valen', targetId: 'enemy_1' });
    }).toThrow(/Dead combatant cannot act/);
  });

  it('throws an error if an attack, disruptor, or esper ability targets a dead combatant', () => {
    const battle = initBattle(dummyParty, dummyEnemies, dummyAbilities, dummyEncounter);
    // Kill enemy_1
    battle.combatants['enemy_1']!.stats.hp = 0;

    expect(() => {
      applyAction(battle, {
        type: 'Attack',
        actorId: 'valen',
        targetId: 'enemy_1',
        abilityId: 'basic_slash',
      });
    }).toThrow(/Dead combatant cannot be targeted/);

    expect(() => {
      applyAction(battle, {
        type: 'Disruptor',
        actorId: 'valen',
        targetId: 'enemy_1',
      });
    }).toThrow(/Dead combatant cannot be targeted/);

    expect(() => {
      applyAction(battle, {
        type: 'EsperAbility',
        actorId: 'lyra',
        targetId: 'enemy_1',
        abilityId: 'kinetic_blast',
      });
    }).toThrow(/Dead combatant cannot be targeted/);
  });

  it('immediately purges dead combatants from turn queue upon fatal damage', () => {
    const battle = initBattle(dummyParty, dummyEnemies, dummyAbilities, dummyEncounter);
    // Set enemy_1 HP low so basic_slash is guaranteed fatal
    battle.combatants['enemy_1']!.stats.hp = 5;

    // Confirm enemy_1 is in initial turn queue
    const initialHasEnemy1 = battle.turnQueue.entries.some((e) => e.actorId === 'enemy_1');
    expect(initialHasEnemy1).toBe(true);

    const nextBattle = applyAction(
      battle,
      { type: 'Attack', actorId: 'valen', targetId: 'enemy_1', abilityId: 'basic_slash' },
      { isCrit: false }
    );

    expect(nextBattle.combatants['enemy_1']!.stats.hp).toBe(0);
    // Must be completely purged from queue
    const nextHasEnemy1 = nextBattle.turnQueue.entries.some((e) => e.actorId === 'enemy_1');
    expect(nextHasEnemy1).toBe(false);
  });

  it('returns empty array from getAvailableActions for a dead combatant', () => {
    const battle = initBattle(dummyParty, dummyEnemies, dummyAbilities, dummyEncounter);
    battle.combatants['valen']!.stats.hp = 0;

    const actions = getAvailableActions(battle, 'valen');
    expect(actions).toEqual([]);
  });
});
