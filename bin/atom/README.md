# atom (CLI)

Top-level help dispatcher for atom's tooling. Type `atom --help` (or just `atom`) and you get a single command table for every CLI in the atom system.

## Install

Installed automatically by atom's bootstrap script. From a cloned atom directory:

```
./atom-setup
```

That installs `atom`, `atom-setup`, `nucleus`, `learnings`, and `model-race` globally in one step.

To install just this dispatcher manually:

```
cd bin/atom && npm install -g .
```

Requires Node 18+.

## Usage

```
atom              # prints the help table
atom --help       # same
atom -h           # same
atom --version    # version of this dispatcher
```

That's it. atom doesn't subcommand-route — every CLI is invoked by its own name (`nucleus add`, `learnings list`, `model-race start`, etc.). `atom` exists purely as a discovery surface so you don't have to remember everything that ships in the system.

## What you'll see

```
atom — project-starter template with cross-project memory.
Every project starts here. Every lesson travels with you.

Setup
  atom-setup [--bare | --minimal | --full]    Bootstrap a new project from atom.

Capture — your memory of every session
  nucleus add "<insight>" --type <T>          Capture a session learning.
  nucleus search <keyword>                    Find past learnings.
  nucleus promote <id>                        Graduate to your local learnings.
  nucleus sync                                Push/pull ~/.atom/nucleus to GitHub.
  nucleus init                                One-time setup.

Carry forward — your local playbook
  learnings list                              Show your curated learnings.
  learnings show <key>                        View one entry.
  learnings sync                              Push/pull ~/.atom/learnings to GitHub.
  learnings init                              One-time setup.

Compare — for high-stakes features
  model-race start <feature>                  Race a feature across AI models.
  model-race score                            Run scorecard.
  model-race judge                            Opt-in LLM evaluation.
  model-race merge <winner>                   Cherry-pick winner.

Help
  atom --help                                 This screen.
  <tool> --help                               Detailed help for any specific tool.
```

For the detailed flags and behavior of any specific CLI:

```
nucleus --help
learnings --help
model-race --help
atom-setup --help
```

## License

MIT (matches atom).
