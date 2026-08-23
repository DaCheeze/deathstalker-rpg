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
import { createRng, type SerializableRng } from '../core/random';
import { globalAudio } from '../audio/synth';
import {
  getPrototypeMainCommands,
  toggleCombatLogOverlay,
  UIState,
} from '../render/drawUI';
import { getContextualMenuBounds, getEnemyCardBounds, LAYOUT } from '../render/theme';
import { CombatFeedbackCoordinator } from './combatFeedbackCoordinator';
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
  private isSuspended = false;
  private currentEncounterIndex = 0;
  private encounterGeneration = 0;
  private readonly feedbackCoordinator = new CombatFeedbackCoordinator();
  private rng: SerializableRng = createRng(12345);

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
    if (this.isSuspended || this.state.status !== 'in_progress' || this.isProcessingEnemyTurn) {
      return false;
    }
    return this.state.partyIds.includes(this.state.activeActorId);
  }

  public advanceFeedback(deltaTimeMs: number): void {
    this.feedbackCoordinator.advance(deltaTimeMs);
  }

  public resetFeedback(): void {
    this.feedbackCoordinator.reset();
  }

  /** Pauses live battle input and invalidates any queued enemy callback. */
  public suspend(): void {
    if (this.isSuspended) return;
    this.isSuspended = true;
    this.encounterGeneration += 1;
    this.isProcessingEnemyTurn = false;
    this.feedbackCoordinator.reset();
  }

  /** Restores live input and safely reschedules an interrupted enemy turn. */
  public resume(): void {
    if (!this.isSuspended) return;
    this.isSuspended = false;
    this.checkAndProcessEnemyTurn();
  }

  private startEncounter(index: number): BattleState {
	this.rng = createRng(12345 + index);
    this.encounterGeneration += 1;
    this.feedbackCoordinator.reset();

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
      if (this.isSuspended) return;

      if (type === 'RESTART') {
        globalAudio.playMenuConfirm();
        this.state = this.startEncounter(this.currentEncounterIndex);
        return;
      }

      if (type === 'LOG_TOGGLE') {
        toggleCombatLogOverlay();
        return;
      }

      if (type === 'CLICK' && this.handleHeaderClick(payload as CanvasClickEvent)) {
        return;
      }

      if (this.state.status !== 'in_progress') {
        if (type === 'CONFIRM' || type === 'SPACE' || type === 'CLICK') {
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

  private handleHeaderClick(event: CanvasClickEvent): boolean {
    const { canvasX, canvasY } = event;
    const { canvasWidth } = LAYOUT;
    const isHeaderY = canvasY >= 5 && canvasY <= 30;
    if (!isHeaderY) return false;

    if (canvasX >= canvasWidth - 160 && canvasX <= canvasWidth - 10) {
      globalAudio.toggleMute();
      return true;
    }

    if (canvasX >= canvasWidth / 2 - 150 && canvasX <= canvasWidth / 2 + 150) {
      globalAudio.playMenuConfirm();
      this.state = this.startEncounter(this.currentEncounterIndex);
      return true;
    }

    return false;
  }

  private handleNumericInput(num: number): void {
    const actor = this.state.combatants[this.state.activeActorId];
    if (!actor) return;

    if (this.uiState.menuMode === 'main') {
      if (this.state.battleMode === 'range_band_prototype') {
        const command = getPrototypeMainCommands(this.state, actor)[num - 1];
        if (!command) {
          globalAudio.playMenuCancel();
          return;
        }

        if (command.id === 'melee' && actor.engagedTargetId) {
          const meleeAttacks = actor.abilityIds
            .map((id) => this.state.abilities[id])
            .filter((ability) => ability?.category === 'melee');
          globalAudio.playMenuConfirm();
          if (meleeAttacks.length === 1 && meleeAttacks[0]) {
            this.dispatchAction({
              type: 'Attack',
              actorId: actor.id,
              targetId: actor.engagedTargetId,
              abilityId: meleeAttacks[0].id,
            });
          } else {
            this.uiState.menuMode = 'attack_select';
          }
        } else if (command.id === 'disruptor') {
          globalAudio.playMenuConfirm();
          this.uiState.pendingActionType = 'Disruptor';
          this.uiState.selectedTargetId = null;
          this.uiState.menuMode = 'target_select';
        } else if (command.id === 'advance') {
          globalAudio.playMenuConfirm();
          if (actor.rangeBand === 'ranged') {
            this.dispatchAction({ type: 'Advance', actorId: actor.id });
          } else {
            this.uiState.pendingActionType = 'Advance';
            this.uiState.selectedTargetId = null;
            this.uiState.menuMode = 'target_select';
          }
        } else if (command.id === 'pass') {
          globalAudio.playMenuConfirm();
          this.dispatchAction({ type: 'PassTurn', actorId: actor.id });
        }
        return;
      }

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
        .filter((a) => a && (
          this.state.battleMode === 'range_band_prototype'
            ? a.category === 'melee'
            : a.category === 'melee' || a.category === 'projectile'
        ));
      const chosen = attacks[num - 1];
      if (chosen) {
        globalAudio.playMenuConfirm();
        if (this.state.battleMode === 'range_band_prototype' && actor.engagedTargetId) {
          this.dispatchAction({
            type: 'Attack',
            actorId: actor.id,
            targetId: actor.engagedTargetId,
            abilityId: chosen.id,
          });
          this.uiState.menuMode = 'main';
          return;
        }
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
          if (this.state.battleMode === 'range_band_prototype') {
            globalAudio.playMenuCancel();
            return;
          }
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
            const btnIdx = Math.floor((canvasY - bounds.y) / 32);
            if (btnIdx >= 0 && btnIdx <= 5 && canvasY - bounds.y - btnIdx * 32 <= 26) {
              this.handleNumericInput(btnIdx + 1);
            }
          } else if (this.uiState.menuMode === 'attack_select' || this.uiState.menuMode === 'esper_select') {
            const btnIdx = Math.floor((canvasY - (bounds.y + 32)) / 32);
            if (btnIdx >= 0 && btnIdx <= 5 && canvasY - (bounds.y + 32) - btnIdx * 32 <= 26) {
              this.handleNumericInput(btnIdx + 1);
            }
          } else if (this.uiState.menuMode === 'target_select') {
            const btnIdx = Math.floor((canvasY - (bounds.y + 32)) / 32);
            if (btnIdx >= 0 && btnIdx <= 5 && canvasY - (bounds.y + 32) - btnIdx * 32 <= 26) {
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
            const relativeY = canvasY - bounds.y;
            const index = Math.floor(relativeY / 32);
            this.uiState.hoveredIndex = relativeY - index * 32 <= 26 ? index : -1;
          } else if (this.uiState.menuMode === 'attack_select' || this.uiState.menuMode === 'esper_select') {
            const relativeY = canvasY - (bounds.y + 32);
            const index = Math.floor(relativeY / 32);
            this.uiState.hoveredIndex = relativeY >= 0 && relativeY - index * 32 <= 26 ? index : -1;
          } else if (this.uiState.menuMode === 'target_select') {
            const relativeY = canvasY - (bounds.y + 32);
            const index = Math.floor(relativeY / 32);
            this.uiState.hoveredIndex = relativeY >= 0 && relativeY - index * 32 <= 26 ? index : -1;
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
    } else if (pendingActionType === 'Advance') {
      this.dispatchAction({ type: 'Advance', actorId, targetId });
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
    this.state = applyAction(this.state, action, this.rng);
    this.feedbackCoordinator.spawn(prevState, action, this.state, { showActionBanner: true });
    this.checkAndProcessEnemyTurn();
  }

  private checkAndProcessEnemyTurn(): void {
    if (this.isSuspended || this.state.status !== 'in_progress') {
      this.isProcessingEnemyTurn = false;
      return;
    }

    const nextActorId = this.state.activeActorId;
    const isNextParty = this.state.partyIds.includes(nextActorId);

    if (!isNextParty) {
      this.isProcessingEnemyTurn = true;
      const scheduledGeneration = this.encounterGeneration;
      setTimeout(() => {
        if (scheduledGeneration !== this.encounterGeneration || this.isSuspended) return;
        if (this.state.status === 'in_progress' && !this.state.partyIds.includes(this.state.activeActorId)) {
          const enemyAction = chooseEnemyAction(this.state, this.state.activeActorId, this.rng);
          const prevState = this.state;
          this.state = applyAction(this.state, enemyAction, this.rng);
          this.feedbackCoordinator.spawn(prevState, enemyAction, this.state, { showActionBanner: true });

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

}
