import { existsSync } from 'node:fs';
import { intro, outro, confirm, select, text, isCancel, cancel, log, note, spinner } from '@clack/prompts';
import color from 'picocolors';
import { LEARNINGS_HOME } from '../lib/paths.js';
import { readConfig, writeConfig, ensureHome, DEFAULT_CONFIG } from '../lib/io.js';
import {
  isGitRepo, gitInit, gitSetRemote,
  ghAvailable, ghAuthenticated, ghUsername, ghCreateRepo,
} from '../lib/git.js';

export function registerInitCommand(program) {
  program
    .command('init')
    .description('Initialize ~/.atom/learnings (one-time per machine). Optionally wires GitHub sync.')
    .option('--yes', 'use defaults, no prompts')
    .option('--setup-sync', 'only run the GitHub sync setup flow')
    .action(async (opts) => {
      if (opts.setupSync) {
        await setupSyncFlow();
        return;
      }
      await initFlow({ yes: opts.yes });
    });
}

async function initFlow({ yes }) {
  const existing = readConfig();
  if (existing && !yes) {
    log.info(`${color.dim('~/.atom/learnings already initialized.')} Re-running keeps your data; only re-asks unanswered questions.`);
  }

  intro(`${color.bgCyan(color.black(' learnings init '))}  ${color.dim('your local playbook')}`);

  ensureHome();
  let config = existing || { ...DEFAULT_CONFIG };

  if (yes) {
    writeConfig({ ...DEFAULT_CONFIG, ...config });
    outro(`${color.green('✓')} Initialized at ${color.cyan(LEARNINGS_HOME)}`);
    return;
  }

  const wantSync = await confirm({
    message: 'Sync ~/.atom/learnings to a private GitHub repo for cross-machine access?',
    initialValue: config.sync?.enabled ?? false,
  });
  if (isCancel(wantSync)) return cancel('Cancelled.');

  config.sync = config.sync || { enabled: false, remote: null };
  config.sync.enabled = wantSync;

  writeConfig(config);

  if (wantSync) {
    await wireSyncRepo(config);
  }

  initLocalGitRepo();

  note(
    `${color.dim('Sync:')}        ${config.sync.enabled ? color.green('enabled') : color.gray('disabled')}
${color.dim('Sync remote:')} ${config.sync.remote ? color.cyan(config.sync.remote) : color.gray('none')}
${color.dim('Location:')}    ${color.cyan(LEARNINGS_HOME)}`,
    'learnings configured',
  );

  outro(`${color.green('✓')} Ready. Promote nucleus entries here with ${color.cyan('nucleus promote <id>')}.`);
}

async function setupSyncFlow() {
  const config = readConfig();
  if (!config) {
    console.error('learnings not initialized. Run `learnings init` first.');
    process.exit(1);
  }
  intro(`${color.bgCyan(color.black(' learnings sync setup '))}`);
  await wireSyncRepo(config);
  config.sync.enabled = true;
  writeConfig(config);
  initLocalGitRepo();
  outro(`${color.green('✓')} Sync wired.`);
}

async function wireSyncRepo(config) {
  const choice = await select({
    message: 'GitHub sync repo',
    options: [
      { value: 'create-new', label: 'Create new private repo via gh' },
      { value: 'existing', label: 'I have an existing repo URL' },
      { value: 'skip', label: 'Skip for now' },
    ],
    initialValue: 'create-new',
  });
  if (isCancel(choice) || choice === 'skip') {
    config.sync.enabled = false;
    return;
  }

  if (choice === 'existing') {
    const url = await text({
      message: 'Repo URL (https or ssh)',
      validate: (v) => (v && v.length > 0 ? undefined : 'Required'),
    });
    if (isCancel(url)) return;
    config.sync.remote = url.trim();
    return;
  }

  if (!ghAvailable()) {
    log.warn('gh CLI not detected.');
    log.info(`Install via ${color.cyan('brew install gh')}, then re-run with ${color.cyan('learnings init --setup-sync')}.`);
    config.sync.enabled = false;
    return;
  }
  if (!ghAuthenticated()) {
    log.warn('gh CLI is installed but not authenticated.');
    log.info(`Run ${color.cyan('gh auth login')} then re-run with ${color.cyan('learnings init --setup-sync')}.`);
    config.sync.enabled = false;
    return;
  }

  const user = ghUsername();
  const defaultName = `learnings-${user || 'me'}`;

  const repoName = await text({
    message: 'Repo name',
    placeholder: defaultName,
    initialValue: defaultName,
    validate: (v) => (/^[a-z0-9][a-z0-9-]*$/i.test(v.trim()) ? undefined : 'Letters, numbers, dashes only'),
  });
  if (isCancel(repoName)) return;

  const s = spinner();
  s.start(`Creating ${color.cyan(`${user}/${repoName}`)}`);
  try {
    ghCreateRepo(repoName.trim(), { visibility: 'private' });
    s.stop(`Created ${color.cyan(`${user}/${repoName}`)}`);
  } catch (err) {
    s.stop(color.red('Failed to create repo'));
    log.error(err.message);
    config.sync.enabled = false;
    return;
  }
  config.sync.remote = `git@github.com:${user}/${repoName}.git`;
}

function initLocalGitRepo() {
  if (isGitRepo(LEARNINGS_HOME)) return;
  try {
    gitInit(LEARNINGS_HOME);
  } catch {}
}
