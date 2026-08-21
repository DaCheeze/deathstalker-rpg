/**
 * Renders the Battlefield Arena (Dominant Enemy Front Line) and Compact Party Status Strip.
 * Layout Pass: Silhouettes are the primary visual focus (scaled by weight), cards size to content,
 * and party status forms a clean horizontal dashboard along the lower third.
 */

import { BattleState, Combatant } from '../core/types';
import { isEspBlocked } from '../core/battle';
import { getEnemyCardBounds, getPartyCardBounds, LAYOUT, THEME } from './theme';

interface FlinchAnimState {
  offset: number;
  until: number;
}

const flinchMap = new Map<string, FlinchAnimState>();

export function triggerCombatantFlinch(id: string, distance: number = 12, durationMs: number = 140): void {
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
  const isAllEnemiesTargeted = selectedTargetId === 'ALL_ENEMIES';
  const espBlocked = isEspBlocked(state);

  // 1. Draw Psi-Blocker Field Ripple across the battlefield if operational
  if (espBlocked) {
    drawPsiBlockerField(ctx);
  }

  // 2. Draw Dominant Enemy Front Line in Battlefield Arena (Upper 55-60%)
  const enemyCount = state.enemyIds.length;
  state.enemyIds.forEach((id, idx) => {
    const enemy = state.combatants[id];
    if (!enemy) return;

    const bounds = getEnemyCardBounds(enemyCount, idx);
    const isTargeted = isAllEnemiesTargeted ? enemy.stats.hp > 0 : enemy.id === selectedTargetId;
    const isHovered = enemy.id === hoveredTargetId;
    const isActive = enemy.id === state.activeActorId;

    drawEnemyBattleCard(
      ctx,
      enemy,
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h,
      isActive,
      isTargeted,
      isHovered,
      isAllEnemiesTargeted,
      espBlocked
    );
  });

  // 3. Draw Compact Party Status Strip along the lower third
  const partyCount = state.partyIds.length;
  state.partyIds.forEach((id, idx) => {
    const hero = state.combatants[id];
    if (!hero) return;

    const bounds = getPartyCardBounds(partyCount, idx);
    const isActive = hero.id === state.activeActorId;
    const isHovered = hero.id === hoveredTargetId;

    drawPartyStripCard(
      ctx,
      hero,
      bounds.x,
      bounds.y,
      bounds.w,
      bounds.h,
      isActive,
      isHovered,
      espBlocked
    );
  });
}

