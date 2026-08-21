/**
 * Canvas renderer coordinator.
 * Reads game state and UI state, executes hand-rolled Canvas 2D render loop.
 * Coordinates screen shake translations, battlefield environment, hit-stop, and zero state mutation.
 */

import { BattleState } from '../core/types';
import { LAYOUT } from './theme';
import { drawTurnQueue } from './drawTurnQueue';
import { drawCombatants } from './drawCombatants';
import { drawUI, UIState, ReplayHUDState } from './drawUI';
import { drawBattlefieldEnvironment, drawEffects, getScreenShakeOffset } from './drawFx';

export class BattleCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private lastRenderTime: number = performance.now();

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;
    this.setupDPI();
  }

  private setupDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = LAYOUT.canvasWidth * dpr;
    this.canvas.height = LAYOUT.canvasHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public render(
    state: BattleState,
    uiState: UIState,
    isPlayerTurn: boolean,
    selectedTargetId: string | null,
    hoveredTargetId: string | null,
    replayHUDState?: ReplayHUDState | null
  ): void {
    const { ctx } = this;
    const { canvasWidth, canvasHeight } = LAYOUT;

    const now = performance.now();
    const deltaTime = Math.min(50, now - this.lastRenderTime);
    this.lastRenderTime = now;

    // 1. Calculate Screen Shake translation
    const shake = getScreenShakeOffset(deltaTime);

    ctx.save();
    if (shake.x !== 0 || shake.y !== 0) {
      ctx.translate(shake.x, shake.y);
    }

    // 2. Draw Battlefield Environment (Parallax Starfield, Atmospheric Tint, Deck Horizon)
    drawBattlefieldEnvironment(ctx, state.encounterId || 'enc_empire_skirmish', canvasWidth, canvasHeight, deltaTime);

    // 3. Draw Top Turn Queue Bar (Clean, receding)
    drawTurnQueue(ctx, state);

    // 4. Draw Combatants Arena (Dominant Enemy front line + Party status strip)
    drawCombatants(ctx, state, selectedTargetId, hoveredTargetId);

    // 5. Draw UI Console, Command Menu, Replay HUD & Combat Log
    drawUI(ctx, state, uiState, isPlayerTurn, replayHUDState);

    // 6. Draw Combat Effects (Projectiles, Beams, Dissolution Shards, Floating Numbers, Screen Flash)
    drawEffects(ctx, deltaTime);

    ctx.restore();
  }
}
