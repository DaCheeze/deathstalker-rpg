/**
 * Renders Party and Enemy combatant cards in the central arena.
 * Enhanced with distinct geometric unit silhouettes, Valen burnout danger gauge,
 * psi-blocker field indicators, hexagonal force shield barriers, and impact flinch offsets.
 */

import { BattleState, Combatant } from '../core/types';
import { isEspBlocked } from '../core/battle';
import { LAYOUT, THEME } from './theme';

interface FlinchAnimState {
  offset: number;
  until: number;
}

const flinchMap = new Map<string, FlinchAnimState>();

export function triggerCombatantFlinch(id: string, distance: number = 10, durationMs: number = 140): void {
  flinchMap.set(id, {
    offset: distance,
    until: performance.now() + durationMs,
  });
}

export function drawCombatants(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  selectedTargetId: string | null,
  hoveredTargetId: string | null
): void {
  const { arenaY, arenaHeight, partyX, partyWidth, enemyX, enemyWidth } = LAYOUT;
  const gap = 6;
  const isAllEnemiesTargeted = selectedTargetId === 'ALL_ENEMIES';
  const espBlocked = isEspBlocked(state);

  // 1. Draw Subtle Psi-Blocker Field Ripple if active
  if (espBlocked) {
    drawPsiBlockerField(ctx);
  }

  // 2. Draw Party Member cards
  const partyCards = state.partyIds.map((id) => state.combatants[id]);
  const partyCount = Math.max(1, partyCards.length);
  const partyCardHeight = Math.floor((arenaHeight - (partyCount - 1) * gap) / partyCount);

  partyCards.forEach((c, idx) => {
    if (!c) return;
    const y = arenaY + idx * (partyCardHeight + gap);
    drawCombatantCard(
      ctx,
      c,
      partyX,
      y,
      partyWidth,
      partyCardHeight,
      c.id === state.activeActorId,
      c.id === selectedTargetId,
      c.id === hoveredTargetId,
      false,
      espBlocked
    );
  });

  // 3. Draw Enemy cards (dynamically sized for up to 6 enemies)
  const enemyCards = state.enemyIds.map((id) => state.combatants[id]);
  const enemyCount = Math.max(1, enemyCards.length);
  const enemyCardHeight = Math.floor((arenaHeight - (enemyCount - 1) * gap) / enemyCount);

  enemyCards.forEach((c, idx) => {
    if (!c) return;
    const y = arenaY + idx * (enemyCardHeight + gap);
    const isTargeted = isAllEnemiesTargeted ? c.stats.hp > 0 : c.id === selectedTargetId;
    drawCombatantCard(
      ctx,
      c,
      enemyX,
      y,
      enemyWidth,
      enemyCardHeight,
      c.id === state.activeActorId,
      isTargeted,
      c.id === hoveredTargetId,
      isAllEnemiesTargeted,
      espBlocked
    );
  });
}

