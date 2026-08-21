/**
 * Visual effects and floating combat popups (Damage numbers, "BLOCKED", "CRIT", "STUNNED").
 * Screen shake, hit-stop frame freeze, particle beams, and shield shatter particles.
 * Canvas rendering layer only.
 */

import { FEEDBACK_CONFIG } from './feedbackConfig';

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  isCrit: boolean;
  life: number;
  maxLife: number;
}

export interface BeamEffect {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  width: number;
  life: number;
  maxLife: number;
}

export interface ParticleShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

let effectCounter = 0;
const activeTexts: FloatingText[] = [];
const activeBeams: BeamEffect[] = [];
const activeShards: ParticleShard[] = [];

// Screen shake state
let shakeRemainingMs = 0;
let shakeTotalDurationMs = 1;
let shakeMagnitude = 0;

// Full-screen flash state
let flashRemainingMs = 0;
let flashTotalDurationMs = 1;
let flashColor = 'rgba(255, 255, 255, 0.4)';

// Hit-stop state (frame freeze duration)
let hitStopUntilTime = 0;

export function triggerHitStop(ms: number, isSkipSpeed: boolean = false): void {
  if (isSkipSpeed) return;
  hitStopUntilTime = Math.max(hitStopUntilTime, performance.now() + ms);
}

export function isHitStopActive(): boolean {
  return performance.now() < hitStopUntilTime;
}

export function triggerScreenShake(magnitude: number, durationMs: number, isSkipSpeed: boolean = false): void {
  if (isSkipSpeed) return;
  shakeMagnitude = magnitude;
  shakeRemainingMs = durationMs;
  shakeTotalDurationMs = durationMs;
}

export function triggerScreenFlash(color: string = 'rgba(255, 255, 255, 0.45)', durationMs: number = 220, isSkipSpeed: boolean = false): void {
  if (isSkipSpeed) return;
  flashColor = color;
  flashRemainingMs = durationMs;
  flashTotalDurationMs = durationMs;
}

export function getScreenShakeOffset(deltaTimeMs: number): { x: number; y: number } {
  if (shakeRemainingMs <= 0) {
    return { x: 0, y: 0 };
  }
  shakeRemainingMs -= deltaTimeMs;
  const intensity = Math.max(0, shakeRemainingMs / shakeTotalDurationMs);
  const currentMag = shakeMagnitude * intensity;
  const offsetX = (Math.random() * 2 - 1) * currentMag;
  const offsetY = (Math.random() * 2 - 1) * currentMag;
  return { x: offsetX, y: offsetY };
}

export function addFloatingText(
  text: string,
  x: number,
  y: number,
  color: string = '#f87171',
  damageMagnitudePct: number = 0.2, // Damage as % of target max HP
  isCrit: boolean = false,
  staggerIndex: number = 0
): void {
  // Scale font size based on damage magnitude
  let fontSize = 14;
  if (damageMagnitudePct > 0.6) {
    fontSize = 26; // Massive hit / Disruptor
  } else if (damageMagnitudePct > 0.35 || isCrit) {
    fontSize = 20; // Heavy hit / Crit
  } else if (damageMagnitudePct > 0.15) {
    fontSize = 16;
  }

  // Stagger position if multiple numbers appear
  const staggerX = (staggerIndex % 3 - 1) * 18 + (Math.random() * 12 - 6);
  const staggerY = Math.floor(staggerIndex / 3) * 14;

  activeTexts.push({
    id: ++effectCounter,
    text,
    x: x + staggerX,
    y: y + staggerY,
    color,
    fontSize,
    isCrit,
    life: FEEDBACK_CONFIG.damageLifeTicks,
    maxLife: FEEDBACK_CONFIG.damageLifeTicks,
  });
}

export function addBeamEffect(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string = '#34d399',
  width: number = 6,
  durationTicks: number = 22
): void {
  activeBeams.push({
    id: ++effectCounter,
    fromX,
    fromY,
    toX,
    toY,
    color,
    width,
    life: durationTicks,
    maxLife: durationTicks,
  });
}

