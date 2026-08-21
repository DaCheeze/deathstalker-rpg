import { describe, expect, it } from 'vitest';
import { AbilityDefinition, Combatant, EncounterDefinition } from '../../src/core/types';
import {
  applyIntermissionMedkit,
  applyIntermissionRevive,
  completeRunEncounter,
  initRun,
  startRunEncounter,
} from '../../src/core/run';
import { applyAction } from '../../src/core/battle';

describe('Run-Based Persistence & Item Economy', () => {
  const dummyParty: Combatant[] = [
    {
      id: 'valen',
      name: 'Captain Valen',
      role: 'Captain',
      faction: 'party',
      stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 20, defense: 10, speed: 12 },
      abilityIds: ['basic_slash'],
      canBoost: true,
      disruptorCooldown: 3,
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
      disruptorCooldown: 3,
      isBoosting: false,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      crashTurns: 0,
    },
  ];

  const dummyEnemiesMap: Record<string, Combatant> = {
    drone_a: {
      id: 'drone_a',
      name: 'Shub Drone A',
      role: 'Scout',
      faction: 'shub',
      stats: { maxHp: 40, hp: 40, maxEsp: 0, esp: 0, attack: 12, defense: 6, speed: 11 },
      abilityIds: ['laser_burst'],
      canBoost: false,
      disruptorCooldown: 3,
      isBoosting: false,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      crashTurns: 0,
    },
  };

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
    laser_burst: {
      id: 'laser_burst',
      name: 'Laser Burst',
      category: 'projectile',
      espCost: 0,
      powerMultiplier: 1.0,
      targetScope: 'single_enemy',
      description: 'Laser shot',
    },
  };

  const dummyEncounters: EncounterDefinition[] = [
    {
      id: 'enc_1',
      name: 'Encounter 1',
      tier: 'skirmish',
      description: 'Fight 1',
      enemyIds: ['drone_a'],
    },
    {
      id: 'enc_2',
      name: 'Encounter 2',
      tier: 'standard',
      description: 'Fight 2',
      enemyIds: ['drone_a'],
    },
  ];

  it('initializes a run with correct inventory and full party condition', () => {
    const run = initRun(dummyParty, dummyEncounters, 12345);
    expect(run.inventory.medkits).toBe(8);
    expect(run.inventory.revives).toBe(2);
    expect(run.currentEncounterIndex).toBe(0);
    expect(run.status).toBe('in_progress');
    expect(run.party['valen']!.stats.hp).toBe(100);
    expect(run.party['lyra']!.stats.esp).toBe(30);
  });

  it('persists HP exactly, regens ESP partially, halves burnout, keeps disruptor CD, and clears shields/crash', () => {
    let run = initRun(dummyParty, dummyEncounters, 12345);
    const battle = startRunEncounter(run, dummyEnemiesMap, dummyAbilities);

    // Simulate fight events: Valen takes damage, enters boost, has force shield
    battle.combatants['valen']!.stats.hp = 65;
    battle.combatants['valen']!.burnout = 5;
    battle.combatants['valen']!.disruptorCooldown = 4;
    battle.combatants['valen']!.hasForceShield = true;
    battle.combatants['valen']!.crashTurns = 2;

    // Lyra spent ESP
    battle.combatants['lyra']!.stats.hp = 70;
    battle.combatants['lyra']!.stats.esp = 10;
    battle.combatants['lyra']!.disruptorCooldown = 0;

    // End battle in victory
    battle.status = 'victory';

    run = completeRunEncounter(run, battle);

    // Verify Valen state
    expect(run.party['valen']!.stats.hp).toBe(65); // Exact HP preserved
    expect(run.party['valen']!.burnout).toBe(2);   // Halved: floor(5 / 2) = 2
    expect(run.party['valen']!.disruptorCooldown).toBe(4); // Cooldown preserved
    expect(run.party['valen']!.hasForceShield).toBe(false); // Force shield cleared
    expect(run.party['valen']!.crashTurns).toBe(0); // Crash state cleared

    // Verify Lyra state
    expect(run.party['lyra']!.stats.hp).toBe(70);
    expect(run.party['lyra']!.stats.esp).toBe(30); // 10 + 20 = 30 ESP (capped at maxEsp 30)
    expect(run.party['lyra']!.disruptorCooldown).toBe(0); // Ready disruptor preserved

    // Next encounter index advanced
    expect(run.currentEncounterIndex).toBe(1);
    expect(run.status).toBe('in_progress');
  });

  it('persists KIA crew members across encounters unless revived', () => {
    let run = initRun(dummyParty, dummyEncounters, 12345);
    const battle = startRunEncounter(run, dummyEnemiesMap, dummyAbilities);

    // Lyra dies in fight 1
    battle.combatants['lyra']!.stats.hp = 0;
    battle.status = 'victory';

    run = completeRunEncounter(run, battle);

    expect(run.party['lyra']!.stats.hp).toBe(0);

    // Starting encounter 2 should have Lyra dead (0 HP)
    const battle2 = startRunEncounter(run, dummyEnemiesMap, dummyAbilities);
    expect(battle2.combatants['lyra']!.stats.hp).toBe(0);
    expect(battle2.turnQueue.entries.some((e) => e.actorId === 'lyra')).toBe(false);
  });

  it('supports in-combat Medkit and Revive actions', () => {
    const battle = startRunEncounter(initRun(dummyParty, dummyEncounters, 12345, { medkits: 3, revives: 1 }), dummyEnemiesMap, dummyAbilities);

    // Damage Valen and kill Lyra
    battle.combatants['valen']!.stats.hp = 40;
    battle.combatants['lyra']!.stats.hp = 0;

    expect(battle.inventory.medkits).toBe(3);
    expect(battle.inventory.revives).toBe(1);

    // 1. Valen uses Medkit on himself (100% max HP heal = +100 HP -> 100 HP max)
    const afterMedkit = applyAction(battle, {
      type: 'UseMedkit',
      actorId: 'valen',
      targetId: 'valen',
    });

    expect(afterMedkit.combatants['valen']!.stats.hp).toBe(100);
    expect(afterMedkit.inventory.medkits).toBe(2);

    // 2. Valen uses Revive on dead Lyra (50% max HP revive = 40 HP)
    const afterRevive = applyAction(afterMedkit, {
      type: 'UseRevive',
      actorId: 'valen',
      targetId: 'lyra',
    });

    expect(afterRevive.combatants['lyra']!.stats.hp).toBe(40);
    expect(afterRevive.inventory.revives).toBe(0);
    // Lyra should now be in turn queue
    expect(afterRevive.turnQueue.entries.some((e) => e.actorId === 'lyra')).toBe(true);
  });

  it('supports intermission Medkit and Revive between encounters', () => {
    let run = initRun(dummyParty, dummyEncounters, 12345, { medkits: 3, revives: 1 });
    run.party['valen']!.stats.hp = 30;
    run.party['lyra']!.stats.hp = 0;

    // Use intermission medkit on Valen (100% max HP = 100 HP)
    run = applyIntermissionMedkit(run, 'valen');
    expect(run.party['valen']!.stats.hp).toBe(100);
    expect(run.inventory.medkits).toBe(2);

    // Use intermission revive on Lyra (50% max HP = 40 HP)
    run = applyIntermissionRevive(run, 'lyra');
    expect(run.party['lyra']!.stats.hp).toBe(40);
    expect(run.inventory.revives).toBe(0);
  });
});
