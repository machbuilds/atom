import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

export const STATE_FILENAME = '.atom-setup-state.json';
export const STATE_VERSION = 1;

const SECRET_KEYS = new Set([
  'apiKey', 'api_key', 'token', 'secret', 'password',
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'MEM0_API_KEY',
]);

export function statePath(cwd = process.cwd()) {
  return join(cwd, STATE_FILENAME);
}

export function readState(cwd = process.cwd()) {
  const p = statePath(cwd);
  if (!existsSync(p)) return null;
  const raw = readFileSync(p, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to parse ${STATE_FILENAME}: ${err.message}`);
  }
}

export function writeState(state, cwd = process.cwd()) {
  const safe = stripSecrets(state);
  writeFileSync(statePath(cwd), JSON.stringify(safe, null, 2) + '\n');
}

export function clearState(cwd = process.cwd()) {
  const p = statePath(cwd);
  if (existsSync(p)) unlinkSync(p);
}

export function newState() {
  return {
    version: STATE_VERSION,
    startedAt: new Date().toISOString(),
    completedSections: [],
    answers: {},
  };
}

function stripSecrets(state) {
  return JSON.parse(JSON.stringify(state, (key, value) => {
    if (SECRET_KEYS.has(key)) return '<redacted>';
    return value;
  }));
}
