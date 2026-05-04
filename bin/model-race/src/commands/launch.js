import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import color from 'picocolors';
import { resolveConfig } from '../lib/config.js';
import { readState, worktreePath, specPath } from '../lib/race.js';

export function registerLaunchCommand(program) {
  program
    .command('launch <model>')
    .description('Open an AI CLI session in the worktree for the given model.')
    .option('--cli <bin>', 'override the CLI to spawn (default: from config)')
    .option('--print-only', 'print the cd + cli command instead of running it')
    .action((modelName, opts) => {
      const cwd = process.cwd();
      const state = readState(cwd);
      if (!state) {
        console.error('No race active. Start one with `model-race start <feature>`.');
        process.exit(1);
      }

      const config = resolveConfig();
      const stateModel = state.models.find((m) => m.name === modelName);
      if (!stateModel) {
        console.error(
          `Model "${modelName}" is not part of this race. Active models: ${state.models.map((m) => m.name).join(', ')}`,
        );
        process.exit(1);
      }

      const wt = worktreePath(cwd, config, modelName);
      if (!existsSync(wt)) {
        console.error(`Worktree missing for ${modelName}: ${wt}`);
        process.exit(1);
      }

      const cli = opts.cli || stateModel.cli;
      const args = stateModel.args || [];

      if (opts.printOnly) {
        const argsStr = args.length > 0 ? ' ' + args.map(shellQuote).join(' ') : '';
        console.log(`cd ${shellQuote(wt)} && ${cli}${argsStr}`);
        return;
      }

      const specAbs = specPath(cwd);
      console.log(`${color.dim('→')} ${color.cyan(`cd ${wt}`)}`);
      console.log(`${color.dim('→')} ${color.cyan(`${cli} ${args.join(' ')}`.trim())}`);
      console.log('');
      console.log(`${color.dim('Spec:')} ${color.cyan(specAbs)}`);
      console.log(color.dim(`When the AI starts, paste or reference the spec above. The worktree branches from "${state.baseBranch || 'main'}".`));
      console.log('');

      const r = spawnSync(cli, args, { cwd: wt, stdio: 'inherit' });
      if (r.error && r.error.code === 'ENOENT') {
        console.error('');
        console.error(color.red(`Could not find "${cli}" on PATH.`));
        console.error(color.dim(`Install it, or override via \`model-race launch ${modelName} --cli <other-bin>\``));
        process.exit(1);
      }
      process.exit(r.status || 0);
    });
}

function shellQuote(s) {
  if (/^[A-Za-z0-9._/-]+$/.test(s)) return s;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
