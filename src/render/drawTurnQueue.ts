/**
 * Octopath-Style Minimalist Floating Turn Queue.
 * Positioned in the top-left corner without card frames or opaque background boxes.
 * Features a glowing diamond chain, active actor emphasis, connecting axis line,
 * and distinct faction/instance accent pips.
 */

import { BattleState, Combatant } from '../core/types';
import { displaceActorInQueue } from '../core/turnQueue';
import type { UIState } from './drawUI';
import { LAYOUT, THEME } from './theme';

interface QueueAnimState {
  currentX: number;
  flashUntil: number;
}

const queueAnimMap = new Map<string, QueueAnimState>();

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fillColor: string,
  strokeColor: string,
  lineWidth: number = 1.5
): void {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx + radius, cy);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius, cy);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

export function drawTurnQueue(
  ctx: CanvasRenderingContext2D,
  state: BattleState,
  uiState?: UIState
): void {
  const { queueX, queueY } = LAYOUT;
  let projectedQueue = state.turnQueue;
  let isChoicePreview = false;
  if (
    state.battleMode === 'range_band_prototype' &&
    uiState?.menuMode === 'attack_select' &&
    uiState.hoveredIndex >= 0
  ) {
    const actor = state.combatants[state.activeActorId];
    const meleeAbilities = actor?.abilityIds
      .map((id) => state.abilities[id])
      .filter((ability) => ability?.category === 'melee');
    const hoveredAbility = meleeAbilities?.[uiState.hoveredIndex];
    if (actor?.engagedTargetId && hoveredAbility?.displaceTicks) {
      projectedQueue = displaceActorInQueue(
        state.turnQueue,
        actor.engagedTargetId,
        hoveredAbility.displaceTicks,
        state.combatants,
        [...state.partyIds, ...state.enemyIds]
      );
      isChoicePreview = true;
    }
  }

  const entries = projectedQueue.entries.slice(0, 8);
  if (entries.length === 0) return;

  const now = performance.now();

  // Track displacement events for visual pulse
  for (const ev of state.recentEvents) {
    if (ev.type === 'TURN_DISPLACED') {
      const anim = queueAnimMap.get(ev.targetId) || { currentX: 0, flashUntil: 0 };
      anim.flashUntil = Math.max(anim.flashUntil, now + 700);
      queueAnimMap.set(ev.targetId, anim);
    }
  }

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 4;

  const activeCx = queueX + 24;
  const activeCy = queueY + 24;
  const chainStartY = activeCy;

  if (isChoicePreview) {
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'left';
    ctx.fillText('QUEUE PREVIEW', queueX, queueY + 58);
  }

  // 1. Thin connecting line leading to upcoming turns
  const endX = queueX + 50 + (entries.length - 1) * 50 + 15;
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(activeCx + 26, chainStartY);
  ctx.lineTo(endX, chainStartY);
  ctx.stroke();

  // Small "NEXT TURN" label above the upcoming segment (well above diamonds)
  if (entries.length > 3) {
    const nextTurnX = queueX + 50 + 2.5 * 50;
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', nextTurnX, chainStartY - 24);
  }

  // 2. Render each diamond entry along the chain
  entries.forEach((entry, idx) => {
    const combatant = state.combatants[entry.actorId] as Combatant | undefined;
    if (!combatant) return;

    const isCurrent = idx === 0 && combatant.id === state.activeActorId;
    const isParty = combatant.faction === 'party';
    const accentColor = combatant.accentColor || (isParty ? THEME.partyPrimary : THEME.empirePrimary);

    let targetX = queueX + 24;
    let radius = 22;

    if (!isCurrent) {
      targetX = queueX + 54 + idx * 46;
      radius = 16;
    }

    // Animation smoothing
    let anim = queueAnimMap.get(entry.queueId);
    if (!anim) {
      anim = { currentX: targetX, flashUntil: 0 };
      queueAnimMap.set(entry.queueId, anim);
    }
    anim.currentX += (targetX - anim.currentX) * 0.35;
    if (Math.abs(anim.currentX - targetX) < 0.5) {
      anim.currentX = targetX;
    }
    const cx = anim.currentX;
    const cy = chainStartY;
    const isFlashing = anim.flashUntil > now;

    // Diamond styling
    const fillColor = isFlashing
      ? '#7e22ce'
      : isCurrent
      ? isParty ? 'rgba(12, 74, 110, 0.92)' : 'rgba(69, 10, 10, 0.92)'
      : 'rgba(15, 23, 42, 0.88)';

    const strokeColor = isFlashing
      ? '#fbbf24'
      : isCurrent
      ? accentColor
      : isParty
      ? 'rgba(56, 189, 248, 0.6)'
      : 'rgba(244, 63, 94, 0.6)';

    // Active outer diamond glow ring
    if (isCurrent) {
      drawDiamond(ctx, cx, cy, radius + 6, 'transparent', 'rgba(56, 189, 248, 0.35)', 1);
    }

    drawDiamond(ctx, cx, cy, radius, fillColor, strokeColor, isCurrent ? 2 : 1.2);

    // Initial / Instance Glyph
    let glyph = combatant.name.charAt(0).toUpperCase();
    if (state.battleMode === 'range_band_prototype') {
      glyph = isParty
        ? combatant.role === 'Power Melee'
          ? 'P'
          : combatant.role === 'Critical Melee'
          ? 'C'
          : 'Q'
        : combatant.name.match(/([A-Z])$/)?.[1] ?? glyph;
    }
    if (!isParty) {
      const match = combatant.displayName?.match(/\b([A-D])\b/);
      if (match && match[1]) {
        glyph = match[1];
      }
    }

    ctx.font = isCurrent ? 'bold 16px monospace' : 'bold 13px monospace';
    ctx.fillStyle = isCurrent ? '#ffffff' : accentColor;
    ctx.textAlign = 'center';
    ctx.fillText(glyph, cx, cy + (isCurrent ? 5 : 4));

    // Disruptor state gem. Prototype charges are permanently ready/spent.
    const prototypeReady = state.battleMode === 'range_band_prototype'
      ? combatant.disruptorReady === true
      : combatant.disruptorCooldown === 0;
    if (state.battleMode === 'range_band_prototype' || prototypeReady) {
      ctx.fillStyle = prototypeReady ? '#34d399' : '#475569';
      ctx.beginPath();
      ctx.arc(cx, cy + radius + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (state.battleMode === 'range_band_prototype') {
      const bandLabel = combatant.rangeBand === 'engaged'
        ? 'E'
        : combatant.rangeBand === 'closing'
        ? 'C'
        : 'R';
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(bandLabel, cx, cy - radius - 5);
    }
  });

  ctx.restore();
}
