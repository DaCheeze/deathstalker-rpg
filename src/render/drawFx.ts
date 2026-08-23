/**
 * Visual effects engine: Parallax Starfield, Battlefield Environment Tint,
 * Projectiles, Combatant Lunges, Disruptor 3-Beat Beams, Psionic Ripples,
 * Shield Shatters, Death Dissolution, Floating Popups, Screen Shake, and Hit-Stop.
 * Canvas 2D rendering layer only.
 */

import { FEEDBACK_CONFIG } from './feedbackConfig';
import { LAYOUT } from './theme';

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
  phase: 'charge' | 'beam' | 'impact';
  elapsedMs: number;
  totalDurationMs: number;
  chargeDurationMs: number;
  beamDurationMs: number;
  impactDurationMs: number;
  intensity: number;
}

export interface ProjectileEffect {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  elapsedMs: number;
  durationMs: number;
  isScatter: boolean;
}

export interface PsionicWaveEffect {
  id: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  radius: number;
  maxRadius: number;
  elapsedMs: number;
  durationMs: number;
}

export interface ParticleShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRot: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  isPoly?: boolean;
}

export interface LungeAnimState {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  elapsedMs: number;
  durationMs: number;
}

let effectCounter = 0;
const activeTexts: FloatingText[] = [];
const activeBeams: BeamEffect[] = [];
const activeProjectiles: ProjectileEffect[] = [];
const activePsionicWaves: PsionicWaveEffect[] = [];
const activeShards: ParticleShard[] = [];
const lungeMap = new Map<string, LungeAnimState>();

// Parallax starfield stars
interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  layer: number; // 0: distant, 1: mid, 2: foreground
  brightness: number;
}
const starfield: Star[] = [];

// Ambient particles (drifting dust/sparks)
interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}
const ambientParticles: AmbientParticle[] = [];

function initEnvironmentStars(): void {
  if (starfield.length > 0) return;
  const { canvasWidth, canvasHeight } = LAYOUT;

  // Layer 0: distant dim stars
  for (let i = 0; i < 70; i++) {
    starfield.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      speed: 0.08 + Math.random() * 0.05,
      size: 1,
      layer: 0,
      brightness: 0.2 + Math.random() * 0.4,
    });
  }
  // Layer 1: mid-distance stars
  for (let i = 0; i < 40; i++) {
    starfield.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      speed: 0.25 + Math.random() * 0.15,
      size: 1.5,
      layer: 1,
      brightness: 0.4 + Math.random() * 0.5,
    });
  }
  // Layer 2: near bright stars
  for (let i = 0; i < 20; i++) {
    starfield.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      speed: 0.55 + Math.random() * 0.3,
      size: 2.2,
      layer: 2,
      brightness: 0.7 + Math.random() * 0.3,
    });
  }

  // Ambient dust/sparks
  for (let i = 0; i < 30; i++) {
    ambientParticles.push({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.15 - Math.random() * 0.25,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.4,
      color: '#38bdf8',
    });
  }
}

// Screen shake state
let shakeRemainingMs = 0;
let shakeTotalDurationMs = 1;
let shakeMagnitude = 0;

// Full-screen flash state
let flashRemainingMs = 0;
let flashTotalDurationMs = 1;
let flashColor = 'rgba(255, 255, 255, 0.4)';

// Hit-stop state
let hitStopUntilTime = 0;

export function resetCombatEffects(): void {
  activeTexts.length = 0;
  activeBeams.length = 0;
  activeProjectiles.length = 0;
  activePsionicWaves.length = 0;
  activeShards.length = 0;
  lungeMap.clear();
  shakeRemainingMs = 0;
  shakeTotalDurationMs = 1;
  shakeMagnitude = 0;
  flashRemainingMs = 0;
  flashTotalDurationMs = 1;
  hitStopUntilTime = 0;
}

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

/**
 * Combatant lunge animation (attacks physically lunge toward target)
 */
