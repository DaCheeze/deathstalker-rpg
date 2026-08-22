/**
 * Renders the Dominant Battlefield Arena (Enemies) and Compact Party Status Strip.
 * High-fidelity procedural vector rendering with multi-layered anatomical & mechanical silhouettes,
 * specular lighting, depth bevels, glowing conduits, per-instance variation, and grounded deck staging.
 */

import { BattleState, Combatant } from '../core/types';
import { isEspBlocked } from '../core/battle';
import { getEnemyCardBounds, getPartyCombatantBounds, getPartyCardBounds, THEME } from './theme';
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

/**
 * Layer 4: Renders Grounded Enemy Units standing in the Battlefield Arena.
 */
export function drawEnemyUnits(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  selectedTargetId: string | null,
  hoveredTargetId: string | null
): void {
  const isAllEnemiesTargeted = selectedTargetId === 'ALL_ENEMIES';
  const espBlocked = isEspBlocked(state);
  const enemyCount = state.enemyIds.length;

  state.enemyIds.forEach((id, idx) => {
    const enemy = state.combatants[id];
    if (!enemy) return;

    const bounds = getEnemyCardBounds(enemyCount, idx);
    const isTargeted = isAllEnemiesTargeted ? enemy.stats.hp > 0 : enemy.id === selectedTargetId;
    const isHovered = enemy.id === hoveredTargetId;
    const isActive = enemy.id === state.activeActorId;

    drawGroundedEnemyUnit(
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
}

/**
 * Layer 5: Renders Grounded Party Units standing in the Battlefield Arena.
 * Party members stand on the stage floor with contact shadows and idle/combat stances.
 */
export function drawPartyUnits(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  hoveredTargetId: string | null
): void {
  const espBlocked = isEspBlocked(state);
  const partyCount = state.partyIds.length;

  state.partyIds.forEach((id, idx) => {
    const hero = state.combatants[id];
    if (!hero) return;

    const bounds = getPartyCombatantBounds(partyCount, idx);
    const isActive = hero.id === state.activeActorId;
    const isHovered = hero.id === hoveredTargetId;

    drawGroundedPartyUnit(
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
 * Layer 9: Renders Party Status Cards & Meters along the bottom status strip.
 */
export function drawPartyStatusCards(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  hoveredTargetId: string | null
): void {
  const espBlocked = isEspBlocked(state);
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

export function drawCombatants(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  selectedTargetId: string | null,
  hoveredTargetId: string | null
): void {
  drawEnemyUnits(ctx, state, selectedTargetId, hoveredTargetId);
  drawPartyUnits(ctx, state, hoveredTargetId);
}

/**
 * Renders a Party Combatant standing directly on the physical battlefield environment (Layer 5)
 * with contact shadows onto the stage floor, tactical reticles, and multi-layered silhouettes.
 */
export function drawGroundedPartyUnit(
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

  const centerX = x + w / 2 + lunge.x;
  const centerY = y + h * 0.44 + flinchY + lunge.y;
  const silhouetteSize = Math.min(w * 0.88, h * 0.58);

  ctx.save();

  // 1. Ground Contact Shadow / Deck Plane Reflection
  if (!isDead) {
    const shadowY = y + h * 0.74 + flinchY * 0.2;
    const shadowGrad = ctx.createRadialGradient(centerX, shadowY, 5, centerX, shadowY, silhouetteSize * 0.65);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, shadowY, silhouetteSize * 0.7, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Tactical Reticle / Corner Brackets on Active / Hover
  if (isActive || isHovered) {
    const retColor = isActive ? '#38bdf8' : '#f59e0b';
    const bracketSize = 16;
    const pad = 12;
    const boxLeft = centerX - silhouetteSize * 0.60 - pad;
    const boxRight = centerX + silhouetteSize * 0.60 + pad;
    const boxTop = centerY - silhouetteSize * 0.60 - pad;
    const boxBottom = centerY + silhouetteSize * 0.54 + pad;

    ctx.strokeStyle = retColor;
    ctx.lineWidth = isActive ? 2.5 : 1.5;

    ctx.beginPath();
    ctx.moveTo(boxLeft, boxTop + bracketSize);
    ctx.lineTo(boxLeft, boxTop);
    ctx.lineTo(boxLeft + bracketSize, boxTop);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boxRight - bracketSize, boxTop);
    ctx.lineTo(boxRight, boxTop);
    ctx.lineTo(boxRight, boxTop + bracketSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boxLeft, boxBottom - bracketSize);
    ctx.lineTo(boxLeft, boxBottom);
    ctx.lineTo(boxLeft + bracketSize, boxBottom);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(boxRight - bracketSize, boxBottom);
    ctx.lineTo(boxRight, boxBottom);
    ctx.lineTo(boxRight, boxBottom - bracketSize);
    ctx.stroke();
  }

  // 3. Floating Nameplate & Role (Top of Unit)
  const nameplateY = y + 14;
  ctx.textAlign = 'center';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.partyPrimary;
  ctx.fillText(c.name.toUpperCase(), centerX, nameplateY);

  ctx.font = '9px monospace';
  ctx.fillStyle = THEME.textMuted;
  const roleName = c.id.includes('valen') ? 'CAPTAIN' : c.id.includes('lyra') ? 'ESPER' : c.id.includes('kaelen') ? 'STRIKER' : 'HEAVY';
  ctx.fillText(roleName, centerX, nameplateY + 12);

  // 4. Draw Procedural Multi-Layered Combatant Silhouette
  const partyAccents = ['#38bdf8', '#c084fc', '#f59e0b', '#34d399'];
  const accentColor = c.accentColor || partyAccents[unitIndex % partyAccents.length]!;
  drawUnitSilhouette(ctx, c, centerX, centerY, silhouetteSize, true, isDead, accentColor, espBlocked, unitIndex);

  ctx.restore();
}

/**
 * Renders an Enemy standing directly on the physical battlefield environment
 * with NO boxy dashboard card frames. Uses tactical corner brackets and floating indicators.
 */
function drawGroundedEnemyUnit(
  ctx: CanvasRenderingContext2D,
  c: Combatant,
  x: number,
  y: number,
  w: number,
  h: number,
  isActive: boolean,
  isSelectedTarget: boolean,
  isHovered: boolean,
  _isAllTarget: boolean,
  espBlocked: boolean,
  unitIndex: number
): void {
  const isDead = c.stats.hp <= 0;
  const now = performance.now();

  // Instance specific accent colors
  const instanceAccents = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6'];
  const accentColor = c.accentColor || instanceAccents[unitIndex % instanceAccents.length]!;

  // Instance letter (A, B, C, D)
  const letters = ['A', 'B', 'C', 'D'];
  const instanceLetter = c.displayName?.match(/\b([A-D])\b/)?.[1] || letters[unitIndex % letters.length]!;

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

  const centerX = x + w / 2 + lunge.x;
  const centerY = y + h * 0.44 + flinchY + lunge.y;
  const silhouetteSize = Math.min(w * 0.88, h * 0.58);

  ctx.save();

  // 1. Ground Contact Shadow / Deck Plane Reflection
  if (!isDead) {
    const shadowY = y + h * 0.74 + flinchY * 0.2;
    const shadowGrad = ctx.createRadialGradient(centerX, shadowY, 5, centerX, shadowY, silhouetteSize * 0.65);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, shadowY, silhouetteSize * 0.7, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Tactical Reticle / Corner Brackets on Target / Hover / Active
  if (isSelectedTarget || isHovered || isActive) {
    const retColor = isSelectedTarget ? '#ef4444' : isHovered ? '#f59e0b' : '#38bdf8';
    const bracketSize = 18;
    const pad = 14;
    const boxLeft = centerX - silhouetteSize * 0.62 - pad;
    const boxRight = centerX + silhouetteSize * 0.62 + pad;
    const boxTop = centerY - silhouetteSize * 0.62 - pad;
    const boxBottom = centerY + silhouetteSize * 0.56 + pad;

    ctx.strokeStyle = retColor;
    ctx.lineWidth = isSelectedTarget ? 2.5 : 1.5;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(boxLeft, boxTop + bracketSize);
    ctx.lineTo(boxLeft, boxTop);
    ctx.lineTo(boxLeft + bracketSize, boxTop);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxRight - bracketSize, boxTop);
    ctx.lineTo(boxRight, boxTop);
    ctx.lineTo(boxRight, boxTop + bracketSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(boxLeft, boxBottom - bracketSize);
    ctx.lineTo(boxLeft, boxBottom);
    ctx.lineTo(boxLeft + bracketSize, boxBottom);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxRight - bracketSize, boxBottom);
    ctx.lineTo(boxRight, boxBottom);
    ctx.lineTo(boxRight, boxBottom - bracketSize);
    ctx.stroke();
  }

  // 3. Floating Instance Nameplate & Role (Top, No Collision)
  const nameplateY = y + 14;
  ctx.textAlign = 'center';

  // Name with clear instance letter
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.textHighlight;
  const titleStr = c.displayName || `${c.name} ${instanceLetter}`;
  ctx.fillText(titleStr, centerX, nameplateY, w - 16);

  // Role
  ctx.font = '9px monospace';
  ctx.fillStyle = isDead ? '#475569' : '#94a3b8';
  ctx.fillText(c.role, centerX, nameplateY + 13, w - 16);

  // 4. Dominant Detailed Procedural Silhouette Form
  drawUnitSilhouette(
    ctx,
    c,
    centerX,
    centerY,
    silhouetteSize,
    false,
    isDead,
    accentColor,
    espBlocked,
    unitIndex
  );

  // 5. Floating HP Bar & Status Indicators (Bottom)
  const barW = Math.min(180, w - 24);
  const barH = 6;
  const barX = centerX - barW / 2;
  const barY = y + h - 26;

  const hpPercent = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));

  // HP Bar Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(barX, barY, barW, barH);

  // HP Bar Fill with Gradient
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

  // Numerical HP & Status Badges
  ctx.textAlign = 'left';
  ctx.font = 'bold 9px monospace';
  ctx.fillStyle = isDead ? '#ef4444' : THEME.textMain;
  const statusStr = isDead ? '[ DESTROYED ]' : `HP: ${c.stats.hp}/${c.stats.maxHp}`;
  ctx.fillText(statusStr, barX, barY + 16);

  if (!isDead) {
    ctx.textAlign = 'right';
    if (c.hasForceShield) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('🛡️ SHIELD', barX + barW, barY + 16);
    } else if (c.disruptorCooldown === 0) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('⚡RDY', barX + barW, barY + 16);
    } else if (c.disruptorCooldown === 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('⚡1', barX + barW, barY + 16);
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

  const renderX = x;
  const renderY = y + flinchY;

  ctx.save();

  // 1. Compact Panel Frame
  ctx.fillStyle = isDead
    ? 'rgba(15, 23, 42, 0.45)'
    : isActive
    ? 'rgba(30, 58, 90, 0.85)'
    : isHovered
    ? 'rgba(30, 41, 59, 0.85)'
    : 'rgba(15, 23, 42, 0.80)';
  ctx.fillRect(renderX, renderY, w, h);

  ctx.strokeStyle = isDead
    ? '#1e293b'
    : isActive
    ? '#38bdf8'
    : isHovered
    ? '#f59e0b'
    : '#334155';
  ctx.lineWidth = isActive ? 2 : 1;
  ctx.strokeRect(renderX, renderY, w, h);

  // Accent Left Stripe
  ctx.fillStyle = isDead ? '#475569' : accentColor;
  ctx.fillRect(renderX, renderY, 4, h);

  // 2. Party Silhouette (Distinct, crisp proportion)
  const silSize = 58;
  const silCenterX = renderX + 36;
  const silCenterY = renderY + h / 2;

  drawUnitSilhouette(
    ctx,
    c,
    silCenterX,
    silCenterY,
    silSize,
    true,
    isDead,
    accentColor,
    espBlocked,
    unitIndex
  );

  // 3. Name & Role
  const textX = renderX + 70;
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.textHighlight;
  ctx.fillText(c.displayName || c.name, textX, renderY + 18, w - 76);

  // 4. HP Bar
  const hpBarW = w - 78;
  const hpBarH = 6;
  const hpBarY = renderY + 28;
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
    const isHigh = c.burnout >= 6;
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
        else if (p < 6) ctx.fillStyle = '#fbbf24';
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
 * Detailed Procedural Vector Character Construction.
 * Uses anatomical curves, beveled armor plating, specular rim highlights,
 * distinct weapons, glowing optics, and energy conduits.
 */
function drawUnitSilhouette(
  ctx: CanvasRenderingContext2D,
  c: Combatant,
  cx: number,
  cy: number,
  size: number,
  _isParty: boolean,
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
  if (id.includes('haden')) weightScale = 1.55; // Decimator / Enforcer
  else if (id.includes('legionnaire') || id.includes('guard')) weightScale = 1.25; // Imperial
  else if (id.includes('blocker')) weightScale = 1.35; // Psi-Blocker
  else if (id.includes('stalker')) weightScale = 1.30; // Shub Stalker
  else if (id.includes('drone')) weightScale = 0.85; // Shub Swarm Drone
  else if (id.includes('tarek')) weightScale = 1.20; // Tarek Heavy
  else if (id.includes('valen')) weightScale = 1.10; // Valen
  else if (id.includes('lyra')) weightScale = 0.95; // Lyra
  else if (id.includes('kaelen')) weightScale = 1.00; // Kaelen

  // Subtle per-instance scale offset
  const instanceScaleOffset = 1.0 + ((unitIndex % 3) - 1) * 0.04;

  // Asymmetrical weapon mounting side (Unit A left, Unit B right)
  const isAltMount = unitIndex % 2 === 1;

  // Idle breathing / hover animations with unique instance phase offset
  let idleOffsetY = 0;
  let idleScale = 1.0;
  if (!isDead) {
    if (id.includes('drone')) {
      // Drones hover and bob asynchronously
      idleOffsetY = Math.sin(now * 0.0035 + unitIndex * 1.8) * 5;
    } else if (id.includes('haden')) {
      // Hadenmen heavy hydraulic chest breathing
      idleScale = 1.0 + Math.sin(now * 0.002 + unitIndex * 1.2) * 0.03;
    } else {
      // General combat stance breathing
      idleOffsetY = Math.sin(now * 0.003 + unitIndex * 1.4) * 2;
    }
  }

  // Low HP distress flicker
  const hpPct = c.stats.hp / c.stats.maxHp;
  let distressShakeX = 0;
  let distressShakeY = 0;
  if (!isDead && hpPct < 0.25) {
    distressShakeX = (Math.random() - 0.5) * 3;
    distressShakeY = (Math.random() - 0.5) * 3;
  }

  ctx.translate(cx + distressShakeX, cy + idleOffsetY + distressShakeY);
  ctx.scale(idleScale * weightScale * instanceScaleOffset, idleScale * weightScale * instanceScaleOffset);

  const r = size / 2;

  // ----------------------------------------------------
  // 1. IMPERIAL LINE INFANTRY / HOUSE GUARD
  // ----------------------------------------------------
  if (id.includes('legionnaire') || id.includes('guard')) {
    // Under-armor body suit
    ctx.fillStyle = isDead ? '#0f172a' : '#0e141f';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.45, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armored Thighs & Greaves
    ctx.fillStyle = isDead ? '#1e293b' : '#1c2838';
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, r * 0.3);
    ctx.lineTo(-r * 0.15, r * 0.3);
    ctx.lineTo(-r * 0.18, r * 0.9);
    ctx.lineTo(-r * 0.40, r * 0.88);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r * 0.15, r * 0.3);
    ctx.lineTo(r * 0.35, r * 0.3);
    ctx.lineTo(r * 0.40, r * 0.88);
    ctx.lineTo(r * 0.18, r * 0.9);
    ctx.closePath();
    ctx.fill();

    // Torso Cuirass Base with Gradient
    const cuirassGrad = ctx.createLinearGradient(-r * 0.45, -r * 0.4, r * 0.45, r * 0.4);
    cuirassGrad.addColorStop(0, isDead ? '#1e293b' : '#27384e');
    cuirassGrad.addColorStop(1, isDead ? '#0f172a' : '#141d2a');
    ctx.fillStyle = cuirassGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.45);
    ctx.lineTo(r * 0.45, -r * 0.45);
    ctx.lineTo(r * 0.35, r * 0.35);
    ctx.lineTo(-r * 0.35, r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Left Specular Rim Light
    if (!isDead) {
      ctx.fillStyle = '#476385';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.45);
      ctx.lineTo(-r * 0.32, -r * 0.45);
      ctx.lineTo(-r * 0.25, r * 0.35);
      ctx.lineTo(-r * 0.35, r * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Shoulder Pauldrons (Beveled)
    const pauldronGrad = ctx.createLinearGradient(-r * 0.75, -r * 0.55, -r * 0.35, -r * 0.1);
    pauldronGrad.addColorStop(0, isDead ? '#334155' : '#334966');
    pauldronGrad.addColorStop(1, isDead ? '#1e293b' : '#182433');
    ctx.fillStyle = pauldronGrad;

    // Left Pauldron
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.52);
    ctx.lineTo(-r * 0.75, -r * 0.35);
    ctx.lineTo(-r * 0.65, r * 0.05);
    ctx.lineTo(-r * 0.32, -r * 0.1);
    ctx.closePath();
    ctx.fill();

    // Right Pauldron
    ctx.beginPath();
    ctx.moveTo(r * 0.38, -r * 0.52);
    ctx.lineTo(r * 0.75, -r * 0.35);
    ctx.lineTo(r * 0.65, r * 0.05);
    ctx.lineTo(r * 0.32, -r * 0.1);
    ctx.closePath();
    ctx.fill();

    // Slung Particle Carbine (Asymmetric Side)
    ctx.fillStyle = isDead ? '#0f172a' : '#1e293b';
    const gunX = isAltMount ? r * 0.52 : -r * 0.52;
    // Gun body & receiver
    ctx.fillRect(gunX - r * 0.08, -r * 0.75, r * 0.16, r * 0.95);
    // Gun muzzle & emitter
    ctx.fillStyle = isDead ? '#334155' : '#475569';
    ctx.fillRect(gunX - r * 0.05, -r * 0.95, r * 0.10, r * 0.22);
    if (!isDead) {
      // Glow coil on gun
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(gunX - r * 0.03, -r * 0.65, r * 0.06, r * 0.25);
    }

    // Imperial Golden Chest Aegis / Chevron
    if (!isDead) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(-r * 0.28, -r * 0.15);
      ctx.lineTo(0, r * 0.12);
      ctx.lineTo(r * 0.28, -r * 0.15);
      ctx.lineTo(0, -r * 0.02);
      ctx.closePath();
      ctx.fill();

      // Imperial Gorget Collar
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-r * 0.22, -r * 0.50, r * 0.44, r * 0.08);
    }

    // Armored Helmet with Crest
    const helmGrad = ctx.createLinearGradient(-r * 0.3, -r * 0.95, r * 0.3, -r * 0.45);
    helmGrad.addColorStop(0, isDead ? '#334155' : '#334966');
    helmGrad.addColorStop(1, isDead ? '#1e293b' : '#162230');
    ctx.fillStyle = helmGrad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.28, -r * 0.78);
    ctx.lineTo(r * 0.24, -r * 0.42);
    ctx.lineTo(0, -r * 0.38);
    ctx.lineTo(-r * 0.24, -r * 0.42);
    ctx.lineTo(-r * 0.28, -r * 0.78);
    ctx.closePath();
    ctx.fill();

    // Helmet Crest Fin
    ctx.fillStyle = isDead ? '#475569' : '#d97706';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.98);
    ctx.lineTo(r * 0.07, -r * 0.78);
    ctx.lineTo(-r * 0.07, -r * 0.78);
    ctx.closePath();
    ctx.fill();

    // Glowing Tactical Visor Aperture
    if (!isDead) {
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 8;
      ctx.fillStyle = accentColor;
      ctx.fillRect(-r * 0.20, -r * 0.62, r * 0.40, 4.5);
      ctx.shadowBlur = 0;
    }

    // Outer Silhouette Accent Lines
    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 2. HADENMAN AUGMENTED DREADNOUGHT
  // ----------------------------------------------------
  } else if (id.includes('haden')) {
    // Back Heavy Reactor Sponson
    ctx.fillStyle = isDead ? '#1e293b' : '#1f060a';
    ctx.fillRect(-r * 0.85, -r * 0.45, r * 1.7, r * 0.95);

    // Sloped Juggernaut Cowl & Pauldrons
    const hadenGrad = ctx.createLinearGradient(-r * 0.95, -r * 0.8, r * 0.95, r * 0.8);
    hadenGrad.addColorStop(0, isDead ? '#334155' : '#4c0812');
    hadenGrad.addColorStop(1, isDead ? '#0f172a' : '#220408');
    ctx.fillStyle = hadenGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, -r * 0.2);
    ctx.lineTo(-r * 0.75, -r * 0.85);
    ctx.lineTo(r * 0.75, -r * 0.85);
    ctx.lineTo(r * 0.95, -r * 0.2);
    ctx.lineTo(r * 0.65, r * 0.85);
    ctx.lineTo(-r * 0.65, r * 0.85);
    ctx.closePath();
    ctx.fill();

    // Left Specular Rim Plate
    if (!isDead) {
      ctx.fillStyle = '#9f1239';
      ctx.beginPath();
      ctx.moveTo(-r * 0.95, -r * 0.2);
      ctx.lineTo(-r * 0.75, -r * 0.85);
      ctx.lineTo(-r * 0.58, -r * 0.75);
      ctx.lineTo(-r * 0.78, -r * 0.15);
      ctx.lineTo(-r * 0.55, r * 0.75);
      ctx.lineTo(-r * 0.65, r * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Torso Breaching Plate
    ctx.fillStyle = isDead ? '#1e293b' : '#3b0710';
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.55);
    ctx.lineTo(r * 0.5, -r * 0.55);
    ctx.lineTo(r * 0.38, r * 0.4);
    ctx.lineTo(-r * 0.38, r * 0.4);
    ctx.closePath();
    ctx.fill();

    // Asymmetric Weapon Arms: Heavy Pneumatic Clamp & Plasma Cannon
    const cannonX = isAltMount ? r * 0.72 : -r * 0.72;
    const clampX = isAltMount ? -r * 0.72 : r * 0.72;

    // Heavy Plasma Cannon (Coil Glowing)
    ctx.fillStyle = isDead ? '#0f172a' : '#180306';
    ctx.fillRect(cannonX - r * 0.18, -r * 0.8, r * 0.36, r * 1.1);
    if (!isDead) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(cannonX - r * 0.12, -r * 0.7, r * 0.24, r * 0.1);
      ctx.fillRect(cannonX - r * 0.12, -r * 0.5, r * 0.24, r * 0.1);
      ctx.fillRect(cannonX - r * 0.12, -r * 0.3, r * 0.24, r * 0.1);
    }

    // Pneumatic Crusher Clamp
    ctx.fillStyle = isDead ? '#334155' : '#4c0812';
    ctx.beginPath();
    ctx.moveTo(clampX - r * 0.15, -r * 0.6);
    ctx.lineTo(clampX + r * 0.15, -r * 0.6);
    ctx.lineTo(clampX + r * 0.22, r * 0.3);
    ctx.lineTo(clampX - r * 0.22, r * 0.3);
    ctx.closePath();
    ctx.fill();

    // Segmented Cybernetic Core Reactor
    ctx.fillStyle = '#0a0103';
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    if (!isDead) {
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(0, -r * 0.05, r * 0.14, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Heavy Armored Brow Helmet
    ctx.fillStyle = isDead ? '#1e293b' : '#5c0d18';
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.78);
    ctx.lineTo(r * 0.38, -r * 0.78);
    ctx.lineTo(r * 0.28, -r * 0.42);
    ctx.lineTo(-r * 0.28, -r * 0.42);
    ctx.closePath();
    ctx.fill();

    // Glowing Crimson Optics Slit
    if (!isDead) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-r * 0.3, -r * 0.58, r * 0.6, 5);
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 3. SHUB SWARM DRONE
  // ----------------------------------------------------
  } else if (id.includes('drone')) {
    // Base Carbon Hull
    ctx.fillStyle = isDead ? '#0f172a' : '#140c24';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.85, 0);
    ctx.lineTo(0, r * 0.95);
    ctx.lineTo(-r * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    // Port & Starboard Faceted Wing Plates
    ctx.fillStyle = isDead ? '#1e293b' : '#2b164c';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.85, 0);
    ctx.lineTo(r * 0.35, 0);
    ctx.lineTo(0, -r * 0.45);
    ctx.closePath();
    ctx.fill();

    // Left Specular Rim
    if (!isDead) {
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(-r * 0.85, 0);
      ctx.lineTo(-r * 0.60, 0);
      ctx.lineTo(0, -r * 0.70);
      ctx.closePath();
      ctx.fill();
    }

    // Dual Underslung Particle Carbine Needles
    ctx.fillStyle = isDead ? '#334155' : '#4c1d95';
    ctx.fillRect(-r * 0.72, -r * 0.35, r * 0.12, r * 0.7);
    ctx.fillRect(r * 0.60, -r * 0.35, r * 0.12, r * 0.7);

    // Central Gyroscopic Sensor Eye Aperture
    ctx.fillStyle = '#080411';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isDead ? '#1e293b' : '#3b0764';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    if (!isDead) {
      // Holographic Cyan Pupil
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Plasma Jet Exhaust Flare
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.moveTo(-r * 0.16, r * 0.9);
      ctx.lineTo(0, r * 0.95 + 8 + Math.random() * 6);
      ctx.lineTo(r * 0.16, r * 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 4. SHUB SWARM STALKER (Mantis Hunter)
  // ----------------------------------------------------
  } else if (id.includes('stalker')) {
    // Predatory Wing Hull
    ctx.fillStyle = isDead ? '#0f172a' : '#190a2e';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.9, -r * 0.15);
    ctx.lineTo(r * 0.55, r * 0.85);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.55, r * 0.85);
    ctx.lineTo(-r * 0.9, -r * 0.15);
    ctx.closePath();
    ctx.fill();

    // Swept Razor Blades
    ctx.fillStyle = isDead ? '#1e293b' : '#3b0764';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(r * 0.82, -r * 0.15);
    ctx.lineTo(r * 0.48, r * 0.65);
    ctx.lineTo(0, r * 0.25);
    ctx.lineTo(-r * 0.48, r * 0.65);
    ctx.lineTo(-r * 0.82, -r * 0.15);
    ctx.closePath();
    ctx.fill();

    // Dual Plasma Pod Batteries
    ctx.fillStyle = isDead ? '#334155' : '#581c87';
    ctx.fillRect(-r * 0.85, -r * 0.45, r * 0.18, r * 0.6);
    ctx.fillRect(r * 0.67, -r * 0.45, r * 0.18, r * 0.6);

    // Tri-Optic Targeting Lasers
    if (!isDead) {
      ctx.shadowColor = '#ec4899';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(-r * 0.12, -r * 0.55, 3, 0, Math.PI * 2);
      ctx.arc(r * 0.12, -r * 0.55, 3, 0, Math.PI * 2);
      ctx.arc(0, -r * 0.40, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 5. PSI-BLOCKER PYLON
  // ----------------------------------------------------
  } else if (id.includes('blocker')) {
    // Obsidian Spire Column
    ctx.fillStyle = isDead ? '#0f172a' : '#150c26';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.98);
    ctx.lineTo(r * 0.38, -r * 0.2);
    ctx.lineTo(r * 0.48, r * 0.88);
    ctx.lineTo(-r * 0.48, r * 0.88);
    ctx.lineTo(-r * 0.38, -r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Faceted Crystal Bevels
    ctx.fillStyle = isDead ? '#1e293b' : '#2e1254';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.98);
    ctx.lineTo(r * 0.38, -r * 0.2);
    ctx.lineTo(0, r * 0.82);
    ctx.closePath();
    ctx.fill();

    // Null Singularity Cavity
    ctx.fillStyle = '#06020c';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();

    if (!isDead) {
      // Gyroscopic Outer Counter-Rotating Ring 1
      const angle1 = now * 0.002;
      ctx.save();
      ctx.rotate(angle1);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.88, r * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Gyroscopic Inner Counter-Rotating Ring 2
      const angle2 = -now * 0.0015;
      ctx.save();
      ctx.rotate(angle2);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.62, r * 0.26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Pulsing Psionic Suppression Sphere
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#f3e8ff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 6. CAPTAIN VALEN VANCE
  // ----------------------------------------------------
  } else if (id.includes('valen')) {
    // Commander Trench Cuirass
    ctx.fillStyle = isDead ? '#0f172a' : '#0a1e36';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.75, -r * 0.35);
    ctx.lineTo(r * 0.58, r * 0.88);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.58, r * 0.88);
    ctx.lineTo(-r * 0.75, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    // High Gold-Trimmed Officer Collar
    if (!isDead) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-r * 0.25, -r * 0.55, r * 0.5, r * 0.1);
    }

    // Shoulder Jump-Jet Booster Turbines
    ctx.fillStyle = isDead ? '#1e293b' : '#1e3a5f';
    ctx.fillRect(-r * 0.88, -r * 0.5, r * 0.22, r * 0.5);
    ctx.fillRect(r * 0.66, -r * 0.5, r * 0.22, r * 0.5);

    if (!isDead && c.isBoosting) {
      // Intense Booster Exhaust Flame & Embers
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-r * 0.84, -r * 0.7, r * 0.14, r * 0.22);
      ctx.fillRect(r * 0.70, -r * 0.7, r * 0.14, r * 0.22);
      ctx.shadowBlur = 0;
    }

    // Commander Visor
    if (!isDead) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-r * 0.32, -r * 0.68, r * 0.64, 4.5);
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 7. LYRA CHEN (ESPER)
  // ----------------------------------------------------
  } else if (id.includes('lyra')) {
    // Flowing Psionic Mantle
    ctx.fillStyle = isDead ? '#0f172a' : '#1f0d33';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.7, 0);
    ctx.lineTo(0, r * 0.95);
    ctx.lineTo(-r * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    // Inner Crystalline Mystic Core
    ctx.fillStyle = isDead ? '#1e293b' : '#3b1259';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(r * 0.45, 0);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.45, 0);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      // Orbiting Psionic Wisps & Energy Aura
      const ringColor = espBlocked ? '#ef4444' : '#c084fc';
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = ringColor;
      for (let i = 0; i < 4; i++) {
        const angle = now * 0.003 + (i * Math.PI * 2) / 4;
        const ox = Math.cos(angle) * (r * 0.88 + 4);
        const oy = Math.sin(angle) * (r * 0.88 + 4);
        ctx.beginPath();
        ctx.arc(ox, oy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 8. KAELEN VOSS (SHARPSHOOTER)
  // ----------------------------------------------------
  } else if (id.includes('kaelen')) {
    // Recon Sniper Cowl
    ctx.fillStyle = isDead ? '#0f172a' : '#111d2e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.85);
    ctx.lineTo(r * 0.55, -r * 0.85);
    ctx.lineTo(r * 0.68, r * 0.85);
    ctx.lineTo(-r * 0.68, r * 0.85);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      // Long Anti-Material Railgun Barrel
      ctx.fillStyle = '#334155';
      ctx.fillRect(r * 0.25, -r * 1.35, r * 0.12, r * 1.4);
      // High-Magnification Scope
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(r * 0.20, -r * 0.85, r * 0.22, 5);
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 9. TAREK 'SPROCKET' (BULWARK DEFENDER)
  // ----------------------------------------------------
  } else {
    // Heavy Juggernaut Bulwark Plate
    ctx.fillStyle = isDead ? '#0f172a' : '#0c261b';
    ctx.fillRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7);

    ctx.fillStyle = isDead ? '#1e293b' : '#143d2c';
    ctx.fillRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2);

    if (!isDead) {
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-r * 0.85, -r * 0.85, r * 0.25, r * 1.7);
      ctx.fillRect(-r * 0.45, -r * 0.35, r * 0.9, 5);
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}
