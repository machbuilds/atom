#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { registerInitCommand } from '../src/commands/init.js';
import { registerListCommand } from '../src/commands/list.js';
import { registerShowCommand } from '../src/commands/show.js';
import { registerRemoveCommand } from '../src/commands/remove.js';
import { registerSyncCommand } from '../src/commands/sync.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const program = new Command();
program
  .name('learnings')
  .description('Your local playbook of generalized patterns. Lives at ~/.atom/learnings.')
  .version(pkg.version);

registerInitCommand(program);
registerListCommand(program);
registerShowCommand(program);
registerRemoveCommand(program);
registerSyncCommand(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
