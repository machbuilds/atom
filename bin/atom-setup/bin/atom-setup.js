#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  intro, outro, confirm, isCancel, cancel, note, log, spinner,
} from '@clack/prompts';
import color from 'picocolors';

import { runPreflight, preflightOk } from '../src/lib/preflight.js';
import { smartDefaults } from '../src/lib/defaults.js';
import { readState, writeState, clearState, newState, STATE_FILENAME } from '../src/lib/state.js';
import { applyState } from '../src/lib/writer.js';

import * as project from '../src/sections/01-project-basics.js';
import * as stack from '../src/sections/02-stack-deploy.js';
import * as nucleus from '../src/sections/03-nucleus.js';
import * as memory from '../src/sections/04-memory-stack.js';
import * as workflow from '../src/sections/05-workflow-tooling.js';
import * as docker from '../src/sections/06-docker.js';
import * as license from '../src/sections/07-license.js';
import * as cicd from '../src/sections/08-cicd.js';
import * as constitution from '../src/sections/09-constitution.js';
import * as git from '../src/sections/10-git.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

const SECTIONS = [
  { name: 'project', mod: project },
  { name: 'stack', mod: stack },
  { name: 'nucleus', mod: nucleus },
  { name: 'memory', mod: memory },
  { name: 'workflow', mod: workflow },
  { name: 'docker', mod: docker },
  { name: 'license', mod: license },
  { name: 'cicd', mod: cicd },
  { name: 'constitution', mod: constitution },
  { name: 'git', mod: git },
];

const program = new Command();
program
  .name('atom-setup')
  .description('Transform a cloned atom checkout into a personalized project.')
  .version(pkg.version)
  .option('--bare', 'no questions, just files (under 5 seconds)')
  .option('--minimal', '5 essential questions (~30 seconds)')
  .option('--full', 'every section, no defaults autopilot (~5 minutes)')
  .option('--resume', `pick up from ${STATE_FILENAME}`)
  .option('--dry-run', 'show what would change without writing')
  .option('--target <dir>', 'project directory to operate on', process.cwd())
  .option('--yes', 'skip the final confirmation prompt');

program.parseAsync(process.argv).then(() => main(program.opts())).catch((err) => {
  console.error(color.red(err.stack || err.message || err));
  process.exit(1);
});

async function main(opts) {
  const cwd = opts.target;
  const mode = pickMode(opts);

  console.clear();
  printLogo();

  const preflight = runPreflight();
  if (!preflightOk(preflight)) {
    log.error('Pre-flight failed. Required tools missing.');
    renderPreflight(preflight);
    process.exit(1);
  }

  intro(
    `${color.bgCyan(color.black(' atom-setup '))}  ${color.dim(`mode: ${mode} · target: ${cwd}`)}`,
  );

  renderPreflight(preflight);

  const defaults = smartDefaults(cwd);

  // Resume support
  let state;
  const existing = readState(cwd);
  if (opts.resume && existing) {
    log.info(`Resuming from ${color.cyan(STATE_FILENAME)}. Completed sections: ${existing.completedSections.join(', ') || color.dim('(none)')}`);
    state = existing;
  } else {
    if (existing && !opts.resume) {
      log.warn(`${STATE_FILENAME} exists. Use --resume to continue, or it will be overwritten.`);
    }
    state = newState();
  }

  state.answers.author = state.answers.author || defaults.author;
  state.answers.email = state.answers.email || defaults.email;
  state.answers.year = state.answers.year || defaults.year;

  if (mode === 'bare') {
    await runBareMode(state, cwd, defaults, preflight);
  } else {
    await runWizard(state, cwd, mode, defaults, preflight);
  }

  // Final confirmation
  if (!opts.yes) {
    const summary = renderSummary(state);
    note(summary, 'Summary');

    const proceed = await confirm({
      message: opts.dryRun
        ? 'Show what would change? (no files modified)'
        : `Apply this configuration to ${color.cyan(cwd)}?`,
      initialValue: true,
    });
    if (isCancel(proceed) || !proceed) {
      writeState(state, cwd);
      cancel(`Cancelled. State saved to ${STATE_FILENAME}; resume with \`atom-setup --resume\`.`);
      return;
    }
  }

  // Apply
  const s = spinner();
  s.start(opts.dryRun ? 'Computing changes' : 'Applying configuration');
  const logLines = [];
  try {
    await applyState(state, cwd, {
      log: (msg) => logLines.push(msg),
      dryRun: opts.dryRun,
    });
    s.stop(opts.dryRun ? `${color.green('✓')} dry-run complete` : `${color.green('✓')} configuration applied`);
  } catch (err) {
    s.stop(color.red('✗ apply failed'));
    log.error(err.message);
    writeState(state, cwd);
    process.exit(1);
  }

  if (logLines.length > 0) {
    note(logLines.slice(0, 25).join('\n') + (logLines.length > 25 ? `\n${color.dim(`... and ${logLines.length - 25} more`)}` : ''), 'Changes');
  }

  if (!opts.dryRun) {
    clearState(cwd);
    printCheatsheet(state, preflight);
  }

  outro(
    opts.dryRun
      ? `${color.green('✓')} Dry run complete. Re-run without ${color.cyan('--dry-run')} to apply.`
      : `${color.green('✓')} ${color.bold(state.answers.projectName)} is ready. ${color.dim('See "What\'s next" above.')}`,
  );
}

function pickMode(opts) {
  if (opts.bare) return 'bare';
  if (opts.minimal) return 'minimal';
  if (opts.full) return 'full';
  return 'default';
}

