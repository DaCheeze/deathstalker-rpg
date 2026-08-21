/**
 * CLI runner for the Headless Combat Simulator (`npm run sim`).
 * Supports forced policy flags: --no-disruptor, --no-boost, --no-esper, and --seed <number>.
 * Supports recording flags: --record and --record-samples.
 * Runs 1000 battles per mode with pure seeded PRNG and outputs detailed comparative telemetry.
 */

import * as fs from 'fs';
import * as path from 'path';
import { runSimulation, SimulationResult, BattleReplay } from './simulator';
import {
  validateAbilities,
  validateCombatants,
  validateEncounters,
} from '../core/validator';
import { PartyAIPolicy } from '../core/ai';

import abilitiesJson from '../data/abilities.json';
import partyJson from '../data/party.json';
import enemiesJson from '../data/enemies.json';
import encountersJson from '../data/encounters.json';

function printEncounterDetails(results: SimulationResult) {
  console.log('\n--- ENCOUNTER BREAKDOWN (BASELINE) ---');
  for (const [id, enc] of Object.entries(results.encounterBreakdowns)) {
    console.log(`[${id}] ${enc.encounterName} (${enc.tier.toUpperCase()})`);
    console.log(`  Battles: ${enc.battles} | Win Rate: ${enc.winRate.toFixed(1)}%`);
    console.log(`  Actions (Min/Avg/Max): ${enc.minActions} / ${enc.avgActions.toFixed(1)} / ${enc.maxActions}`);
    console.log(`  Rounds  (Min/Avg/Max): ${enc.minRounds} / ${enc.avgRounds.toFixed(1)} / ${enc.maxRounds} (1 round = all living units act once)`);

    // Per-Crew Damage Contribution
    const totalCrewDmg = Object.values(enc.crewDamageDealt).reduce((a, b) => a + b, 0);
    const sortedCrew = Object.entries(enc.crewDamageDealt).sort((a, b) => b[1] - a[1]);
    const crewDmgStr = sortedCrew
      .map(([name, dmg], i) => `#${i + 1} ${name}: ${dmg} (${((dmg / (totalCrewDmg || 1)) * 100).toFixed(1)}%)`)
      .join(' | ');
    console.log(`  Crew Damage Ranking: ${crewDmgStr || 'N/A'}`);

    // Scatter Shot Telemetry
    if (enc.scatterShotStats.casts > 0) {
      console.log(`  Scatter Shot: ${enc.scatterShotStats.casts} casts, ${enc.scatterShotStats.damage} dmg, ${enc.scatterShotStats.totalTargetsHit} hits (Avg ${enc.scatterShotStats.avgTargetsHit} targets/cast)`);
    }

    // Psi-Blocker Telemetry
    if (enc.psiBlockerKills.directKills > 0 || enc.psiBlockerKills.splashKills > 0) {
      console.log(`  Psi-Blocker Fatalities: Direct Target Kills: ${enc.psiBlockerKills.directKills}, Splash Kills (Scatter Shot): ${enc.psiBlockerKills.splashKills}`);
    }

    // Ability Diagnostics
    const abKeys = Object.keys(enc.abilityDiagnostics);
    if (abKeys.length > 0) {
      const abStr = abKeys
        .map((k) => {
          const u = enc.abilityDiagnostics[k];
          if (!u) return '';
          const disp = u.displacementTicks > 0 ? `, +${u.displacementTicks} ticks (${u.displacementTurns.toFixed(1)} delay)` : '';
          return `${k}: ${u.casts}c/${u.damage}d${disp}`;
        })
        .filter(Boolean)
        .join(' | ');
      console.log(`  Ability Breakdown: ${abStr}`);
    }

    const d = enc.partyDamageReceived;
    console.log(`  Party Dmg Taken (Total ${d.total}): Weapons: ${d.weapon} (${((d.weapon / (d.total || 1)) * 100).toFixed(1)}%), Disruptor: ${d.disruptor} (${((d.disruptor / (d.total || 1)) * 100).toFixed(1)}%), Burnout: ${d.burnout} (${((d.burnout / (d.total || 1)) * 100).toFixed(1)}%)`);
    console.log(`  Party Shield Actions:   ${enc.partyShieldActions} / ${enc.partyTotalActions} (${enc.partyShieldActionPct.toFixed(1)}% of actions in this encounter)`);
    console.log(`  Boost Crash Incidents:  ${enc.crashes} crashes, ${enc.crashTurns} recovery turns (Avg ${enc.avgCrashTurns.toFixed(2)} crash turns/battle)`);
    const deathList = Object.entries(enc.firstDeathByCrew).map(([crew, cnt]) => `${crew}: ${cnt} (${((cnt / enc.battles) * 100).toFixed(1)}%)`).join(', ');
    if (deathList) {
      console.log(`  First Crew Death: ${deathList} (Avg Action: ${enc.avgFirstDeathTurn.toFixed(1)})`);
    }
  }
}

