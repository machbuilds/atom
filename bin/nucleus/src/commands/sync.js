import { existsSync } from 'node:fs';
import color from 'picocolors';
import { spinner, log } from '@clack/prompts';
import { readConfig } from '../lib/config.js';
import { NUCLEUS_HOME } from '../lib/paths.js';
import {
  isGitRepo,
  gitInit,
  gitAddAll,
  gitCommit,
  gitSetRemote,
  gitPush,
  gitPull,
} from '../lib/git.js';

export function registerSyncCommand(program) {
  program
    .command('sync')
    .description('Push and pull ~/.nucleus to/from the configured GitHub repo.')
    .option('--push-only', 'do not pull')
    .option('--pull-only', 'do not push')
    .option('-m, --message <msg>', 'commit message', `nucleus: sync ${new Date().toISOString()}`)
    .action((opts) => {
      const config = readConfig();
      if (!config) {
        console.error('nucleus not initialized. Run `nucleus init` first.');
        process.exit(1);
      }
      if (!config.sync?.enabled || !config.sync?.remote) {
        console.error('Sync is not configured. Run `nucleus init --setup-sync`.');
        process.exit(1);
      }
      if (!existsSync(NUCLEUS_HOME)) {
        console.error(`${NUCLEUS_HOME} does not exist.`);
        process.exit(1);
      }

      if (!isGitRepo(NUCLEUS_HOME)) {
        gitInit(NUCLEUS_HOME);
      }

      try {
        gitSetRemote(NUCLEUS_HOME, 'origin', config.sync.remote);
      } catch (err) {
        log.error(err.message);
        process.exit(1);
      }

      try {
        gitAddAll(NUCLEUS_HOME);
        try {
          gitCommit(NUCLEUS_HOME, opts.message);
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
          gitPull(NUCLEUS_HOME, 'origin', 'main');
          s.stop(`${color.green('✓')} Pulled`);
        } catch (err) {
          s.stop(color.dim('Pull skipped (likely empty remote)'));
        }
      }

      if (!opts.pullOnly) {
        const s = spinner();
        s.start('Pushing');
        try {
          gitPush(NUCLEUS_HOME, 'origin', 'main');
          s.stop(`${color.green('✓')} Pushed`);
        } catch (err) {
          s.stop(color.red('Push failed'));
          log.error(err.message);
          process.exit(1);
        }
      }
    });
}
