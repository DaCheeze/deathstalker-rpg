/**
 * Battle Controller & Presentation Glue.
 * Bridges input events, core state updates, visual FX triggers, hit-stop, audio, and AI turn pacing.
 */

import {
  AbilityDefinition,
  BattleAction,
  BattleState,
  Combatant,
  EncounterDefinition,
} from '../core/types';
import { applyAction, initBattle, isEspBlocked } from '../core/battle';
import { chooseEnemyAction } from '../core/ai';
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
import { toggleCombatLogOverlay, triggerActionBanner, UIState } from '../render/drawUI';
import { getContextualMenuBounds, getEnemyCardBounds, getPartyCombatantBounds, LAYOUT } from '../render/theme';
import { CanvasClickEvent, InputManager } from './input';

export class BattleController {
  private state: BattleState;
  private uiState: UIState = {
    menuMode: 'main',
    pendingActionType: null,
    selectedAbilityId: null,
    selectedTargetId: null,
    hoveredIndex: -1,
  };
  private isProcessingEnemyTurn = false;
  private currentEncounterIndex = 0;

  constructor(
    private partyData: Combatant[],
    private enemiesData: Record<string, Combatant>,
    private abilitiesData: Record<string, AbilityDefinition>,
    private encountersList: EncounterDefinition[],
    private input: InputManager
  ) {
    this.state = this.startEncounter(this.currentEncounterIndex);
    this.bindInputs();
  }

  public getState(): BattleState {
    return this.state;
  }

  public getUIState(): UIState {
    return this.uiState;
  }

  public isPlayerTurn(): boolean {
    if (this.state.status !== 'in_progress' || this.isProcessingEnemyTurn) {
      return false;
    }
    return this.state.partyIds.includes(this.state.activeActorId);
  }

  private startEncounter(index: number): BattleState {
    const enc = this.encountersList[index % this.encountersList.length] as EncounterDefinition;
    const party = this.partyData.map((p) => ({
      ...p,
      stats: { ...p.stats },
      abilityIds: [...p.abilityIds],
    }));

    const enemies = enc.enemyIds.map((enemyId, idx) => {
      const template = this.enemiesData[enemyId];
      if (!template) {
        throw new Error(`Enemy definition not found: ${enemyId}`);
      }
      return {
        ...template,
        id: `${enemyId}_${idx}`,
        name: enc.enemyIds.filter((id) => id === enemyId).length > 1 ? `${template.name} ${String.fromCharCode(65 + idx)}` : template.name,
        stats: { ...template.stats },
        abilityIds: [...template.abilityIds],
      };
    });

    this.uiState = {
      menuMode: 'main',
      pendingActionType: null,
      selectedAbilityId: null,
      selectedTargetId: null,
      hoveredIndex: -1,
    };
    this.isProcessingEnemyTurn = false;

    return initBattle(party, enemies, this.abilitiesData, enc);
  }

  private bindInputs(): void {
    this.input.onInput((type, payload) => {
      if (type === 'LOG_TOGGLE') {
        toggleCombatLogOverlay();
        return;
      }

      if (this.state.status !== 'in_progress') {
        if (type === 'CONFIRM' || type === 'CLICK') {
          globalAudio.playMenuConfirm();
          this.currentEncounterIndex = (this.currentEncounterIndex + 1) % this.encountersList.length;
          this.state = this.startEncounter(this.currentEncounterIndex);
        }
        return;
      }

      if (!this.isPlayerTurn()) {
        return;
      }

      switch (type) {
        case 'NUMKEY':
          this.handleNumericInput(payload as number);
          break;
        case 'CANCEL':
          this.handleCancel();
          break;
        case 'CLICK':
          this.handleClick(payload as CanvasClickEvent);
          break;
        case 'MOUSEMOVE':
          this.handleMouseMove(payload as CanvasClickEvent);
          break;
      }
    });
  }

