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
      abilityIds: ['basic_slash', 'scatter_shot'],
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
    scatter_shot: {
      id: 'scatter_shot',
      name: 'Scatter Shot',
      category: 'projectile',
      espCost: 0,
      powerMultiplier: 1.0,
      targetScope: 'all_enemies',
      description: 'Strikes all hostiles',
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

  it('does NOT throw when targeting a dead combatant; resolves cleanly as no-op', () => {
    const battle = initBattle(dummyParty, dummyEnemies, dummyAbilities, dummyEncounter);
    // Kill enemy_1
    battle.combatants['enemy_1']!.stats.hp = 0;

    // Single attack against dead target should not throw
    expect(() => {
      const result = applyAction(battle, {
        type: 'Attack',
        actorId: 'valen',
        targetId: 'enemy_1',
        abilityId: 'basic_slash',
      });
      expect(result.combatants['enemy_1']!.stats.hp).toBe(0);
    }).not.toThrow();

    // Disruptor against dead target should not throw
    expect(() => {
      const result = applyAction(battle, {
        type: 'Disruptor',
        actorId: 'valen',
        targetId: 'enemy_1',
      });
      expect(result.combatants['enemy_1']!.stats.hp).toBe(0);
    }).not.toThrow();

    // Esper ability against dead target should not throw
    expect(() => {
      const result = applyAction(battle, {
        type: 'EsperAbility',
        actorId: 'lyra',
        targetId: 'enemy_1',
        abilityId: 'kinetic_blast',
      });
      expect(result.combatants['enemy_1']!.stats.hp).toBe(0);
    }).not.toThrow();
  });

  it('resolves scatter shot cleanly when one target is dead mid-sweep against survivors', () => {
    const battle = initBattle(dummyParty, dummyEnemies, dummyAbilities, dummyEncounter);
    // Enemy 1 is already dead (0 HP), Enemy 2 is alive (50 HP)
    battle.combatants['enemy_1']!.stats.hp = 0;
    battle.combatants['enemy_2']!.stats.hp = 50;

    const nextBattle = applyAction(
      battle,
      {
        type: 'Attack',
        actorId: 'valen',
        targetId: 'enemy_2',
        abilityId: 'scatter_shot',
      },
      { isCrit: false }
    );

    // Enemy 1 remains at 0 HP
    expect(nextBattle.combatants['enemy_1']!.stats.hp).toBe(0);
    // Enemy 2 took damage and is alive
    expect(nextBattle.combatants['enemy_2']!.stats.hp).toBeLessThan(50);
    expect(nextBattle.combatants['enemy_2']!.stats.hp).toBeGreaterThan(0);
    // Events recorded damage dealt to enemy_2 only
    const damageEvents = nextBattle.recentEvents.filter((e) => e.type === 'DAMAGE_DEALT');
    expect(damageEvents.some((e) => e.targetId === 'enemy_2')).toBe(true);
    expect(damageEvents.some((e) => e.targetId === 'enemy_1')).toBe(false);
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

  it('filters dead combatants out of available target actions in getAvailableActions', () => {
    const battle = initBattle(dummyParty, dummyEnemies, dummyAbilities, dummyEncounter);
    battle.combatants['enemy_1']!.stats.hp = 0;

    const actions = getAvailableActions(battle, 'valen');
    const attackEnemy1 = actions.find((a) => a.type === 'Attack' && a.targetId === 'enemy_1');
    expect(attackEnemy1).toBeUndefined();

    const attackEnemy2 = actions.find((a) => a.type === 'Attack' && a.targetId === 'enemy_2');
    expect(attackEnemy2).toBeDefined();
  });
});
