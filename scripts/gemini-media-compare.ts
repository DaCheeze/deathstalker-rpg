import { spawn } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdir, mkdtemp, rmdir, stat, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import process from 'node:process';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const API_ROOT = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-3.7-flash';
const DEFAULT_OUTPUT = 'gemini-combat-comparison.md';
const POLL_INTERVAL_MS = 3_000;
const PROCESSING_TIMEOUT_MS = 10 * 60_000;

interface CliOptions {
  currentPath: string;
  referencePath: string;
  currentAudioPath?: string;
  referenceAudioPath?: string;
  model: string;
  outputPath: string;
  ffmpegPath: string;
  extractAudio: boolean;
  keepUploads: boolean;
  dryRun: boolean;
}

interface GeminiFile {
  name: string;
  uri: string;
  mimeType: string;
  state?: string;
}

interface UploadedMedia {
  label: string;
  localPath: string;
  type: 'audio' | 'video';
  file: GeminiFile;
}

interface ExtractedAudioPair {
  directory: string;
  currentPath: string;
  referencePath: string;
}

interface InteractionTextPart {
  type?: unknown;
  text?: unknown;
}

interface InteractionStep {
  type?: unknown;
  content?: unknown;
}

interface InteractionResponse {
  output_text?: unknown;
  steps?: unknown;
  outputs?: unknown;
}

function printHelp(): void {
  console.log(`Gemini audiovisual combat comparison

Usage:
  npm run gemini:compare -- --current <current.mp4> --reference <original.mp4> [options]

Required:
  --current <path>          Current/problematic demo clip
  --reference <path>        Original/reference fight clip

Options:
  --current-audio <path>    Separate audio track for the current clip
  --reference-audio <path>  Separate audio track for the reference clip
  --model <name>            Gemini model (default: ${DEFAULT_MODEL})
  --output <path>           Markdown report path (default: ${DEFAULT_OUTPUT})
  --ffmpeg <path>           FFmpeg executable (default: FFMPEG_PATH or ffmpeg)
  --no-extract-audio        Trust audio embedded in each video container
  --keep-uploads            Leave Gemini Files API uploads until their expiry
  --dry-run                 Validate inputs without uploading or using an API key
  --help                    Show this help

Authentication:
  Set GEMINI_API_KEY in the current process environment. The tool never prints it.
`);
}

function readValue(args: readonly string[], index: number, option: string): string {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
}

export function parseArguments(args: readonly string[]): CliOptions | 'help' {
  let currentPath: string | undefined;
  let referencePath: string | undefined;
  let currentAudioPath: string | undefined;
  let referenceAudioPath: string | undefined;
  let model = DEFAULT_MODEL;
  let outputPath = DEFAULT_OUTPUT;
  let ffmpegPath = process.env.FFMPEG_PATH?.trim() || 'ffmpeg';
  let extractAudio = true;
  let keepUploads = false;
  let dryRun = false;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    switch (argument) {
      case '--current':
        currentPath = readValue(args, index, argument);
        index += 1;
        break;
      case '--reference':
        referencePath = readValue(args, index, argument);
        index += 1;
        break;
      case '--current-audio':
        currentAudioPath = readValue(args, index, argument);
        index += 1;
        break;
      case '--reference-audio':
        referenceAudioPath = readValue(args, index, argument);
        index += 1;
        break;
      case '--model':
        model = readValue(args, index, argument);
        index += 1;
        break;
      case '--output':
        outputPath = readValue(args, index, argument);
        index += 1;
        break;
      case '--ffmpeg':
        ffmpegPath = readValue(args, index, argument);
        index += 1;
        break;
      case '--no-extract-audio':
        extractAudio = false;
        break;
      case '--keep-uploads':
        keepUploads = true;
        break;
      case '--dry-run':
        dryRun = true;
        break;
      case '--help':
      case '-h':
        return 'help';
      default:
        throw new Error(`Unknown option: ${argument ?? '(missing)'}`);
    }
  }

  if (currentPath === undefined || referencePath === undefined) {
    throw new Error('--current and --reference are required.');
  }
  if ((currentAudioPath === undefined) !== (referenceAudioPath === undefined)) {
    throw new Error('--current-audio and --reference-audio must be supplied together.');
  }

  return {
    currentPath: resolve(currentPath),
    referencePath: resolve(referencePath),
    ...(currentAudioPath === undefined ? {} : { currentAudioPath: resolve(currentAudioPath) }),
    ...(referenceAudioPath === undefined ? {} : { referenceAudioPath: resolve(referenceAudioPath) }),
    model,
    outputPath: resolve(outputPath),
    ffmpegPath,
    extractAudio,
    keepUploads,
    dryRun,
  };
}

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  '.aac': 'audio/aac',
  '.aif': 'audio/aiff',
  '.aiff': 'audio/aiff',
  '.flac': 'audio/flac',
  '.m4a': 'audio/mp4',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.mp3': 'audio/mp3',
  '.mp4': 'video/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.webm': 'video/webm',
};

