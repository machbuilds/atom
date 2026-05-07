import { readFileSync } from 'node:fs';
import color from 'picocolors';
import { findByKey } from '../lib/io.js';

export function registerShowCommand(program) {
  program
    .command('show <key>')
    .description('Print one learning by key.')
    .action((key) => {
      const entry = findByKey(key);
      if (!entry) {
        console.error(`No learning found with key "${key}". Run \`learnings list\` to see what's available.`);
        process.exit(1);
      }
      console.log(color.dim(`# ${entry.path}`));
      console.log('');
      console.log(readFileSync(entry.path, 'utf8'));
    });
}
