import { Buffer } from 'node:buffer';
import console from 'node:console';
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { isDeepStrictEqual } from 'node:util';
import { deflateSync, inflateSync } from 'node:zlib';

const SCHEMA_PATH = 'docs/design/schemas/godot-combatant-raster-package-v1.schema.json';
const PACKAGE_DIRECTORY = 'art/runtime/combatants';
const PACKAGE_FORMAT = 'deathstalker-combatant-raster-package';
const MANIFEST_FORMAT = 'deathstalker-combatant-asset-manifest';
const FRAME_SIZE = 512;
const MAX_ATLAS_SIZE = 4096;
const SAFE_TOP_AND_SIDES = 32;
const SAFE_BOTTOM = 40;
const ASSET_REGISTER_PATH = 'art/GENERATED-ASSET-REGISTER.md';
const ROLES = ['power-melee', 'critical-melee', 'queue-control-melee'];
const REQUIRED_SOCKETS = ['weapon_tip', 'muzzle', 'hand', 'core', 'head', 'hit_center'];
const CLIP_RULES = {
  ranged_idle: { loop: true, holdLastFrame: false, events: {} },
  closing_idle: { loop: true, holdLastFrame: false, events: {} },
  advance: { loop: true, holdLastFrame: false, events: { footfall: 'optional-many' } },
  engage: { loop: false, holdLastFrame: false, events: {} },
  engaged_idle: { loop: true, holdLastFrame: false, events: {} },
  melee_anticipation: { loop: false, holdLastFrame: false, events: {} },
  melee_contact: { loop: false, holdLastFrame: false, events: { contact: 1 } },
  melee_recovery: { loop: false, holdLastFrame: false, events: {} },
  signature: { loop: false, holdLastFrame: false, events: { contact: 1 } },
  disruptor_draw_aim: { loop: false, holdLastFrame: false, events: {} },
  disruptor_fire: {
    loop: false,
    holdLastFrame: false,
    events: { muzzle: 1, beam_start: 1 },
  },
  disruptor_recovery: { loop: false, holdLastFrame: false, events: {} },
  hit: { loop: false, holdLastFrame: false, events: {} },
  defeat: { loop: false, holdLastFrame: true, events: { defeat: 1 } },
};

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < CRC_TABLE.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) === 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[index] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function schemaTypeMatches(value, type) {
  switch (type) {
    case 'null':
      return value === null;
    case 'object':
      return isObject(value);
    case 'array':
      return Array.isArray(value);
    case 'integer':
      return Number.isInteger(value);
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    default:
      return typeof value === type;
  }
}

function resolveSchemaReference(rootSchema, reference) {
  if (!reference.startsWith('#/')) {
    throw new Error(`Unsupported external schema reference '${reference}'`);
  }
  return reference
    .slice(2)
    .split('/')
    .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'))
    .reduce((node, part) => node?.[part], rootSchema);
}

function validateAgainstSchema(value, schema, rootSchema, location, errors) {
  if (!isObject(schema)) {
    errors.push(`${location}: schema node is not an object`);
    return;
  }

  if (typeof schema.$ref === 'string') {
    const referenced = resolveSchemaReference(rootSchema, schema.$ref);
    if (!referenced) {
      errors.push(`${location}: unresolved schema reference '${schema.$ref}'`);
      return;
    }
    validateAgainstSchema(value, referenced, rootSchema, location, errors);
  }

  if (schema.type !== undefined) {
    const accepted = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!accepted.some((type) => schemaTypeMatches(value, type))) {
      errors.push(`${location}: expected type ${accepted.join(' or ')}`);
      return;
    }
  }

  if ('const' in schema && !isDeepStrictEqual(value, schema.const)) {
    errors.push(`${location}: expected constant ${JSON.stringify(schema.const)}`);
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((entry) => isDeepStrictEqual(value, entry))) {
    errors.push(`${location}: value is not in the allowed enum`);
  }

  if (typeof value === 'string') {
    if (Number.isInteger(schema.minLength) && value.length < schema.minLength) {
      errors.push(`${location}: string is shorter than ${schema.minLength}`);
    }
    if (Number.isInteger(schema.maxLength) && value.length > schema.maxLength) {
      errors.push(`${location}: string is longer than ${schema.maxLength}`);
    }
    if (typeof schema.pattern === 'string' && !new RegExp(schema.pattern, 'u').test(value)) {
      errors.push(`${location}: string does not match required pattern`);
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (typeof schema.minimum === 'number' && value < schema.minimum) {
      errors.push(`${location}: value is below minimum ${schema.minimum}`);
    }
    if (typeof schema.maximum === 'number' && value > schema.maximum) {
      errors.push(`${location}: value is above maximum ${schema.maximum}`);
    }
    if (typeof schema.exclusiveMinimum === 'number' && value <= schema.exclusiveMinimum) {
      errors.push(`${location}: value must be greater than ${schema.exclusiveMinimum}`);
    }
    if (
      typeof schema.multipleOf === 'number' &&
      Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > 1e-9
    ) {
      errors.push(`${location}: value is not a multiple of ${schema.multipleOf}`);
    }
  }

  if (Array.isArray(value)) {
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) {
      errors.push(`${location}: requires at least ${schema.minItems} item(s)`);
    }
    if (schema.uniqueItems === true) {
      for (let left = 0; left < value.length; left += 1) {
        for (let right = left + 1; right < value.length; right += 1) {
          if (isDeepStrictEqual(value[left], value[right])) {
            errors.push(`${location}: items ${left} and ${right} are duplicates`);
          }
        }
      }
    }
    if (isObject(schema.items)) {
      value.forEach((item, index) => {
        validateAgainstSchema(item, schema.items, rootSchema, `${location}[${index}]`, errors);
      });
    }
  }

  if (isObject(value)) {
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!Object.hasOwn(value, key)) {
          errors.push(`${location}: missing required property '${key}'`);
        }
      }
    }
    if (isObject(schema.properties)) {
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        if (Object.hasOwn(value, key)) {
          validateAgainstSchema(
            value[key],
            propertySchema,
            rootSchema,
            `${location}.${key}`,
            errors
          );
        }
      }
      if (schema.additionalProperties === false) {
        for (const key of Object.keys(value)) {
          if (!Object.hasOwn(schema.properties, key)) {
            errors.push(`${location}: unknown property '${key}'`);
          }
        }
      }
    }
  }

  if (Array.isArray(schema.allOf)) {
    for (const child of schema.allOf) {
      validateAgainstSchema(value, child, rootSchema, location, errors);
    }
  }
  if (Array.isArray(schema.oneOf)) {
    const matches = schema.oneOf.filter((child) => {
      const branchErrors = [];
      validateAgainstSchema(value, child, rootSchema, location, branchErrors);
      return branchErrors.length === 0;
    });
    if (matches.length !== 1) {
      errors.push(`${location}: expected exactly one oneOf branch, got ${matches.length}`);
    }
  }
  if (isObject(schema.if)) {
    const conditionErrors = [];
    validateAgainstSchema(value, schema.if, rootSchema, location, conditionErrors);
    const branch = conditionErrors.length === 0 ? schema.then : schema.else;
    if (isObject(branch)) {
      validateAgainstSchema(value, branch, rootSchema, location, errors);
    }
  }
}

