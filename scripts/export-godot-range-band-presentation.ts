import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { createRangeBandPresentationFixture } from '../src/bridge/rangeBandPresentationFixture';

const OUTPUT_PATH = resolve(
  process.cwd(),
  'godot/data/presentation-range-band-replay-v1.json'
);

async function main(): Promise<void> {
  const document = createRangeBandPresentationFixture();
  const output = `${JSON.stringify(document, null, 2)}\n`;
  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, output, 'utf8');

  const digest = createHash('sha256').update(output).digest('hex');
  const finalFrame = document.frames[document.frames.length - 1];
  console.log(
    `[Godot Range-Band Bridge] Wrote ${document.frames.length} authoritative snapshots to ${OUTPUT_PATH}`
  );
  console.log(
    `[Godot Range-Band Bridge] ${document.encounter.id} seed=${document.source.seed} outcome=${finalFrame?.state.status} sha256=${digest}`
  );
}

await main();
