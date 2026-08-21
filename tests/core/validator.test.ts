import { describe, it, expect } from 'vitest';
import {
  validateAbilities,
  validateCombatants,
  validateEncounters,
  ValidationError,
} from '../../src/core/validator';
import abilitiesData from '../../src/data/abilities.json';
import partyData from '../../src/data/party.json';
import enemiesData from '../../src/data/enemies.json';
import encountersData from '../../src/data/encounters.json';

describe('Data Schema Validator', () => {
  it('successfully validates production JSON files', () => {
    const abilities = validateAbilities(abilitiesData);
    expect(Object.keys(abilities).length).toBeGreaterThan(0);
    expect(abilities['vibro_blade']?.name).toBe('Vibro-Blade');

    const party = validateCombatants(partyData, 'party');
    expect(Object.keys(party).length).toBe(4);

    const enemies = validateCombatants(enemiesData, 'enemies');
    expect(Object.keys(enemies).length).toBeGreaterThan(0);

    const encounters = validateEncounters(encountersData);
    expect(Object.keys(encounters).length).toBeGreaterThan(0);
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
        espCost: 0,
        powerMultiplier: 1.0,
        targetScope: 'single_enemy',
        description: 'test',
      },
      {
        id: 'dupe',
        name: 'Second',
        category: 'melee',
        espCost: 0,
        powerMultiplier: 1.0,
        targetScope: 'single_enemy',
        description: 'test',
      },
    ];

    expect(() => validateAbilities(duplicates)).toThrow(ValidationError);
  });
});
