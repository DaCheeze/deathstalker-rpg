/**
 * Pure deterministic Mulberry32 Pseudo-Random Number Generator (PRNG).
 * Zero DOM or browser dependencies. Fully portable and reproducible across platforms.
 */

export type RNG = () => number;

export interface RngStateV1 {
  algorithm: 'mulberry32';
  state: number;
}

export interface SerializableRng extends RNG {
  exportState(): RngStateV1;
}

/**
 * Creates a deterministic PRNG function returning pseudo-random floats in [0, 1).
 */
export function createRng(seed: number): SerializableRng {
  return restoreRng({ algorithm: 'mulberry32', state: seed >>> 0 });
}

/** Restores an exact PRNG cursor for deterministic save/resume and host recovery. */
export function restoreRng(snapshot: RngStateV1): SerializableRng {
  if (
    snapshot.algorithm !== 'mulberry32' ||
    !Number.isSafeInteger(snapshot.state) ||
    snapshot.state < 0 ||
    snapshot.state > 0xffffffff
  ) {
    throw new Error('Invalid Mulberry32 RNG state');
  }

  let s = snapshot.state >>> 0;
  const next = function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  } as SerializableRng;
  next.exportState = () => ({ algorithm: 'mulberry32', state: s >>> 0 });
  return next;
}
