import { existsSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import color from 'picocolors';
import { confirm, isCancel, intro, outro, log, spinner } from '@clack/prompts';
import { resolveConfig } from '../lib/config.js';
import {
  readState,
  worktreePath,
  branchName,
  writeState,
  raceRoot,
} from '../lib/race.js';
import {
  removeWorktree,
  deleteBranch,
  cherryPick,
  repoRoot,
  currentBranch,
} from '../lib/git.js';

export function registerMergeCommand(program) {
  program
    .command('merge <winner>')
    .description('Cherry-pick the winning branch onto the current branch and clean up the losers.')
    .option('--no-cleanup', 'do not delete losing worktrees and branches')
    .option('--keep-state', 'keep .race/state.json (default: archive it)')
    .option('--yes', 'skip confirmation prompts')
    .action(async (winner, opts) => {
      const cwd = process.cwd();
      const root = repoRoot(cwd);
      const state = readState(cwd);
      if (!state) {
        console.error('No race active.');
        process.exit(1);
      }

      const config = resolveConfig();
      const winnerModel = state.models.find((m) => m.name === winner);
      if (!winnerModel) {
        console.error(
          `"${winner}" is not part of this race. Active: ${state.models.map((m) => m.name).join(', ')}`,
        );
        process.exit(1);
      }

      intro(`${color.bgCyan(color.black(' model-race merge '))}  winner: ${color.cyan(winner)}`);

      const branch = branchName(config, state.feature, winner);
      const target = currentBranch(root);

      if (target === branch) {
        log.error(`You are currently on ${branch}. Switch to ${state.baseBranch || 'main'} (or another target branch) before merging.`);
        process.exit(1);
      }

      if (!opts.yes) {
        const proceed = await confirm({
          message: `Cherry-pick ${color.cyan(branch)} onto ${color.cyan(target)} and ${opts.cleanup === false ? 'keep' : 'remove'} the other ${state.models.length - 1} worktrees?`,
          initialValue: true,
        });
        if (isCancel(proceed) || !proceed) return;
      }

      const s = spinner();
      s.start(`Cherry-picking ${branch}`);
      try {
        cherryPick(root, branch);
        s.stop(`${color.green('✓')} ${branch} merged into ${target}`);
      } catch (err) {
        s.stop(color.red(`Cherry-pick failed: ${err.message}`));
        log.error('Resolve conflicts manually, run `git cherry-pick --continue`, then re-run `model-race merge --keep-state` to clean up.');
        process.exit(1);
      }

      if (opts.cleanup !== false) {
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
          // Delete the branch even for the winner — its work is now on the
          // target branch via cherry-pick. Keeping the original branch leaves
          // dead weight.
          try {
            deleteBranch(root, br, true);
            log.info(`deleted branch ${color.dim(br)}`);
          } catch (err) {
            log.warn(`failed to delete ${br}: ${err.message}`);
          }
        }
      }

      if (opts.keepState) {
        writeState(cwd, { ...state, status: 'merged', winner, mergedAt: new Date().toISOString() });
      } else {
        try {
          rmSync(raceRoot(cwd), { recursive: true, force: true });
          log.info('removed .race/');
        } catch (err) {
          log.warn(`failed to remove .race/: ${err.message}`);
        }
      }

      outro(`${color.green('✓')} ${color.bold(winner)} merged.`);
    });
}
