import { describe, it, expect } from 'vitest';
import { applyAction, getAvailableActions, initBattle, isEspBlocked } from '../../src/core/battle';
import { Combatant, EncounterDefinition, AbilityDefinition } from '../../src/core/types';

function createEsperSetup(includePsiBlocker: boolean) {
  const esper: Combatant = {
    id: 'esper1',
    name: 'Lyra',
    faction: 'party',
    role: 'Telepath',
    stats: { maxHp: 80, hp: 80, maxEsp: 30, esp: 30, attack: 25, defense: 10, speed: 15 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 3,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['mind_flay', 'slash'],
  };

  const enemy: Combatant = {
    id: 'e1',
    name: 'Drone',
    faction: 'empire',
    role: 'Guard',
    stats: { maxHp: 100, hp: 100, maxEsp: 0, esp: 0, attack: 10, defense: 5, speed: 10 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 3,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: ['slash'],
  };

  const psiBlocker: Combatant = {
    id: 'psi_blocker_1',
    name: 'Psi-Blocker Pylon',
    faction: 'empire',
    role: 'Psi-Blocker',
    stats: { maxHp: 50, hp: 50, maxEsp: 0, esp: 0, attack: 0, defense: 10, speed: 0 },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 99,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: [],
  };

  const abilities: Record<string, AbilityDefinition> = {
    slash: {
      id: 'slash',
      name: 'Slash',
      category: 'melee',
      espCost: 0,
      powerMultiplier: 1.0,
      targetScope: 'single_enemy',
      description: 'slash',
    },
    mind_flay: {
      id: 'mind_flay',
      name: 'Mind Flay',
      category: 'esper',
      esperSchool: 'telepath',
      espCost: 10,
      powerMultiplier: 1.2,
      targetScope: 'single_enemy',
      description: 'telepathic strike',
    },
  };

  const enemies = includePsiBlocker ? [enemy, psiBlocker] : [enemy];
  const encounter: EncounterDefinition = {
    id: 'enc1',
    name: 'Test Encounter',
    tier: 'standard',
    description: 'test',
    enemyIds: enemies.map((e) => e.id),
  };

  const state = initBattle([esper], enemies, abilities, encounter);
  return { state };
}

describe('Destructible Psi-Blocker Combatants and Esper Powers', () => {
  it('allows esper abilities when no psi-blocker is present', () => {
    const { state } = createEsperSetup(false);
    expect(isEspBlocked(state)).toBe(false);

    const actions = getAvailableActions(state, 'esper1');
    const hasEsperAction = actions.some((a) => a.type === 'EsperAbility' && a.abilityId === 'mind_flay');
    expect(hasEsperAction).toBe(true);

    const nextState = applyAction(
      state,
      { type: 'EsperAbility', actorId: 'esper1', targetId: 'e1', abilityId: 'mind_flay' },
      { varianceFactor: 1.0, isCrit: false }
    );

    // ESP consumed from 30 to 20
    expect(nextState.combatants['esper1']?.stats.esp).toBe(20);
    expect(nextState.combatants['e1']?.stats.hp).toBeLessThan(100);
  });

  it('disables esper abilities while a psi-blocker combatant is alive, and excludes it from turn queue', () => {
    const { state } = createEsperSetup(true); // Psi-blocker present
    expect(isEspBlocked(state)).toBe(true);

    // Psi-blocker should NOT appear in turn queue
    expect(state.turnQueue.entries.some((e) => e.actorId === 'psi_blocker_1')).toBe(false);

    const actions = getAvailableActions(state, 'esper1');
    const hasEsperAction = actions.some((a) => a.type === 'EsperAbility');
    expect(hasEsperAction).toBe(false);

    // Attempting to apply esper action directly is blocked
    const initialEnemyHp = state.combatants['e1']?.stats.hp;
    const nextState = applyAction(state, {
      type: 'EsperAbility',
      actorId: 'esper1',
      targetId: 'e1',
      abilityId: 'mind_flay',
    });

    expect(nextState.combatants['esper1']?.stats.esp).toBe(30);
    expect(nextState.combatants['e1']?.stats.hp).toBe(initialEnemyHp);
  });

  it('immediately restores esper abilities when the psi-blocker is destroyed', () => {
    const { state } = createEsperSetup(true);
    expect(isEspBlocked(state)).toBe(true);

    // Destroy the psi-blocker pylon (50 HP, 10 Def -> 20 dmg/hit)
    const hit1 = applyAction(
      state,
      { type: 'Attack', actorId: 'esper1', targetId: 'psi_blocker_1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    expect(hit1.combatants['psi_blocker_1']?.stats.hp).toBe(30);

    const hit2 = applyAction(
      hit1,
      { type: 'Attack', actorId: 'esper1', targetId: 'psi_blocker_1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );
    expect(hit2.combatants['psi_blocker_1']?.stats.hp).toBe(10);

    // Finish off psi-blocker on 3rd attack
    const afterDestroyed = applyAction(
      hit2,
      { type: 'Attack', actorId: 'esper1', targetId: 'psi_blocker_1', abilityId: 'slash' },
      { varianceFactor: 1.0, isCrit: false }
    );

    expect(afterDestroyed.combatants['psi_blocker_1']?.stats.hp).toBe(0);
    expect(isEspBlocked(afterDestroyed)).toBe(false);

    // Esper actions are now unlocked
    const unlockedActions = getAvailableActions(afterDestroyed, 'esper1');
    expect(unlockedActions.some((a) => a.type === 'EsperAbility')).toBe(true);
  });

  it('psionic abilities bypass force shields completely', () => {
    const { state } = createEsperSetup(false);
    const enemy = state.combatants['e1'];
    if (enemy) {
      enemy.hasForceShield = true;
    }

    const afterEsper = applyAction(
      state,
      { type: 'EsperAbility', actorId: 'esper1', targetId: 'e1', abilityId: 'mind_flay' },
      { varianceFactor: 1.0, isCrit: false }
    );

    // Damage penetrates shield directly, shield remains intact
    expect(afterEsper.combatants['e1']?.stats.hp).toBeLessThan(100);
    expect(afterEsper.combatants['e1']?.hasForceShield).toBe(true);
  });
});
