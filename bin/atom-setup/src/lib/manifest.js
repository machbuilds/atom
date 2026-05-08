// manifest.js — declarative description of how a cloned atom checkout
// is transformed into a personalized project.
//
// atom-setup operates on the cwd. The cwd starts as a clone of the atom
// repo (with bin/, scripts/, extras/, learnings/, docs/planning/, and
// the atom-maintenance docs). After atom-setup, the cwd should look
// like a fresh project with only the user's chosen scaffold + presets.

// Files atom-setup PROMOTES from scaffold/ to the project root.
// Anything under scaffold/ that is not in this list still gets promoted
// (we walk scaffold/ and copy everything, unless it's in PROMOTE_EXCLUDE).
export const PROMOTE_EXCLUDE = [];

// Atom-maintenance docs that are removed BEFORE scaffold promotion.
// (Removing first means scaffold's AGENTS.md / CLAUDE.md / etc. land
// cleanly at the project root without atom's versions sitting there
// first and being overwritten.)
export const REMOVE_BEFORE_PROMOTE = [
  'docs/planning',
  'docs/INBOX.md',
  'docs/LESSONS_LEARNED.md',
  'docs/PATTERNS.md',
  'docs/LEARNINGS_TAXONOMY.md',
  'docs/HOW_TO_WRITE_CONSTITUTION.md',
  'docs/HOW_TO_PICK_DEPLOY_TARGET.md',
  'docs/HOW_TO_DESIGN.md',
  'docs/VOICE.md',
  'docs/WORKFLOW.md',
  'CONTRIBUTING.md',
  'INSTALL.md',
  'README.md',
  'AGENTS.md',
  'CLAUDE.md',
  'CHANGELOG.md',
  'CODE_OF_CONDUCT.md',
  'SECURITY.md',
  'atom-setup',
];

// Source directories that are removed AFTER promotion + preset copy.
// scaffold/ is the source we just promoted; bin/, scripts/, extras/
// are atom maintenance content the user's project does not need.
//
// `learnings/` was in this list before v0.2.1 — that was a leftover
// from v0.1.0 when the repo carried maintainer-curated learnings.
// v0.1.1 removed that directory from the repo, and v0.2 introduced
// per-preset seed learnings that land at `<root>/learnings/`. The
// user's playbook also copies into `<root>/learnings/`. So this
// directory must SURVIVE the cleanup pass.
export const REMOVE_AFTER_PROMOTE = [
  'bin',
  'scripts',
  'extras',
  'scaffold',
];

// Stack tag mapping for learnings filter. See docs/LEARNINGS_TAXONOMY.md.
export const STACK_TAGS = {
  'nextjs': ['universal', 'web', 'node'],
  'python-fastapi': ['universal', 'web', 'api', 'python'],
  'swift-vapor': ['universal', 'web', 'api', 'swift'],
  'rust-axum': ['universal', 'web', 'api', 'rust'],
  'go-cobra': ['universal', 'cli', 'go'],
  'ts-library': ['universal', 'library', 'node'],
  'react': ['universal', 'web', 'node'],
  'astro': ['universal', 'web', 'node'],
  'static': ['universal', 'web'],
  'node-api': ['universal', 'web', 'api', 'node'],
  'python-api': ['universal', 'web', 'api', 'python'],
  'swift-ios': ['universal', 'mobile', 'swift'],
  'swift': ['universal', 'mobile', 'swift'], // legacy alias for older state files
  'react-native': ['universal', 'mobile'],
  'cli': ['universal', 'cli'],
  'library': ['universal', 'library'],
  'ai': ['universal', 'ai'],
  'other': ['universal'],
  'decide-later': ['universal'],
};

// Stack preset → which directory under extras/ to copy into the project.
export const STACK_PRESET_DIR = {
  'nextjs': 'extras/web/nextjs-railway',
  'python-fastapi': 'extras/web/python-fastapi',
  'swift-vapor': 'extras/web/swift-vapor',
  'rust-axum': 'extras/web/rust-axum',
  'go-cobra': 'extras/cli/go-cobra',
  'ts-library': 'extras/lib/typescript-library',
};

// Docker tier → which files from extras/docker/ get copied.
export const DOCKER_TIER_FILES = {
  'none': [],
  'dockerfile': ['Dockerfile', '.dockerignore', '.github/workflows/docker.yml'],
  'compose': [
    'Dockerfile', '.dockerignore', '.github/workflows/docker.yml',
    'docker-compose.yml', 'docker-compose.full.yml',
  ],
  'devcontainer': [
    'Dockerfile', '.dockerignore', '.github/workflows/docker.yml',
    'docker-compose.yml', 'docker-compose.full.yml',
    '.devcontainer/devcontainer.json',
  ],
};

// Stack -> deploy target -> Docker tier suggestion.
//
// Web presets (nextjs, python-fastapi, swift-vapor, rust-axum) ship their
// own Dockerfile in the preset; the Docker section won't overlay anything
// for those tiers below 'compose' since the preset's file is already at
// root. CLI / library presets default to 'none' regardless of deploy
// target — they're distributed as binaries / npm packages, not images.
export function suggestDockerTier(stack, deployTarget) {
  if (!stack) return 'none';
  if (stack === 'go-cobra' || stack === 'ts-library') return 'none';
  if (stack === 'swift' || stack === 'swift-ios' || stack === 'react-native' || stack === 'static') return 'none';
  if (stack === 'cli' || stack === 'library') return 'none';
  if (deployTarget === 'vercel' || deployTarget === 'netlify') return 'none';
  if (deployTarget === 'decide-later') return 'none';
  if (deployTarget === 'railway' || deployTarget === 'fly' || deployTarget === 'aws' || deployTarget === 'custom') {
    return 'dockerfile';
  }
  return 'none';
}
