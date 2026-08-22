/**
 * Run-based Persistence Engine.
 *
 * Owns the multi-encounter sequence, persistent party resource state across battles
 * (exact HP, partial ESP regen, halved burnout, cross-encounter disruptor cooldown,
 * shield/crash clearing, persistent deaths), and the limited healing item economy.
 * Pure core module without rendering or platform dependencies.
 */

import {
  AbilityDefinition,
  BattleState,
  Combatant,
  EncounterDefinition,
  RunInventory,
  RunState,
} from './types';
import { initBattle } from './battle';
import { GameRules, getDefaultRules } from './configLoader';

/**
 * Initializes a new RunState across an ordered sequence of encounters.
 */
export function initRun(
  initialParty: Combatant[],
  encounters: EncounterDefinition[],
  seed: number = 12345,
  startingInventory?: Partial<RunInventory>,
  rules?: GameRules
): RunState {
  const activeRules = rules || getDefaultRules();
  const party: Record<string, Combatant> = {};
  const partyIds: string[] = [];

  for (const member of initialParty) {
    party[member.id] = {
      ...member,
      stats: {
        ...member.stats,
        hp: member.stats.maxHp,
        esp: member.stats.maxEsp,
      },
      disruptorCooldown: 3, // Initial run start starts with cooldown 3
      isBoosting: false,
      turnsSpentBoosting: 0,
      crashTurns: 0,
      burnout: 0,
      hasForceShield: false,
      stunnedTurns: 0,
      abilityIds: [...member.abilityIds],
    };
    partyIds.push(member.id);
  }

  const inventory: RunInventory = {
    medkits: startingInventory?.medkits ?? activeRules.inventory.medkits,
    revives: startingInventory?.revives ?? activeRules.inventory.revives,
  };

  return {
    runId: `run-${seed}-${Date.now()}`,
    seed,
    partyLevel: 1,
    encounterSequence: [...encounters],
    currentEncounterIndex: 0,
    party,
    partyIds,
    inventory,
    status: 'in_progress',
    history: [],
  };
}

/**
 * Starts the current encounter in the run sequence, producing a fresh BattleState
 * while injecting the persistent party status and current run inventory.
 */
export function startRunEncounter(
  run: RunState,
  enemiesData: Record<string, Combatant>,
  abilities: Record<string, AbilityDefinition>,
  rules?: GameRules
): BattleState {
  const activeRules = rules || getDefaultRules();
  const encounter = run.encounterSequence[run.currentEncounterIndex];
  if (!encounter) {
    throw new Error(`Invalid encounter index ${run.currentEncounterIndex} in run sequence`);
  }

  // Construct party combatant array from persistent state
  const partyList = run.partyIds.map((id) => {
    const p = run.party[id]!;
    return {
      ...p,
      stats: { ...p.stats },
      abilityIds: [...p.abilityIds],
    };
  });

  // Construct enemy combatant array for current encounter
  const enemyList: Combatant[] = [];
  encounter.enemyIds.forEach((enemyId, idx) => {
    const template = enemiesData[enemyId];
    if (!template) {
      throw new Error(`Enemy template not found for ID: ${enemyId}`);
    }
    enemyList.push({
      ...template,
      id: `${template.id}_${idx + 1}`,
      stats: { ...template.stats },
      abilityIds: [...template.abilityIds],
    });
  });

  const state = initBattle(partyList, enemyList, abilities, encounter, run.inventory, run.seed);
  state.rules = activeRules;
  return state;
}

/**
 * Completes an encounter, applies the inter-encounter persistence rules to the party,
 * updates inventory, and transitions the run to the next encounter or completion/failure.
 */
