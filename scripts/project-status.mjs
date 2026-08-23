import { spawnSync } from 'node:child_process';
import console from 'node:console';
import process from 'node:process';

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

const trackedChanges = git('diff', '--name-only', 'HEAD').split(/\r?\n/).filter(Boolean);
const untrackedChanges = git('ls-files', '--others', '--exclude-standard').split(/\r?\n/).filter(Boolean);
const files = [...new Set([...trackedChanges, ...untrackedChanges])].sort();

const categories = new Set();
for (const file of files) {
  const normalized = file.replaceAll('\\', '/');
  if (/^(src\/core|src\/data|src\/sim|tests\/core|balance-targets\.json)/.test(normalized)) {
    categories.add('gameplay');
  } else if (/^(src\/(?:audio|render|ui)(?:\/|$)|src\/main\.ts$|tests\/(?:audio|render|ui)(?:\/|$)|index\.html$|public\/|assets\/)/.test(normalized)) {
    categories.add('browser');
  } else if (/^(godot\/|experiments\/godot-)/.test(normalized)) {
    categories.add('godot');
  } else if (/^(\.github|\.nvmrc|\.node-version|package(?:-lock)?\.json|vite\.config|eslint\.config|scripts\/)/.test(normalized)) {
    categories.add('tooling');
  } else if (/\.md$/.test(normalized) || normalized.startsWith('docs/')) {
    categories.add('documentation');
  } else {
    categories.add('other');
  }
}

let gates = 'git diff --check';
if (categories.has('gameplay')) {
  gates = 'npm run verify:gameplay';
} else if (categories.has('browser')) {
  gates = 'npm run verify:quality';
} else if (categories.has('tooling') || categories.has('other') || categories.has('godot')) {
  gates = 'npm run verify:quality';
}
if (categories.has('godot')) {
  gates += ', plus Godot --check-only and the relevant headless validator/scene smoke';
}
if (categories.has('browser')) {
  gates += ', then exercise affected browser paths and inspect the console';
}

const expectedMajor = 20;
const actualMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '', 10);
const runtime = actualMajor === expectedMajor ? 'supported' : `unsupported; expected Node ${expectedMajor}`;

console.log('PROJECT STATUS');
console.log(`branch: ${git('branch', '--show-current') || '(detached)'}`);
console.log(`node: ${process.version} (${runtime})`);
console.log(`changed files: ${files.length}`);
console.log(`areas: ${categories.size > 0 ? [...categories].sort().join(', ') : 'clean'}`);
console.log(`recommended verification: ${gates}`);
console.log('recorded balance baseline (2026-08-22; docs/PROJECT-STATE.md): FAIL — 14 metrics out of band (500 iterations, seeds 12345/98765)');

if (files.length > 0) {
  console.log('files:');
  for (const file of files) console.log(`  ${file}`);
}