function paeth(left, up, upperLeft) {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);
  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) return left;
  if (upDistance <= upperLeftDistance) return up;
  return upperLeft;
}

function decodeRgbaPng(buffer, label, requireSrgb, errors) {
  const localErrors = [];
  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    errors.push(`${label}: missing PNG signature`);
    return null;
  }

  let offset = 8;
  let ihdr = null;
  let sawIdat = false;
  let idatClosed = false;
  let sawIend = false;
  let srgbCount = 0;
  const idatParts = [];
  const allowedCriticalChunks = new Set(['IHDR', 'PLTE', 'IDAT', 'IEND']);

  while (offset < buffer.length) {
    if (offset + 12 > buffer.length) {
      localErrors.push(`${label}: truncated PNG chunk header`);
      break;
    }
    const length = buffer.readUInt32BE(offset);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > buffer.length) {
      localErrors.push(`${label}: truncated PNG chunk payload`);
      break;
    }
    const typeBytes = buffer.subarray(offset + 4, offset + 8);
    const type = typeBytes.toString('ascii');
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    const expectedCrc = buffer.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(Buffer.concat([typeBytes, data]));
    if (expectedCrc !== actualCrc) {
      localErrors.push(`${label}: CRC mismatch in ${type} chunk`);
    }
    if ((type.charCodeAt(0) & 32) === 0 && !allowedCriticalChunks.has(type)) {
      localErrors.push(`${label}: unsupported critical PNG chunk '${type}'`);
    }

    if (type === 'IHDR') {
      if (ihdr !== null || offset !== 8 || length !== 13) {
        localErrors.push(`${label}: IHDR must be one 13-byte first chunk`);
      } else {
        ihdr = {
          width: data.readUInt32BE(0),
          height: data.readUInt32BE(4),
          bitDepth: data[8],
          colorType: data[9],
          compression: data[10],
          filter: data[11],
          interlace: data[12],
        };
      }
    } else if (type === 'IDAT') {
      if (idatClosed) localErrors.push(`${label}: IDAT chunks are not contiguous`);
      sawIdat = true;
      idatParts.push(data);
    } else {
      if (sawIdat) idatClosed = true;
      if (type === 'sRGB') {
        srgbCount += 1;
        if (length !== 1 || data[0] > 3 || sawIdat) {
          localErrors.push(`${label}: invalid or misplaced sRGB chunk`);
        }
      }
      if (type === 'IEND') {
        if (length !== 0) localErrors.push(`${label}: IEND chunk must be empty`);
        sawIend = true;
        offset = chunkEnd;
        if (offset !== buffer.length) localErrors.push(`${label}: bytes follow IEND`);
        break;
      }
    }
    offset = chunkEnd;
  }

  if (ihdr === null) localErrors.push(`${label}: missing IHDR chunk`);
  if (!sawIdat) localErrors.push(`${label}: missing IDAT chunk`);
  if (!sawIend) localErrors.push(`${label}: missing IEND chunk`);
  if (requireSrgb && srgbCount !== 1) {
    localErrors.push(`${label}: requires exactly one sRGB chunk`);
  }
  if (ihdr !== null) {
    if (ihdr.width < 1 || ihdr.height < 1 || ihdr.width > MAX_ATLAS_SIZE || ihdr.height > MAX_ATLAS_SIZE) {
      localErrors.push(`${label}: dimensions must be between 1 and ${MAX_ATLAS_SIZE}`);
    }
    if (ihdr.bitDepth !== 8) localErrors.push(`${label}: PNG bit depth must be 8`);
    if (ihdr.colorType !== 6) localErrors.push(`${label}: PNG color type must be 6 (RGBA)`);
    if (ihdr.compression !== 0 || ihdr.filter !== 0) {
      localErrors.push(`${label}: unsupported PNG compression or filter method`);
    }
    if (ihdr.interlace !== 0) localErrors.push(`${label}: PNG must be non-interlaced`);
  }
  if (localErrors.length > 0 || ihdr === null) {
    errors.push(...localErrors);
    return null;
  }

  const stride = ihdr.width * 4;
  const expectedLength = (stride + 1) * ihdr.height;
  let filtered;
  try {
    filtered = inflateSync(Buffer.concat(idatParts), { maxOutputLength: expectedLength + 1 });
  } catch (error) {
    errors.push(`${label}: IDAT decompression failed: ${error.message}`);
    return null;
  }
  if (filtered.length !== expectedLength) {
    errors.push(`${label}: decoded byte length ${filtered.length} does not equal ${expectedLength}`);
    return null;
  }

  const rgba = Buffer.alloc(stride * ihdr.height);
  for (let row = 0; row < ihdr.height; row += 1) {
    const filterType = filtered[row * (stride + 1)];
    if (filterType > 4) {
      errors.push(`${label}: unsupported row filter ${filterType}`);
      return null;
    }
    const sourceStart = row * (stride + 1) + 1;
    const outputStart = row * stride;
    for (let columnByte = 0; columnByte < stride; columnByte += 1) {
      const left = columnByte >= 4 ? rgba[outputStart + columnByte - 4] : 0;
      const up = row > 0 ? rgba[outputStart - stride + columnByte] : 0;
      const upperLeft =
        row > 0 && columnByte >= 4 ? rgba[outputStart - stride + columnByte - 4] : 0;
      let predictor = 0;
      if (filterType === 1) predictor = left;
      if (filterType === 2) predictor = up;
      if (filterType === 3) predictor = Math.floor((left + up) / 2);
      if (filterType === 4) predictor = paeth(left, up, upperLeft);
      rgba[outputStart + columnByte] = (filtered[sourceStart + columnByte] + predictor) & 0xff;
    }
  }

  return { width: ihdr.width, height: ihdr.height, rgba };
}

function asRepositoryPath(value) {
  if (typeof value !== 'string') return null;
  if (
    value.length === 0 ||
    value.includes('\\') ||
    value.includes('//') ||
    path.posix.isAbsolute(value) ||
    /^[A-Za-z]:/u.test(value)
  ) {
    return null;
  }
  const parts = value.split('/');
  if (parts.some((part) => part === '' || part === '.' || part === '..')) return null;
  return parts.join('/');
}

function resolveInsideRoot(root, repositoryPath) {
  const normalized = asRepositoryPath(repositoryPath);
  if (normalized === null) return null;
  const candidate = path.resolve(root, ...normalized.split('/'));
  const relative = path.relative(root, candidate);
  if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return null;
  }
  return candidate;
}

async function readRepositoryFile(root, rootRealPath, repositoryPath, label, errors) {
  const absolutePath = resolveInsideRoot(root, repositoryPath);
  if (absolutePath === null) {
    errors.push(`${label}: invalid or escaping repository path '${repositoryPath}'`);
    return null;
  }
  let fileInfo;
  try {
    fileInfo = await lstat(absolutePath);
  } catch {
    errors.push(`${label}: referenced file '${repositoryPath}' does not exist`);
    return null;
  }
  if (!fileInfo.isFile() || fileInfo.isSymbolicLink()) {
    errors.push(`${label}: referenced path '${repositoryPath}' is not a regular file`);
    return null;
  }
  const resolvedRealPath = await realpath(absolutePath);
  const realRelative = path.relative(rootRealPath, resolvedRealPath);
  if (realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
    errors.push(`${label}: referenced file '${repositoryPath}' resolves outside the repository`);
    return null;
  }
  try {
    return await readFile(absolutePath);
  } catch (error) {
    errors.push(`${label}: could not read '${repositoryPath}': ${error.message}`);
    return null;
  }
}

