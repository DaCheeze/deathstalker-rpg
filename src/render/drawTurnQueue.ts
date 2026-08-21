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
  const startX = 30;
  const totalWidth = canvasWidth - 60;

  // Background container
  ctx.fillStyle = THEME.panelBg;
  ctx.fillRect(startX, queueY, totalWidth, queueHeight);
  ctx.strokeStyle = THEME.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(startX, queueY, totalWidth, queueHeight);

  // Label
  ctx.fillStyle = THEME.textMuted;
  ctx.font = THEME.fontSmall;
  ctx.fillText('TURN QUEUE', startX + 10, queueY + 16);

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

  const slotWidth = (totalWidth - 110) / entries.length;
  const itemStartX = startX + 90;

  entries.forEach((entry, idx) => {
    const targetX = itemStartX + idx * slotWidth;
    const y = queueY + 8;
    const w = slotWidth - 6;
    const h = queueHeight - 16;

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
    ctx.fillRect(x, y, w, 3);

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

    // Active / Next indicator tag
    if (isCurrent) {
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(x, y + 3, 14, h - 3);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('▶', x + 2, y + h / 2 + 3);
    }

    // Name & Suffix (e.g., "Drone A", "Valen")
    const displayName = combatant.displayName || combatant.name;
    const shortName = displayName.replace('Imperial ', 'Imp ').replace('Shub ', '');
    ctx.fillStyle = isCurrent ? THEME.textHighlight : THEME.textMain;
    ctx.font = isCurrent ? 'bold 10px monospace' : '9px monospace';
    const textX = isCurrent ? x + 18 : x + 5;
    ctx.fillText(shortName, textX, y + 15, w - (isCurrent ? 20 : 7));

    // Status: Crash or Disruptor State Indicator
    ctx.font = 'bold 8px monospace';
    if (combatant.crashTurns > 0) {
      ctx.fillStyle = '#c084fc';
      ctx.fillText(`CRASH [${combatant.crashTurns}]`, textX, y + 26);
    } else {
      const isDisruptorReady = combatant.disruptorCooldown === 0;
      if (isDisruptorReady) {
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('⚡RDY', textX, y + 26);
      } else {
        ctx.fillStyle = THEME.textMuted;
        ctx.fillText(`⚡CD:${combatant.disruptorCooldown}`, textX, y + 26);
      }
    }

    // Next badge
    if (isNext) {
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('NEXT', x + w - 24, y + 11);
    }

    // Accent Color Dot Pip
    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(x + w - 6, y + h - 6, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}
