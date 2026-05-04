import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { NUCLEUS_CONFIG_PATH, NUCLEUS_HOME } from './paths.js';

export const DEFAULT_CONFIG = {
  version: 1,
  enabled: true,
  captureMode: 'claude-managed',
  autoTimerMinutes: 15,
  sync: {
    enabled: false,
    remote: null,
  },
  perProject: {},
};

export function readConfig() {
  if (!existsSync(NUCLEUS_CONFIG_PATH)) {
    return null;
  }
  const raw = readFileSync(NUCLEUS_CONFIG_PATH, 'utf8');
  return JSON.parse(raw);
}

export function writeConfig(config) {
  if (!existsSync(NUCLEUS_HOME)) {
    mkdirSync(NUCLEUS_HOME, { recursive: true });
  }
  if (!existsSync(dirname(NUCLEUS_CONFIG_PATH))) {
    mkdirSync(dirname(NUCLEUS_CONFIG_PATH), { recursive: true });
  }
  writeFileSync(NUCLEUS_CONFIG_PATH, JSON.stringify(config, null, 2) + '\n');
}

export function isEnabled(slug) {
  const config = readConfig();
  if (!config) return false;
  if (config.perProject?.[slug]?.enabled === false) return false;
  if (config.perProject?.[slug]?.enabled === true) return true;
  return config.enabled !== false;
}
