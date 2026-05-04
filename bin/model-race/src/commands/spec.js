import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import color from 'picocolors';
import { readSpec, writeSpec, specPath, readState, worktreePath } from '../lib/race.js';
import { resolveConfig } from '../lib/config.js';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function registerSpecCommand(program) {
  program
    .command('spec')
    .description('Show or edit the shared race spec.')
    .option('--edit', 'open spec in $EDITOR')
    .option('--sync', 'after editing, mirror the spec into every worktree as RACE_SPEC.md')
    .action((opts) => {
      const cwd = process.cwd();
      const state = readState(cwd);
      if (!state) {
        console.error('No race active.');
        process.exit(1);
      }

      const path = specPath(cwd);
      if (!existsSync(path)) {
        console.error(`Spec missing at ${path}. Run \`model-race start\` first.`);
        process.exit(1);
      }

      if (opts.edit) {
        const editor = process.env.EDITOR || process.env.VISUAL || 'nano';
        const r = spawnSync(editor, [path], { stdio: 'inherit' });
        if (r.status !== 0) {
          console.error('Editor exited non-zero. Spec may not be saved.');
          process.exit(1);
        }
      }

      if (opts.sync || opts.edit) {
        const config = resolveConfig();
        const spec = readSpec(cwd);
        for (const m of state.models) {
          const wt = worktreePath(cwd, config, m.name);
          if (!existsSync(wt)) continue;
          try {
            writeFileSync(join(wt, 'RACE_SPEC.md'), spec);
            console.log(`${color.green('✓')} synced into ${color.cyan(m.name)}`);
          } catch (err) {
            console.error(`${color.red('✗')} failed to sync into ${m.name}: ${err.message}`);
          }
        }
        return;
      }

      // default: print spec
      const spec = readSpec(cwd);
      process.stdout.write(spec);
    });
}
