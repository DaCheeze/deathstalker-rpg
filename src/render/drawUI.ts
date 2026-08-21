/**
 * Renders the interactive Action Menu, Submenus, Tactical Combat Log, End Game Overlays,
 * and Replay Viewer Controls HUD.
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

  // 1. Top Header Controls (Audio Mute Toggle & Mode Switcher)
  drawTopHeaderControls(ctx, canvasWidth, replayState);

  // 2. ESP Blocker Banner (if any living psi-blocker is operational)
  const espBlocked = isEspBlocked(state);
  if (espBlocked) {
    ctx.fillStyle = '#450a0a';
    ctx.fillRect(30, 66, canvasWidth - 60, 16);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 66, canvasWidth - 60, 16);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('⚠️  PSI-BLOCKER DEVICE OPERATIONAL: PSIONIC POWERS SUPPRESSED (DESTROY PYLON TO RESTORE)', 40, 78);
  }

  // 3. Action Menu Console OR Replay Controls (Bottom Left)
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

  // 4. Tactical Combat Log (Bottom Right)
  ctx.fillStyle = THEME.panelBg;
  ctx.fillRect(logX, bottomY, logWidth, bottomHeight);
  ctx.strokeStyle = THEME.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(logX, bottomY, logWidth, bottomHeight);

  drawCombatLog(ctx, state, logX, bottomY, logWidth);

  // 5. Victory / Defeat Overlays (Live game mode only)
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
  replayState?: ReplayHUDState | null
): void {
  const isMuted = globalAudio.isMuted();

  // Top bar right side
  ctx.font = '10px monospace';

  // Mode badge
  ctx.fillStyle = replayState ? '#38bdf8' : '#34d399';
  const modeText = replayState ? '[🎬 REPLAY VIEWER (Press R to exit)]' : '[⚔️ LIVE COMBAT (Press R for Replays)]';
  ctx.fillText(modeText, 30, 20);

  // Audio Toggle Button
  const audioText = isMuted ? '[🔇 SOUND: OFF (M)]' : '[🔊 SOUND: ON (M)]';
  ctx.fillStyle = isMuted ? '#f87171' : '#a7f3d0';
  ctx.textAlign = 'right';
  ctx.fillText(audioText, width - 30, 20);
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
  ctx.fillRect(x + 2, y + 2, w - 4, 28);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  const sampleInfo = replay.sampleLabel ? ` - ${replay.sampleLabel}` : '';
  ctx.fillText(`REPLAY: ${replay.encounterName.toUpperCase()}${sampleInfo}`, x + 12, y + 20);

  // Status info
  ctx.font = '11px monospace';
  ctx.fillStyle = THEME.textMain;
  ctx.fillText(`Round: ${replay.currentRound.toFixed(1)} | Action: ${replay.currentActionIndex} / ${replay.totalActions} | Seed: ${replay.seed}`, x + 14, y + 48);

  const activeActor = state.combatants[state.activeActorId];
  const actorName = activeActor ? activeActor.name : 'Completed';
  ctx.fillStyle = '#fcd34d';
  ctx.fillText(`Active Unit: ${actorName}`, x + 14, y + 66);

  // Timeline Scrub Bar
  const scrubX = x + 14;
  const scrubY = y + 80;
  const scrubW = w - 28;
  const scrubH = 16;

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
  const btnY = y + 108;
  const btnH = 26;

  // 1. Play / Pause
  const playLabel = replay.isPlaying ? '⏸ PAUSE [Space]' : '▶ PLAY [Space]';
  drawButton(ctx, x + 14, btnY, 110, btnH, playLabel, true, false, replay.isPlaying ? '#f59e0b' : '#34d399');

  // 2. Step Prev / Next
  drawButton(ctx, x + 130, btnY, 80, btnH, '|< STEP [←]', true, false, '#38bdf8');
  drawButton(ctx, x + 216, btnY, 80, btnH, 'STEP >| [→]', true, false, '#38bdf8');

  // 3. Speed selector
  const speedX = x + 304;
  const speeds = [0.5, 1, 2, 4, 10];
  const speedLabels = ['0.5x', '1x', '2x', '4x', 'MAX'];
  const spdW = 38;

  speeds.forEach((s, idx) => {
    const isCur = replay.playbackSpeed === s || (s === 10 && replay.playbackSpeed >= 8);
    drawButton(ctx, speedX + idx * (spdW + 4), btnY, spdW, btnH, speedLabels[idx]!, true, isCur, isCur ? '#38bdf8' : '#64748b');
  });

  // Replay selector hint
  ctx.fillStyle = THEME.textMuted;
  ctx.font = '10px monospace';
  ctx.fillText('Press [1-5] to load Encounter Samples | [Esc] Live Combat', x + 14, y + h - 12);
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
  ctx.fillRect(x + 2, y + 2, w - 4, 28);
  ctx.fillStyle = isPlayerTurn ? '#38bdf8' : THEME.textMuted;
  ctx.font = 'bold 12px monospace';

  if (state.status !== 'in_progress') {
    ctx.fillText('TACTICAL ENGAGEMENT CONCLUDED', x + 12, y + 20);
    return;
  }

  if (isPlayerTurn && activeActor) {
    ctx.fillText(`COMMAND: ${activeActor.name.toUpperCase()} (TURN ${state.turnNumber})`, x + 12, y + 20);
  } else {
    ctx.fillStyle = '#f87171';
    ctx.fillText(`HOSTILE ENGAGEMENT IN PROGRESS...`, x + 12, y + 20);
    ctx.fillStyle = THEME.textMuted;
    ctx.font = '11px monospace';
    ctx.fillText('Awaiting enemy action...', x + 14, y + 60);
    return;
  }

  if (!activeActor) return;

  const btnWidth = w - 24;
  const btnHeight = 28;
  const startBtnY = y + 36;

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
        { key: '1', label: `1. 🛌 RECOVER FROM CRASH (${activeActor.crashTurns}T REMAINING)`, enabled: true, color: '#c084fc' },
        { key: '2', label: '2. ⚡ DISRUPTOR [CRASHED - RECOVERING]', enabled: false, color: '#475569' },
        { key: '3', label: '3. 🛡️ FORCE SHIELD [CRASHED - RECOVERING]', enabled: false, color: '#475569' },
        { key: '4', label: '4. 🔥 BOOST [CRASHED - RECOVERING]', enabled: false, color: '#475569' },
        { key: '5', label: '5. 🔮 PSIONICS [CRASHED - RECOVERING]', enabled: false, color: '#475569' },
        { key: '6', label: `6. PASS TURN (${activeActor.crashTurns}T REMAINING)`, enabled: true, color: '#94a3b8' },
      ];
    } else {
      mainButtons = [
        { key: '1', label: '1. WEAPON ATTACK', enabled: true, color: '#38bdf8' },
        {
          key: '2',
          label: isDisruptorReady ? '2. ⚡ FIRE DISRUPTOR (READY)' : `2. ⚡ DISRUPTOR (CD: ${activeActor.disruptorCooldown}T)`,
          enabled: isDisruptorReady,
          color: isDisruptorReady ? '#34d399' : '#64748b',
        },
        {
          key: '3',
          label: activeActor.hasForceShield ? '3. 🛡️ FORCE SHIELD (ACTIVE)' : '3. 🛡️ RAISE FORCE SHIELD',
          enabled: !activeActor.hasForceShield,
          color: '#00f2fe',
        },
        {
          key: '4',
          label: !activeActor.canBoost
            ? '4. 🔥 BOOST [CAPTAIN ONLY]'
            : activeActor.isBoosting
            ? `4. 🔥 VENT BOOST (Burnout: ${activeActor.burnout})`
            : `4. 🔥 INJECT BOOST (+50% Dmg, +30% Spd)`,
          enabled: activeActor.canBoost,
          color: activeActor.canBoost ? '#fbbf24' : '#64748b',
        },
        {
          key: '5',
          label: blockedByPsi
            ? '5. 🔮 PSIONICS [PSI-BLOCKER ACTIVE]'
            : `5. 🔮 PSIONICS (${activeActor.stats.esp} ESP)`,
          enabled: isEsperUsable,
          color: blockedByPsi ? '#ef4444' : '#c084fc',
        },
        { key: '6', label: '6. PASS TURN', enabled: true, color: '#94a3b8' },
      ];
    }

    mainButtons.forEach((btn, idx) => {
      const btnY = startBtnY + idx * (btnHeight + 4);
      const isHovered = uiState.hoveredIndex === idx;
      drawButton(ctx, x + 12, btnY, btnWidth, btnHeight, btn.label, btn.enabled, isHovered, btn.color);
    });
  } else if (uiState.menuMode === 'attack_select') {
    ctx.fillStyle = THEME.textHighlight;
    ctx.font = '11px monospace';
    ctx.fillText('SELECT WEAPON ABILITY [Esc: Back]:', x + 14, startBtnY - 4);

    const attacks = activeActor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a) => a && (a.category === 'melee' || a.category === 'projectile'));

    attacks.forEach((atk, idx) => {
      if (!atk) return;
      const btnY = startBtnY + 12 + idx * (btnHeight + 6);
      const isHovered = uiState.hoveredIndex === idx;
      const label = `${idx + 1}. ${atk.name} (${atk.category.toUpperCase()} - ${atk.powerMultiplier}x Power)`;
      drawButton(ctx, x + 12, btnY, btnWidth, btnHeight, label, true, isHovered, '#38bdf8');
    });
  } else if (uiState.menuMode === 'esper_select') {
    ctx.fillStyle = THEME.textHighlight;
    ctx.font = '11px monospace';
    ctx.fillText(`SELECT PSIONIC POWER (${activeActor.stats.esp} ESP Available) [Esc: Back]:`, x + 14, startBtnY - 4);

    const espers = activeActor.abilityIds
      .map((id) => state.abilities[id])
      .filter((a) => a && a.category === 'esper');

    espers.forEach((esp, idx) => {
      if (!esp) return;
      const btnY = startBtnY + 12 + idx * (btnHeight + 6);
      const isHovered = uiState.hoveredIndex === idx;
      const canAfford = activeActor.stats.esp >= esp.espCost;
      const label = `${idx + 1}. ${esp.name} [${esp.espCost} ESP] - ${esp.description}`;
      drawButton(ctx, x + 12, btnY, btnWidth, btnHeight, label, canAfford, isHovered, '#c084fc');
    });
  } else if (uiState.menuMode === 'target_select') {
    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('SELECT TARGET HOSTILE IN ARENA OR LIST [Esc: Cancel]:', x + 14, startBtnY - 4);

    const livingEnemies = state.enemyIds
      .map((id) => state.combatants[id])
      .filter((c): c is Combatant => c !== undefined && c.stats.hp > 0);

    livingEnemies.forEach((enemy, idx) => {
      const btnY = startBtnY + 12 + idx * (btnHeight + 6);
      const isHovered = uiState.hoveredIndex === idx || uiState.selectedTargetId === enemy.id;
      const label = `${idx + 1}. ${enemy.name} (${enemy.stats.hp}/${enemy.stats.maxHp} HP)${enemy.hasForceShield ? ' [🛡️ Shielded]' : ''}`;
      drawButton(ctx, x + 12, btnY, btnWidth, btnHeight, label, true, isHovered, '#f43f5e');
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

  ctx.font = isHovered ? 'bold 11px monospace' : '11px monospace';
  ctx.fillStyle = !enabled ? '#4b5563' : isHovered ? '#ffffff' : accentColor;
  ctx.fillText(label, x + 8, y + h / 2 + 4, w - 16);
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
  ctx.fillRect(x + 2, y + 2, w - 4, 28);
  ctx.fillStyle = THEME.textHighlight;
  ctx.font = 'bold 12px monospace';
  ctx.fillText('TACTICAL COMBAT LOG', x + 12, y + 20);

  // Recent log lines
  const linesToShow = state.log.slice(-10);
  const startLogY = y + 44;
  const lineHeight = 19;

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
    ctx.font = '10px monospace';
    ctx.fillText(`[T${entry.turnNumber}]`, x + 12, itemY);

    ctx.fillStyle = color;
    ctx.font = '11px monospace';
    ctx.fillText(entry.message, x + 50, itemY, w - 62);
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
