/**
 * Renders the Dominant Battlefield Arena (Enemies) and Compact Party Status Strip.
 * High-fidelity procedural vector rendering with multi-layered anatomical & mechanical silhouettes,
 * specular lighting, depth bevels, glowing conduits, per-instance variation, and grounded deck staging.
 */

import { BattleState, Combatant, EncounterDefinition } from '../core/types';
import { isEspBlocked } from '../core/battle';
import { THEME, getEnemyCardBounds, getPartyCombatantBounds, getPartyCardBounds } from './theme';
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

import encountersData from '../data/encounters.json';

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

  const encList = encountersData as unknown as EncounterDefinition[];
  const enc = encList.find((e) => e.id === state.encounterId);
  const lightSourceX = enc?.environment?.lightSourceX ?? 0.5;
  const rimSide: 'left' | 'right' = lightSourceX > 0.5 ? 'right' : 'left';

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
      idx,
      rimSide
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

  const encList = encountersData as unknown as EncounterDefinition[];
  const enc = encList.find((e) => e.id === state.encounterId);
  const lightSourceX = enc?.environment?.lightSourceX ?? 0.5;
  const rimSide: 'left' | 'right' = lightSourceX > 0.5 ? 'right' : 'left';

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
      idx,
      rimSide
    );
  });
}

/**
 * Layer 9: Renders Party Status Cards & Meters along the bottom status strip.
 */
