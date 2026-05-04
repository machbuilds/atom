import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

export const CONFIG_FILENAME = 'model-race.config.json';

export const DEFAULT_CONFIG = {
  version: 1,
  models: [
    { name: 'claude', cli: 'claude', args: [] },
    { name: 'gpt5', cli: 'codex', args: [] },
    { name: 'gemini', cli: 'gemini', args: [] },
  ],
  metrics: {
    tests: { command: 'npm test', weight: 3, mode: 'pass-fail' },
    lint: { command: 'npm run lint', weight: 1, mode: 'pass-fail' },
    typecheck: { command: 'npm run typecheck', weight: 2, mode: 'pass-fail' },
    size: {
      command: 'git diff --shortstat main..HEAD',
      weight: 1,
      mode: 'numeric-min',
    },
  },
  judge: {
    enabled: false,
    cli: 'claude',
    criteria: [
      'correctness against spec',
      'idiomatic code for this codebase',
      'test coverage',
      'minimal diff',
    ],
  },
  worktree: {
    base: '../.race',
    branchPrefix: 'feature/race',
  },
};

export function readConfig(cwd = process.cwd()) {
  const path = findConfigPath(cwd);
  if (!path) return null;
  const raw = readFileSync(path, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ${path}: ${err.message}`);
  }
}

export function findConfigPath(startDir) {
  let dir = resolve(startDir);
  while (true) {
    const candidate = join(dir, CONFIG_FILENAME);
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function resolveConfig(cwd = process.cwd()) {
  const user = readConfig(cwd);
  if (!user) {
    throw new Error(
      `${CONFIG_FILENAME} not found. Run \`model-race init\` or copy from atom's scaffold/extras/model-race/${CONFIG_FILENAME}.example.`,
    );
  }
  return mergeWithDefaults(user);
}

function mergeWithDefaults(user) {
  return {
    ...DEFAULT_CONFIG,
    ...user,
    metrics: { ...DEFAULT_CONFIG.metrics, ...(user.metrics || {}) },
    judge: { ...DEFAULT_CONFIG.judge, ...(user.judge || {}) },
    worktree: { ...DEFAULT_CONFIG.worktree, ...(user.worktree || {}) },
  };
}
