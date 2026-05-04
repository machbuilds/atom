import { execSync } from 'node:child_process';
import { basename } from 'node:path';

export function smartDefaults(cwd = process.cwd()) {
  return {
    projectName: defaultProjectName(cwd),
    author: defaultAuthor(),
    email: defaultEmail(),
    githubUser: defaultGithubUser(),
    year: new Date().getFullYear(),
  };
}

function defaultProjectName(cwd) {
  const base = basename(cwd);
  if (base === 'atom') return 'my-project';
  return slugify(base);
}

function defaultAuthor() {
  try {
    return execSync('git config user.name', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function defaultEmail() {
  try {
    return execSync('git config user.email', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
}

function defaultGithubUser() {
  try {
    const r = execSync('gh api user --jq .login 2>/dev/null', { stdio: ['ignore', 'pipe', 'ignore'] });
    const v = r.toString().trim();
    return v || null;
  } catch {
    return null;
  }
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}
