// User's local learnings store. Mirrors the same convention used by
// the learnings CLI (~/.atom/learnings/). nucleus promote writes here.
import { homedir } from 'node:os';
import { join } from 'node:path';

const ATOM_HOME = process.env.ATOM_HOME || join(homedir(), '.atom');

export const LEARNINGS_HOME =
  process.env.ATOM_LEARNINGS_HOME || join(ATOM_HOME, 'learnings');

export function learningsTypeDir(type) {
  return join(LEARNINGS_HOME, type);
}

export function learningsFilePath(type, slug) {
  return join(learningsTypeDir(type), `${slug}.md`);
}
