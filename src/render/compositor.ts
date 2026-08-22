/**
 * HD-2D Layered Compositor for Deathstalker RPG.
 * Implements the Octopath Traveler style shallow-focus diorama:
 * - 9 explicit layers in an immutable ordered array
 * - Pre-blurred and cached static depth-of-field layers (zero per-frame blur)
 * - Half-resolution bloom pass fed strictly by the emissive pass
 * - Per-zone color grading and mechanic-driven post-processing
 * - Parallax depth differential hooked to screen shake and hit-stop
 * - Frame-time instrumentation and graceful degradation for replays
 */

import { BattleState } from '../core/types';
import { LAYOUT, THEME, getEnemyCardBounds, getPartyCombatantBounds } from './theme';
import { FEEDBACK_CONFIG } from './feedbackConfig';
import { drawTurnQueue } from './drawTurnQueue';
import { drawEnemyUnits, drawPartyUnits, drawPartyStatusCards } from './drawCombatants';
import { drawUI, UIState, ReplayHUDState } from './drawUI';
import {
  drawEffects,
  getScreenShakeOffset,
  isHitStopActive,
} from './drawFx';
import { AssetManager } from './assetManifest';
import encountersJson from '../data/encounters.json';
import { EncounterDefinition } from '../core/types';

export type LayerId =
  | 'starfield_void'
  | 'far_backdrop'
  | 'stage_floor'
  | 'enemy_units'
  | 'party_units'
  | 'emissive_pass'
  | 'foreground_occluders'
  | 'post_processing'
  | 'ui_and_menus';

/**
 * Mandatory explicit layer order as specified in AGENTS.md.
 * Back to front. Verified by unit tests.
 */
export const LAYER_ORDER: readonly LayerId[] = [
  'starfield_void',
  'far_backdrop',
  'stage_floor',
  'enemy_units',
  'party_units',
  'emissive_pass',
  'foreground_occluders',
  'post_processing',
  'ui_and_menus',
] as const;

export interface LayerConfig {
  id: LayerId;
  name: string;
  isStatic: boolean;
  parallaxMultiplier: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  enabled: boolean;
}

export interface CompositorPerformanceMetrics {
  currentFrameTimeMs: number;
  avgFrameTimeMs: number;
  worstFrameTimeMs: number;
  fps: number;
}

export class LayerCompositor {
  private width: number = LAYOUT.canvasWidth;
  private height: number = LAYOUT.canvasHeight;
  private layers: Map<LayerId, LayerConfig> = new Map();

  // Bloom 1/8-resolution buffers (bilinear upscale IS the blur)
  private bloomCanvas: HTMLCanvasElement;
  private bloomCtx: CanvasRenderingContext2D;

  // Cached combined grade+vignette overlay (baked once per encounter, drawn as one image per frame)
  private gradeVignetteCanvas: HTMLCanvasElement;
  private gradeVignetteCtx: CanvasRenderingContext2D;
  private cachedGradeVignetteKey: string = '';

  // Cached static status
  private lastEncounterId: string = '';
  private staticLayersDirty: boolean = true;

  // Post-processing and debug toggles
  public postProcessingEnabled: boolean = true;
  public debugShowPerf: boolean = false;
  public debugLayerManager: boolean = false;

  // Performance telemetry
  private frameTimes: number[] = [];
  private worstFrameTimes: number[] = [];
  private lastWorstFrameReset: number = performance.now();
  private lastFrameTime: number = performance.now();
  private latestMetrics: CompositorPerformanceMetrics = {
    currentFrameTimeMs: 0,
    avgFrameTimeMs: 0,
    worstFrameTimeMs: 0,
    fps: 60,
  };

  // Ambient particles
  private ambientParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

  constructor() {
    this.initLayers();

    // Create quarter-resolution bloom canvas (bilinear upscale provides blur for free)
    this.bloomCanvas = document.createElement('canvas');
    this.bloomCanvas.width = Math.floor(this.width * FEEDBACK_CONFIG.bloomResolutionScale);
    this.bloomCanvas.height = Math.floor(this.height * FEEDBACK_CONFIG.bloomResolutionScale);
    const bCtx = this.bloomCanvas.getContext('2d');
    if (!bCtx) throw new Error('Failed to get bloom 2D context');
    this.bloomCtx = bCtx;

    // Create cached combined grade+vignette canvas (drawn as one image per frame)
    this.gradeVignetteCanvas = document.createElement('canvas');
    this.gradeVignetteCanvas.width = this.width;
    this.gradeVignetteCanvas.height = this.height;
    const gvCtx = this.gradeVignetteCanvas.getContext('2d');
    if (!gvCtx) throw new Error('Failed to get gradeVignette 2D context');
    this.gradeVignetteCtx = gvCtx;

    this.initAmbientParticles();
  }

