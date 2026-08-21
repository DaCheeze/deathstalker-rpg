/**
 * Renders the Dominant Battlefield Arena (Enemies) and Compact Party Status Strip.
 * Features procedural multi-layered silhouettes (scaled by weight), idle breathing animations,
 * depth lighting (rim lights, gradients, glows), and dynamic visual state indicators.
 */

import { BattleState, Combatant } from '../core/types';
import { isEspBlocked } from '../core/battle';
import { getEnemyCardBounds, getPartyCardBounds, THEME } from './theme';
import { getCombatantLungeOffset } from './drawFx';

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

  // 1. Draw Dominant Enemy Front Line in Battlefield Arena (Upper 55-60%)
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
      espBlocked,
      idx
    );
  });

  // 2. Draw Compact Party Status Strip along the lower third
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
      espBlocked,
      idx
    );
  });
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
  espBlocked: boolean,
  unitIndex: number
): void {
  const isDead = c.stats.hp <= 0;
  const accentColor = c.accentColor || THEME.empirePrimary;
  const now = performance.now();

  // Flinch displacement
  let flinchY = 0;
  const flinch = flinchMap.get(c.id);
  if (flinch) {
    const remaining = flinch.until - now;
    if (remaining > 0) {
      const progress = remaining / 140;
      flinchY = -flinch.offset * progress;
    } else {
      flinchMap.delete(c.id);
    }
  }

  // Lunge offset
  const lunge = getCombatantLungeOffset(c.id);

  const renderX = x + lunge.x;
  const renderY = y + flinchY + lunge.y;

  // 1. Card Container (Content-sized, subtle dark glass backdrop)
  ctx.save();
  ctx.fillStyle = isDead ? 'rgba(15, 23, 42, 0.4)' : isActive ? 'rgba(30, 41, 59, 0.85)' : 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(renderX, renderY, w, h);

  // Targeting & Active Borders
  if (isTargetedOrActive(isSelectedTarget, isHovered, isActive, isAllTarget)) {
    ctx.strokeStyle = isSelectedTarget
      ? '#ef4444'
      : isHovered
      ? '#f59e0b'
      : isActive
      ? '#38bdf8'
      : '#334155';
    ctx.lineWidth = isSelectedTarget ? 2.5 : 1.5;
    ctx.strokeRect(renderX, renderY, w, h);
  } else {
    ctx.strokeStyle = isDead ? '#1e293b' : '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(renderX, renderY, w, h);
  }

  // Header accent line
  ctx.fillStyle = isDead ? '#475569' : accentColor;
  ctx.fillRect(renderX, renderY, w, 3);
  ctx.restore();

  // 2. Unit Name & Role (Top of Card)
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.textHighlight;
  ctx.fillText(c.displayName || c.name, renderX + w / 2, renderY + 18, w - 16);

  ctx.font = '9px monospace';
  ctx.fillStyle = isDead ? '#475569' : '#94a3b8';
  ctx.fillText(c.role, renderX + w / 2, renderY + 30, w - 16);
  ctx.restore();

  // 3. Dominant Procedural Silhouette (Occupies center 50-60% of card)
  const silhouetteCenterX = renderX + w / 2;
  const silhouetteCenterY = renderY + h * 0.52;
  const silhouetteAreaSize = Math.min(w * 0.75, h * 0.50);

  drawUnitSilhouette(
    ctx,
    c,
    silhouetteCenterX,
    silhouetteCenterY,
    silhouetteAreaSize,
    false,
    isDead,
    accentColor,
    espBlocked,
    unitIndex
  );

  // 4. HP Bar & Status (Bottom of Card)
  const barW = w - 24;
  const barH = 7;
  const barX = renderX + 12;
  const barY = renderY + h - 34;

  const hpPercent = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));

  ctx.save();
  // Bar background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);

  // Bar fill with gradient
  if (hpPercent > 0) {
    const hpGrad = ctx.createLinearGradient(barX, barY, barX + barW * hpPercent, barY);
    if (hpPercent > 0.35) {
      hpGrad.addColorStop(0, '#10b981');
      hpGrad.addColorStop(1, '#34d399');
    } else {
      hpGrad.addColorStop(0, '#dc2626');
      hpGrad.addColorStop(1, '#f87171');
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, barY, barW * hpPercent, barH);
  }
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  // Numerical HP & Disruptor state
  ctx.textAlign = 'left';
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = isDead ? '#ef4444' : THEME.textMain;
  const statusStr = isDead ? '[ DESTROYED ]' : `HP: ${c.stats.hp}/${c.stats.maxHp}`;
  ctx.fillText(statusStr, barX, barY + 18);

  // Disruptor / Shield Badges (Bottom Right)
  if (!isDead) {
    ctx.textAlign = 'right';
    if (c.hasForceShield) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('🛡️SHIELD', barX + barW, barY + 18);
    } else if (c.disruptorCooldown === 0) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('⚡DISRUPTOR RDY', barX + barW, barY + 18);
    } else if (c.disruptorCooldown === 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('⚡DISRUPTOR: 1', barX + barW, barY + 18);
    }
  }
  ctx.restore();
}

