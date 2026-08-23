import { describe, expect, it } from 'vitest';

import {
  createPresentationBridgeDocument,
  PRESENTATION_BRIDGE_FORMAT,
  PRESENTATION_BRIDGE_SCHEMA_VERSION,
  serializeBattleAction,
  serializeBattleState,
} from '../../src/bridge/presentationBridge';
import { choosePartyActionForSim } from '../../src/core/ai';
import { applyAction } from '../../src/core/battle';
import { loadGameData } from '../../src/core/configLoader';
import { createRng } from '../../src/core/random';
import { initRun, startRunEncounter } from '../../src/core/run';

function setup() {
  const gameData = loadGameData({});
  const encounter = gameData.encounters.find((candidate) => candidate.id === 'enc_empire_skirmish');
  if (!encounter) throw new Error('Expected validated Empire skirmish encounter');
  const run = initRun(gameData.party, [encounter], 230823, undefined, gameData.rules);
  const state = startRunEncounter(run, gameData.enemies, gameData.abilities, gameData.rules);
  return { gameData, encounter, state };
}

describe('Godot presentation bridge v1', () => {
  it('serializes BattleState as deterministic presentation-only plain JSON', () => {
    const { state } = setup();
    const serialized = serializeBattleState(state);

    expect(serialized.combatants.map((combatant) => combatant.id)).toEqual([
      ...state.partyIds,
      ...state.enemyIds,
    ]);
    expect(serialized.combatants.map((combatant) => combatant.slot)).toEqual([0, 1, 2, 3, 0, 1]);
    expect(JSON.parse(JSON.stringify(serialized))).toEqual(serialized);

    const first = serialized.combatants[0];
    expect(first).toBeDefined();
    expect(first).not.toHaveProperty('stats');
    expect(first).not.toHaveProperty('abilityIds');
    expect(serialized).not.toHaveProperty('abilities');
    expect(serialized).not.toHaveProperty('rules');
    expect(serialized).not.toHaveProperty('log');
    expect(serialized).not.toHaveProperty('turnQueue.accumulators');
  });

  it('normalizes core actions and calculated events without recalculating combat', () => {
    const { state } = setup();
    const rng = createRng(230823);
    const action = choosePartyActionForSim(state, state.activeActorId, undefined, rng);
    const nextState = applyAction(state, action, rng);
    const serializedAction = serializeBattleAction(state, action);
    const serializedState = serializeBattleState(nextState);

    expect(serializedAction.actorId).toBe(action.actorId);
    expect(serializedAction).toHaveProperty('audioCue');
    expect(serializedState.events.length).toBeGreaterThan(0);
    expect(serializedState.combatants.find((combatant) => combatant.id === action.actorId)).toBeDefined();
    expect(serializedState.events.every((event) => event.amount === null || Number.isFinite(event.amount))).toBe(true);
  });

  it('carries shared semantic event audio routing without an ability-ID policy', () => {
    const { state } = setup();
    const targetId = state.enemyIds[0];
    if (!targetId) throw new Error('Expected an enemy target');
    const serialized = serializeBattleState({
      ...state,
      recentEvents: [
        {
          type: 'DAMAGE_DEALT',
          actorId: state.activeActorId,
          targetId,
          abilityName: 'Vibro-Blade',
          damage: 20,
          isCrit: true,
          isDisruptor: false,
          shieldAbsorbed: false,
          targetKilled: true,
        },
      ],
    });

    expect(serialized.events[0]?.audioCues).toEqual(['death']);
  });

  it('preserves a legal targetless esper presentation action', () => {
    const { state } = setup();
    const esperId = state.partyIds.find((id) => state.combatants[id]?.stats.maxEsp > 0);
    if (!esperId) throw new Error('Expected the validated party esper');
    const serialized = serializeBattleAction(state, {
      type: 'EsperAbility',
      actorId: esperId,
      abilityId: 'neural_static',
    });

    expect(serialized.targetId).toBeNull();
    expect(serialized.audioCue).toBe('psionic');
  });

  it('resolves shared semantic visual timing before Godot receives an action', () => {
    const { state } = setup();
    const targetId = state.enemyIds[0];
    if (!targetId) throw new Error('Expected an enemy target');

    const melee = serializeBattleAction(state, {
      type: 'Attack',
      actorId: state.activeActorId,
      targetId,
      abilityId: 'twin_daggers',
    });
    const projectile = serializeBattleAction(state, {
      type: 'Attack',
      actorId: 'crew_tarek',
      targetId,
      abilityId: 'particle_carbine',
    });
    const scatter = serializeBattleAction(state, {
      type: 'Attack',
      actorId: 'crew_tarek',
      targetId,
      abilityId: 'scatter_shot',
    });
    const psionic = serializeBattleAction(state, {
      type: 'EsperAbility',
      actorId: 'crew_lyra',
      targetId,
      abilityId: 'mind_flay',
    });
    const legacyDisruptor = serializeBattleAction(state, {
      type: 'Disruptor',
      actorId: state.activeActorId,
      targetId,
    });
    const prototypeDisruptor = serializeBattleAction(
      { ...state, battleMode: 'range_band_prototype' },
      { type: 'Disruptor', actorId: state.activeActorId, targetId }
    );

    expect(melee.timing).toEqual({
      durationSeconds: 0.2,
      visualContactSeconds: 0.1,
      beamStartSeconds: null,
    });
    expect(projectile.timing).toEqual({
      durationSeconds: 0.25,
      visualContactSeconds: 0.25,
      beamStartSeconds: null,
    });
    expect(scatter.timing.durationSeconds).toBe(0.21);
    expect(psionic.timing.visualContactSeconds).toBe(0.32);
    expect(legacyDisruptor.timing).toEqual({
      durationSeconds: 0.81,
      visualContactSeconds: 0.46,
      beamStartSeconds: 0.22,
    });
    expect(prototypeDisruptor.timing.durationSeconds).toBe(0.54);
  });

  it('normalizes a held Advance interrupt into the authoritative reactor beat', () => {
    const { encounter, state } = setup();
    const actorId = state.activeActorId;
    expect(state.partyIds).toContain(actorId);
    const reactorId = state.turnQueue.entries
      .map((entry) => entry.actorId)
      .find((id) => state.enemyIds.includes(id));
    if (!reactorId) throw new Error('Expected an enemy reactor');

    const combatants = Object.fromEntries(
      Object.entries(state.combatants).map(([id, combatant]) => [
        id,
        {
          ...combatant,
          rangeBand: 'ranged' as const,
          disruptorReady: id === reactorId,
        },
      ])
    );
    const before = {
      ...state,
      battleMode: 'range_band_prototype' as const,
      disruptorPowerMultiplier: 1.6,
      combatants,
    };
    const action = { type: 'Advance' as const, actorId };
    const after = applyAction(before, action, { varianceFactor: 1, isCrit: false });
    const serialized = serializeBattleAction(before, action, after);

    expect(serialized).toMatchObject({
      type: 'disruptor',
      actorId: reactorId,
      targetId: actorId,
      abilityName: 'Held Disruptor Interrupt',
      abilityCategory: 'disruptor',
      audioCue: 'disruptor',
      timing: {
        durationSeconds: 0.54,
        visualContactSeconds: 0.46,
        beamStartSeconds: 0.22,
      },
    });

    const document = createPresentationBridgeDocument({
      fixtureId: 'held-interrupt',
      seed: 230823,
      encounter,
      states: [before, after],
      actions: [action],
      frameStepSeconds: 1,
      endHoldSeconds: 1,
    });
    const transitionFrame = document.frames[1];
    expect(transitionFrame?.action).toEqual(serialized);
    expect(
      transitionFrame?.state.events.find((event) => event.type === 'disruptor_interrupt')
        ?.audioCues
    ).toEqual([]);
    expect(
      serializeBattleState(after).events.find((event) => event.type === 'disruptor_interrupt')
        ?.audioCues
    ).toEqual(['disruptor']);
  });

  it('keeps an uninterrupted Advance as a generic advance presentation beat', () => {
    const { encounter, state } = setup();
    const actorId = state.activeActorId;
    const before = {
      ...state,
      battleMode: 'range_band_prototype' as const,
      combatants: Object.fromEntries(
        Object.entries(state.combatants).map(([id, combatant]) => [
          id,
          { ...combatant, rangeBand: 'ranged' as const, disruptorReady: false },
        ])
      ),
    };
    const action = { type: 'Advance' as const, actorId };
    const after = applyAction(before, action, { varianceFactor: 1, isCrit: false });
    const serialized = serializeBattleAction(before, action, after);

    expect(serialized.type).toBe('advance');
    expect(serialized.actorId).toBe(actorId);
    expect(serialized.audioCue).toBeNull();
    expect(serialized.timing.visualContactSeconds).toBeNull();

    const document = createPresentationBridgeDocument({
      fixtureId: 'uninterrupted-advance',
      seed: 230823,
      encounter,
      states: [before, after],
      actions: [action],
      frameStepSeconds: 1,
      endHoldSeconds: 1,
    });
    expect(document.frames[1]?.action).toEqual(serialized);
  });

  it('builds a versioned deterministic document with one frame per core snapshot', () => {
    const { encounter, state } = setup();
    const rng = createRng(230823);
    const action = choosePartyActionForSim(state, state.activeActorId, undefined, rng);
    const nextState = applyAction(state, action, rng);
    const options = {
      fixtureId: 'bridge-test',
      seed: 230823,
      encounter,
      states: [state, nextState],
      actions: [action],
      frameStepSeconds: 1.15,
      endHoldSeconds: 2.5,
    } as const;

    const first = createPresentationBridgeDocument(options);
    const second = createPresentationBridgeDocument(options);

    expect(first).toEqual(second);
    expect(first.format).toBe(PRESENTATION_BRIDGE_FORMAT);
    expect(first.schemaVersion).toBe(PRESENTATION_BRIDGE_SCHEMA_VERSION);
    expect(first.source.authoritativeRuntime).toBe('typescript-core');
    expect(first.frames.map((frame) => frame.atSeconds)).toEqual([0, 1.15]);
    expect(first.frames[0]?.action).toBeNull();
    expect(first.frames[1]?.action?.actorId).toBe(action.actorId);
    expect(first.timing.durationSeconds).toBe(3.65);
  });

  it('normalizes the cadence once at millisecond precision', () => {
    const { encounter, state } = setup();
    const rng = createRng(230823);
    const firstAction = choosePartyActionForSim(state, state.activeActorId, undefined, rng);
    const secondState = applyAction(state, firstAction, rng);
    const secondAction = { type: 'PassTurn' as const, actorId: secondState.activeActorId };
    const thirdState = applyAction(secondState, secondAction, rng);

    const document = createPresentationBridgeDocument({
      fixtureId: 'normalized-cadence',
      seed: 230823,
      encounter,
      states: [state, secondState, thirdState],
      actions: [firstAction, secondAction],
      frameStepSeconds: 0.3334,
      endHoldSeconds: 0.5,
    });

    expect(document.timing.frameStepSeconds).toBe(0.333);
    expect(document.frames.map((frame) => frame.atSeconds)).toEqual([0, 0.333, 0.666]);
    expect(document.timing.durationSeconds).toBe(1.166);
  });

  it('rejects a timeline that could conceal a missing core transition', () => {
    const { encounter, state } = setup();
    expect(() =>
      createPresentationBridgeDocument({
        fixtureId: 'invalid',
        seed: 230823,
        encounter,
        states: [state, state],
        actions: [],
        frameStepSeconds: 1,
        endHoldSeconds: 1,
      })
    ).toThrow(/one action per state transition/);
  });

  it('rejects an action timing that would overlap the next snapshot', () => {
    const { encounter, state } = setup();
    const targetId = state.enemyIds[0];
    if (!targetId) throw new Error('Expected an enemy target');
    const action = {
      type: 'Attack' as const,
      actorId: state.activeActorId,
      targetId,
      abilityId: 'twin_daggers',
    };
    const nextState = applyAction(state, action, { varianceFactor: 1, isCrit: false });

    expect(() =>
      createPresentationBridgeDocument({
        fixtureId: 'overlap',
        seed: 230823,
        encounter,
        states: [state, nextState],
        actions: [action],
        frameStepSeconds: 0.1,
        endHoldSeconds: 1,
      })
    ).toThrow(/exceeds frameStepSeconds/);
  });

  it('rejects a final action that would be cut off by the end hold', () => {
    const { encounter, state } = setup();
    const targetId = state.enemyIds[0];
    if (!targetId) throw new Error('Expected an enemy target');
    const action = {
      type: 'Disruptor' as const,
      actorId: state.activeActorId,
      targetId,
    };
    const nextState = applyAction(state, action, { varianceFactor: 1, isCrit: false });

    expect(() =>
      createPresentationBridgeDocument({
        fixtureId: 'short-end-hold',
        seed: 230823,
        encounter,
        states: [state, nextState],
        actions: [action],
        frameStepSeconds: 1,
        endHoldSeconds: 0.5,
      })
    ).toThrow(/exceeds endHoldSeconds/);
  });

  it.each([
    { fixtureId: '', seed: 230823, frameStepSeconds: 1, endHoldSeconds: 1, message: /fixtureId/ },
    { fixtureId: 'bad-seed', seed: 1.5, frameStepSeconds: 1, endHoldSeconds: 1, message: /safe integer/ },
    { fixtureId: 'infinite-seed', seed: Number.POSITIVE_INFINITY, frameStepSeconds: 1, endHoldSeconds: 1, message: /safe integer/ },
    { fixtureId: 'bad-step', seed: 230823, frameStepSeconds: Number.NaN, endHoldSeconds: 1, message: /frameStepSeconds/ },
    { fixtureId: 'bad-hold', seed: 230823, frameStepSeconds: 1, endHoldSeconds: Number.POSITIVE_INFINITY, message: /endHoldSeconds/ },
  ])('rejects invalid document metadata or timing: $fixtureId', ({ message, ...invalid }) => {
    const { encounter, state } = setup();
    expect(() =>
      createPresentationBridgeDocument({
        ...invalid,
        encounter,
        states: [state],
        actions: [],
      })
    ).toThrow(message);
  });

  it.each([
    { frameStepSeconds: 0.0004, endHoldSeconds: 1, message: /millisecond precision/ },
    { frameStepSeconds: 1, endHoldSeconds: 0, message: /durationSeconds must be positive/ },
  ])(
    'rejects timing that becomes non-positive after normalization: $frameStepSeconds / $endHoldSeconds',
    ({ frameStepSeconds, endHoldSeconds, message }) => {
      const { encounter, state } = setup();
      expect(() =>
        createPresentationBridgeDocument({
          fixtureId: 'non-positive-normalized-timing',
          seed: 230823,
          encounter,
          states: [state],
          actions: [],
          frameStepSeconds,
          endHoldSeconds,
        })
      ).toThrow(message);
    }
  );
});
