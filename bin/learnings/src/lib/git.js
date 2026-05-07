import { execSync, spawnSync } from 'node:child_process';

export function isGitRepo(cwd) {
  try {
    execSync('git rev-parse --git-dir', { cwd, stdio: ['ignore', 'pipe', 'ignore'] });
    return true;
  } catch {
    return false;
  }
}

export function gitInit(cwd) {
  return run('git', ['init', '--initial-branch=main'], cwd);
}

export function gitAddAll(cwd) {
  return run('git', ['add', '-A'], cwd);
}

export function gitCommit(cwd, message) {
  return run('git', ['commit', '-m', message], cwd);
}

export function gitSetRemote(cwd, name, url) {
  try {
    execSync(`git remote remove ${name}`, { cwd, stdio: 'ignore' });
  } catch {}
  return run('git', ['remote', 'add', name, url], cwd);
}

export function gitPush(cwd, remote = 'origin', branch = 'main') {
  return run('git', ['push', '-u', remote, branch], cwd);
}

export function gitPull(cwd, remote = 'origin', branch = 'main') {
  return run('git', ['pull', '--rebase', remote, branch], cwd);
}

export function ghAvailable() {
  return spawnSync('gh', ['--version'], { stdio: 'ignore' }).status === 0;
}

export function ghAuthenticated() {
  if (!ghAvailable()) return false;
  return spawnSync('gh', ['auth', 'status'], { stdio: 'ignore' }).status === 0;
}

export function ghUsername() {
  if (!ghAuthenticated()) return null;
  try {
    return execSync('gh api user --jq .login', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString().trim() || null;
  } catch { return null; }
}

export function ghCreateRepo(name, { visibility = 'private' } = {}) {
  if (!ghAuthenticated()) throw new Error('gh CLI not authenticated');
  return run('gh', ['repo', 'create', name, `--${visibility}`, '--confirm']);
}

function run(bin, args, cwd) {
  const r = spawnSync(bin, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) throw new Error(`${bin} ${args.join(' ')} failed (exit ${r.status})`);
  return r;
}
