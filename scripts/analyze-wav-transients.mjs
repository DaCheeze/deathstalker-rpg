import { createHash } from 'node:crypto';
import console from 'node:console';
import { readFile } from 'node:fs/promises';
import process from 'node:process';

const WINDOW_SECONDS = 0.005;

function readInt24LE(buffer, offset) {
  const unsigned = buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
  return unsigned & 0x800000 ? unsigned - 0x1000000 : unsigned;
}

function decodeSample(buffer, offset, audioFormat, bitsPerSample) {
  if (audioFormat === 3 && bitsPerSample === 32) return buffer.readFloatLE(offset);
  if (audioFormat !== 1) throw new Error(`Unsupported WAV format code ${audioFormat}.`);
  if (bitsPerSample === 8) return (buffer.readUInt8(offset) - 128) / 128;
  if (bitsPerSample === 16) return buffer.readInt16LE(offset) / 32768;
  if (bitsPerSample === 24) return readInt24LE(buffer, offset) / 8388608;
  if (bitsPerSample === 32) return buffer.readInt32LE(offset) / 2147483648;
  throw new Error(`Unsupported PCM depth ${bitsPerSample}.`);
}

function parseWav(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('File is not a RIFF/WAVE stream.');
  }

  let format;
  let dataOffset = -1;
  let dataSize = 0;
  let cursor = 12;
  while (cursor + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', cursor, cursor + 4);
    const chunkSize = buffer.readUInt32LE(cursor + 4);
    const chunkOffset = cursor + 8;
    if (chunkOffset + chunkSize > buffer.length) throw new Error(`Truncated ${chunkId} chunk.`);
    if (chunkId === 'fmt ') {
      format = {
        audioFormat: buffer.readUInt16LE(chunkOffset),
        channels: buffer.readUInt16LE(chunkOffset + 2),
        sampleRate: buffer.readUInt32LE(chunkOffset + 4),
        blockAlign: buffer.readUInt16LE(chunkOffset + 12),
        bitsPerSample: buffer.readUInt16LE(chunkOffset + 14),
      };
    } else if (chunkId === 'data') {
      dataOffset = chunkOffset;
      dataSize = chunkSize;
    }
    cursor = chunkOffset + chunkSize + (chunkSize % 2);
  }

  if (!format || dataOffset < 0) throw new Error('WAV is missing fmt or data.');
  const bytesPerSample = format.bitsPerSample / 8;
  if (!Number.isInteger(bytesPerSample) || format.blockAlign !== bytesPerSample * format.channels) {
    throw new Error('Unsupported packed or compressed WAV layout.');
  }
  return { ...format, bytesPerSample, dataOffset, dataSize };
}

function analyzePcm(buffer, wav) {
  const frameCount = Math.floor(wav.dataSize / wav.blockAlign);
  const windowFrames = Math.max(1, Math.round(wav.sampleRate * WINDOW_SECONDS));
  const ring = new Float64Array(windowFrames);
  let ringCursor = 0;
  let ringCount = 0;
  let windowEnergy = 0;
  let strongestWindowEnergy = -1;
  let strongestWindowFrame = 0;
  let peak = 0;
  let peakFrame = 0;
  const framePeaks = new Float32Array(frameCount);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let framePeak = 0;
    const frameOffset = wav.dataOffset + frame * wav.blockAlign;
    for (let channel = 0; channel < wav.channels; channel += 1) {
      const sample = decodeSample(
        buffer,
        frameOffset + channel * wav.bytesPerSample,
        wav.audioFormat,
        wav.bitsPerSample,
      );
      framePeak = Math.max(framePeak, Math.abs(sample));
    }
    framePeaks[frame] = framePeak;
    if (framePeak > peak) {
      peak = framePeak;
      peakFrame = frame;
    }

    const energy = framePeak * framePeak;
    if (ringCount === windowFrames) windowEnergy -= ring[ringCursor];
    else ringCount += 1;
    ring[ringCursor] = energy;
    ringCursor = (ringCursor + 1) % windowFrames;
    windowEnergy += energy;
    if (ringCount === windowFrames && windowEnergy > strongestWindowEnergy) {
      strongestWindowEnergy = windowEnergy;
      strongestWindowFrame = frame - Math.floor(windowFrames / 2);
    }
  }

  const onsetThreshold = peak * 0.2;
  let onsetFrame = 0;
  while (onsetFrame < framePeaks.length && framePeaks[onsetFrame] < onsetThreshold) onsetFrame += 1;
  const seconds = (frame) => Number((frame / wav.sampleRate).toFixed(6));
  return {
    durationSeconds: seconds(frameCount),
    peak: Number(peak.toFixed(6)),
    peakDbfs: peak > 0 ? Number((20 * Math.log10(peak)).toFixed(3)) : null,
    peakSampleSeconds: seconds(peakFrame),
    strongestWindowSeconds: seconds(Math.max(0, strongestWindowFrame)),
    onset20PercentSeconds: seconds(Math.min(onsetFrame, frameCount)),
  };
}

async function analyze(path) {
  const buffer = await readFile(path);
  const wav = parseWav(buffer);
  return {
    path,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    sampleRate: wav.sampleRate,
    channels: wav.channels,
    bitsPerSample: wav.bitsPerSample,
    ...analyzePcm(buffer, wav),
  };
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error('Usage: node scripts/analyze-wav-transients.mjs <file.wav> [...]');
  process.exit(2);
}

let failed = false;
for (const path of paths) {
  try {
    console.log(JSON.stringify(await analyze(path)));
  } catch (error) {
    failed = true;
    console.error(`${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
if (failed) process.exitCode = 1;
