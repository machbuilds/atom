import { existsSync } from 'node:fs';
import color from 'picocolors';
import { readState, worktreePath, specPath, RACE_DIR } from '../lib/race.js';
import { resolveConfig } from '../lib/config.js';
import { diffNumStat } from '../lib/git.js';

export function registerStatusCommand(program) {
  program
    .command('status')
    .description('Show the current race state.')
    .option('--json', 'output JSON')
    .action((opts) => {
      const cwd = process.cwd();
      const state = readState(cwd);

      if (!state) {
        if (opts.json) console.log('null');
        else console.log(color.dim('No race active. Start one with `model-race start <feature>`.'));
        return;
      }

      let config;
      try {
        config = resolveConfig();
      } catch {
        config = null;
      }

      const enriched = state.models.map((m) => {
        const path = config ? worktreePath(cwd, config, m.name) : null;
        const exists = path ? existsSync(path) : false;
        const stats = path && exists ? diffNumStat(path, state.baseBranch || 'main') : null;
        return { ...m, path, exists, stats };
      });

      if (opts.json) {
        console.log(JSON.stringify({ ...state, models: enriched }, null, 2));
        return;
      }

      console.log('');
      console.log(`${color.bold('Race:')}     ${color.cyan(state.feature)}`);
      console.log(`${color.bold('Status:')}   ${color.yellow(state.status)}`);
      console.log(`${color.bold('Started:')}  ${color.dim(state.startedAt)}`);
      console.log(`${color.bold('Base:')}     ${color.dim(state.baseBranch || 'main')}`);
      console.log(`${color.bold('Spec:')}     ${color.cyan(`${RACE_DIR}/spec.md`)} (${existsSync(specPath(cwd)) ? color.green('present') : color.red('missing')})`);
      console.log('');
      console.log(`${color.bold('Models:')}`);
      for (const m of enriched) {
        const dot = m.exists ? color.green('●') : color.red('○');
        const stats = m.stats
          ? `${color.dim(`+${m.stats.added} -${m.stats.removed}`)}`
          : color.dim('(no commits)');
        console.log(`  ${dot} ${color.cyan(m.name.padEnd(12))} ${color.dim(m.path || 'unknown path')}  ${stats}`);
      }
      console.log('');
      console.log(color.dim('Next: `model-race score` · `model-race judge` · `model-race merge <winner>`'));
    });
}
