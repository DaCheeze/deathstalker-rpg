/**
 * Renders the Header bar, interactive Action Menu, Submenus, Tactical Combat Log,
 * End Game Overlays, and Replay Viewer Controls HUD.
 * Strictly read-only canvas drawing.
 */

import { BattleState, Combatant } from '../core/types';
import { isEspBlocked } from '../core/battle';
import { globalAudio } from '../audio/synth';
import { LAYOUT, THEME } from './theme';

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

export function drawUI(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  uiState: UIState,
  isPlayerTurn: boolean,
  replayState?: ReplayHUDState | null
): void {
  const { bottomY, bottomHeight, menuX, menuWidth, logX, logWidth, canvasWidth } = LAYOUT;

  // 1. Top Header Controls (Mode Switcher, Encounter Info, Audio Mute Toggle)
  drawTopHeaderControls(ctx, canvasWidth, state, replayState);

  // 2. Action Menu Console OR Replay Controls (Bottom Left)
  ctx.fillStyle = THEME.panelBg;
  ctx.fillRect(menuX, bottomY, menuWidth, bottomHeight);
  ctx.strokeStyle = replayState ? '#38bdf8' : isPlayerTurn ? THEME.partyPrimary : THEME.panelBorder;
  ctx.lineWidth = replayState || isPlayerTurn ? 2 : 1;
  ctx.strokeRect(menuX, bottomY, menuWidth, bottomHeight);

  if (replayState) {
    drawReplayControls(ctx, state, replayState, menuX, bottomY, menuWidth, bottomHeight);
  } else {
    drawActionMenu(ctx, state, uiState, isPlayerTurn, menuX, bottomY, menuWidth);
  }

  // 3. Tactical Combat Log (Bottom Right)
  ctx.fillStyle = THEME.panelBg;
  ctx.fillRect(logX, bottomY, logWidth, bottomHeight);
  ctx.strokeStyle = THEME.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(logX, bottomY, logWidth, bottomHeight);

  drawCombatLog(ctx, state, logX, bottomY, logWidth);

  // 4. Victory / Defeat Overlays (Live game mode only)
  if (!replayState) {
    if (state.status === 'victory') {
      drawEndOverlay(ctx, 'VICTORY: ALL HOSTILES ELIMINATED', '#065f46', '#34d399');
    } else if (state.status === 'defeat') {
      drawEndOverlay(ctx, 'DEFEAT: THE CREW HAS FALLEN', '#7f1d1d', '#f87171');
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

  ctx.font = 'bold 10px monospace';

  // Mode badge (Left)
  ctx.fillStyle = replayState ? '#38bdf8' : '#34d399';
  const modeText = replayState ? '[🎬 REPLAY VIEWER (Press R to Exit)]' : '[⚔️ LIVE COMBAT (Press R for Replay)]';
  ctx.textAlign = 'left';
  ctx.fillText(modeText, 20, headerY + 14);

  // Encounter Info (Center)
  const encTitle = replayState
    ? `TACTICAL REPLAY: ${replayState.encounterName.toUpperCase()}`
    : `TACTICAL ENGAGEMENT | TURN ${state.turnNumber}`;
  ctx.fillStyle = THEME.textMuted;
  ctx.textAlign = 'center';
  ctx.fillText(encTitle, width / 2, headerY + 14);

  // Audio Toggle Button (Right)
  const audioText = isMuted ? '[🔇 SOUND: OFF (M)]' : '[🔊 SOUND: ON (M)]';
  ctx.fillStyle = isMuted ? '#f87171' : '#a7f3d0';
  ctx.textAlign = 'right';
  ctx.fillText(audioText, width - 20, headerY + 14);
  ctx.textAlign = 'left';
}

function drawReplayControls(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  replay: ReplayHUDState,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  // Header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 2, y + 2, w - 4, 24);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  const sampleInfo = replay.sampleLabel ? ` - ${replay.sampleLabel}` : '';
  ctx.fillText(`REPLAY: ${replay.encounterName.toUpperCase()}${sampleInfo}`, x + 10, y + 17);

  // Status info
  ctx.font = '10px monospace';
  ctx.fillStyle = THEME.textMain;
  ctx.fillText(`Rnd: ${replay.currentRound.toFixed(1)} | Act: ${replay.currentActionIndex}/${replay.totalActions} | Seed: ${replay.seed}`, x + 10, y + 42);

  const activeActor = state.combatants[state.activeActorId];
  const actorName = activeActor ? activeActor.name : 'Completed';
  ctx.fillStyle = '#fcd34d';
  ctx.fillText(`Active Unit: ${actorName}`, x + 10, y + 58);

  // Timeline Scrub Bar
  const scrubX = x + 10;
  const scrubY = y + 70;
  const scrubW = w - 20;
  const scrubH = 14;

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(scrubX, scrubY, scrubW, scrubH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(scrubX, scrubY, scrubW, scrubH);

  // Filled progress
  const progressPct = replay.totalActions > 0 ? Math.min(1, replay.currentActionIndex / replay.totalActions) : 0;
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(scrubX, scrubY, scrubW * progressPct, scrubH);

  // Thumb knob
  const knobX = scrubX + scrubW * progressPct;
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(knobX - 3, scrubY - 2, 6, scrubH + 4);

  // Playback Control Buttons
  const btnY = y + 96;
  const btnH = 26;

  // 1. Play / Pause
  const playLabel = replay.isPlaying ? '⏸ PAUSE [Space]' : '▶ PLAY [Space]';
  drawButton(ctx, x + 10, btnY, 110, btnH, playLabel, true, false, replay.isPlaying ? '#f59e0b' : '#34d399');

  // 2. Step Prev / Next
  drawButton(ctx, x + 126, btnY, 78, btnH, '|< [←]', true, false, '#38bdf8');
  drawButton(ctx, x + 208, btnY, 78, btnH, '[→] >|', true, false, '#38bdf8');

  // 3. Speed selector
  const speedX = x + 294;
  const speeds = [0.5, 1, 2, 4, 10];
  const speedLabels = ['0.5x', '1x', '2x', '4x', 'MAX'];
  const spdW = 32;

  speeds.forEach((s, idx) => {
    const isCur = replay.playbackSpeed === s || (s === 10 && replay.playbackSpeed >= 8);
    drawButton(ctx, speedX + idx * (spdW + 4), btnY, spdW, btnH, speedLabels[idx]!, true, isCur, isCur ? '#38bdf8' : '#64748b');
  });

  // Replay selector hint
  ctx.fillStyle = THEME.textMuted;
  ctx.font = '9px monospace';
  ctx.fillText('Press [1-5] for Encounter Samples | [R/Esc] Live Combat', x + 10, y + h - 12);
}

function drawActionMenu(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  uiState: UIState,
  isPlayerTurn: boolean,
  x: number,
  y: number,
  w: number
): void {
  const activeActor = state.combatants[state.activeActorId] as Combatant | undefined;

  // Header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 2, y + 2, w - 4, 24);
  ctx.fillStyle = isPlayerTurn ? '#38bdf8' : THEME.textMuted;
  ctx.font = 'bold 11px monospace';

  if (state.status !== 'in_progress') {
    ctx.fillText('TACTICAL ENGAGEMENT CONCLUDED', x + 10, y + 17);
    return;
  }

  if (isPlayerTurn && activeActor) {
    ctx.fillText(`COMMAND: ${activeActor.name.toUpperCase()} (TURN ${state.turnNumber})`, x + 10, y + 17);
  } else {
    ctx.fillStyle = '#f87171';
    ctx.fillText(`HOSTILE ENGAGEMENT IN PROGRESS...`, x + 10, y + 17);
    ctx.fillStyle = THEME.textMuted;
    ctx.font = '10px monospace';
    ctx.fillText('Awaiting enemy action...', x + 14, y + 60);
    return;
  }

  if (!activeActor) return;

  const startBtnY = y + 34;

  // Render based on UI menu mode
  if (uiState.menuMode === 'main') {
    const isCrashed = activeActor.crashTurns > 0;
    const isDisruptorReady = activeActor.disruptorCooldown === 0 && !isCrashed;
    const hasEsperAbilities = activeActor.abilityIds.some((id) => state.abilities[id]?.category === 'esper');
    const blockedByPsi = isEspBlocked(state);
    const isEsperUsable = !isCrashed && hasEsperAbilities && !blockedByPsi && activeActor.stats.esp > 0;

    let mainButtons: { key: string; label: string; enabled: boolean; color: string }[];

    if (isCrashed) {
      mainButtons = [
        { key: '1', label: `1. RECOVER (${activeActor.crashTurns}T REMAINING)`, enabled: true, color: '#c084fc' },
        { key: '2', label: '2. DISRUPTOR [CRASHED]', enabled: false, color: '#475569' },
        { key: '3', label: '3. FORCE SHIELD [CRASHED]', enabled: false, color: '#475569' },
        { key: '4', label: '4. BOOST [CRASHED]', enabled: false, color: '#475569' },
        { key: '5', label: '5. PSIONICS [CRASHED]', enabled: false, color: '#475569' },
        { key: '6', label: `6. PASS TURN (${activeActor.crashTurns}T)`, enabled: true, color: '#94a3b8' },
      ];
    } else {
      mainButtons = [
        { key: '1', label: '1. WEAPON ATTACK', enabled: true, color: '#38bdf8' },
        {
          key: '2',
          label: isDisruptorReady ? '2. ⚡ FIRE DISRUPTOR' : `2. ⚡ DISRUPTOR (${activeActor.disruptorCooldown}T)`,
          enabled: isDisruptorReady,
          color: isDisruptorReady ? '#34d399' : '#64748b',
        },
        {
          key: '3',
          label: activeActor.hasForceShield ? '3. 🛡️ SHIELD (ACTIVE)' : '3. 🛡️ RAISE SHIELD',
          enabled: !activeActor.hasForceShield,
          color: '#00f2fe',
        },
        {
          key: '4',
          label: !activeActor.canBoost
            ? '4. 🔥 BOOST [CAPTAIN ONLY]'
            : activeActor.isBoosting
            ? `4. 🔥 VENT BOOST (B:${activeActor.burnout})`
            : `4. 🔥 INJECT BOOST`,
          enabled: activeActor.canBoost,
          color: activeActor.canBoost ? '#fbbf24' : '#64748b',
        },
        {
          key: '5',
          label: blockedByPsi
            ? '5. 🔮 PSIONICS [BLOCKED]'
            : `5. 🔮 PSIONICS (${activeActor.stats.esp}E)`,
          enabled: isEsperUsable,
          color: blockedByPsi ? '#ef4444' : '#c084fc',
        },
        { key: '6', label: '6. PASS TURN', enabled: true, color: '#94a3b8' },
      ];
    }

    // 2-column x 3-row compact grid
    const colW = (w - 26) / 2;
    const btnH = 36;
    const gapX = 8;
    const gapY = 6;

    mainButtons.forEach((btn, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const btnX = x + 9 + col * (colW + gapX);
      const btnY = startBtnY + row * (btnH + gapY);
      const isHovered = uiState.hoveredIndex === idx;
      drawButton(ctx, btnX, btnY, colW, btnH, btn.label, btn.enabled, isHovered, btn.color);
    });
  } else if (uiState.menuMode === 'attack_select') {
    ctx.fillStyle = THEME.textHighlight;
    ctx.font = '10px monospace';
    ctx.fillText('SELECT WEAPON ABILITY [Esc: Back]:', x + 10, startBtnY - 2);

    const attacks = activeActor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a) => a && (a.category === 'melee' || a.category === 'projectile'));

    const btnW = w - 20;
    const btnH = 34;
    attacks.forEach((atk, idx) => {
      if (!atk) return;
      const btnY = startBtnY + 10 + idx * (btnH + 6);
      const isHovered = uiState.hoveredIndex === idx;
      const label = `${idx + 1}. ${atk.name} (${atk.category.toUpperCase()} - ${atk.powerMultiplier}x Power)`;
      drawButton(ctx, x + 10, btnY, btnW, btnH, label, true, isHovered, '#38bdf8');
    });
  } else if (uiState.menuMode === 'esper_select') {
    ctx.fillStyle = THEME.textHighlight;
    ctx.font = '10px monospace';
    ctx.fillText(`SELECT PSIONIC POWER (${activeActor.stats.esp} ESP) [Esc: Back]:`, x + 10, startBtnY - 2);

    const espers = activeActor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a) => a && a.category === 'esper');

    const btnW = w - 20;
    const btnH = 34;
    espers.forEach((esp, idx) => {
      if (!esp) return;
      const btnY = startBtnY + 10 + idx * (btnH + 6);
      const isHovered = uiState.hoveredIndex === idx;
      const canAfford = activeActor.stats.esp >= esp.espCost;
      const label = `${idx + 1}. ${esp.name} [${esp.espCost} ESP] - ${esp.description}`;
      drawButton(ctx, x + 10, btnY, btnW, btnH, label, canAfford, isHovered, '#c084fc');
    });
  } else if (uiState.menuMode === 'target_select') {
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('SELECT TARGET HOSTILE IN ARENA OR LIST [Esc: Cancel]:', x + 10, startBtnY - 2);

    const livingEnemies = state.enemyIds
      .map((id) => state.combatants[id])
      .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);

    const btnW = w - 20;
    const btnH = 28;
    livingEnemies.forEach((enemy, idx) => {
      const btnY = startBtnY + 8 + idx * (btnH + 4);
      const isHovered = uiState.hoveredIndex === idx || uiState.selectedTargetId === enemy.id;
      const label = `${idx + 1}. ${enemy.name} (${enemy.stats.hp}/${enemy.stats.maxHp} HP)${enemy.hasForceShield ? ' [🛡️ Shield]' : ''}`;
      drawButton(ctx, x + 10, btnY, btnW, btnH, label, true, isHovered, '#f43f5e');
    });
  }
}

