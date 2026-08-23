import { globalAudio } from '../audio/synth';
import type {
  AbilityDefinition,
  BattleAction,
  BattleEvent,
  BattleState,
  Combatant,
} from '../core/types';
import { resetCombatantFeedback, triggerCombatantFlinch } from '../render/drawCombatants';
import {
  CombatFeedbackTimeline,
  type CombatFeedbackMilestone,
} from '../render/combatFeedbackTimeline';
import {
  addDeathDissolution,
  addDisruptorSequence,
  addFloatingText,
  addProjectile,
  addPsionicWave,
  addShieldShatterParticles,
  resetCombatEffects,
  triggerCombatantLunge,
  triggerHitStop,
  triggerScreenFlash,
  triggerScreenShake,
} from '../render/drawFx';
import { FEEDBACK_CONFIG } from '../render/feedbackConfig';
import { resetCombatUiFeedback, triggerActionBanner } from '../render/drawUI';
import { getEnemyCardBounds, getPartyCombatantBounds } from '../render/theme';

type DamageEvent = Extract<BattleEvent, { type: 'DAMAGE_DEALT' }>;

interface BattleOutcomeTransition {
  previous: BattleState['status'];
  next: BattleState['status'];
}

interface PendingImpactFeedback {
  event: DamageEvent;
  target: Combatant | undefined;
  targetX: number;
  targetY: number;
  damageRatio: number;
  eventIndex: number;
  isPrototypeDisruptor: boolean;
  outcome?: BattleOutcomeTransition;
}

export interface CombatFeedbackOptions {
  suppress?: boolean;
  showActionBanner?: boolean;
}

interface PositionedEffect {
  token: number | null;
  feedback: PendingImpactFeedback;
}

function combatantCenter(state: BattleState, combatantId: string): { x: number; y: number } {
  const partyIndex = state.partyIds.indexOf(combatantId);
  if (partyIndex !== -1) {
    const bounds = getPartyCombatantBounds(state.partyIds.length, partyIndex);
    return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h * 0.44 };
  }

  const enemyIndex = state.enemyIds.indexOf(combatantId);
  if (enemyIndex !== -1) {
    const bounds = getEnemyCardBounds(state.enemyIds.length, enemyIndex);
    return { x: bounds.x + bounds.w / 2, y: bounds.y + bounds.h * 0.44 };
  }

  return { x: 512, y: 280 };
}

function actionAbility(
  state: BattleState,
  action: BattleAction
): AbilityDefinition | undefined {
  return action.type === 'Attack' || action.type === 'EsperAbility'
    ? state.abilities[action.abilityId]
    : undefined;
}

function showBannerForAction(
  state: BattleState,
  action: BattleAction,
  hasHeldInterrupt: boolean
): void {
  if (hasHeldInterrupt) {
    triggerActionBanner('HELD DISRUPTOR INTERRUPT', '#34d399');
    return;
  }

  if (action.type === 'Attack') {
    triggerActionBanner(state.abilities[action.abilityId]?.name ?? 'Weapon Strike', '#38bdf8');
  } else if (action.type === 'Disruptor') {
    triggerActionBanner('DISRUPTOR CANNON', '#34d399');
  } else if (action.type === 'Advance') {
    triggerActionBanner('ADVANCE', '#fbbf24');
  } else if (action.type === 'RaiseShield') {
    triggerActionBanner('FORCE SHIELD', '#38bdf8');
  } else if (action.type === 'ToggleBoost') {
    triggerActionBanner(action.enable ? 'BOOST INJECTED' : 'BOOST VENTED', '#fbbf24');
  } else if (action.type === 'EsperAbility') {
    triggerActionBanner(state.abilities[action.abilityId]?.name ?? 'Psionic Focus', '#c084fc');
  }
}

export class CombatFeedbackCoordinator {
  private readonly pendingImpacts = new Map<number, PendingImpactFeedback>();
  private readonly timeline = new CombatFeedbackTimeline();

  public get pendingImpactCount(): number {
    return this.pendingImpacts.size;
  }

  public reset(): void {
    this.pendingImpacts.clear();
    this.timeline.reset();
    resetCombatEffects();
    resetCombatantFeedback();
    resetCombatUiFeedback();
  }