async function runBareMode(state, cwd, defaults, preflight) {
  log.info(color.dim('Bare mode: copy scaffold + sane defaults, no questions.'));
  for (const { mod } of SECTIONS) {
    await mod.run(state, { mode: 'bare', defaults, preflight, totalSections: SECTIONS.length });
  }
}

async function runWizard(state, cwd, mode, defaults, preflight) {
  for (let i = 0; i < SECTIONS.length; i++) {
    const { name, mod } = SECTIONS[i];
    if (state.completedSections.includes(name)) continue;
    await mod.run(state, { mode, defaults, preflight, totalSections: SECTIONS.length });
    state.completedSections.push(name);
    writeState(state, cwd);
  }
}

function printLogo() {
  console.log('');
  console.log(`   ${color.cyan('█████╗')} ${color.cyan('████████╗')} ${color.cyan('██████╗')}  ${color.cyan('███╗   ███╗')}`);
  console.log(`  ${color.cyan('██╔══██╗')}${color.cyan('╚══██╔══╝')}${color.cyan('██╔═══██╗')} ${color.cyan('████╗ ████║')}`);
  console.log(`  ${color.cyan('███████║')}   ${color.cyan('██║')}   ${color.cyan('██║')}   ${color.cyan('██║')} ${color.cyan('██╔████╔██║')}`);
  console.log(`  ${color.cyan('██╔══██║')}   ${color.cyan('██║')}   ${color.cyan('██║')}   ${color.cyan('██║')} ${color.cyan('██║╚██╔╝██║')}`);
  console.log(`  ${color.cyan('██║  ██║')}   ${color.cyan('██║')}   ${color.cyan('╚██████╔╝')} ${color.cyan('██║ ╚═╝ ██║')}`);
  console.log(`  ${color.cyan('╚═╝  ╚═╝')}   ${color.cyan('╚═╝')}    ${color.cyan('╚═════╝')}  ${color.cyan('╚═╝     ╚═╝')}`);
  console.log('');
  console.log(`   ${color.dim('the seed every project starts from')}`);
  console.log('');
}

function renderPreflight(p) {
  const lines = Object.entries(p).map(([id, info]) => {
    const dot = info.available ? color.green('●') : (info.required ? color.red('○') : color.gray('○'));
    const v = info.version ? color.dim(`v${info.version}`) : color.dim('not installed');
    const tag = info.required ? color.dim('(required)') : color.dim('(optional)');
    return `  ${dot} ${id.padEnd(7)} ${v} ${tag}`;
  });
  log.info(`Pre-flight\n${lines.join('\n')}`);
}

function renderSummary(state) {
  const a = state.answers;
  const pad = (s) => color.dim(String(s).padEnd(16));
  return [
    `${pad('Project:')}${color.cyan(a.projectName || '(unset)')}`,
    a.description ? `${pad('Description:')}${a.description}` : null,
    `${pad('Stack:')}${color.yellow(a.stack || '(unset)')}`,
    `${pad('Deploy:')}${color.yellow(a.deployTarget || '(unset)')}`,
    `${pad('nucleus:')}${a.nucleusEnabled ? color.green(a.nucleusCaptureMode) : color.gray('disabled')}`,
    `${pad('Memory MCPs:')}${[a.mem0 && 'mem0', a.multica && 'multica', a.chromeDevtools && 'chrome-devtools'].filter(Boolean).join(', ') || color.gray('none')}`,
    `${pad('Workflow:')}${[a.specKit && 'spec-kit', a.gsd && 'gsd', a.modelRace && 'model-race'].filter(Boolean).join(', ') || color.gray('none')}`,
    `${pad('Docker:')}${color.yellow(a.dockerTier || 'none')}`,
    `${pad('License:')}${color.yellow(a.license || 'None')}`,
    `${pad('CI auto-deploy:')}${a.autoDeploy ? color.green('yes') : color.gray('no')}`,
    `${pad('Constitution:')}${a.constitution ? color.green('generate after setup') : color.gray('skip')}`,
    `${pad('Git remote:')}${a.gitRemote ? color.cyan(a.gitRemote) : color.gray('none')}`,
  ].filter(Boolean).join('\n');
}

function printCheatsheet(state, preflight) {
  const a = state.answers;
  const tasks = [];

  if (a.nucleusEnabled) {
    tasks.push(`${color.cyan('•')} Initialize nucleus on this machine: ${color.cyan('nucleus init')}`);
  }
  if (a.mem0) {
    tasks.push(`${color.cyan('•')} Set up mem0 MCP: see ${color.cyan('docs/INSTALL.md')} (or wherever it lives in scaffold)`);
  }
  if (a.dockerTier === 'compose' || a.dockerTier === 'devcontainer') {
    tasks.push(`${color.cyan('•')} Copy ${color.cyan('.env.example')} to ${color.cyan('.env.local')} and fill in values, then ${color.cyan('docker compose up')}`);
  }
  if (a.constitution) {
    tasks.push(`${color.cyan('•')} Generate the constitution: open ${color.cyan('AGENTS.md')} and run \`speckit-constitution\` (or follow your AI tool's flow)`);
  }
  if (a.modelRace) {
    tasks.push(`${color.cyan('•')} Configure model-race: edit ${color.cyan('model-race.config.json')}`);
  }
  if (a.gitRemote && !a.gitPush) {
    tasks.push(`${color.cyan('•')} Push to your remote when ready: ${color.cyan(`git remote add origin ${a.gitRemote} && git push -u origin main`)}`);
  }

  if (tasks.length > 0) {
    note(tasks.join('\n'), `What's next`);
  }
}
