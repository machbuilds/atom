#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { registerSlugCommand } from '../src/commands/slug.js';
import { registerInitCommand } from '../src/commands/init.js';
import { registerAddCommand } from '../src/commands/add.js';
import { registerSearchCommand } from '../src/commands/search.js';
import { registerSyncCommand } from '../src/commands/sync.js';
import { registerPromoteCommand } from '../src/commands/promote.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
);

const program = new Command();

program
  .name('nucleus')
  .description(
    'Cross-project learning store. Captures session learnings into ~/.nucleus.',
  )
  .version(pkg.version);

registerSlugCommand(program);
registerInitCommand(program);
registerAddCommand(program);
registerSearchCommand(program);
registerSyncCommand(program);
registerPromoteCommand(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
