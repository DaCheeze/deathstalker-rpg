/**
 * Octopath-Style Minimalist UI & Floating Contextual Command Menu.
 * - Single ground plane floating presentation (no full-screen bottom panels).
 * - Contextual Command Menu positioned beside the acting party member.
 * - Action Tooltip floating directly beneath the command menu.
 * - Floating center-top Action Banner for active skill execution.
 * - Tactical combat log hidden by default (toggleable via 'L' key).
 * - Replay HUD controls and Victory/Defeat overlays.
 */

import { BattleState, Combatant } from '../core/types';
import { isEspBlocked } from '../core/battle';
import { globalAudio } from '../audio/synth';
import { getContextualMenuBounds, LAYOUT } from './theme';

export interface UIState {
  menuMode: 'main' | 'attack_select' | 'esper_select' | 'target_select';
  pendingActionType: 'Attack' | 'Disruptor' | 'EsperAbility' | null;
  selectedAbilityId: string | null;
  selectedTargetId: string | null;
  hoveredIndex: number;
}

export interface ReplayHUDState {
  isPlaying: boolean;
  currentActionIndex: number;
  totalActions: number;
  currentRound: number;
  playbackSpeed: number;
  encounterName: string;
  seed: number;
  sampleLabel?: string;
}

interface ActionBannerState {
  text: string;
  until: number;
  color: string;
}

let activeBanner: ActionBannerState | null = null;
let showCombatLogOverlay = false;

export function triggerActionBanner(text: string, color: string = '#38bdf8', durationMs: number = 1200): void {
  activeBanner = {
    text,
    until: performance.now() + durationMs,
    color,
  };
}

export function toggleCombatLogOverlay(): boolean {
  showCombatLogOverlay = !showCombatLogOverlay;
  return showCombatLogOverlay;
}

export function drawUI(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  uiState: UIState,
  isPlayerTurn: boolean,
  replayState?: ReplayHUDState | null
): void {
  const { canvasWidth, canvasHeight } = LAYOUT;

  // 1. Minimalist Top Header (Mute toggle, Replay mode status)
  drawTopHeaderControls(ctx, canvasWidth, state, replayState);

  // 2. Center-Top Floating Action Banner (Fades out after action)
  drawFloatingActionBanner(ctx, canvasWidth);

  // 3. Contextual Command Menu (ONLY during a Party Member's Turn)
  if (isPlayerTurn && !replayState && state.status === 'in_progress') {
    const activePartyIdx = state.partyIds.indexOf(state.activeActorId);
    if (activePartyIdx !== -1) {
      drawContextualCommandMenu(ctx, state, uiState, activePartyIdx);
    }
  }

  // 4. Replay HUD Controls (when in Replay mode)
  if (replayState) {
    drawFloatingReplayHUD(ctx, state, replayState, canvasWidth, canvasHeight);
  }

  // 5. Optional Combat Log Overlay (Toggled via L key)
  if (showCombatLogOverlay) {
    drawFloatingCombatLogOverlay(ctx, state, canvasWidth, canvasHeight);
  }

  // 6. Victory / Defeat Overlay
  if (!replayState) {
    if (state.status === 'victory') {
      drawEndOverlay(ctx, 'VICTORY: ALL HOSTILES ELIMINATED', 'rgba(6, 95, 70, 0.85)', '#34d399');
    } else if (state.status === 'defeat') {
      drawEndOverlay(ctx, 'DEFEAT: THE CREW HAS FALLEN', 'rgba(127, 29, 29, 0.85)', '#f87171');
    }
  }
}

function drawTopHeaderControls(
  ctx: CanvasRenderingContext2D,
  width: number,
  state: BattleState,
  replayState?: ReplayHUDState | null
): void {
  const isMuted = globalAudio.isMuted();
  const headerY = LAYOUT.headerY;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;
  ctx.font = '14px monospace';

  // Mode badge (Left)
  ctx.fillStyle = replayState ? '#38bdf8' : '#34d399';
  const modeText = replayState ? '[🎬 REPLAY (Press R to Exit)]' : '[⚔️ COMBAT (Press R for Replay)]';
  ctx.textAlign = 'left';
  ctx.fillText(modeText, 24, headerY + 12);

  // Encounter Info (Center)
  const encTitle = replayState
    ? `TACTICAL REPLAY: ${replayState.encounterName.toUpperCase()}`
    : `TURN ${state.turnNumber}`;
  ctx.fillStyle = '#94a3b8';
  ctx.textAlign = 'center';
  ctx.fillText(encTitle, width / 2, headerY + 12);

  // Audio Toggle Button & Log Toggle Hint (Right)
  const audioText = isMuted ? '[🔇 SOUND: OFF (M)]' : '[🔊 SOUND: ON (M)]';
  ctx.fillStyle = isMuted ? '#f87171' : '#a7f3d0';
  ctx.textAlign = 'right';
  ctx.fillText(audioText, width - 24, headerY + 12);

  ctx.restore();
}

