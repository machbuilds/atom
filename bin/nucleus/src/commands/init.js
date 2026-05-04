import {
  intro,
  outro,
  text,
  confirm,
  select,
  spinner,
  isCancel,
  cancel,
  note,
  log,
} from '@clack/prompts';
import color from 'picocolors';
import { existsSync } from 'node:fs';
import {
  readConfig,
  writeConfig,
  DEFAULT_CONFIG,
} from '../lib/config.js';
import {
  NUCLEUS_HOME,
} from '../lib/paths.js';
import {
  isGitRepo,
  gitInit,
  gitAddAll,
  gitCommit,
  gitSetRemote,
  gitPush,
  ghAvailable,
  ghAuthenticated,
  ghUsername,
  ghCreateRepo,
} from '../lib/git.js';
import { mkdirSync } from 'node:fs';

export function registerInitCommand(program) {
  program
    .command('init')
    .description('Initialize ~/.nucleus and (optionally) wire GitHub sync.')
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
    log.info(`${color.dim('~/.nucleus already initialized.')} Re-running keeps your data; only re-asks unanswered questions.`);
  }

  intro(`${color.bgCyan(color.black(' nucleus init '))}  ${color.dim('cross-project learning store')}`);

  ensureNucleusHome();

  let config = existing || { ...DEFAULT_CONFIG };

  if (yes) {
    config = { ...DEFAULT_CONFIG, ...config };
    writeConfig(config);
    outro(`${color.green('✓')} Initialized at ${color.cyan(NUCLEUS_HOME)}`);
    return;
  }

  const captureMode = await select({
    message: 'How should learnings be captured?',
    options: [
      {
        value: 'claude-managed',
        label: 'Claude-managed',
        hint: 'at session boundaries · recommended',
      },
      {
        value: 'auto-timer',
        label: 'Auto-timer',
        hint: 'background process, every N minutes',
      },
      {
        value: 'manual',
        label: 'Manual',
        hint: 'you call nucleus add yourself',
      },
    ],
    initialValue: config.captureMode || 'claude-managed',
  });
  if (isCancel(captureMode)) return cancel('Cancelled.');
  config.captureMode = captureMode;

  if (captureMode === 'auto-timer') {
    const interval = await select({
      message: 'Auto-timer interval',
      options: [
        { value: 5, label: '5 minutes' },
        { value: 15, label: '15 minutes' },
        { value: 30, label: '30 minutes' },
        { value: 60, label: '60 minutes' },
      ],
      initialValue: config.autoTimerMinutes || 15,
    });
    if (isCancel(interval)) return cancel('Cancelled.');
    config.autoTimerMinutes = interval;
  }

  const wantSync = await confirm({
    message: 'Sync ~/.nucleus to GitHub for cross-machine access?',
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
    `${color.dim('Capture mode:')}  ${color.yellow(config.captureMode)}
${color.dim('Sync:')}          ${config.sync.enabled ? color.green('enabled') : color.gray('disabled')}
${color.dim('Sync remote:')}   ${config.sync.remote ? color.cyan(config.sync.remote) : color.gray('none')}
${color.dim('Location:')}      ${color.cyan(NUCLEUS_HOME)}`,
    'nucleus configured',
  );

  outro(`${color.green('✓')} Ready. Run ${color.cyan('nucleus add "..."')} to capture your first learning.`);
}

async function setupSyncFlow() {
  const config = readConfig();
  if (!config) {
    console.error('nucleus not initialized. Run `nucleus init` first.');
    process.exit(1);
  }
  intro(`${color.bgCyan(color.black(' nucleus sync setup '))}`);
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
    log.info(`Install via ${color.cyan('brew install gh')} (or see https://cli.github.com), then re-run with ${color.cyan('nucleus init --setup-sync')}.`);
    config.sync.enabled = false;
    return;
  }

  if (!ghAuthenticated()) {
    log.warn('gh CLI is installed but not authenticated.');
    log.info(`Run ${color.cyan('gh auth login')} then re-run with ${color.cyan('nucleus init --setup-sync')}.`);
    config.sync.enabled = false;
    return;
  }

  const user = ghUsername();
  const defaultName = `nucleus-${user || 'me'}`;

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

function ensureNucleusHome() {
  if (!existsSync(NUCLEUS_HOME)) {
    mkdirSync(NUCLEUS_HOME, { recursive: true });
  }
}

function initLocalGitRepo() {
  if (isGitRepo(NUCLEUS_HOME)) return;
  try {
    gitInit(NUCLEUS_HOME);
  } catch {
    // git not available; skip silently. sync will fail later if attempted.
  }
}