  public spawn(
    previousState: BattleState,
    action: BattleAction,
    nextState: BattleState,
    options: CombatFeedbackOptions = {}
  ): void {
    const suppress = options.suppress === true;
    const ability = actionAbility(previousState, action);
    const heldInterrupt = nextState.recentEvents.find(
      (event): event is Extract<BattleEvent, { type: 'DISRUPTOR_INTERRUPT' }> => (
        event.type === 'DISRUPTOR_INTERRUPT'
      )
    );

    if (options.showActionBanner) {
      showBannerForAction(previousState, action, heldInterrupt !== undefined);
    }

    if (!suppress) {
      globalAudio.playBattleAction(action, ability);
      if (heldInterrupt) {
        // Advance itself is silent; the reactor's charge/beam cue begins now.
        globalAudio.playBattleEvent(heldInterrupt);
      }
    }

    const positionedEffects: PositionedEffect[] = [];

    for (const [eventIndex, event] of nextState.recentEvents.entries()) {
      if (event.type === 'DAMAGE_DEALT') {
        if (!suppress) {
          positionedEffects.push(
            this.createDamageEffect(previousState, nextState, action, ability, event, eventIndex)
          );
        }
        continue;
      }

      if (event.type === 'DISRUPTOR_INTERRUPT') {
        continue;
      }

      globalAudio.playBattleEvent(event, suppress);
      if (!suppress) this.spawnImmediateEventFeedback(previousState, event, eventIndex);
    }

    const outcome = previousState.status === 'in_progress' && nextState.status !== 'in_progress'
      ? { previous: previousState.status, next: nextState.status }
      : undefined;
    const lastPositioned = positionedEffects[positionedEffects.length - 1];
    if (lastPositioned && outcome) lastPositioned.feedback.outcome = outcome;

    for (const positioned of positionedEffects) {
      if (positioned.token === null) {
        this.resolveImpact(positioned.feedback);
      } else {
        this.pendingImpacts.set(positioned.token, positioned.feedback);
      }
    }

    if (!lastPositioned) {
      globalAudio.playBattleOutcome(previousState.status, nextState.status, suppress);
    }
  }

  public consumeMilestones(milestones: readonly CombatFeedbackMilestone[]): void {
    for (const milestone of milestones) {
      if (milestone.kind === 'disruptor_beam') continue;
      const feedback = this.pendingImpacts.get(milestone.token);
      if (!feedback) continue;
      this.pendingImpacts.delete(milestone.token);
      this.resolveImpact(feedback);
    }
  }

  public advance(deltaTimeMs: number): void {
    this.consumeMilestones(this.timeline.advance(deltaTimeMs));
  }

  private createDamageEffect(
    previousState: BattleState,
    nextState: BattleState,
    action: BattleAction,
    ability: AbilityDefinition | undefined,
    event: DamageEvent,
    eventIndex: number
  ): PositionedEffect {
    const source = combatantCenter(previousState, event.actorId);
    const targetPosition = combatantCenter(previousState, event.targetId);
    const target = previousState.combatants[event.targetId];
    const damageRatio = event.damage / (target?.stats.maxHp ?? 100);
    const isPrototypeDisruptor = nextState.battleMode === 'range_band_prototype';
    let token: number | null = null;

    if (event.isDisruptor) {
      token = addDisruptorSequence(
        source.x,
        source.y,
        targetPosition.x,
        targetPosition.y,
        '#34d399',
        isPrototypeDisruptor ? 'prototype' : 'legacy'
      );
      this.timeline.registerDisruptor(
        token,
        isPrototypeDisruptor
          ? FEEDBACK_CONFIG.prototypeDisruptorChargeDurationMs
          : FEEDBACK_CONFIG.disruptorChargeDurationMs,
        isPrototypeDisruptor
          ? FEEDBACK_CONFIG.prototypeDisruptorBeamDurationMs
          : FEEDBACK_CONFIG.disruptorBeamDurationMs
      );
    } else if (ability?.category === 'melee') {
      token = triggerCombatantLunge(
        action.actorId,
        source.x,
        source.y,
        targetPosition.x,
        targetPosition.y,
        FEEDBACK_CONFIG.lungeDurationMs
      );
      this.timeline.registerMelee(token, FEEDBACK_CONFIG.lungeDurationMs);
    } else if (ability?.category === 'projectile') {
      const isScatter = action.type === 'Attack' && action.abilityId === 'scatter_shot';
      token = addProjectile(
        source.x,
        source.y,
        targetPosition.x,
        targetPosition.y,
        isScatter ? '#fbbf24' : '#38bdf8',
        isScatter
      );
      this.timeline.registerProjectile(
        token,
        isScatter
          ? FEEDBACK_CONFIG.scatterProjectileTravelDurationMs
          : FEEDBACK_CONFIG.projectileTravelDurationMs
      );
    } else if (ability?.category === 'esper') {
      token = addPsionicWave(
        source.x,
        source.y,
        targetPosition.x,
        targetPosition.y,
        '#c084fc'
      );
      this.timeline.registerPsionic(token, FEEDBACK_CONFIG.psionicRippleDurationMs);
    }

    return {
      token,
      feedback: {
        event,
        target,
        targetX: targetPosition.x,
        targetY: targetPosition.y,
        damageRatio,
        eventIndex,
        isPrototypeDisruptor,
      },
    };
  }

