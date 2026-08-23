/**
 * Core Progression Engine.
 *
 * Implements JRPG progression mechanics:
 * - Pure stat computation: base + (level - 1) * growth + equipment modifiers.
 * - Shared party XP and level threshold promotion.
 * - Gold and consumable purchasing economy.
 * - Declarative 2-slot equipment resolution (weapon + accessory).
 * - Clear boundary between persistent CampaignState and per-expedition ExpeditionState.
 *
 * Pure core module without browser/DOM dependencies.
 */

import {
  Combatant,
  CampaignState,
  ExpeditionState,
  EncounterDefinition,
  EquipmentItem,
  EquipmentSlot,
  PartyMemberDefinition,
  StatGrowth,
  RunInventory,
} from './types';
import { GameRules, getDefaultRules } from './configLoader';

export const DEFAULT_GROWTH: Record<string, StatGrowth> = {
  crew_valen: { hpPerLevel: 14, espPerLevel: 0, attackPerLevel: 3.0, defensePerLevel: 1.0, speedPerLevel: 0.5 },
  crew_lyra: { hpPerLevel: 8, espPerLevel: 12, attackPerLevel: 1.0, defensePerLevel: 0.8, speedPerLevel: 0.8 },
  crew_kaelen: { hpPerLevel: 10, espPerLevel: 0, attackPerLevel: 2.5, defensePerLevel: 1.0, speedPerLevel: 1.5 },
  crew_tarek: { hpPerLevel: 18, espPerLevel: 0, attackPerLevel: 2.0, defensePerLevel: 2.2, speedPerLevel: 0.3 },
};

/**
 * Pure stat computation: base + (level - 1) * growth + equipment modifiers.
 */
export function computeCombatantStats(
  base: Combatant | PartyMemberDefinition,
  level: number,
  growth?: StatGrowth,
  weapon?: EquipmentItem,
  accessory?: EquipmentItem,
  rules?: GameRules
): Combatant {
  const activeRules = rules || getDefaultRules();
  const cappedLevel = Math.max(1, Math.min(activeRules.progression?.levelCap ?? 10, Math.floor(level)));
  const levelDelta = cappedLevel - 1;

  const charGrowth = growth || ('growth' in base ? base.growth : DEFAULT_GROWTH[base.id]) || {
    hpPerLevel: 10,
    espPerLevel: 0,
    attackPerLevel: 2,
    defensePerLevel: 1,
    speedPerLevel: 1,
  };

  // Base + Level scaling
  let maxHp = Math.round(base.stats.maxHp + levelDelta * charGrowth.hpPerLevel);
  let maxEsp = Math.round(base.stats.maxEsp + levelDelta * charGrowth.espPerLevel);
  let attack = Math.round(base.stats.attack + levelDelta * charGrowth.attackPerLevel);
  let defense = Math.round(base.stats.defense + levelDelta * charGrowth.defensePerLevel);
  let speed = Math.round(base.stats.speed + levelDelta * charGrowth.speedPerLevel);

  let disruptorCdReduction = 0;

  // Apply weapon modifiers
  if (weapon) {
    if (weapon.modifiers.attackBonus) attack += weapon.modifiers.attackBonus;
    if (weapon.modifiers.defenseBonus) defense += weapon.modifiers.defenseBonus;
    if (weapon.modifiers.speedBonus) speed += weapon.modifiers.speedBonus;
    if (weapon.modifiers.maxHpBonus) maxHp += weapon.modifiers.maxHpBonus;
  }

  // Apply accessory modifiers
  if (accessory) {
    if (accessory.modifiers.attackBonus) attack += accessory.modifiers.attackBonus;
    if (accessory.modifiers.defenseBonus) defense += accessory.modifiers.defenseBonus;
    if (accessory.modifiers.speedBonus) speed += accessory.modifiers.speedBonus;
    if (accessory.modifiers.maxHpBonus) maxHp += accessory.modifiers.maxHpBonus;
    if (accessory.modifiers.maxEspBonus) maxEsp += accessory.modifiers.maxEspBonus;
    if (accessory.modifiers.disruptorCooldownReduction) {
      disruptorCdReduction += accessory.modifiers.disruptorCooldownReduction;
    }
  }

  const baseDisruptorCd = base.disruptorCooldown ?? 3;
  const initialCooldown = Math.max(1, baseDisruptorCd - disruptorCdReduction);

  return {
    ...base,
    stats: {
      maxHp,
      hp: maxHp,
      maxEsp,
      esp: maxEsp,
      attack,
      defense,
      speed,
    },
    disruptorCooldown: initialCooldown,
    isBoosting: false,
    turnsSpentBoosting: 0,
    crashTurns: 0,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    abilityIds: [...base.abilityIds],
  };
}

/**
 * Initializes a new campaign state with starting reserves and equipment.
 */