function expectedPackageId(document) {
  const side = document?.prototype?.deploymentSide;
  const role = document?.prototype?.role;
  const choice = document?.approval?.conceptDirection?.choice;
  if (
    !['party', 'opponent'].includes(side) ||
    !ROLES.includes(role) ||
    !['A', 'B'].includes(choice)
  ) {
    return null;
  }
  const expression = new RegExp(
    `^range-band-${side}-${role}-choice-${choice.toLowerCase()}-v([1-9][0-9]*)$`,
    'u'
  );
  return expression.test(document.packageId) ? document.packageId : null;
}

function validateApproval(document, errors) {
  if (!isObject(document.approval)) return;
  const { conceptDirection, motionPipeline, assetStatus, developerReviewRecord } =
    document.approval;
  if (
    isObject(conceptDirection) &&
    isObject(motionPipeline) &&
    typeof assetStatus === 'string'
  ) {
    const requiresReview =
      conceptDirection.status !== 'unapproved' ||
      motionPipeline.status !== 'unapproved' ||
      ['asset-approved', 'integrated', 'rejected'].includes(assetStatus);
    if (requiresReview && typeof developerReviewRecord !== 'string') {
      errors.push(
        'approval.developerReviewRecord: reviewed decisions and non-proposed assets require a review record'
      );
    }
    if (
      ['asset-approved', 'integrated'].includes(assetStatus) &&
      conceptDirection.status !== 'approved'
    ) {
      errors.push(`approval: ${assetStatus} requires conceptDirection.status 'approved'`);
    }
    if (
      ['asset-approved', 'integrated'].includes(assetStatus) &&
      motionPipeline.status !== 'approved'
    ) {
      errors.push(`approval: ${assetStatus} requires motionPipeline.status 'approved'`);
    }
    if (
      [conceptDirection.status, motionPipeline.status].includes('rejected') &&
      assetStatus !== 'rejected'
    ) {
      errors.push("approval: a rejected decision requires assetStatus 'rejected'");
    }
  }
}

function validateAnimations(document, frameIds, usedFrameIds, errors) {
  if (!isObject(document.animations)) return;
  for (const [clipName, rule] of Object.entries(CLIP_RULES)) {
    const clip = document.animations[clipName];
    if (!isObject(clip) || !Array.isArray(clip.frames)) continue;
    if (clip.loop !== rule.loop) {
      errors.push(`animations.${clipName}.loop: expected ${rule.loop}`);
    }
    if (clip.holdLastFrame !== rule.holdLastFrame) {
      errors.push(
        `animations.${clipName}.holdLastFrame: expected ${rule.holdLastFrame}`
      );
    }
    const eventCounts = new Map();
    clip.frames.forEach((clipFrame, frameIndex) => {
      if (!isObject(clipFrame)) return;
      if (typeof clipFrame.frameId === 'string') {
        if (!frameIds.has(clipFrame.frameId)) {
          errors.push(
            `animations.${clipName}.frames[${frameIndex}].frameId: unknown frame '${clipFrame.frameId}'`
          );
        } else {
          usedFrameIds.add(clipFrame.frameId);
        }
      }
      if (!Array.isArray(clipFrame.events)) return;
      clipFrame.events.forEach((event, eventIndex) => {
        if (!isObject(event)) return;
        if (
          Number.isInteger(event.atMs) &&
          Number.isInteger(clipFrame.durationMs) &&
          event.atMs >= clipFrame.durationMs
        ) {
          errors.push(
            `animations.${clipName}.frames[${frameIndex}].events[${eventIndex}].atMs: must be less than frame duration ${clipFrame.durationMs}`
          );
        }
        if (typeof event.name === 'string') {
          eventCounts.set(event.name, (eventCounts.get(event.name) ?? 0) + 1);
        }
      });
    });

    const allowedEvents = new Set(Object.keys(rule.events));
    for (const eventName of eventCounts.keys()) {
      if (!allowedEvents.has(eventName)) {
        errors.push(`animations.${clipName}: event '${eventName}' is not permitted`);
      }
    }
    for (const [eventName, count] of Object.entries(rule.events)) {
      if (count === 'optional-many') continue;
      if ((eventCounts.get(eventName) ?? 0) !== count) {
        errors.push(
          `animations.${clipName}: requires exactly ${count} '${eventName}' event(s)`
        );
      }
    }
  }
}

function alphaAt(image, x, y) {
  return image.rgba[(y * image.width + x) * 4 + 3];
}

