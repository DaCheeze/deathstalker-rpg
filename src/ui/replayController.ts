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
  addBeamEffect,
  addFloatingText,
  addShieldShatterParticles,
  triggerHitStop,
  triggerScreenFlash,
  triggerScreenShake,
} from '../render/drawFx';
import { triggerCombatantFlinch as triggerFlinch } from '../render/drawCombatants';
import { FEEDBACK_CONFIG } from '../render/feedbackConfig';
import { globalAudio } from '../audio/synth';
import { LAYOUT } from '../render/theme';

export class ReplayController {
  private currentReplay: BattleReplay | null = null;
  private sampleLabel: string = '';
  private stateHistory: BattleState[] = [];
  private currentActionIndex: number = 0;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1.0;
  private lastStepTime: number = performance.now();
  private rng: (() => number) | null = null;

  constructor(
    private abilitiesData: Record<string, AbilityDefinition>,
    private encountersList: EncounterDefinition[]
  ) {}

  public loadReplay(replay: BattleReplay, label: string = ''): void {
    this.currentReplay = replay;
    this.sampleLabel = label;
    this.rng = createRng(replay.seed);
    this.isPlaying = false;
    this.currentActionIndex = 0;

    const encDef = this.encountersList.find((e) => e.id === replay.encounterId) || {
      id: replay.encounterId,
      name: replay.encounterName,
      description: 'Recorded simulation encounter',
      tier: replay.encounterTier,
      enemyIds: replay.initialEnemies.map((e) => e.id),
      rewards: { xp: 100, credits: 50 },
    };

    // Initialize state 0
    const initialState = initBattle(
      JSON.parse(JSON.stringify(replay.initialParty)),
      JSON.parse(JSON.stringify(replay.initialEnemies)),
      this.abilitiesData,
      encDef
    );

    this.stateHistory = [initialState];
  }