export function createCampaign(
  partyDefs?: (Combatant | PartyMemberDefinition)[],
  rules?: GameRules,
  campaignId: string = 'campaign'
): CampaignState {
  const activeRules = rules || getDefaultRules();
  const equipped: Record<string, { weaponId?: string; accessoryId?: string }> = {};

  if (partyDefs) {
    for (const p of partyDefs) {
      equipped[p.id] = {};
    }
  }

  return {
    campaignId,
    partyLevel: 1,
    xp: 0,
    gold: 300,
    reserveInventory: {
      medkits: activeRules.progression?.maxMedkitsPerExpedition ?? 4,
      revives: activeRules.progression?.maxRevivesPerExpedition ?? 1,
    },
    ownedEquipment: ['monomolecular_blade'],
    equipped,
    completedExpeditions: [],
  };
}

/**
 * Adds shared party XP and evaluates level promotion against data thresholds.
 */
export function gainExperience(
  campaign: CampaignState,
  xpAmount: number,
  rules?: GameRules
): { campaign: CampaignState; leveledUp: boolean; newLevel: number } {
  const activeRules = rules || getDefaultRules();
  const thresholds = activeRules.progression?.xpThresholds ?? [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200];
  const levelCap = activeRules.progression?.levelCap ?? 10;

  const newXp = campaign.xp + Math.max(0, xpAmount);
  let currentLevel = campaign.partyLevel;

  while (currentLevel < levelCap && currentLevel < thresholds.length && newXp >= (thresholds[currentLevel] ?? Infinity)) {
    currentLevel++;
  }

  const leveledUp = currentLevel > campaign.partyLevel;
  return {
    campaign: {
      ...campaign,
      xp: newXp,
      partyLevel: currentLevel,
    },
    leveledUp,
    newLevel: currentLevel,
  };
}

/**
 * Awards encounter rewards (XP & gold) to the persistent campaign.
 */
export function awardEncounterRewards(
  campaign: CampaignState,
  encounter: EncounterDefinition,
  rules?: GameRules
): CampaignState {
  const activeRules = rules || getDefaultRules();
  const xpReward = encounter.rewards?.xp ?? activeRules.progression?.xpByTier[encounter.tier] ?? 50;
  const goldReward = encounter.rewards?.gold ?? activeRules.progression?.goldByTier[encounter.tier] ?? 40;

  const withXp = gainExperience(campaign, xpReward, activeRules).campaign;
  return {
    ...withXp,
    gold: withXp.gold + goldReward,
  };
}

/**
 * Awards expedition completion bonus gold and XP.
 */
export function awardExpeditionCompletion(
  campaign: CampaignState,
  expeditionId: string,
  rules?: GameRules
): CampaignState {
  const activeRules = rules || getDefaultRules();
  const bonusXp = activeRules.progression?.expeditionBonusXp ?? 100;
  const bonusGold = activeRules.progression?.expeditionBonusGold ?? 150;

  const withXp = gainExperience(campaign, bonusXp, activeRules).campaign;
  const completed = withXp.completedExpeditions.includes(expeditionId)
    ? withXp.completedExpeditions
    : [...withXp.completedExpeditions, expeditionId];

  return {
    ...withXp,
    gold: withXp.gold + bonusGold,
    completedExpeditions: completed,
  };
}

/**
 * Purchases a consumable from the shop using campaign gold.
 */
export function buyConsumable(
  campaign: CampaignState,
  item: 'medkit' | 'revive',
  count: number = 1,
  rules?: GameRules
): CampaignState {
  const activeRules = rules || getDefaultRules();
  const unitCost = item === 'medkit' ? (activeRules.progression?.medkitCost ?? 50) : (activeRules.progression?.reviveCost ?? 120);
  const totalCost = unitCost * count;

  if (campaign.gold < totalCost) {
    throw new Error(`Insufficient gold: have ${campaign.gold}g, need ${totalCost}g for ${count}x ${item}`);
  }

  return {
    ...campaign,
    gold: campaign.gold - totalCost,
    reserveInventory: {
      ...campaign.reserveInventory,
      [item === 'medkit' ? 'medkits' : 'revives']: campaign.reserveInventory[item === 'medkit' ? 'medkits' : 'revives'] + count,
    },
  };
}

/**
 * Purchases an equipment item from the shop using campaign gold.
 */
export function buyEquipment(
  campaign: CampaignState,
  item: EquipmentItem
): CampaignState {
  if (campaign.gold < item.cost) {
    throw new Error(`Insufficient gold: have ${campaign.gold}g, need ${item.cost}g for ${item.name}`);
  }
  if (campaign.ownedEquipment.includes(item.id)) {
    throw new Error(`Item ${item.name} is already owned.`);
  }

  return {
    ...campaign,
    gold: campaign.gold - item.cost,
    ownedEquipment: [...campaign.ownedEquipment, item.id],
  };
}