export function detectMimeType(filePath: string): string {
  const extension = extname(filePath).toLowerCase();
  const mimeType = MIME_BY_EXTENSION[extension];
  if (mimeType === undefined) {
    throw new Error(`Unsupported media extension "${extension || '(none)'}" for ${filePath}.`);
  }
  return mimeType;
}

function mediaTypeFromMime(mimeType: string): 'audio' | 'video' {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  throw new Error(`Unsupported media MIME type: ${mimeType}.`);
}

async function validateLocalMedia(filePath: string, expected: 'audio' | 'video'): Promise<void> {
  const fileStat = await stat(filePath);
  if (!fileStat.isFile()) throw new Error(`Not a file: ${filePath}`);
  if (fileStat.size === 0) throw new Error(`Media file is empty: ${filePath}`);
  const actual = mediaTypeFromMime(detectMimeType(filePath));
  if (actual !== expected) {
    throw new Error(`Expected ${expected} media but received ${actual}: ${filePath}`);
  }
}

function runFfmpeg(ffmpegPath: string, args: readonly string[], operation: string): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(ffmpegPath, args, {
      stdio: ['ignore', 'ignore', 'pipe'],
      windowsHide: true,
    });
    let errorText = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      errorText = `${errorText}${chunk}`.slice(-8_000);
    });
    child.once('error', (error: Error) => {
      rejectPromise(new Error(`${operation} could not start FFmpeg at "${ffmpegPath}": ${error.message}`));
    });
    child.once('close', (code) => {
      if (code === 0) {
        resolvePromise();
      } else {
        rejectPromise(new Error(`${operation} failed with FFmpeg exit code ${code ?? 'unknown'}: ${errorText.trim()}`));
      }
    });
  });
}

async function verifyFfmpeg(ffmpegPath: string): Promise<void> {
  await runFfmpeg(ffmpegPath, ['-version'], 'FFmpeg verification');
}

async function removeExtractedAudio(pair: ExtractedAudioPair): Promise<void> {
  await Promise.all([
    unlink(pair.currentPath).catch(() => undefined),
    unlink(pair.referencePath).catch(() => undefined),
  ]);
  await rmdir(pair.directory).catch(() => undefined);
}

async function extractAudioPair(options: CliOptions): Promise<ExtractedAudioPair> {
  await verifyFfmpeg(options.ffmpegPath);
  const directory = await mkdtemp(join(tmpdir(), 'deathstalker-gemini-audio-'));
  const pair: ExtractedAudioPair = {
    directory,
    currentPath: join(directory, 'clip-a.flac'),
    referencePath: join(directory, 'clip-b.flac'),
  };
  const extract = async (label: string, inputPath: string, outputPath: string): Promise<void> => {
    console.log(`Extracting lossless ${label} audio with FFmpeg...`);
    await runFfmpeg(options.ffmpegPath, [
      '-nostdin',
      '-hide_banner',
      '-loglevel', 'error',
      '-y',
      '-i', inputPath,
      '-map', '0:a:0',
      '-vn',
      '-c:a', 'flac',
      outputPath,
    ], `Extracting ${label} audio`);
    await validateLocalMedia(outputPath, 'audio');
  };

  try {
    await extract('Clip A', options.currentPath, pair.currentPath);
    await extract('Clip B', options.referencePath, pair.referencePath);
    return pair;
  } catch (error) {
    await removeExtractedAudio(pair);
    throw error;
  }
}