  private resolveImpact(feedback: PendingImpactFeedback): void {
    const {
      event,
      target,
      targetX,
      targetY,
      damageRatio,
      eventIndex,
      isPrototypeDisruptor,
      outcome,
    } = feedback;

    globalAudio.playBattleEvent(event);

    if (event.isDisruptor) {
      triggerScreenShake(
        isPrototypeDisruptor
          ? FEEDBACK_CONFIG.prototypeDisruptorShakeMagnitude
          : FEEDBACK_CONFIG.shakeDisruptorMagnitude,
        isPrototypeDisruptor
          ? FEEDBACK_CONFIG.prototypeDisruptorShakeDurationMs
          : FEEDBACK_CONFIG.shakeDisruptorDurationMs
      );
      triggerScreenFlash(
        `rgba(52, 211, 153, ${isPrototypeDisruptor ? FEEDBACK_CONFIG.prototypeDisruptorFlashAlpha : 0.4})`,
        isPrototypeDisruptor
          ? FEEDBACK_CONFIG.prototypeDisruptorFlashDurationMs
          : FEEDBACK_CONFIG.flashDurationMs
      );
      triggerHitStop(
        isPrototypeDisruptor
          ? FEEDBACK_CONFIG.prototypeDisruptorHitStopMs
          : FEEDBACK_CONFIG.hitStopDisruptorMs
      );
      addFloatingText(
        `⚡ DISRUPTOR: -${event.damage}!`,
        targetX,
        targetY - 18,
        '#34d399',
        damageRatio,
        true,
        eventIndex
      );
    } else if (event.shieldAbsorbed) {
      addShieldShatterParticles(targetX, targetY, '#38bdf8', 16);
      addFloatingText(
        '🛡️ SHIELD BLOCKED!',
        targetX,
        targetY - 12,
        '#38bdf8',
        0.1,
        false,
        eventIndex
      );
    } else {
      if (event.isCrit) {
        triggerScreenShake(FEEDBACK_CONFIG.shakeCritMagnitude, FEEDBACK_CONFIG.shakeCritDurationMs);
        triggerHitStop(FEEDBACK_CONFIG.hitStopCritMs);
      } else {
        triggerHitStop(FEEDBACK_CONFIG.hitStopNormalMs);
      }
      addFloatingText(
        event.isCrit ? `CRIT! -${event.damage}` : `-${event.damage}`,
        targetX,
        targetY - 10,
        event.isCrit ? '#fbbf24' : '#ef4444',
        damageRatio,
        event.isCrit,
        eventIndex
      );
    }

    triggerCombatantFlinch(
      event.targetId,
      event.isDisruptor
        ? FEEDBACK_CONFIG.flinchDistanceHeavy
        : FEEDBACK_CONFIG.flinchDistanceNormal
    );

    if (event.targetKilled) {
      addDeathDissolution(
        targetX,
        targetY,
        target?.accentColor ?? '#ef4444',
        target?.stats.maxHp ? target.stats.maxHp / 100 : 1
      );
    }

    if (outcome) {
      globalAudio.playBattleOutcome(outcome.previous, outcome.next);
    }
  }

  private spawnImmediateEventFeedback(
    previousState: BattleState,
    event: Exclude<BattleEvent, DamageEvent>,
    eventIndex: number
  ): void {
    if (event.type === 'BURNOUT_CHIP_DAMAGE') {
      const position = combatantCenter(previousState, event.actorId);
      addFloatingText(
        `🔥 BURNOUT -${event.damage}`,
        position.x,
        position.y,
        '#f97316',
        0.1,
        false,
        eventIndex
      );
    } else if (event.type === 'BOOST_CRASHED') {
      const position = combatantCenter(previousState, event.actorId);
      addFloatingText(
        `CRASH [${event.crashTurns}T RECOVERY]`,
        position.x,
        position.y,
        '#c084fc',
        0.2,
        true,
        eventIndex
      );
    } else if (event.type === 'BURNOUT_STUNNED') {
      const position = combatantCenter(previousState, event.actorId);
      addFloatingText(
        '⚡ STUNNED (OVERHEAT)',
        position.x,
        position.y,
        '#ef4444',
        0.2,
        true,
        eventIndex
      );
    }
  }
}
