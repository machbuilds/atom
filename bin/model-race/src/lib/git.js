import { execSync, spawnSync } from 'node:child_process';

export function repoRoot(cwd = process.cwd()) {
  return execSync('git rev-parse --show-toplevel', { cwd })
    .toString()
    .trim();
}

export function currentBranch(cwd) {
  return execSync('git rev-parse --abbrev-ref HEAD', { cwd })
    .toString()
    .trim();
}

export function listWorktrees(cwd) {
  const out = execSync('git worktree list --porcelain', { cwd }).toString();
  const blocks = out.split('\n\n').filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split('\n');
    const wt = {};
    for (const line of lines) {
      const [key, ...rest] = line.split(' ');
      const value = rest.join(' ');
      if (key === 'worktree') wt.path = value;
      else if (key === 'HEAD') wt.head = value;
      else if (key === 'branch') wt.branch = value.replace(/^refs\/heads\//, '');
      else if (key === 'bare') wt.bare = true;
      else if (key === 'detached') wt.detached = true;
    }
    return wt;
  });
}

export function addWorktree(cwd, path, branch, baseRef = 'HEAD') {
  return run('git', ['worktree', 'add', '-b', branch, path, baseRef], cwd);
}

export function removeWorktree(cwd, path, force = false) {
  const args = ['worktree', 'remove', path];
  if (force) args.push('--force');
  return run('git', args, cwd);
}

export function deleteBranch(cwd, branch, force = false) {
  return run('git', ['branch', force ? '-D' : '-d', branch], cwd);
}

export function cherryPick(cwd, branch) {
  return run('git', ['cherry-pick', branch], cwd);
}

export function diffStat(cwd, base = 'main') {
  try {
    const out = execSync(`git diff --shortstat ${base}..HEAD`, { cwd }).toString().trim();
    return out;
  } catch {
    return '';
  }
}

export function diffNumStat(cwd, base = 'main') {
  try {
    const out = execSync(`git diff --numstat ${base}..HEAD`, { cwd }).toString().trim();
    let added = 0;
    let removed = 0;
    for (const line of out.split('\n')) {
      if (!line.trim()) continue;
      const [a, r] = line.split('\t');
      added += parseInt(a) || 0;
      removed += parseInt(r) || 0;
    }
    return { added, removed, total: added + removed };
  } catch {
    return { added: 0, removed: 0, total: 0 };
  }
}

function run(bin, args, cwd) {
  const r = spawnSync(bin, args, { cwd, stdio: 'inherit' });
  if (r.status !== 0) {
    throw new Error(`${bin} ${args.join(' ')} failed (exit ${r.status})`);
  }
  return r;
}
