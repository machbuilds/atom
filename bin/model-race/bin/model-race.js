#!/usr/bin/env node
import '../src/lib/update-check-client.js';
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { registerStartCommand } from '../src/commands/start.js';
import { registerStatusCommand } from '../src/commands/status.js';
import { registerSpecCommand } from '../src/commands/spec.js';
import { registerLaunchCommand } from '../src/commands/launch.js';
import { registerScoreCommand } from '../src/commands/score.js';
import { registerJudgeCommand } from '../src/commands/judge.js';
import { registerMergeCommand } from '../src/commands/merge.js';
import { registerAbortCommand } from '../src/commands/abort.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
);

const program = new Command();

program
  .name('model-race')
  .description(
    'Run the same feature spec through multiple AI models via Git worktrees. Compare and merge the winner.',
  )
  .version(pkg.version);

registerStartCommand(program);
registerStatusCommand(program);
registerSpecCommand(program);
registerLaunchCommand(program);
registerScoreCommand(program);
registerJudgeCommand(program);
registerMergeCommand(program);
registerAbortCommand(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