function drawPsiBlockerField(ctx: CanvasRenderingContext2D): void {
  const { arenaY, arenaHeight, canvasWidth } = LAYOUT;
  const now = performance.now();
  const wave = Math.sin(now * 0.003) * 0.5 + 0.5;

  ctx.save();
  ctx.strokeStyle = `rgba(239, 68, 68, ${0.06 + wave * 0.08})`;
  ctx.lineWidth = 1;

  const spacing = 28;
  for (let x = -arenaHeight; x < canvasWidth + arenaHeight; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, arenaY);
    ctx.lineTo(x + arenaHeight, arenaY + arenaHeight);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders an Enemy card in the battlefield arena where the silhouette is the dominant focal point.
 */
function drawEnemyBattleCard(
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
  const accentColor = c.accentColor || THEME.empirePrimary;

  // Compute flinch knockback
  let flinchY = 0;
  const flinch = flinchMap.get(c.id);
  if (flinch) {
    const remaining = flinch.until - performance.now();
    if (remaining > 0) {
      const progress = remaining / 140;
      flinchY = -flinch.offset * progress;
    } else {
      flinchMap.delete(c.id);
    }
  }

  const renderY = y + flinchY;

  // Card background
  if (isDead) {
    ctx.fillStyle = '#090b10';
  } else if (isActive) {
    ctx.fillStyle = '#2d1518';
  } else {
    ctx.fillStyle = c.faction === 'empire' ? THEME.empireCardBg :
      c.faction === 'shub' ? THEME.shubCardBg : THEME.hadenmanCardBg;
  }
  ctx.fillRect(x, renderY, w, h);

  // Top accent strip
  if (!isDead) {
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, renderY, w, 3);
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
    borderColor = '#f87171';
    lineWidth = 2;
  }
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x, renderY, w, h);

  // Target Cursor Indicator
  if (isSelectedTarget && !isDead) {
    ctx.fillStyle = isAllTarget ? '#fb923c' : accentColor;
    ctx.font = 'bold 12px monospace';
    ctx.fillText('▼ TARGET ▼', x + w / 2 - 36, renderY + 16);
  }

  // --- SILHOUETTE FOCUS (Dominant Centerpiece) ---
  const silhouetteAreaH = h * 0.54;
  const silCX = x + w / 2;
  const silCY = renderY + 22 + silhouetteAreaH / 2;

  // Silhouette scale mapped to unit weight
  const idLower = c.id.toLowerCase();
  let silSize = 80;
  if (idLower.includes('decimator')) silSize = 110;
  else if (idLower.includes('enforcer')) silSize = 95;
  else if (idLower.includes('psi_blocker')) silSize = 95;
  else if (idLower.includes('legionnaire') || idLower.includes('guard')) silSize = 85;
  else if (idLower.includes('stalker')) silSize = 80;
  else if (idLower.includes('drone')) silSize = 48;

  // Constrain size to card width/height
  silSize = Math.min(silSize, w * 0.75, silhouetteAreaH * 0.9);

  drawUnitSilhouette(ctx, c, silCX, silCY, silSize, false, isDead, accentColor, espBlocked);

  // Force Shield Hexagonal Barrier Overlay
  if (c.hasForceShield && !isDead) {
    drawHexShieldBarrier(ctx, silCX, silCY, silSize * 0.65 + 10);
  }

  // --- UNIT INFO & METRICS (Lower Area) ---
  const infoY = renderY + silhouetteAreaH + 26;

  // Name & Disambiguated Suffix
  const displayName = c.displayName || c.name;
  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.textHighlight;
  ctx.textAlign = 'center';
  ctx.fillText(displayName, x + w / 2, infoY);

  // Role Badge
  ctx.font = '10px monospace';
  ctx.fillStyle = accentColor;
  ctx.fillText(c.role.toUpperCase(), x + w / 2, infoY + 14);

  if (isDead) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('[ DESTROYED ]', x + w / 2, infoY + 32);
    ctx.textAlign = 'left';
    return;
  }

  // HP Bar
  const hpBarW = Math.min(180, w - 30);
  const hpBarH = 8;
  const hpBarX = x + (w - hpBarW) / 2;
  const hpBarY = infoY + 22;
  const hpPercent = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = hpPercent > 0.3 ? THEME.hpColor : THEME.hpLowColor;
  ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPercent, hpBarH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

  // HP Text
  ctx.fillStyle = THEME.textHighlight;
  ctx.font = 'bold 10px monospace';
  ctx.fillText(`HP ${c.stats.hp} / ${c.stats.maxHp}`, x + w / 2, hpBarY + 19);

  // Status Badges (Disruptor / Stun / Shield)
  ctx.textAlign = 'left';
  let badgeX = hpBarX;
  const badgeY = hpBarY + 26;

  if (c.disruptorCooldown === 0) {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(badgeX, badgeY, 52, 14);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, 52, 14);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('⚡DISRUPTOR', badgeX + 3, badgeY + 10);
    badgeX += 56;
  } else if (c.disruptorCooldown === 1) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(badgeX, badgeY, 44, 14);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, 44, 14);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('⚡CD: 1', badgeX + 3, badgeY + 10);
    badgeX += 48;
  }

  if (c.hasForceShield) {
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(badgeX, badgeY, 46, 14);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, 46, 14);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('🛡️SHIELD', badgeX + 3, badgeY + 10);
    badgeX += 50;
  }

  if (c.stunnedTurns > 0) {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(badgeX, badgeY, 44, 14);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, 44, 14);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 8px monospace';
    ctx.fillText(`STUN [${c.stunnedTurns}]`, badgeX + 3, badgeY + 10);
  }
}

/**
 * Renders a compact Party status card in the horizontal strip along the lower third.
 */
