/**
 * Canvas renderer coordinator.
 * Reads game state and UI state, executes HD-2D Layered Compositor render loop.
 * Coordinates screen shake translations, pre-blurred depth-of-field layers, hit-stop, and zero state mutation.
 */

import { BattleState } from '../core/types';
import { LAYOUT } from './theme';
import { UIState, ReplayHUDState } from './drawUI';
import { LayerCompositor, LayerId } from './compositor';

export class BattleCanvasRenderer {
  private ctx: CanvasRenderingContext2D;
  private compositor: LayerCompositor;

  constructor(private canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to get 2D canvas context');
    }
    this.ctx = context;
    this.setupDPI();
    this.compositor = new LayerCompositor();
  }

  private setupDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = LAYOUT.canvasWidth * dpr;
    this.canvas.height = LAYOUT.canvasHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  public getCompositor(): LayerCompositor {
    return this.compositor;
  }

  public toggleLayer(id: LayerId): boolean {
    return this.compositor.toggleLayer(id);
  }

  public togglePostProcessing(): boolean {
    this.compositor.postProcessingEnabled = !this.compositor.postProcessingEnabled;
    return this.compositor.postProcessingEnabled;
  }

  public togglePerfOverlay(): boolean {
    this.compositor.debugShowPerf = !this.compositor.debugShowPerf;
    return this.compositor.debugShowPerf;
  }

  public render(
    state: BattleState,
    uiState: UIState,
    isPlayerTurn: boolean,
    selectedTargetId: string | null,
    hoveredTargetId: string | null,
    replayHUDState?: ReplayHUDState | null
  ): void {
    this.compositor.render(
      this.ctx,
      state,
      uiState,
      isPlayerTurn,
      selectedTargetId,
      hoveredTargetId,
      replayHUDState
    );
  }
}