export function completeRunEncounter(run: RunState, battle: BattleState, rules?: GameRules): RunState {
  const activeRules = rules || battle.rules || getDefaultRules();
  const encounter = run.encounterSequence[run.currentEncounterIndex];
  const partyEndingHp: Record<string, number> = {};

  const updatedParty: Record<string, Combatant> = {};
  for (const id of run.partyIds) {
    const prev = run.party[id]!;
    const after = battle.combatants[id];

    if (!after || after.stats.hp <= 0) {
      // Dead combatant stays KIA
      updatedParty[id] = {
        ...prev,
        stats: {
          ...prev.stats,
          hp: 0,
          esp: after ? after.stats.esp : 0,
        },
        disruptorCooldown: after ? after.disruptorCooldown : prev.disruptorCooldown,
        isBoosting: false,
        turnsSpentBoosting: 0,
        crashTurns: 0,
        burnout: 0,
        hasForceShield: false,
        stunnedTurns: 0,
      };
      partyEndingHp[id] = 0;
    } else {
      // Living combatant: apply inter-encounter persistence rules
      const espRegen = Math.floor(after.stats.maxEsp * activeRules.esp.intermissionRegenPercent);
      const newEsp = Math.min(after.stats.maxEsp, after.stats.esp + espRegen);
      const newBurnout = Math.floor(after.burnout / 2); // Halved, rounded down

      updatedParty[id] = {
        ...after,
        stats: {
          ...after.stats,
          hp: after.stats.hp, // Exact HP persists
          esp: newEsp,        // Partial ESP regen
        },
        burnout: newBurnout,
        disruptorCooldown: after.disruptorCooldown, // Exact disruptor cooldown persists across fights
        hasForceShield: false,                     // Force shield clears between fights
        crashTurns: 0,                             // Crash state clears between fights
        turnsSpentBoosting: 0,
        isBoosting: false,
        stunnedTurns: 0,
      };
      partyEndingHp[id] = after.stats.hp;
    }
  }

  const updatedInventory: RunInventory = {
    medkits: battle.inventory?.medkits ?? run.inventory.medkits,
    revives: battle.inventory?.revives ?? run.inventory.revives,
  };

  const historyEntry = {
    encounterId: encounter?.id ?? 'unknown',
    encounterName: encounter?.name ?? 'Unknown',
    encounterTier: encounter?.tier ?? 'standard',
    outcome: battle.status === 'victory' ? ('victory' as const) : ('defeat' as const),
    totalActions: battle.turnNumber,
    partyEndingHp,
  };

  const anyPartyAlive = run.partyIds.some((id) => (updatedParty[id]?.stats.hp ?? 0) > 0);
  let status: 'in_progress' | 'completed' | 'failed' = 'in_progress';
  let nextEncounterIndex = run.currentEncounterIndex;

  if (battle.status === 'defeat' || !anyPartyAlive) {
    status = 'failed';
  } else if (run.currentEncounterIndex + 1 >= run.encounterSequence.length) {
    status = 'completed';
    nextEncounterIndex = run.currentEncounterIndex;
  } else {
    nextEncounterIndex = run.currentEncounterIndex + 1;
  }

  return {
    ...run,
    party: updatedParty,
    inventory: updatedInventory,
    currentEncounterIndex: nextEncounterIndex,
    status,
    history: [...run.history, historyEntry],
  };
}

/**
 * Spends a medkit between encounters in intermission, healing a living party member for configured max HP %.
 */
export function applyIntermissionMedkit(run: RunState, targetId: string, rules?: GameRules): RunState {
  const activeRules = rules || getDefaultRules();
  if (run.inventory.medkits <= 0) {
    throw new Error('No medkits available in inventory');
  }
  const target = run.party[targetId];
  if (!target) {
    throw new Error(`Target party member ${targetId} not found`);
  }
  if (target.stats.hp <= 0) {
    throw new Error(`Cannot use Medkit on dead party member ${target.displayName || target.name}. Use Revive instead.`);
  }

  const healAmount = Math.max(1, Math.round(target.stats.maxHp * activeRules.inventory.medkitHealPercent));
  const newHp = Math.min(target.stats.maxHp, target.stats.hp + healAmount);

  return {
    ...run,
    inventory: {
      ...run.inventory,
      medkits: run.inventory.medkits - 1,
    },
    party: {
      ...run.party,
      [targetId]: {
        ...target,
        stats: {
          ...target.stats,
          hp: newHp,
        },
      },
    },
  };
}

/**
 * Spends a revive stim between encounters in intermission, reviving a KIA party member with configured max HP %.
 */
export function applyIntermissionRevive(run: RunState, targetId: string, rules?: GameRules): RunState {
  const activeRules = rules || getDefaultRules();
  if (run.inventory.revives <= 0) {
    throw new Error('No revives available in inventory');
  }
  const target = run.party[targetId];
  if (!target) {
    throw new Error(`Target party member ${targetId} not found`);
  }
  if (target.stats.hp > 0) {
    throw new Error(`Cannot use Revive on living party member ${target.displayName || target.name}`);
  }

  const reviveHp = Math.max(1, Math.round(target.stats.maxHp * activeRules.inventory.reviveHealPercent));

  return {
    ...run,
    inventory: {
      ...run.inventory,
      revives: run.inventory.revives - 1,
    },
    party: {
      ...run.party,
      [targetId]: {
        ...target,
        stats: {
          ...target.stats,
          hp: reviveHp,
        },
        burnout: 0,
        crashTurns: 0,
        turnsSpentBoosting: 0,
        isBoosting: false,
        hasForceShield: false,
        stunnedTurns: 0,
      },
    },
  };
}
