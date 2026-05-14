#!/usr/bin/env node
// atom — top-level help dispatcher.
//
//   atom                      print the unified help table
//   atom --help / -h          same
//   atom --version / -V       version of this dispatcher
//   atom upgrade              fetch a new release of atom
//   atom upgrade --check      check for an update without installing
//   atom migrate-install      relocate a 0.1.x in-place install to ~/.atom/atom/

import '../src/lib/update-check-client.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import color from 'picocolors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const args = process.argv.slice(2);
const subcommand = args[0];

if (args.includes('--version') || args.includes('-V')) {
  console.log(pkg.version);
  process.exit(0);
}

if (subcommand === 'upgrade') {
  const { runUpgrade } = await import('../src/upgrade.js');
  await runUpgrade(args.slice(1));
  process.exit(0);
}

if (subcommand === 'migrate-install') {
  const { runMigrateInstall } = await import('../src/migrate-install.js');
  await runMigrateInstall(args.slice(1));
  process.exit(0);
}

// Anything else (no args, --help, -h, unknown subcommand) prints the
// help table.

const HELP = `
${color.cyan('atom')} — project-starter template with cross-project memory.
${color.dim('Every project starts here. Every lesson travels with you.')}

${color.bold('Setup')}
  ${color.cyan('atom-setup')} ${color.dim('[--bare | --minimal | --full]')}    Bootstrap a new project from atom.
                                            Default: ~2 min interactive wizard.

${color.bold('Capture')} ${color.dim('— your memory of every session')}
  ${color.cyan('nucleus add')} ${color.dim('"<insight>" --type <T>')}            Capture a session learning.
  ${color.cyan('nucleus search')} ${color.dim('<keyword>')}                       Find past learnings (any project).
  ${color.cyan('nucleus search')} ${color.dim('--type pitfall --confidence high')}   Structured filtered search.
  ${color.cyan('nucleus promote')} ${color.dim('<id>')}                            Graduate to your local learnings.
  ${color.cyan('nucleus sync')}                                  Push/pull ~/.atom/nucleus to GitHub.
  ${color.cyan('nucleus init')}                                  One-time setup (~/.atom/nucleus).

${color.bold('Carry forward')} ${color.dim('— your local playbook')}
  ${color.cyan('learnings list')}                                Show your curated learnings.
  ${color.cyan('learnings show')} ${color.dim('<key>')}                            View one entry.
  ${color.cyan('learnings remove')} ${color.dim('<key>')}                          Delete one.
  ${color.cyan('learnings sync')}                                Push/pull ~/.atom/learnings to GitHub.
  ${color.cyan('learnings init')}                                One-time setup (~/.atom/learnings).

${color.bold('Compare')} ${color.dim('— for high-stakes features')}
  ${color.cyan('model-race start')} ${color.dim('<feature>')}                      Race a feature across AI models.
  ${color.cyan('model-race score')}                              Run scorecard.
  ${color.cyan('model-race judge')}                              Opt-in LLM evaluation.
  ${color.cyan('model-race merge')} ${color.dim('<winner>')}                       Cherry-pick winner; clean losers.
  ${color.cyan('model-race abort')}                              Tear down the race.

${color.bold('Maintain')}
  ${color.cyan('atom upgrade')}                                  Fetch a new release of atom and re-install CLIs.
  ${color.cyan('atom upgrade --check')}                          Check for an update without installing.
  ${color.cyan('atom upgrade --snooze')} ${color.dim('24h|48h|7d')}              Suppress the upgrade notice for a tier.
  ${color.cyan('atom migrate-install')}                          One-shot: move a 0.1.x in-place install to ~/.atom/atom/.

${color.bold('Help')}
  ${color.cyan('atom')} ${color.dim('or')} ${color.cyan('atom --help')}                          This screen.
  ${color.cyan('<tool> --help')}                                 Detailed help for any specific tool.
  ${color.cyan('atom --version')}                                Version of this dispatcher.

${color.dim('All five tools are installed globally — run them from any directory.')}
${color.dim('Both ~/.atom/nucleus and ~/.atom/learnings are 100% yours; nothing leaves your')}
${color.dim('machine without your explicit action.')}

${color.dim('Docs: https://github.com/machbuilds/atom')}
`;

process.stdout.write(HELP);