export function triggerCombatantLunge(
  actorId: string,
  fromX: number,
  fromY: number,
  targetX: number,
  targetY: number,
  durationMs: number = 200
): number {
  const id = ++effectCounter;
  lungeMap.set(actorId, {
    id,
    startX: fromX,
    startY: fromY,
    targetX,
    targetY,
    elapsedMs: 0,
    durationMs,
  });
  return id;
}

export function getCombatantLungeOffset(actorId: string): { x: number; y: number } {
  const lunge = lungeMap.get(actorId);
  if (!lunge) return { x: 0, y: 0 };

  // 0 -> 0.5: lunge towards target; 0.5 -> 1.0: spring back
  const p = Math.min(1, lunge.elapsedMs / lunge.durationMs);
  const curve = Math.sin(p * Math.PI); // 0 -> 1 -> 0

  const dx = (lunge.targetX - lunge.startX) * 0.3 * curve;
  const dy = (lunge.targetY - lunge.startY) * 0.3 * curve;
  return { x: dx, y: dy };
}

/**
 * Traveling projectile (carbine / plasma bolts)
 */
export function addProjectile(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string = '#38bdf8',
  isScatter: boolean = false
): number {
  const id = ++effectCounter;
  activeProjectiles.push({
    id,
    fromX,
    fromY,
    toX,
    toY,
    color,
    elapsedMs: 0,
    durationMs: isScatter
      ? FEEDBACK_CONFIG.scatterProjectileTravelDurationMs
      : FEEDBACK_CONFIG.projectileTravelDurationMs,
    isScatter,
  });
  return id;
}

/**
 * Disruptor 3-Beat Sequence (Charge -> Blinding Beam -> Impact Blast)
 */
export function addDisruptorSequence(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string = '#34d399',
  profile: 'legacy' | 'prototype' = 'legacy'
): number {
  const isPrototype = profile === 'prototype';
  const chargeDurationMs = isPrototype
    ? FEEDBACK_CONFIG.prototypeDisruptorChargeDurationMs
    : FEEDBACK_CONFIG.disruptorChargeDurationMs;
  const beamDurationMs = isPrototype
    ? FEEDBACK_CONFIG.prototypeDisruptorBeamDurationMs
    : FEEDBACK_CONFIG.disruptorBeamDurationMs;
  const impactDurationMs = isPrototype
    ? FEEDBACK_CONFIG.prototypeDisruptorImpactDurationMs
    : FEEDBACK_CONFIG.disruptorImpactDurationMs;
  const totalDuration = chargeDurationMs + beamDurationMs + impactDurationMs;
  const id = ++effectCounter;
  activeBeams.push({
    id,
    fromX,
    fromY,
    toX,
    toY,
    color,
    width: isPrototype ? 7 : 12,
    phase: 'charge',
    elapsedMs: 0,
    totalDurationMs: totalDuration,
    chargeDurationMs,
    beamDurationMs,
    impactDurationMs,
    intensity: isPrototype ? 0.6 : 1,
  });
  return id;
}

/**
 * Psionic Shockwave Distortion Rings
 */
export function addPsionicWave(
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string = '#c084fc'
): number {
  const id = ++effectCounter;
  activePsionicWaves.push({
    id,
    fromX,
    fromY,
    toX,
    toY,
    color,
    radius: 8,
    maxRadius: 65,
    elapsedMs: 0,
    durationMs: FEEDBACK_CONFIG.psionicRippleDurationMs,
  });
  return id;
}

/** Advances contact-bearing effects with the compositor's canonical active delta. */
export function advanceCombatEffects(deltaTimeMs: number): void {
  if (!Number.isFinite(deltaTimeMs) || deltaTimeMs <= 0) return;

  for (const [actorId, lunge] of lungeMap) {
    lunge.elapsedMs += deltaTimeMs;
    if (lunge.elapsedMs >= lunge.durationMs) lungeMap.delete(actorId);
  }
  for (const beam of activeBeams) beam.elapsedMs += deltaTimeMs;
  for (const projectile of activeProjectiles) projectile.elapsedMs += deltaTimeMs;
  for (const wave of activePsionicWaves) wave.elapsedMs += deltaTimeMs;
}

