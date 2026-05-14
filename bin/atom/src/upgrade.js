// atom upgrade — fetch a new release of atom and re-install CLIs.
//
// Polls the user's installed VERSION against
// raw.githubusercontent.com/.../main/VERSION. When they differ, runs
// `git pull` in the install dir and re-installs every CLI globally.
//
// Install detection:
//   1. $ATOM_INSTALL env var (override; used for tests).
//   2. ~/.atom/atom/ (canonical location after v0.2 Wave 3 lands).
//   3. Walk up from this script's real path (catches the legacy
//      in-place model, where globals symlink back to the source dir).
//
// Refuses to upgrade if the install dir's git tree is dirty — the
// user has been editing it and a pull might lose work.

import { existsSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import color from 'picocolors';

const DEFAULT_VERSION_URL = 'https://raw.githubusercontent.com/machbuilds/atom/main/VERSION';
const VERSION_URL = process.env.ATOM_VERSION_URL || DEFAULT_VERSION_URL;
const CLIS = ['atom', 'atom-setup', 'nucleus', 'learnings', 'model-race', 'atom-update-check'];

export async function runUpgrade(args) {
  // --snooze is handled by the update-check worker, which owns the
  // state file. We delegate so there's only one writer of update-check.json.
  const snoozeIdx = args.indexOf('--snooze');
  if (snoozeIdx !== -1) {
    const duration = args[snoozeIdx + 1];
    if (!duration) {
      fail('--snooze requires a duration. Use one of: 24h, 48h, 7d');
    }
    const r = spawnSync('atom-update-check', ['--snooze', duration], { stdio: 'inherit' });
    process.exit(r.status ?? 1);
  }

  const checkOnly = args.includes('--check');

  const installDir = findInstallDir();
  if (!installDir) {
    fail(
      'no atom install found.',
      'Looked in: $ATOM_INSTALL, ~/.atom/atom/, and walked up from this script.',
      'To install: curl -fsSL https://raw.githubusercontent.com/machbuilds/atom/main/install.sh | bash',
    );
  }

  const localVersion = readLocalVersion(installDir);
  const upstreamVersion = await fetchUpstreamVersion();

  if (!upstreamVersion) {
    if (checkOnly) {
      console.log(color.dim('  could not reach upstream — skipping check'));
      return;
    }
    fail(
      'could not reach upstream to check for a new version.',
      `Tried: ${VERSION_URL}`,
      'Check your network and retry, or upgrade manually:',
      manualUpgradeCmd(installDir),
    );
  }

  if (localVersion === upstreamVersion) {
    console.log(`  ${color.green('✓')} atom is up to date (${color.bold(localVersion)})`);
    return;
  }

  console.log(`  ${color.cyan('atom')} ${color.dim(localVersion)} → ${color.bold(upstreamVersion)}`);

  if (checkOnly) {
    console.log(color.dim(`  run \`atom upgrade\` to install`));
    return;
  }

  // Pre-flight: refuse on dirty tree
  const dirty = isDirty(installDir);
  if (dirty) {
    fail(
      `install dir has uncommitted changes: ${installDir}`,
      'atom upgrade is for clean installs. To upgrade anyway, commit or stash first.',
      'Or upgrade manually:',
      manualUpgradeCmd(installDir),
    );
  }

  // git pull
  console.log(`  ${color.dim('→ git pull')}`);
  const pull = spawnSync('git', ['pull', '--ff-only'], {
    cwd: installDir,
    stdio: 'inherit',
  });
  if (pull.status !== 0) {
    fail(
      'git pull failed.',
      'Resolve manually, then re-run `atom upgrade`. Manual upgrade command:',
      manualUpgradeCmd(installDir),
    );
  }

  // Re-install each CLI: npm install (deps) then npm install -g . (global)
  for (const cli of CLIS) {
    const cliDir = join(installDir, 'bin', cli);
    if (!existsSync(cliDir)) {
      console.log(`  ${color.dim('→')} ${cli} ${color.dim('(missing dir, skipping)')}`);
      continue;
    }
    process.stdout.write(`  ${color.dim('→ npm install')} ${color.dim(`(${cli})`)}\n`);
    let r = spawnSync('npm', ['install'], { cwd: cliDir, stdio: 'inherit' });
    if (r.status !== 0) {
      fail(
        `npm install failed for ${cli}.`,
        'Recover manually:',
        manualUpgradeCmd(installDir),
      );
    }
    process.stdout.write(`  ${color.dim('→ npm install -g .')} ${color.dim(`(${cli})`)}\n`);
    r = spawnSync('npm', ['install', '-g', '.'], { cwd: cliDir, stdio: 'inherit' });
    if (r.status !== 0) {
      fail(
        `npm install -g failed for ${cli}.`,
        'Common cause: EACCES on global install. Either re-run with sudo, or set up a user-owned npm prefix:',
        '  https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally',
        'Recover manually:',
        manualUpgradeCmd(installDir),
      );
    }
  }

  console.log(`\n  ${color.green('✓')} now on atom ${color.bold(upstreamVersion)}`);
}

function findInstallDir() {
  // 1. env override
  const env = process.env.ATOM_INSTALL;
  if (env && hasInstallMarker(env)) return env;

  // 2. canonical
  const canonical = join(homedir(), '.atom', 'atom');
  if (hasInstallMarker(canonical)) return canonical;

  // 3. walk up from this script's real path (handles in-place install
  //    where globals symlink back to the source dir)
  let dir;
  try {
    dir = realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return null;
  }
  for (let i = 0; i < 12; i++) {
    dir = dirname(dir);
    if (dir === '/' || dir === '.') break;
    if (hasInstallMarker(dir)) return dir;
  }

  return null;
}

function hasInstallMarker(dir) {
  // An atom install has both a VERSION file and the bin/atom-setup CLI.
  try {
    return (
      existsSync(join(dir, 'VERSION')) &&
      existsSync(join(dir, 'bin', 'atom-setup', 'package.json')) &&
      statSync(join(dir, 'bin', 'atom-setup')).isDirectory()
    );
  } catch {
    return false;
  }
}

function readLocalVersion(installDir) {
  try {
    return readFileSync(join(installDir, 'VERSION'), 'utf8').trim();
  } catch {
    return 'unknown';
  }
}

async function fetchUpstreamVersion() {
  // Best-effort fetch; null on any error (network, parse, etc.)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(VERSION_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = await res.text();
    const trimmed = text.trim();
    // Sanity check: SemVer-ish only
    if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(trimmed)) return null;
    return trimmed;
  } catch {
    return null;
  }
}

function isDirty(installDir) {
  // git status --porcelain returns non-empty when tree is dirty.
  // Returns false if .git is missing (someone copied the dir without history).
  if (!existsSync(join(installDir, '.git'))) return false;
  const r = spawnSync('git', ['status', '--porcelain'], {
    cwd: installDir,
    encoding: 'utf8',
  });
  if (r.status !== 0) return true; // err on side of refusing
  return r.stdout.trim().length > 0;
}

function manualUpgradeCmd(installDir) {
  return `  cd ${installDir} && git pull && \\
    for cli in bin/atom bin/atom-setup bin/nucleus bin/learnings bin/model-race bin/atom-update-check; do
      (cd "$cli" && npm install && npm install -g .)
    done`;
}

function fail(...lines) {
  console.error('');
  console.error(`  ${color.red('✗')} atom upgrade: ${lines[0]}`);
  for (const line of lines.slice(1)) {
    console.error(`  ${color.dim(line)}`);
  }
  console.error('');
  process.exit(1);
}
