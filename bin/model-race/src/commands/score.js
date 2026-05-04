import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import color from 'picocolors';
import { resolveConfig } from '../lib/config.js';
import { readState, worktreePath } from '../lib/race.js';
import { diffNumStat } from '../lib/git.js';

export function registerScoreCommand(program) {
  program
    .command('score')
    .description('Run the configured metrics across each worktree and render a scorecard.')
    .option('--metrics <list>', 'comma-separated subset of metrics to run')
    .option('--json', 'output JSON')
    .action((opts) => {
      const cwd = process.cwd();
      const state = readState(cwd);
      if (!state) {
        console.error('No race active.');
        process.exit(1);
      }

      const config = resolveConfig();

      const wantedMetrics = opts.metrics
        ? opts.metrics.split(',').map((s) => s.trim())
        : Object.keys(config.metrics);

      for (const name of wantedMetrics) {
        if (!config.metrics[name]) {
          console.error(`Unknown metric: ${name}. Available: ${Object.keys(config.metrics).join(', ')}`);
          process.exit(1);
        }
      }

      const results = {};
      for (const m of state.models) {
        const wt = worktreePath(cwd, config, m.name);
        if (!existsSync(wt)) {
          results[m.name] = { error: 'worktree missing' };
          continue;
        }

        const metrics = {};
        for (const metricName of wantedMetrics) {
          const cfg = config.metrics[metricName];
          metrics[metricName] = runMetric(wt, cfg);
        }

        const stats = diffNumStat(wt, state.baseBranch || 'main');
        results[m.name] = { metrics, diff: stats };
      }

      const scored = scoreResults(results, config.metrics, wantedMetrics);

      if (opts.json) {
        console.log(JSON.stringify({ feature: state.feature, results: scored }, null, 2));
        return;
      }

      renderTable(scored, state.models, wantedMetrics, config.metrics);
    });
}

function runMetric(cwd, cfg) {
  const start = Date.now();
  try {
    const r = spawnSync('sh', ['-c', cfg.command], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5 * 60 * 1000,
    });
    const elapsed = Date.now() - start;
    return {
      command: cfg.command,
      exitCode: r.status,
      stdout: r.stdout?.toString() || '',
      stderr: r.stderr?.toString() || '',
      elapsedMs: elapsed,
      mode: cfg.mode || 'pass-fail',
      weight: cfg.weight ?? 1,
    };
  } catch (err) {
    return {
      command: cfg.command,
      error: err.message,
      mode: cfg.mode || 'pass-fail',
      weight: cfg.weight ?? 1,
    };
  }
}

function scoreResults(results, metricsConfig, wantedMetrics) {
  const out = {};
  for (const [model, payload] of Object.entries(results)) {
    if (payload.error) {
      out[model] = { error: payload.error };
      continue;
    }
    let total = 0;
    let maxTotal = 0;
    const breakdown = {};
    for (const name of wantedMetrics) {
      const cfg = metricsConfig[name];
      const m = payload.metrics[name];
      const weight = cfg.weight ?? 1;
      maxTotal += weight;
      let earned = 0;
      if (cfg.mode === 'pass-fail') {
        earned = m.exitCode === 0 ? weight : 0;
      } else if (cfg.mode === 'numeric-min') {
        // Smaller stdout (after parse) is better. Used for diff size.
        const numeric = extractFirstNumber(m.stdout);
        breakdown[name] = { ...m, numeric };
        // Defer normalization to render layer (needs cross-model context).
        earned = weight; // provisional; renderer normalizes
      }
      breakdown[name] = breakdown[name] || m;
      breakdown[name].earned = earned;
      total += earned;
    }
    out[model] = { total, maxTotal, breakdown, diff: payload.diff };
  }

  // Normalize numeric-min metrics across models.
  for (const name of wantedMetrics) {
    const cfg = metricsConfig[name];
    if (cfg.mode !== 'numeric-min') continue;
    const numbers = Object.values(out)
      .map((r) => r.breakdown?.[name]?.numeric)
      .filter((n) => typeof n === 'number');
    if (numbers.length === 0) continue;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    const range = max - min || 1;
    for (const r of Object.values(out)) {
      const m = r.breakdown?.[name];
      if (!m || typeof m.numeric !== 'number') continue;
      // Smaller is better → inverse linear interpolation
      const norm = 1 - (m.numeric - min) / range;
      const earned = (cfg.weight ?? 1) * norm;
      r.total = (r.total ?? 0) - (cfg.weight ?? 1) + earned;
      m.earned = earned;
    }
  }

  return out;
}

function extractFirstNumber(text) {
  if (!text) return null;
  const m = text.match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}

function renderTable(scored, models, wantedMetrics, metricsConfig) {
  const cols = ['metric', ...models.map((m) => m.name)];
  const widths = cols.map((c) => c.length);
  const rows = [];

  for (const metric of wantedMetrics) {
    const cfg = metricsConfig[metric];
    const cells = [`${metric} (×${cfg.weight ?? 1})`];
    for (const m of models) {
      const r = scored[m.name];
      if (!r || r.error) {
        cells.push(color.red('error'));
        continue;
      }
      const b = r.breakdown[metric];
      if (!b) {
        cells.push(color.dim('—'));
        continue;
      }
      if (cfg.mode === 'pass-fail') {
        cells.push(b.exitCode === 0 ? color.green('✓ pass') : color.red('✗ fail'));
      } else if (cfg.mode === 'numeric-min') {
        const n = b.numeric;
        cells.push(typeof n === 'number' ? color.cyan(String(n)) : color.dim('—'));
      } else {
        cells.push(color.dim(`exit ${b.exitCode}`));
      }
    }
    rows.push(cells);
  }

  const totalRow = ['total'];
  for (const m of models) {
    const r = scored[m.name];
    if (!r || r.error) {
      totalRow.push(color.red('error'));
      continue;
    }
    totalRow.push(color.bold(`${r.total.toFixed(1)} / ${r.maxTotal.toFixed(1)}`));
  }
  rows.push(totalRow);

  for (const row of [cols, ...rows]) {
    row.forEach((c, i) => {
      const visible = stripAnsi(c);
      widths[i] = Math.max(widths[i], visible.length);
    });
  }

  const printRow = (row) => {
    console.log(
      '  ' +
        row
          .map((c, i) => {
            const visible = stripAnsi(c);
            const pad = ' '.repeat(widths[i] - visible.length);
            return c + pad;
          })
          .join('  '),
    );
  };

  console.log('');
  printRow(cols.map((c, i) => (i === 0 ? color.dim(c) : color.bold(c))));
  console.log('  ' + widths.map((w) => '-'.repeat(w)).join('  '));
  for (const row of rows) printRow(row);
  console.log('');
  console.log(color.dim('Higher total wins. Run `model-race judge` for an LLM evaluation overlay.'));
}

function stripAnsi(s) {
  return String(s).replace(/\x1b\[[0-9;]*m/g, '');
}
