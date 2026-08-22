import { spawnSync } from 'node:child_process';
import console from 'node:console';
import path from 'node:path';
import process from 'node:process';

const mode = process.argv[2] ?? 'quick';
const commands = {
  quick: [
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'lint:errors']],
    ['npm', ['run', 'test:compact']],
  ],
  quality: [
    ['npm', ['run', 'build']],
    ['internal', ['lint:summary']],
    ['npm', ['run', 'test:compact']],
  ],
  gameplay: [
    ['npm', ['run', 'build']],
    ['internal', ['lint:summary']],
    ['npm', ['run', 'test:compact']],
    ['npm', ['run', 'balance-check']],
  ],
};

if (!(mode in commands)) {
  console.error(`Unknown verification mode '${mode}'. Use quick, quality, or gameplay.`);
  process.exit(2);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const steps = commands[mode];

console.log(`VERIFY ${mode.toUpperCase()} — ${steps.length} step(s)`);

for (let index = 0; index < steps.length; index += 1) {
  const [kind, args] = steps[index];
  const label = args.slice(1).join(' ');
  const displayLabel = kind === 'internal' ? args[0] : label;
  console.log(`\n[${index + 1}/${steps.length}] ${displayLabel}`);

  if (kind === 'internal' && args[0] === 'lint:summary') {
    const eslintPath = path.resolve(process.cwd(), 'node_modules/eslint/bin/eslint.js');
    const lintResult = spawnSync(process.execPath, [eslintPath, '.', '--format', 'json'], {
      encoding: 'utf8',
    });
    if (lintResult.error) {
      console.error(`Unable to start lint:summary: ${lintResult.error.message}`);
      process.exit(1);
    }

    try {
      const reports = JSON.parse(lintResult.stdout);
      const totals = reports.reduce((sum, report) => ({
        errors: sum.errors + report.errorCount,
        warnings: sum.warnings + report.warningCount,
      }), { errors: 0, warnings: 0 });
      console.log(`lint: ${totals.errors} error(s), ${totals.warnings} warning(s)`);
      if (totals.errors > 0) {
        console.error(`\nVERIFY ${mode.toUpperCase()} FAILED at lint:summary.`);
        process.exit(1);
      }
      if (lintResult.status !== 0) {
        if (lintResult.stderr) process.stderr.write(lintResult.stderr);
        console.error(`\nVERIFY ${mode.toUpperCase()} FAILED at lint:summary (exit ${lintResult.status}).`);
        process.exit(lintResult.status ?? 1);
      }
    } catch {
      if (lintResult.stderr) process.stderr.write(lintResult.stderr);
      console.error('Unable to parse ESLint JSON output.');
      process.exit(lintResult.status ?? 1);
    }
    continue;
  }

  const command = process.platform === 'win32'
    ? process.env.ComSpec ?? 'cmd.exe'
    : npmCommand;
  const commandArgs = process.platform === 'win32'
    ? ['/d', '/s', '/c', [npmCommand, ...args].join(' ')]
    : args;
  const result = spawnSync(command, commandArgs, { stdio: 'inherit' });
  if (result.error) {
    console.error(`Unable to start ${displayLabel}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`\nVERIFY ${mode.toUpperCase()} FAILED at ${displayLabel}.`);
    process.exit(result.status ?? 1);
  }
}

console.log(`\nVERIFY ${mode.toUpperCase()} PASSED.`);
