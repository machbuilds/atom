import { homedir } from 'node:os';
import { join } from 'node:path';

export const NUCLEUS_HOME = process.env.NUCLEUS_HOME || join(homedir(), '.nucleus');

export const NUCLEUS_CONFIG_PATH = join(NUCLEUS_HOME, 'config.json');
export const NUCLEUS_PROJECTS_DIR = join(NUCLEUS_HOME, 'projects');

export function projectDir(slug) {
  return join(NUCLEUS_PROJECTS_DIR, slug);
}

export function learningsFile(slug) {
  return join(projectDir(slug), 'learnings.jsonl');
}
