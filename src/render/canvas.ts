/**
 * Canvas renderer coordinator.
 * Reads game state and UI state, executes HD-2D Layered Compositor render loop.
 * Coordinates screen shake translations, pre-blurred depth-of-field layers, hit-stop, and zero state mutation.
 * Renders natively at 1920×1080 design resolution.
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
    this.setupResolution();
    this.compositor = new LayerCompositor();
  }

  /**
   * Set canvas bitmap to native design resolution (1920×1080).
   * CSS handles display scaling to fit viewport.
   * No DPR multiplication — we render at the target resolution directly.
   */
  private setupResolution(): void {
    this.canvas.width = LAYOUT.canvasWidth;
    this.canvas.height = LAYOUT.canvasHeight;
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
