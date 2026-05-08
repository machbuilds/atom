// constitution.js — generates a starter CONSTITUTION.md populated from
// wizard answers. Follows the methodology in
// docs/HOW_TO_WRITE_CONSTITUTION.md: at-most-5 principles, locked tech
// stack, agent matrix, phase gates, semver policy, change log.
//
// The generator's job is the SCAFFOLD — the right shape with the
// answers filled in. Principles stay as TODO placeholders because the
// HOW_TO doc is explicit that principles are decisions the user has to
// make, not boilerplate. atom suggests stack-specific candidates as
// commented-out hints; the user uncomments and edits.

const STACK_DETAILS = {
  'nextjs': {
    runtime: 'Node.js 22 LTS',
    framework: 'Next.js 15+ (App Router)',
    language: 'TypeScript (strict)',
    libraries: 'React, your-choice ORM, your-choice auth provider',
  },
  'python-fastapi': {
    runtime: 'Python 3.12',
    framework: 'FastAPI 0.115+',
    language: 'Python (with Pydantic v2)',
    libraries: 'uvicorn, your-choice ORM (SQLAlchemy / SQLModel), your-choice auth',
  },
  'swift-vapor': {
    runtime: 'Swift 5.10',
    framework: 'Vapor 4.99+',
    language: 'Swift (server-side)',
    libraries: 'Fluent (ORM), JWT, your-choice queue driver',
  },
  'rust-axum': {
    runtime: 'Rust 1.85 (stable)',
    framework: 'Axum 0.7',
    language: 'Rust',
    libraries: 'Tokio 1.x, Tower 0.5, tracing, sqlx / sea-orm',
  },
  'go-cobra': {
    runtime: 'Go 1.23',
    framework: 'Cobra 1.8',
    language: 'Go',
    libraries: 'Viper (config), your-choice logger',
  },
  'ts-library': {
    runtime: 'Node.js 18+ (consumer); 22+ (development)',
    framework: 'TypeScript 5.6+',
    language: 'TypeScript (strict, dual ESM/CJS output via tsup)',
    libraries: 'tsup, vitest, no runtime deps unless absolutely necessary',
  },
};

// Stack-specific principle hints. NOT principles for the user — these
// are starter prompts. The user keeps the ones that ring true and
// deletes the rest. Following the HOW_TO doc: at most 5, all
// enforceable, no aspirational language.
const STACK_PRINCIPLE_HINTS = {
  'nextjs':         ['Performance: p95 server response under 500ms', 'Server components by default; client only when interactivity demands it'],
  'python-fastapi': ['/healthz stays cheap (no DB calls)', 'Pydantic v2 contracts are the API surface'],
  'swift-vapor':    ['Tests pass in the Linux container, not just on macOS', '0.0.0.0 binding inside containers (never localhost)'],
  'rust-axum':      ['No `unwrap()` in non-test code; use `?` and typed errors', 'Tracing spans across every request'],
  'go-cobra':       ['Exit codes follow POSIX (0 success, non-zero error)', 'Stdout for data, stderr for diagnostics — no mixing'],
  'ts-library':     ['Public API ships in dist/index.{ts,js,cjs} only', 'No runtime dep added without a one-line justification'],
  'web':            ['p95 latency under 500ms for primary flows'],
  'api':            ['Stable contracts; breaking changes need a major bump'],
  'cli':            ['POSIX exit codes; stdout vs stderr discipline'],
  'library':        ['Semver is binding (no breaking changes in minor / patch)'],
};

export function renderConstitution(answers) {
  const projectName = answers.projectName || 'project';
  const description = answers.description || `${projectName} — capture what this project does and who it's for in one line.`;
  const stack = answers.stack || 'other';
  const deploy = answers.deployTarget || 'decide-later';
  const visibility = answers.visibility || 'private';
  const multiAgent = answers.multiAgent === true;
  const date = isoDate(answers.year);

  const stackInfo = STACK_DETAILS[stack] || {
    runtime: '<TODO: pin runtime version>',
    framework: '<TODO: pin framework version (caret-minor)>',
    language: '<TODO>',
    libraries: '<TODO: list pinned key libraries>',
  };

  const principleHints = collectPrincipleHints(stack);

  return `# ${projectName} — Constitution v0.1.0

> ${description}
>
> _This is a starter. Refine each section before treating it as binding.
> See \`docs/HOW_TO_WRITE_CONSTITUTION.md\` (kept in atom) for the
> methodology. The \`speckit-constitution\` skill in Claude Code can
> verify structure once you've drafted the principles._

## Principles

A constitution captures **decisions you've already made and don't want
to relitigate** — not aspirations, not style preferences. At most 5.
Each one-line statement plus one-paragraph rationale.

${renderPrinciplePlaceholders(principleHints)}

## Tech stack (locked)

These are the pins that require a constitution version bump to change.

- **Runtime**: ${stackInfo.runtime}
- **Framework**: ${stackInfo.framework}
- **Language**: ${stackInfo.language}
- **Hosting / deploy target**: ${labelDeploy(deploy)}
- **Repository visibility**: ${visibility}
- **Key libraries**: ${stackInfo.libraries}

> Disagreement with \`package.json\` / \`Cargo.toml\` / \`go.mod\` is a bug.
> Bump this section AND the manifest, then commit together.

## Agent ownership

${renderAgentMatrix(multiAgent)}

> Strict rule: if a task forces an agent across these paths, the agent
> **stops** and flags a routing error, not silently edits.

## Phase definitions and gates

Define the project's discrete phases (if any) and the conditions that
must hold before moving from one to the next. Without explicit gates,
"phases" become vibes; with them, transitions become decisions.

### Phase 1 — <name>

**What ships in this phase**: <TODO>

**Gate to Phase 2**:
- [ ] <TODO: e.g., API contract verified end-to-end>
- [ ] <TODO: e.g., fixtures created and committed>
- [ ] <TODO: e.g., plan reviewed by stakeholders>

### Phase 2 — <name>

**What ships in this phase**: <TODO>

**Gate to launch**:
- [ ] <TODO: e.g., calibration metric ≥ X>
- [ ] <TODO: e.g., security review passed>
- [ ] <TODO: e.g., load test passed at Y RPS>

> If the project has no real phases, replace this section with a single
> "Continuous delivery — the gate is green CI plus a passing review"
> note. Don't keep stub phases that mean nothing.

## Versioning policy

The constitution is a versioned, line-by-line auditable document.

- **Major** (\`v2.0.0\`): removing a principle, weakening a constraint.
- **Minor** (\`v1.1.0\`): adding a principle.
- **Patch** (\`v1.0.1\`): wording polish that doesn't change meaning.

When you violate a principle, the diff lives in \`git log\` — the
violation is auditable. \`AGENTS.md\` should reference the active
version.

## Change log

- **v0.1.0** (${date}) — initial draft scaffolded by atom-setup. Refine
  before treating any section as binding.

---

_Methodology: \`docs/HOW_TO_WRITE_CONSTITUTION.md\` (atom)._
_Anti-patterns to avoid: aspirational principles, style guide content,
TODOs and roadmap items, multi-paragraph rationales._
`;
}