function drawFloatingActionBanner(ctx: CanvasRenderingContext2D, width: number): void {
  if (!activeBanner) return;

  const now = performance.now();
  const remaining = activeBanner.until - now;
  if (remaining <= 0) {
    activeBanner = null;
    return;
  }

  const alpha = Math.min(1, remaining / 300);
  ctx.save();
  ctx.globalAlpha = alpha;

  const text = activeBanner.text;
  ctx.font = 'bold 17px monospace';
  const textWidth = ctx.measureText(text).width;
  const pillW = textWidth + 36;
  const pillH = 26;
  const pillX = (width - pillW) / 2;
  const pillY = 44;

  // Dark translucent pill container
  ctx.fillStyle = 'rgba(10, 15, 26, 0.88)';
  ctx.fillRect(pillX, pillY, pillW, pillH);

  ctx.strokeStyle = activeBanner.color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pillX, pillY, pillW, pillH);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(text, width / 2, pillY + 17);

  ctx.restore();
}

/**
 * Contextual Floating Command Menu positioned beside the acting party member.
 */
function drawContextualCommandMenu(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  uiState: UIState,
  activePartyIdx: number
): void {
  const actor = state.combatants[state.activeActorId] as Combatant | undefined;
  if (!actor || actor.stats.hp <= 0) return;

  const bounds = getContextualMenuBounds(activePartyIdx, state.partyIds.length);
  const { x, y, w } = bounds;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 4;

  const barH = 26;
  const barGap = 6;
  let hoveredTooltip = '';
  let totalBars = 0;

  if (uiState.menuMode === 'main') {
    const isCrashed = actor.crashTurns > 0;
    const isDisruptorReady = actor.disruptorCooldown === 0 && !isCrashed;
    const hasEsperAbilities = actor.abilityIds.some((id) => state.abilities[id]?.category === 'esper');
    const blockedByPsi = isEspBlocked(state);
    const isEsperUsable = !isCrashed && hasEsperAbilities && !blockedByPsi && actor.stats.esp > 0;

    const options = isCrashed
      ? [
          { label: 'Recover', cost: `${actor.crashTurns}T`, enabled: true, color: '#c084fc', tip: 'Recover from burnout crash.' },
          { label: 'Disruptor', cost: '', enabled: false, color: '#475569', tip: 'Unavailable during crash.' },
          { label: 'Force Shield', cost: '', enabled: false, color: '#475569', tip: 'Unavailable during crash.' },
          { label: 'Boost', cost: '', enabled: false, color: '#475569', tip: 'Unavailable during crash.' },
          { label: 'Psionics', cost: '', enabled: false, color: '#475569', tip: 'Unavailable during crash.' },
          { label: 'Pass', cost: '', enabled: true, color: '#94a3b8', tip: 'Skip turn.' },
        ]
      : [
          { label: 'Attack', cost: '', enabled: true, color: '#f1f5f9', tip: 'Execute standard weapon strikes.' },
          {
            label: 'Disruptor',
            cost: isDisruptorReady ? '' : `${actor.disruptorCooldown}T`,
            enabled: isDisruptorReady,
            color: isDisruptorReady ? '#34d399' : '#64748b',
            tip: isDisruptorReady ? 'Devastating heavy energy blast.' : `Recharging (${actor.disruptorCooldown} turns remaining).`,
          },
          {
            label: 'Force Shield',
            cost: actor.hasForceShield ? 'Active' : '',
            enabled: !actor.hasForceShield,
            color: actor.hasForceShield ? '#64748b' : '#38bdf8',
            tip: 'Absorb incoming melee/projectile damage.',
          },
          {
            label: !actor.canBoost
              ? 'Boost'
              : actor.isBoosting
              ? 'Vent Boost'
              : 'Inject Boost',
            cost: actor.canBoost && actor.isBoosting ? `${actor.burnout}` : '',
            enabled: actor.canBoost,
            color: actor.canBoost ? '#fbbf24' : '#64748b',
            tip: actor.isBoosting ? 'Voluntary clean exit from boost.' : 'Gain speed and attack burst (accrues burnout).',
          },
          {
            label: 'Psionics',
            cost: blockedByPsi ? '' : `${actor.stats.esp}E`,
            enabled: isEsperUsable,
            color: blockedByPsi ? '#ef4444' : isEsperUsable ? '#c084fc' : '#64748b',
            tip: blockedByPsi ? 'Disabled while Psi-Blocker lives.' : 'Armor-bypassing mental techniques.',
          },
          { label: 'Pass', cost: '', enabled: true, color: '#94a3b8', tip: 'End turn without taking action.' },
        ];

    totalBars = options.length;
    options.forEach((opt, idx) => {
      const barY = y + idx * (barH + barGap);
      const isHovered = uiState.hoveredIndex === idx;
      if (isHovered) hoveredTooltip = opt.tip;

      drawFloatingBar(ctx, x, barY, w, barH, opt.label, opt.cost, opt.enabled, isHovered, opt.color);
    });
  } else if (uiState.menuMode === 'attack_select') {
    const attacks = actor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a) => a && (a.category === 'melee' || a.category === 'projectile'));

    // Submenu header as a muted bar
    drawFloatingBar(ctx, x, y, w, barH, 'Select weapon', 'Esc', true, false, '#64748b');
    totalBars = 1 + attacks.length;

    attacks.forEach((atk, idx) => {
      if (!atk) return;
      const barY = y + (idx + 1) * (barH + barGap);
      const isHovered = uiState.hoveredIndex === idx;
      if (isHovered) hoveredTooltip = atk.description || `${atk.category.toUpperCase()} attack (${atk.powerMultiplier}x power)`;

      drawFloatingBar(ctx, x, barY, w, barH, atk.name, '', true, isHovered, '#38bdf8');
    });
  } else if (uiState.menuMode === 'esper_select') {
    const espers = actor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a) => a && a.category === 'esper');

    drawFloatingBar(ctx, x, y, w, barH, 'Select psionics', `${actor.stats.esp}E`, true, false, '#64748b');
    totalBars = 1 + espers.length;

    espers.forEach((esp, idx) => {
      if (!esp) return;
      const barY = y + (idx + 1) * (barH + barGap);
      const isHovered = uiState.hoveredIndex === idx;
      const canAfford = actor.stats.esp >= esp.espCost;
      if (isHovered) hoveredTooltip = esp.description;

      drawFloatingBar(ctx, x, barY, w, barH, esp.name, `${esp.espCost}E`, canAfford, isHovered, '#c084fc');
    });
  } else if (uiState.menuMode === 'target_select') {
    const livingEnemies = state.enemyIds
      .map((id) => state.combatants[id])
      .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);

    drawFloatingBar(ctx, x, y, w, barH, 'Select target', 'Esc', true, false, '#64748b');
    totalBars = 1 + livingEnemies.length;

    livingEnemies.forEach((enemy, idx) => {
      const barY = y + (idx + 1) * (barH + barGap);
      const isHovered = uiState.hoveredIndex === idx || uiState.selectedTargetId === enemy.id;
      if (isHovered) hoveredTooltip = `${enemy.name} (${enemy.stats.hp}/${enemy.stats.maxHp} HP)`;

      drawFloatingBar(ctx, x, barY, w, barH, enemy.name, '', true, isHovered, '#f43f5e');
    });
  }

  // Tooltip: separate strip below the menu stack with visible gap
  if (hoveredTooltip) {
    const tipY = y + totalBars * (barH + barGap) + 8;
    const tipH = 22;
    const tipW = Math.max(w + 20, 170);
    const tipX = x + 8; // Horizontal offset from menu

    ctx.fillStyle = 'rgba(10, 15, 26, 0.65)';
    ctx.fillRect(tipX, tipY, tipW, tipH);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'left';
    ctx.fillText(hoveredTooltip, tipX + 6, tipY + 14, tipW - 12);
  }

  ctx.restore();
}

