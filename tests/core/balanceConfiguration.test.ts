import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadBalanceConfiguration } from '../../src/sim/balanceCheck';

describe('balance input provenance', () => {
  const tempDirectories: string[] = [];

  afterEach(() => {
    for (const directory of tempDirectories.splice(0)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  function makeDirectory(): string {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'rpg-balance-inputs-'));
    tempDirectories.push(directory);
    fs.writeFileSync(path.join(directory, 'balance-targets.json'), '{}', 'utf-8');
    return directory;
  }

  it('reports whether an explicit override file is active', () => {
    const directory = makeDirectory();
    fs.writeFileSync(
      path.join(directory, 'balance-overrides.json'),
      JSON.stringify({ rules: { inventory: { medkits: 2 } } }),
      'utf-8'
    );

    const configuration = loadBalanceConfiguration(directory);
    expect(configuration.provenance.targetsPath).toBe(path.join(directory, 'balance-targets.json'));
    expect(configuration.provenance.overridesActive).toBe(true);
    expect(configuration.provenance.overridesPath).toBe(path.join(directory, 'balance-overrides.json'));
    expect(configuration.overrides.rules?.inventory?.medkits).toBe(2);
  });

  it('fails loudly when an active override file contains invalid JSON', () => {
    const directory = makeDirectory();
    fs.writeFileSync(path.join(directory, 'balance-overrides.json'), '{invalid', 'utf-8');

    expect(() => loadBalanceConfiguration(directory)).toThrow(
      `Unable to parse balance overrides at ${path.join(directory, 'balance-overrides.json')}`
    );
  });
});