function inspectAtlasFrames(document, atlasImage, errors) {
  if (!Array.isArray(document.frames) || !isObject(document.atlas)) return null;
  const frameIds = new Set();
  const occupiedCells = new Set();
  const usedFrameIds = new Set();
  let sharedAnchor = null;
  let tallestVisibleHeight = 0;

  document.frames.forEach((frame, frameIndex) => {
    if (!isObject(frame)) return;
    const label = `frames[${frameIndex}]`;
    if (typeof frame.id === 'string') {
      if (frameIds.has(frame.id)) errors.push(`${label}.id: duplicate frame ID '${frame.id}'`);
      frameIds.add(frame.id);
    }
    if (!isObject(frame.rect)) return;
    const { x, y, width, height } = frame.rect;
    if (![x, y, width, height].every(Number.isInteger)) return;
    if (
      width !== FRAME_SIZE ||
      height !== FRAME_SIZE ||
      x < 0 ||
      y < 0 ||
      x + width > atlasImage.width ||
      y + height > atlasImage.height
    ) {
      errors.push(`${label}.rect: frame cell is outside the decoded atlas`);
      return;
    }
    const cellKey = `${x / FRAME_SIZE},${y / FRAME_SIZE}`;
    if (occupiedCells.has(cellKey)) errors.push(`${label}.rect: duplicate occupied atlas cell`);
    occupiedCells.add(cellKey);

    if (isObject(frame.groundAnchor)) {
      const anchorKey = `${frame.groundAnchor.x},${frame.groundAnchor.y}`;
      if (sharedAnchor === null) sharedAnchor = anchorKey;
      if (anchorKey !== sharedAnchor) {
        errors.push(`${label}.groundAnchor: all package frames must share one anchor`);
      }
    }

    if (isObject(frame.safeBounds) && isObject(frame.groundAnchor)) {
      const bounds = frame.safeBounds;
      const boundsRight = bounds.x + bounds.width;
      const boundsBottom = bounds.y + bounds.height;
      if (
        bounds.x < SAFE_TOP_AND_SIDES ||
        bounds.y < SAFE_TOP_AND_SIDES ||
        boundsRight > FRAME_SIZE - SAFE_TOP_AND_SIDES ||
        boundsBottom > FRAME_SIZE - SAFE_BOTTOM
      ) {
        errors.push(`${label}.safeBounds: violates 32 px top/side or 40 px bottom safety`);
      }
      if (
        frame.groundAnchor.x < bounds.x ||
        frame.groundAnchor.x >= boundsRight ||
        frame.groundAnchor.y !== boundsBottom
      ) {
        errors.push(
          `${label}.groundAnchor: must be horizontally inside safeBounds and on its exclusive bottom edge`
        );
      }

      let visiblePixels = 0;
      let transparentPixels = 0;
      let minimumVisibleY = FRAME_SIZE;
      let maximumVisibleY = -1;
      let alphaOutsideBounds = false;
      let outerBorderAlpha = false;
      for (let localY = 0; localY < FRAME_SIZE; localY += 1) {
        for (let localX = 0; localX < FRAME_SIZE; localX += 1) {
          const alpha = alphaAt(atlasImage, x + localX, y + localY);
          if (alpha === 0) {
            transparentPixels += 1;
            continue;
          }
          visiblePixels += 1;
          if (
            localX === 0 ||
            localY === 0 ||
            localX === FRAME_SIZE - 1 ||
            localY === FRAME_SIZE - 1
          ) {
            outerBorderAlpha = true;
          }
          minimumVisibleY = Math.min(minimumVisibleY, localY);
          maximumVisibleY = Math.max(maximumVisibleY, localY);
          if (
            localX < bounds.x ||
            localX >= boundsRight ||
            localY < bounds.y ||
            localY >= boundsBottom
          ) {
            alphaOutsideBounds = true;
          }
        }
      }
      if (visiblePixels === 0) errors.push(`${label}: frame contains no visible pixel`);
      if (transparentPixels === 0) errors.push(`${label}: frame contains no transparent pixel`);
      if (alphaOutsideBounds) errors.push(`${label}: visible alpha lies outside safeBounds`);
      if (outerBorderAlpha) {
        errors.push(`${label}: frame outer border must be transparent`);
      }
      if (maximumVisibleY >= minimumVisibleY) {
        tallestVisibleHeight = Math.max(
          tallestVisibleHeight,
          maximumVisibleY - minimumVisibleY + 1
        );
      }
    }

    if (isObject(frame.sockets)) {
      for (const socketName of REQUIRED_SOCKETS) {
        if (!isObject(frame.sockets[socketName])) {
          errors.push(`${label}.sockets: missing required socket '${socketName}'`);
        }
      }
    }
  });

  for (let y = 0; y < atlasImage.height; y += 1) {
    for (let x = 0; x < atlasImage.width; x += 1) {
      if (alphaAt(atlasImage, x, y) === 0) continue;
      const cellKey = `${Math.floor(x / FRAME_SIZE)},${Math.floor(y / FRAME_SIZE)}`;
      if (!occupiedCells.has(cellKey)) {
        errors.push(`atlas: visible alpha found in undeclared cell ${cellKey}`);
        y = atlasImage.height;
        break;
      }
    }
  }

  validateAnimations(document, frameIds, usedFrameIds, errors);
  for (const frameId of frameIds) {
    if (!usedFrameIds.has(frameId)) errors.push(`frames: declared frame '${frameId}' is unused`);
  }

  const battleScale = document.prototype?.battleScale;
  if (
    tallestVisibleHeight > 0 &&
    isObject(battleScale) &&
    typeof battleScale.displayScale === 'number' &&
    Number.isInteger(battleScale.targetVisibleHeightPxAt1080)
  ) {
    const actualHeight = tallestVisibleHeight * battleScale.displayScale;
    if (Math.abs(actualHeight - battleScale.targetVisibleHeightPxAt1080) > 1) {
      errors.push(
        `prototype.battleScale: tallest visible frame scales to ${actualHeight.toFixed(3)} px, expected ${battleScale.targetVisibleHeightPxAt1080} +/- 1 px`
      );
    }
  }

  return { frameIds, sharedAnchor, tallestVisibleHeight };
}

function validateMaskAlpha(maskImage, atlasImage, label, errors) {
  if (maskImage.width !== atlasImage.width || maskImage.height !== atlasImage.height) {
    errors.push(
      `${label}: dimensions ${maskImage.width}x${maskImage.height} do not match atlas ${atlasImage.width}x${atlasImage.height}`
    );
    return;
  }
  for (let pixel = 0; pixel < maskImage.width * maskImage.height; pixel += 1) {
    const offset = pixel * 4 + 3;
    if (maskImage.rgba[offset] > 0 && atlasImage.rgba[offset] === 0) {
      errors.push(`${label}: mask alpha extends beyond base-atlas alpha`);
      return;
    }
  }
}

function exactObjectKeys(value, expectedKeys) {
  if (!isObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  return isDeepStrictEqual(actual, expected);
}

async function validateManifest(
  document,
  metadataRelativePath,
  root,
  rootRealPath,
  errors
) {
  const runtime = document.runtime;
  if (!isObject(runtime) || runtime.registrationStatus !== 'registered') return;
  if (typeof runtime.manifestPath !== 'string' || typeof runtime.manifestKey !== 'string') return;
  if (!runtime.manifestPath.endsWith('.json')) {
    errors.push('runtime.manifestPath: startup manifest must be a JSON file');
  }
  const manifestBytes = await readRepositoryFile(
    root,
    rootRealPath,
    runtime.manifestPath,
    'runtime.manifestPath',
    errors
  );
  if (manifestBytes === null) return;

  let manifest;
  try {
    manifest = JSON.parse(manifestBytes.toString('utf8'));
  } catch (error) {
    errors.push(`runtime.manifestPath: invalid JSON: ${error.message}`);
    return;
  }
  if (!exactObjectKeys(manifest, ['format', 'schemaVersion', 'combatants'])) {
    errors.push('runtime.manifestPath: manifest envelope must contain only format, schemaVersion, and combatants');
  }
  if (manifest.format !== MANIFEST_FORMAT) {
    errors.push(`runtime.manifestPath: format must be '${MANIFEST_FORMAT}'`);
  }
  if (manifest.schemaVersion !== 1) {
    errors.push('runtime.manifestPath: schemaVersion must be 1');
  }
  if (!isObject(manifest.combatants)) {
    errors.push('runtime.manifestPath: combatants must be an object');
    return;
  }
  if (manifest.combatants[runtime.manifestKey] !== metadataRelativePath) {
    errors.push(
      `runtime.manifestKey: manifest key '${runtime.manifestKey}' must map to '${metadataRelativePath}'`
    );
  }

  const mappedPaths = new Set();
  for (const [key, mappedPath] of Object.entries(manifest.combatants)) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(key)) {
      errors.push(`runtime.manifestPath: invalid combatant key '${key}'`);
    }
    if (typeof mappedPath !== 'string') {
      errors.push(`runtime.manifestPath: combatant '${key}' does not map to a string path`);
      continue;
    }
    if (
      !mappedPath.startsWith(`${PACKAGE_DIRECTORY}/`) ||
      !mappedPath.endsWith('-package.json')
    ) {
      errors.push(
        `runtime.manifestPath: combatant '${key}' must map to a v1 package metadata path`
      );
    }
    if (mappedPaths.has(mappedPath)) {
      errors.push(`runtime.manifestPath: duplicate metadata mapping '${mappedPath}'`);
    }
    mappedPaths.add(mappedPath);
    await readRepositoryFile(
      root,
      rootRealPath,
      mappedPath,
      `runtime.manifestPath.combatants.${key}`,
      errors
    );
  }
}

