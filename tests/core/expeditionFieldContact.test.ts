import { describe, expect, it } from 'vitest';
import {
  isPlayerDetectedByFieldContact,
  resolveExpeditionFieldContactTrigger,
} from '../../src/core/expeditionFieldContact';
import type {
  ExpeditionExplorationFieldContactDefinition,
  ExpeditionExplorationMapDefinition,
} from '../../src/core/types';

const contact: ExpeditionExplorationFieldContactDefinition = {
  id: 'visible_contact',
  encounterId: 'test_encounter',
  position: { x: 500, y: 500 },
  facing: { x: 1, y: 0 },
  awarenessRange: 240,
  awarenessHalfAngleDegrees: 55,
  fieldStrikeRange: 105,
  collisionRadius: 45,
  required: false,
  persistent: true,
};

const map: ExpeditionExplorationMapDefinition = {
  id: 'test_map',
  bounds: { minX: 0, minY: 0, maxX: 1000, maxY: 1000 },
  defaultEntryPosition: { x: 100, y: 500 },
  walkableAreas: [{ x: 0, y: 0, width: 1000, height: 1000 }],
  mainRoute: [{ x: 100, y: 500 }, { x: 900, y: 500 }],
  secondaryRoutes: [],
  landmarks: [{
    id: 'goal',
    kind: 'goal',
    guidanceRole: 'objective',
    position: { x: 900, y: 500 },
  }],
  fieldContacts: [contact],
  objectiveLandmarkId: 'goal',
  interactionRadius: 80,
};

describe('expedition field-contact initiation', () => {
  it('grants player advantage for a legal strike from behind', () => {
    const behind = { x: 410, y: 500 };
    expect(isPlayerDetectedByFieldContact(contact, behind)).toBe(false);
    expect(resolveExpeditionFieldContactTrigger(map, contact, behind, 'player_strike'))
      .toBe('player');
  });

  it('grants enemy advantage after the player enters the awareness cone', () => {
    const ahead = { x: 650, y: 500 };
    expect(isPlayerDetectedByFieldContact(contact, ahead)).toBe(true);
    expect(resolveExpeditionFieldContactTrigger(map, contact, ahead, 'enemy_contact'))
      .toBe('enemy');
  });

  it('uses normal initiative for rear collision without a field strike', () => {
    expect(resolveExpeditionFieldContactTrigger(
      map,
      contact,
      { x: 460, y: 500 },
      'mutual_contact'
    )).toBe('normal');
  });

  it('rejects fabricated initiation states and unwalkable positions', () => {
    expect(() => resolveExpeditionFieldContactTrigger(
      map,
      contact,
      { x: 650, y: 500 },
      'player_strike'
    )).toThrow('outside field-strike range');
    expect(() => resolveExpeditionFieldContactTrigger(
      map,
      contact,
      { x: 410, y: 500 },
      'enemy_contact'
    )).toThrow('has not detected');
    expect(() => resolveExpeditionFieldContactTrigger(
      map,
      contact,
      { x: 1200, y: 500 },
      'enemy_contact'
    )).toThrow('not walkable');
  });
});
