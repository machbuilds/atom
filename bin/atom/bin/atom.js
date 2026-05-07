#!/usr/bin/env node
// atom — top-level help dispatcher.
//
// `atom` or `atom --help` prints the unified help table for atom's
// tooling. Each tool has its own --help for detailed usage.
//
// `atom --version` prints this dispatcher's version. To see the version
// of any specific tool, run `<tool> --version`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import color from 'picocolors';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const args = process.argv.slice(2);

if (args.includes('--version') || args.includes('-V')) {
  console.log(pkg.version);
  process.exit(0);
}

// Anything else (no args, --help, -h, unknown subcommand) prints the
// help table. atom doesn't subcommand-route — each tool is invoked by
// its own name. If we ever want to route, we hook it in here.

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
