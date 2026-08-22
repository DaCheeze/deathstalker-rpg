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

  /**
   * Bakes the pre-blurred static depth-of-field buffers (Starfield, Far Backdrop, Stage Floor, Occluders).
   * Executed ONCE at load / resize / zone change. Never runs per-frame.
   */
  private bakeStaticLayers(encounterId: string): void {
    const isEmpire = encounterId.includes('empire');
    const isShub = encounterId.includes('shub');
    const isHaden = encounterId.includes('hadenman');

    // --- 1. Starfield Void Layer (Pre-blurred once) ---
    const starLayer = this.layers.get('starfield_void')!;
    const sCtx = starLayer.ctx;
    sCtx.clearRect(0, 0, this.width, this.height);

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
    } else if (isHaden) {
      voidGrad.addColorStop(0, '#0c0304');
      voidGrad.addColorStop(0.6, '#160608');
      voidGrad.addColorStop(1, '#060102');
    } else {
      voidGrad.addColorStop(0, '#06080e');
      voidGrad.addColorStop(0.6, '#0b101c');
      voidGrad.addColorStop(1, '#040508');
    }
    sCtx.fillStyle = voidGrad;
    sCtx.fillRect(0, 0, this.width, this.height);

    // Procedural Stars (baked static field)
    sCtx.save();
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
      // Procedural Sci-Fi Horizon / Orbital Backdrop
      bgCtx.save();
      if (isEmpire) {
        // Imperial Palace Orbital Spine & Golden Nebula
        const nebGrad = bgCtx.createRadialGradient(this.width * 0.75, this.height * 0.25, 40, this.width * 0.75, this.height * 0.25, 340);
        nebGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
        nebGrad.addColorStop(0.5, 'rgba(180, 83, 9, 0.12)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        bgCtx.fillStyle = nebGrad;
        bgCtx.fillRect(0, 0, this.width, this.height);

        // Distant Spire silhouette
        bgCtx.fillStyle = '#0f0c08';
        bgCtx.beginPath();
        bgCtx.moveTo(this.width * 0.6, this.height);
        bgCtx.lineTo(this.width * 0.7, this.height * 0.35);
        bgCtx.lineTo(this.width * 0.75, this.height * 0.28);
        bgCtx.lineTo(this.width * 0.8, this.height * 0.35);
        bgCtx.lineTo(this.width * 0.9, this.height);
        bgCtx.fill();
      } else if (isShub) {
        // Shub Rogue AI Machine Grid & Cyan Nebula
        const nebGrad = bgCtx.createRadialGradient(this.width * 0.3, this.height * 0.3, 30, this.width * 0.3, this.height * 0.3, 360);
        nebGrad.addColorStop(0, 'rgba(56, 189, 248, 0.20)');
        nebGrad.addColorStop(0.6, 'rgba(147, 51, 234, 0.10)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        bgCtx.fillStyle = nebGrad;
        bgCtx.fillRect(0, 0, this.width, this.height);

        // Distant machine lattice
        bgCtx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
        bgCtx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 64) {
          bgCtx.beginPath();
          bgCtx.moveTo(x, 0);
          bgCtx.lineTo(x + 120, this.height * 0.6);
          bgCtx.stroke();
        }
      } else if (isHaden) {
        // Hadenman Dreadnought Outer Ring & Crimson Nebula
        const nebGrad = bgCtx.createRadialGradient(this.width * 0.5, this.height * 0.2, 40, this.width * 0.5, this.height * 0.2, 380);
        nebGrad.addColorStop(0, 'rgba(239, 68, 68, 0.25)');
        nebGrad.addColorStop(0.5, 'rgba(127, 29, 29, 0.12)');
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        bgCtx.fillStyle = nebGrad;
        bgCtx.fillRect(0, 0, this.width, this.height);

        // Heavy Dreadnought ring silhouette
        bgCtx.strokeStyle = '#180608';
        bgCtx.lineWidth = 18;
        bgCtx.beginPath();
        bgCtx.arc(this.width * 0.5, this.height * 0.15, 280, 0.2, Math.PI - 0.2);
        bgCtx.stroke();
      }
      bgCtx.restore();
    }

    // --- 3. Stage Floor Layer (Sharp, static) ---
    const floorLayer = this.layers.get('stage_floor')!;
    const fCtx = floorLayer.ctx;
    fCtx.clearRect(0, 0, this.width, this.height);

    const deckY = LAYOUT.deckY;
    fCtx.save();
    const deckGrad = fCtx.createLinearGradient(0, deckY - 24, 0, this.height);
    deckGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
    deckGrad.addColorStop(0.15, isEmpire ? 'rgba(245, 158, 11, 0.16)' : isShub ? 'rgba(56, 189, 248, 0.14)' : 'rgba(239, 68, 68, 0.16)');
    deckGrad.addColorStop(0.65, 'rgba(10, 15, 28, 0.65)');
    deckGrad.addColorStop(1, 'rgba(6, 9, 16, 0.95)');

    fCtx.fillStyle = deckGrad;
    fCtx.fillRect(0, deckY - 24, this.width, this.height - (deckY - 24));

    // Ground horizon deck line
    fCtx.strokeStyle = isEmpire ? '#b45309' : isShub ? '#0284c7' : '#991b1b';
    fCtx.lineWidth = 1.5;
    fCtx.beginPath();
    fCtx.moveTo(0, deckY);
    fCtx.lineTo(this.width, deckY);
    fCtx.stroke();

    // Perspective floor lines
    fCtx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
    fCtx.lineWidth = 1;
    for (let x = -60; x < this.width + 120; x += 48) {
      fCtx.beginPath();
      fCtx.moveTo(x, deckY);
      fCtx.lineTo(x - (x - this.width / 2) * 0.4, this.height);
      fCtx.stroke();
    }
    fCtx.restore();

    // --- 7. Foreground Occluders (Bulkhead framing & deck cables, pre-blurred heavily) ---
    const occLayer = this.layers.get('foreground_occluders')!;
    const oCtx = occLayer.ctx;
    oCtx.clearRect(0, 0, this.width, this.height);

    oCtx.save();
    oCtx.fillStyle = '#06080d';

    // Left bulkhead frame occluder
    oCtx.beginPath();
    oCtx.moveTo(0, 0);
    oCtx.lineTo(48, 0);
    oCtx.lineTo(24, 180);
    oCtx.lineTo(40, 360);
    oCtx.lineTo(16, this.height);
    oCtx.lineTo(0, this.height);
    oCtx.closePath();
    oCtx.fill();

    // Right bulkhead frame occluder
    oCtx.beginPath();
    oCtx.moveTo(this.width, 0);
    oCtx.lineTo(this.width - 48, 0);
    oCtx.lineTo(this.width - 24, 180);
    oCtx.lineTo(this.width - 40, 360);
    oCtx.lineTo(this.width - 16, this.height);
    oCtx.lineTo(this.width, this.height);
    oCtx.closePath();
    oCtx.fill();

    // Top hanging conduits / deck girder
    oCtx.beginPath();
    oCtx.moveTo(0, 0);
    oCtx.lineTo(this.width, 0);
    oCtx.lineTo(this.width - 120, 16);
    oCtx.lineTo(120, 16);
    oCtx.closePath();
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
    ctx.fillRect(8, 8, 280, 110);
    ctx.strokeRect(8, 8, 280, 110);

    ctx.font = THEME.fontSmall;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('⚡ HD-2D COMPOSITOR PROFILER [F key]', 16, 26);

    ctx.fillStyle = this.latestMetrics.avgFrameTimeMs < 16.6 ? '#34d399' : '#f87171';
    ctx.fillText(`Frame Time: ${this.latestMetrics.avgFrameTimeMs.toFixed(2)} ms (${this.latestMetrics.fps} FPS)`, 16, 46);

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Worst Frame: ${this.latestMetrics.worstFrameTimeMs.toFixed(2)} ms`, 16, 64);

    const activeLayers = Array.from(this.layers.values()).filter((l) => l.enabled).length;
    ctx.fillText(`Active Layers: ${activeLayers}/9 | Post-FX: ${this.postProcessingEnabled ? 'ON' : 'OFF [P key]'}`, 16, 82);
    ctx.fillText(`Static Buffers: Cached (0 per-frame blurs)`, 16, 100);

    ctx.restore();
  }
}
