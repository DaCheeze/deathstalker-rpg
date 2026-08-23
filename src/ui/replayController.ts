/**
 * Replay Controller & Deterministic Playback Engine.
 * Supports scrubbing across full battle timeline, stepping forward/backward,
 * variable playback speeds (0.5x, 1x, 2x, 4x, max), and triggers full combat feel feedback.
 */

import { AbilityDefinition, BattleAction, BattleState, EncounterDefinition } from '../core/types';
import { applyAction, initBattle } from '../core/battle';
import { createRng } from '../core/random';
import { BattleReplay } from '../sim/simulator';
import { ReplayHUDState } from '../render/drawUI';
import { CombatFeedbackCoordinator } from './combatFeedbackCoordinator';

export class ReplayController {
  private currentReplay: BattleReplay | null = null;
  private sampleLabel: string = '';
  private stateHistory: BattleState[] = [];
  private currentActionIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;
  private lastStepTime: number = 0;
  private rng: (() => number) | null = null;
  private readonly feedbackCoordinator = new CombatFeedbackCoordinator();

  constructor(
    private abilitiesData: Record<string, AbilityDefinition>
  ) {}

  public loadReplay(replay: BattleReplay, sampleLabel: string = ''): void {
    this.feedbackCoordinator.reset();
    this.currentReplay = replay;
    this.sampleLabel = sampleLabel;
    this.isPlaying = false;
    this.currentActionIndex = 0;
    this.playbackSpeed = 1.0;
    this.lastStepTime = performance.now();
    this.rng = createRng(replay.seed);

    const enc: EncounterDefinition = {
      id: replay.encounterId,
      name: replay.encounterName,
      tier: replay.encounterTier,
      description: 'Replay Session',
      enemyIds: replay.initialEnemies.map((e) => e.id),
    };

    const initialParty = replay.initialParty.map((p) => ({
      ...p,
      stats: { ...p.stats },
      abilityIds: [...p.abilityIds],
    }));

    const initialEnemies = replay.initialEnemies.map((e) => ({
      ...e,
      stats: { ...e.stats },
      abilityIds: [...e.abilityIds],
    }));

    const startState = initBattle(initialParty, initialEnemies, this.abilitiesData, enc);
    this.stateHistory = [startState];
  }

  public getHUDState(): ReplayHUDState | null {
    if (!this.currentReplay) return null;
    const currentState = this.getBattleState();
    const living = [...currentState.partyIds, ...currentState.enemyIds].filter(
      (id) => (currentState.combatants[id]?.stats.hp ?? 0) > 0
    ).length;
    const round = currentState.turnNumber > 0 && living > 0 ? currentState.turnNumber / Math.max(1, living) : 1;

    return {
      isPlaying: this.isPlaying,
      currentActionIndex: this.currentActionIndex,
      totalActions: this.currentReplay.actions.length,
      currentRound: Math.max(1, Math.round(round * 10) / 10),
      playbackSpeed: this.playbackSpeed,
      encounterName: this.currentReplay.encounterName,
      seed: this.currentReplay.seed,
      sampleLabel: this.sampleLabel,
    };
  }

  public getBattleState(): BattleState {
    const state =
      this.stateHistory[this.currentActionIndex] ??
      this.stateHistory[this.stateHistory.length - 1];
    if (!state) {
      throw new Error('No replay loaded');
    }
    return state;
  }

  public advanceFeedback(deltaTimeMs: number): void {
    this.feedbackCoordinator.advance(deltaTimeMs);
  }

  public resetFeedback(): void {
    this.feedbackCoordinator.reset();
  }

  public togglePlay(): void {
    if (!this.currentReplay) return;
    if (this.currentActionIndex >= this.currentReplay.actions.length) {
      // Loop back to start if finished
      this.scrubTo(0);
    }
    this.isPlaying = !this.isPlaying;
    this.lastStepTime = performance.now();
  }

  public setSpeed(speed: number): void {
    this.playbackSpeed = speed;
  }

  public stepForward(): boolean {
    if (!this.currentReplay) return false;
    if (this.currentActionIndex >= this.currentReplay.actions.length) {
      this.isPlaying = false;
      return false;
    }

    const curState = this.getBattleState();
    const action = this.currentReplay.actions[this.currentActionIndex] as BattleAction;

    // Check if next state is already cached
    let nextState = this.stateHistory[this.currentActionIndex + 1];
    if (!nextState) {
      nextState = applyAction(curState, action, this.rng || undefined);
      this.stateHistory.push(nextState);
    }

    this.currentActionIndex++;

    // Trigger visual/audio feedback if not skipping
    const isSkip = this.playbackSpeed >= 8;
    this.feedbackCoordinator.spawn(curState, action, nextState, { suppress: isSkip });

    return true;
  }

  public stepBackward(): boolean {
    this.feedbackCoordinator.reset();
    if (this.currentActionIndex <= 0) return false;
    this.isPlaying = false;
    this.currentActionIndex--;
    return true;
  }

  public scrubTo(targetActionIndex: number): void {
    if (!this.currentReplay) return;
    this.feedbackCoordinator.reset();
    const clamped = Math.max(0, Math.min(this.currentReplay.actions.length, targetActionIndex));

    // If target state is not generated yet, simulate up to target silently
    while (this.stateHistory.length <= clamped) {
      const idx = this.stateHistory.length - 1;
      const act = this.currentReplay.actions[idx];
      if (!act) break;
      const prev = this.stateHistory[idx];
      if (!prev) {
        throw new Error(`Replay state ${idx} was not generated`);
      }
      const nxt = applyAction(prev, act, this.rng || undefined);
      this.stateHistory.push(nxt);
    }

    this.currentActionIndex = clamped;
  }

  public update(): void {
    if (!this.isPlaying || !this.currentReplay) return;

    const now = performance.now();
    // Action delay based on playback speed (1x = 750ms between actions)
    const baseDelayMs = 700;
    const delayMs = baseDelayMs / this.playbackSpeed;

    if (now - this.lastStepTime >= delayMs) {
      this.lastStepTime = now;
      const advanced = this.stepForward();
      if (!advanced) {
        this.isPlaying = false;
      }
    }
  }

}