function collectPrincipleHints(stack) {
  const hints = [];
  if (STACK_PRINCIPLE_HINTS[stack]) hints.push(...STACK_PRINCIPLE_HINTS[stack]);
  // Generic hints based on the stack's category.
  const isWeb = ['nextjs', 'react', 'astro', 'static', 'python-fastapi', 'swift-vapor', 'rust-axum', 'node-api', 'python-api'].includes(stack);
  const isApi = ['python-fastapi', 'swift-vapor', 'rust-axum', 'node-api', 'python-api'].includes(stack);
  const isCli = ['go-cobra', 'cli'].includes(stack);
  const isLib = ['ts-library', 'library'].includes(stack);
  if (isWeb && !STACK_PRINCIPLE_HINTS[stack]?.includes(STACK_PRINCIPLE_HINTS.web[0])) hints.push(...STACK_PRINCIPLE_HINTS.web);
  if (isApi && !hints.includes(STACK_PRINCIPLE_HINTS.api[0])) hints.push(...STACK_PRINCIPLE_HINTS.api);
  if (isCli && !hints.includes(STACK_PRINCIPLE_HINTS.cli[0])) hints.push(...STACK_PRINCIPLE_HINTS.cli);
  if (isLib && !hints.includes(STACK_PRINCIPLE_HINTS.library[0])) hints.push(...STACK_PRINCIPLE_HINTS.library);
  return hints;
}

function renderPrinciplePlaceholders(hints) {
  // Three slots minimum; up to 5. The user keeps what fits, deletes the
  // rest, writes new ones. Hints stay as inline comments so they don't
  // accidentally become live principles via copy-paste.
  const slots = [];
  for (let i = 0; i < 3; i++) {
    const hint = hints[i];
    const heading = `### ${roman(i + 1)}. <Principle ${i + 1} — one line>`;
    const hintLine = hint
      ? `\n<!-- atom suggestion (delete or rewrite): ${hint} -->\n`
      : '\n';
    slots.push(`${heading}${hintLine}\n<One-paragraph rationale: why this matters, what breaks without it. If it can't be enforced in code review, cut it.>\n`);
  }
  return slots.join('\n');
}

function renderAgentMatrix(multiAgent) {
  if (multiAgent) {
    return `| Agent | Harness | Owns |
|---|---|---|
| Backend | <e.g., Claude Code> | \`<paths>\` |
| Frontend / Design | <e.g., Codex CLI> | \`<paths>\` |
| Test | <e.g., Gemini CLI> | \`<paths>\` |
| Deploy | <e.g., Claude Code> | \`<paths>\` |`;
  }
  return `| Agent | Harness | Owns |
|---|---|---|
| Solo | <e.g., Claude Code> | All paths |

Single-agent project today. Add rows here when work splits across agents.`;
}

function labelDeploy(value) {
  const labels = {
    'railway': 'Railway',
    'vercel': 'Vercel',
    'netlify': 'Netlify',
    'fly': 'Fly.io',
    'aws': 'AWS (ECS / Lambda)',
    'custom': 'Custom (self-hosted)',
    'none': 'Not deploying yet',
    'decide-later': 'TBD — decide before Phase 2',
  };
  return labels[value] || value;
}

function roman(n) {
  const values = ['I', 'II', 'III', 'IV', 'V'];
  return values[n - 1] || String(n);
}

function isoDate(year) {
  // Use the wizard's `year` answer if present (it defaults to current
  // year). Constitutions are dated by the day they were drafted; we
  // don't have day granularity in answers, so fall back to today.
  const d = new Date();
  if (year && Number.isFinite(year)) d.setFullYear(year);
  return d.toISOString().slice(0, 10);
}