/**
 * Death Dissolution: Combatant dissolves into scattering geometric polygonal shards
 */
export function addDeathDissolution(
  x: number,
  y: number,
  color: string = '#ef4444',
  unitScale: number = 1.0
): void {
  const count = Math.round(FEEDBACK_CONFIG.deathFragmentCount * unitScale);
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4.5;
    activeShards.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.0,
      size: 4 + Math.random() * 8,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.3,
      color,
      alpha: 1.0,
      life: FEEDBACK_CONFIG.deathFragmentLifeTicks,
      maxLife: FEEDBACK_CONFIG.deathFragmentLifeTicks,
      isPoly: true,
    });
  }
}

export function addShieldShatterParticles(x: number, y: number, color: string = '#38bdf8', count: number = 16): void {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    activeShards.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 5,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.4,
      color,
      alpha: 1.0,
      life: 24,
      maxLife: 24,
      isPoly: true,
    });
  }
}

export function addFloatingText(
  text: string,
  x: number,
  y: number,
  color: string = '#f87171',
  damageMagnitudePct: number = 0.2,
  isCrit: boolean = false,
  staggerIndex: number = 0
): void {
  let fontSize = 18;
  if (isCrit || damageMagnitudePct > 0.6) {
    fontSize = 34;
  } else if (damageMagnitudePct > 0.35) {
    fontSize = 26;
  } else if (damageMagnitudePct > 0.15 || text.includes('FAIL') || text.includes('CRASH')) {
    fontSize = 22;
  }

  const staggerX = (staggerIndex % 3 - 1) * 18 + (Math.random() * 10 - 5);
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

/**
 * Draws the complete Battlefield Environment (Parallax Starfield, Atmosphere Tint, Deck Horizon)
 */
export function drawBattlefieldEnvironment(
  ctx: CanvasRenderingContext2D,
  encounterId: string,
  width: number,
  height: number,
  deltaTimeMs: number
): void {
  initEnvironmentStars();

  // 1. Encounter-specific Atmosphere & Tint
  const isEmpire = encounterId.includes('empire');
  const isShub = encounterId.includes('shub');
  const isHaden = encounterId.includes('hadenman');

  const tintGradient = ctx.createLinearGradient(0, 0, 0, height);
  if (isEmpire) {
    tintGradient.addColorStop(0, '#120f0a');
    tintGradient.addColorStop(0.55, '#1a1408');
    tintGradient.addColorStop(1, '#090805');
  } else if (isShub) {
    tintGradient.addColorStop(0, '#060d17');
    tintGradient.addColorStop(0.55, '#0a1526');
    tintGradient.addColorStop(1, '#040810');
  } else if (isHaden) {
    tintGradient.addColorStop(0, '#140608');
    tintGradient.addColorStop(0.55, '#1f090d');
    tintGradient.addColorStop(1, '#0a0305');
  } else {
    tintGradient.addColorStop(0, '#0a0d14');
    tintGradient.addColorStop(0.55, '#0f1420');
    tintGradient.addColorStop(1, '#080a10');
  }
  ctx.fillStyle = tintGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Parallax Starfield (3 Layers)
  ctx.save();
  for (const star of starfield) {
    star.x -= star.speed * (deltaTimeMs / 16);
    if (star.x < 0) {
      star.x = width;
      star.y = Math.random() * height;
    }

    const alpha = star.layer === 0 ? 0.25 * star.brightness : star.layer === 1 ? 0.55 * star.brightness : 0.9 * star.brightness;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(star.x, star.y, star.size, star.size);
  }
  ctx.restore();

  // 3. Ground Plane / Deck Line (grounds the combatants in space)
  const deckY = LAYOUT.arenaY + LAYOUT.arenaHeight - 16;
  ctx.save();
  const deckGrad = ctx.createLinearGradient(0, deckY - 10, 0, deckY + 30);
  deckGrad.addColorStop(0, 'rgba(30, 41, 59, 0)');
  deckGrad.addColorStop(0.4, isEmpire ? 'rgba(245, 158, 11, 0.15)' : isShub ? 'rgba(56, 189, 248, 0.12)' : 'rgba(239, 68, 68, 0.15)');
  deckGrad.addColorStop(1, 'rgba(15, 23, 42, 0.4)');

  ctx.fillStyle = deckGrad;
  ctx.fillRect(LAYOUT.arenaX, deckY - 10, LAYOUT.arenaWidth, 40);

  ctx.strokeStyle = isEmpire ? '#78350f' : isShub ? '#0369a1' : '#7f1d1d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(LAYOUT.arenaX, deckY);
  ctx.lineTo(LAYOUT.arenaX + LAYOUT.arenaWidth, deckY);
  ctx.stroke();

  // Subtle tactical deck markers
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
  ctx.lineWidth = 1;
  for (let x = LAYOUT.arenaX; x < LAYOUT.arenaX + LAYOUT.arenaWidth; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, deckY);
    ctx.lineTo(x - 20, deckY + 24);
    ctx.stroke();
  }
  ctx.restore();

  // 4. Ambient Drifting Particles
  ctx.save();
  for (const p of ambientParticles) {
    p.x += p.vx * (deltaTimeMs / 16);
    p.y += p.vy * (deltaTimeMs / 16);
    if (p.y < 0) {
      p.y = height;
      p.x = Math.random() * width;
    }

    ctx.fillStyle = isEmpire ? `rgba(251, 191, 36, ${p.alpha * 0.6})` : isHaden ? `rgba(248, 113, 113, ${p.alpha * 0.6})` : `rgba(56, 189, 248, ${p.alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Main Effects Render Loop (Draws Beams, Projectiles, Shards, Shockwaves, Popups, and Flash)
 */
export function drawEffects(ctx: CanvasRenderingContext2D, deltaTimeMs: number): void {
  // 1. Draw Disruptor Beams & 3-Beat Sequence
  for (let i = activeBeams.length - 1; i >= 0; i--) {
    const b = activeBeams[i];
    if (!b) continue;

    const chargeEnd = b.chargeDurationMs;
    const beamEnd = chargeEnd + b.beamDurationMs;

    ctx.save();
    if (b.elapsedMs < chargeEnd) {
      // Beat 1: Charging vortex glow on caster
      const chargePct = b.elapsedMs / chargeEnd;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(b.fromX, b.fromY, (1 - chargePct) * 32 + 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.fromX, b.fromY, chargePct * 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.elapsedMs < beamEnd) {
      // Beat 2: Blinding beam blast
      const beamProgress = (b.elapsedMs - chargeEnd) / b.beamDurationMs;
      const alpha = 1 - beamProgress * 0.3;

      // Outer aura
      ctx.strokeStyle = `rgba(52, 211, 153, ${alpha * 0.4 * b.intensity})`;
      ctx.lineWidth = b.width * 2.5;
      ctx.beginPath();
      ctx.moveTo(b.fromX, b.fromY);
      ctx.lineTo(b.toX, b.toY);
      ctx.stroke();

      // Core intense beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = b.width * 0.8;
      ctx.beginPath();
      ctx.moveTo(b.fromX, b.fromY);
      ctx.lineTo(b.toX, b.toY);
      ctx.stroke();
    } else {
      // Beat 3: Impact blast
      const impactProgress = (b.elapsedMs - beamEnd) / b.impactDurationMs;
      const alpha = 1 - impactProgress;
      ctx.fillStyle = `rgba(52, 211, 153, ${alpha * 0.8 * b.intensity})`;
      ctx.beginPath();
      ctx.arc(b.toX, b.toY, impactProgress * 38 * b.intensity, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (b.elapsedMs >= b.totalDurationMs) {
      activeBeams.splice(i, 1);
    }
  }

  // 2. Draw Traveling Projectiles
  for (let i = activeProjectiles.length - 1; i >= 0; i--) {
    const p = activeProjectiles[i];
    if (!p) continue;
    const progress = Math.min(1, p.elapsedMs / p.durationMs);
    const currX = p.fromX + (p.toX - p.fromX) * progress;
    const currY = p.fromY + (p.toY - p.fromY) * progress;
    const tailProgress = Math.max(0, progress - 0.15);
    const tailX = p.fromX + (p.toX - p.fromX) * tailProgress;
    const tailY = p.fromY + (p.toY - p.fromY) * tailProgress;

    ctx.save();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.isScatter ? 2.5 : 3.5;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(currX, currY);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(currX, currY, p.isScatter ? 2.5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (progress >= 1) {
      activeProjectiles.splice(i, 1);
    }
  }

  // 3. Draw Psionic Shockwaves
  for (let i = activePsionicWaves.length - 1; i >= 0; i--) {
    const w = activePsionicWaves[i];
    if (!w) continue;
    const progress = Math.min(1, w.elapsedMs / w.durationMs);
    const currentRadius = w.radius + (w.maxRadius - w.radius) * progress;
    const currentX = w.fromX + (w.toX - w.fromX) * progress;
    const currentY = w.fromY + (w.toY - w.fromY) * progress;
    const alpha = (1 - progress) * 0.8;

    ctx.save();
    ctx.strokeStyle = `rgba(192, 132, 252, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (progress >= 1) {
      activePsionicWaves.splice(i, 1);
    }
  }

  // 4. Draw Particle Shards & Dissolution Fragments
  for (let i = activeShards.length - 1; i >= 0; i--) {
    const s = activeShards[i];
    if (!s) continue;
    const frameScale = deltaTimeMs / (1000 / 60);
    s.x += s.vx * frameScale;
    s.y += s.vy * frameScale;
    s.rotation += s.vRot * frameScale;
    s.life -= frameScale;
    s.alpha = Math.max(0, s.life / s.maxLife);

    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = s.alpha;

    if (s.isPoly) {
      // Polygonal shard
      ctx.beginPath();
      ctx.moveTo(-s.size / 2, -s.size / 2);
      ctx.lineTo(s.size / 2, -s.size / 4);
      ctx.lineTo(0, s.size / 2);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
    }
    ctx.restore();

    if (s.life <= 0) {
      activeShards.splice(i, 1);
    }
  }

  // 5. Draw Floating Text Popups
  for (let i = activeTexts.length - 1; i >= 0; i--) {
    const t = activeTexts[i];
    if (!t) continue;
    const frameScale = deltaTimeMs / (1000 / 60);
    t.life -= frameScale;
    t.y -= FEEDBACK_CONFIG.damageFloatSpeed * frameScale;
    const alpha = Math.min(1, (t.life / t.maxLife) * 1.5);

    ctx.save();
    ctx.font = t.isCrit ? `bold ${t.fontSize + 2}px monospace` : `bold ${t.fontSize}px monospace`;
    ctx.textAlign = 'center';

    // Text Outline / Glow
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.globalAlpha = alpha;
    ctx.strokeText(t.text, t.x, t.y);

    ctx.fillStyle = t.color;
    ctx.fillText(t.text, t.x, t.y);
    ctx.restore();

    if (t.life <= 0) {
      activeTexts.splice(i, 1);
    }
  }

  // 6. Full-screen Flash
  if (flashRemainingMs > 0) {
    flashRemainingMs -= deltaTimeMs;
    const flashAlpha = Math.max(0, flashRemainingMs / flashTotalDurationMs);
    ctx.save();
    ctx.globalAlpha = flashAlpha;
    ctx.fillStyle = flashColor;
    ctx.fillRect(0, 0, LAYOUT.canvasWidth, LAYOUT.canvasHeight);
    ctx.restore();
  }
}
