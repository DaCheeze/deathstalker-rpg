import type {
  ExpeditionExplorationFieldContactDefinition,
  ExpeditionExplorationMapDefinition,
  ExpeditionFieldContactAdvantage,
  ExpeditionFieldContactTrigger,
  WorldLoopPoint,
} from './types';

type FieldContactMap = Pick<
  ExpeditionExplorationMapDefinition,
  'bounds' | 'walkableAreas'
>;

const DEGREES_TO_RADIANS = Math.PI / 180;

export function isExpeditionPointWalkable(
  map: FieldContactMap,
  point: WorldLoopPoint
): boolean {
  return (
    point.x >= map.bounds.minX && point.x <= map.bounds.maxX &&
    point.y >= map.bounds.minY && point.y <= map.bounds.maxY &&
    map.walkableAreas.some((area) => (
      point.x >= area.x && point.x < area.x + area.width &&
      point.y >= area.y && point.y < area.y + area.height
    ))
  );
}

export function isPlayerDetectedByFieldContact(
  contact: ExpeditionExplorationFieldContactDefinition,
  playerPosition: WorldLoopPoint
): boolean {
  const offsetX = playerPosition.x - contact.position.x;
  const offsetY = playerPosition.y - contact.position.y;
  const distance = Math.hypot(offsetX, offsetY);
  if (distance > contact.awarenessRange) return false;
  if (distance <= Number.EPSILON) return true;

  const facingLength = Math.hypot(contact.facing.x, contact.facing.y);
  const facingX = contact.facing.x / facingLength;
  const facingY = contact.facing.y / facingLength;
  const directionX = offsetX / distance;
  const directionY = offsetY / distance;
  const dot = Math.max(-1, Math.min(1, facingX * directionX + facingY * directionY));
  const threshold = Math.cos(contact.awarenessHalfAngleDegrees * DEGREES_TO_RADIANS);
  return dot >= threshold;
}

export function resolveExpeditionFieldContactTrigger(
  map: FieldContactMap,
  contact: ExpeditionExplorationFieldContactDefinition,
  playerPosition: WorldLoopPoint,
  trigger: ExpeditionFieldContactTrigger
): ExpeditionFieldContactAdvantage {
  if (!isExpeditionPointWalkable(map, playerPosition)) {
    throw new Error('Field-contact player position is not walkable');
  }
  const distance = Math.hypot(
    playerPosition.x - contact.position.x,
    playerPosition.y - contact.position.y
  );
  const detected = isPlayerDetectedByFieldContact(contact, playerPosition);

  if (trigger === 'player_strike') {
    if (distance > contact.fieldStrikeRange) {
      throw new Error(`Field contact '${contact.id}' is outside field-strike range`);
    }
    if (detected) {
      throw new Error(`Field contact '${contact.id}' has already detected the player`);
    }
    return 'player';
  }
  if (trigger === 'enemy_contact') {
    if (!detected) {
      throw new Error(`Field contact '${contact.id}' has not detected the player`);
    }
    return 'enemy';
  }
  if (distance > contact.collisionRadius) {
    throw new Error(`Field contact '${contact.id}' is outside mutual-contact range`);
  }
  if (detected) {
    throw new Error(`Field contact '${contact.id}' must use enemy contact after detection`);
  }
  return 'normal';
}
