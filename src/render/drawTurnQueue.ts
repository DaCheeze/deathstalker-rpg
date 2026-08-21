/**
 * Renders the visible top turn queue (~8 upcoming turns).
 * Enhanced with distinct instance suffixes, accent colors, animated displacement sliding,
 * flash feedback on queue delay, and visible disruptor charge indicators.
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

  // Background container
  ctx.fillStyle = THEME.panelBg;
  ctx.fillRect(startX, queueY, totalWidth, queueHeight);
  ctx.strokeStyle = THEME.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, queueY, totalWidth, queueHeight);

  // Label
  ctx.fillStyle = THEME.textMuted;
  ctx.font = 'bold 9px monospace';
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
    const y = queueY + 5;
    const w = slotWidth - 5;
    const h = queueHeight - 10;

    const combatant = state.combatants[entry.actorId] as Combatant | undefined;
    if (!combatant) return;

    // Smooth sliding animation for queue displacement
    let anim = queueAnimMap.get(entry.queueId);
    if (!anim) {
      anim = { currentX: targetX, flashUntil: 0 };
      queueAnimMap.set(entry.queueId, anim);
    }
    // Interpolate towards target position (smooth slide lerp)
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
      ctx.fillStyle = '#6d28d9'; // Vibrant purple flash on displacement
    } else if (isCurrent) {
      ctx.fillStyle = isParty ? '#1e3a8a' : '#7f1d1d';
    } else {
      ctx.fillStyle = isParty ? '#0f2942' : '#2b1b1b';
    }
    ctx.fillRect(x, y, w, h);

    // Accent strip on top border of card
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, w, 2);

    // Card Border
    ctx.strokeStyle = isFlashing
      ? '#facc15'
      : isCurrent
      ? '#60a5fa'
      : isNext
      ? '#38bdf8'
      : accentColor;
    ctx.lineWidth = isCurrent || isFlashing ? 2 : 1;
    ctx.strokeRect(x, y, w, h);

    // Active indicator tag
    if (isCurrent) {
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(x, y + 2, 12, h - 2);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('▶', x + 2, y + h / 2 + 3);
    }

    // Name & Suffix (e.g., "Drone A", "Valen")
    const displayName = combatant.displayName || combatant.name;
    const shortName = displayName.replace('Imperial ', 'Imp ').replace('Shub ', '');
    ctx.fillStyle = isCurrent ? THEME.textHighlight : THEME.textMain;
    ctx.font = isCurrent ? 'bold 10px monospace' : '9px monospace';
    const textX = isCurrent ? x + 15 : x + 5;
    ctx.fillText(shortName, textX, y + 14, w - (isCurrent ? 18 : 6));

    // Status: Crash or Disruptor State Indicator (noise filtered)
    ctx.font = 'bold 8px monospace';
    if (combatant.crashTurns > 0) {
      ctx.fillStyle = '#c084fc';
      ctx.fillText(`CRASH [${combatant.crashTurns}]`, textX, y + 26);
    } else if (combatant.disruptorCooldown === 0) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('⚡RDY', textX, y + 26);
    } else if (combatant.disruptorCooldown === 1) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('⚡1', textX, y + 26);
    }
    // Note: When disruptorCooldown > 1, no text is rendered to keep the queue clean!

    // Next badge
    if (isNext) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 7px monospace';
      ctx.fillText('NEXT', x + w - 22, y + 10);
    }

    // Accent Color Dot Pip
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + w - 5, y + h - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}
