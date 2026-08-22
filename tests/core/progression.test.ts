import { describe, it, expect } from 'vitest';
import {
  computeCombatantStats,
  createCampaign,
  gainExperience,
  awardEncounterRewards,
  buyConsumable,
  buyEquipment,
  equipItem,
  unequipItem,
  initExpeditionFromCampaign,
} from '../../src/core/progression';
import { Combatant, EquipmentItem, EncounterDefinition } from '../../src/core/types';

describe('Progression Engine & Stat Computation', () => {
  const mockCaptain: Combatant = {
    id: 'crew_valen',
    name: 'Valen Vance',
    faction: 'party',
    role: 'Captain / Striker',
    stats: {
      maxHp: 120,
      hp: 120,
      maxEsp: 0,
      esp: 0,
      attack: 30,
      defense: 14,
      speed: 15,
    },
    canBoost: true,
    disruptorCooldown: 3,
    isBoosting: false,
    burnout: 0,
    hasForceShield: false,
    stunnedTurns: 0,
    crashTurns: 0,
    abilityIds: ['vibro_blade'],
  };

  const captainGrowth = {
    hpPerLevel: 14,
    espPerLevel: 0,
    attackPerLevel: 3.0,
    defensePerLevel: 1.0,
    speedPerLevel: 0.5,
  };

  const mockWeapon: EquipmentItem = {
    id: 'vibro_scythe',
    name: 'Heavy Vibro-Scythe',
    slot: 'weapon',
    tier: 2,
    cost: 200,
    description: '+9 Attack',
    allowedRoles: ['Captain / Striker'],
    modifiers: { attackBonus: 9, speedBonus: 1 },
  };

  const mockAccessory: EquipmentItem = {
    id: 'disruptor_capacitor',
    name: 'Fast Capacitor',
    slot: 'accessory',
    tier: 1,
    cost: 250,
    description: 'Disruptor cooldown -1',
    modifiers: { disruptorCooldownReduction: 1, maxHpBonus: 10 },
  };

  it('computes level 1 stats exactly equal to base stats without equipment', () => {
    const stats = computeCombatantStats(mockCaptain, 1, captainGrowth);
    expect(stats.stats.maxHp).toBe(120);
    expect(stats.stats.attack).toBe(30);
    expect(stats.stats.defense).toBe(14);
    expect(stats.stats.speed).toBe(15);
    expect(stats.disruptorCooldown).toBe(3);
  });

  it('computes level 3 stats with linear growth and equipment modifiers', () => {
    // Level 3: delta = 2 levels.
    // HP: 120 + 2*14 = 148 + 10 (accessory) = 158
    // ATK: 30 + 2*3.0 = 36 + 9 (weapon) = 45
    // DEF: 14 + 2*1.0 = 16
    // SPD: 15 + 2*0.5 = 16 + 1 (weapon) = 17
    // Disruptor CD: 3 - 1 = 2
    const stats = computeCombatantStats(mockCaptain, 3, captainGrowth, mockWeapon, mockAccessory);
    expect(stats.stats.maxHp).toBe(158);
    expect(stats.stats.hp).toBe(158);
    expect(stats.stats.attack).toBe(45);
    expect(stats.stats.defense).toBe(16);
    expect(stats.stats.speed).toBe(17);
    expect(stats.disruptorCooldown).toBe(2);
  });

  it('caps level at progression rules levelCap (10)', () => {
    const stats = computeCombatantStats(mockCaptain, 99, captainGrowth);
    // Level 10: delta = 9 levels
    // HP: 120 + 9*14 = 246
    expect(stats.stats.maxHp).toBe(246);
  });

  it('promotes party level when gaining XP past thresholds', () => {
    const campaign = createCampaign([mockCaptain]);
    expect(campaign.partyLevel).toBe(1);
    expect(campaign.xp).toBe(0);

    // Thresholds: [0, 100, 250, 450, ...]
    const step1 = gainExperience(campaign, 50);
    expect(step1.leveledUp).toBe(false);
    expect(step1.campaign.partyLevel).toBe(1);

    const step2 = gainExperience(step1.campaign, 60); // 110 total XP >= 100 (Level 2)
    expect(step2.leveledUp).toBe(true);
    expect(step2.campaign.partyLevel).toBe(2);

    const step3 = gainExperience(step2.campaign, 200); // 310 total XP >= 250 (Level 3)
    expect(step3.leveledUp).toBe(true);
    expect(step3.campaign.partyLevel).toBe(3);
  });

  it('awards encounter gold and XP to campaign', () => {
    const campaign = createCampaign([mockCaptain]);
    const encounter: EncounterDefinition = {
      id: 'test_enc',
      name: 'Test Patrol',
      tier: 'standard',
      description: 'Test',
      enemyIds: ['emp_guard'],
      rewards: { xp: 120, gold: 80 },
    };

    const updated = awardEncounterRewards(campaign, encounter);
    expect(updated.gold).toBe(380); // 300 + 80
    expect(updated.xp).toBe(120);
    expect(updated.partyLevel).toBe(2); // 120 XP >= 100 threshold
  });

  it('handles purchasing consumables and equipment with gold checks', () => {
    let campaign = createCampaign([mockCaptain]);
    expect(campaign.gold).toBe(300);
    const initialMedkits = campaign.reserveInventory.medkits;
    const initialRevives = campaign.reserveInventory.revives;

    // Buy 2 medkits (50g each = 100g)
    campaign = buyConsumable(campaign, 'medkit', 2);
    expect(campaign.gold).toBe(200);
    expect(campaign.reserveInventory.medkits).toBe(initialMedkits + 2);

    // Buy 1 revive (120g)
    campaign = buyConsumable(campaign, 'revive', 1);
    expect(campaign.gold).toBe(80);
    expect(campaign.reserveInventory.revives).toBe(initialRevives + 1);

    // Attempting to buy something unaffordable throws
    expect(() => buyConsumable(campaign, 'revive', 1)).toThrow('Insufficient gold');
  });

  it('enforces equipment role restrictions and equip/unequip slots', () => {
    let campaign = createCampaign([mockCaptain]);
    campaign = buyEquipment(campaign, mockWeapon);
    expect(campaign.ownedEquipment).toContain('vibro_scythe');

    // Equipping on Captain succeeds
    campaign = equipItem(campaign, 'crew_valen', 'weapon', mockWeapon, 'Captain / Striker');
    expect(campaign.equipped['crew_valen']?.weaponId).toBe('vibro_scythe');

    // Equipping Captain-only weapon on Esper throws
    expect(() => equipItem(campaign, 'crew_lyra', 'weapon', mockWeapon, 'Sole Esper')).toThrow('cannot be equipped by role Sole Esper');

    // Unequip clears the slot
    campaign = unequipItem(campaign, 'crew_valen', 'weapon');
    expect(campaign.equipped['crew_valen']?.weaponId).toBeUndefined();
  });

  it('maintains strict state isolation between CampaignState and ExpeditionState', () => {
    const campaign = createCampaign([mockCaptain]);
    const equipmentMap: Record<string, EquipmentItem> = {
      vibro_scythe: mockWeapon,
    };
    const encounters: EncounterDefinition[] = [
      { id: 'enc_1', name: 'Fight 1', tier: 'skirmish', description: 'Test', enemyIds: [] },
    ];

    const { campaign: campAfterLaunch, expedition } = initExpeditionFromCampaign(
      campaign,
      encounters,
      [mockCaptain],
      equipmentMap,
      3,
      1
    );

    // Expedition has allocated rations; Campaign reserve has deducted them
    expect(expedition.inventory.medkits).toBe(3);
    expect(expedition.inventory.revives).toBe(1);
    expect(campAfterLaunch.reserveInventory.medkits).toBe(campaign.reserveInventory.medkits - 3);
    expect(campAfterLaunch.reserveInventory.revives).toBe(campaign.reserveInventory.revives - 1);

    // Mutating expedition combatant HP does NOT mutate campaign or original definition
    expedition.party['crew_valen']!.stats.hp = 10;
    expect(mockCaptain.stats.hp).toBe(120);
    expect(campaign.partyLevel).toBe(1);
  });
});