function drawPartyStripCard(
  ctx: CanvasRenderingContext2D,
  c: Combatant,
  x: number,
  y: number,
  w: number,
  h: number,
  isActive: boolean,
  isHovered: boolean,
  espBlocked: boolean
): void {
  const isDead = c.stats.hp <= 0;
  const accentColor = c.accentColor || THEME.partyPrimary;

  // Background
  ctx.fillStyle = isDead ? '#090b10' : isActive ? '#132c48' : THEME.partyCardBg;
  ctx.fillRect(x, y, w, h);

  // Left accent line
  if (!isDead) {
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, 3, h);
  }

  // Border
  ctx.strokeStyle = isActive ? '#38bdf8' : isHovered ? '#fbbf24' : THEME.panelBorder;
  ctx.lineWidth = isActive ? 2 : 1;
  ctx.strokeRect(x, y, w, h);

  // Active turn glow header indicator
  if (isActive && !isDead) {
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 3, y, w - 6, 2);
  }

  // Compact Silhouette on Left
  const silSize = 34;
  const silCX = x + 24;
  const silCY = y + h / 2;
  drawUnitSilhouette(ctx, c, silCX, silCY, silSize, true, isDead, accentColor, espBlocked);

  // Text / Metric Area
  const textX = x + 48;
  const contentW = w - 54;

  // Name & Role
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.textHighlight;
  ctx.fillText(c.name.toUpperCase(), textX, y + 15, contentW);

  ctx.font = '9px monospace';
  ctx.fillStyle = '#7dd3fc';
  ctx.fillText(c.role, textX, y + 26);

  if (isDead) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('[ KIA ]', textX, y + 42);
    return;
  }

  // HP Bar
  const hpBarW = contentW - 4;
  const hpBarH = 6;
  const hpBarY = y + 32;
  const hpPercent = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(textX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = hpPercent > 0.3 ? THEME.hpColor : THEME.hpLowColor;
  ctx.fillRect(textX, hpBarY, hpBarW * hpPercent, hpBarH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(textX, hpBarY, hpBarW, hpBarH);

  // Numerical HP & ESP
  ctx.fillStyle = THEME.textMain;
  ctx.font = '8px monospace';
  const hpStr = `HP:${c.stats.hp}/${c.stats.maxHp}`;
  const espStr = c.stats.maxEsp > 0 ? ` ESP:${c.stats.esp}` : '';
  ctx.fillText(`${hpStr}${espStr}`, textX, hpBarY + 14);

  // Badges (Disruptor, Valen Burnout Gauge, Shield, Crash)
  const badgeY = y + 54;
  let currX = textX;

  // 1. Disruptor Badge
  if (c.disruptorCooldown === 0) {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(currX, badgeY, 36, 12);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, badgeY, 36, 12);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('⚡RDY', currX + 3, badgeY + 9);
    currX += 40;
  } else if (c.disruptorCooldown === 1) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(currX, badgeY, 34, 12);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, badgeY, 34, 12);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('⚡1', currX + 3, badgeY + 9);
    currX += 38;
  }

  // 2. Force Shield Badge
  if (c.hasForceShield) {
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(currX, badgeY, 34, 12);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, badgeY, 34, 12);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('🛡️ON', currX + 3, badgeY + 9);
    currX += 38;
  }

  // 3. Valen Burnout Danger Meter & Boost / Crash State (Valen Only)
  if (c.canBoost) {
    const isHigh = c.burnout >= 5;
    const isMax = c.burnout >= 8;
    const meterW = 54;
    const meterH = 12;

    ctx.fillStyle = isMax ? '#7f1d1d' : isHigh ? '#451a03' : '#1e293b';
    ctx.fillRect(currX, badgeY, meterW, meterH);

    // 8 Pips
    const pipW = (meterW - 9) / 8;
    for (let p = 0; p < 8; p++) {
      const pipX = currX + 1 + p * (pipW + 1);
      const isFilled = p < c.burnout;
      if (isFilled) {
        if (p < 3) ctx.fillStyle = '#34d399';
        else if (p < 5) ctx.fillStyle = '#fbbf24';
        else if (p < 7) ctx.fillStyle = '#f97316';
        else ctx.fillStyle = '#ef4444';
      } else {
        ctx.fillStyle = '#334155';
      }
      ctx.fillRect(pipX, badgeY + 2, pipW, meterH - 4);
    }
    ctx.strokeStyle = isMax ? '#ef4444' : isHigh ? '#f97316' : '#475569';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, badgeY, meterW, meterH);
    currX += meterW + 4;

    if (c.isBoosting) {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(currX, badgeY, 44, 12);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1;
      ctx.strokeRect(currX, badgeY, 44, 12);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('BOOST 🔥', currX + 2, badgeY + 9);
      currX += 48;
    }
  }

  // 4. Boost Crash Badge
  if (c.crashTurns > 0) {
    ctx.fillStyle = '#581c87';
    ctx.fillRect(currX, badgeY, 52, 12);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    ctx.strokeRect(currX, badgeY, 52, 12);
    ctx.fillStyle = '#f3e8ff';
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`CRASH [${c.crashTurns}]`, currX + 2, badgeY + 9);
  }
}

/**
 * Procedural Geometric Silhouette Renderer with distinctive geometry and scaling.
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

    if (!isDead) {
      ctx.fillStyle = accentColor;
      ctx.fillRect(r * 0.8, -r * 0.5, 5, 3);
      ctx.fillRect(r * 0.8, r * 0.2, 5, 3);
    }
  } else if (id.includes('psi_blocker')) {
    // Psi-Blocker Pylon: Distinct Mechanical Obelisk / Crystal Spire with pulsing energy rings
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.1);
    ctx.lineTo(r * 0.5, r * 0.9);
    ctx.lineTo(-r * 0.5, r * 0.9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      const pulse = Math.sin(performance.now() * 0.005) * 3;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.3, r * 0.7 + pulse, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(0, r * 0.3, r * 0.85 + pulse, 4, 0, 0, Math.PI * 2);
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

    if (!isDead) {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-4, -4, 8, 8);
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
  ctx.save();
  ctx.translate(cx, cy);

  ctx.strokeStyle = '#00f2fe';
  ctx.lineWidth = 2;
  ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';

  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}
