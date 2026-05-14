#!/usr/bin/env node
// atom-update-check — background worker + snooze CLI.
//
//   atom-update-check tick                 do one network poll, update state file
//   atom-update-check --snooze 24h|48h|7d  suppress notices for a tier
//   atom-update-check --status             dump the state file (debug/test)
//   atom-update-check --help               this screen
//
// The "should we print a notice now?" decision is inlined into each atom
// CLI's startup. This binary handles only the parts that need to outlive
// the parent (network fetch) or that should not be duplicated across the
// 5 CLIs (snooze tier parsing + state writes).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runTick, applySnooze, printStatus } from '../src/check.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-V')) {
  console.log(pkg.version);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h') || args.length === 0) {
  process.stdout.write(`
atom-update-check — background update-check worker for atom.

Usage:
  atom-update-check tick                    do one network poll, update state file
  atom-update-check --snooze 24h|48h|7d     suppress upgrade notices for a tier
  atom-update-check --status                dump the current state file (debug)
  atom-update-check --version               version of this worker

This binary is not normally invoked by hand. Each atom CLI runs the
client logic on startup (synchronous, JSON-file read) and spawns this
worker detached when the throttle window expires.

Use \`atom upgrade --snooze 7d\` for the user-facing snooze command.
`);
  process.exit(0);
}

const cmd = args[0];

if (cmd === 'tick') {
  await runTick();
  process.exit(0);
}

if (cmd === '--status') {
  printStatus();
  process.exit(0);
}

if (cmd === '--snooze') {
  const duration = args[1];
  if (!duration) {
    console.error('atom-update-check --snooze requires a duration (24h, 48h, or 7d).');
    process.exit(1);
  }
  applySnooze(duration);
  process.exit(0);
}

console.error(`atom-update-check: unknown command '${cmd}'. Try --help.`);
process.exit(1);
