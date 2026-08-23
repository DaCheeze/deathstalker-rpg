import { afterEach, describe, expect, it, vi } from 'vitest';
import abilitiesJson from '../../src/data/abilities.json';
import rangeBandPrototypeJson from '../../src/data/range-band-prototype.json';
import { validateAbilities, validateCombatants, validateEncounter } from '../../src/core/validator';
import { resetCombatantFeedback } from '../../src/render/drawCombatants';
import { resetCombatEffects } from '../../src/render/drawFx';
import { getPrototypeMainCommands, resetCombatUiFeedback } from '../../src/render/drawUI';
import { BattleController } from '../../src/ui/battleController';
import type { InputCallback, InputManager } from '../../src/ui/input';

function inputHarness(): { manager: InputManager; emit: InputCallback } {
  const listeners: InputCallback[] = [];
  const manager = {
    onInput(callback: InputCallback): void {
      listeners.push(callback);
    },
  } as unknown as InputManager;

  return {
    manager,
    emit(action, payload): void {
      for (const listener of listeners) listener(action, payload);
    },
  };
}

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  resetCombatEffects();
  resetCombatantFeedback();
  resetCombatUiFeedback();
});

describe('battle controller suspension', () => {
  it('invalidates a stale enemy callback and reschedules it only after resume', () => {
    vi.useFakeTimers();
    const input = inputHarness();
    const abilities = validateAbilities(abilitiesJson);
    const party = Object.values(
      validateCombatants(rangeBandPrototypeJson.party, 'rangeBandPrototype.party')
    );
    const enemies = validateCombatants(
      rangeBandPrototypeJson.enemies,
      'rangeBandPrototype.enemies'
    );
    const encounter = validateEncounter(
      rangeBandPrototypeJson.encounter,
      'rangeBandPrototype.encounter'
    );
    const controller = new BattleController(
      party,
      enemies,
      abilities,
      [encounter],
      input.manager
    );

    expect(controller.isPlayerTurn()).toBe(true);
    for (let partyTurns = 0; controller.isPlayerTurn() && partyTurns < party.length; partyTurns++) {
      const state = controller.getState();
      const actor = state.combatants[state.activeActorId];
      if (!actor) throw new Error(`Missing active actor ${state.activeActorId}`);
      const passIndex = getPrototypeMainCommands(state, actor)
        .findIndex((command) => command.id === 'pass');
      input.emit('NUMKEY', passIndex + 1);
    }
    expect(controller.isPlayerTurn()).toBe(false);
    const stateWaitingForEnemy = controller.getState();
    const waitingTurn = stateWaitingForEnemy.turnNumber;

    controller.suspend();
    input.emit('RESTART');
    vi.advanceTimersByTime(700);

    expect(controller.getState()).toBe(stateWaitingForEnemy);
    expect(controller.getState().turnNumber).toBe(waitingTurn);

    controller.resume();
    vi.advanceTimersByTime(700);

    expect(controller.getState().turnNumber).toBeGreaterThan(waitingTurn);
  });
});
