import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createRangeBandPresentationFixture } from '../../src/bridge/rangeBandPresentationFixture';
import type {
  PresentationBattleStateV1,
  PresentationFrameV1,
} from '../../src/bridge/presentationBridge';

const EXPECTED_FIXTURE_SHA256 = '16d8c17b3ff08263d62a75c43352dd2eeee5c1b5c1bfa13fcc7ecb5783a9219f';

function expectedReadyReactor(state: PresentationBattleStateV1, targetId: string): string {
  const target = state.combatants.find((combatant) => combatant.id === targetId);
  if (!target) throw new Error(`Missing serialized interrupt target '${targetId}'`);
  const reactor = state.turnQueue
    .map((entry) => state.combatants.find((combatant) => combatant.id === entry.actorId))
    .find(
      (combatant) =>
        combatant !== undefined &&
        combatant.side !== target.side &&
        combatant.alive &&
        combatant.disruptor.ready
    );
  if (!reactor) throw new Error(`No queue-selected ready reactor for '${targetId}'`);
  return reactor.id;
}

function interruptFrames(): { document: ReturnType<typeof createRangeBandPresentationFixture>; frames: PresentationFrameV1[] } {
  const document = createRangeBandPresentationFixture();
  const frames = document.frames.filter((frame) =>
    frame.state.events.some((event) => event.type === 'disruptor_interrupt')
  );
  return { document, frames };
}

describe('range-band Godot presentation fixture', () => {
  it('starts with exactly one authored ready charge per side', () => {
    const document = createRangeBandPresentationFixture();
    const initial = document.frames[0]?.state;
    expect(initial?.battleMode).toBe('range_band_prototype');
    expect(
      initial?.combatants.filter((combatant) => combatant.side === 'party' && combatant.disruptor.ready)
        .map((combatant) => combatant.id)
    ).toEqual(['prototype_duelist']);
    expect(
      initial?.combatants.filter((combatant) => combatant.side === 'enemy' && combatant.disruptor.ready)
        .map((combatant) => combatant.id)
    ).toEqual(['prototype_opponent_b']);
  });

  it('serializes each held Advance interrupt as the queue-selected reactor beat', () => {
    const { document, frames } = interruptFrames();
    expect(frames).toHaveLength(2);

    for (const frame of frames) {
      const previous = document.frames[frame.index - 1];
      const action = frame.action;
      if (!previous || !action?.targetId) throw new Error('Interrupt transition is incomplete');
      expect(action).toMatchObject({
        type: 'disruptor',
        actorId: expectedReadyReactor(previous.state, action.targetId),
        abilityName: 'Held Disruptor Interrupt',
        abilityCategory: 'disruptor',
        audioCue: 'disruptor',
        timing: {
          beamStartSeconds: 0.22,
          visualContactSeconds: 0.46,
          durationSeconds: 0.54,
        },
      });
      const interrupt = frame.state.events.find(
        (event) => event.type === 'disruptor_interrupt'
      );
      expect(interrupt).toMatchObject({
        actorId: action.actorId,
        targetId: action.targetId,
        audioCues: [],
      });
    }
  });

  it('has a stable terminal outcome and byte representation', () => {
    const first = createRangeBandPresentationFixture();
    const second = createRangeBandPresentationFixture();
    const output = `${JSON.stringify(first, null, 2)}\n`;
    expect(second).toEqual(first);
    expect(first.frames[first.frames.length - 1]?.state.status).toBe('victory');
    expect(createHash('sha256').update(output).digest('hex')).toBe(EXPECTED_FIXTURE_SHA256);
  });
});
