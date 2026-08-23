import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { createPresentationBridgeDocument } from '../src/bridge/presentationBridge';
import { chooseEnemyAction, choosePartyActionForSim } from '../src/core/ai';
import { applyAction } from '../src/core/battle';
import { loadGameData } from '../src/core/configLoader';
import { createRng } from '../src/core/random';
import { initRun, startRunEncounter } from '../src/core/run';
import type { BattleAction, BattleState } from '../src/core/types';

const FIXTURE_ID = 'phase-1-empire-skirmish';
const FIXTURE_SEED = 230823;
const ENCOUNTER_ID = 'enc_empire_skirmish';
const MAX_ACTIONS = 140;
const OUTPUT_PATH = resolve(process.cwd(), 'godot/data/presentation-replay-v1.json');

function generateAuthoritativeTimeline(): {
  states: BattleState[];
  actions: BattleAction[];
  encounter: ReturnType<typeof loadGameData>['encounters'][number];
} {
  // `{}` explicitly bypasses any local balance-overrides file. The committed
  // fixture therefore comes only from the validator-backed repository data.
  const gameData = loadGameData({});
  const encounter = gameData.encounters.find((candidate) => candidate.id === ENCOUNTER_ID);
  if (!encounter) {
    throw new Error(`Validated encounter '${ENCOUNTER_ID}' was not found`);
  }

  const run = initRun(gameData.party, [encounter], FIXTURE_SEED, undefined, gameData.rules);
  let battle = startRunEncounter(run, gameData.enemies, gameData.abilities, gameData.rules);
  const rng = createRng(FIXTURE_SEED);
  const states: BattleState[] = [battle];
  const actions: BattleAction[] = [];

  while (battle.status === 'in_progress' && actions.length < MAX_ACTIONS) {
    const actor = battle.combatants[battle.activeActorId];
    if (!actor || actor.stats.hp <= 0) {
      throw new Error(`Core selected invalid active actor '${battle.activeActorId}'`);
    }

    const action = battle.partyIds.includes(actor.id)
      ? choosePartyActionForSim(battle, actor.id, undefined, rng)
      : chooseEnemyAction(battle, actor.id, rng);
    battle = applyAction(battle, action, rng);
    actions.push(action);
    states.push(battle);
  }

  if (battle.status === 'in_progress') {
    throw new Error(`Fixture exceeded the authoritative ${MAX_ACTIONS}-action safety cap`);
  }

  return { states, actions, encounter };
}

async function main(): Promise<void> {
  const { states, actions, encounter } = generateAuthoritativeTimeline();
  const document = createPresentationBridgeDocument({
    fixtureId: FIXTURE_ID,
    seed: FIXTURE_SEED,
    encounter,
    states,
    actions,
    frameStepSeconds: 1.15,
    endHoldSeconds: 2.5,
  });
  const output = `${JSON.stringify(document, null, 2)}\n`;
  const outputPath = OUTPUT_PATH;

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output, 'utf8');

  const digest = createHash('sha256').update(output).digest('hex');
  console.log(
    `[Godot Bridge] Wrote ${document.frames.length} authoritative snapshots to ${outputPath}`
  );
  console.log(
    `[Godot Bridge] ${encounter.id} seed=${FIXTURE_SEED} outcome=${states[states.length - 1]?.status} sha256=${digest}`
  );
}

await main();