function drawButton(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  enabled: boolean,
  isHovered: boolean,
  accentColor: string
): void {
  ctx.fillStyle = !enabled ? '#111827' : isHovered ? '#1e293b' : '#0f172a';
  ctx.fillRect(x, y, w, h);

  ctx.strokeStyle = !enabled ? '#374151' : isHovered ? accentColor : '#334155';
  ctx.lineWidth = isHovered ? 2 : 1;
  ctx.strokeRect(x, y, w, h);

  ctx.font = isHovered ? 'bold 10px monospace' : '10px monospace';
  ctx.fillStyle = !enabled ? '#4b5563' : isHovered ? '#ffffff' : accentColor;
  ctx.fillText(label, x + 6, y + h / 2 + 4, w - 12);
}

function drawCombatLog(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  x: number,
  y: number,
  w: number
): void {
  // Header
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x + 2, y + 2, w - 4, 24);
  ctx.fillStyle = THEME.textHighlight;
  ctx.font = 'bold 11px monospace';
  ctx.fillText('TACTICAL COMBAT LOG', x + 10, y + 17);

  // 4 Visible Lines of recent log
  const linesToShow = state.log.slice(-4);
  const startLogY = y + 44;
  const lineHeight = 28;

  linesToShow.forEach((entry, idx) => {
    const itemY = startLogY + idx * lineHeight;
    let color = THEME.textMain;

    if (entry.message.includes('DISRUPTOR')) color = '#34d399';
    else if (entry.message.includes('Shield absorbed') || entry.message.includes('BLOCKED')) color = '#38bdf8';
    else if (entry.message.includes('FATAL') || entry.message.includes('VICTORY')) color = '#a7f3d0';
    else if (entry.message.includes('DEFEAT') || entry.message.includes('KIA') || entry.message.includes('FALLEN')) color = '#fca5a5';
    else if (entry.message.includes('BOOST') || entry.message.includes('BURN')) color = '#fcd34d';
    else if (entry.message.includes('displaced')) color = '#d8b4fe';

    ctx.fillStyle = THEME.textMuted;
    ctx.font = '9px monospace';
    ctx.fillText(`[T${entry.turnNumber}]`, x + 10, itemY);

    ctx.fillStyle = color;
    ctx.font = '10px monospace';
    ctx.fillText(entry.message, x + 44, itemY, w - 54);
  });
}

function drawEndOverlay(
  ctx: CanvasRenderingContext2D,
  title: string,
  bg: string,
  fg: string
): void {
  const { canvasWidth, canvasHeight } = LAYOUT;
  ctx.fillStyle = 'rgba(10, 13, 20, 0.85)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const boxW = 540;
  const boxH = 160;
  const boxX = (canvasWidth - boxW) / 2;
  const boxY = (canvasHeight - boxH) / 2;

  ctx.fillStyle = bg;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = fg;
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = fg;
  ctx.font = THEME.fontBanner;
  ctx.textAlign = 'center';
  ctx.fillText(title, canvasWidth / 2, boxY + 60);

  ctx.fillStyle = THEME.textHighlight;
  ctx.font = THEME.fontHeader;
  ctx.fillText('Press [ENTER] or [SPACE] for Next Encounter / Restart', canvasWidth / 2, boxY + 110);
  ctx.textAlign = 'left';
}
