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
import {
  addDeathDissolution,
  addDisruptorSequence,
  addFloatingText,
  addProjectile,
  addPsionicWave,
  addShieldShatterParticles,
  triggerCombatantLunge,
  triggerHitStop,
  triggerScreenFlash,
  triggerScreenShake,
} from '../render/drawFx';
import { triggerCombatantFlinch } from '../render/drawCombatants';
import { FEEDBACK_CONFIG } from '../render/feedbackConfig';
import { globalAudio } from '../audio/synth';
import { getEnemyCardBounds, getPartyCombatantBounds } from '../render/theme';

export class ReplayController {
  private currentReplay: BattleReplay | null = null;
  private sampleLabel: string = '';
  private stateHistory: BattleState[] = [];
  private currentActionIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;
  private lastStepTime: number = 0;
  private rng: (() => number) | null = null;

  constructor(
    private abilitiesData: Record<string, AbilityDefinition>
  ) {}

  public loadReplay(replay: BattleReplay, sampleLabel: string = ''): void {
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
    this.spawnFeedbackForAction(curState, action, nextState, isSkip);

    return true;
  }

  public stepBackward(): boolean {
    if (this.currentActionIndex <= 0) return false;
    this.isPlaying = false;
    this.currentActionIndex--;
    return true;
  }

  public scrubTo(targetActionIndex: number): void {
    if (!this.currentReplay) return;
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

  private spawnFeedbackForAction(
    prevState: BattleState,
    action: BattleAction,
    nextState: BattleState,
    isSkip: boolean
  ): void {
    // Compute actor position
    const actorPartyIdx = prevState.partyIds.indexOf(action.actorId);
    const actorEnemyIdx = prevState.enemyIds.indexOf(action.actorId);
    let actorX = 512;
    let actorY = 500;
    if (actorPartyIdx !== -1) {
      const b = getPartyCombatantBounds(prevState.partyIds.length, actorPartyIdx);
      actorX = b.x + b.w / 2;
      actorY = b.y + b.h * 0.44;
    } else if (actorEnemyIdx !== -1) {
      const b = getEnemyCardBounds(prevState.enemyIds.length, actorEnemyIdx);
      actorX = b.x + b.w / 2;
      actorY = b.y + b.h * 0.44;
    }

    // Audio triggers
    if (!isSkip) {
      const actionAbility =
        action.type === 'Attack' || action.type === 'EsperAbility'
          ? prevState.abilities[action.abilityId]
          : undefined;
      globalAudio.playBattleAction(action, actionAbility);
    }

    for (const [i, ev] of nextState.recentEvents.entries()) {
      globalAudio.playBattleEvent(ev, isSkip);

      if (ev.type === 'DAMAGE_DEALT') {
        const target = prevState.combatants[ev.targetId];
        const targetMaxHp = target?.stats.maxHp ?? 100;
        const dmgPct = ev.damage / targetMaxHp;

        const targetIdx = prevState.enemyIds.indexOf(ev.targetId);
        const partyIdx = prevState.partyIds.indexOf(ev.targetId);

        let targetX = 512;
        let targetY = 280;

        if (targetIdx !== -1) {
          const bounds = getEnemyCardBounds(prevState.enemyIds.length, targetIdx);
          targetX = bounds.x + bounds.w / 2;
          targetY = bounds.y + bounds.h * 0.44;
        } else if (partyIdx !== -1) {
          const bounds = getPartyCombatantBounds(prevState.partyIds.length, partyIdx);
          targetX = bounds.x + bounds.w / 2;
          targetY = bounds.y + bounds.h * 0.44;
        }

        // Action-specific animations (suppressed gracefully in MAX speed)
        if (!isSkip) {
          if (ev.isDisruptor) {
            addDisruptorSequence(actorX, actorY, targetX, targetY, '#34d399');
            triggerScreenShake(FEEDBACK_CONFIG.shakeDisruptorMagnitude, FEEDBACK_CONFIG.shakeDisruptorDurationMs, isSkip);
            triggerScreenFlash('rgba(52, 211, 153, 0.4)', FEEDBACK_CONFIG.flashDurationMs, isSkip);
            triggerHitStop(FEEDBACK_CONFIG.hitStopDisruptorMs, isSkip);
            addFloatingText(`⚡ DISRUPTOR: -${ev.damage}!`, targetX, targetY - 18, '#34d399', dmgPct, true, i);
          } else {
            const ability = action.type === 'Attack' ? prevState.abilities[action.abilityId] : action.type === 'EsperAbility' ? prevState.abilities[action.abilityId] : null;

            if (ability?.category === 'melee') {
              triggerCombatantLunge(action.actorId, actorX, actorY, targetX, targetY, FEEDBACK_CONFIG.lungeDurationMs);
            } else if (ability?.category === 'projectile') {
              const isScatter = action.type === 'Attack' && action.abilityId === 'scatter_shot';
              addProjectile(actorX, actorY, targetX, targetY, isScatter ? '#fbbf24' : '#38bdf8', isScatter);
            } else if (ability?.category === 'esper') {
              addPsionicWave(actorX, actorY, targetX, targetY, '#c084fc');
            }

            if (ev.shieldAbsorbed) {
              addShieldShatterParticles(targetX, targetY, '#38bdf8', 16);
              addFloatingText('🛡️ SHIELD BLOCKED!', targetX, targetY - 12, '#38bdf8', 0.1, false, i);
            } else {
              if (ev.isCrit) {
                triggerScreenShake(FEEDBACK_CONFIG.shakeCritMagnitude, FEEDBACK_CONFIG.shakeCritDurationMs, isSkip);
                triggerHitStop(FEEDBACK_CONFIG.hitStopCritMs, isSkip);
              } else {
                triggerHitStop(FEEDBACK_CONFIG.hitStopNormalMs, isSkip);
              }

              const color = ev.isCrit ? '#fbbf24' : '#ef4444';
              const text = ev.isCrit ? `CRIT! -${ev.damage}` : `-${ev.damage}`;
              addFloatingText(text, targetX, targetY - 10, color, dmgPct, ev.isCrit, i);
            }
          }

          // Flinch
        triggerCombatantFlinch(ev.targetId, ev.isDisruptor ? FEEDBACK_CONFIG.flinchDistanceHeavy : FEEDBACK_CONFIG.flinchDistanceNormal);

          if (ev.targetKilled) {
            const targetAccent = target?.accentColor || '#ef4444';
            addDeathDissolution(targetX, targetY, targetAccent, target?.stats.maxHp ? target.stats.maxHp / 100 : 1.0);
          }
        }
      } else if (ev.type === 'BURNOUT_CHIP_DAMAGE' && !isSkip) {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const bounds = getPartyCombatantBounds(prevState.partyIds.length, partyIdx);
          addFloatingText(`🔥 BURNOUT -${ev.damage}`, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.44, '#f97316', 0.1, false, i);
        }
      } else if (ev.type === 'BOOST_CRASHED' && !isSkip) {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const bounds = getPartyCombatantBounds(prevState.partyIds.length, partyIdx);
          addFloatingText(`CRASH [${ev.crashTurns}T RECOVERY]`, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.44, '#c084fc', 0.2, true, i);
        }
      } else if (ev.type === 'BURNOUT_STUNNED' && !isSkip) {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const bounds = getPartyCombatantBounds(prevState.partyIds.length, partyIdx);
          addFloatingText(`⚡ STUNNED (OVERHEAT)`, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.44, '#ef4444', 0.2, true, i);
        }
      }
    }

    globalAudio.playBattleOutcome(prevState.status, nextState.status, isSkip);
  }
}
