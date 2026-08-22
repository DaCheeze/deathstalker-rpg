import { describe, it, expect } from 'vitest';
import { LAYER_ORDER, LayerId } from '../../src/render/compositor';
import { AssetManager, AssetManifest } from '../../src/render/assetManifest';

describe('HD-2D Layer Compositor Order & Invariants', () => {
  const EXPECTED_LAYER_SEQUENCE: readonly LayerId[] = [
    'starfield_void',
    'far_backdrop',
    'stage_floor',
    'enemy_units',
    'party_units',
    'emissive_pass',
    'foreground_occluders',
    'post_processing',
    'ui_and_menus',
  ];

  it('must contain exactly the 9 specified layers in explicit order', () => {
    expect(LAYER_ORDER).toHaveLength(9);
    expect(LAYER_ORDER).toEqual(EXPECTED_LAYER_SEQUENCE);
  });

  it('must place UI & Menus at the very top (never post-processed)', () => {
    expect(LAYER_ORDER[LAYER_ORDER.length - 1]).toBe('ui_and_menus');
  });

  it('must place Emissive Pass before post_processing to feed bloom', () => {
    const emissiveIdx = LAYER_ORDER.indexOf('emissive_pass');
    const postIdx = LAYER_ORDER.indexOf('post_processing');
    expect(emissiveIdx).toBeGreaterThan(-1);
    expect(postIdx).toBeGreaterThan(-1);
    expect(emissiveIdx).toBeLessThan(postIdx);
  });

  it('must place Foreground Occluders between units and post-processing for diorama depth', () => {
    const unitsIdx = LAYER_ORDER.indexOf('party_units');
    const occIdx = LAYER_ORDER.indexOf('foreground_occluders');
    const postIdx = LAYER_ORDER.indexOf('post_processing');
    expect(occIdx).toBeGreaterThan(unitsIdx);
    expect(occIdx).toBeLessThan(postIdx);
  });

  it('must have unique layer IDs with zero duplicate layers', () => {
    const set = new Set(LAYER_ORDER);
    expect(set.size).toBe(LAYER_ORDER.length);
  });

  it('AssetManager falls back cleanly when manifest paths are null', async () => {
    const nullManifest: AssetManifest = {
      backgrounds: { enc_test: null },
      overlays: {},
    };
    await expect(AssetManager.validateManifest(nullManifest)).resolves.not.toThrow();
  });
});
