import { homedir } from 'node:os';
import { join } from 'node:path';

const ATOM_HOME = process.env.ATOM_HOME || join(homedir(), '.atom');

export const LEARNINGS_HOME =
  process.env.ATOM_LEARNINGS_HOME || join(ATOM_HOME, 'learnings');

export const LEARNINGS_CONFIG_PATH = join(LEARNINGS_HOME, 'config.json');

export const TYPES = [
  'architecture',
  'pitfall',
  'pattern',
  'workflow',
  'decision',
  'bug-fix',
  'performance',
  'security',
];
