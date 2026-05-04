import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import color from 'picocolors';
import { intro, outro, text, isCancel, cancel, log, note } from '@clack/prompts';
import { resolveConfig } from '../lib/config.js';
import {
  addWorktree,
  currentBranch,
  repoRoot,
} from '../lib/git.js';
import {
  ensureRaceDir,
  worktreePath,
  branchName,
  buildState,
  writeState,
  writeSpec,
  specPath,
  readState,
  RACE_DIR,
} from '../lib/race.js';

export function registerStartCommand(program) {
  program
    .command('start <feature>')
    .description('Create N worktrees (one per configured model), write the spec to each, register active race state.')
    .option('--models <list>', 'comma-separated model names; overrides config defaults')
    .option('--spec <file>', 'path to a spec file to use; otherwise prompts for inline spec')
    .option('--base <branch>', 'base ref for worktrees', 'main')
    .option('--auto', '[v0.2 — not implemented] also spawn parallel sessions in each worktree')
    .action(async (feature, opts) => {
      if (opts.auto) {
        log.warn('--auto is reserved for v0.2. Use `model-race launch <model>` per worktree for now.');
      }

      const config = resolveConfig();
      const cwd = process.cwd();
      const root = repoRoot(cwd);

      const existing = readState(cwd);
      if (existing && existing.status === 'active') {
        log.error(
          `A race is already active for "${existing.feature}". Run \`model-race abort\` or \`model-race merge <winner>\` first.`,
        );
        process.exit(1);
      }

      const models = pickModels(config, opts.models);
      if (models.length < 2) {
        log.error('Need at least 2 models to race. Configure more in model-race.config.json.');
        process.exit(1);
      }

      intro(`${color.bgCyan(color.black(' model-race start '))}  ${color.dim(feature)}`);

      let spec;
      if (opts.spec) {
        if (!existsSync(opts.spec)) {
          log.error(`Spec file not found: ${opts.spec}`);
          process.exit(1);
        }
        const { readFileSync } = await import('node:fs');
        spec = readFileSync(opts.spec, 'utf8');
      } else {
        const entered = await text({
          message: 'Spec for this race (paste or type; Enter to confirm)',
          placeholder: 'Implement X. The function should... Tests pass when...',
          validate: (v) => (v && v.trim().length > 20 ? undefined : 'Spec is too short. Aim for at least a paragraph.'),
        });
        if (isCancel(entered)) return cancel('Cancelled.');
        spec = entered;
      }

      ensureRaceDir(cwd);
      writeSpec(cwd, spec);

      log.info(`Spec saved to ${color.cyan(`${RACE_DIR}/spec.md`)}`);

      const created = [];
      for (const m of models) {
        const wtPath = worktreePath(cwd, config, m.name);
        const br = branchName(config, feature, m.name);

        if (existsSync(wtPath)) {
          log.warn(`Worktree already exists for ${m.name}: ${wtPath}. Skipping.`);
          continue;
        }

        try {
          addWorktree(root, wtPath, br, opts.base);
        } catch (err) {
          log.error(`Failed to create worktree for ${m.name}: ${err.message}`);
          continue;
        }

        created.push({ ...m, path: wtPath, branch: br });
      }

      if (created.length === 0) {
        log.error('No worktrees created. Aborting.');
        process.exit(1);
      }

      writeState(cwd, buildState(feature, created, opts.base));

      const lines = created.map(
        (m) => `${color.cyan(m.name.padEnd(10))} ${color.dim(m.path)} ${color.yellow(m.branch)}`,
      );
      note(lines.join('\n'), `${created.length} worktrees ready`);

      const launchHints = created.map((m) => `  ${color.cyan(`model-race launch ${m.name}`)}`).join('\n');
      outro(
        `${color.green('✓')} Race started. Launch each session:\n${launchHints}\n\n  ${color.dim('Then:')} ${color.cyan('model-race score')} · ${color.cyan('model-race judge')} · ${color.cyan('model-race merge <winner>')}`,
      );
    });
}

function pickModels(config, override) {
  if (!override) return config.models;
  const wanted = override.split(',').map((s) => s.trim()).filter(Boolean);
  const out = [];
  for (const name of wanted) {
    const found = config.models.find((m) => m.name === name);
    if (!found) {
      throw new Error(`Model "${name}" not in config. Available: ${config.models.map((m) => m.name).join(', ')}`);
    }
    out.push(found);
  }
  return out;
}
