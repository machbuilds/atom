import { existsSync } from 'node:fs';
import color from 'picocolors';
import { spinner, log } from '@clack/prompts';
import { LEARNINGS_HOME } from '../lib/paths.js';
import { readConfig } from '../lib/io.js';
import {
  isGitRepo, gitInit, gitAddAll, gitCommit, gitSetRemote, gitPush, gitPull,
} from '../lib/git.js';

export function registerSyncCommand(program) {
  program
    .command('sync')
    .description('Push and pull ~/.atom/learnings to/from the configured GitHub repo.')
    .option('--push-only', 'do not pull')
    .option('--pull-only', 'do not push')
    .option('-m, --message <msg>', 'commit message', `learnings: sync ${new Date().toISOString()}`)
    .action((opts) => {
      const config = readConfig();
      if (!config) {
        console.error('learnings not initialized. Run `learnings init` first.');
        process.exit(1);
      }
      if (!config.sync?.enabled || !config.sync?.remote) {
        console.error('Sync is not configured. Run `learnings init --setup-sync`.');
        process.exit(1);
      }
      if (!existsSync(LEARNINGS_HOME)) {
        console.error(`${LEARNINGS_HOME} does not exist.`);
        process.exit(1);
      }

      if (!isGitRepo(LEARNINGS_HOME)) gitInit(LEARNINGS_HOME);

      try {
        gitSetRemote(LEARNINGS_HOME, 'origin', config.sync.remote);
      } catch (err) {
        log.error(err.message);
        process.exit(1);
      }

      try {
        gitAddAll(LEARNINGS_HOME);
        try {
          gitCommit(LEARNINGS_HOME, opts.message);
        } catch {
          log.info(color.dim('Nothing to commit.'));
        }
      } catch (err) {
        log.error(err.message);
        process.exit(1);
      }

      if (!opts.pushOnly) {
        const s = spinner();
        s.start('Pulling');
        try {
          gitPull(LEARNINGS_HOME, 'origin', 'main');
          s.stop(`${color.green('✓')} Pulled`);
        } catch {
          s.stop(color.dim('Pull skipped (likely empty remote)'));
        }
      }

      if (!opts.pullOnly) {
        const s = spinner();
        s.start('Pushing');
        try {
          gitPush(LEARNINGS_HOME, 'origin', 'main');
          s.stop(`${color.green('✓')} Pushed`);
        } catch (err) {
          s.stop(color.red('Push failed'));
          log.error(err.message);
          process.exit(1);
        }
      }
    });
}
