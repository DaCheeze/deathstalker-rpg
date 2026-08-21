/**
 * Renders the Dominant Battlefield Arena (Enemies) and Compact Party Status Strip.
 * Features 8-14 layered filled geometric primitives per unit (depth rim lights, dark inset cores, armor plates),
 * per-instance visual differentiation (instance letters, unique accent rims, phase offsets),
 * grounded deck standing without dashboard boxes, and dynamic visual state indicators.
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
  const silhouetteSize = Math.min(w * 0.82, h * 0.52);

  ctx.save();

  // 1. Ground Contact Shadow / Deck Plane Reflection
  if (!isDead) {
    const shadowY = y + h * 0.72 + flinchY * 0.2;
    const shadowGrad = ctx.createRadialGradient(centerX, shadowY, 5, centerX, shadowY, silhouetteSize * 0.6);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    shadowGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.3)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, shadowY, silhouetteSize * 0.65, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Tactical Reticle / Corner Brackets on Target / Hover / Active
  if (isSelectedTarget || isHovered || isActive) {
    const retColor = isSelectedTarget ? '#ef4444' : isHovered ? '#f59e0b' : '#38bdf8';
    const bracketSize = 16;
    const pad = 12;
    const boxLeft = centerX - silhouetteSize * 0.62 - pad;
    const boxRight = centerX + silhouetteSize * 0.62 + pad;
    const boxTop = centerY - silhouetteSize * 0.62 - pad;
    const boxBottom = centerY + silhouetteSize * 0.55 + pad;

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

  // 4. Dominant 8-14 Layered Silhouette Form
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
    unitIndex,
    instanceLetter
  );

  // 5. Floating HP Bar & Status Indicators (Bottom)
  const barW = Math.min(180, w - 24);
  const barH = 6;
  const barX = centerX - barW / 2;
  const barY = y + h - 28;

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

  // 2. Party Silhouette (Slightly larger, crisp proportion)
  const silSize = 54;
  const silCenterX = renderX + 34;
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
  const textX = renderX + 64;
  ctx.textAlign = 'left';
  ctx.font = 'bold 11px monospace';
  ctx.fillStyle = isDead ? THEME.textMuted : THEME.textHighlight;
  ctx.fillText(c.displayName || c.name, textX, renderY + 18, w - 70);

  // 4. HP Bar
  const hpBarW = w - 72;
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
 * 8-14 Layered Form Silhouette Construction.
 * Mid-tone solid fill, darker inset core, lighter rim light edge,
 * distinct armor plates, weapon mounts, mechanical joints, and sensor optics.
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
  unitIndex: number,
  _instanceLetter?: string
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
  // UNIT-SPECIFIC 8-14 LAYERED SHAPE CONSTRUCTIONS
  // ----------------------------------------------------

  if (id.includes('haden')) {
    // ====================================================
    // 1. HADENMAN AUGMENTED DREADNOUGHT (14 Layered Shapes)
    // ====================================================

    // Layer 1: Back Power Reactor Chassis
    ctx.fillStyle = isDead ? '#1e293b' : '#260808';
    ctx.fillRect(-r * 0.85, -r * 0.4, r * 1.7, r * 0.9);

    // Layer 2: Heavy Shoulder Pauldrons Base
    ctx.fillStyle = isDead ? '#334155' : '#3d0f0f';
    ctx.beginPath();
    ctx.moveTo(-r * 0.95, -r * 0.2);
    ctx.lineTo(-r * 0.7, -r * 0.85);
    ctx.lineTo(r * 0.7, -r * 0.85);
    ctx.lineTo(r * 0.95, -r * 0.2);
    ctx.lineTo(r * 0.65, r * 0.75);
    ctx.lineTo(-r * 0.65, r * 0.75);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Left Rim Light Bevel (Creates Depth)
    if (!isDead) {
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(-r * 0.95, -r * 0.2);
      ctx.lineTo(-r * 0.7, -r * 0.85);
      ctx.lineTo(-r * 0.55, -r * 0.75);
      ctx.lineTo(-r * 0.75, -r * 0.15);
      ctx.lineTo(-r * 0.55, r * 0.65);
      ctx.lineTo(-r * 0.65, r * 0.75);
      ctx.closePath();
      ctx.fill();
    }

    // Layer 4: Dark Inset Chest Chassis Cavity
    ctx.fillStyle = isDead ? '#0f172a' : '#110406';
    ctx.beginPath();
    ctx.moveTo(-r * 0.52, -r * 0.6);
    ctx.lineTo(r * 0.52, -r * 0.6);
    ctx.lineTo(r * 0.4, r * 0.55);
    ctx.lineTo(-r * 0.4, r * 0.55);
    ctx.closePath();
    ctx.fill();

    // Layer 5: Upper Torso Armored Breastplate
    ctx.fillStyle = isDead ? '#1e293b' : '#450a0a';
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.5);
    ctx.lineTo(r * 0.45, -r * 0.5);
    ctx.lineTo(r * 0.35, -r * 0.05);
    ctx.lineTo(-r * 0.35, -r * 0.05);
    ctx.closePath();
    ctx.fill();

    // Layer 6: Lower Abdominal Segmented Plates
    ctx.fillStyle = isDead ? '#141e2e' : '#2e080b';
    ctx.fillRect(-r * 0.3, 0, r * 0.6, r * 0.12);
    ctx.fillRect(-r * 0.26, r * 0.16, r * 0.52, r * 0.12);
    ctx.fillRect(-r * 0.22, r * 0.32, r * 0.44, r * 0.12);

    // Layer 7 & 8: Weapon Mount & Armored Gauntlets (Asymmetric)
    ctx.fillStyle = isDead ? '#334155' : '#380c10';
    const mountX = isAltMount ? r * 0.7 : -r * 0.7;
    ctx.fillRect(mountX - r * 0.15, -r * 0.65, r * 0.3, r * 0.85);

    // Layer 9: Heavy Helm Brow Visor Plate
    ctx.fillStyle = isDead ? '#1e293b' : '#5c0d12';
    ctx.beginPath();
    ctx.moveTo(-r * 0.38, -r * 0.75);
    ctx.lineTo(r * 0.38, -r * 0.75);
    ctx.lineTo(r * 0.28, -r * 0.35);
    ctx.lineTo(-r * 0.28, -r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Layer 10: Glowing Crimson Optics Slit
    if (!isDead) {
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-r * 0.3, -r * 0.52, r * 0.6, 4);

      // Layer 11: Core Reactor Housing
      ctx.fillStyle = '#0a0204';
      ctx.beginPath();
      ctx.arc(0, -r * 0.02, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Layer 12: Pulsing Plasma Reactor Core
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(0, -r * 0.02, r * 0.10, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer Accent Stroke
    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (id.includes('legionnaire') || id.includes('guard')) {
    // ====================================================
    // 2. IMPERIAL LINE INFANTRY / GUARD (12 Layered Shapes)
    // ====================================================

    // Layer 1: Undersuit Armor Base Silhouette
    ctx.fillStyle = isDead ? '#0f172a' : '#141923';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.75, -r * 0.3);
    ctx.lineTo(r * 0.6, r * 0.85);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.6, r * 0.85);
    ctx.lineTo(-r * 0.75, -r * 0.3);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Main Torso Cuirass Plate (Mid-Tone Fill)
    ctx.fillStyle = isDead ? '#1e293b' : '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.7);
    ctx.lineTo(r * 0.55, -r * 0.2);
    ctx.lineTo(r * 0.45, r * 0.6);
    ctx.lineTo(0, r * 0.45);
    ctx.lineTo(-r * 0.45, r * 0.6);
    ctx.lineTo(-r * 0.55, -r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Left Rim Light Sheen (Depth Edge)
    if (!isDead) {
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(-r * 0.75, -r * 0.3);
      ctx.lineTo(-r * 0.58, -r * 0.2);
      ctx.lineTo(-r * 0.1, -r * 0.8);
      ctx.closePath();
      ctx.fill();
    }

    // Layer 4: Dark Inset Sternum Core
    ctx.fillStyle = isDead ? '#0b0f19' : '#0f172a';
    ctx.beginPath();
    ctx.moveTo(-r * 0.25, -r * 0.3);
    ctx.lineTo(r * 0.25, -r * 0.3);
    ctx.lineTo(r * 0.18, r * 0.3);
    ctx.lineTo(-r * 0.18, r * 0.3);
    ctx.closePath();
    ctx.fill();

    // Layer 5 & 6: Shoulder Pauldron Plates (Asymmetric Mount)
    ctx.fillStyle = isDead ? '#334155' : '#273549';
    ctx.fillRect(-r * 0.78, -r * 0.45, r * 0.28, r * 0.45);
    ctx.fillRect(r * 0.50, -r * 0.45, r * 0.28, r * 0.45);

    // Layer 7: Weapon Mount / Scabbard (Mirrored by Instance)
    ctx.fillStyle = isDead ? '#1e293b' : '#334155';
    const wepX = isAltMount ? r * 0.65 : -r * 0.65;
    ctx.fillRect(wepX - r * 0.08, -r * 0.75, r * 0.16, r * 0.9);

    // Layer 8: Golden Imperial Gorget / Collar
    ctx.fillStyle = isDead ? '#475569' : '#78350f';
    ctx.fillRect(-r * 0.25, -r * 0.65, r * 0.5, r * 0.1);

    // Layer 9: Imperial Golden Chest Chevron Aegis
    if (!isDead) {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(-r * 0.35, -r * 0.12);
      ctx.lineTo(0, r * 0.18);
      ctx.lineTo(r * 0.35, -r * 0.12);
      ctx.lineTo(0, r * 0.05);
      ctx.closePath();
      ctx.fill();
    }

    // Layer 10: Armored Helmet Faceplate
    ctx.fillStyle = isDead ? '#1e293b' : '#2d3748';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.92);
    ctx.lineTo(r * 0.32, -r * 0.55);
    ctx.lineTo(-r * 0.32, -r * 0.55);
    ctx.closePath();
    ctx.fill();

    // Layer 11: Glowing Amber Visor Optics
    if (!isDead) {
      ctx.fillStyle = accentColor;
      ctx.fillRect(-r * 0.26, -r * 0.68, r * 0.52, 4);
    }

    // Outer Accent Trim
    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (id.includes('drone')) {
    // ====================================================
    // 3. SHUB SWARM DRONE (10 Layered Shapes)
    // ====================================================

    // Layer 1: Base Diamond Hull
    ctx.fillStyle = isDead ? '#0f172a' : '#130e20';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(r * 0.75, 0);
    ctx.lineTo(0, r * 0.85);
    ctx.lineTo(-r * 0.75, 0);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Upper Port Armor Carapace
    ctx.fillStyle = isDead ? '#1e293b' : '#24153a';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.85);
    ctx.lineTo(r * 0.75, 0);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Left Rim Light Sheen
    if (!isDead) {
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.85);
      ctx.lineTo(-r * 0.75, 0);
      ctx.lineTo(-r * 0.55, 0);
      ctx.lineTo(0, -r * 0.65);
      ctx.closePath();
      ctx.fill();
    }

    // Layer 4: Dark Inset Computing Core
    ctx.fillStyle = isDead ? '#090d16' : '#090611';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();

    // Layer 5 & 6: Dual Particle Carbine Prongs
    ctx.fillStyle = isDead ? '#334155' : '#3b0764';
    ctx.fillRect(-r * 0.72, -r * 0.25, r * 0.15, r * 0.5);
    ctx.fillRect(r * 0.57, -r * 0.25, r * 0.15, r * 0.5);

    // Layer 7: Sensor Eye Housing
    ctx.fillStyle = isDead ? '#1e293b' : '#2e1065';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Layer 8: Glowing Optical Sensor Eye
    if (!isDead) {
      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
      ctx.fill();

      // Layer 9: Propulsion Thruster Jet
      ctx.fillStyle = '#818cf8';
      ctx.beginPath();
      ctx.moveTo(-r * 0.15, r * 0.8);
      ctx.lineTo(0, r * 0.85 + 7 + Math.random() * 5);
      ctx.lineTo(r * 0.15, r * 0.8);
      ctx.fill();
    }

    // Outer Accent Trim
    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (id.includes('stalker')) {
    // ====================================================
    // 4. SHUB SWARM STALKER (11 Layered Shapes)
    // ====================================================

    // Layer 1: Base Chassis
    ctx.fillStyle = isDead ? '#0f172a' : '#160a24';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(r * 0.85, -r * 0.1);
    ctx.lineTo(r * 0.5, r * 0.8);
    ctx.lineTo(0, r * 0.4);
    ctx.lineTo(-r * 0.5, r * 0.8);
    ctx.lineTo(-r * 0.85, -r * 0.1);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Swept Armor Wings
    ctx.fillStyle = isDead ? '#1e293b' : '#2e1065';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(r * 0.8, -r * 0.1);
    ctx.lineTo(r * 0.45, r * 0.6);
    ctx.lineTo(0, r * 0.2);
    ctx.lineTo(-r * 0.45, r * 0.6);
    ctx.lineTo(-r * 0.8, -r * 0.1);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Left Rim Light Edge
    if (!isDead) {
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(-r * 0.85, -r * 0.1);
      ctx.lineTo(-r * 0.65, -r * 0.05);
      ctx.lineTo(0, -r * 0.7);
      ctx.closePath();
      ctx.fill();
    }

    // Layer 4: Dark Inset Hunter Core
    ctx.fillStyle = isDead ? '#090d16' : '#08030e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.3, -r * 0.4);
    ctx.lineTo(r * 0.3, -r * 0.4);
    ctx.lineTo(r * 0.2, r * 0.2);
    ctx.lineTo(-r * 0.2, r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Layer 5 & 6: Dual Plasma Pod Cannons
    ctx.fillStyle = isDead ? '#334155' : '#581c87';
    ctx.fillRect(-r * 0.82, -r * 0.35, r * 0.16, r * 0.5);
    ctx.fillRect(r * 0.66, -r * 0.35, r * 0.16, r * 0.5);

    // Layer 7: Forward Optical Pod
    ctx.fillStyle = isDead ? '#1e293b' : '#3b0764';
    ctx.fillRect(-r * 0.18, -r * 0.7, r * 0.36, r * 0.35);

    // Layer 8: Tri-Optic Targeting Lasers
    if (!isDead) {
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.arc(-r * 0.08, -r * 0.55, 2.5, 0, Math.PI * 2);
      ctx.arc(r * 0.08, -r * 0.55, 2.5, 0, Math.PI * 2);
      ctx.arc(0, -r * 0.42, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (id.includes('blocker')) {
    // ====================================================
    // 5. PSI-BLOCKER PYLON (10 Layered Shapes)
    // ====================================================

    // Layer 1: Central Obelisk Spire
    ctx.fillStyle = isDead ? '#0f172a' : '#15102a';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.35, -r * 0.2);
    ctx.lineTo(r * 0.45, r * 0.85);
    ctx.lineTo(-r * 0.45, r * 0.85);
    ctx.lineTo(-r * 0.35, -r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Layer 2: Faceted Spire Column
    ctx.fillStyle = isDead ? '#1e293b' : '#241945';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.35, -r * 0.2);
    ctx.lineTo(0, r * 0.8);
    ctx.closePath();
    ctx.fill();

    // Layer 3: Left Rim Light Highlight
    if (!isDead) {
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(-r * 0.35, -r * 0.2);
      ctx.lineTo(-r * 0.25, -r * 0.15);
      ctx.lineTo(0, -r * 0.75);
      ctx.closePath();
      ctx.fill();
    }

    // Layer 4: Dark Null Cavity
    ctx.fillStyle = isDead ? '#090d16' : '#0b0618';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    if (!isDead) {
      // Layer 5: Counter-Rotating Containment Ring 1
      const angle1 = now * 0.002;
      ctx.save();
      ctx.rotate(angle1);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Layer 6: Counter-Rotating Containment Ring 2
      const angle2 = -now * 0.0015;
      ctx.save();
      ctx.rotate(angle2);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.6, r * 0.25, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Layer 7: Pulsing Suppression Core
      ctx.fillStyle = '#e9d5ff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (id.includes('valen')) {
    // ====================================================
    // 6. CAPTAIN VALEN (COMMANDER)
    // ====================================================
    ctx.fillStyle = isDead ? '#0f172a' : '#091e36';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.8, -r * 0.3);
    ctx.lineTo(r * 0.6, r * 0.85);
    ctx.lineTo(0, r * 0.65);
    ctx.lineTo(-r * 0.6, r * 0.85);
    ctx.lineTo(-r * 0.8, -r * 0.3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isDead ? '#090d16' : '#031020';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.65);
    ctx.lineTo(r * 0.5, -r * 0.2);
    ctx.lineTo(r * 0.35, r * 0.5);
    ctx.lineTo(0, r * 0.35);
    ctx.lineTo(-r * 0.35, r * 0.5);
    ctx.lineTo(-r * 0.5, -r * 0.2);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(-r * 0.8, -r * 0.3);
      ctx.lineTo(-r * 0.6, -r * 0.2);
      ctx.lineTo(0, -r * 0.75);
      ctx.closePath();
      ctx.fill();

      // Commander Visor
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-r * 0.35, -r * 0.45, r * 0.7, 4);

      // Booster exhausts
      if (c.isBoosting) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-r - 4, -6, 4, 12);
        ctx.fillRect(r, -6, 4, 12);
      }
    }

    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (id.includes('lyra')) {
    // ====================================================
    // 7. LYRA (ESPER PSIONIC)
    // ====================================================
    ctx.fillStyle = isDead ? '#0f172a' : '#1e1131';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(r * 0.65, 0);
    ctx.lineTo(0, r * 0.9);
    ctx.lineTo(-r * 0.65, 0);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isDead ? '#090d16' : '#0e051a';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(r * 0.4, 0);
    ctx.lineTo(0, r * 0.6);
    ctx.lineTo(-r * 0.4, 0);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      ctx.fillStyle = '#6b21a8';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.9);
      ctx.lineTo(-r * 0.65, 0);
      ctx.lineTo(-r * 0.4, 0);
      ctx.lineTo(0, -r * 0.6);
      ctx.closePath();
      ctx.fill();

      // Orbiting Psionic Nodes
      const ringColor = espBlocked ? '#ef4444' : '#c084fc';
      ctx.fillStyle = ringColor;
      for (let i = 0; i < 3; i++) {
        const angle = now * 0.003 + (i * Math.PI * 2) / 3;
        const ox = Math.cos(angle) * (r * 0.85 + 4);
        const oy = Math.sin(angle) * (r * 0.85 + 4);
        ctx.beginPath();
        ctx.arc(ox, oy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else if (id.includes('kaelen')) {
    // ====================================================
    // 8. KAELEN (SHARPSHOOTER)
    // ====================================================
    ctx.fillStyle = isDead ? '#0f172a' : '#141e2e';
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.8);
    ctx.lineTo(r * 0.5, -r * 0.8);
    ctx.lineTo(r * 0.7, r * 0.8);
    ctx.lineTo(-r * 0.7, r * 0.8);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = isDead ? '#090d16' : '#080d16';
    ctx.fillRect(-r * 0.35, -r * 0.5, r * 0.7, r * 0.9);

    if (!isDead) {
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(-r * 0.65, -r * 0.7, r * 0.2, r * 1.3);

      // Sniper Barrel
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(r * 0.3, -r * 0.5);
      ctx.lineTo(r * 0.3, -r * 1.15);
      ctx.stroke();
    }

    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  } else {
    // ====================================================
    // 9. TAREK (BULWARK DEFENDER)
    // ====================================================
    ctx.fillStyle = isDead ? '#0f172a' : '#0c2419';
    ctx.fillRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);

    ctx.fillStyle = isDead ? '#090d16' : '#04120b';
    ctx.fillRect(-r * 0.55, -r * 0.55, r * 1.1, r * 1.1);

    if (!isDead) {
      ctx.fillStyle = '#047857';
      ctx.fillRect(-r * 0.8, -r * 0.8, r * 0.25, r * 1.6);

      // Heavy Visor
      ctx.fillStyle = '#10b981';
      ctx.fillRect(-r * 0.4, -r * 0.3, r * 0.8, 5);
    }

    ctx.strokeStyle = isDead ? '#475569' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}