async function validatePackageDocument({
  document,
  metadataRelativePath,
  root,
  rootRealPath,
  schema,
}) {
  const errors = [];
  validateAgainstSchema(document, schema, schema, '$', errors);
  if (!isObject(document)) {
    return {
      document,
      metadataRelativePath,
      errors: [...new Set(errors)],
      summary: {},
    };
  }
  validateApproval(document, errors);

  const normalizedMetadataPath = asRepositoryPath(metadataRelativePath);
  if (
    normalizedMetadataPath === null ||
    !normalizedMetadataPath.startsWith(`${PACKAGE_DIRECTORY}/`) ||
    !normalizedMetadataPath.endsWith('-package.json')
  ) {
    errors.push(
      `metadata path: must be a repository-relative '${PACKAGE_DIRECTORY}/*-package.json' path`
    );
  }

  const validPackageId = expectedPackageId(document);
  if (validPackageId === null) {
    errors.push(
      'packageId: must match range-band-{party|opponent}-{role}-choice-{a|b}-v{positive revision} and its metadata'
    );
  } else if (
    normalizedMetadataPath !== `${PACKAGE_DIRECTORY}/${validPackageId}-package.json`
  ) {
    errors.push(
      `metadata path: package '${validPackageId}' must use '${PACKAGE_DIRECTORY}/${validPackageId}-package.json'`
    );
  }

  const approval = document.approval;
  if (
    isObject(approval) &&
    isObject(approval.conceptDirection) &&
    typeof document.packageId === 'string'
  ) {
    const choiceSegment = `-choice-${String(approval.conceptDirection.choice).toLowerCase()}-`;
    if (!document.packageId.includes(choiceSegment)) {
      errors.push('approval.conceptDirection.choice: does not match packageId choice segment');
    }
    if (
      typeof approval.developerReviewRecord === 'string' &&
      asRepositoryPath(approval.developerReviewRecord) !== null
    ) {
      await readRepositoryFile(
        root,
        rootRealPath,
        approval.developerReviewRecord,
        'approval.developerReviewRecord',
        errors
      );
    }
  }

  let atlasImage = null;
  let atlasInspection = null;
  if (isObject(document.atlas)) {
    const atlas = document.atlas;
    if (
      Number.isInteger(atlas.width) &&
      Number.isInteger(atlas.columns) &&
      atlas.width !== atlas.columns * FRAME_SIZE
    ) {
      errors.push('atlas: width must equal columns * 512');
    }
    if (
      Number.isInteger(atlas.height) &&
      Number.isInteger(atlas.rows) &&
      atlas.height !== atlas.rows * FRAME_SIZE
    ) {
      errors.push('atlas: height must equal rows * 512');
    }
    if (validPackageId !== null && atlas.path !== `${PACKAGE_DIRECTORY}/${validPackageId}-atlas.png`) {
      errors.push(`atlas.path: must be '${PACKAGE_DIRECTORY}/${validPackageId}-atlas.png'`);
    }
    if (typeof atlas.path === 'string') {
      const atlasBytes = await readRepositoryFile(
        root,
        rootRealPath,
        atlas.path,
        'atlas.path',
        errors
      );
      if (atlasBytes !== null) {
        atlasImage = decodeRgbaPng(atlasBytes, 'atlas.path', true, errors);
        if (
          atlasImage !== null &&
          (atlasImage.width !== atlas.width || atlasImage.height !== atlas.height)
        ) {
          errors.push(
            `atlas: decoded dimensions ${atlasImage.width}x${atlasImage.height} do not match metadata ${atlas.width}x${atlas.height}`
          );
        }
        if (atlasImage !== null) {
          atlasInspection = inspectAtlasFrames(document, atlasImage, errors);
        }
      }
    }
  }

  const materials = document.materials;
  if (isObject(materials) && Array.isArray(materials.families) && isObject(materials.masks)) {
    const hasEmissiveFamily = materials.families.includes('emissive-core');
    const hasEmissiveMask = typeof materials.masks.emissive === 'string';
    if (hasEmissiveFamily !== hasEmissiveMask) {
      errors.push(
        "materials: 'emissive-core' family and an emissive mask must either both be present or both be absent"
      );
    }
    for (const [maskName, maskPath] of Object.entries(materials.masks)) {
      if (maskPath === null) continue;
      if (typeof maskPath !== 'string') continue;
      if (
        validPackageId !== null &&
        maskPath !== `${PACKAGE_DIRECTORY}/${validPackageId}-${maskName}.png`
      ) {
        errors.push(
          `materials.masks.${maskName}: must be '${PACKAGE_DIRECTORY}/${validPackageId}-${maskName}.png'`
        );
      }
      const maskBytes = await readRepositoryFile(
        root,
        rootRealPath,
        maskPath,
        `materials.masks.${maskName}`,
        errors
      );
      if (maskBytes !== null) {
        const maskImage = decodeRgbaPng(
          maskBytes,
          `materials.masks.${maskName}`,
          maskName === 'emissive',
          errors
        );
        if (maskImage !== null && atlasImage !== null) {
          validateMaskAlpha(maskImage, atlasImage, `materials.masks.${maskName}`, errors);
        }
      }
    }
  }

  const provenance = document.provenance;
  if (isObject(provenance)) {
    if (
      typeof document.packageId === 'string' &&
      provenance.assetRegisterEntryId !== document.packageId
    ) {
      errors.push('provenance.assetRegisterEntryId: must equal packageId');
    }
    const registerBytes = await readRepositoryFile(
      root,
      rootRealPath,
      ASSET_REGISTER_PATH,
      'provenance.assetRegisterPath',
      errors
    );
    if (
      registerBytes !== null &&
      typeof provenance.assetRegisterEntryId === 'string' &&
      !registerBytes
        .toString('utf8')
        .includes(`<!-- asset-register-id: ${provenance.assetRegisterEntryId} -->`)
    ) {
      errors.push(
        `provenance.assetRegisterEntryId: marker not found in ${ASSET_REGISTER_PATH}`
      );
    }
    if (Array.isArray(provenance.sourcePaths)) {
      for (let index = 0; index < provenance.sourcePaths.length; index += 1) {
        const sourcePath = provenance.sourcePaths[index];
        if (typeof sourcePath === 'string') {
          await readRepositoryFile(
            root,
            rootRealPath,
            sourcePath,
            `provenance.sourcePaths[${index}]`,
            errors
          );
        }
      }
    }
    if (
      typeof provenance.transformationSummary === 'string' &&
      provenance.transformationSummary.trim().length === 0
    ) {
      errors.push('provenance.transformationSummary: must contain non-whitespace text');
    }
  }

  if (isObject(document.runtime) && isObject(document.approval)) {
    const shouldBeRegistered = document.approval.assetStatus === 'integrated';
    if (shouldBeRegistered !== (document.runtime.registrationStatus === 'registered')) {
      errors.push(
        "runtime.registrationStatus: must be 'registered' exactly when assetStatus is 'integrated'"
      );
    }
    await validateManifest(document, metadataRelativePath, root, rootRealPath, errors);
  }

  return {
    document,
    metadataRelativePath,
    errors: [...new Set(errors)],
    summary: {
      anchor: atlasInspection?.sharedAnchor ?? null,
      atlasPath: document.atlas?.path ?? null,
      conceptChoice: document.approval?.conceptDirection?.choice ?? null,
      motionChoice: document.approval?.motionPipeline?.choice ?? null,
      role: document.prototype?.role ?? null,
      side: document.prototype?.deploymentSide ?? null,
      scale: document.prototype?.battleScale ?? null,
    },
  };
}