interface ComparativeRow {
  Mode: string;
  'Win Rate': string;
  'Actions (Avg)': string;
  'Rounds (Avg)': string;
  'Skirmish Emp (Rnds)': string;
  'Skirmish Shub (Rnds)': string;
  'Std Empire (Rnds)': string;
  'Std Shub (Rnds)': string;
  'Elite Haden (Rnds)': string;
  'Crash T/B': string;
  'Avg Dmg %': string;
  '>80% Kill %': string;
  'Shield %': string;
}

export function main() {
  const args = process.argv.slice(2);
  const noDisruptor = args.includes('--no-disruptor');
  const noBoost = args.includes('--no-boost');
  const noEsper = args.includes('--no-esper');
  const recordAll = args.includes('--record');
  const recordSamples = args.includes('--record-samples');

  let seed = 12345;
  const seedArgIdx = args.indexOf('--seed');
  if (seedArgIdx !== -1 && args[seedArgIdx + 1]) {
    const parsed = parseInt(args[seedArgIdx + 1]!, 10);
    if (!isNaN(parsed)) {
      seed = parsed;
    }
  }

  // Load and validate definitions
  const abilities = validateAbilities(abilitiesJson);
  const partyRecord = validateCombatants(partyJson, 'party');
  const partyList = Object.values(partyRecord);
  const enemiesRecord = validateCombatants(enemiesJson, 'enemies');
  const encountersRecord = validateEncounters(encountersJson);
  const encountersList = Object.values(encountersRecord);

  const BATTLE_COUNT = 1000;

  console.log('================================================================');
  console.log(`       DEATHSTALKER COMBAT ENGINE - LOAD-BEARING SIM SUITE      `);
  console.log(`       PRNG Seed: ${seed} | Battles Per Mode: ${BATTLE_COUNT}   `);
  if (recordSamples) {
    console.log(`       Replay Recording: Active (Samples Mode)                   `);
  } else if (recordAll) {
    console.log(`       Replay Recording: Active (Full Recording Mode)           `);
  }
  console.log('================================================================');

  let modes: { name: string; policy: PartyAIPolicy }[] = [
    { name: 'Baseline (Full AI)', policy: {} },
    { name: '--no-disruptor (Party No Disruptor)', policy: { disableDisruptor: true } },
    { name: '--no-boost (Party No Boost)', policy: { disableBoost: true } },
    { name: '--no-esper (Party No Psionics)', policy: { disableEsper: true } },
  ];

  if (noDisruptor) {
    modes = [{ name: '--no-disruptor (Party No Disruptor)', policy: { disableDisruptor: true } }];
  } else if (noBoost) {
    modes = [{ name: '--no-boost (Party No Boost)', policy: { disableBoost: true } }];
  } else if (noEsper) {
    modes = [{ name: '--no-esper (Party No Psionics)', policy: { disableEsper: true } }];
  }

  const comparativeRows: ComparativeRow[] = [];
  let baselineResult: SimulationResult | null = null;

  for (const m of modes) {
    const isBaseline = m.name.startsWith('Baseline');
    const recOpts = isBaseline && (recordAll || recordSamples)
      ? { recordAll, recordSamples }
      : undefined;

    const res = runSimulation(partyList, enemiesRecord, abilities, encountersList, BATTLE_COUNT, m.policy, seed, recOpts);
    if (isBaseline) {
      baselineResult = res;
    }

    const empSkirm = res.encounterBreakdowns['enc_empire_skirmish'];
    const shubSkirm = res.encounterBreakdowns['enc_shub_skirmish'];
    const empire = res.encounterBreakdowns['enc_empire_patrol'];
    const shub = res.encounterBreakdowns['enc_shub_swarm'];
    const haden = res.encounterBreakdowns['enc_hadenman_vanguard'];

    comparativeRows.push({
      Mode: m.name,
      'Win Rate': `${res.winRate.toFixed(1)}%`,
      'Actions (Avg)': `${res.averageActions.toFixed(1)} (${res.minActions}-${res.maxActions})`,
      'Rounds (Avg)': `${res.averageRounds.toFixed(1)} (${res.minRounds}-${res.maxRounds})`,
      'Skirmish Emp (Rnds)': empSkirm ? `${empSkirm.winRate.toFixed(0)}% (${empSkirm.avgRounds.toFixed(1)}r / ${empSkirm.avgActions.toFixed(0)}a)` : 'N/A',
      'Skirmish Shub (Rnds)': shubSkirm ? `${shubSkirm.winRate.toFixed(0)}% (${shubSkirm.avgRounds.toFixed(1)}r / ${shubSkirm.avgActions.toFixed(0)}a)` : 'N/A',
      'Std Empire (Rnds)': empire ? `${empire.winRate.toFixed(0)}% (${empire.avgRounds.toFixed(1)}r / ${empire.avgActions.toFixed(0)}a)` : 'N/A',
      'Std Shub (Rnds)': shub ? `${shub.winRate.toFixed(0)}% (${shub.avgRounds.toFixed(1)}r / ${shub.avgActions.toFixed(0)}a)` : 'N/A',
      'Elite Haden (Rnds)': haden ? `${haden.winRate.toFixed(0)}% (${haden.avgRounds.toFixed(1)}r / ${haden.avgActions.toFixed(0)}a)` : 'N/A',
      'Crash T/B': `${res.avgCrashTurnsPerBattle.toFixed(2)}`,
      'Avg Dmg %': `${res.avgDisruptorDmgPct.toFixed(1)}%`,
      '>80% Kill %': `${res.disruptorHighHpKillPct.toFixed(1)}%`,
      'Shield %': `${res.partyShieldActionPct.toFixed(1)}%`,
    });
  }

  if (baselineResult) {
    printEncounterDetails(baselineResult);

    // Save Replay Samples if requested
    if (recordSamples && baselineResult.sampleReplays) {
      saveReplaySamples(baselineResult.sampleReplays, seed);
    }
  }

  console.log('\n======================================================================================================================================');
  console.log(`                                            COMPARATIVE POLICY SUMMARY TABLE (Seed: ${seed})                                          `);
  console.log('======================================================================================================================================');
  console.table(comparativeRows);
}