function drawPsiBlockerField(ctx: CanvasRenderingContext2D): void {
  const { arenaY, arenaHeight, canvasWidth } = LAYOUT;
  const now = performance.now();
  const wave = Math.sin(now * 0.003) * 0.5 + 0.5;

  ctx.save();
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.08 + wave * 0.08})`;
  ctx.lineWidth = 1;

  // Diagonal interference lines
  const spacing = 28;
  for (let x = -arenaHeight; x < canvasWidth + arenaHeight; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, arenaY);
    ctx.lineTo(x + arenaHeight, arenaY + arenaHeight);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCombatantCard(
  ctx: CanvasRenderingContext2D,
  c: Combatant,
  x: number,
  y: number,
  w: number,
  h: number,
  isActive: boolean,
  isSelectedTarget: boolean,
  isHovered: boolean,
  isAllTarget: boolean,
  espBlocked: boolean
): void {
  const isDead = c.stats.hp <= 0;
  const isParty = c.faction === 'party';
  const accentColor = c.accentColor || (isParty ? THEME.partyPrimary : THEME.empirePrimary);

  // Compute flinch knockback
  let flinchX = 0;
  const flinch = flinchMap.get(c.id);
  if (flinch) {
    const remaining = flinch.until - performance.now();
    if (remaining > 0) {
      const progress = remaining / 140;
      flinchX = (isParty ? -1 : 1) * flinch.offset * progress;
    } else {
      flinchMap.delete(c.id);
    }
  }

  const renderX = x + flinchX;

  // Card background
  if (isDead) {
    ctx.fillStyle = '#08090d';
  } else if (isActive) {
    ctx.fillStyle = isParty ? '#132840' : '#33181b';
  } else {
    ctx.fillStyle = isParty ? THEME.partyCardBg : (
      c.faction === 'empire' ? THEME.empireCardBg :
      c.faction === 'shub' ? THEME.shubCardBg : THEME.hadenmanCardBg
    );
  }
  ctx.fillRect(renderX, y, w, h);

  // Accent vertical stripe
  if (!isDead) {
    ctx.fillStyle = accentColor;
    ctx.fillRect(renderX, y, 4, h);
  }

  // Border & Glow
  let borderColor = THEME.panelBorder;
  let lineWidth = 1;

  if (isSelectedTarget && !isDead) {
    borderColor = isAllTarget ? '#fb923c' : accentColor;
    lineWidth = 3;
  } else if (isHovered && !isDead) {
    borderColor = '#fbbf24';
    lineWidth = 2;
  } else if (isActive && !isDead) {
    borderColor = isParty ? '#38bdf8' : '#f87171';
    lineWidth = 2;
  }
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(renderX, y, w, h);

  // Target Cursor Indicator
  if (isSelectedTarget && !isDead) {
    ctx.fillStyle = isAllTarget ? '#fb923c' : accentColor;
    ctx.font = 'bold 11px monospace';
    const cursorText = isAllTarget ? 'ALL ▶' : 'TARGET ▶';
    ctx.fillText(cursorText, renderX - 68, y + h / 2 + 4);
  }

  // Active Aura
  if (isActive && !isDead) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(renderX, y, 6, h);
  }

  // 1. Draw Distinct Geometric Silhouette (Left of card)
  const silhouetteSize = Math.min(38, h - 16);
  const silX = renderX + 12 + silhouetteSize / 2;
  const silY = y + h / 2;
  drawUnitSilhouette(ctx, c, silX, silY, silhouetteSize, isParty, isDead, accentColor, espBlocked);

  // Text content starts to the right of the silhouette
  const textStartX = renderX + silhouetteSize + 22;

  // Name & Role
  const displayName = c.displayName || c.name;
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.textHighlight;
  ctx.fillText(displayName, textStartX, y + 17);

  ctx.font = '10px monospace';
  ctx.fillStyle = isParty ? '#7dd3fc' : accentColor;
  ctx.fillText(c.role, textStartX, y + 30);

  if (isDead) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('[ KIA / DESTROYED ]', renderX + w - 140, y + 22);
    return;
  }

  // HP Bar (Right aligned)
  const barWidth = 130;
  const barHeight = 7;
  const hpPercent = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));
  const barX = renderX + w - barWidth - 14;
  const hpBarY = y + 10;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, hpBarY, barWidth, barHeight);
  ctx.fillStyle = hpPercent > 0.3 ? THEME.hpColor : THEME.hpLowColor;
  ctx.fillRect(barX, hpBarY, barWidth * hpPercent, barHeight);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, hpBarY, barWidth, barHeight);

  ctx.fillStyle = THEME.textMain;
  ctx.font = '9px monospace';
  ctx.fillText(`HP: ${c.stats.hp}/${c.stats.maxHp}`, barX, hpBarY + 16);

  // ESP Bar (if esper)
  if (c.stats.maxEsp > 0) {
    const espBarY = y + 31;
    const espPercent = Math.max(0, Math.min(1, c.stats.esp / c.stats.maxEsp));
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, espBarY, barWidth, barHeight);
    ctx.fillStyle = espBlocked ? '#475569' : THEME.espColor;
    ctx.fillRect(barX, espBarY, barWidth * espPercent, barHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, espBarY, barWidth, barHeight);

    ctx.fillStyle = espBlocked ? '#f87171' : THEME.textMuted;
    ctx.font = '9px monospace';
    const espLabel = espBlocked ? `ESP: BLOCKED` : `ESP: ${c.stats.esp}/${c.stats.maxEsp}`;
    ctx.fillText(espLabel, barX, espBarY + 15);
  }

  // Status Badges & Valen Burnout Meter
  drawStatusBadges(ctx, c, textStartX, y + 43);

  // Force Shield Hexagonal Barrier Overlay
  if (c.hasForceShield) {
    drawHexShieldBarrier(ctx, renderX + w - 45, y + h / 2, 24);
  }
}

/**
 * Procedural Geometric Silhouette Renderer for distinct visual identification.
 */
function drawUnitSilhouette(
  ctx: CanvasRenderingContext2D,
  c: Combatant,
  cx: number,
  cy: number,
  size: number,
  isParty: boolean,
  isDead: boolean,
  accentColor: string,
  espBlocked: boolean
): void {
  ctx.save();
  ctx.translate(cx, cy);

  const r = size / 2;
  const strokeColor = isDead ? '#475569' : accentColor;
  const fillColor = isDead ? '#1e293b' : isParty ? '#0f2942' : '#2b1b1b';

  ctx.lineWidth = isDead ? 1 : 2;
  ctx.strokeStyle = strokeColor;
  ctx.fillStyle = fillColor;

  const id = c.id.toLowerCase();

  if (id.includes('valen')) {
    // Valen: Broad Captain Crest / Pentagon Shield with dual booster vanes
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.9, -r * 0.3);
    ctx.lineTo(r * 0.7, r * 0.9);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.7, r * 0.9);
    ctx.lineTo(-r * 0.9, -r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Booster vanes
    if (!isDead && c.isBoosting) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-r - 3, -4, 3, 8);
      ctx.fillRect(r, -4, 3, 8);
    }
  } else if (id.includes('lyra')) {
    // Lyra: Slender Diamond with orbiting psionic nodes
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.7, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Orbiting psi-wisps (dim when blocked)
    if (!isDead) {
      const now = performance.now() * 0.004;
      const ringColor = espBlocked ? '#ef4444' : '#c084fc';
      ctx.fillStyle = ringColor;
      for (let i = 0; i < 3; i++) {
        const angle = now + (i * Math.PI * 2) / 3;
        const ox = Math.cos(angle) * (r + 4);
        const oy = Math.sin(angle) * (r + 4);
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id.includes('kaelen')) {
    // Kaelen: Fast Striker Lean Dual-Wedge / Chevron
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.8, r * 0.8);
    ctx.lineTo(0, r * 0.4);
    ctx.lineTo(-r * 0.8, r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (id.includes('tarek')) {
    // Tarek: Heavy Bulkhead Chassis with twin cannon barrels
    ctx.beginPath();
    ctx.rect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);
    ctx.fill();
    ctx.stroke();

    // Twin cannons
    if (!isDead) {
      ctx.fillStyle = accentColor;
      ctx.fillRect(r * 0.8, -r * 0.5, 5, 3);
      ctx.fillRect(r * 0.8, r * 0.2, 5, 3);
    }
  } else if (id.includes('psi_blocker')) {
    // Psi-Blocker Pylon: Distinct Mechanical Obelisk / Crystal Spire with 3 pulsing energy rings
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);
    ctx.lineTo(r * 0.5, r * 0.9);
    ctx.lineTo(-r * 0.5, r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      const pulse = Math.sin(performance.now() * 0.005) * 2;
      ctx.strokeStyle = '#ef4444';
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.3, r * 0.8 + pulse, 3, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, r * 0.3, r * 0.9 + pulse, 3, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (id.includes('drone')) {
    // Shub Drone: Small, agile inverted triangle / diamond with central cyclopean eye
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.lineTo(r * 0.8, -r * 0.7);
    ctx.lineTo(-r * 0.8, -r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Central glowing eye
    if (!isDead) {
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(0, -r * 0.1, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id.includes('stalker')) {
    // Shub Stalker: Multi-jointed jagged mantis blade frame
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, -r * 0.2);
    ctx.lineTo(r * 0.5, r);
    ctx.lineTo(0, r * 0.4);
    ctx.lineTo(-r * 0.5, r);
    ctx.lineTo(-r, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (id.includes('decimator')) {
    // Hadenman Decimator: Massive octagonal dreadnought bulk chassis
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r);
    ctx.lineTo(r * 0.5, -r);
    ctx.lineTo(r, -r * 0.5);
    ctx.lineTo(r, r * 0.5);
    ctx.lineTo(r * 0.5, r);
    ctx.lineTo(-r * 0.5, r);
    ctx.lineTo(-r, r * 0.5);
    ctx.lineTo(-r, -r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Heavy core
    if (!isDead) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-3, -3, 6, 6);
    }
  } else if (id.includes('enforcer')) {
    // Hadenman Enforcer: Heavy fortified wedge shield
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(r * 0.7, r);
    ctx.lineTo(-r * 0.7, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Imperial Legionnaire / Guard: Pavise Tower Shield
    ctx.beginPath();
    ctx.moveTo(-r * 0.7, -r);
    ctx.lineTo(r * 0.7, -r);
    ctx.lineTo(r * 0.7, r * 0.4);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.7, r * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawHexShieldBarrier(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number): void {
  const pulse = Math.sin(performance.now() * 0.006) * 0.2 + 0.8;
  ctx.save();
  ctx.strokeStyle = `rgba(56, 189, 248, ${0.75 * pulse})`;
  ctx.fillStyle = `rgba(14, 165, 233, ${0.12 * pulse})`;
  ctx.lineWidth = 2;

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawStatusBadges(ctx: CanvasRenderingContext2D, c: Combatant, x: number, y: number): void {
  let currX = x;

  // 1. Force Shield Badge
  if (c.hasForceShield) {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(currX, y, 68, 14);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, y, 68, 14);
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('SHIELD [100%]', currX + 3, y + 10);
    currX += 74;
  }

  // 2. Disruptor Charge Badge
  if (c.disruptorCooldown === 0) {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(currX, y, 64, 14);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, y, 64, 14);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('⚡ DISRUPTOR', currX + 3, y + 10);
    currX += 70;
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(currX, y, 48, 14);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, y, 48, 14);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText(`⚡ CD: ${c.disruptorCooldown}`, currX + 4, y + 10);
    currX += 54;
  }

  // 3. Valen Burnout Danger Meter
  if (c.canBoost) {
    const isHigh = c.burnout >= 5;
    const isMax = c.burnout >= 8;
    const meterW = 72;
    const meterH = 14;

    // Background
    ctx.fillStyle = isMax ? '#7f1d1d' : isHigh ? '#451a03' : '#1e293b';
    ctx.fillRect(currX, y, meterW, meterH);

    // Segmented pips (8 pips)
    const pipW = (meterW - 10) / 8;
    for (let p = 0; p < 8; p++) {
      const pipX = currX + 2 + p * (pipW + 1);
      const isFilled = p < c.burnout;

      if (isFilled) {
        if (p < 3) ctx.fillStyle = '#34d399'; // Safe Green
        else if (p < 5) ctx.fillStyle = '#fbbf24'; // Warning Yellow
        else if (p < 7) ctx.fillStyle = '#f97316'; // Danger Orange
        else ctx.fillStyle = '#ef4444'; // Overheat Red
      } else {
        ctx.fillStyle = '#334155';
      }
      ctx.fillRect(pipX, y + 2, pipW, meterH - 4);
    }

    ctx.strokeStyle = isMax ? '#ef4444' : isHigh ? '#f97316' : '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, y, meterW, meterH);

    currX += meterW + 6;

    if (c.isBoosting) {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(currX, y, 54, 14);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(currX, y, 54, 14);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('BOOST 🔥', currX + 4, y + 10);
      currX += 60;
    }
  }

  // 4. Boost Crash Badge
  if (c.crashTurns > 0) {
    ctx.fillStyle = '#581c87';
    ctx.fillRect(currX, y, 62, 14);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, y, 62, 14);
    ctx.fillStyle = '#f3e8ff';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`CRASH [${c.crashTurns}]`, currX + 3, y + 10);
    currX += 68;
  }

  // 5. Stunned Badge
  if (c.stunnedTurns > 0) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(currX, y, 52, 14);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, y, 52, 14);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 9px monospace';
    ctx.fillText(`STUN [${c.stunnedTurns}]`, currX + 3, y + 10);
  }
}
