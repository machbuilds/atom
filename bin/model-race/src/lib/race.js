import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { repoRoot, currentBranch } from './git.js';

export const RACE_DIR = '.race';
export const SPEC_FILENAME = 'spec.md';
export const STATE_FILENAME = 'state.json';

export function raceRoot(cwd = process.cwd()) {
  return join(repoRoot(cwd), RACE_DIR);
}

export function ensureRaceDir(cwd) {
  const dir = raceRoot(cwd);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function statePath(cwd) {
  return join(raceRoot(cwd), STATE_FILENAME);
}

export function specPath(cwd) {
  return join(raceRoot(cwd), SPEC_FILENAME);
}

export function readState(cwd) {
  const p = statePath(cwd);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function writeState(cwd, state) {
  ensureRaceDir(cwd);
  writeFileSync(statePath(cwd), JSON.stringify(state, null, 2) + '\n');
}

export function readSpec(cwd) {
  const p = specPath(cwd);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

export function writeSpec(cwd, content) {
  ensureRaceDir(cwd);
  writeFileSync(specPath(cwd), content);
}

export function worktreeBaseDir(cwd, config) {
  return resolve(repoRoot(cwd), config.worktree.base);
}

export function worktreePath(cwd, config, modelName) {
  return join(worktreeBaseDir(cwd, config), modelName);
}

export function branchName(config, feature, modelName) {
  return `${config.worktree.branchPrefix}/${feature}/${modelName}`;
}

export function activeRace(cwd) {
  const state = readState(cwd);
  if (!state) return null;
  if (state.status !== 'active') return null;
  return state;
}

export function buildState(feature, models, baseBranch) {
  return {
    version: 1,
    status: 'active',
    feature,
    baseBranch,
    startedAt: new Date().toISOString(),
    models: models.map((m) => ({
      name: m.name,
      cli: m.cli,
      args: m.args || [],
    })),
  };
}