export function addShieldShatterParticles(x: number, y: number, color: string = '#38bdf8', count: number = 14): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    activeShards.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      color,
      alpha: 1,
      life: 25,
      maxLife: 25,
    });
  }
}

export function clearAllEffects(): void {
  activeTexts.length = 0;
  activeBeams.length = 0;
  activeShards.length = 0;
  shakeRemainingMs = 0;
  flashRemainingMs = 0;
  hitStopUntilTime = 0;
}

export function drawEffects(ctx: CanvasRenderingContext2D, deltaTimeMs: number = 16.6): void {
  // 1. Draw Full Screen Flash (e.g. Disruptor blast)
  if (flashRemainingMs > 0) {
    flashRemainingMs -= deltaTimeMs;
    const alpha = Math.max(0, flashRemainingMs / flashTotalDurationMs);
    ctx.save();
    ctx.fillStyle = flashColor;
    ctx.globalAlpha = alpha * 0.65;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
  }

  // 2. Draw Beams (Disruptor high-voltage arcs / Carbine traces)
  for (let i = activeBeams.length - 1; i >= 0; i--) {
    const beam = activeBeams[i];
    if (!beam) continue;

    beam.life--;
    const alpha = beam.life / beam.maxLife;

    ctx.save();
    // Outer glow
    ctx.strokeStyle = beam.color;
    ctx.lineWidth = Math.max(2, beam.width * alpha * 1.6);
    ctx.globalAlpha = alpha * 0.4;
    ctx.beginPath();
    ctx.moveTo(beam.fromX, beam.fromY);
    ctx.lineTo(beam.toX, beam.toY);
    ctx.stroke();

    // Core bright beam
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1, beam.width * 0.5 * alpha);
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(beam.fromX, beam.fromY);
    ctx.lineTo(beam.toX, beam.toY);
    ctx.stroke();
    ctx.restore();

    if (beam.life <= 0) {
      activeBeams.splice(i, 1);
    }
  }

  // 3. Draw Particle Shards (Shield Deflection / Shatter)
  for (let i = activeShards.length - 1; i >= 0; i--) {
    const shard = activeShards[i];
    if (!shard) continue;

    shard.life--;
    shard.x += shard.vx;
    shard.y += shard.vy;
    shard.vx *= 0.94;
    shard.vy *= 0.94;
    shard.alpha = shard.life / shard.maxLife;

    ctx.save();
    ctx.globalAlpha = shard.alpha;
    ctx.fillStyle = shard.color;
    ctx.beginPath();
    ctx.arc(shard.x, shard.y, shard.size * shard.alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (shard.life <= 0) {
      activeShards.splice(i, 1);
    }
  }

  // 4. Draw Floating Damage / Status Text
  for (let i = activeTexts.length - 1; i >= 0; i--) {
    const txt = activeTexts[i];
    if (!txt) continue;

    txt.life--;
    txt.y -= FEEDBACK_CONFIG.damageFloatSpeed;
    const progress = txt.life / txt.maxLife;
    const alpha = Math.min(1, progress * 1.5);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Scale pop on critical hits
    let scale = 1;
    if (txt.isCrit && txt.life > txt.maxLife - 10) {
      scale = 1.35;
    }

    ctx.translate(txt.x, txt.y);
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    ctx.font = `bold ${txt.fontSize}px monospace`;
    ctx.textAlign = 'center';

    // Dark stroke outline for readability
    ctx.strokeStyle = '#020617';
    ctx.lineWidth = 3;
    ctx.strokeText(txt.text, 0, 0);

    // Main text fill
    ctx.fillStyle = txt.color;
    ctx.fillText(txt.text, 0, 0);

    ctx.restore();

    if (txt.life <= 0) {
      activeTexts.splice(i, 1);
    }
  }
}