  public getHUDState(): ReplayHUDState | null {
    if (!this.currentReplay) return null;
    const curState = this.getBattleState();

    // Calculate approximate completed rounds
    const living = [...curState.partyIds, ...curState.enemyIds].filter(
      (id) => (curState.combatants[id]?.stats.hp ?? 0) > 0
    ).length;

    const round = curState.turnNumber > 0 && living > 0 ? curState.turnNumber / Math.max(1, living) : 1;

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
    if (this.stateHistory.length === 0) {
      throw new Error('No replay loaded');
    }
    return this.stateHistory[this.currentActionIndex] || this.stateHistory[this.stateHistory.length - 1]!;
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

  public stepForward(_isAutoPlay: boolean = false): boolean {
    if (!this.currentReplay) return false;
    if (this.currentActionIndex >= this.currentReplay.actions.length) {
      this.isPlaying = false;
      return false;
    }

    const curState = this.stateHistory[this.currentActionIndex]!;
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
      const prev = this.stateHistory[idx]!;
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
      const advanced = this.stepForward(true);
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
    const { arenaY, arenaHeight, partyX, partyWidth, enemyX } = LAYOUT;

    // Audio triggers
    if (!isSkip) {
      if (action.type === 'Disruptor') {
        globalAudio.playDisruptorFire();
      } else if (action.type === 'RaiseShield') {
        globalAudio.playShieldBlock();
      } else if (action.type === 'Attack') {
        const ability = prevState.abilities[action.abilityId];
        if (ability?.category === 'melee') globalAudio.playSwordHit();
        else globalAudio.playCarbineHit();
      } else if (action.type === 'EsperAbility') {
        globalAudio.playPsionicHit();
      }
    }

    for (let i = 0; i < nextState.recentEvents.length; i++) {
      const ev = nextState.recentEvents[i]!;

      if (ev.type === 'DAMAGE_DEALT') {
        const target = prevState.combatants[ev.targetId];
        const targetMaxHp = target?.stats.maxHp ?? 100;
        const dmgPct = ev.damage / targetMaxHp;

        const targetIdx = prevState.enemyIds.indexOf(ev.targetId);
        const partyIdx = prevState.partyIds.indexOf(ev.targetId);

        let targetX = enemyX + 180;
        let targetY = arenaY + 80;

        if (targetIdx !== -1) {
          const enemyCardHeight = Math.floor((arenaHeight - 24) / Math.max(1, prevState.enemyIds.length));
          targetY = arenaY + targetIdx * (enemyCardHeight + 6) + enemyCardHeight / 2;
        } else if (partyIdx !== -1) {
          targetX = partyX + partyWidth / 2;
          const partyCardHeight = Math.floor((arenaHeight - 24) / 4);
          targetY = arenaY + partyIdx * (partyCardHeight + 6) + partyCardHeight / 2;
        }

        // Flinch
        triggerFlinch(ev.targetId, ev.isDisruptor ? FEEDBACK_CONFIG.flinchDistanceHeavy : FEEDBACK_CONFIG.flinchDistanceNormal);

        if (ev.isDisruptor) {
          // Disruptor heavy event
          const fromX = targetIdx !== -1 ? partyX + partyWidth : enemyX;
          const fromY = targetY;
          addBeamEffect(fromX, fromY, targetX, targetY, '#34d399', 10, 26);
          triggerScreenShake(FEEDBACK_CONFIG.shakeDisruptorMagnitude, FEEDBACK_CONFIG.shakeDisruptorDurationMs, isSkip);
          triggerScreenFlash('rgba(52, 211, 153, 0.4)', FEEDBACK_CONFIG.flashDurationMs, isSkip);
          triggerHitStop(FEEDBACK_CONFIG.hitStopDisruptorMs, isSkip);

          addFloatingText(`⚡ DISRUPTOR: -${ev.damage}!`, targetX, targetY - 18, '#34d399', dmgPct, true, i);
        } else if (ev.shieldAbsorbed) {
          addShieldShatterParticles(targetX, targetY, '#38bdf8', 16);
          if (!isSkip) globalAudio.playShieldShatter();
          addFloatingText('🛡️ SHIELD BLOCKED!', targetX, targetY - 12, '#38bdf8', 0.1, false, i);
        } else {
          if (ev.isCrit) {
            if (!isSkip) globalAudio.playCritHit();
            triggerScreenShake(FEEDBACK_CONFIG.shakeCritMagnitude, FEEDBACK_CONFIG.shakeCritDurationMs, isSkip);
            triggerHitStop(FEEDBACK_CONFIG.hitStopCritMs, isSkip);
          } else {
            triggerHitStop(FEEDBACK_CONFIG.hitStopNormalMs, isSkip);
          }

          const color = ev.isCrit ? '#fbbf24' : '#ef4444';
          const text = ev.isCrit ? `CRIT! -${ev.damage}` : `-${ev.damage}`;
          addFloatingText(text, targetX, targetY - 10, color, dmgPct, ev.isCrit, i);
        }

        if (ev.targetKilled && !isSkip) {
          globalAudio.playDeath();
        }
      } else if (ev.type === 'BURNOUT_CHIP_DAMAGE') {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const partyCardHeight = Math.floor((arenaHeight - 24) / 4);
          const y = arenaY + partyIdx * (partyCardHeight + 6) + partyCardHeight / 2;
          addFloatingText(`🔥 BURNOUT -${ev.damage}`, partyX + partyWidth / 2, y, '#f97316', 0.1, false, i);
        }
      } else if (ev.type === 'BOOST_CRASHED') {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const partyCardHeight = Math.floor((arenaHeight - 24) / 4);
          const y = arenaY + partyIdx * (partyCardHeight + 6) + partyCardHeight / 2;
          addFloatingText(`CRASH [${ev.crashTurns}T RECOVERY]`, partyX + partyWidth / 2, y, '#c084fc', 0.2, true, i);
        }
      } else if (ev.type === 'BURNOUT_STUNNED') {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const partyCardHeight = Math.floor((arenaHeight - 24) / 4);
          const y = arenaY + partyIdx * (partyCardHeight + 6) + partyCardHeight / 2;
          addFloatingText(`⚡ STUNNED (OVERHEAT)`, partyX + partyWidth / 2, y, '#ef4444', 0.2, true, i);
        }
      }
    }

    if (nextState.status === 'victory' && prevState.status === 'in_progress' && !isSkip) {
      globalAudio.playVictory();
    } else if (nextState.status === 'defeat' && prevState.status === 'in_progress' && !isSkip) {
      globalAudio.playDefeat();
    }
  }
}