/**
 * Equips an owned weapon or accessory onto a crew member.
 */
export function equipItem(
  campaign: CampaignState,
  characterId: string,
  slot: EquipmentSlot,
  item: EquipmentItem,
  characterRole?: string
): CampaignState {
  if (!campaign.ownedEquipment.includes(item.id)) {
    throw new Error(`Item ${item.name} (${item.id}) is not in campaign inventory.`);
  }
  if (item.slot !== slot) {
    throw new Error(`Item ${item.name} is a ${item.slot}, cannot be equipped in ${slot} slot.`);
  }
  if (item.allowedRoles && characterRole && !item.allowedRoles.includes(characterRole)) {
    throw new Error(`Item ${item.name} cannot be equipped by role ${characterRole}.`);
  }

  const charEquip = { ...(campaign.equipped[characterId] || {}) };
  if (slot === 'weapon') {
    charEquip.weaponId = item.id;
  } else {
    charEquip.accessoryId = item.id;
  }

  return {
    ...campaign,
    equipped: {
      ...campaign.equipped,
      [characterId]: charEquip,
    },
  };
}

/**
 * Unequips an item from a slot on a crew member.
 */
export function unequipItem(
  campaign: CampaignState,
  characterId: string,
  slot: EquipmentSlot
): CampaignState {
  const charEquip = { ...(campaign.equipped[characterId] || {}) };
  if (slot === 'weapon') {
    delete charEquip.weaponId;
  } else {
    delete charEquip.accessoryId;
  }

  return {
    ...campaign,
    equipped: {
      ...campaign.equipped,
      [characterId]: charEquip,
    },
  };
}

/**
 * Computes all party combatant states for an expedition using campaign level & equipment.
 */
export function prepareExpeditionParty(
  campaign: CampaignState,
  partyDefs: (PartyMemberDefinition | Combatant)[],
  equipmentDefs: Record<string, EquipmentItem>,
  rules?: GameRules
): Record<string, Combatant> {
  const activeRules = rules || getDefaultRules();
  const party: Record<string, Combatant> = {};

  for (const def of partyDefs) {
    const charEquip = campaign.equipped[def.id] || {};
    const weapon = charEquip.weaponId ? equipmentDefs[charEquip.weaponId] : undefined;
    const accessory = charEquip.accessoryId ? equipmentDefs[charEquip.accessoryId] : undefined;
    const growth = 'growth' in def ? def.growth : DEFAULT_GROWTH[def.id];

    party[def.id] = computeCombatantStats(def, campaign.partyLevel, growth, weapon, accessory, activeRules);
  }

  return party;
}

/**
 * Initializes a new ExpeditionState from CampaignState and consumable ration allocation.
 */
export function initExpeditionFromCampaign(
  campaign: CampaignState,
  encounters: EncounterDefinition[],
  partyDefs: (PartyMemberDefinition | Combatant)[],
  equipmentDefs: Record<string, EquipmentItem>,
  medkitsToBring?: number,
  revivesToBring?: number,
  seed: number = 12345,
  rules?: GameRules,
  expeditionId: string = `exp-${seed}`
): { campaign: CampaignState; expedition: ExpeditionState } {
  const activeRules = rules || getDefaultRules();
  const maxMeds = activeRules.progression?.maxMedkitsPerExpedition ?? 4;
  const maxRevs = activeRules.progression?.maxRevivesPerExpedition ?? 2;

  const reqMeds = medkitsToBring !== undefined ? medkitsToBring : maxMeds;
  const reqRevs = revivesToBring !== undefined ? revivesToBring : maxRevs;

  const bringMeds = Math.min(campaign.reserveInventory.medkits, maxMeds, Math.max(0, reqMeds));
  const bringRevs = Math.min(campaign.reserveInventory.revives, maxRevs, Math.max(0, reqRevs));

  const updatedCampaign: CampaignState = {
    ...campaign,
    reserveInventory: {
      medkits: campaign.reserveInventory.medkits - bringMeds,
      revives: campaign.reserveInventory.revives - bringRevs,
    },
  };

  const party = prepareExpeditionParty(campaign, partyDefs, equipmentDefs, activeRules);
  const partyIds = partyDefs.map((p) => p.id);

  const inventory: RunInventory = {
    medkits: bringMeds,
    revives: bringRevs,
  };

  const expedition: ExpeditionState = {
    runId: expeditionId,
    seed,
    partyLevel: campaign.partyLevel,
    encounterSequence: [...encounters],
    currentEncounterIndex: 0,
    party,
    partyIds,
    inventory,
    status: 'in_progress',
    history: [],
  };

  return { campaign: updatedCampaign, expedition };
}