  private handleNumericInput(num: number): void {
    const actor = this.state.combatants[this.state.activeActorId];
    if (!actor) return;

    if (this.uiState.menuMode === 'main') {
      const isCrashed = actor.crashTurns > 0;

      if (isCrashed) {
        if (num === 1 || num === 6) {
          globalAudio.playMenuConfirm();
          this.dispatchAction({ type: 'PassTurn', actorId: actor.id });
        } else {
          globalAudio.playMenuCancel();
        }
        return;
      }

      if (num === 1) {
        globalAudio.playMenuConfirm();
        const attacks = actor.abilityIds
          .map((id) => this.state.abilities[id])
          .filter((a) => a && (a.category === 'melee' || a.category === 'projectile'));
        if (attacks.length === 1 && attacks[0]) {
          this.uiState.pendingActionType = 'Attack';
          this.uiState.selectedAbilityId = attacks[0].id;
          this.uiState.selectedTargetId = attacks[0].targetScope === 'all_enemies' ? 'ALL_ENEMIES' : null;
          this.uiState.menuMode = 'target_select';
        } else {
          this.uiState.menuMode = 'attack_select';
        }
      } else if (num === 2 && actor.disruptorCooldown === 0) {
        globalAudio.playMenuConfirm();
        this.uiState.pendingActionType = 'Disruptor';
        this.uiState.selectedTargetId = null;
        this.uiState.menuMode = 'target_select';
      } else if (num === 3 && !actor.hasForceShield) {
        globalAudio.playMenuConfirm();
        this.dispatchAction({ type: 'RaiseShield', actorId: actor.id });
      } else if (num === 4 && actor.canBoost) {
        globalAudio.playMenuConfirm();
        this.dispatchAction({ type: 'ToggleBoost', actorId: actor.id, enable: !actor.isBoosting });
      } else if (num === 5 && !isEspBlocked(this.state) && actor.stats.esp > 0) {
        globalAudio.playMenuConfirm();
        this.uiState.menuMode = 'esper_select';
      } else if (num === 6) {
        globalAudio.playMenuConfirm();
        this.dispatchAction({ type: 'PassTurn', actorId: actor.id });
      } else {
        globalAudio.playMenuCancel();
      }
    } else if (this.uiState.menuMode === 'attack_select') {
      const attacks = actor.abilityIds
        .map((id) => this.state.abilities[id])
        .filter((a) => a && (a.category === 'melee' || a.category === 'projectile'));
      const chosen = attacks[num - 1];
      if (chosen) {
        globalAudio.playMenuConfirm();
        this.uiState.pendingActionType = 'Attack';
        this.uiState.selectedAbilityId = chosen.id;
        this.uiState.selectedTargetId = chosen.targetScope === 'all_enemies' ? 'ALL_ENEMIES' : null;
        this.uiState.menuMode = 'target_select';
      } else {
        globalAudio.playMenuCancel();
      }
    } else if (this.uiState.menuMode === 'esper_select') {
      const espers = actor.abilityIds
        .map((id) => this.state.abilities[id])
        .filter((a) => a && a.category === 'esper');
      const chosen = espers[num - 1];
      if (chosen && actor.stats.esp >= chosen.espCost) {
        globalAudio.playMenuConfirm();
        this.uiState.pendingActionType = 'EsperAbility';
        this.uiState.selectedAbilityId = chosen.id;
        this.uiState.selectedTargetId = chosen.targetScope === 'all_enemies' ? 'ALL_ENEMIES' : null;
        this.uiState.menuMode = 'target_select';
      } else {
        globalAudio.playMenuCancel();
      }
    } else if (this.uiState.menuMode === 'target_select') {
      const livingEnemies = this.state.enemyIds
        .map((id) => this.state.combatants[id])
        .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);
      const target = livingEnemies[num - 1];
      if (target) {
        globalAudio.playMenuConfirm();
        this.executePendingActionOnTarget(target.id);
      } else {
        globalAudio.playMenuCancel();
      }
    }
  }

  private handleCancel(): void {
    if (this.uiState.menuMode !== 'main') {
      globalAudio.playMenuCancel();
      this.uiState.menuMode = 'main';
      this.uiState.pendingActionType = null;
      this.uiState.selectedAbilityId = null;
      this.uiState.selectedTargetId = null;
    }
  }

  private handleClick(event: CanvasClickEvent): void {
    const { canvasX, canvasY } = event;
    const { canvasWidth } = LAYOUT;

    // Check Audio Mute button click (Top right)
    if (canvasX >= canvasWidth - 160 && canvasX <= canvasWidth - 10 && canvasY >= 5 && canvasY <= 30) {
      globalAudio.toggleMute();
      return;
    }

    const enemyCount = this.state.enemyIds.length;

    // Check if clicked an enemy on battlefield
    for (let idx = 0; idx < this.state.enemyIds.length; idx++) {
      const enemyId = this.state.enemyIds[idx] as string;
      const enemy = this.state.combatants[enemyId];
      if (!enemy || enemy.stats.hp <= 0) continue;

      const bounds = getEnemyCardBounds(enemyCount, idx);
      if (
        canvasX >= bounds.x &&
        canvasX <= bounds.x + bounds.w &&
        canvasY >= bounds.y &&
        canvasY <= bounds.y + bounds.h
      ) {
        if (this.uiState.menuMode === 'target_select') {
          globalAudio.playMenuConfirm();
          this.executePendingActionOnTarget(enemy.id);
          return;
        } else {
          // Default to primary attack
          this.uiState.pendingActionType = 'Attack';
          const actor = this.state.combatants[this.state.activeActorId];
          const firstAtk = actor?.abilityIds[0];
          if (firstAtk) {
            globalAudio.playMenuConfirm();
            this.uiState.selectedAbilityId = firstAtk;
            this.executePendingActionOnTarget(enemy.id);
            return;
          }
        }
      }
    }

    // Check if clicked in Contextual Command Menu
    if (this.isPlayerTurn()) {
      const activePartyIdx = this.state.partyIds.indexOf(this.state.activeActorId);
      if (activePartyIdx !== -1) {
        const bounds = getContextualMenuBounds(activePartyIdx, this.state.partyIds.length);
        if (
          canvasX >= bounds.x &&
          canvasX <= bounds.x + bounds.w &&
          canvasY >= bounds.y &&
          canvasY <= bounds.y + bounds.h
        ) {
          if (this.uiState.menuMode === 'main') {
            const btnIdx = Math.floor((canvasY - (bounds.y + 26)) / 24);
            if (btnIdx >= 0 && btnIdx <= 5) {
              this.handleNumericInput(btnIdx + 1);
            }
          } else if (this.uiState.menuMode === 'attack_select' || this.uiState.menuMode === 'esper_select') {
            const btnIdx = Math.floor((canvasY - (bounds.y + 34)) / 30);
            if (btnIdx >= 0 && btnIdx <= 5) {
              this.handleNumericInput(btnIdx + 1);
            }
          } else if (this.uiState.menuMode === 'target_select') {
            const btnIdx = Math.floor((canvasY - (bounds.y + 34)) / 27);
            if (btnIdx >= 0 && btnIdx <= 5) {
              this.handleNumericInput(btnIdx + 1);
            }
          }
        }
      }
    }
  }

  private handleMouseMove(event: CanvasClickEvent): void {
    const { canvasX, canvasY } = event;
    const enemyCount = this.state.enemyIds.length;

    // Check hovering enemy
    this.uiState.selectedTargetId = null;

    for (let idx = 0; idx < this.state.enemyIds.length; idx++) {
      const enemyId = this.state.enemyIds[idx] as string;
      const enemy = this.state.combatants[enemyId];
      if (!enemy || enemy.stats.hp <= 0) continue;

      const bounds = getEnemyCardBounds(enemyCount, idx);
      if (
        canvasX >= bounds.x &&
        canvasX <= bounds.x + bounds.w &&
        canvasY >= bounds.y &&
        canvasY <= bounds.y + bounds.h
      ) {
        this.uiState.selectedTargetId = enemy.id;
        break;
      }
    }

    // Check hovering Contextual Command Menu
    if (this.isPlayerTurn()) {
      const activePartyIdx = this.state.partyIds.indexOf(this.state.activeActorId);
      if (activePartyIdx !== -1) {
        const bounds = getContextualMenuBounds(activePartyIdx, this.state.partyIds.length);
        const prevHover = this.uiState.hoveredIndex;

        if (
          canvasX >= bounds.x &&
          canvasX <= bounds.x + bounds.w &&
          canvasY >= bounds.y &&
          canvasY <= bounds.y + bounds.h
        ) {
          if (this.uiState.menuMode === 'main') {
            this.uiState.hoveredIndex = Math.floor((canvasY - (bounds.y + 26)) / 24);
          } else if (this.uiState.menuMode === 'attack_select' || this.uiState.menuMode === 'esper_select') {
            this.uiState.hoveredIndex = Math.floor((canvasY - (bounds.y + 34)) / 30);
          } else if (this.uiState.menuMode === 'target_select') {
            this.uiState.hoveredIndex = Math.floor((canvasY - (bounds.y + 34)) / 27);
          }

          if (
            prevHover !== this.uiState.hoveredIndex &&
            this.uiState.hoveredIndex >= 0 &&
            this.uiState.hoveredIndex <= 5
          ) {
            globalAudio.playMenuMove();
          }
        } else {
          this.uiState.hoveredIndex = -1;
        }
      }
    } else {
      this.uiState.hoveredIndex = -1;
    }
  }

  private executePendingActionOnTarget(targetId: string): void {
    const actorId = this.state.activeActorId;
    const { pendingActionType, selectedAbilityId } = this.uiState;

    if (pendingActionType === 'Disruptor') {
      this.dispatchAction({ type: 'Disruptor', actorId, targetId });
    } else if (pendingActionType === 'Attack' && selectedAbilityId) {
      this.dispatchAction({ type: 'Attack', actorId, targetId, abilityId: selectedAbilityId });
    } else if (pendingActionType === 'EsperAbility' && selectedAbilityId) {
      this.dispatchAction({ type: 'EsperAbility', actorId, targetId, abilityId: selectedAbilityId });
    }

    this.uiState.menuMode = 'main';
    this.uiState.pendingActionType = null;
    this.uiState.selectedAbilityId = null;
    this.uiState.selectedTargetId = null;
  }

  private dispatchAction(action: BattleAction): void {
    const prevState = this.state;
    this.state = applyAction(this.state, action);
    this.spawnFeedbackForAction(prevState, action, this.state);
    this.checkAndProcessEnemyTurn();
  }

  private checkAndProcessEnemyTurn(): void {
    if (this.state.status !== 'in_progress') {
      return;
    }

    const nextActorId = this.state.activeActorId;
    const isNextParty = this.state.partyIds.includes(nextActorId);

    if (!isNextParty) {
      this.isProcessingEnemyTurn = true;
      setTimeout(() => {
        if (this.state.status === 'in_progress' && !this.state.partyIds.includes(this.state.activeActorId)) {
          const enemyAction = chooseEnemyAction(this.state, this.state.activeActorId);
          const prevState = this.state;
          this.state = applyAction(this.state, enemyAction);
          this.spawnFeedbackForAction(prevState, enemyAction, this.state);

          this.isProcessingEnemyTurn = false;
          this.checkAndProcessEnemyTurn();
        } else {
          this.isProcessingEnemyTurn = false;
        }
      }, 650);
    } else {
      this.isProcessingEnemyTurn = false;
    }
  }

  private spawnFeedbackForAction(
    prevState: BattleState,
    action: BattleAction,
    nextState: BattleState
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

    // Floating action banner trigger
    if (action.type === 'Attack') {
      const ab = prevState.abilities[action.abilityId];
      triggerActionBanner(ab ? ab.name : 'Weapon Strike', '#38bdf8');
    } else if (action.type === 'Disruptor') {
      triggerActionBanner('DISRUPTOR CANNON', '#34d399');
    } else if (action.type === 'RaiseShield') {
      triggerActionBanner('FORCE SHIELD', '#38bdf8');
    } else if (action.type === 'ToggleBoost') {
      triggerActionBanner(action.enable ? 'BOOST INJECTED' : 'BOOST VENTED', '#fbbf24');
    } else if (action.type === 'EsperAbility') {
      const ab = prevState.abilities[action.abilityId];
      triggerActionBanner(ab ? ab.name : 'Psionic Focus', '#c084fc');
    }

    // Audio triggers
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

    for (let i = 0; i < nextState.recentEvents.length; i++) {
      const ev = nextState.recentEvents[i]!;

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

        // Action-specific animations
        if (ev.isDisruptor) {
          addDisruptorSequence(actorX, actorY, targetX, targetY, '#34d399');
          triggerScreenShake(FEEDBACK_CONFIG.shakeDisruptorMagnitude, FEEDBACK_CONFIG.shakeDisruptorDurationMs);
          triggerScreenFlash('rgba(52, 211, 153, 0.4)', FEEDBACK_CONFIG.flashDurationMs);
          triggerHitStop(FEEDBACK_CONFIG.hitStopDisruptorMs);
          addFloatingText(`⚡ DISRUPTOR: -${ev.damage}!`, targetX, targetY - 18, '#34d399', dmgPct, true, i);
        } else {
          const ability = action.type === 'Attack' ? prevState.abilities[action.abilityId] : action.type === 'EsperAbility' ? prevState.abilities[action.abilityId] : null;

          if (ability?.category === 'melee') {
            // Melee: Attacker lunges forward towards target
            triggerCombatantLunge(action.actorId, actorX, actorY, targetX, targetY, FEEDBACK_CONFIG.lungeDurationMs);
          } else if (ability?.category === 'projectile') {
            // Ranged projectile: Plasma/carbine bolt travels across canvas
            const isScatter = action.type === 'Attack' && action.abilityId === 'scatter_shot';
            addProjectile(actorX, actorY, targetX, targetY, isScatter ? '#fbbf24' : '#38bdf8', isScatter);
          } else if (ability?.category === 'esper') {
            // Psionic ripple wave distortion
            addPsionicWave(actorX, actorY, targetX, targetY, '#c084fc');
          }

          if (ev.shieldAbsorbed) {
            addShieldShatterParticles(targetX, targetY, '#38bdf8', 16);
            globalAudio.playShieldShatter();
            addFloatingText('🛡️ SHIELD BLOCKED!', targetX, targetY - 12, '#38bdf8', 0.1, false, i);
          } else {
            if (ev.isCrit) {
              globalAudio.playCritHit();
              triggerScreenShake(FEEDBACK_CONFIG.shakeCritMagnitude, FEEDBACK_CONFIG.shakeCritDurationMs);
              triggerHitStop(FEEDBACK_CONFIG.hitStopCritMs);
            } else {
              triggerHitStop(FEEDBACK_CONFIG.hitStopNormalMs);
            }

            const color = ev.isCrit ? '#fbbf24' : '#ef4444';
            const text = ev.isCrit ? `CRIT! -${ev.damage}` : `-${ev.damage}`;
            addFloatingText(text, targetX, targetY - 10, color, dmgPct, ev.isCrit, i);
          }
        }

        // Flinch
        triggerCombatantFlinch(ev.targetId, ev.isDisruptor ? FEEDBACK_CONFIG.flinchDistanceHeavy : FEEDBACK_CONFIG.flinchDistanceNormal);

        // Death Dissolution Particles
        if (ev.targetKilled) {
          const targetAccent = target?.accentColor || '#ef4444';
          addDeathDissolution(targetX, targetY, targetAccent, target?.stats.maxHp ? target.stats.maxHp / 100 : 1.0);
          globalAudio.playDeath();
        }
      } else if (ev.type === 'BURNOUT_CHIP_DAMAGE') {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const bounds = getPartyCombatantBounds(prevState.partyIds.length, partyIdx);
          addFloatingText(`🔥 BURNOUT -${ev.damage}`, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.44, '#f97316', 0.1, false, i);
        }
      } else if (ev.type === 'BOOST_CRASHED') {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const bounds = getPartyCombatantBounds(prevState.partyIds.length, partyIdx);
          addFloatingText(`CRASH [${ev.crashTurns}T RECOVERY]`, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.44, '#c084fc', 0.2, true, i);
        }
      } else if (ev.type === 'BURNOUT_STUNNED') {
        const partyIdx = prevState.partyIds.indexOf(ev.actorId);
        if (partyIdx !== -1) {
          const bounds = getPartyCombatantBounds(prevState.partyIds.length, partyIdx);
          addFloatingText(`⚡ STUNNED (OVERHEAT)`, bounds.x + bounds.w / 2, bounds.y + bounds.h * 0.44, '#ef4444', 0.2, true, i);
        }
      }
    }

    if (nextState.status === 'victory' && prevState.status === 'in_progress') {
      globalAudio.playVictory();
    } else if (nextState.status === 'defeat' && prevState.status === 'in_progress') {
      globalAudio.playDefeat();
    }
  }
}
