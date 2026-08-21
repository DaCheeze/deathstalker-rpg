/**
 * Renders the visible top turn queue (~8 upcoming turns).
 * Clean receding strip with distinct instance suffixes, accent color pips,
 * animated displacement sliding, and disruptor indicators shown ONLY when charged or 1 turn from charge.
 */

import { BattleState, Combatant } from '../core/types';
import { LAYOUT, THEME } from './theme';

interface QueueAnimState {
  currentX: number;
  flashUntil: number;
}

const queueAnimMap = new Map<string, QueueAnimState>();

export function drawTurnQueue(ctx: CanvasRenderingContext2D, state: BattleState): void {
  const { queueY, queueHeight, canvasWidth } = LAYOUT;
  const startX = 20;
  const totalWidth = canvasWidth - 40;

  // Background container (subtle, receding)
  ctx.fillStyle = '#0b111e';
  ctx.fillRect(startX, queueY, totalWidth, queueHeight);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, queueY, totalWidth, queueHeight);

  // Queue Label
  ctx.fillStyle = THEME.textMuted;
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('TURN QUEUE ▶', startX + 8, queueY + queueHeight / 2 + 3);

  // Check recent displacement events to trigger animation flash
  const now = performance.now();
  for (const ev of state.recentEvents) {
    if (ev.type === 'TURN_DISPLACED') {
      const anim = queueAnimMap.get(ev.targetId) || { currentX: 0, flashUntil: 0 };
      anim.flashUntil = Math.max(anim.flashUntil, now + 700);
      queueAnimMap.set(ev.targetId, anim);
    }
  }

  // Upcoming turn entries (up to 8 slots)
  const entries = state.turnQueue.entries.slice(0, 8);
  if (entries.length === 0) return;

  const labelWidth = 90;
  const slotWidth = (totalWidth - labelWidth - 10) / entries.length;
  const itemStartX = startX + labelWidth;

  entries.forEach((entry, idx) => {
    const targetX = itemStartX + idx * slotWidth;
    const y = queueY + 4;
    const w = slotWidth - 4;
    const h = queueHeight - 8;

    const combatant = state.combatants[entry.actorId] as Combatant | undefined;
    if (!combatant) return;

    // Smooth sliding animation for queue displacement
    let anim = queueAnimMap.get(entry.queueId);
    if (!anim) {
      anim = { currentX: targetX, flashUntil: 0 };
      queueAnimMap.set(entry.queueId, anim);
    }
    anim.currentX += (targetX - anim.currentX) * 0.35;
    if (Math.abs(anim.currentX - targetX) < 0.5) {
      anim.currentX = targetX;
    }
    const x = anim.currentX;

    const isCurrent = idx === 0 && combatant.id === state.activeActorId;
    const isNext = idx === 1;
    const isParty = combatant.faction === 'party';
    const isFlashing = anim.flashUntil > now;
    const accentColor = combatant.accentColor || (isParty ? THEME.partyPrimary : THEME.empirePrimary);

    // Card background
    if (isFlashing) {
      ctx.fillStyle = '#581c87'; // Purple flash on displacement
    } else if (isCurrent) {
      ctx.fillStyle = isParty ? '#0c4a6e' : '#450a0a';
    } else {
      ctx.fillStyle = '#0f172a';
    }
    ctx.fillRect(x, y, w, h);

    // Accent strip on top
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, w, 2);

    // Card Border
    ctx.strokeStyle = isFlashing
      ? '#fbbf24'
      : isCurrent
      ? '#38bdf8'
      : isNext
      ? '#0284c7'
      : '#1e293b';
    ctx.lineWidth = isCurrent ? 2 : 1;
    ctx.strokeRect(x, y, w, h);

    // Actor Name
    const displayName = combatant.displayName || combatant.name;
    const cleanName = displayName.replace(/^Captain\s+/i, 'Cpt. ');
    ctx.font = isCurrent ? 'bold 9px monospace' : '8px monospace';
    ctx.fillStyle = isCurrent ? '#ffffff' : isParty ? '#bae6fd' : '#fca5a5';
    ctx.textAlign = 'left';
    ctx.fillText(cleanName, x + 4, y + 14, w - 8);

    // Bottom Row: Turn Order Pip + Disruptor Indicator ONLY if CD <= 1
    const pipY = y + h - 6;

    // Faction Pip
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + 6, pipY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Turn Position
    ctx.font = '7px monospace';
    ctx.fillStyle = THEME.textMuted;
    ctx.fillText(`#${idx + 1}`, x + 12, pipY + 2.5);

    // Disruptor Indicator (Shown ONLY when ready CD:0 or within 1 turn CD:1)
    if (combatant.disruptorCooldown === 0) {
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('⚡RDY', x + w - 3, pipY + 2.5);
    } else if (combatant.disruptorCooldown === 1) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('⚡1', x + w - 3, pipY + 2.5);
    }
  });
}
