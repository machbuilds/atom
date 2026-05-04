import { existsSync } from 'node:fs';
import { spawnSync, execSync } from 'node:child_process';
import color from 'picocolors';
import { resolveConfig } from '../lib/config.js';
import { readState, worktreePath, readSpec } from '../lib/race.js';

export function registerJudgeCommand(program) {
  program
    .command('judge')
    .description('Spawn an AI CLI to evaluate the worktree diffs against the spec. Opt-in.')
    .option('--cli <bin>', 'override the judge CLI (default: from config.judge.cli)')
    .option('--print-prompt', 'print the assembled prompt and exit (no AI call)')
    .option('--criteria <list>', 'comma-separated criteria; overrides config')
    .action((opts) => {
      const cwd = process.cwd();
      const state = readState(cwd);
      if (!state) {
        console.error('No race active.');
        process.exit(1);
      }

      const config = resolveConfig();
      const judgeCfg = config.judge;
      if (!judgeCfg.enabled && !opts.cli && !opts.printPrompt) {
        console.error(
          `judge is disabled in config. Either set "judge.enabled": true in model-race.config.json, or pass --cli to force.`,
        );
        process.exit(1);
      }

      const spec = readSpec(cwd);
      if (!spec) {
        console.error('Spec missing. Cannot judge without a spec.');
        process.exit(1);
      }

      const criteria = opts.criteria
        ? opts.criteria.split(',').map((s) => s.trim())
        : judgeCfg.criteria;

      const diffs = state.models
        .map((m) => {
          const wt = worktreePath(cwd, config, m.name);
          if (!existsSync(wt)) return null;
          let diff = '';
          try {
            diff = execSync(`git diff ${state.baseBranch || 'main'}..HEAD`, { cwd: wt }).toString();
          } catch (err) {
            diff = `(failed to read diff: ${err.message})`;
          }
          return { name: m.name, diff };
        })
        .filter(Boolean);

      const prompt = buildPrompt(state.feature, spec, criteria, diffs);

      if (opts.printPrompt) {
        console.log(prompt);
        return;
      }

      const cli = opts.cli || judgeCfg.cli;
      console.log(`${color.dim('→')} judging via ${color.cyan(cli)}`);
      console.log('');

      const r = spawnSync(cli, [], {
        input: prompt,
        stdio: ['pipe', 'inherit', 'inherit'],
      });

      if (r.error && r.error.code === 'ENOENT') {
        console.error('');
        console.error(color.red(`Could not find "${cli}" on PATH.`));
        console.error(color.dim(`Install it, or pass --cli <other-bin>.`));
        process.exit(1);
      }
      process.exit(r.status || 0);
    });
}

function buildPrompt(feature, spec, criteria, diffs) {
  const criteriaList = criteria.map((c, i) => `${i + 1}. ${c}`).join('\n');
  const diffSections = diffs
    .map(
      (d) => `### ${d.name}

\`\`\`diff
${truncate(d.diff, 12000)}
\`\`\``,
    )
    .join('\n\n');

  return `You are evaluating implementations of the same feature spec produced by different AI models.

# Feature
${feature}

# Spec
${spec}

# Evaluation criteria
${criteriaList}

# Implementations to evaluate

${diffSections}

# Your task

For each implementation, give a score from 0 to 10 against the criteria above. Cite specific lines or patterns when explaining the score. End with a clear ranking and a one-line recommendation.

Format:

## ${diffs.map((d) => d.name).join(' / ')}

For each model:
- Score: X/10
- Strengths: <bullet points, cite specifics>
- Weaknesses: <bullet points, cite specifics>

## Ranking

1. <model> — <one-line rationale>
2. <model> — <one-line rationale>
...

## Recommend

<one model name> — <why>

Be concrete. Cite specific lines or patterns. The user has full diffs above; do not invent details that aren't there.`;
}

function truncate(s, n) {
  if (s.length <= n) return s;
  return s.slice(0, n) + `\n... [truncated ${s.length - n} bytes]`;
}