/**
 * Draws a single floating command bar — no container, semi-transparent.
 * Selected bar offsets 12px left, higher opacity, with a pointer triangle.
 */
function drawFloatingBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  cost: string,
  enabled: boolean,
  isSelected: boolean,
  accentColor: string
): void {
  const offsetX = isSelected ? -12 : 0;
  const barX = x + offsetX;
  const barW = w - offsetX;
  const alpha = !enabled ? 0.35 : isSelected ? 0.85 : 0.55;

  // Bar background
  ctx.fillStyle = `rgba(10, 15, 26, ${alpha})`;
  ctx.fillRect(barX, y, barW, h);

  // Selected pointer triangle in the left overhang
  if (isSelected && enabled) {
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(barX, y + 3);
    ctx.lineTo(barX + 5, y + h / 2);
    ctx.lineTo(barX, y + h - 3);
    ctx.closePath();
    ctx.fill();
  }

  // Action label
  ctx.font = isSelected ? 'bold 14px monospace' : '14px monospace';
  ctx.fillStyle = !enabled ? '#475569' : isSelected ? '#ffffff' : accentColor;
  ctx.textAlign = 'left';
  ctx.fillText(label, barX + 10, y + h / 2 + 3, barW - 44);

  // Right-aligned cost/cooldown info
  if (cost) {
    ctx.font = '13px monospace';
    ctx.fillStyle = !enabled ? '#334155' : '#64748b';
    ctx.textAlign = 'right';
    ctx.fillText(cost, barX + barW - 6, y + h / 2 + 3);
  }
}

