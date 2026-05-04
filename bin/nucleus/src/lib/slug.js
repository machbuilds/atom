import { execSync } from 'node:child_process';
import { basename } from 'node:path';

export function deriveSlug(cwd = process.cwd()) {
  const fromGit = slugFromGitRemote(cwd);
  if (fromGit) return fromGit;
  return slugFromCwd(cwd);
}

function slugFromGitRemote(cwd) {
  try {
    const url = execSync('git config --get remote.origin.url', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (!url) return null;
    return parseRemoteToSlug(url);
  } catch {
    return null;
  }
}

export function parseRemoteToSlug(url) {
  const cleaned = url.replace(/\.git$/, '').trim();

  const ssh = cleaned.match(/[:/]([^/:]+)\/([^/]+?)$/);
  if (ssh) {
    return normalizeSlug(`${ssh[1]}-${ssh[2]}`);
  }

  try {
    const u = new URL(cleaned);
    const parts = u.pathname.replace(/^\//, '').split('/');
    if (parts.length >= 2) {
      return normalizeSlug(`${parts[0]}-${parts[parts.length - 1]}`);
    }
  } catch {
    // fall through
  }

  return null;
}

function slugFromCwd(cwd) {
  return normalizeSlug(basename(cwd));
}

function normalizeSlug(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}
