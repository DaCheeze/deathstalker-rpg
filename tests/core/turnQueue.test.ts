import { describe, it, expect } from 'vitest';
import {
  initTurnQueue,
  advanceTurnQueue,
  displaceActorInQueue,
  getEffectiveSpeed,
  prioritizeOpeningSide,
  refreshTurnQueue,
} from '../../src/core/turnQueue';
import { Combatant } from '../../src/core/types';

function createMockCombatant(id: string, speed: number, hp = 100): Combatant {
  return {
    id,
    name: `Unit ${id}`,
    faction: 'party',
    role: 'Fighter',
    stats: {
      maxHp: 100,
      hp,
      maxEsp: 0,
      esp: 0,
      attack: 20,
      defense: 10,
      speed,
    },
    canBoost: false,
    crashTurns: 0,
    disruptorCooldown: 0,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: [],
  };
}

describe('Turn Queue System', () => {
  it('schedules faster combatants sooner', () => {
    const fast = createMockCombatant('fast', 20);
    const slow = createMockCombatant('slow', 10);
    const combatants = { fast, slow };
    const queue = initTurnQueue(combatants, ['fast', 'slow']);

    expect(queue.entries.length).toBeGreaterThan(0);
    expect(queue.entries[0]?.actorId).toBe('fast');
  });

  it('boost stance increases effective speed by +30%', () => {
    const unit = createMockCombatant('unit', 10);
    expect(getEffectiveSpeed(unit)).toBe(10);

    unit.isBoosting = true;
    expect(getEffectiveSpeed(unit)).toBeCloseTo(13);
  });

  it('telekinetically displaces an actor backwards in the queue', () => {
    const a = createMockCombatant('a', 15);
    const b = createMockCombatant('b', 15);
    const combatants = { a, b };

    const initialQueue = initTurnQueue(combatants, ['a', 'b']);
    const displacedQueue = displaceActorInQueue(initialQueue, 'a', 50, combatants, ['a', 'b']);

    // Target 'a' should now have higher accumulator and appear after 'b'
    expect(displacedQueue.accumulators['a']).toBeGreaterThan(initialQueue.accumulators['a'] ?? 0);
    expect(displacedQueue.entries[0]?.actorId).toBe('b');
  });

  it('advances turn queue cleanly and handles dead actors', () => {
    const a = createMockCombatant('a', 15);
    const b = createMockCombatant('b', 12);
    const combatants = { a, b };

    const queue = initTurnQueue(combatants, ['a', 'b']);
    const { nextActorId, updatedQueue } = advanceTurnQueue(queue, combatants, ['a', 'b'], 'a');

    expect(nextActorId).toBe('b');
    expect(updatedQueue.entries.length).toBeGreaterThan(0);

    // If unit 'b' dies, it should disappear from the refreshed queue
    b.stats.hp = 0;
    const refreshed = refreshTurnQueue(updatedQueue, combatants, ['a', 'b']);
    expect(refreshed.entries.some((e) => e.actorId === 'b')).toBe(false);
  });

  it('gives the favored side exactly the opening action before normal speed resumes', () => {
    const fastEnemy = createMockCombatant('enemy', 20);
    const slowerParty = createMockCombatant('party', 10);
    fastEnemy.faction = 'empire';
    const combatants = { enemy: fastEnemy, party: slowerParty };
    const normal = initTurnQueue(combatants, ['party', 'enemy']);
    expect(normal.entries[0]?.actorId).toBe('enemy');

    const advantaged = prioritizeOpeningSide(
      normal,
      ['party'],
      combatants,
      ['party', 'enemy']
    );
    expect(advantaged.entries[0]?.actorId).toBe('party');
    const afterOpening = advanceTurnQueue(
      advantaged,
      combatants,
      ['party', 'enemy'],
      'party'
    );
    expect(afterOpening.nextActorId).toBe('enemy');
  });
});