function drawFloatingReplayHUD(
  ctx: CanvasRenderingContext2D,
  _state: BattleState,
  replay: ReplayHUDState,
  width: number,
  height: number
): void {
  const hudW = 660;
  const hudH = 130;
  const hudX = (width - hudW) / 2;
  const hudY = height - hudH - 24;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 15, 26, 0.92)';
  ctx.fillRect(hudX, hudY, hudW, hudH);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX, hudY, hudW, hudH);

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`REPLAY: ${replay.encounterName.toUpperCase()} | ACT ${replay.currentActionIndex}/${replay.totalActions}`, hudX + 16, hudY + 24);

  // Timeline Progress Bar
  const barX = hudX + 16;
  const barY = hudY + 40;
  const barW = hudW - 32;
  const barH = 12;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);

  const progress = replay.totalActions > 0 ? Math.min(1, replay.currentActionIndex / replay.totalActions) : 0;
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(barX, barY, barW * progress, barH);

  // Controls hint
  ctx.font = '13px monospace';
  ctx.fillStyle = '#94a3b8';
  const playState = replay.isPlaying ? '⏸ PAUSE [Space]' : '▶ PLAY [Space]';
  ctx.fillText(`${playState}  |  Step: [← / →]  |  Speed: ${replay.playbackSpeed}x  |  Exit: [R]`, hudX + 12, hudY + 54);
  ctx.fillText('Samples: [1] Empire  [2] Shub  [3] Hadenman', hudX + 12, hudY + 72);

  ctx.restore();
}

function drawFloatingCombatLogOverlay(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  width: number,
  height: number
): void {
  const logW = 560;
  const logH = 140;
  const logX = (width - logW) / 2;
  const logY = height - logH - 30;

  ctx.save();
  ctx.fillStyle = 'rgba(10, 15, 26, 0.94)';
  ctx.fillRect(logX, logY, logW, logH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(logX, logY, logW, logH);

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('TACTICAL COMBAT LOG [Press L to Close]', logX + 12, logY + 18);

  const recent = state.log.slice(-5);
  recent.forEach((entry, idx) => {
    ctx.font = '13px monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`[T${entry.turnNumber}]`, logX + 12, logY + 38 + idx * 20);

    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(entry.message, logX + 44, logY + 38 + idx * 20, logW - 56);
  });

  ctx.restore();
}

function drawEndOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  bg: string,
  fg: string
): void {
  const { canvasWidth, canvasHeight } = LAYOUT;
  ctx.fillStyle = 'rgba(8, 11, 18, 0.85)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const boxW = 460;
  const boxH = 130;
  const boxX = (canvasWidth - boxW) / 2;
  const boxY = (canvasHeight - boxH) / 2;

  ctx.fillStyle = bg;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = fg;
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(title, canvasWidth / 2, boxY + 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText('Press [ENTER] or [SPACE] to Proceed', canvasWidth / 2, boxY + 90);
  ctx.textAlign = 'left';
}
