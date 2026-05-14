#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve, basename } from 'node:path';
import { homedir } from 'node:os';
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

// Manual verb routing: `atom-setup new <name>` runs the new-project flow;
// anything else falls through to the legacy in-place wizard. Done this way
// (rather than via commander subcommands) to keep the existing flag surface
// intact and avoid commander's subcommand/default-action quirks.
const rawArgs = process.argv.slice(2);
if (rawArgs[0] === 'new') {
  const name = rawArgs[1];
  if (!name || name.startsWith('-')) {
    console.error('Usage: atom-setup new <project-name> [--bare|--minimal|--full] [--dry-run] [--yes]');
    process.exit(1);
  }
  runNewCommand(name, rawArgs.slice(2)).catch((err) => {
    console.error(color.red(err.stack || err.message || err));
    process.exit(1);
  });
} else {
  const program = buildLegacyProgram();
  program.parseAsync(process.argv).then(() => main(program.opts(), { mode: 'in-place' })).catch((err) => {
    console.error(color.red(err.stack || err.message || err));
    process.exit(1);
  });
}

function buildLegacyProgram() {
  const program = new Command();
  program
    .name('atom-setup')
    .description('Transform a cloned atom checkout into a personalized project. (Legacy in-place mode. For new projects, prefer `atom-setup new <name>`.)')
    .version(pkg.version)
    .option('--bare', 'no questions, just files (under 5 seconds)')
    .option('--minimal', '5 essential questions (~30 seconds)')
    .option('--full', 'every section, no defaults autopilot (~5 minutes)')
    .option('--resume', `pick up from ${STATE_FILENAME}`)
    .option('--dry-run', 'show what would change without writing')
    .option('--target <dir>', 'project directory to operate on', process.cwd())
    .option('--yes', 'skip the final confirmation prompt');
  return program;
}

function resolveAtomSourceDir() {
  return process.env.ATOM_SOURCE_DIR || join(homedir(), '.atom', 'atom');
}

function isAtomSource(dir) {
  return existsSync(join(dir, 'scaffold')) && existsSync(join(dir, 'extras'));
}

async function runNewCommand(name, args) {
  const program = new Command();
  program
    .name('atom-setup new')
    .description('Create a fresh project scaffolded from ~/.atom/atom/ (or $ATOM_SOURCE_DIR).')
    .option('--bare', 'no questions, just files (under 5 seconds)')
    .option('--minimal', '5 essential questions (~30 seconds)')
    .option('--full', 'every section, no defaults autopilot (~5 minutes)')
    .option('--resume', `pick up from ${STATE_FILENAME}`)
    .option('--dry-run', 'show what would change without writing')
    .option('--target <dir>', 'parent directory in which to create the project', process.cwd())
    .option('--yes', 'skip the final confirmation prompt')
    .allowExcessArguments(false)
    .exitOverride();
  await program.parseAsync(args, { from: 'user' });
  const opts = program.opts();

  // Validate name. We allow lowercase letters, digits, dashes, dots, and
  // underscores. Reject anything that would create a parent path traversal
  // or hide the project under a dot-directory at a weird place.
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(name)) {
    throw new Error(`Invalid project name '${name}'. Allowed characters: letters, digits, '.', '_', '-'.`);
  }

  const sourceDir = resolveAtomSourceDir();
  if (!isAtomSource(sourceDir)) {
    throw new Error(
      `atom source not found at ${sourceDir}.\n\n` +
      `Expected to find 'scaffold/' and 'extras/' there. Either:\n` +
      `  - Install atom: \`curl -fsSL https://raw.githubusercontent.com/machbuilds/atom/main/install.sh | bash\`\n` +
      `  - Or set ATOM_SOURCE_DIR to an existing atom checkout.`,
    );
  }

  const parent = resolve(opts.target);
  const target = resolve(parent, name);

  if (existsSync(target)) {
    const contents = readdirSync(target).filter((e) => e !== '.DS_Store');
    if (contents.length > 0) {
      throw new Error(
        `Refusing to scaffold into ${target} — directory exists and is not empty.\n` +
        `Pick a different name or remove the existing directory first.`,
      );
    }
  } else {
    mkdirSync(target, { recursive: true });
  }

  // Smart default for projectName: use the directory basename (which is
  // exactly the name the user just gave). defaults.smartDefaults() already
  // does this from basename(target).

  await main({ ...opts, target, _projectName: name }, { mode: 'new', sourceDir });
}

