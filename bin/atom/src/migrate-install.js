// atom migrate-install — relocate a 0.1.x in-place install to ~/.atom/atom/.
//
// What it does:
//   1. Refuses if ~/.atom/atom/ already exists (you're either already on the
//      new layout, or have a hand-rolled experiment we don't want to clobber).
//   2. Clones https://github.com/machbuilds/atom.git → ~/.atom/atom/.
//   3. Re-installs every CLI globally from there (npm install + npm install -g .).
//   4. Leaves the user's old in-place clone alone — they decide whether
//      to delete it.
//
// What it does NOT do:
//   - It does not try to auto-detect where the old clone lives. npm copies
//     bin entries on `npm install -g .`, so globals don't reliably point
//     back at the source. The migration doc (docs/MIGRATING.md) walks the
//     user through cleanup of the old clone if they want.
//
// Env overrides (used for tests; users do not normally set these):
//   ATOM_HOME              base dir for the install (default ~/.atom)
//   ATOM_GIT_URL           upstream repo to clone from
//                          (default https://github.com/machbuilds/atom.git)

import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import color from 'picocolors';

const DEFAULT_GIT_URL = 'https://github.com/machbuilds/atom.git';
const CLIS = ['atom', 'atom-setup', 'nucleus', 'learnings', 'model-race'];

export async function runMigrateInstall(args) {
  const dryRun = args.includes('--dry-run');
  const yes = args.includes('--yes');

  const atomHome = process.env.ATOM_HOME || join(homedir(), '.atom');
  const target = join(atomHome, 'atom');
  const gitUrl = process.env.ATOM_GIT_URL || DEFAULT_GIT_URL;

  if (existsSync(target)) {
    fail(
      `${target} already exists.`,
      'Looks like you may already be on the new layout — or have an unrelated checkout there.',
      'If you are on 0.2.0+ and want a newer version, run `atom upgrade`.',
      `If the directory is leftover from an experiment, remove it first: rm -rf ${target}`,
    );
  }

  console.log('');
  console.log(`  ${color.cyan('atom migrate-install')} — relocating to the new layout`);
  console.log('');
  console.log(`  ${color.dim('Plan:')}`);
  console.log(`    ${color.dim('1. git clone')} ${gitUrl} ${color.dim('→')} ${target}`);
  console.log(`    ${color.dim('2. for each CLI: npm install + npm install -g .')}`);
  console.log(`    ${color.dim('3. Your old in-place clone is left alone.')}`);
  console.log('');

  if (dryRun) {
    console.log(`  ${color.dim('(dry-run) — nothing written. Re-run without --dry-run to migrate.')}`);
    return;
  }

  // Idempotency on partial failure: if clone created the dir but install
  // bombed, the user re-runs and we refuse because target exists. The doc
  // tells them to rm -rf and retry. Simpler than ad-hoc resume logic for a
  // one-shot command.

  console.log(`  ${color.dim('→ git clone')} ${color.cyan(gitUrl)}`);
  const clone = spawnSync('git', ['clone', '--quiet', gitUrl, target], { stdio: 'inherit' });
  if (clone.status !== 0) {
    fail(
      `git clone failed (exit ${clone.status}).`,
      `Tried: git clone ${gitUrl} ${target}`,
      'Check your network or git config, then re-run `atom migrate-install`.',
    );
  }
  console.log(`  ${color.green('✓')} cloned to ${target}`);
  console.log('');

  for (const cli of CLIS) {
    const cliDir = join(target, 'bin', cli);
    if (!existsSync(cliDir)) {
      console.log(`  ${color.dim('→')} ${cli} ${color.dim('(no bin/, skipping — atom layout drift?)')}`);
      continue;
    }
    console.log(`  ${color.dim('→ npm install')} ${color.dim(`(${cli})`)}`);
    const dep = spawnSync('npm', ['install'], { cwd: cliDir, stdio: 'inherit' });
    if (dep.status !== 0) {
      fail(
        `npm install failed for ${cli}.`,
        'Recover manually:',
        manualReinstallCmd(target),
      );
    }
    console.log(`  ${color.dim('→ npm install -g .')} ${color.dim(`(${cli})`)}`);
    const glob = spawnSync('npm', ['install', '-g', '.'], { cwd: cliDir, stdio: 'inherit' });
    if (glob.status !== 0) {
      fail(
        `npm install -g failed for ${cli}.`,
        'Common cause: EACCES on global install. Either re-run with sudo, or set up a user-owned npm prefix:',
        '  https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally',
        'Recover manually:',
        manualReinstallCmd(target),
      );
    }
  }

  console.log('');
  console.log(`  ${color.green('✓')} globals re-linked from ${color.cyan(target)}`);
  console.log('');
  console.log(`  ${color.bold('Next:')}`);
  console.log(`    ${color.dim('• Verify')} atom --version ${color.dim('reports your installed version')}`);
  console.log(`    ${color.dim('• Verify')} atom-setup --version ${color.dim('and the others as well')}`);
  console.log(`    ${color.dim('• Your old in-place clone is untouched — delete it once you trust the new install:')}`);
  console.log(`      ${color.dim('rm -rf /path/to/your/old/atom/clone')}`);
  console.log('');
  if (!yes) {
    console.log(`  ${color.dim('See docs/MIGRATING.md for the full walkthrough.')}`);
    console.log('');
  }
}

function manualReinstallCmd(installDir) {
  return `  cd ${installDir} && \\
    for cli in bin/atom bin/atom-setup bin/nucleus bin/learnings bin/model-race; do
      (cd "$cli" && npm install && npm install -g .)
    done`;
}

function fail(...lines) {
  console.error('');
  console.error(`  ${color.red('✗')} atom migrate-install: ${lines[0]}`);
  for (const line of lines.slice(1)) {
    console.error(`  ${color.dim(line)}`);
  }
  console.error('');
  process.exit(1);
}