async function requireJson(response: Response, operation: string): Promise<unknown> {
  const bodyText = await response.text();
  let body: unknown;
  try {
    body = bodyText.length === 0 ? {} : JSON.parse(bodyText);
  } catch {
    body = { raw: bodyText.slice(0, 2_000) };
  }
  if (!response.ok) {
    throw new Error(`${operation} failed (${response.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined;
}

function parseGeminiFile(value: unknown): GeminiFile {
  const root = asRecord(value);
  const candidate = asRecord(root?.file) ?? root;
  const name = candidate?.name;
  const uri = candidate?.uri;
  const mimeType = candidate?.mimeType ?? candidate?.mime_type;
  const state = candidate?.state;
  if (typeof name !== 'string' || typeof uri !== 'string' || typeof mimeType !== 'string') {
    throw new Error(`Gemini returned incomplete file metadata: ${JSON.stringify(value)}`);
  }
  return {
    name,
    uri,
    mimeType,
    ...(typeof state === 'string' ? { state } : {}),
  };
}

async function uploadFile(apiKey: string, label: string, filePath: string): Promise<UploadedMedia> {
  const mimeType = detectMimeType(filePath);
  const fileStat = await stat(filePath);
  console.log(`Uploading ${label}: ${basename(filePath)} (${(fileStat.size / 1_048_576).toFixed(1)} MiB)`);

  const startResponse = await fetch(`${API_ROOT.replace('/v1beta', '')}/upload/v1beta/files`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileStat.size),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'X-Goog-Upload-Protocol': 'resumable',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ file: { display_name: basename(filePath) } }),
  });
  if (!startResponse.ok) await requireJson(startResponse, `Starting ${label} upload`);
  const uploadUrl = startResponse.headers.get('x-goog-upload-url');
  if (uploadUrl === null) throw new Error(`Gemini did not return an upload URL for ${label}.`);

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream<Uint8Array>;
  const uploadInit: RequestInit & { duplex: 'half' } = {
    method: 'POST',
    headers: {
      'Content-Length': String(fileStat.size),
      'Content-Type': mimeType,
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
    },
    body: stream,
    duplex: 'half',
  };
  const uploadResponse = await fetch(uploadUrl, uploadInit);
  const uploaded = parseGeminiFile(await requireJson(uploadResponse, `Uploading ${label}`));
  const readyFile = await waitForActiveFile(apiKey, uploaded, label);
  return {
    label,
    localPath: filePath,
    type: mediaTypeFromMime(readyFile.mimeType),
    file: readyFile,
  };
}

async function waitForActiveFile(apiKey: string, initial: GeminiFile, label: string): Promise<GeminiFile> {
  let file = initial;
  const deadline = Date.now() + PROCESSING_TIMEOUT_MS;
  while (file.state === 'PROCESSING' || file.state === 'STATE_UNSPECIFIED') {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for Gemini to process ${label}.`);
    console.log(`Waiting for Gemini to process ${label}...`);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, POLL_INTERVAL_MS));
    const response = await fetch(`${API_ROOT}/${file.name}`, {
      headers: { 'x-goog-api-key': apiKey },
    });
    file = parseGeminiFile(await requireJson(response, `Checking ${label}`));
  }
  if (file.state === 'FAILED') throw new Error(`Gemini failed to process ${label}.`);
  console.log(`${label} is ready.`);
  return file;
}

function textPartsFromUnknown(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((partValue) => {
    const part = asRecord(partValue) as InteractionTextPart | undefined;
    return part?.type === 'text' && typeof part.text === 'string' ? [part.text] : [];
  });
}

export function extractInteractionText(response: InteractionResponse): string {
  if (typeof response.output_text === 'string' && response.output_text.trim().length > 0) {
    return response.output_text.trim();
  }

  if (Array.isArray(response.steps)) {
    const stepText = response.steps.flatMap((stepValue) => {
      const step = asRecord(stepValue) as InteractionStep | undefined;
      return step?.type === 'model_output' ? textPartsFromUnknown(step.content) : [];
    });
    if (stepText.length > 0) return stepText.join('\n').trim();
  }

  const outputText = textPartsFromUnknown(response.outputs);
  if (outputText.length > 0) return outputText.join('\n').trim();
  throw new Error(`Gemini returned no text output: ${JSON.stringify(response)}`);
}

