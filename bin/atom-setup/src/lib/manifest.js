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
];

// Source directories that are removed AFTER promotion + preset copy.
// scaffold/ is the source we just promoted; bin/, scripts/, extras/,
// learnings/ are atom maintenance content the user's project does not
// need.
export const REMOVE_AFTER_PROMOTE = [
  'bin',
  'scripts',
  'extras',
  'learnings',
  'scaffold',
];

// Stack tag mapping for learnings filter. See docs/LEARNINGS_TAXONOMY.md.
export const STACK_TAGS = {
  'nextjs': ['universal', 'web'],
  'react': ['universal', 'web'],
  'astro': ['universal', 'web'],
  'static': ['universal', 'web'],
  'python-api': ['universal', 'api'],
  'node-api': ['universal', 'api'],
  'swift': ['universal', 'mobile'],
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
export function suggestDockerTier(stack, deployTarget) {
  if (!stack) return 'none';
  if (stack === 'swift' || stack === 'react-native' || stack === 'static') return 'none';
  if (deployTarget === 'vercel' || deployTarget === 'netlify') return 'none';
  if (deployTarget === 'decide-later') return 'none';
  if (deployTarget === 'railway' || deployTarget === 'fly' || deployTarget === 'aws' || deployTarget === 'custom') {
    return 'dockerfile';
  }
  return 'none';
}
