import { readFileSync, existsSync, mkdirSync, appendFileSync, closeSync, openSync } from 'node:fs';
import { dirname } from 'node:path';
import lockfile from 'proper-lockfile';

export const SCHEMA_VERSION = 1;

export async function appendEntry(filePath, entry) {
  ensureFileExists(filePath);
  const release = await lockfile.lock(filePath, {
    retries: { retries: 5, factor: 1.5, minTimeout: 50, maxTimeout: 1000 },
    stale: 10_000,
  });
  try {
    const line = JSON.stringify(entry) + '\n';
    appendFileSync(filePath, line, 'utf8');
  } finally {
    await release();
  }
}

export function readEntries(filePath) {
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, 'utf8');
  return raw
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line, i) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        throw new Error(
          `Failed to parse JSONL at line ${i + 1} of ${filePath}: ${err.message}`,
        );
      }
    });
}

export function readAllEntries(allFiles) {
  return allFiles.flatMap((f) => readEntries(f));
}

function ensureFileExists(filePath) {
  if (!existsSync(filePath)) {
    mkdirSync(dirname(filePath), { recursive: true });
    closeSync(openSync(filePath, 'a'));
  }
}