function saveReplaySamples(
  samples: Record<string, { shortest: BattleReplay; median: BattleReplay; longest: BattleReplay }>,
  seed: number
): void {
  const replaysDir = path.resolve(process.cwd(), 'replays');
  if (!fs.existsSync(replaysDir)) {
    fs.mkdirSync(replaysDir, { recursive: true });
  }

  const manifest: Record<string, any> = {
    seed,
    generatedAt: new Date().toISOString(),
    samples: {},
  };

  const sampleExportData: Record<string, BattleReplay> = {};

  for (const [encId, sampleSet] of Object.entries(samples)) {
    manifest.samples[encId] = {};

    for (const type of ['shortest', 'median', 'longest'] as const) {
      const replay = sampleSet[type];
      if (!replay) continue;

      const fileName = `sample_${encId}_${type}.json`;
      const filePath = path.join(replaysDir, fileName);
      fs.writeFileSync(filePath, JSON.stringify(replay, null, 2), 'utf-8');

      manifest.samples[encId][type] = {
        file: fileName,
        actions: replay.summary.totalActions,
        rounds: replay.summary.totalRounds,
        winner: replay.summary.winner,
      };

      const exportKey = `${encId}_${type}`;
      sampleExportData[exportKey] = replay;
    }
  }

  fs.writeFileSync(path.join(replaysDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

  // Also write src/data/sampleReplays.ts so Vite/Browser loads them seamlessly
  const tsContent = `/**
 * Auto-generated sample replay bundle from simulator (\`--record-samples\`).
 * Allows instant replay viewing in browser without local HTTP file server configuration.
 */

import { BattleReplay } from '../sim/simulator';

export const SAMPLE_REPLAYS: Record<string, BattleReplay> = ${JSON.stringify(sampleExportData, null, 2)};
`;

  const tsDir = path.resolve(process.cwd(), 'src', 'data');
  fs.writeFileSync(path.join(tsDir, 'sampleReplays.ts'), tsContent, 'utf-8');

  console.log(`\n[Replay Recorder] Successfully saved 15 sample replays to '${replaysDir}' and 'src/data/sampleReplays.ts'`);
}

if (process.argv[1]?.includes('index.ts') || process.argv[1]?.includes('index.js')) {
  main();
}