  private initLayers(): void {
    const layerDefs: { id: LayerId; name: string; isStatic: boolean; parallax: number }[] = [
      { id: 'starfield_void', name: '1. Starfield Void', isStatic: true, parallax: 0.15 },
      { id: 'far_backdrop', name: '2. Far Backdrop', isStatic: true, parallax: 0.35 },
      { id: 'stage_floor', name: '3. Stage Floor', isStatic: true, parallax: 0.75 },
      { id: 'enemy_units', name: '4. Enemy Units', isStatic: false, parallax: 1.0 },
      { id: 'party_units', name: '5. Party Units', isStatic: false, parallax: 1.0 },
      { id: 'emissive_pass', name: '6. Emissive Pass', isStatic: false, parallax: 1.0 },
      { id: 'foreground_occluders', name: '7. Foreground Occluders', isStatic: true, parallax: 1.45 },
      { id: 'post_processing', name: '8. Post Processing (Bloom/Grade)', isStatic: false, parallax: 1.0 },
      { id: 'ui_and_menus', name: '9. UI & Menus', isStatic: false, parallax: 0.0 },
    ];

    for (const def of layerDefs) {
      const c = document.createElement('canvas');
      c.width = this.width;
      c.height = this.height;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error(`Failed to create 2D context for layer ${def.id}`);

      this.layers.set(def.id, {
        id: def.id,
        name: def.name,
        isStatic: def.isStatic,
        parallaxMultiplier: def.parallax,
        canvas: c,
        ctx,
        enabled: true,
      });
    }
  }