export function drawPartyStatusCards(
  ctx: CanvasRenderingContext2D,
  state: BattleState
): void {
  const partyCount = state.partyIds.length;

  state.partyIds.forEach((id, idx) => {
    const hero = state.combatants[id];
    if (!hero) return;

    const bounds = getPartyCardBounds(partyCount, idx);
    const isActive = hero.id === state.activeActorId;

    drawPartyStripCard(
      ctx,
      hero,
      bounds.x,
      bounds.y,
      bounds.w,
      isActive
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
  unitIndex: number,
  rimSide: 'left' | 'right'
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
  const silhouetteSize = Math.min(w * 0.95, h * 0.62);

  ctx.save();

  // 1. Ground Contact Shadow onto Stage Floor
  if (!isDead) {
    const shadowY = y + h * 0.74 + flinchY * 0.2;
    const shadowGrad = ctx.createRadialGradient(centerX, shadowY, 4, centerX, shadowY, silhouetteSize * 0.65);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, shadowY, silhouetteSize * 0.65, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Tactical Reticle Brackets on Active / Hover
  if (isActive || isHovered) {
    const retColor = isActive ? '#38bdf8' : '#f59e0b';
    const bracketSize = 14;
    const pad = 10;
    const boxLeft = centerX - silhouetteSize * 0.58 - pad;
    const boxRight = centerX + silhouetteSize * 0.58 + pad;
    const boxTop = centerY - silhouetteSize * 0.58 - pad;
    const boxBottom = centerY + silhouetteSize * 0.52 + pad;

    ctx.strokeStyle = retColor;
    ctx.lineWidth = isActive ? 2.0 : 1.2;

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

  // 3. Draw Procedural Multi-Layered Combatant Silhouette
  const partyAccents = ['#38bdf8', '#c084fc', '#f59e0b', '#34d399'];
  const accentColor = c.accentColor || partyAccents[unitIndex % partyAccents.length] || '#38bdf8';
  drawUnitSilhouette(ctx, c, centerX, centerY, silhouetteSize, true, isDead, accentColor, espBlocked, unitIndex, rimSide);

  ctx.restore();
}

/**
 * Renders an Enemy standing directly on the physical battlefield environment
 * with NO card frames or background panels. Uses minimalist under-unit HP bar,
 * instance letter pip, and floating name/numeric HP only when targeted/hovered.
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
  _isAllEnemiesTargeted: boolean,
  espBlocked: boolean,
  unitIndex: number,
  rimSide: 'left' | 'right'
): void {
  const isDead = c.stats.hp <= 0;
  const now = performance.now();

  const instanceAccents = ['#f43f5e', '#fb7185', '#fda4af', '#f472b6'];
  const accentColor = c.accentColor || instanceAccents[unitIndex % instanceAccents.length] || '#f43f5e';

  const letters = ['A', 'B', 'C', 'D'];
  const instanceLetter = c.displayName?.match(/\b([A-D])\b/)?.[1] || letters[unitIndex % letters.length] || 'A';

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
  const silhouetteSize = Math.min(w * 0.95, h * 0.62);

  ctx.save();

  // 1. Ground Contact Shadow
  if (!isDead) {
    const shadowY = y + h * 0.74 + flinchY * 0.2;
    const shadowGrad = ctx.createRadialGradient(centerX, shadowY, 4, centerX, shadowY, silhouetteSize * 0.65);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
    shadowGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0.35)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(centerX, shadowY, silhouetteSize * 0.65, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Tactical Reticle Brackets on Target / Hover / Active
  if (isSelectedTarget || isHovered || isActive) {
    const retColor = isSelectedTarget ? '#ef4444' : isHovered ? '#f59e0b' : '#38bdf8';
    const bracketSize = 16;
    const pad = 12;
    const boxLeft = centerX - silhouetteSize * 0.60 - pad;
    const boxRight = centerX + silhouetteSize * 0.60 + pad;
    const boxTop = centerY - silhouetteSize * 0.60 - pad;
    const boxBottom = centerY + silhouetteSize * 0.54 + pad;

    ctx.strokeStyle = retColor;
    ctx.lineWidth = isSelectedTarget ? 2.0 : 1.2;

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

  // 3. Floating Nameplate (ONLY when targeted or hovered)
  if (!isDead && (isSelectedTarget || isHovered)) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.textAlign = 'center';
    ctx.font = '16px monospace';
    ctx.fillStyle = isSelectedTarget ? '#ffffff' : '#e2e8f0';
    const titleStr = c.displayName || `${c.name} ${instanceLetter}`;
    ctx.fillText(titleStr, centerX, y + 10);
    ctx.restore();
  }

  // 4. Detailed Procedural Silhouette
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
    rimSide
  );

  // 5. Minimalist Thin HP Bar & Status Cluster Beneath Unit Feet
  const barW = Math.max(64, Math.min(100, w - 16));
  const barH = 4;
  const barX = centerX - barW / 2;
  const barY = y + h * 0.78;

  const hpPercent = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));

  if (!isDead) {
    // Instance Letter Badge on the Left
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 3;
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'right';
    ctx.fillText(instanceLetter, barX - 6, barY + 4);

    // Thin HP Bar (Frameless over scene)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(barX, barY, barW, barH);

    if (hpPercent > 0) {
      ctx.fillStyle = hpPercent > 0.35 ? '#10b981' : '#ef4444';
      ctx.fillRect(barX, barY, barW * hpPercent, barH);
    }

    // Status Badges on the Right (Disruptor / Shield)
    let statusOffset = barX + barW + 6;
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px monospace';

    if (c.hasForceShield) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('🛡️', statusOffset, barY + 4);
      statusOffset += 14;
    }

    if (c.disruptorCooldown === 0) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('⚡', statusOffset, barY + 4);
    } else if (c.disruptorCooldown === 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('1⚡', statusOffset, barY + 4);
    }

    // Numeric HP (ONLY when targeted or hovered)
    if (isSelectedTarget || isHovered) {
      ctx.textAlign = 'center';
      ctx.font = '13px monospace';
      ctx.fillStyle = '#f1f5f9';
      ctx.fillText(`${c.stats.hp} / ${c.stats.maxHp}`, centerX, barY + 14);
    }
    ctx.restore();
  } else {
    // Destroyed Label
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 3;
    ctx.font = '13px monospace';
    ctx.fillStyle = '#ef4444';
    ctx.textAlign = 'center';
    ctx.fillText('[ DESTROYED ]', centerX, barY + 6);
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Renders Party Status Column at the right edge in the Octopath style.
 * Frameless, floating text and thin bars directly over the diorama scene.
 */
function drawPartyStripCard(
  ctx: CanvasRenderingContext2D,
  c: Combatant,
  x: number,
  y: number,
  w: number,
  isActive: boolean
): void {
  const isDead = c.stats.hp <= 0;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 4;

  const rightX = x + w;

  // 1. Hero Name (Right-aligned, active highlight)
  ctx.textAlign = 'right';
  ctx.font = isActive ? 'bold 17px monospace' : '16px monospace';
  ctx.fillStyle = isDead ? '#64748b' : isActive ? '#38bdf8' : '#f1f5f9';
  ctx.fillText(c.name, rightX, y + 12);

  // Active turn glow pip
  if (isActive) {
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(rightX - ctx.measureText(c.name).width - 10, y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. HP Row: Label, Numbers, Thin Bar
  const hpBarW = 180;
  const barH = 5;
  const hpBarX = rightX - hpBarW;
  const hpY = y + 20;

  ctx.font = '13px monospace';
  ctx.fillStyle = THEME.textMuted;
  ctx.textAlign = 'right';
  ctx.fillText('HP', hpBarX - 10, hpY + 4);

  ctx.font = '14px monospace';
  ctx.fillStyle = isDead ? '#ef4444' : '#ffffff';
  ctx.fillText(`${c.stats.hp}/${c.stats.maxHp}`, rightX, hpY + 4);

  // HP Bar underneath
  const hpBarLineY = hpY + 7;
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(hpBarX, hpBarLineY, hpBarW, barH);

  const hpPct = Math.max(0, Math.min(1, c.stats.hp / c.stats.maxHp));
  if (hpPct > 0) {
    ctx.fillStyle = isDead ? '#475569' : hpPct > 0.35 ? '#10b981' : '#ef4444';
    ctx.fillRect(hpBarX, hpBarLineY, hpBarW * hpPct, barH);
  }

  // 3. ESP Row (if has ESP) OR Burnout Row (if Captain boosting/burnout)
  if (c.stats.maxEsp > 0) {
    const espY = y + 44;
    ctx.font = '13px monospace';
    ctx.fillStyle = '#c084fc';
    ctx.fillText('ESP', hpBarX - 10, espY + 4);

    ctx.font = '14px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${c.stats.esp}/${c.stats.maxEsp}`, rightX, espY + 4);

    const espBarLineY = espY + 7;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(hpBarX, espBarLineY, hpBarW, barH);

    const espPct = Math.max(0, Math.min(1, c.stats.esp / c.stats.maxEsp));
    if (espPct > 0) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(hpBarX, espBarLineY, hpBarW * espPct, barH);
    }
  } else if (c.canBoost && (c.isBoosting || c.burnout > 0)) {
    const burnY = y + 44;
    ctx.font = '13px monospace';
    ctx.fillStyle = c.isBoosting ? '#f59e0b' : '#94a3b8';
    ctx.fillText(c.isBoosting ? 'BOOST' : 'BURN', hpBarX - 10, burnY + 4);

    ctx.font = '14px monospace';
    ctx.fillStyle = c.burnout >= 7 ? '#ef4444' : '#f59e0b';
    ctx.fillText(`${c.burnout}/8`, rightX, burnY + 4);

    const burnBarLineY = burnY + 7;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(hpBarX, burnBarLineY, hpBarW, barH);

    const burnPct = Math.max(0, Math.min(1, c.burnout / 8));
    if (burnPct > 0) {
      ctx.fillStyle = c.burnout >= 7 ? '#ef4444' : '#f59e0b';
      ctx.fillRect(hpBarX, burnBarLineY, hpBarW * burnPct, barH);
    }
  } else {
    // Badges line (Disruptor / Shield)
    let badgeStr = '';
    if (c.hasForceShield) badgeStr += '🛡️ ';
    if (c.disruptorCooldown === 0) badgeStr += '⚡RDY';
    else if (c.disruptorCooldown === 1) badgeStr += '⚡1';

    if (badgeStr) {
      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(badgeStr, rightX, y + 42);
    }
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
  unitIndex: number,
  rimSide: 'left' | 'right'
): void {
  ctx.save();

  const id = c.id.toLowerCase();
  const now = performance.now();
  const rimX = rimSide === 'right' ? -1 : 1;

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
    ctx.fillStyle = isDead ? '#0f172a' : '#253549';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.45, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armored Thighs & Greaves
    ctx.fillStyle = isDead ? '#1e293b' : '#3d5473';
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
    cuirassGrad.addColorStop(0, isDead ? '#1e293b' : '#4d6d96');
    cuirassGrad.addColorStop(1, isDead ? '#0f172a' : '#2a3d54');
    ctx.fillStyle = cuirassGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.45);
    ctx.lineTo(r * 0.45, -r * 0.45);
    ctx.lineTo(r * 0.35, r * 0.35);
    ctx.lineTo(-r * 0.35, r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Specular Rim Light (directional)
    if (!isDead) {
      ctx.fillStyle = '#7ba4d6';
      ctx.beginPath();
      ctx.moveTo(rimX * -r * 0.45, -r * 0.45);
      ctx.lineTo(rimX * -r * 0.32, -r * 0.45);
      ctx.lineTo(rimX * -r * 0.25, r * 0.35);
      ctx.lineTo(rimX * -r * 0.35, r * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Shoulder Pauldrons (Beveled)
    const pauldronGrad = ctx.createLinearGradient(-r * 0.75, -r * 0.55, -r * 0.35, -r * 0.1);
    pauldronGrad.addColorStop(0, isDead ? '#334155' : '#5b7ea8');
    pauldronGrad.addColorStop(1, isDead ? '#1e293b' : '#2b3e57');
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
    ctx.fillStyle = isDead ? '#0f172a' : '#334155';
    const gunX = isAltMount ? r * 0.52 : -r * 0.52;
    // Gun body & receiver
    ctx.fillRect(gunX - r * 0.08, -r * 0.75, r * 0.16, r * 0.95);
    // Gun muzzle & emitter
    ctx.fillStyle = isDead ? '#334155' : '#64748b';
    ctx.fillRect(gunX - r * 0.05, -r * 0.95, r * 0.10, r * 0.22);
    if (!isDead) {
      // Glow coil on gun
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(gunX - r * 0.03, -r * 0.65, r * 0.06, r * 0.25);
    }

    // Imperial Golden Chest Aegis / Chevron
    if (!isDead) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(-r * 0.28, -r * 0.15);
      ctx.lineTo(0, r * 0.12);
      ctx.lineTo(r * 0.28, -r * 0.15);
      ctx.lineTo(0, -r * 0.02);
      ctx.closePath();
      ctx.fill();

      // Imperial Gorget Collar
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-r * 0.22, -r * 0.50, r * 0.44, r * 0.08);
    }

    // Armored Helmet with Crest
    const helmGrad = ctx.createLinearGradient(-r * 0.3, -r * 0.95, r * 0.3, -r * 0.45);
    helmGrad.addColorStop(0, isDead ? '#334155' : '#5b7ea8');
    helmGrad.addColorStop(1, isDead ? '#1e293b' : '#2b3e57');
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
    ctx.fillStyle = isDead ? '#475569' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.98);
    ctx.lineTo(r * 0.07, -r * 0.78);
    ctx.lineTo(-r * 0.07, -r * 0.78);
    ctx.closePath();
    ctx.fill();

    // Glowing Tactical Visor Aperture
    if (!isDead) {
      ctx.shadowColor = accentColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = accentColor;
      ctx.fillRect(-r * 0.20, -r * 0.62, r * 0.40, 5);
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
    ctx.fillStyle = isDead ? '#1e293b' : '#3d0c15';
    ctx.fillRect(-r * 0.85, -r * 0.45, r * 1.7, r * 0.95);

    // Sloped Juggernaut Cowl & Pauldrons
    const hadenGrad = ctx.createLinearGradient(-r * 0.95, -r * 0.8, r * 0.95, r * 0.8);
    hadenGrad.addColorStop(0, isDead ? '#334155' : '#881328');
    hadenGrad.addColorStop(1, isDead ? '#0f172a' : '#450a12');
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

    // Specular Rim Plate (directional)
    if (!isDead) {
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.moveTo(rimX * -r * 0.95, -r * 0.2);
      ctx.lineTo(rimX * -r * 0.75, -r * 0.85);
      ctx.lineTo(rimX * -r * 0.58, -r * 0.75);
      ctx.lineTo(rimX * -r * 0.78, -r * 0.15);
      ctx.lineTo(rimX * -r * 0.55, r * 0.75);
      ctx.lineTo(rimX * -r * 0.65, r * 0.85);
      ctx.closePath();
      ctx.fill();
    }

    // Heavy Torso Breaching Plate
    ctx.fillStyle = isDead ? '#1e293b' : '#680e1c';
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
    ctx.fillStyle = isDead ? '#0f172a' : '#2b070d';
    ctx.fillRect(cannonX - r * 0.18, -r * 0.8, r * 0.36, r * 1.1);
    if (!isDead) {
      ctx.fillStyle = '#ff4d6d';
      ctx.fillRect(cannonX - r * 0.12, -r * 0.7, r * 0.24, r * 0.1);
      ctx.fillRect(cannonX - r * 0.12, -r * 0.5, r * 0.24, r * 0.1);
      ctx.fillRect(cannonX - r * 0.12, -r * 0.3, r * 0.24, r * 0.1);
    }

    // Pneumatic Crusher Clamp
    ctx.fillStyle = isDead ? '#334155' : '#7c1524';
    ctx.beginPath();
    ctx.moveTo(clampX - r * 0.15, -r * 0.6);
    ctx.lineTo(clampX + r * 0.15, -r * 0.6);
    ctx.lineTo(clampX + r * 0.22, r * 0.3);
    ctx.lineTo(clampX - r * 0.22, r * 0.3);
    ctx.closePath();
    ctx.fill();

    // Heavy Reactor Core
    ctx.fillStyle = '#1c0307';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
    ctx.fill();

    if (!isDead) {
      // Reactor Glow
      ctx.shadowColor = '#ff4d6d';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ff758f';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.20, 0, Math.PI * 2);
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
    ctx.fillStyle = isDead ? '#0f172a' : '#2b164c';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.85, 0);
    ctx.lineTo(0, r * 0.95);
    ctx.lineTo(-r * 0.85, 0);
    ctx.closePath();
    ctx.fill();

    // Port & Starboard Faceted Wing Plates
    ctx.fillStyle = isDead ? '#1e293b' : '#4a2480';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.85, 0);
    ctx.lineTo(r * 0.35, 0);
    ctx.lineTo(0, -r * 0.45);
    ctx.closePath();
    ctx.fill();

    // Specular Rim (directional)
    if (!isDead) {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.95);
      ctx.lineTo(rimX * -r * 0.85, 0);
      ctx.lineTo(rimX * -r * 0.60, 0);
      ctx.lineTo(0, -r * 0.70);
      ctx.closePath();
      ctx.fill();
    }

    // Dual Underslung Particle Carbine Needles
    ctx.fillStyle = isDead ? '#334155' : '#6b21a8';
    ctx.fillRect(-r * 0.72, -r * 0.35, r * 0.12, r * 0.7);
    ctx.fillRect(r * 0.60, -r * 0.35, r * 0.12, r * 0.7);

    // Central Gyroscopic Sensor Eye Aperture
    ctx.fillStyle = '#140624';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isDead ? '#1e293b' : '#581c87';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
    ctx.fill();

    if (!isDead) {
      // Holographic Cyan Pupil
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#67e8f9';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Plasma Jet Exhaust Flare
      ctx.fillStyle = '#a5b4fc';
      ctx.beginPath();
      ctx.moveTo(-r * 0.16, r * 0.9);
      ctx.lineTo(0, r * 0.95 + 10 + Math.random() * 6);
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
    ctx.fillStyle = isDead ? '#0f172a' : '#2b124a';
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
    ctx.fillStyle = isDead ? '#1e293b' : '#581c87';
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
    ctx.fillStyle = isDead ? '#334155' : '#7e22ce';
    ctx.fillRect(-r * 0.85, -r * 0.45, r * 0.18, r * 0.6);
    ctx.fillRect(r * 0.67, -r * 0.45, r * 0.18, r * 0.6);

    // Tri-Optic Targeting Lasers
    if (!isDead) {
      ctx.shadowColor = '#f472b6';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(-r * 0.12, -r * 0.55, 3.5, 0, Math.PI * 2);
      ctx.arc(r * 0.12, -r * 0.55, 3.5, 0, Math.PI * 2);
      ctx.arc(0, -r * 0.40, 3.5, 0, Math.PI * 2);
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
    ctx.fillStyle = isDead ? '#0f172a' : '#261742';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.98);
    ctx.lineTo(r * 0.38, -r * 0.2);
    ctx.lineTo(r * 0.48, r * 0.88);
    ctx.lineTo(-r * 0.48, r * 0.88);
    ctx.lineTo(-r * 0.38, -r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Faceted Crystal Bevels
    ctx.fillStyle = isDead ? '#1e293b' : '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.98);
    ctx.lineTo(r * 0.38, -r * 0.2);
    ctx.lineTo(0, r * 0.82);
    ctx.closePath();
    ctx.fill();

    // Null Singularity Cavity
    ctx.fillStyle = '#0f051c';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    ctx.fill();

    if (!isDead) {
      // Gyroscopic Outer Counter-Rotating Ring 1
      const angle1 = now * 0.002;
      ctx.save();
      ctx.rotate(angle1);
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.88, r * 0.36, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Gyroscopic Inner Counter-Rotating Ring 2
      const angle2 = -now * 0.0015;
      ctx.save();
      ctx.rotate(angle2);
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.62, r * 0.26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Pulsing Psionic Suppression Sphere
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
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
    // Under-armor bodysuit
    ctx.fillStyle = isDead ? '#0f172a' : '#223348';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.5, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armored Legs
    ctx.fillStyle = isDead ? '#1e293b' : '#3a4f6b';
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, r * 0.3);
    ctx.lineTo(-r * 0.15, r * 0.3);
    ctx.lineTo(-r * 0.2, r * 0.95);
    ctx.lineTo(-r * 0.45, r * 0.9);
    ctx.closePath();
    ctx.fill();
    // Right Leg
    ctx.beginPath();
    ctx.moveTo(r * 0.15, r * 0.3);
    ctx.lineTo(r * 0.4, r * 0.3);
    ctx.lineTo(r * 0.45, r * 0.9);
    ctx.lineTo(r * 0.2, r * 0.95);
    ctx.closePath();
    ctx.fill();

    // Heavy torso cuirass
    const cuirassGrad = ctx.createLinearGradient(-r * 0.5, -r * 0.4, r * 0.5, r * 0.4);
    cuirassGrad.addColorStop(0, isDead ? '#1e293b' : '#4a6994');
    cuirassGrad.addColorStop(1, isDead ? '#0f172a' : '#243c5a');
    ctx.fillStyle = cuirassGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.45);
    ctx.lineTo(r * 0.5, -r * 0.45);
    ctx.lineTo(r * 0.4, r * 0.35);
    ctx.lineTo(-r * 0.4, r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Specular Rim Light (directional)
    if (!isDead) {
      ctx.fillStyle = '#7ba4d6';
      ctx.beginPath();
      ctx.moveTo(rimX * -r * 0.5, -r * 0.45);
      ctx.lineTo(rimX * -r * 0.38, -r * 0.45);
      ctx.lineTo(rimX * -r * 0.3, r * 0.35);
      ctx.lineTo(rimX * -r * 0.4, r * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    // Pauldrons
    const pauldronGrad = ctx.createLinearGradient(-r * 0.8, -r * 0.6, -r * 0.4, -r * 0.1);
    pauldronGrad.addColorStop(0, isDead ? '#334155' : '#5b7ea8');
    pauldronGrad.addColorStop(1, isDead ? '#1e293b' : '#2b3e57');
    ctx.fillStyle = pauldronGrad;
    
    // Left Pauldron
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.55);
    ctx.lineTo(-r * 0.8, -r * 0.4);
    ctx.lineTo(-r * 0.7, r * 0.1);
    ctx.lineTo(-r * 0.4, -r * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Right Pauldron
    ctx.beginPath();
    ctx.moveTo(r * 0.4, -r * 0.55);
    ctx.lineTo(r * 0.8, -r * 0.4);
    ctx.lineTo(r * 0.7, r * 0.1);
    ctx.lineTo(r * 0.4, -r * 0.1);
    ctx.closePath();
    ctx.fill();

    // Jump-Jet Housings
    ctx.fillStyle = isDead ? '#0f172a' : '#243c5a';
    ctx.fillRect(-r * 0.9, -r * 0.5, r * 0.2, r * 0.4);
    ctx.fillRect(r * 0.7, -r * 0.5, r * 0.2, r * 0.4);

    if (!isDead && c.isBoosting) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-r * 0.85, -r * 0.65, r * 0.1, r * 0.2);
      ctx.fillRect(r * 0.75, -r * 0.65, r * 0.1, r * 0.2);
      ctx.shadowBlur = 0;
    }

    // Lateral sword blade
    ctx.fillStyle = isDead ? '#334155' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(r * 0.45, r * 0.1);
    ctx.lineTo(r * 0.85, r * 0.75);
    ctx.lineTo(r * 0.9, r * 0.7);
    ctx.lineTo(r * 0.5, r * 0.05);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      // Golden officer chevron
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.3);
      ctx.lineTo(r * 0.15, -r * 0.15);
      ctx.lineTo(0, 0);
      ctx.lineTo(-r * 0.15, -r * 0.15);
      ctx.closePath();
      ctx.fill();

      // Gorget
      ctx.fillStyle = '#d97706';
      ctx.fillRect(-r * 0.25, -r * 0.55, r * 0.5, r * 0.1);
    }

    // Helmet Dome
    const helmGrad = ctx.createLinearGradient(0, -r * 1.0, 0, -r * 0.5);
    helmGrad.addColorStop(0, isDead ? '#334155' : '#5b7ea8');
    helmGrad.addColorStop(1, isDead ? '#1e293b' : '#2b3e57');
    ctx.fillStyle = helmGrad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.95);
    ctx.lineTo(r * 0.3, -r * 0.8);
    ctx.lineTo(r * 0.25, -r * 0.45);
    ctx.lineTo(-r * 0.25, -r * 0.45);
    ctx.lineTo(-r * 0.3, -r * 0.8);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-r * 0.22, -r * 0.65, r * 0.44, 5);
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 7. LYRA CHEN (ESPER)
  // ----------------------------------------------------
  } else if (id.includes('lyra')) {
    // Under-robe form
    ctx.fillStyle = isDead ? '#0f172a' : '#331454';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.35, r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flowing outer robe
    ctx.fillStyle = isDead ? '#1e293b' : '#6b21a8';
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, -r * 0.4);
    ctx.lineTo(r * 0.4, -r * 0.4);
    ctx.lineTo(r * 0.25, r * 0.2); // waist
    ctx.lineTo(r * 0.55, r * 0.95); // hem
    ctx.lineTo(-r * 0.55, r * 0.95);
    ctx.lineTo(-r * 0.25, r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Inner robe detail
    ctx.fillStyle = isDead ? '#0f172a' : '#4c1d95';
    ctx.beginPath();
    ctx.moveTo(-r * 0.2, -r * 0.3);
    ctx.lineTo(r * 0.2, -r * 0.3);
    ctx.lineTo(r * 0.1, r * 0.2);
    ctx.lineTo(r * 0.25, r * 0.95);
    ctx.lineTo(-r * 0.25, r * 0.95);
    ctx.lineTo(-r * 0.1, r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Hem scalloped edge
    ctx.fillStyle = isDead ? '#334155' : '#331454';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, r * 0.95);
    ctx.lineTo(-r * 0.3, r * 0.85);
    ctx.lineTo(0, r * 0.95);
    ctx.lineTo(r * 0.3, r * 0.85);
    ctx.lineTo(r * 0.55, r * 0.95);
    ctx.lineTo(-r * 0.55, r * 0.95);
    ctx.closePath();
    ctx.fill();

    // Belt
    if (!isDead) {
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(-r * 0.3, r * 0.15, r * 0.6, r * 0.1);
    }

    // Hooded head
    ctx.fillStyle = isDead ? '#1e293b' : '#6b21a8';
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.0);
    ctx.lineTo(r * 0.3, -r * 0.4);
    ctx.lineTo(-r * 0.3, -r * 0.4);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      // Psionic eye slit
      const eyeColor = espBlocked ? '#ef4444' : '#c084fc';
      ctx.shadowColor = eyeColor;
      ctx.shadowBlur = 10;
      ctx.fillStyle = eyeColor;
      ctx.fillRect(-r * 0.15, -r * 0.65, r * 0.3, 4.5);
      ctx.shadowBlur = 0;
    }

    // Staff
    ctx.fillStyle = isDead ? '#1e293b' : '#64748b';
    ctx.fillRect(r * 0.6, -r * 1.1, r * 0.08, r * 1.6);
    
    if (!isDead) {
      // Glowing tip orb
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(r * 0.64, -r * 1.1, r * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Orbiting Psionic Wisps
      const ringColor = espBlocked ? '#ef4444' : '#c084fc';
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = ringColor;
      for (let i = 0; i < 4; i++) {
        const angle = now * 0.003 + (i * Math.PI * 2) / 4;
        const ox = Math.cos(angle) * (r * 0.88 + 4);
        const oy = Math.sin(angle) * (r * 0.88 + 4);
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
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
    // Under-armor bodysuit
    ctx.fillStyle = isDead ? '#0f172a' : '#223348';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.45, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.fillStyle = isDead ? '#1e293b' : '#475569';
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(-r * 0.35, r * 0.3);
    ctx.lineTo(-r * 0.15, r * 0.3);
    ctx.lineTo(-r * 0.15, r * 0.95);
    ctx.lineTo(-r * 0.35, r * 0.95);
    ctx.closePath();
    ctx.fill();
    // Right Leg
    ctx.beginPath();
    ctx.moveTo(r * 0.15, r * 0.3);
    ctx.lineTo(r * 0.35, r * 0.3);
    ctx.lineTo(r * 0.35, r * 0.95);
    ctx.lineTo(r * 0.15, r * 0.95);
    ctx.closePath();
    ctx.fill();

    // Tactical vest
    const vestGrad = ctx.createLinearGradient(-r * 0.45, -r * 0.4, r * 0.45, r * 0.4);
    vestGrad.addColorStop(0, isDead ? '#1e293b' : '#3d5673');
    vestGrad.addColorStop(1, isDead ? '#0f172a' : '#223348');
    ctx.fillStyle = vestGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.45);
    ctx.lineTo(r * 0.45, -r * 0.45);
    ctx.lineTo(r * 0.35, r * 0.35);
    ctx.lineTo(-r * 0.35, r * 0.35);
    ctx.closePath();
    ctx.fill();

    // Rim light
    if (!isDead) {
      ctx.fillStyle = '#7ba4d6';
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, -r * 0.45);
      ctx.lineTo(-r * 0.35, -r * 0.45);
      ctx.lineTo(-r * 0.28, r * 0.35);
      ctx.lineTo(-r * 0.35, r * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    // Armored shoulder (right)
    ctx.fillStyle = isDead ? '#334155' : '#5b7ea8';
    ctx.beginPath();
    ctx.moveTo(r * 0.35, -r * 0.5);
    ctx.lineTo(r * 0.65, -r * 0.4);
    ctx.lineTo(r * 0.6, 0);
    ctx.lineTo(r * 0.35, -r * 0.1);
    ctx.closePath();
    ctx.fill();

    // Helmet
    ctx.fillStyle = isDead ? '#1e293b' : '#334155';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9);
    ctx.lineTo(r * 0.25, -r * 0.75);
    ctx.lineTo(r * 0.22, -r * 0.45);
    ctx.lineTo(-r * 0.22, -r * 0.45);
    ctx.lineTo(-r * 0.25, -r * 0.75);
    ctx.closePath();
    ctx.fill();

    if (!isDead) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-r * 0.18, -r * 0.62, r * 0.36, 4.5);
      ctx.shadowBlur = 0;
    }

    // Ammo pouches at waist
    ctx.fillStyle = isDead ? '#0f172a' : '#64748b';
    ctx.fillRect(-r * 0.3, r * 0.25, r * 0.15, r * 0.15);
    ctx.fillRect(-r * 0.1, r * 0.25, r * 0.15, r * 0.15);
    ctx.fillRect(r * 0.1, r * 0.25, r * 0.15, r * 0.15);

    // Railgun barrel
    ctx.fillStyle = isDead ? '#1e293b' : '#64748b';
    ctx.fillRect(r * 0.4, -r * 1.2, r * 0.1, r * 1.5);
    
    // Muzzle brake
    ctx.fillStyle = isDead ? '#334155' : '#94a3b8';
    ctx.fillRect(r * 0.35, -r * 1.25, r * 0.2, r * 0.15);

    // Scope
    if (!isDead) {
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(r * 0.3, -r * 0.7, r * 0.15, r * 0.3);
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

  // ----------------------------------------------------
  // 9. TAREK 'SPROCKET' (BULWARK DEFENDER)
  // ----------------------------------------------------
  } else {
    // Under-plate bodysuit
    ctx.fillStyle = isDead ? '#0f172a' : '#134e35';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.2, r * 0.7, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Legs
    ctx.fillStyle = isDead ? '#1e293b' : '#1e6b49';
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, r * 0.4);
    ctx.lineTo(-r * 0.2, r * 0.4);
    ctx.lineTo(-r * 0.2, r * 1.0);
    ctx.lineTo(-r * 0.7, r * 1.0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(r * 0.2, r * 0.4);
    ctx.lineTo(r * 0.6, r * 0.4);
    ctx.lineTo(r * 0.7, r * 1.0);
    ctx.lineTo(r * 0.2, r * 1.0);
    ctx.closePath();
    ctx.fill();
    
    // Heavy Boots
    ctx.fillStyle = isDead ? '#0f172a' : '#065f46';
    ctx.fillRect(-r * 0.75, r * 0.9, r * 0.6, r * 0.15);
    ctx.fillRect(r * 0.15, r * 0.9, r * 0.6, r * 0.15);

    // Massive torso plate
    const tarekGrad = ctx.createLinearGradient(-r * 0.6, -r * 0.4, r * 0.6, r * 0.4);
    tarekGrad.addColorStop(0, isDead ? '#1e293b' : '#27855b');
    tarekGrad.addColorStop(1, isDead ? '#0f172a' : '#114a31');
    ctx.fillStyle = tarekGrad;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, -r * 0.5);
    ctx.lineTo(r * 0.6, -r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.4);
    ctx.lineTo(-r * 0.5, r * 0.4);
    ctx.closePath();
    ctx.fill();

    // DOUBLE rim lights
    if (!isDead) {
      ctx.fillStyle = '#6ee7b7';
      ctx.beginPath();
      ctx.moveTo(-r * 0.6, -r * 0.5);
      ctx.lineTo(-r * 0.45, -r * 0.5);
      ctx.lineTo(-r * 0.4, r * 0.4);
      ctx.lineTo(-r * 0.5, r * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(r * 0.6, -r * 0.5);
      ctx.lineTo(r * 0.45, -r * 0.5);
      ctx.lineTo(r * 0.4, r * 0.4);
      ctx.lineTo(r * 0.5, r * 0.4);
      ctx.closePath();
      ctx.fill();
    }

    // Thick shoulder pauldrons
    ctx.fillStyle = isDead ? '#334155' : '#047857';
    ctx.fillRect(-r * 0.85, -r * 0.6, r * 0.35, r * 0.5);
    ctx.fillRect(r * 0.5, -r * 0.6, r * 0.35, r * 0.5);

    // Scatter cannon (right arm)
    ctx.fillStyle = isDead ? '#1e293b' : '#475569';
    ctx.fillRect(r * 0.6, -r * 0.3, r * 0.25, r * 0.9);
    ctx.fillStyle = isDead ? '#0f172a' : '#1e293b';
    ctx.fillRect(r * 0.65, -r * 0.35, r * 0.15, r * 0.3);

    // Tower shield (left arm)
    ctx.fillStyle = isDead ? '#1e293b' : '#166534';
    ctx.fillRect(-r * 0.95, -r * 0.3, r * 0.4, r * 1.3);
    if (!isDead) {
      ctx.fillStyle = '#34d399';
      ctx.fillRect(-r * 0.85, -r * 0.2, r * 0.2, r * 1.1);
    }

    // Helmet
    ctx.fillStyle = isDead ? '#1e293b' : '#065f46';
    ctx.fillRect(-r * 0.25, -r * 0.9, r * 0.5, r * 0.4);
    
    if (!isDead) {
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#34d399';
      ctx.fillRect(-r * 0.2, -r * 0.75, r * 0.4, 4.5);
      ctx.shadowBlur = 0;
    }

    ctx.strokeStyle = isDead ? '#334155' : accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}
