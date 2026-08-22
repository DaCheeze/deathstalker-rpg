import { requireValue } from '../../src/core/invariant';
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
    expect(run.inventory.medkits).toBeGreaterThanOrEqual(1);
    expect(run.inventory.revives).toBeGreaterThanOrEqual(1);
    expect(run.currentEncounterIndex).toBe(0);
    expect(run.status).toBe('in_progress');
    expect(requireValue(run.party['valen'], 'Expected test fixture value').stats.hp).toBe(100);
    expect(requireValue(run.party['lyra'], 'Expected test fixture value').stats.esp).toBe(30);
  });

  it('persists HP exactly, regens ESP partially, halves burnout, keeps disruptor CD, and clears shields/crash', () => {
    let run = initRun(dummyParty, dummyEncounters, 12345);
    const battle = startRunEncounter(run, dummyEnemiesMap, dummyAbilities);

    // Simulate fight events: Valen takes damage, enters boost, has force shield
    requireValue(battle.combatants['valen'], 'Expected test fixture value').stats.hp = 65;
    requireValue(battle.combatants['valen'], 'Expected test fixture value').burnout = 5;
    requireValue(battle.combatants['valen'], 'Expected test fixture value').disruptorCooldown = 4;
    requireValue(battle.combatants['valen'], 'Expected test fixture value').hasForceShield = true;
    requireValue(battle.combatants['valen'], 'Expected test fixture value').crashTurns = 2;

    // Lyra spent ESP
    requireValue(battle.combatants['lyra'], 'Expected test fixture value').stats.hp = 70;
    requireValue(battle.combatants['lyra'], 'Expected test fixture value').stats.esp = 10;
    requireValue(battle.combatants['lyra'], 'Expected test fixture value').disruptorCooldown = 0;

    // End battle in victory
    battle.status = 'victory';

    run = completeRunEncounter(run, battle);

    // Verify Valen state
    expect(requireValue(run.party['valen'], 'Expected test fixture value').stats.hp).toBe(65); // Exact HP preserved
    expect(requireValue(run.party['valen'], 'Expected test fixture value').burnout).toBe(2);   // Halved: floor(5 / 2) = 2
    expect(requireValue(run.party['valen'], 'Expected test fixture value').disruptorCooldown).toBe(4); // Cooldown preserved
    expect(requireValue(run.party['valen'], 'Expected test fixture value').hasForceShield).toBe(false); // Force shield cleared
    expect(requireValue(run.party['valen'], 'Expected test fixture value').crashTurns).toBe(0); // Crash state cleared

    // Verify Lyra state
    expect(requireValue(run.party['lyra'], 'Expected test fixture value').stats.hp).toBe(70);
    expect(requireValue(run.party['lyra'], 'Expected test fixture value').stats.esp).toBe(22); // 10 + 12 = 22 ESP
    expect(requireValue(run.party['lyra'], 'Expected test fixture value').disruptorCooldown).toBe(0); // Ready disruptor preserved

    // Next encounter index advanced
    expect(run.currentEncounterIndex).toBe(1);
    expect(run.status).toBe('in_progress');
  });

  it('rejects completion while a battle is still in progress', () => {
    const run = initRun(dummyParty, dummyEncounters, 12345);
    const battle = startRunEncounter(run, dummyEnemiesMap, dummyAbilities);

    expect(() => completeRunEncounter(run, battle)).toThrow(
      "Cannot complete encounter 'enc_1' while battle status is in_progress."
    );
  });

  it('persists KIA crew members across encounters unless revived', () => {
    let run = initRun(dummyParty, dummyEncounters, 12345);
    const battle = startRunEncounter(run, dummyEnemiesMap, dummyAbilities);

    // Lyra dies in fight 1
    requireValue(battle.combatants['lyra'], 'Expected test fixture value').stats.hp = 0;
    battle.status = 'victory';

    run = completeRunEncounter(run, battle);

    expect(requireValue(run.party['lyra'], 'Expected test fixture value').stats.hp).toBe(0);

    // Starting encounter 2 should have Lyra dead (0 HP)
    const battle2 = startRunEncounter(run, dummyEnemiesMap, dummyAbilities);
    expect(requireValue(battle2.combatants['lyra'], 'Expected test fixture value').stats.hp).toBe(0);
    expect(battle2.turnQueue.entries.some((e) => e.actorId === 'lyra')).toBe(false);
  });

  it('supports in-combat Medkit and Revive actions', () => {
    const battle = startRunEncounter(initRun(dummyParty, dummyEncounters, 12345, { medkits: 4, revives: 1 }), dummyEnemiesMap, dummyAbilities);

    // Damage Valen and kill Lyra
    requireValue(battle.combatants['valen'], 'Expected test fixture value').stats.hp = 40;
    requireValue(battle.combatants['lyra'], 'Expected test fixture value').stats.hp = 0;

    expect(battle.inventory.medkits).toBe(4);
    expect(battle.inventory.revives).toBe(1);

    // 1. Valen uses Medkit on himself (45% max HP heal = +45 HP -> 85 HP)
    const afterMedkit = applyAction(battle, {
      type: 'UseMedkit',
      actorId: 'valen',
      targetId: 'valen',
    });

    expect(requireValue(afterMedkit.combatants['valen'], 'Expected test fixture value').stats.hp).toBe(85);
    expect(afterMedkit.inventory.medkits).toBe(3);

    // 2. Valen uses Revive on dead Lyra (30% max HP revive = 24 HP)
    const afterRevive = applyAction(afterMedkit, {
      type: 'UseRevive',
      actorId: 'valen',
      targetId: 'lyra',
    });

    expect(requireValue(afterRevive.combatants['lyra'], 'Expected test fixture value').stats.hp).toBe(24);
    expect(afterRevive.inventory.revives).toBe(0);
    // Lyra should now be in turn queue
    expect(afterRevive.turnQueue.entries.some((e) => e.actorId === 'lyra')).toBe(true);
  });

  it('supports intermission Medkit and Revive between encounters', () => {
    let run = initRun(dummyParty, dummyEncounters, 12345, { medkits: 4, revives: 1 });
    requireValue(run.party['valen'], 'Expected test fixture value').stats.hp = 30;
    requireValue(run.party['lyra'], 'Expected test fixture value').stats.hp = 0;

    const customRules = {
      boost: { entryBurnout: 2, perTurnAccrual: 1, perTurnDecay: 1, chipThreshold: 6, crashThreshold: 8, chipDamagePercent: 0.08, damageMultiplier: 1.5, speedMultiplier: 1.3, entryTurnDamagePenalty: 0.5, aiDropThreshold: 7 },
      disruptor: { baseCooldownTurns: 6, shieldMitigationPercent: 0.5, targetHpPercent: 0.65 },
      esp: { perTurnRegen: 4, intermissionRegenPercent: 0.40 },
      inventory: { medkits: 4, medkitHealPercent: 0.45, revives: 1, reviveHealPercent: 0.30, inCombatHealThreshold: 0.30, intermissionHealThreshold: 0.50 }
    };

    // Use intermission medkit on Valen (45% max HP = +45 HP -> 75 HP)
    run = applyIntermissionMedkit(run, 'valen', customRules);
    expect(requireValue(run.party['valen'], 'Expected test fixture value').stats.hp).toBe(75);
    expect(run.inventory.medkits).toBe(3);

    // Use intermission revive on Lyra (30% max HP = 24 HP)
    run = applyIntermissionRevive(run, 'lyra', customRules);
    expect(requireValue(run.party['lyra'], 'Expected test fixture value').stats.hp).toBe(24);
    expect(run.inventory.revives).toBe(0);
  });
});