/**
 * Renders a Party member in the bottom horizontal status strip.
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
  espBlocked: boolean,
  unitIndex: number
): void {
  const isDead = c.stats.hp <= 0;
  const accentColor = c.accentColor || THEME.partyPrimary;
  const now = performance.now();

  // Flinch displacement
  let flinchY = 0;
  const flinch = flinchMap.get(c.id);
  if (flinch) {
    const remaining = flinch.until - now;
    if (remaining > 0) {
      const progress = remaining / 140;
      flinchY = -flinch.offset * progress;
    } else {
      flinchMap.delete(c.id);
    }
  }

  // Lunge offset
  const lunge = getCombatantLungeOffset(c.id);

  const renderX = x + lunge.x;
  const renderY = y + flinchY + lunge.y;

  ctx.save();
  // Card background
  ctx.fillStyle = isDead ? 'rgba(15, 23, 42, 0.4)' : isActive ? '#0f2942' : '#0c1626';
  ctx.fillRect(renderX, renderY, w, h);

  // Border
  ctx.strokeStyle = isActive ? '#38bdf8' : isHovered ? '#0284c7' : isDead ? '#1e293b' : '#1e3a5f';
  ctx.lineWidth = isActive ? 2 : 1;
  ctx.strokeRect(renderX, renderY, w, h);

  // Left accent strip
  ctx.fillStyle = isDead ? '#475569' : accentColor;
  ctx.fillRect(renderX, renderY, 4, h);

  // Silhouette on left side of party card
  const silSize = 44;
  const silX = renderX + 32;
  const silY = renderY + h / 2;
  drawUnitSilhouette(ctx, c, silX, silY, silSize, true, isDead, accentColor, espBlocked, unitIndex);

  // Content on right side of party card
  const textX = renderX + 62;
  const textW = w - 70;

  // Name & Role
  ctx.textAlign = 'left';
  ctx.font = isActive ? 'bold 11px monospace' : 'bold 10px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : isActive ? '#ffffff' : '#bae6fd';
  ctx.fillText(c.displayName || c.name, textX, renderY + 16, textW);

  if (isDead) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px monospace';
    ctx.fillText('[ KIA ]', textX, renderY + 34);
    ctx.restore();
    return;
  }

  // HP Bar
  const hpBarW = textW;
  const hpBarH = 6;
  const hpBarY = renderY + 24;
  const hpPercent = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(textX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = hpPercent > 0.3 ? THEME.hpColor : THEME.hpLowColor;
  ctx.fillRect(textX, hpBarY, hpBarW * hpPercent, hpBarH);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(textX, hpBarY, hpBarW, hpBarH);

  // Stats Text: HP & ESP
  ctx.fillStyle = THEME.textMain;
  ctx.font = '8px monospace';
  const hpStr = `HP:${c.stats.hp}/${c.stats.maxHp}`;
  const espStr = c.stats.maxEsp > 0 ? ` ESP:${c.stats.esp}` : '';
  ctx.fillText(`${hpStr}${espStr}`, textX, hpBarY + 14);

  // Badges: Disruptor, Valen Burnout, Shield, Crash
  const badgeY = renderY + 54;
  let currX = textX;

  // Disruptor
  if (c.disruptorCooldown === 0) {
    ctx.fillStyle = '#065f46';
    ctx.fillRect(currX, badgeY, 34, 12);
    ctx.strokeStyle = '#34d399';
    ctx.strokeRect(currX, badgeY, 34, 12);
    ctx.fillStyle = '#6ee7b7';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('⚡RDY', currX + 3, badgeY + 9);
    currX += 38;
  } else if (c.disruptorCooldown === 1) {
    ctx.fillStyle = '#451a03';
    ctx.fillRect(currX, badgeY, 30, 12);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(currX, badgeY, 30, 12);
    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('⚡1', currX + 3, badgeY + 9);
    currX += 34;
  }

  // Force Shield
  if (c.hasForceShield) {
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(currX, badgeY, 32, 12);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(currX, badgeY, 32, 12);
    ctx.fillStyle = '#bae6fd';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('🛡️ON', currX + 3, badgeY + 9);
    currX += 36;
  }

  // Valen Burnout Meter & Boost State (Valen Only)
  if (c.canBoost) {
    const isHigh = c.burnout >= 5;
    const isMax = c.burnout >= 8;
    const meterW = 48;
    const meterH = 12;

    ctx.fillStyle = isMax ? '#7f1d1d' : isHigh ? '#451a03' : '#1e293b';
    ctx.fillRect(currX, badgeY, meterW, meterH);

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
    ctx.strokeRect(currX, badgeY, meterW, meterH);
    currX += meterW + 4;

    if (c.isBoosting) {
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(currX, badgeY, 40, 12);
      ctx.strokeStyle = '#ef4444';
      ctx.strokeRect(currX, badgeY, 40, 12);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('BOOST🔥', currX + 2, badgeY + 9);
      currX += 44;
    }
  }

  // Crash State
  if (c.crashTurns > 0) {
    ctx.fillStyle = '#581c87';
    ctx.fillRect(currX, badgeY, 46, 12);
    ctx.strokeStyle = '#a855f7';
    ctx.strokeRect(currX, badgeY, 46, 12);
    ctx.fillStyle = '#f3e8ff';
    ctx.font = 'bold 7px monospace';
    ctx.fillText(`CRASH [${c.crashTurns}]`, currX + 2, badgeY + 9);
  }

  ctx.restore();
}

/**
 * Layered Procedural Silhouette Renderer.
 * Scaled by unit weight with breathing idle animations, rim lights, and visual state readings.
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
  espBlocked: boolean,
  unitIndex: number
): void {
  ctx.save();

  const id = c.id.toLowerCase();
  const now = performance.now();

  // Unit weight scale factors
  let weightScale = 1.0;
  if (id.includes('haden')) weightScale = 1.55; // Decimator / Enforcer: Towering Dreadnought
  else if (id.includes('legionnaire') || id.includes('guard')) weightScale = 1.25; // Imperial Infantry
  else if (id.includes('blocker')) weightScale = 1.35; // Psi-Blocker Pylon
  else if (id.includes('stalker')) weightScale = 1.30; // Shub Stalker
  else if (id.includes('drone')) weightScale = 0.85; // Shub Swarm Drone
  else if (id.includes('tarek')) weightScale = 1.20; // Tarek Heavy Juggernaut
  else if (id.includes('valen')) weightScale = 1.10; // Captain Valen
  else if (id.includes('lyra')) weightScale = 0.95; // Lyra Psionic
  else if (id.includes('kaelen')) weightScale = 1.00; // Kaelen Sharpshooter

  // Idle breathing / hover animations
  let idleOffsetY = 0;
  let idleScale = 1.0;
  if (!isDead) {
    if (id.includes('drone')) {
      // Drones hover and bob
      idleOffsetY = Math.sin(now * 0.004 + unitIndex * 1.5) * 5;
    } else if (id.includes('haden')) {
      // Hadenmen slow heavy chest pulse
      idleScale = 1.0 + Math.sin(now * 0.002) * 0.03;
    } else {
      // General combat breathing
      idleOffsetY = Math.sin(now * 0.003 + unitIndex) * 2;
    }
  }

  // Low HP distress flicker / falter
  const hpPct = c.stats.hp / c.stats.maxHp;
  let distressShakeX = 0;
  let distressShakeY = 0;
  if (!isDead && hpPct < 0.25) {
    distressShakeX = (Math.random() - 0.5) * 3;
    distressShakeY = (Math.random() - 0.5) * 3;
  }

  ctx.translate(cx + distressShakeX, cy + idleOffsetY + distressShakeY);
  ctx.scale(idleScale * weightScale, idleScale * weightScale);

  const r = size / 2;
  const strokeColor = isDead ? '#475569' : accentColor;
  const fillColor = isDead ? '#1e293b' : isParty ? '#091e36' : '#231215';

  // Outer ambient glow on living units
  if (!isDead) {
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 10;
  }

  // --- DRAW SPECIFIC UNIT SILHOUETTES ---

  if (id.includes('haden')) {
    // === HADENMAN AUGMENTED DREADNOUGHT ===
    // Layer 1: Heavy Shoulder Pauldrons & Back Chassis
    ctx.fillStyle = isDead ? '#334155' : '#450a0a';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, -r * 0.2);
    ctx.lineTo(-r * 0.7, -r * 0.85);
    ctx.lineTo(r * 0.7, -r * 0.85);
    ctx.lineTo(r * 0.95, -r * 0.2);
    ctx.lineTo(r * 0.6, r * 0.8);
    ctx.lineTo(-r * 0.6, r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Layer 2: Main Torso Core Plate
    ctx.fillStyle = isDead ? '#1e293b' : '#1f090d';
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.6);
    ctx.lineTo(r * 0.5, -r * 0.6);
    ctx.lineTo(r * 0.4, r * 0.6);
    ctx.lineTo(-r * 0.4, r * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Layer 3: Glowing Crimson Visor / Sensor Slit
    if (!isDead) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-r * 0.35, -r * 0.45, r * 0.7, 4);
      // Power Core
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id.includes('legionnaire') || id.includes('guard')) {
    // === IMPERIAL LEGIONNAIRE / GUARD ===
    // Layer 1: Crested Imperial Helmet & Chest Aegis
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.75, -r * 0.3);
    ctx.lineTo(r * 0.6, r * 0.85);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.6, r * 0.85);
    ctx.lineTo(-r * 0.75, -r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Layer 2: Imperial Eagle Crest / Chevron
    if (!isDead) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-r * 0.4, -r * 0.1);
      ctx.lineTo(0, r * 0.25);
      ctx.lineTo(r * 0.4, -r * 0.1);
      ctx.stroke();

      // Glowing Amber Visor
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-r * 0.3, -r * 0.5, r * 0.6, 3.5);
    }
  } else if (id.includes('blocker')) {
    // === PSI-BLOCKER PYLON ===
    // Central Spire Core
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.35, -r * 0.2);
    ctx.lineTo(r * 0.45, r * 0.85);
    ctx.lineTo(-r * 0.45, r * 0.85);
    ctx.lineTo(-r * 0.35, -r * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      // Rotating outer containment ring 1
      const angle1 = now * 0.002;
      ctx.save();
      ctx.rotate(angle1);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Counter-rotating inner containment ring 2
      const angle2 = -now * 0.0015;
      ctx.save();
      ctx.rotate(angle2);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.6, r * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Center Pulsing Orb
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id.includes('stalker')) {
    // === SHUB SWARM STALKER ===
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(r * 0.85, -r * 0.1);
    ctx.lineTo(r * 0.5, r * 0.8);
    ctx.lineTo(0, r * 0.4);
    ctx.lineTo(-r * 0.5, r * 0.8);
    ctx.lineTo(-r * 0.85, -r * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      // Dual plasma pods
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-r * 0.8, -r * 0.4, 4, 12);
      ctx.fillRect(r * 0.8 - 4, -r * 0.4, 4, 12);
    }
  } else if (id.includes('drone')) {
    // === SHUB SWARM DRONE ===
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(r * 0.75, 0);
    ctx.lineTo(0, r * 0.85);
    ctx.lineTo(-r * 0.75, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      // Glowing Cyan Sensor Core
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Thruster flare
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.moveTo(-4, r * 0.85);
      ctx.lineTo(0, r * 0.85 + 6 + Math.random() * 4);
      ctx.lineTo(4, r * 0.85);
      ctx.fill();
    }
  } else if (id.includes('valen')) {
    // === CAPTAIN VALEN ===
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.8, -r * 0.3);
    ctx.lineTo(r * 0.6, r * 0.85);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.6, r * 0.85);
    ctx.lineTo(-r * 0.8, -r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      // Booster Vanes
      if (c.isBoosting) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-r - 4, -6, 4, 12);
        ctx.fillRect(r, -6, 4, 12);
        // Exhaust flames
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-r - 8, -3, 4, 6);
        ctx.fillRect(r + 4, -3, 4, 6);
      }
      // Commander Visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-r * 0.35, -r * 0.45, r * 0.7, 4);
    }
  } else if (id.includes('lyra')) {
    // === LYRA (ESPER) ===
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(r * 0.65, 0);
    ctx.lineTo(0, r * 0.9);
    ctx.lineTo(-r * 0.65, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      // Orbiting Psionic Nodes & Wisps
      const ringColor = espBlocked ? '#ef4444' : '#c084fc';
      ctx.fillStyle = ringColor;
      for (let i = 0; i < 3; i++) {
        const angle = now * 0.003 + (i * Math.PI * 2) / 3;
        const ox = Math.cos(angle) * (r * 0.9 + 6);
        const oy = Math.sin(angle) * (r * 0.9 + 6);
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (id.includes('kaelen')) {
    // === KAELEN (SHARPSHOOTER) ===
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.8);
    ctx.lineTo(r * 0.5, -r * 0.8);
    ctx.lineTo(r * 0.7, r * 0.8);
    ctx.lineTo(-r * 0.7, r * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      // Long Rifle Barrel
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.8);
      ctx.lineTo(0, -r * 1.25);
      ctx.stroke();
    }
  } else if (id.includes('tarek')) {
    // === TAREK (VANGUARD DEFENDER) ===
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, -r * 0.6);
    ctx.lineTo(r * 0.85, -r * 0.6);
    ctx.lineTo(r * 0.7, r * 0.85);
    ctx.lineTo(0, r * 0.95);
    ctx.lineTo(-r * 0.7, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    if (!isDead) {
      // Heavy Front Bulwark Plate
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(-r * 0.5, -r * 0.2, r, r * 0.6);
    }
  }

  // 4. Rim Light Highlight on one edge
  if (!isDead) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.8);
    ctx.lineTo(0, -r * 0.95);
    ctx.stroke();
    ctx.restore();
  }

  // 5. Force Shield Envelope (Shimmering Cyan Hex Bubble)
  if (c.hasForceShield && !isDead) {
    ctx.save();
    const shieldWave = Math.sin(now * 0.005) * 2;
    ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8 + shieldWave, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = 'rgba(0, 242, 254, 0.12)';
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

function isTargetedOrActive(isSelected: boolean, isHovered: boolean, isActive: boolean, isAll: boolean): boolean {
  return isSelected || isHovered || isActive || isAll;
}
