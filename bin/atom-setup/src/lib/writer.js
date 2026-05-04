// writer.js — applies an answers state to the cwd, transforming the
// atom clone into a personalized project.

import {
  existsSync, readdirSync, statSync, copyFileSync, mkdirSync,
  writeFileSync, rmSync, renameSync, readFileSync,
} from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  REMOVE_BEFORE_PROMOTE, REMOVE_AFTER_PROMOTE,
  STACK_TAGS, STACK_PRESET_DIR, DOCKER_TIER_FILES,
} from './manifest.js';
import { renderLicense } from './licenses.js';

export async function applyState(state, cwd, opts = {}) {
  const log = opts.log || (() => {});
  const dryRun = opts.dryRun === true;

  const answers = state.answers || {};
  const root = cwd;

  // 1. Remove atom-maintenance docs FIRST so scaffold's promotions land cleanly.
  removeFiles(root, REMOVE_BEFORE_PROMOTE, log, dryRun);

  // 2. Promote scaffold/* into project root.
  promoteScaffold(root, log, dryRun);

  // 3. Copy stack preset (if matched).
  if (answers.stack && STACK_PRESET_DIR[answers.stack]) {
    copyStackPreset(root, answers.stack, log, dryRun);
  }

  // 4. Copy Docker files based on tier choice.
  if (answers.dockerTier && answers.dockerTier !== 'none') {
    copyDockerTier(root, answers.dockerTier, log, dryRun);
  }

  // 5. Filter and copy learnings (from learnings/ source dir).
  if (existsSync(join(root, 'learnings'))) {
    copyLearnings(root, answers.stack, log, dryRun);
  }

  // 6. Write LICENSE.
  if (answers.license && answers.license !== 'None') {
    writeLicense(root, answers, log, dryRun);
  }

  // 7. Remove atom source directories (scaffold/, bin/, etc.) now that
  //    they have been promoted or are no longer needed.
  removeFiles(root, REMOVE_AFTER_PROMOTE, log, dryRun);

  // 8. Re-init git history (start fresh).
  if (!dryRun && opts.gitInit !== false) {
    reinitGit(root, answers, log);
  }

  // nucleus init is intentionally NOT run here; nucleus is a global
  // CLI installed once on the user's machine. The cheatsheet prompts
  // the user to run `nucleus init` if they have not already.
}

function promoteScaffold(root, log, dryRun) {
  const scaffoldDir = join(root, 'scaffold');
  if (!existsSync(scaffoldDir)) return;
  walkAndCopy(scaffoldDir, root, log, dryRun);
}

function copyStackPreset(root, stack, log, dryRun) {
  const presetDir = join(root, STACK_PRESET_DIR[stack]);
  if (!existsSync(presetDir)) {
    log(`stack preset not found at ${presetDir}; skipping`);
    return;
  }
  walkAndCopy(presetDir, root, log, dryRun);
}

function copyDockerTier(root, tier, log, dryRun) {
  const dockerSrc = join(root, 'extras/docker');
  const files = DOCKER_TIER_FILES[tier];
  for (const rel of files) {
    const src = join(dockerSrc, rel);
    const dst = join(root, rel);
    if (!existsSync(src)) {
      log(`docker file ${rel} not found at ${src}; skipping`);
      continue;
    }
    if (dryRun) {
      log(`(dry-run) docker copy: ${rel}`);
      continue;
    }
    mkdirSync(dirname(dst), { recursive: true });
    copyFileSync(src, dst);
    log(`docker copy: ${rel}`);
  }
}

function copyLearnings(root, stack, log, dryRun) {
  const src = join(root, 'learnings');
  const tags = new Set(STACK_TAGS[stack] || ['universal']);

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      if (statSync(p).isDirectory()) {
        walk(p);
      } else if (entry.endsWith('.md') && entry !== 'README.md') {
        const rel = relative(src, p);
        const dst = join(root, 'learnings', rel);
        const raw = readFileSync(p, 'utf8');
        const fm = parseFrontmatter(raw);
        if (!fm) continue;
        const appliesTo = parseList(fm.applies_to) || ['universal'];
        if (!matches(appliesTo, tags)) continue;

        if (dryRun) {
          log(`(dry-run) learning copy: ${rel}`);
          continue;
        }
        if (dst === p) continue;
        mkdirSync(dirname(dst), { recursive: true });
        copyFileSync(p, dst);
        log(`learning copy: ${rel}`);
      }
    }
  }
  walk(src);
}

function writeLicense(root, answers, log, dryRun) {
  const text = renderLicense(answers.license, answers.year || new Date().getFullYear(), answers.author || '');
  if (!text) {
    log(`unknown license: ${answers.license}; skipping`);
    return;
  }
  if (dryRun) {
    log(`(dry-run) write LICENSE (${answers.license})`);
    return;
  }
  writeFileSync(join(root, 'LICENSE'), text);
  log(`wrote LICENSE (${answers.license})`);
}

function removeFiles(root, list, log, dryRun) {
  for (const rel of list) {
    const p = join(root, rel);
    if (!existsSync(p)) continue;
    if (dryRun) {
      log(`(dry-run) remove: ${rel}`);
      continue;
    }
    rmSync(p, { recursive: true, force: true });
    log(`remove: ${rel}`);
  }
}

function reinitGit(root, answers, log) {
  const dotGit = join(root, '.git');
  if (existsSync(dotGit)) {
    rmSync(dotGit, { recursive: true, force: true });
    log('removed atom .git history');
  }
  run('git', ['init', '--initial-branch=main'], root);
  run('git', ['add', '-A'], root);
  const subject = `initial: ${answers.projectName || 'project'} from atom`;
  const author = answers.author || 'atom user';
  const email = answers.email || 'noreply@example.com';
  run('git', ['-c', `user.name=${author}`, '-c', `user.email=${email}`, 'commit', '-m', subject], root);
  log(`git: initial commit on main`);
}

function walkAndCopy(srcDir, dstDir, log, dryRun) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    if (entry.isDirectory()) {
      if (dryRun) {
        log(`(dry-run) mkdir + copy: ${relative(dstDir, dst)}/`);
      } else {
        mkdirSync(dst, { recursive: true });
      }
      walkAndCopy(src, dst, log, dryRun);
    } else {
      if (dryRun) {
        log(`(dry-run) copy: ${relative(dstDir, dst)}`);
      } else {
        mkdirSync(dirname(dst), { recursive: true });
        copyFileSync(src, dst);
      }
    }
  }
}

function parseFrontmatter(raw) {
  const lines = raw.split('\n');
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const fm = {};
  for (let i = 1; i < end; i++) {
    const m = lines[i].match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)$/);
    if (!m) continue;
    fm[m[1]] = m[2].trim();
  }
  return fm;
}

function parseList(value) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) return [trimmed];
  const inner = trimmed.slice(1, -1).trim();
  if (inner.length === 0) return [];
  return inner.split(',').map((s) => s.trim()).filter(Boolean);
}

function matches(appliesTo, tags) {
  if (appliesTo.includes('universal')) return true;
  for (const t of appliesTo) {
    if (tags.has(t)) return true;
  }
  return false;
}

function run(bin, args, cwd) {
  const r = spawnSync(bin, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.status !== 0) {
    throw new Error(
      `${bin} ${args.join(' ')} failed (exit ${r.status}): ${r.stderr?.toString() || ''}`,
    );
  }
  return r;
}