function validatePrototypeSet(results) {
  const errors = [];
  if (results.length !== ROLES.length) {
    errors.push(`prototype set: expected exactly ${ROLES.length} packages, got ${results.length}`);
    return errors;
  }
  const invalidResultCount = results.filter((result) => result.errors.length > 0).length;
  if (invalidResultCount > 0) {
    errors.push(`prototype set: ${invalidResultCount} package(s) failed individual validation`);
  }

  const summaries = results.map((result) => result.summary);
  const roles = summaries.map((summary) => summary.role);
  for (const role of ROLES) {
    if (roles.filter((candidate) => candidate === role).length !== 1) {
      errors.push(`prototype set: requires exactly one '${role}' package`);
    }
  }
  const uniqueValues = (selector) => new Set(summaries.map(selector));
  const sharedRules = [
    ['deployment side', (summary) => summary.side],
    ['ground anchor', (summary) => summary.anchor],
    ['concept choice', (summary) => summary.conceptChoice],
    ['motion pipeline', (summary) => summary.motionChoice],
    ['scale group', (summary) => summary.scale?.group],
    ['reference viewport width', (summary) => summary.scale?.referenceViewportWidth],
    ['reference viewport height', (summary) => summary.scale?.referenceViewportHeight],
    ['target visible height', (summary) => summary.scale?.targetVisibleHeightPxAt1080],
  ];
  for (const [label, selector] of sharedRules) {
    if (uniqueValues(selector).size !== 1) {
      errors.push(`prototype set: packages do not share one ${label}`);
    }
  }
  if (uniqueValues((summary) => summary.atlasPath).size !== results.length) {
    errors.push('prototype set: atlas paths must be unique');
  }
  const packageIds = results.map((result) => result.document?.packageId);
  if (new Set(packageIds).size !== results.length) {
    errors.push('prototype set: package IDs must be unique');
  }
  return errors;
}

function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(data.length + 12);
  chunk.writeUInt32BE(data.length, 0);
  typeBytes.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), data.length + 8);
  return chunk;
}

