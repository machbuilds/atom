import { existsSync, rmSync } from 'node:fs';
import color from 'picocolors';
import { confirm, isCancel, intro, outro, log } from '@clack/prompts';
import { resolveConfig } from '../lib/config.js';
import {
  readState,
  worktreePath,
  branchName,
  raceRoot,
} from '../lib/race.js';
import { removeWorktree, deleteBranch, repoRoot } from '../lib/git.js';

export function registerAbortCommand(program) {
  program
    .command('abort')
    .description('Tear down all worktrees and branches for the active race. Destructive: all in-progress work in worktrees is lost.')
    .option('--yes', 'skip confirmation')
    .option('--keep-branches', 'remove worktrees but keep branches (so you can resume later)')
    .action(async (opts) => {
      const cwd = process.cwd();
      const state = readState(cwd);
      if (!state) {
        console.error('No race active.');
        process.exit(1);
      }

      const config = resolveConfig();

      intro(`${color.bgRed(color.white(' model-race abort '))}  ${color.dim(state.feature)}`);

      if (!opts.yes) {
        const ok = await confirm({
          message: `This will remove ${state.models.length} worktrees${opts.keepBranches ? '' : ' and their branches'}. Uncommitted work in those worktrees will be lost. Continue?`,
          initialValue: false,
        });
        if (isCancel(ok) || !ok) {
          outro('Aborted.');
          return;
        }
      }

      const root = repoRoot(cwd);

      for (const m of state.models) {
        const wt = worktreePath(cwd, config, m.name);
        const br = branchName(config, state.feature, m.name);
        if (existsSync(wt)) {
          try {
            removeWorktree(root, wt, true);
            log.info(`removed worktree ${color.dim(wt)}`);
          } catch (err) {
            log.warn(`failed to remove ${wt}: ${err.message}`);
          }
        }
        if (!opts.keepBranches) {
          try {
            deleteBranch(root, br, true);
            log.info(`deleted branch ${color.dim(br)}`);
          } catch (err) {
            log.warn(`failed to delete ${br}: ${err.message}`);
          }
        }
      }

      try {
        rmSync(raceRoot(cwd), { recursive: true, force: true });
        log.info('removed .race/');
      } catch (err) {
        log.warn(`failed to remove .race/: ${err.message}`);
      }

      outro(`${color.green('✓')} Race torn down.`);
    });
}
