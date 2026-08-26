import { describe, it, expect } from 'vitest';
import {
  validateAbilities,
  validateCombatants,
  validateEncounters,
  validateExpeditionJourney,
  ValidationError,
} from '../../src/core/validator';
import abilitiesData from '../../src/data/abilities.json';
import partyData from '../../src/data/party.json';
import enemiesData from '../../src/data/enemies.json';
import encountersData from '../../src/data/encounters.json';
import openingExpeditionData from '../../src/data/opening-expedition.json';

describe('Data Schema Validator', () => {
  it('successfully validates production JSON files', () => {
    const abilities = validateAbilities(abilitiesData);
    expect(Object.keys(abilities).length).toBeGreaterThan(0);
    expect(abilities['vibro_blade']?.name).toBe('Vibro-Blade');
    expect(abilities['vibro_blade']?.audioProfile).toBe('vibro_blade');
    expect(abilities['twin_daggers']?.audioProfile).toBe('twin_vibro_daggers');
    expect(abilities['heavy_smash']?.audioProfile).toBe('heavy_smash');
    expect(abilities['physical_shove']?.audioProfile).toBe('concussive_shove');
    expect(abilities['particle_carbine']?.audioProfile).toBe('particle');
    expect(abilities['scatter_shot']?.audioProfile).toBe('ballistic_scatter');

    const party = validateCombatants(partyData, 'party');
    expect(Object.keys(party).length).toBe(4);

    const enemies = validateCombatants(enemiesData, 'enemies');
    expect(Object.keys(enemies).length).toBeGreaterThan(0);

    const encounters = validateEncounters(encountersData);
    expect(Object.keys(encounters).length).toBeGreaterThan(0);
    expect(encounters['enc_empire_skirmish']?.environment?.type).toBe('empire_hall');

    const opening = validateExpeditionJourney(openingExpeditionData);
    expect(opening.id).toBe('opening_virimonde_forced_departure');
    expect(opening.beats).toHaveLength(10);
    expect(opening.beats.at(-1)?.interaction).toBe('complete');
    expect(opening.beats[3]?.entryPartyHpPercentageCaps).toEqual({ owen: 0.75 });
  });

  it('rejects incomplete or mismatched expedition journey beats', () => {
    expect(() => validateExpeditionJourney({
      id: 'bad',
      locationId: 'virimonde',
      beats: [{
        id: 'combat',
        journeyMovement: 'separation',
        kind: 'combat',
        objectiveKey: 'bad.combat',
        environmentState: 'ordinary',
        interaction: 'combat',
        partyIds: ['owen'],
      }],
    })).toThrow(ValidationError);
  });

  it('rejects malformed ability with invalid category', () => {
    const malformed = [
      {
        id: 'bad_ability',
        name: 'Bad',
        category: 'laser_sword', // invalid
        espCost: 0,
        powerMultiplier: 1.0,
        targetScope: 'single_enemy',
        description: 'test',
      },
    ];

    expect(() => validateAbilities(malformed)).toThrow(ValidationError);
  });

  it('rejects missing, invalid, or category-incompatible weapon audio profiles', () => {
    const base = {
      id: 'weapon',
      name: 'Weapon',
      espCost: 0,
      powerMultiplier: 1,
      targetScope: 'single_enemy',
      description: 'test',
    };

    expect(() => validateAbilities([{ ...base, category: 'projectile' }])).toThrow(ValidationError);
    expect(() => validateAbilities([{ ...base, category: 'projectile', audioProfile: 'unknown' }])).toThrow(ValidationError);
    expect(() => validateAbilities([{ ...base, category: 'melee', audioProfile: 'laser' }])).toThrow(ValidationError);
    expect(() => validateAbilities([{ ...base, category: 'projectile', audioProfile: 'heavy_smash' }])).toThrow(ValidationError);
  });

  it('accepts distinct and generic melee audio profiles', () => {
    const profiles = [
      'blade',
      'blunt',
      'vibro_blade',
      'twin_vibro_daggers',
      'heavy_smash',
      'concussive_shove',
    ];
    const abilities = validateAbilities(profiles.map((audioProfile, index) => ({
      id: `melee_${index}`,
      name: `Melee ${index}`,
      category: 'melee',
      audioProfile,
      espCost: 0,
      powerMultiplier: 1,
      targetScope: 'single_enemy',
      description: 'test',
    })));

    expect(Object.values(abilities).map((ability) => ability.audioProfile)).toEqual(profiles);
  });

  it('rejects combatant with negative HP or missing stats', () => {
    const malformed = [
      {
        id: 'bad_combatant',
        name: 'Bad Guy',
        faction: 'empire',
        role: 'grunt',
        stats: {
          maxHp: -10, // invalid
          attack: 10,
          defense: 5,
          speed: 10,
        },
        abilityIds: [],
      },
    ];

    expect(() => validateCombatants(malformed)).toThrow(ValidationError);
  });

  it('rejects duplicate IDs in array', () => {
    const duplicates = [
      {
        id: 'dupe',
        name: 'First',
        category: 'melee',
        audioProfile: 'blade',
        espCost: 0,
        powerMultiplier: 1.0,
        targetScope: 'single_enemy',
        description: 'test',
      },
      {
        id: 'dupe',
        name: 'Second',
        category: 'melee',
        audioProfile: 'blade',
        espCost: 0,
        powerMultiplier: 1.0,
        targetScope: 'single_enemy',
        description: 'test',
      },
    ];

    expect(() => validateAbilities(duplicates)).toThrow(ValidationError);
  });
});