async function createInteraction(
  apiKey: string,
  model: string,
  input: ReadonlyArray<Record<string, string>>,
): Promise<string> {
  const response = await fetch(`${API_ROOT}/interactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({ model, input, store: false }),
  });
  const body = await requireJson(response, 'Gemini interaction');
  return extractInteractionText(body as InteractionResponse);
}

function fileInput(media: UploadedMedia): Record<string, string> {
  return {
    type: media.type,
    uri: media.file.uri,
    mime_type: media.file.mimeType,
  };
}

const AUDIO_PROBE_PROMPT = `Evaluate only the audio stream in this media file. Do not infer sounds from visible action.

The relevant content is non-speech science-fiction game combat sound effects. On the first line, write exactly one of:
AUDIO_STREAM_ACCESSIBLE: YES
AUDIO_STREAM_ACCESSIBLE: NO

Write YES only if you can directly detect non-speech sounds. If YES, list at least three audible events with MM:SS timestamps and describe their acoustic character. If you cannot hear the audio, if it is silent, or if only visual frames are available, write NO and explain why.`;

export function hasConfirmedAudioAccess(probeText: string): boolean {
  return /^AUDIO_STREAM_ACCESSIBLE:\s*YES\s*$/imu.test(probeText);
}

export function buildComparisonPrompt(): string {
  return `Compare Clip A (the current problematic demo) with Clip B (the older reference fight). Analyze what is actually visible and audible in the supplied media, with special attention to non-speech combat sound effects.

Requirements:
1. Produce a timestamped event table for each clip. For every identifiable attack, interrupt, movement, shield, impact, defeat, and UI cue, describe both the visible action and the audible sound.
2. Compare onset, pitch trajectory, tonal versus noisy layers, transient strength, duration, decay tail, silence, repetition, and synchronization with visible contact.
3. Identify which Clip A sounds repeat excessively or fail to distinguish weapon and action identities.
4. Explain what Clip B does better, using timestamped evidence rather than generic sound-design advice.
5. Separate direct observations from uncertain inferences and subjective recommendations.
6. Note combat-flow and visual-timing differences only where they materially affect perceived audio clarity or impact.
7. Give a prioritized implementation brief for an existing TypeScript/Web Audio synthesis system. The game may not use recorded audio files. Do not provide replacement code or invent exact oscillator values unless the evidence supports them.

Return Markdown with these sections:
- Audio access confirmation
- Clip A timestamped events
- Clip B timestamped events
- Direct comparison
- Five highest-impact problems
- Prioritized procedural Web Audio implementation brief
- Uncertainties and required human listening checks`;
}

async function deleteUpload(apiKey: string, media: UploadedMedia): Promise<void> {
  const response = await fetch(`${API_ROOT}/${media.file.name}`, {
    method: 'DELETE',
    headers: { 'x-goog-api-key': apiKey },
  });
  if (!response.ok) {
    console.warn(`Warning: could not delete ${media.label}; Gemini will expire it automatically.`);
  }
}

function reportHeader(options: CliOptions): string {
  return `# Gemini audiovisual combat comparison

- Model: \`${options.model}\`
- Clip A: \`${basename(options.currentPath)}\` (current/problematic demo)
- Clip B: \`${basename(options.referencePath)}\` (original/reference fight)
- Separate audio tracks: ${options.currentAudioPath === undefined ? 'no' : 'yes'}
- Generated: ${new Date().toISOString()}
`;
}

async function writeReport(outputPath: string, content: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${content.trim()}\n`, 'utf8');
  console.log(`Report written to ${outputPath}`);
}

async function runComparison(options: CliOptions, apiKey: string): Promise<void> {
  const uploaded: UploadedMedia[] = [];
  try {
    const currentVideo = await uploadFile(apiKey, 'Clip A video', options.currentPath);
    uploaded.push(currentVideo);
    const referenceVideo = await uploadFile(apiKey, 'Clip B video', options.referencePath);
    uploaded.push(referenceVideo);

    let currentProbeMedia = currentVideo;
    let referenceProbeMedia = referenceVideo;
    let currentAudio: UploadedMedia | undefined;
    let referenceAudio: UploadedMedia | undefined;
    if (options.currentAudioPath !== undefined && options.referenceAudioPath !== undefined) {
      currentAudio = await uploadFile(apiKey, 'Clip A audio', options.currentAudioPath);
      uploaded.push(currentAudio);
      referenceAudio = await uploadFile(apiKey, 'Clip B audio', options.referenceAudioPath);
      uploaded.push(referenceAudio);
      currentProbeMedia = currentAudio;
      referenceProbeMedia = referenceAudio;
    }

    console.log('Checking Clip A audio access...');
    const currentProbe = await createInteraction(apiKey, options.model, [
      { type: 'text', text: AUDIO_PROBE_PROMPT },
      fileInput(currentProbeMedia),
    ]);
    console.log('Checking Clip B audio access...');
    const referenceProbe = await createInteraction(apiKey, options.model, [
      { type: 'text', text: AUDIO_PROBE_PROMPT },
      fileInput(referenceProbeMedia),
    ]);

    const probeReport = `${reportHeader(options)}
## Audio access verification

### Clip A

${currentProbe}

### Clip B

${referenceProbe}
`;
    if (!hasConfirmedAudioAccess(currentProbe) || !hasConfirmedAudioAccess(referenceProbe)) {
      await writeReport(options.outputPath, `${probeReport}
## Comparison status

Comparison aborted because Gemini did not explicitly confirm access to non-speech audio in both clips. No audio conclusions should be inferred from visual frames alone.
`);
      throw new Error('Audio verification failed; comparison was not requested. See the report for details.');
    }

    console.log('Audio confirmed in both clips. Requesting comparative review...');
    const comparisonInputs: Array<Record<string, string>> = [
      { type: 'text', text: 'Clip A video: current/problematic demo.' },
      fileInput(currentVideo),
    ];
    if (currentAudio !== undefined) {
      comparisonInputs.push({ type: 'text', text: 'Clip A synchronized audio track.' }, fileInput(currentAudio));
    }
    comparisonInputs.push(
      { type: 'text', text: 'Clip B video: original/reference fight.' },
      fileInput(referenceVideo),
    );
    if (referenceAudio !== undefined) {
      comparisonInputs.push({ type: 'text', text: 'Clip B synchronized audio track.' }, fileInput(referenceAudio));
    }
    comparisonInputs.push({ type: 'text', text: buildComparisonPrompt() });

    const comparison = await createInteraction(apiKey, options.model, comparisonInputs);
    await writeReport(options.outputPath, `${probeReport}
## Comparative review

${comparison}
`);
  } finally {
    if (!options.keepUploads) {
      await Promise.all(uploaded.map(async (media) => deleteUpload(apiKey, media)));
    }
  }
}

async function main(): Promise<void> {
  const parsed = parseArguments(process.argv.slice(2));
  if (parsed === 'help') {
    printHelp();
    return;
  }

  await validateLocalMedia(parsed.currentPath, 'video');
  await validateLocalMedia(parsed.referencePath, 'video');
  if (parsed.currentAudioPath !== undefined && parsed.referenceAudioPath !== undefined) {
    await validateLocalMedia(parsed.currentAudioPath, 'audio');
    await validateLocalMedia(parsed.referenceAudioPath, 'audio');
  }

  if (parsed.dryRun) {
    let dryRunAudio: ExtractedAudioPair | undefined;
    if (parsed.currentAudioPath === undefined && parsed.extractAudio) {
      try {
        dryRunAudio = await extractAudioPair(parsed);
      } finally {
        if (dryRunAudio !== undefined) await removeExtractedAudio(dryRunAudio);
      }
    }
    console.log('Dry run passed. Files and media types are valid.');
    console.log(`Model: ${parsed.model}`);
    console.log(`Output: ${parsed.outputPath}`);
    const audioSource = parsed.currentAudioPath !== undefined
      ? 'provided separate audio tracks'
      : parsed.extractAudio
        ? `automatic lossless FFmpeg extraction (${parsed.ffmpegPath})`
        : 'video containers';
    console.log(`Audio source: ${audioSource}`);
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (apiKey === undefined || apiKey.length === 0) {
    throw new Error('GEMINI_API_KEY is not set. See docs/development/gemini-audiovisual-review.md.');
  }
  let extractedAudio: ExtractedAudioPair | undefined;
  try {
    let runOptions = parsed;
    if (parsed.currentAudioPath === undefined && parsed.extractAudio) {
      extractedAudio = await extractAudioPair(parsed);
      runOptions = {
        ...parsed,
        currentAudioPath: extractedAudio.currentPath,
        referenceAudioPath: extractedAudio.referencePath,
      };
    }
    await runComparison(runOptions, apiKey);
  } finally {
    if (extractedAudio !== undefined) await removeExtractedAudio(extractedAudio);
  }
}

const launchedDirectly = process.argv[1] !== undefined
  && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (launchedDirectly) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Gemini comparison failed: ${message}`);
    process.exitCode = 1;
  });
}
