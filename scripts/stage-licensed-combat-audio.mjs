import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import console from 'node:console';
import { constants } from 'node:fs';
import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const manifestPath = path.join(repositoryRoot, 'godot', 'data', 'licensed-combat-audio-manifest-v1.json');

function argumentValue(name) {
  const prefix = `${name}=`;
  const inline = process.argv.slice(2).find((argument) => argument.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function safeJoin(root, relativePath, label) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(resolvedRoot, ...relativePath.split('/'));
  const relative = path.relative(resolvedRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} escapes its permitted root: ${relativePath}`);
  }
  return resolved;
}

async function sha256(filePath) {
  const buffer = await readFile(filePath);
  return createHash('sha256').update(buffer).digest('hex');
}

async function listWavs(root) {
  const results = [];
  async function visit(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error && typeof error === 'object' && error.code === 'ENOENT') return;
      throw error;
    }
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(fullPath);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.wav')) results.push(fullPath);
    }
  }
  await visit(root);
  return results;
}

function assertDestinationIsIgnored(destinationRoot) {
  const probePath = path.join(destinationRoot, '.licensed-audio-ignore-probe');
  const result = spawnSync('git', ['check-ignore', '--quiet', '--', probePath], {
    cwd: repositoryRoot,
    stdio: 'ignore',
  });
  if (result.error) {
    throw new Error(`Could not verify the licensed staging ignore rule: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      'Refusing to stage licensed audio because godot/assets/audio/licensed is not Git-ignored.',
    );
  }
}

const sourceRootValue = argumentValue('--source-root') ?? process.env.LICENSED_AUDIO_SOURCE_ROOT;
if (!sourceRootValue) {
  console.error(
    'Provide --source-root <purchased-library-folder> or set LICENSED_AUDIO_SOURCE_ROOT. No licensed files were changed.',
  );
  process.exit(2);
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.schemaVersion !== 1 || typeof manifest.assetRoot !== 'string' || !manifest.assets) {
  throw new Error('Licensed combat-audio manifest is malformed or unsupported.');
}

const sourceRoot = path.resolve(sourceRootValue);
const sourceStats = await stat(sourceRoot).catch(() => undefined);
if (!sourceStats?.isDirectory()) throw new Error('Licensed audio source root does not exist or is not a directory.');

const destinationRoot = safeJoin(path.join(repositoryRoot, 'godot'), manifest.assetRoot, 'Manifest assetRoot');
assertDestinationIsIgnored(destinationRoot);
const assets = Object.entries(manifest.assets).map(([assetId, asset]) => ({
  assetId,
  asset,
  source: safeJoin(sourceRoot, asset.sourceRelativePath, `Source for ${assetId}`),
  destination: safeJoin(destinationRoot, asset.path, `Destination for ${assetId}`),
}));

for (const item of assets) {
  const actual = await sha256(item.source).catch(() => undefined);
  if (!actual) throw new Error(`Purchased source is missing: ${item.asset.sourceRelativePath}`);
  if (actual !== item.asset.sha256) {
    throw new Error(`Purchased source hash mismatch for ${item.asset.sourceRelativePath}.`);
  }
}

let copied = 0;
let retained = 0;
for (const item of assets) {
  await mkdir(path.dirname(item.destination), { recursive: true });
  const existingHash = await sha256(item.destination).catch(() => undefined);
  if (existingHash) {
    if (existingHash !== item.asset.sha256) {
      throw new Error(`Refusing to overwrite mismatched staged asset ${item.asset.path}.`);
    }
    retained += 1;
    continue;
  }
  await copyFile(item.source, item.destination, constants.COPYFILE_EXCL);
  copied += 1;
}

const expected = new Set(assets.map((item) => path.normalize(item.destination).toLowerCase()));
const extras = (await listWavs(destinationRoot)).filter(
  (filePath) => !expected.has(path.normalize(filePath).toLowerCase()),
);
if (extras.length > 0) {
  throw new Error(
    `Licensed staging contains ${extras.length} unmanifested WAV file(s); move them out rather than deleting automatically.`,
  );
}

console.log(`Licensed combat audio staged safely: ${copied} copied, ${retained} already verified, ${assets.length} total.`);
console.log('The destination is Git-ignored; purchase proof and the source vault remain outside the repository.');