async function main(opts, runOpts = {}) {
  const cwd = opts.target;
  const mode = pickMode(opts);
  const setupMode = runOpts.mode || 'in-place';
  const sourceDir = runOpts.sourceDir || cwd;

  console.clear();
  printLogo();

  const preflight = runPreflight();
  if (!preflightOk(preflight)) {
    log.error('Pre-flight failed. Required tools missing.');
    renderPreflight(preflight);
    process.exit(1);
  }

  const verbLabel = setupMode === 'new' ? `new · ${basename(cwd)}` : `mode: ${mode}`;
  intro(
    `${color.bgCyan(color.black(' atom-setup '))}  ${color.dim(`${verbLabel} · target: ${cwd}`)}`,
  );

  renderPreflight(preflight);

  if (setupMode === 'in-place' && isAtomSource(cwd)) {
    log.warn(
      `${color.yellow('Deprecated:')} running atom-setup in-place (inside an atom clone) is going away.\n` +
      `  Recommended: install atom once, then run ${color.cyan('atom-setup new <name>')} from anywhere.\n` +
      `  Source dir: ${color.cyan(resolveAtomSourceDir())} (override with $ATOM_SOURCE_DIR).`,
    );
  }

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
  // In `new` mode the caller already chose a name. Use it as the seed so
  // smartDefaults' basename guess doesn't get overridden by anything stale.
  if (opts._projectName) {
    state.answers.projectName = opts._projectName;
  }

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
      mode: setupMode,
      sourceDir,
    });
    s.stop(opts.dryRun ? `${color.green('✓')} dry-run complete` : `${color.green('✓')} configuration applied`);
  } catch (err) {
    s.stop(color.red('✗ apply failed'));
    log.error(err.message);
    writeState(state, cwd);
    process.exit(1);
  }

  if (logLines.length > 0) {
    note(renderChanges(logLines), 'Changes');
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

function renderChanges(logLines) {
  // Group operations by kind for a clearer summary. atom-setup is doing a
  // lot — copying scaffold, applying presets, removing atom-maintenance
  // content — and dumping the raw operation log makes the destructive
  // bits look scarier than they are.
  const counts = { copy: 0, docker: 0, learning: 0, remove: 0 };
  const milestones = [];
  for (const line of logLines) {
    if (line.startsWith('copy:') || line.startsWith('(dry-run) copy:') || line.startsWith('(dry-run) mkdir')) {
      counts.copy++;
    } else if (line.startsWith('docker copy:') || line.startsWith('(dry-run) docker copy:')) {
      counts.docker++;
    } else if (line.startsWith('learning copy:') || line.startsWith('(dry-run) learning copy:')) {
      counts.learning++;
    } else if (line.startsWith('remove:') || line.startsWith('(dry-run) remove:')) {
      counts.remove++;
    } else {
      milestones.push(line);
    }
  }

  const lines = [];
  if (counts.copy > 0)     lines.push(`${color.green('✓')} ${color.cyan('copied')}    ${counts.copy} files (scaffold + stack preset)`);
  if (counts.docker > 0)   lines.push(`${color.green('✓')} ${color.cyan('docker')}    ${counts.docker} files`);
  if (counts.learning > 0) lines.push(`${color.green('✓')} ${color.cyan('learnings')} ${counts.learning} files`);
  if (counts.remove > 0)   lines.push(`${color.dim('-')} ${color.dim('removed')}   ${counts.remove} atom-maintenance paths ${color.dim('(planning docs, source CLIs, scaffold/, etc.)')}`);
  for (const m of milestones) {
    lines.push(`${color.green('✓')} ${m}`);
  }
  return lines.join('\n');
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
    tasks.push(`${color.cyan('•')} Initialize nucleus (your session memory): ${color.cyan('nucleus init')}`);
    tasks.push(`${color.cyan('•')} Initialize learnings (your local playbook): ${color.cyan('learnings init')}`);
    tasks.push(`  ${color.dim('Both are 100% yours. Optional GitHub sync to your private repo.')}`);
    tasks.push(`  ${color.dim('Once you have a backlog, run `nucleus review` to see what is worth promoting.')}`);
  }
  if (a.mem0) {
    tasks.push(`${color.cyan('•')} Set up mem0 MCP: see ${color.cyan('docs/INSTALL.md')} (or wherever it lives in scaffold)`);
  }
  if (a.dockerTier === 'compose' || a.dockerTier === 'devcontainer') {
    tasks.push(`${color.cyan('•')} Copy ${color.cyan('.env.example')} to ${color.cyan('.env.local')} and fill in values, then ${color.cyan('docker compose up')}`);
  }
  if (a.constitution) {
    tasks.push(`${color.cyan('•')} Refine ${color.cyan('CONSTITUTION.md')} (atom scaffolded a v0.1.0 draft) — pick at most 5 principles, then run \`speckit-constitution\` in Claude Code as a verification pass`);
  }
  if (a.modelRace) {
    tasks.push(`${color.cyan('•')} Configure model-race: edit ${color.cyan('model-race.config.json')}`);
  }
  if (a.gitRemote && !a.gitPush) {
    tasks.push(`${color.cyan('•')} Push to your remote when ready: ${color.cyan(`git remote add origin ${a.gitRemote} && git push -u origin main`)}`);
  }

  tasks.push(`${color.cyan('•')} See every atom command in one place: ${color.cyan('atom --help')}`);

  if (tasks.length > 0) {
    note(tasks.join('\n'), `What's next`);
  }
}
