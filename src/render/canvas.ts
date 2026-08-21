/**
 * Canvas renderer coordinator.
 * Reads game state and UI state, executes hand-rolled Canvas 2D render loop.
 * Coordinates screen shake translations, hit-stop, and zero state mutation.
 */

import { BattleState } from '../core/types';
import { LAYOUT, THEME } from './theme';
import { drawTurnQueue } from './drawTurnQueue';
import { drawCombatants } from './drawCombatants';
import { drawUI, UIState, ReplayHUDState } from './drawUI';
import { drawEffects, getScreenShakeOffset } from './drawFx';

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

    // 2. Clear background
    ctx.fillStyle = THEME.bg;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 3. Draw subtle tactical grid background
    this.drawBackgroundGrid(ctx, canvasWidth, canvasHeight);

    // 4. Draw Top Turn Queue Bar
    drawTurnQueue(ctx, state);

    // 5. Draw Combatants Arena (Party & Enemies with distinct geometric silhouettes)
    drawCombatants(ctx, state, selectedTargetId, hoveredTargetId);

    // 6. Draw Bottom UI Console, Replay HUD & Combat Log
    drawUI(ctx, state, uiState, isPlayerTurn, replayHUDState);

    // 7. Draw Floating Combat Text, Beams, Shards & Full-screen Flash
    drawEffects(ctx, deltaTime);

    ctx.restore();
  }

  private drawBackgroundGrid(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    ctx.save();
    ctx.strokeStyle = '#0c101a';
    ctx.lineWidth = 1;
    const gridSize = 32;

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}
