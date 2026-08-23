import { spawnSync } from 'node:child_process';
import process from 'node:process';

const compiler = spawnSync(process.execPath, [
  'node_modules/typescript/bin/tsc',
  'scripts/gemini-media-compare.ts',
  '--outDir', '.gemini/tool',
  '--module', 'NodeNext',
  '--moduleResolution', 'NodeNext',
  '--target', 'ES2022',
  '--skipLibCheck',
  '--strict',
], { stdio: 'inherit' });

if (compiler.status !== 0) {
  process.exitCode = compiler.status ?? 1;
} else {
  const tool = spawnSync(process.execPath, [
    '.gemini/tool/gemini-media-compare.js',
    ...process.argv.slice(2),
  ], { stdio: 'inherit' });
  process.exitCode = tool.status ?? 1;
}
