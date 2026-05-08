// writer.js — applies an answers state to the cwd, transforming the
// atom clone into a personalized project.

import {
  existsSync, readdirSync, statSync, copyFileSync, mkdirSync,
  writeFileSync, rmSync, renameSync, readFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  REMOVE_BEFORE_PROMOTE, REMOVE_AFTER_PROMOTE,
  STACK_TAGS, STACK_PRESET_DIR, DOCKER_TIER_FILES,
} from './manifest.js';
import { renderLicense } from './licenses.js';
import { renderConstitution } from './constitution.js';

const ATOM_HOME = process.env.ATOM_HOME || join(homedir(), '.atom');
const USER_LEARNINGS_DIR = process.env.ATOM_LEARNINGS_HOME || join(ATOM_HOME, 'learnings');

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

  // 4b. Render README — substitute placeholders, splice preset's
  //     README.snippet.md into the Quick Start section, drop the
  //     snippet file. No-op if scaffold's README didn't promote.
  renderReadme(root, answers, log, dryRun);

  // 5. Filter and copy learnings (from the user's local playbook at
  //    ~/.atom/learnings/, NOT from anything in the atom repo).
  //    No-op if the user has not yet promoted any learnings or hasn't
  //    run `learnings init`.
  if (existsSync(USER_LEARNINGS_DIR)) {
    copyLearnings(root, answers.stack, log, dryRun);
  }

  // 6. Write LICENSE.
  if (answers.license && answers.license !== 'None') {
    writeLicense(root, answers, log, dryRun);
  }

  // 6b. Write CONSTITUTION.md if user opted in. Generated inline from
  //     §1 (project basics) + §2 (stack & deploy) so the user lands on
  //     a populated draft, not a TODO marker that gets forgotten.
  if (answers.constitution) {
    writeConstitution(root, answers, log, dryRun);
  }

  // 7. Remove atom source directories (scaffold/, bin/, etc.) now that
  //    they have been promoted or are no longer needed.
  removeFiles(root, REMOVE_AFTER_PROMOTE, log, dryRun);

  // 8. Re-init git history (start fresh).
  if (!dryRun && opts.gitInit !== false) {
    reinitGit(root, answers, log);
  }

  // 9. Wire up the git remote based on §10's gitRemoteChoice.
  //    - create-gh: spawn `gh repo create` and push
  //    - existing:  add remote + optional push
  //    - skip:      no-op
  //    Failures here are logged and surfaced via the cheatsheet but
  //    must NOT abort the rest of the apply step — files are already
  //    on disk, the project is functionally ready, and the user can
  //    retry the remote operation manually.
  if (!dryRun && opts.gitInit !== false) {
    setupGitRemote(root, answers, log);
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

function renderReadme(root, answers, log, dryRun) {
  const readme = join(root, 'README.md');
  const snippet = join(root, 'README.snippet.md');
  if (!existsSync(readme)) return;

  if (dryRun) {
    log(`(dry-run) render README (${existsSync(snippet) ? 'with preset snippet' : 'no preset snippet'})`);
    return;
  }

  let body = readFileSync(readme, 'utf8');
  const projectName = answers.projectName || 'project';
  const description = answers.description || `${projectName} — scaffolded from atom.`;

  let quickStart;
  if (existsSync(snippet)) {
    quickStart = readFileSync(snippet, 'utf8').trim();
    rmSync(snippet, { force: true });
  } else {
    quickStart = '## Quick start\n\nFill this in once the project has a build/run command.';
  }

  body = body
    .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
    .replace(/\{\{DESCRIPTION\}\}/g, description)
    .replace(/\{\{QUICK_START\}\}/g, quickStart);

  writeFileSync(readme, body);
  log(`render README (${existsSync(snippet) ? 'with' : 'without'} preset snippet)`);
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
    // Stack presets ship their own stack-tuned Dockerfile + .dockerignore.
    // Don't overwrite them with the generic versions — the preset's are
    // already at the destination because copyStackPreset ran first.
    if (existsSync(dst)) {
      log(`docker copy: ${rel} (skipped — preset already provided it)`);
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
  const src = USER_LEARNINGS_DIR;
  const tags = new Set(STACK_TAGS[stack] || ['universal']);

  function walk(dir) {
    for (const entry of readdirSync(dir)) {
      const p = join(dir, entry);
      let s;
      try { s = statSync(p); } catch { continue; }
      if (s.isDirectory()) {
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
          log(`(dry-run) learning copy from playbook: ${rel}`);
          continue;
        }
        mkdirSync(dirname(dst), { recursive: true });
        copyFileSync(p, dst);
        log(`learning copy from playbook: ${rel}`);
      }
    }
  }
  walk(src);
}

function writeConstitution(root, answers, log, dryRun) {
  const path = join(root, 'CONSTITUTION.md');
  if (dryRun) {
    log(`(dry-run) write CONSTITUTION.md (v0.1.0 draft, populated from answers)`);
    return;
  }
  const text = renderConstitution(answers);
  writeFileSync(path, text);
  log(`wrote CONSTITUTION.md (v0.1.0 draft)`);
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

function setupGitRemote(root, answers, log) {
  const choice = answers.gitRemoteChoice;
  if (!choice || choice === 'skip') return;

  if (choice === 'create-gh') {
    const user = answers.gitRemoteUser || 'me';
    const name = answers.gitRemoteName || answers.projectName;
    const visibility = answers.gitRemoteVisibility === 'public' ? '--public' : '--private';
    const description = answers.description ? ['--description', answers.description] : [];
    const args = ['repo', 'create', `${user}/${name}`, visibility, ...description, '--source', root];
    if (answers.gitPush) args.push('--push');

    const r = spawnSync('gh', args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.status === 0) {
      log(`gh: created ${user}/${name} (${answers.gitRemoteVisibility || 'private'})${answers.gitPush ? ' and pushed' : ''}`);
      return;
    }

    // gh failed. Don't abort the wizard — the project is ready locally.
    // Surface the exact retry command so the user can finish manually.
    const stderr = (r.stderr?.toString() || '').trim().split('\n').slice(-3).join(' | ');
    log(`gh repo create failed: ${stderr || `exit ${r.status}`}`);
    log(`  retry manually: gh ${args.map(a => /\s/.test(a) ? `"${a}"` : a).join(' ')}`);
    return;
  }

  if (choice === 'existing' && answers.gitRemote) {
    const r = spawnSync('git', ['remote', 'add', 'origin', answers.gitRemote], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    if (r.status !== 0) {
      log(`git remote add failed: ${(r.stderr?.toString() || '').trim()}`);
      return;
    }
    log(`git: remote 'origin' → ${answers.gitRemote}`);

    if (answers.gitPush) {
      const p = spawnSync('git', ['push', '-u', 'origin', 'main'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
      if (p.status === 0) {
        log('git: pushed to origin/main');
      } else {
        const stderr = (p.stderr?.toString() || '').trim().split('\n').slice(-3).join(' | ');
        log(`git push failed: ${stderr || `exit ${p.status}`}`);
        log(`  retry manually: git push -u origin main`);
      }
    }
  }
}

function walkAndCopy(srcDir, dstDir, log, dryRun, rootDst = dstDir) {
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const src = join(srcDir, entry.name);
    const dst = join(dstDir, entry.name);
    const rel = relative(rootDst, dst);
    if (entry.isDirectory()) {
      if (dryRun) {
        log(`(dry-run) mkdir + copy: ${rel}/`);
      } else {
        mkdirSync(dst, { recursive: true });
      }
      walkAndCopy(src, dst, log, dryRun, rootDst);
    } else {
      if (dryRun) {
        log(`(dry-run) copy: ${rel}`);
      } else {
        mkdirSync(dirname(dst), { recursive: true });
        copyFileSync(src, dst);
        log(`copy: ${rel}`);
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