  private initAmbientParticles(): void {
    this.ambientParticles = [];
    for (let i = 0; i < FEEDBACK_CONFIG.ambientParticleCount; i++) {
      this.ambientParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: -0.15 - Math.random() * 0.3,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.5,
      });
    }
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    for (const layer of this.layers.values()) {
      layer.canvas.width = width;
      layer.canvas.height = height;
    }
    this.bloomCanvas.width = Math.floor(width * FEEDBACK_CONFIG.bloomResolutionScale);
    this.bloomCanvas.height = Math.floor(height * FEEDBACK_CONFIG.bloomResolutionScale);
    this.gradeVignetteCanvas.width = width;
    this.gradeVignetteCanvas.height = height;
    this.cachedGradeVignetteKey = '';
    this.staticLayersDirty = true;
  }

  public toggleLayer(id: LayerId): boolean {
    const l = this.layers.get(id);
    if (l) {
      l.enabled = !l.enabled;
      return l.enabled;
    }
    return false;
  }

  public setLayerEnabled(id: LayerId, enabled: boolean): void {
    const l = this.layers.get(id);
    if (l) l.enabled = enabled;
  }

  public enableAllLayers(): void {
    for (const l of this.layers.values()) {
      l.enabled = true;
    }
    this.postProcessingEnabled = true;
  }

  public getPerformanceMetrics(): CompositorPerformanceMetrics {
    return this.latestMetrics;
  }

  /**
   * Main render execution called each frame.
   */
  public render(
    mainCtx: CanvasRenderingContext2D,
    state: BattleState,
    uiState: UIState,
    isPlayerTurn: boolean,
    selectedTargetId: string | null,
    hoveredTargetId: string | null,
    replayHUDState?: ReplayHUDState | null
  ): void {
    const frameStart = performance.now();
    const deltaTimeMs = Math.min(50, frameStart - this.lastFrameTime);
    this.lastFrameTime = frameStart;

    const encounterId = state.encounterId || 'enc_empire_skirmish';
    if (encounterId !== this.lastEncounterId) {
      this.lastEncounterId = encounterId;
      this.staticLayersDirty = true;
    }

    // Hit-stop freezes animated progression
    const hitStop = isHitStopActive();
    const activeDelta = hitStop ? 0 : deltaTimeMs;

    // 1. Calculate Parallax and Screen Shake
    const shake = getScreenShakeOffset(activeDelta);

    // 2. Pre-render cached static layers if dirty (Starfield, Far Backdrop, Stage Floor, Occluders)
    if (this.staticLayersDirty) {
      this.bakeStaticLayers(encounterId);
      this.staticLayersDirty = false;
    }

    // 3. Clear dynamic layers
    this.clearDynamicLayers();

    // 4. Render Dynamic Layer 4: Enemy Units
    const enemyLayer = this.layers.get('enemy_units')!;
    if (enemyLayer.enabled) {
      this.renderEnemyUnits(enemyLayer.ctx, state, selectedTargetId, hoveredTargetId);
    }

    // 5. Render Dynamic Layer 5: Party Units (Grounded on battlefield)
    const partyLayer = this.layers.get('party_units')!;
    if (partyLayer.enabled) {
      this.renderPartyUnits(partyLayer.ctx, state, hoveredTargetId);
    }

    // 6. Render Dynamic Layer 6: Emissive Pass
    const emissiveLayer = this.layers.get('emissive_pass')!;
    if (emissiveLayer.enabled) {
      this.renderEmissivePass(emissiveLayer.ctx, state);
    }

    // Post-processing is now applied directly to mainCtx during compositing (see step 9)
    // to avoid the overhead of an intermediate offscreen canvas + drawImage round-trip.
    const isReplayFast = replayHUDState && replayHUDState.playbackSpeed >= 5.0;

    // 8. Render Dynamic Layer 9: UI & Menus
    const uiLayer = this.layers.get('ui_and_menus')!;
    if (uiLayer.enabled) {
      this.renderUIAndMenus(uiLayer.ctx, state, uiState, isPlayerTurn, replayHUDState, activeDelta);
    }

    // 9. Composite all 9 layers to visible canvas in explicit order
    mainCtx.clearRect(0, 0, this.width, this.height);

    for (const layerId of LAYER_ORDER) {
      const layer = this.layers.get(layerId);
      if (!layer || !layer.enabled) continue;

      // Post-processing is applied directly to mainCtx, not via an offscreen canvas
      if (layerId === 'post_processing') {
        if (this.postProcessingEnabled && !isReplayFast) {
          this.renderPostProcessing(mainCtx, emissiveLayer.canvas, state, encounterId, activeDelta);
        }
        continue;
      }

      mainCtx.save();
      // Apply parallax differential
      const ox = shake.x * layer.parallaxMultiplier;
      const oy = shake.y * layer.parallaxMultiplier;
      if (ox !== 0 || oy !== 0) {
        mainCtx.translate(ox, oy);
      }
      mainCtx.drawImage(layer.canvas, 0, 0);
      mainCtx.restore();
    }

    // 10. Record performance metrics
    const frameEnd = performance.now();
    this.recordFrameTime(frameEnd - frameStart);

    // 11. Debug overlays
    if (this.debugShowPerf) {
      this.drawPerformanceHUD(mainCtx);
    }
  }

  private clearDynamicLayers(): void {
    for (const layer of this.layers.values()) {
      if (!layer.isStatic && layer.enabled) {
        // Post-processing draws directly to mainCtx, not to its offscreen canvas
        if (layer.id === 'post_processing') continue;
        layer.ctx.clearRect(0, 0, this.width, this.height);
      }
    }
  }

  private bakeStaticLayers(encounterId: string): void {
    const encList = encountersJson as EncounterDefinition[];
    const encDef = encList.find((e) => e.id === encounterId);
    
    // Default fallback environment
    const env = encDef?.environment || {
      type: encounterId.includes('empire') ? 'empire_hall' : encounterId.includes('shub') ? 'shub_facility' : 'hadenman_derelict',
      lightSourceX: 0.7,
      lightSourceY: 0.25,
      lightColor: "rgba(245, 158, 11, 0.30)",
      floorTint: "#1a1408",
      hazeColor: "rgba(180, 120, 40, 0.06)",
      stoneColor: "#4a3828",
      metalColor: "#3a4050",
      shadowColor: "#1a2040",
      accentColor: "#aa8430"
    };

    const isEmpire = env.type === 'empire_hall';
    const isShub = env.type === 'shub_facility';
    const isHaden = env.type === 'hadenman_derelict';

    // --- 1. Starfield Void Layer (Pre-blurred once) ---
    const starLayer = this.layers.get('starfield_void')!;
    const sCtx = starLayer.ctx;
    sCtx.clearRect(0, 0, this.width, this.height);

    sCtx.save();
    sCtx.filter = 'blur(4px)';

    // Deep void space gradient
    const voidGrad = sCtx.createLinearGradient(0, 0, 0, this.height);
    if (isEmpire) {
      voidGrad.addColorStop(0, '#090806');
      voidGrad.addColorStop(0.6, '#130e06');
      voidGrad.addColorStop(1, '#050403');
    } else if (isShub) {
      voidGrad.addColorStop(0, '#040810');
      voidGrad.addColorStop(0.6, '#081220');
      voidGrad.addColorStop(1, '#020408');
    } else {
      voidGrad.addColorStop(0, '#0c0304');
      voidGrad.addColorStop(0.6, '#160608');
      voidGrad.addColorStop(1, '#060102');
    }
    sCtx.fillStyle = voidGrad;
    sCtx.fillRect(0, 0, this.width, this.height);

    // Atmospheric Haze Bands
    const hazeBase = env.hazeColor.replace(/[\d.]+\)$/g, '0.20)');
    for(let i = 0; i < 3; i++) {
      const y = this.height * (0.3 + i * 0.2);
      const h = this.height * 0.35;
      const hazeGrad = sCtx.createLinearGradient(0, y - h/2, 0, y + h/2);
      hazeGrad.addColorStop(0, 'rgba(0,0,0,0)');
      hazeGrad.addColorStop(0.5, hazeBase);
      hazeGrad.addColorStop(1, 'rgba(0,0,0,0)');
      sCtx.fillStyle = hazeGrad;
      sCtx.fillRect(0, y - h/2, this.width, h);
    }

    // Procedural Stars (baked static field)
    for (let i = 0; i < 110; i++) {
      const sx = (i * 97 + (i % 7) * 31) % this.width;
      const sy = (i * 53 + (i % 11) * 47) % this.height;
      const size = i % 10 === 0 ? 2.2 : i % 4 === 0 ? 1.5 : 1.0;
      const alpha = (0.25 + ((i % 13) / 13) * 0.65);
      sCtx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      sCtx.fillRect(sx, sy, size, size);
    }
    sCtx.restore();

    // --- 2. Far Backdrop Layer (Pre-blurred once) ---
    const bgLayer = this.layers.get('far_backdrop')!;
    const bgCtx = bgLayer.ctx;
    bgCtx.clearRect(0, 0, this.width, this.height);

    const bgImage = AssetManager.getImage(`bg_${encounterId}`);
    if (bgImage) {
      bgCtx.drawImage(bgImage, 0, 0, this.width, this.height);
    } else {
      const lx = this.width * env.lightSourceX;
      const ly = this.height * env.lightSourceY;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.width;
      tempCanvas.height = this.height;
      const tCtx = tempCanvas.getContext('2d')!;
      
      tCtx.globalAlpha = 1.0;
      
      if (isEmpire) {
        // EMPIRE - FAR & MID (Temp canvas for blur 8)
        // Far depth: Vaulted arch
        tCtx.fillStyle = env.shadowColor || '#1a2040';
        tCtx.beginPath();
        tCtx.arc(this.width / 2, this.height * 0.4, this.width * 0.6, Math.PI, 0);
        tCtx.lineTo(this.width, 0);
        tCtx.lineTo(0, 0);
        tCtx.fill();

        // Visible light source
        const nebGrad = tCtx.createRadialGradient(lx, ly, 20, lx, ly, 500);
        nebGrad.addColorStop(0, 'rgba(255, 200, 80, 0.9)');
        nebGrad.addColorStop(0.2, 'rgba(255, 200, 80, 0.6)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tCtx.fillStyle = nebGrad;
        tCtx.fillRect(0, 0, this.width, this.height);

        // Light shafts
        tCtx.fillStyle = 'rgba(255, 200, 80, 0.15)';
        tCtx.beginPath(); tCtx.moveTo(lx, ly); tCtx.lineTo(lx - 400, this.height); tCtx.lineTo(lx - 100, this.height); tCtx.fill();
        tCtx.beginPath(); tCtx.moveTo(lx, ly); tCtx.lineTo(lx + 100, this.height); tCtx.lineTo(lx + 400, this.height); tCtx.fill();

        // Mid depth: 8+ columns across full width
        tCtx.fillStyle = env.stoneColor || '#4a3828';
        for (let i = 0; i < 9; i++) {
          const cx = (this.width / 8) * i;
          tCtx.fillRect(cx - 77, 0, 154, this.height * 0.9);
          // Capitals
          tCtx.fillStyle = env.accentColor || '#aa8430';
          tCtx.fillRect(cx - 85, 0, 170, 40);
          tCtx.fillRect(cx - 80, 40, 160, 20);
          tCtx.fillStyle = env.stoneColor || '#4a3828';
          
          // Banners between
          if (i < 8) {
            const bx = cx + (this.width / 8) / 2;
            tCtx.fillStyle = env.shadowColor || '#1a2040';
            tCtx.beginPath();
            tCtx.moveTo(bx - 40, 0);
            tCtx.lineTo(bx + 40, 0);
            tCtx.lineTo(bx, this.height * 0.5);
            tCtx.fill();
            tCtx.fillStyle = env.stoneColor || '#4a3828';
          }
        }
      } else if (isShub) {
        // SHUB - FAR & MID
        // Far depth: Grid
        tCtx.fillStyle = env.shadowColor || '#080c14';
        tCtx.fillRect(0, 0, this.width, this.height);
        
        tCtx.strokeStyle = env.accentColor || '#38bdf8';
        tCtx.lineWidth = 2;
        tCtx.globalAlpha = 0.25;
        for (let x = 0; x < this.width; x += 60) { tCtx.beginPath(); tCtx.moveTo(x, 0); tCtx.lineTo(x, this.height); tCtx.stroke(); }
        for (let y = 0; y < this.height; y += 60) { tCtx.beginPath(); tCtx.moveTo(0, y); tCtx.lineTo(this.width, y); tCtx.stroke(); }
        tCtx.globalAlpha = 1.0;

        // Light source
        const nebGrad = tCtx.createRadialGradient(lx, ly, 30, lx, ly, 500);
        nebGrad.addColorStop(0, 'rgba(56, 200, 255, 0.8)');
        nebGrad.addColorStop(0.3, 'rgba(56, 200, 255, 0.4)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tCtx.fillStyle = nebGrad;
        tCtx.fillRect(0, 0, this.width, this.height);

        // Mid depth: 8+ angular blocks & pipes
        tCtx.fillStyle = env.stoneColor || '#2a3848';
        for (let i = 0; i < 9; i++) {
          const cx = (this.width / 8) * i;
          tCtx.fillRect(cx - 40, this.height * 0.3 + (i%2)*50, 100, this.height * 0.6);
        }
        tCtx.fillStyle = env.metalColor || '#1a2028';
        tCtx.fillRect(0, this.height * 0.5, this.width, 30);
        tCtx.fillRect(0, this.height * 0.6, this.width, 20);
      } else if (isHaden) {
        // HADENMAN - FAR & MID
        // Light source
        const nebGrad = tCtx.createRadialGradient(lx, ly, 50, lx, ly, 600);
        nebGrad.addColorStop(0, 'rgba(255, 100, 40, 0.8)');
        nebGrad.addColorStop(0.3, 'rgba(255, 100, 40, 0.4)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        tCtx.fillStyle = nebGrad;
        tCtx.fillRect(0, 0, this.width, this.height);

        // Far depth: Torn hull breach
        tCtx.fillStyle = env.shadowColor || '#0a0408';
        tCtx.beginPath();
        tCtx.moveTo(this.width * 0.3, 0);
        tCtx.lineTo(this.width * 0.4, this.height * 0.3);
        tCtx.lineTo(this.width * 0.25, this.height * 0.6);
        tCtx.lineTo(this.width * 0.4, this.height);
        tCtx.lineTo(0, this.height); tCtx.lineTo(0, 0); tCtx.fill();
        tCtx.beginPath();
        tCtx.moveTo(this.width * 0.8, 0);
        tCtx.lineTo(this.width * 0.7, this.height * 0.4);
        tCtx.lineTo(this.width * 0.85, this.height * 0.7);
        tCtx.lineTo(this.width * 0.65, this.height);
        tCtx.lineTo(this.width, this.height); tCtx.lineTo(this.width, 0); tCtx.fill();

        // Mid depth: broken panels
        tCtx.fillStyle = env.stoneColor || '#5a2218';
        for (let i = 0; i < 9; i++) {
          tCtx.save();
          tCtx.translate((this.width / 8) * i, this.height * 0.4 + (i%3)*40);
          tCtx.rotate(0.2 * (i%2===0?1:-1));
          tCtx.fillRect(-50, -100, 120, 250);
          tCtx.restore();
        }
        
        tCtx.strokeStyle = env.metalColor || '#3a3838';
        tCtx.lineWidth = 15;
        for (let i = 0; i < 12; i++) {
          tCtx.beginPath(); tCtx.moveTo(i * 180, 0); tCtx.lineTo(i * 180 + 100, this.height); tCtx.stroke();
        }

        tCtx.fillStyle = env.accentColor || '#cc6020';
        for (let i = 0; i < 20; i++) {
          tCtx.beginPath(); tCtx.arc(Math.random() * this.width, Math.random() * this.height * 0.6, 4, 0, Math.PI * 2); tCtx.fill();
        }
      }

      // Draw Temp Canvas onto Background with 8px Blur
      bgCtx.save();
      bgCtx.filter = 'blur(8px)';
      bgCtx.drawImage(tempCanvas, 0, 0);
      bgCtx.filter = 'none';

      // Near Depth onto Background with 3px Blur
      bgCtx.filter = 'blur(3px)';
      bgCtx.globalAlpha = 1.0;

      if (isEmpire) {
        // Empire Near: Arch segments & structural beams
        bgCtx.fillStyle = env.metalColor || '#3a4050';
        bgCtx.fillRect(0, 0, this.width, this.height * 0.12);
        bgCtx.fillRect(this.width * 0.25, 0, 160, this.height * 0.7);
        bgCtx.fillRect(this.width * 0.75 - 160, 0, 160, this.height * 0.7);
        bgCtx.beginPath(); bgCtx.moveTo(0, 0); bgCtx.lineTo(250, 0); bgCtx.lineTo(0, 400); bgCtx.fill();
        bgCtx.beginPath(); bgCtx.moveTo(this.width, 0); bgCtx.lineTo(this.width - 250, 0); bgCtx.lineTo(this.width, 400); bgCtx.fill();
      } else if (isShub) {
        // Shub Near: L-shapes & vents
        bgCtx.fillStyle = env.metalColor || '#1a2028';
        bgCtx.beginPath(); bgCtx.moveTo(0, 0); bgCtx.lineTo(160, 0); bgCtx.lineTo(160, this.height); bgCtx.lineTo(0, this.height); bgCtx.fill();
        bgCtx.beginPath(); bgCtx.moveTo(this.width, 0); bgCtx.lineTo(this.width - 160, 0); bgCtx.lineTo(this.width - 160, this.height); bgCtx.lineTo(this.width, this.height); bgCtx.fill();
        for (let i = 1; i <= 3; i++) {
          bgCtx.fillRect(this.width * 0.3 * i - 80, 0, 160, this.height * 0.6);
        }
        
        bgCtx.fillStyle = env.stoneColor || '#2a3848';
        for (let y = 100; y < 300; y += 25) {
          bgCtx.fillRect(20, y, 120, 15);
          bgCtx.fillRect(this.width - 140, y, 120, 15);
        }

        bgCtx.strokeStyle = env.accentColor || '#38bdf8';
        bgCtx.globalAlpha = 0.25;
        bgCtx.lineWidth = 4;
        for(let i=0; i<3; i++) {
            bgCtx.beginPath(); bgCtx.moveTo(0, 150 + i*20); bgCtx.lineTo(this.width, 150 + i*20); bgCtx.stroke();
        }
        bgCtx.globalAlpha = 1.0;
      } else if (isHaden) {
        // Haden Near: Torn plating, warning stripes
        bgCtx.fillStyle = env.metalColor || '#3a3838';
        bgCtx.beginPath(); bgCtx.moveTo(0, 0); bgCtx.lineTo(200, 0); bgCtx.lineTo(150, 150); bgCtx.lineTo(220, 300); bgCtx.lineTo(120, 450); bgCtx.lineTo(180, this.height); bgCtx.lineTo(0, this.height); bgCtx.fill();
        bgCtx.beginPath(); bgCtx.moveTo(this.width, 0); bgCtx.lineTo(this.width - 250, 0); bgCtx.lineTo(this.width - 180, 200); bgCtx.lineTo(this.width - 220, 400); bgCtx.lineTo(this.width, this.height); bgCtx.fill();
        for (let i = 1; i <= 3; i++) {
          bgCtx.fillRect(this.width * 0.25 * i - 60, 0, 120, this.height * 0.5);
        }

        bgCtx.strokeStyle = env.shadowColor || '#0a0408';
        bgCtx.lineWidth = 6;
        for (let i = 0; i < 6; i++) {
          const x = this.width * 0.15 + i * 250;
          bgCtx.beginPath(); bgCtx.moveTo(x, 0); for (let y = 0; y < 400; y += 30) bgCtx.lineTo(x + Math.sin(y * 0.05) * 20, y); bgCtx.stroke();
        }

        bgCtx.globalAlpha = 0.4;
        bgCtx.fillStyle = env.accentColor || '#cc6020';
        for(let y=50; y<400; y+=40) { bgCtx.fillRect(10, y, 60, 20); bgCtx.fillRect(this.width-70, y, 60, 20); }
        bgCtx.globalAlpha = 1.0;
      }
      bgCtx.restore();
    }

    // --- 3. Stage Floor Layer (Sharp, static) ---
    const floorLayer = this.layers.get('stage_floor')!;
    const fCtx = floorLayer.ctx;
    fCtx.clearRect(0, 0, this.width, this.height);

    const deckY = LAYOUT.deckY;
    fCtx.save();
    
    // Horizon break: shallow polygon step/lip
    fCtx.fillStyle = env.floorTint;
    fCtx.beginPath();
    fCtx.moveTo(0, deckY - 12);
    fCtx.lineTo(this.width, deckY - 12);
    fCtx.lineTo(this.width, deckY);
    fCtx.lineTo(0, deckY);
    fCtx.fill();
    // Highlight on top face (more visible)
    fCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    fCtx.fillRect(0, deckY - 12, this.width, 3);
    // Shadow below
    fCtx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    fCtx.fillRect(0, deckY, this.width, 6);

    const deckGrad = fCtx.createLinearGradient(0, deckY, 0, this.height);
    deckGrad.addColorStop(0, env.floorTint);
    deckGrad.addColorStop(0.4, 'rgba(10, 15, 28, 0.8)');
    deckGrad.addColorStop(1, 'rgba(6, 9, 16, 0.95)');

    fCtx.fillStyle = deckGrad;
    fCtx.fillRect(0, deckY, this.width, this.height - deckY);

    // Visible plating panels alternating colors
    fCtx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let x = -400; x < this.width + 400; x += 120) {
      if (Math.abs(x) % 240 === 0) {
        fCtx.beginPath();
        fCtx.moveTo(x, deckY);
        fCtx.lineTo(x + 120, deckY);
        fCtx.lineTo(this.width / 2 + (x + 120 - this.width / 2) * 2.5, this.height);
        fCtx.lineTo(this.width / 2 + (x - this.width / 2) * 2.5, this.height);
        fCtx.fill();
      }
    }

    // Perspective floor lines (Panel seam grid)
    fCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    fCtx.lineWidth = 2;
    // Vertical converging lines
    for (let x = -400; x < this.width + 400; x += 120) {
      fCtx.beginPath();
      fCtx.moveTo(x, deckY);
      fCtx.lineTo(this.width / 2 + (x - this.width / 2) * 2.5, this.height);
      fCtx.stroke();
    }
    // Horizontal cross-lines forming panels
    for (let y = deckY + 30; y < this.height; y += (y - deckY) * 0.35) {
      fCtx.beginPath();
      fCtx.moveTo(0, y);
      fCtx.lineTo(this.width, y);
      fCtx.stroke();
    }

    // 2-3 diagonal cables
    fCtx.strokeStyle = '#080808';
    fCtx.lineWidth = 8;
    fCtx.beginPath(); fCtx.moveTo(200, this.height); fCtx.lineTo(this.width * 0.7, deckY + 50); fCtx.stroke();
    fCtx.lineWidth = 5;
    fCtx.beginPath(); fCtx.moveTo(this.width - 300, this.height); fCtx.lineTo(this.width * 0.3, deckY + 80); fCtx.stroke();
    fCtx.lineWidth = 12;
    fCtx.beginPath(); fCtx.moveTo(-50, this.height - 100); fCtx.lineTo(400, deckY); fCtx.stroke();

    // Near-field debris (8-12 rectangles)
    fCtx.fillStyle = env.metalColor || '#3a4050';
    fCtx.globalAlpha = 0.4;
    for (let i = 0; i < 10; i++) {
      const dx = (i * 271) % this.width;
      const dy = deckY + 100 + ((i * 113) % (this.height - deckY - 100));
      fCtx.save();
      fCtx.translate(dx, dy);
      fCtx.rotate(i * 0.5);
      fCtx.fillRect(-20, -10, 40 + (i%10)*5, 20 + (i%5)*3);
      fCtx.restore();
    }
    fCtx.globalAlpha = 1.0;
    
    fCtx.restore();

    // --- 7. Foreground Occluders (Bulkhead framing & deck cables, pre-blurred heavily) ---
    const occLayer = this.layers.get('foreground_occluders')!;
    const oCtx = occLayer.ctx;
    oCtx.clearRect(0, 0, this.width, this.height);

    oCtx.save();
    oCtx.filter = 'blur(12px)';
    oCtx.fillStyle = '#040508';

    // Left wider bulkhead
    oCtx.beginPath();
    oCtx.moveTo(0, 0);
    oCtx.lineTo(120, 0);
    oCtx.lineTo(120, this.height);
    oCtx.lineTo(0, this.height);
    oCtx.fill();

    // Bolt details on left
    oCtx.fillStyle = '#0a0a0a';
    for (let i = 0; i < 8; i++) {
      oCtx.beginPath();
      oCtx.arc(60, 50 + i * 140, 8, 0, Math.PI * 2);
      oCtx.fill();
    }

    // Bottom-left mass
    oCtx.fillStyle = '#020305';
    oCtx.beginPath();
    oCtx.moveTo(0, this.height * 0.6);
    oCtx.lineTo(120, this.height * 0.6);
    oCtx.lineTo(300, this.height);
    oCtx.lineTo(0, this.height);
    oCtx.fill();
    
    oCtx.strokeStyle = 'rgba(255,255,255,0.05)';
    oCtx.lineWidth = 4;
    oCtx.beginPath(); oCtx.moveTo(0, this.height * 0.6); oCtx.lineTo(120, this.height * 0.6); oCtx.lineTo(300, this.height); oCtx.stroke();

    // Right edge beam
    oCtx.fillStyle = '#040508';
    oCtx.fillRect(this.width - 100, 0, 100, this.height);
    
    // Bottom-right mass
    oCtx.beginPath();
    oCtx.moveTo(this.width, this.height * 0.5);
    oCtx.lineTo(this.width - 150, this.height * 0.5);
    oCtx.lineTo(this.width - 350, this.height);
    oCtx.lineTo(this.width, this.height);
    oCtx.fill();
    
    oCtx.beginPath(); oCtx.moveTo(this.width, this.height * 0.5); oCtx.lineTo(this.width - 150, this.height * 0.5); oCtx.lineTo(this.width - 350, this.height); oCtx.stroke();

    // Top thicker conduit + hanging element
    oCtx.fillStyle = '#040508';
    oCtx.fillRect(0, 0, this.width, 50);

    // Hanging element
    oCtx.beginPath();
    oCtx.moveTo(this.width / 2 - 40, 50);
    oCtx.lineTo(this.width / 2 + 40, 50);
    oCtx.lineTo(this.width / 2 + 20, 120);
    oCtx.lineTo(this.width / 2 - 20, 120);
    oCtx.fill();

    oCtx.restore();
  }

  private renderEnemyUnits(
    ctx: CanvasRenderingContext2D,
    state: BattleState,
    selectedTargetId: string | null,
    hoveredTargetId: string | null
  ): void {
    drawEnemyUnits(ctx, state, selectedTargetId, hoveredTargetId);
  }

  private renderPartyUnits(
    ctx: CanvasRenderingContext2D,
    state: BattleState,
    hoveredTargetId: string | null
  ): void {
    drawPartyUnits(ctx, state, hoveredTargetId);
  }

  /**
   * Renders the luminous emissive pass (feeds bloom).
   * Draws purely bright neon cores, disruptor vortices, esper coronas, and weapon heat on transparent bg.
   */
  private renderEmissivePass(
    ctx: CanvasRenderingContext2D,
    state: BattleState
  ): void {
    ctx.save();

    // 1. Enemy Emissive elements on battlefield
    const enemyCount = state.enemyIds.length;
    state.enemyIds.forEach((id, idx) => {
      const enemy = state.combatants[id];
      if (!enemy || enemy.stats.hp <= 0) return;

      const bounds = getEnemyCardBounds(enemyCount, idx);
      const cx = bounds.x + bounds.w / 2;
      const cy = bounds.y + bounds.h * 0.44;

      // Disruptor charge glow
      if (enemy.disruptorCooldown === 0) {
        ctx.fillStyle = '#34d399';
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(cx, cy - 20, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Eye / core emissive
      ctx.fillStyle = enemy.faction === 'shub' ? '#38bdf8' : enemy.faction === 'hadenman' ? '#f87171' : '#fbbf24';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy - 30, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Party Emissive elements on battlefield
    const partyCount = state.partyIds.length;
    state.partyIds.forEach((id, idx) => {
      const hero = state.combatants[id];
      if (!hero || hero.stats.hp <= 0) return;

      const bounds = getPartyCombatantBounds(partyCount, idx);
      const cx = bounds.x + bounds.w / 2;
      const cy = bounds.y + bounds.h * 0.44;

      // Captain Boost Flame
      if (hero.isBoosting) {
        ctx.fillStyle = '#f59e0b';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(cx, cy - 25, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Esper Psionic Eye Glow
      if (hero.id === 'crew_lyra') {
        ctx.fillStyle = '#c084fc';
        ctx.shadowColor = '#d8b4fe';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(cx, cy - 25, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Force Shield glowing rim
      if (hero.hasForceShield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  /**
   * Post-Processing: Bloom, Zone Color Grade, Vignette, and Ambient Particles.
   *
   * Performance-critical path. Every operation is budgeted:
   * - Bloom: 1/8-res downsample + bilinear upscale (the upscale IS the blur)
   * - Grade: pre-baked multiply+screen overlay, drawn as one image
   * - Vignette: pre-baked radial gradient, drawn as one image
   * - Particles: 12 arc fills (negligible)
   *
   * No per-frame ctx.filter, no per-frame createRadialGradient, no redundant fillRects.
   */
  private renderPostProcessing(
    ctx: CanvasRenderingContext2D,
    emissiveCanvas: HTMLCanvasElement,
    state: BattleState,
    encounterId: string,
    deltaTimeMs: number
  ): void {
    const encList = encountersJson as EncounterDefinition[];
    const encDef = encList.find((e) => e.id === encounterId);
    const grade = encDef?.grade;

    // 1. Bloom Composite (1/8-resolution bright pass — bilinear upscale IS the blur)
    const bW = this.bloomCanvas.width;
    const bH = this.bloomCanvas.height;
    this.bloomCtx.clearRect(0, 0, bW, bH);
    this.bloomCtx.drawImage(emissiveCanvas, 0, 0, bW, bH);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = FEEDBACK_CONFIG.bloomBaseIntensity;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'low';
    ctx.drawImage(this.bloomCanvas, 0, 0, this.width, this.height);
    ctx.restore();

    // 2. Combined Grade + Vignette (one cached overlay, one drawImage per frame)
    const captain = state.combatants['crew_valen'];
    const totalHp = state.partyIds.reduce((sum, id) => sum + (state.combatants[id]?.stats.hp ?? 0), 0);
    const maxHp = state.partyIds.reduce((sum, id) => sum + (state.combatants[id]?.stats.maxHp ?? 1), 0);
    const hpPct = totalHp / maxHp;
    const vigIntensity = hpPct < 0.35 ? 0.85 : (grade?.vignetteStrength ?? 0.60);
    const cacheKey = `${encounterId}:${vigIntensity}`;

    if (this.cachedGradeVignetteKey !== cacheKey) {
      this.bakeGradeVignetteOverlay(encounterId, grade, vigIntensity);
      this.cachedGradeVignetteKey = cacheKey;
    }
    ctx.drawImage(this.gradeVignetteCanvas, 0, 0);

    // 3. Mechanic-Driven State Adjustments (conditional, usually zero cost)
    // Burnout Crash: Desaturate / cold wash
    if (captain && captain.crashTurns > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'color';
      ctx.fillStyle = 'rgba(100, 116, 139, 0.4)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // Boost Active: Warm gold rim lift
    if (captain && captain.isBoosting) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 4. Ambient Drifting Particles
    ctx.save();
    const particleColor = grade?.particleColor || (encounterId.includes('empire') ? 'rgba(251, 191, 36, 0.4)' : encounterId.includes('hadenman') ? 'rgba(248, 113, 113, 0.5)' : 'rgba(56, 189, 248, 0.4)');
    for (const p of this.ambientParticles) {
      p.x += p.vx * (deltaTimeMs / 16);
      p.y += p.vy * (deltaTimeMs / 16);
      if (p.y < 0) {
        p.y = this.height;
        p.x = Math.random() * this.width;
      }
      ctx.fillStyle = particleColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Bakes the combined zone color grade overlay (multiply wash + screen lift)
   * AND the radial gradient vignette into a single offscreen canvas.
   * Called once per encounter zone or HP-threshold change — never per frame.
   *
   * The per-frame cost is a single drawImage of the baked result.
   */
  private bakeGradeVignetteOverlay(
    encounterId: string,
    grade: { multiplyWash?: string; screenLift?: string; vignetteStrength?: number } | undefined,
    vigIntensity: number
  ): void {
    const gCtx = this.gradeVignetteCtx;
    gCtx.clearRect(0, 0, this.width, this.height);

    // Vignette layer: radial gradient from transparent to dark
    const vigGrad = gCtx.createRadialGradient(
      this.width * 0.5,
      this.height * 0.45,
      this.width * 0.25,
      this.width * 0.5,
      this.height * 0.45,
      this.width * 0.65
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, `rgba(0, 0, 0, ${vigIntensity})`);
    gCtx.fillStyle = vigGrad;
    gCtx.fillRect(0, 0, this.width, this.height);

    // Grade wash overlay: multiply wash applied as a tinted fill
    const washColor = grade?.multiplyWash || (encounterId.includes('empire') ? 'rgba(245, 158, 11, 0.12)' : encounterId.includes('shub') ? 'rgba(56, 189, 248, 0.14)' : 'rgba(239, 68, 68, 0.18)');
    gCtx.globalCompositeOperation = 'source-over';
    gCtx.fillStyle = washColor;
    gCtx.fillRect(0, 0, this.width, this.height);

    // Screen lift overlay
    const liftColor = grade?.screenLift || (encounterId.includes('empire') ? 'rgba(217, 119, 6, 0.08)' : encounterId.includes('shub') ? 'rgba(147, 51, 234, 0.07)' : 'rgba(153, 27, 27, 0.10)');
    gCtx.globalCompositeOperation = 'screen';
    gCtx.fillStyle = liftColor;
    gCtx.fillRect(0, 0, this.width, this.height);

    gCtx.globalCompositeOperation = 'source-over';
  }

  private renderUIAndMenus(
    ctx: CanvasRenderingContext2D,
    state: BattleState,
    uiState: UIState,
    isPlayerTurn: boolean,
    replayHUDState?: ReplayHUDState | null,
    deltaTimeMs: number = 16
  ): void {
    // 1. Draw Turn Queue Bar at top
    drawTurnQueue(ctx, state);

    // 2. Draw Bottom Party Status Cards & Meters (UI Layer 9)
    drawPartyStatusCards(ctx, state);

    // 3. Draw Bottom Tactical Console & Menus
    drawUI(ctx, state, uiState, isPlayerTurn, replayHUDState);

    // 4. Draw Active Projectiles, Beams & Shards
    drawEffects(ctx, deltaTimeMs);
  }

  private recordFrameTime(timeMs: number): void {
    this.frameTimes.push(timeMs);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    this.worstFrameTimes.push(timeMs);
    const now = performance.now();
    if (now - this.lastWorstFrameReset > 4000) {
      this.worstFrameTimes = [timeMs];
      this.lastWorstFrameReset = now;
    }

    const avg = this.frameTimes.reduce((s, v) => s + v, 0) / this.frameTimes.length;
    const worst = Math.max(...this.worstFrameTimes);

    this.latestMetrics = {
      currentFrameTimeMs: timeMs,
      avgFrameTimeMs: avg,
      worstFrameTimeMs: worst,
      fps: avg > 0 ? Math.round(1000 / avg) : 60,
    };
  }

  private drawPerformanceHUD(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.fillRect(12, 12, 420, 160);
    ctx.strokeRect(12, 12, 420, 160);

    ctx.font = THEME.fontBody;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ HD-2D COMPOSITOR PROFILER [F key]', 24, 36);

    ctx.fillStyle = this.latestMetrics.avgFrameTimeMs < 16.6 ? '#34d399' : '#f87171';
    ctx.fillText(`Frame Time: ${this.latestMetrics.avgFrameTimeMs.toFixed(2)} ms (${this.latestMetrics.fps} FPS)`, 24, 64);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Worst Frame: ${this.latestMetrics.worstFrameTimeMs.toFixed(2)} ms`, 24, 92);

    const activeLayers = Array.from(this.layers.values()).filter((l) => l.enabled).length;
    ctx.fillText(`Active Layers: ${activeLayers}/9 | Post-FX: ${this.postProcessingEnabled ? 'ON' : 'OFF [P key]'}`, 24, 120);
    ctx.fillText(`Static Buffers: Cached (0 per-frame blurs)`, 24, 148);

    ctx.restore();
  }
}
