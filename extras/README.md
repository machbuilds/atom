# extras/

Stack presets. Opt-in, framework-specific. When a new project happens to
match one of these stacks, copy the preset's files into the new project's
repo to skip the boilerplate.

## Layout

Two-level: `extras/<category>/<preset>/`

```
extras/
├── web/
│   └── nextjs-railway/        Next.js 14+ + Railway
├── ai/
│   └── (future presets — Python+Modal, LangChain+Vercel, etc.)
└── mobile/
    └── (future presets — Swift+TestFlight, Expo+EAS, etc.)
```

## When to use a preset

When **all** of these are true:
1. The new project is in this category (web / ai / mobile / etc.)
2. The new project will use this exact stack (framework + deploy target)
3. You don't want to redo the Dockerfile / deploy config / framework wiring

If the project diverges (different framework, different deploy target,
different build pipeline), don't force-fit a preset. Either pick a
different one, write a fresh setup, or add a new preset to atom for
your variant.

## When to add a preset

After shipping a project with a stack you'll likely use again. Examples
of "likely again": you've shipped 2+ projects on this stack, or you're
deliberately standardising on it for future work.

To add a preset:

1. Create the directory: `extras/<category>/<preset>/`
2. Add the framework configs that don't change project to project:
   `Dockerfile`, deploy config (`railway.toml`, `fly.toml`, etc.),
   framework config (`next.config.js`), runtime pin (`.node-version`).
3. Add a `README.md` explaining:
   - When to use this preset (one paragraph)
   - What it includes (file list)
   - What it deliberately does NOT include (e.g., "no auth — the project
     adds that on top")
   - Customisation points (e.g., "edit the ARG list in Dockerfile to
     match your NEXT_PUBLIC_* vars")
4. Update `atom/CLAUDE.md`'s bootstrap step 4 if needed.

## What presets are NOT

- They are NOT full project scaffolds. The base scaffold (in
  `scaffold/`) is framework-agnostic. Presets layer on top.
- They are NOT for one-off configurations. If you're only going to use
  it once, don't add a preset — just write the config in the project.
- They are NOT for libraries / packages — only for project starting
  points.