function createTestPng({ colorType = 6, edgeAlpha = false } = {}) {
  const width = FRAME_SIZE;
  const height = FRAME_SIZE;
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const stride = width * bytesPerPixel;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < width; x += 1) {
      const pixelStart = rowStart + 1 + x * bytesPerPixel;
      const visible = x >= 230 && x <= 281 && y >= 160 && y <= 471;
      raw[pixelStart] = visible ? 96 : 0;
      raw[pixelStart + 1] = visible ? 128 : 0;
      raw[pixelStart + 2] = visible ? 160 : 0;
      if (colorType === 6) raw[pixelStart + 3] = visible ? 255 : 0;
    }
  }
  if (edgeAlpha && colorType === 6) {
    raw[1] = 255;
    raw[2] = 255;
    raw[3] = 255;
    raw[4] = 255;
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk('IHDR', ihdr),
    pngChunk('sRGB', Buffer.from([0])),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createInterlacedTestPng() {
  const png = Buffer.from(createTestPng());
  png[28] = 1;
  png.writeUInt32BE(crc32(png.subarray(12, 29)), 29);
  return png;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createFixturePackage({
  role,
  side = 'party',
  conceptChoice = 'A',
  motionChoice = 'full-frame-raster',
  integrated = false,
}) {
  const packageId =
    `range-band-${side}-${role}-choice-${conceptChoice.toLowerCase()}-v1`;
  const frameId = 'pose';
  const animations = {};
  for (const [clipName, rule] of Object.entries(CLIP_RULES)) {
    const events = [];
    for (const [eventName, count] of Object.entries(rule.events)) {
      if (count === 1 || eventName === 'footfall') events.push({ name: eventName, atMs: 50 });
    }
    animations[clipName] = {
      loop: rule.loop,
      holdLastFrame: rule.holdLastFrame,
      frames: [{ frameId, durationMs: 100, events }],
    };
  }
  return {
    format: PACKAGE_FORMAT,
    schemaVersion: 1,
    packageId,
    prototype: {
      scope: 'three-character-range-band-v1',
      role,
      deploymentSide: side,
      facing: side === 'party' ? 'left' : 'right',
      battleScale: {
        group: 'range-band-prototype-human-v1',
        referenceViewportWidth: 1920,
        referenceViewportHeight: 1080,
        targetVisibleHeightPxAt1080: 312,
        displayScale: 1,
      },
    },
    approval: {
      conceptDirection: {
        status: integrated ? 'approved' : 'unapproved',
        choice: conceptChoice,
      },
      motionPipeline: {
        status: integrated ? 'approved' : 'unapproved',
        choice: motionChoice,
      },
      assetStatus: integrated ? 'integrated' : 'proposed',
      developerReviewRecord: integrated ? 'docs/reviews/combatant-review.md' : null,
    },
    atlas: {
      path: `${PACKAGE_DIRECTORY}/${packageId}-atlas.png`,
      width: 512,
      height: 512,
      frameWidth: 512,
      frameHeight: 512,
      columns: 1,
      rows: 1,
      colorModel: 'RGBA8',
      alphaMode: 'straight',
      colorSpace: 'sRGB',
    },
    frames: [
      {
        id: frameId,
        rect: { x: 0, y: 0, width: 512, height: 512 },
        groundAnchor: { x: 256, y: 472 },
        safeBounds: { x: 220, y: 140, width: 72, height: 332 },
        sockets: {
          weapon_tip: { x: 275, y: 300 },
          muzzle: { x: 280, y: 310 },
          hand: { x: 260, y: 315 },
          core: { x: 256, y: 300 },
          head: { x: 256, y: 180 },
          hit_center: { x: 256, y: 315 },
        },
      },
    ],
    animations,
    materials: {
      families: ['matte-cloth', 'worn-metal'],
      masks: { emissive: null, normal: null },
      bakedLayers: {
        contactShadow: false,
        environmentGrade: false,
        bloom: false,
        beam: false,
        impact: false,
        particles: false,
        ui: false,
      },
    },
    provenance: {
      assetRegisterPath: ASSET_REGISTER_PATH,
      assetRegisterEntryId: packageId,
      sourcePaths: [`art/sources/${packageId}-source.png`],
      transformationSummary: 'Deterministic validator fixture; no production art.',
    },
    runtime: {
      registrationStatus: integrated ? 'registered' : 'not-registered',
      manifestPath: integrated ? 'manifests/combatants.json' : null,
      manifestKey: integrated ? `prototype-${side}-${role}` : null,
    },
  };
}

async function writeFixturePackage(root, document, pngBytes) {
  const metadataPath = `${PACKAGE_DIRECTORY}/${document.packageId}-package.json`;
  const atlasPath = document.atlas.path;
  const sourcePath = document.provenance.sourcePaths[0];
  for (const repositoryPath of [metadataPath, atlasPath, sourcePath]) {
    await mkdir(path.dirname(path.join(root, ...repositoryPath.split('/'))), {
      recursive: true,
    });
  }
  await writeFile(path.join(root, ...metadataPath.split('/')), `${JSON.stringify(document, null, 2)}\n`);
  await writeFile(path.join(root, ...atlasPath.split('/')), pngBytes);
  await writeFile(path.join(root, ...sourcePath.split('/')), pngBytes);
  return metadataPath;
}

async function runSelfTest(schema) {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'combatant-raster-v1-'));
  const checks = [];
  const pass = (name) => {
    checks.push(name);
    console.log(`[SELF-TEST PASS] ${name}`);
  };
  const requireClean = (name, errors) => {
    if (errors.length > 0) {
      throw new Error(`${name} unexpectedly failed:\n${errors.join('\n')}`);
    }
    pass(name);
  };
  const requireFailure = (name, errors, expectedText) => {
    if (!errors.some((error) => error.includes(expectedText))) {
      throw new Error(
        `${name} did not report '${expectedText}'. Errors:\n${errors.join('\n') || '(none)'}`
      );
    }
    pass(name);
  };

  try {
    const validPng = createTestPng();
    const partyPackages = ROLES.map((role) => createFixturePackage({ role }));
    const integratedPackage = createFixturePackage({
      role: 'power-melee',
      side: 'opponent',
      conceptChoice: 'B',
      motionChoice: 'deliberate-hybrid',
      integrated: true,
    });
    const allPackages = [...partyPackages, integratedPackage];
    await mkdir(path.join(temporaryRoot, 'art'), { recursive: true });
    await mkdir(path.join(temporaryRoot, 'docs', 'reviews'), { recursive: true });
    await mkdir(path.join(temporaryRoot, 'manifests'), { recursive: true });
    await writeFile(
      path.join(temporaryRoot, ...ASSET_REGISTER_PATH.split('/')),
      `# Fixture register\n\n${allPackages
        .map((document) => `<!-- asset-register-id: ${document.packageId} -->`)
        .join('\n')}\n`
    );
    await writeFile(
      path.join(temporaryRoot, 'docs', 'reviews', 'combatant-review.md'),
      '# Fixture review\n'
    );
    const metadataPaths = [];
    for (const document of allPackages) {
      metadataPaths.push(await writeFixturePackage(temporaryRoot, document, validPng));
    }
    await writeFile(
      path.join(temporaryRoot, 'manifests', 'combatants.json'),
      `${JSON.stringify(
        {
          format: MANIFEST_FORMAT,
          schemaVersion: 1,
          combatants: {
            [integratedPackage.runtime.manifestKey]: metadataPaths.at(-1),
          },
        },
        null,
        2
      )}\n`
    );
    const rootRealPath = await realpath(temporaryRoot);
    const validate = (document, metadataRelativePath) =>
      validatePackageDocument({
        document,
        metadataRelativePath,
        root: temporaryRoot,
        rootRealPath,
        schema,
      });

    const proposedResult = await validate(partyPackages[0], metadataPaths[0]);
    requireClean('positive proposed package', proposedResult.errors);

    const integratedResult = await validate(integratedPackage, metadataPaths.at(-1));
    requireClean('positive integrated manifest package', integratedResult.errors);

    const setResults = [];
    for (let index = 0; index < partyPackages.length; index += 1) {
      setResults.push(await validate(partyPackages[index], metadataPaths[index]));
    }
    requireClean(
      'positive complete three-role set',
      [...setResults.flatMap((result) => result.errors), ...validatePrototypeSet(setResults)]
    );

    const maskedPackage = clone(partyPackages[0]);
    const emissiveMaskPath =
      `${PACKAGE_DIRECTORY}/${maskedPackage.packageId}-emissive.png`;
    const normalMaskPath =
      `${PACKAGE_DIRECTORY}/${maskedPackage.packageId}-normal.png`;
    const emissiveMaskAbsolutePath = path.join(
      temporaryRoot,
      ...emissiveMaskPath.split('/')
    );
    const normalMaskAbsolutePath = path.join(
      temporaryRoot,
      ...normalMaskPath.split('/')
    );
    maskedPackage.materials.families.push('emissive-core');
    maskedPackage.materials.masks.emissive = emissiveMaskPath;
    maskedPackage.materials.masks.normal = normalMaskPath;
    await writeFile(emissiveMaskAbsolutePath, validPng);
    await writeFile(normalMaskAbsolutePath, validPng);
    const maskedResult = await validate(maskedPackage, metadataPaths[0]);
    requireClean('positive emissive and normal material masks', maskedResult.errors);

    const badApproval = clone(partyPackages[0]);
    badApproval.approval.assetStatus = 'asset-approved';
    const badApprovalResult = await validate(badApproval, metadataPaths[0]);
    requireFailure(
      'negative approval gate',
      badApprovalResult.errors,
      "asset-approved requires conceptDirection.status 'approved'"
    );

    const manifestPath = path.join(temporaryRoot, 'manifests', 'combatants.json');
    const validManifest = await readFile(manifestPath);
    const wrongManifest = {
      format: MANIFEST_FORMAT,
      schemaVersion: 1,
      combatants: {
        [integratedPackage.runtime.manifestKey]:
          `${PACKAGE_DIRECTORY}/missing-package.json`,
      },
    };
    await writeFile(manifestPath, `${JSON.stringify(wrongManifest, null, 2)}\n`);
    const badManifestResult = await validate(integratedPackage, metadataPaths.at(-1));
    requireFailure('negative manifest mapping', badManifestResult.errors, 'must map to');
    await writeFile(manifestPath, validManifest);

    const atlasAbsolutePath = path.join(
      temporaryRoot,
      ...partyPackages[0].atlas.path.split('/')
    );
    await rm(atlasAbsolutePath);
    const missingFileResult = await validate(partyPackages[0], metadataPaths[0]);
    requireFailure('negative missing runtime file', missingFileResult.errors, 'does not exist');
    await writeFile(atlasAbsolutePath, validPng);
    const escapingPathPackage = clone(partyPackages[0]);
    escapingPathPackage.provenance.sourcePaths[0] = '../outside.png';
    const escapingPathResult = await validate(escapingPathPackage, metadataPaths[0]);
    requireFailure(
      'negative escaping repository path',
      escapingPathResult.errors,
      'invalid or escaping repository path'
    );

    await writeFile(atlasAbsolutePath, createTestPng({ colorType: 2 }));
    const badPngResult = await validate(partyPackages[0], metadataPaths[0]);
    requireFailure('negative PNG encoding', badPngResult.errors, 'color type must be 6');
    await writeFile(atlasAbsolutePath, validPng);
    await writeFile(atlasAbsolutePath, createInterlacedTestPng());
    const interlacedResult = await validate(partyPackages[0], metadataPaths[0]);
    requireFailure('negative interlaced PNG', interlacedResult.errors, 'must be non-interlaced');
    await writeFile(atlasAbsolutePath, validPng);
    await writeFile(emissiveMaskAbsolutePath, createTestPng({ edgeAlpha: true }));
    const badMaskResult = await validate(maskedPackage, metadataPaths[0]);
    requireFailure('negative mask alpha containment', badMaskResult.errors, 'mask alpha extends');
    await writeFile(emissiveMaskAbsolutePath, validPng);



    await writeFile(atlasAbsolutePath, createTestPng({ edgeAlpha: true }));
    const badAlphaResult = await validate(partyPackages[0], metadataPaths[0]);
    requireFailure('negative PNG safe alpha', badAlphaResult.errors, 'outside safeBounds');
    requireFailure('negative transparent outer border', badAlphaResult.errors, 'outer border');
    await writeFile(atlasAbsolutePath, validPng);

    const badTiming = clone(partyPackages[0]);
    badTiming.animations.melee_contact.frames[0].events[0].atMs =
      badTiming.animations.melee_contact.frames[0].durationMs;
    const badTimingResult = await validate(badTiming, metadataPaths[0]);
    requireFailure('negative semantic timing', badTimingResult.errors, 'less than frame duration');
    const missingEvent = clone(partyPackages[0]);
    missingEvent.animations.melee_contact.frames[0].events = [];
    const missingEventResult = await validate(missingEvent, metadataPaths[0]);
    requireFailure('negative semantic event count', missingEventResult.errors, "exactly 1 'contact'");

    const missingClip = clone(partyPackages[0]);
    delete missingClip.animations.hit;
    const missingClipResult = await validate(missingClip, metadataPaths[0]);
    requireFailure('negative exact clip set', missingClipResult.errors, "missing required property 'hit'");

    const anchorDrift = clone(partyPackages[0]);
    const driftFrame = clone(anchorDrift.frames[0]);
    driftFrame.id = 'pose-anchor-drift';
    driftFrame.groundAnchor.x = 255;
    anchorDrift.frames.push(driftFrame);
    anchorDrift.animations.ranged_idle.frames[0].frameId = driftFrame.id;
    const anchorDriftResult = await validate(anchorDrift, metadataPaths[0]);
    requireFailure('negative ground-anchor drift', anchorDriftResult.errors, 'share one anchor');


    const unknownProperty = clone(partyPackages[0]);
    unknownProperty.unexpected = true;
    const unknownPropertyResult = await validate(unknownProperty, metadataPaths[0]);
    requireFailure('negative strict schema', unknownPropertyResult.errors, "unknown property 'unexpected'");

    const driftPackage = clone(partyPackages[2]);
    driftPackage.prototype.battleScale.targetVisibleHeightPxAt1080 = 313;
    driftPackage.prototype.battleScale.displayScale = 313 / 312;
    const driftResult = await validate(driftPackage, metadataPaths[2]);
    requireClean('negative set member remains individually valid', driftResult.errors);
    requireFailure(
      'negative cross-package scale drift',
      validatePrototypeSet([setResults[0], setResults[1], driftResult]),
      'target visible height'
    );
    const invalidSetPackage = clone(partyPackages[2]);
    delete invalidSetPackage.animations.hit;
    const invalidSetResult = await validate(invalidSetPackage, metadataPaths[2]);
    requireFailure(
      'negative prototype set rejects invalid member',
      validatePrototypeSet([setResults[0], setResults[1], invalidSetResult]),
      'failed individual validation'
    );


    console.log(`[SELF-TEST PASS] ${checks.length}/${checks.length} deterministic checks passed`);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

async function loadSchema(root) {
  const schemaAbsolutePath = path.join(root, ...SCHEMA_PATH.split('/'));
  let schemaText;
  try {
    schemaText = await readFile(schemaAbsolutePath, 'utf8');
  } catch (error) {
    throw new Error(`Cannot read schema '${SCHEMA_PATH}': ${error.message}`);
  }
  try {
    return JSON.parse(schemaText);
  } catch (error) {
    throw new Error(`Schema '${SCHEMA_PATH}' is invalid JSON: ${error.message}`);
  }
}

function repositoryRelativeArgument(root, argument) {
  const absolutePath = path.resolve(root, argument);
  const relative = path.relative(root, absolutePath);
  if (relative === '' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    return null;
  }
  return relative.split(path.sep).join('/');
}

async function validatePackageArgument(argument, context) {
  const metadataRelativePath = repositoryRelativeArgument(context.root, argument);
  if (metadataRelativePath === null) {
    return {
      document: null,
      metadataRelativePath: argument,
      errors: ['metadata path: package argument resolves outside the repository'],
      summary: {},
    };
  }
  const errors = [];
  const metadataBytes = await readRepositoryFile(
    context.root,
    context.rootRealPath,
    metadataRelativePath,
    'metadata path',
    errors
  );
  if (metadataBytes === null) {
    return { document: null, metadataRelativePath, errors, summary: {} };
  }
  let document;
  try {
    document = JSON.parse(metadataBytes.toString('utf8'));
  } catch (error) {
    return {
      document: null,
      metadataRelativePath,
      errors: [`metadata path: invalid JSON: ${error.message}`],
      summary: {},
    };
  }
  return validatePackageDocument({ ...context, document, metadataRelativePath });
}

function printUsage() {
  console.error(
    'Usage: node scripts/validate-godot-combatant-raster-package.mjs [--require-prototype-set] <package.json> [...]\n' +
      '       node scripts/validate-godot-combatant-raster-package.mjs --self-test'
  );
}

async function main() {
  const args = process.argv.slice(2);
  const root = process.cwd();
  const schema = await loadSchema(root);

  if (args[0] === '--self-test') {
    if (args.length !== 1) {
      console.error('--self-test does not accept package arguments or additional options.');
      printUsage();
      process.exitCode = 2;
      return;
    }
    await runSelfTest(schema);
    return;
  }

  let requirePrototypeSet = false;
  if (args[0] === '--require-prototype-set') {
    requirePrototypeSet = true;
    args.shift();
  }
  const unknownOption = args.find((argument) => argument.startsWith('--'));
  if (unknownOption !== undefined) {
    console.error(`Unknown option '${unknownOption}'.`);
    printUsage();
    process.exitCode = 2;
    return;
  }
  if (args.length === 0 || (requirePrototypeSet && args.length !== ROLES.length)) {
    if (requirePrototypeSet && args.length !== ROLES.length) {
      console.error(`--require-prototype-set requires exactly ${ROLES.length} package paths.`);
    }
    printUsage();
    process.exitCode = 2;
    return;
  }

  const rootRealPath = await realpath(root);
  const context = { root, rootRealPath, schema };
  const results = [];
  for (const argument of args) {
    results.push(await validatePackageArgument(argument, context));
  }
  let failureCount = 0;
  for (const result of results) {
    if (result.errors.length === 0) {
      console.log(`[PASS] ${result.metadataRelativePath}`);
      continue;
    }
    failureCount += result.errors.length;
    console.error(`[FAIL] ${result.metadataRelativePath}`);
    for (const error of result.errors) console.error(`  - ${error}`);
  }
  if (requirePrototypeSet) {
    const setErrors = validatePrototypeSet(results);
    if (setErrors.length === 0) {
      console.log('[PASS] complete three-role prototype set');
    } else {
      failureCount += setErrors.length;
      console.error('[FAIL] complete three-role prototype set');
      for (const error of setErrors) console.error(`  - ${error}`);
    }
  }
  if (failureCount > 0) {
    console.error(`Validation failed with ${failureCount} error(s).`);
    process.exitCode = 1;
    return;
  }
  console.log(`Validated ${results.length} package(s); 0 errors.`);
}

try {
  await main();
} catch (error) {
  console.error(`[FATAL] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
