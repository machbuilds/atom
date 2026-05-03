# Design references

This folder holds design references for **this project**. Each file
captures a single source you're learning from, with one screenshot and
a paragraph on what specifically you're taking from it.

## Format

One file per source, named by topic or app:

```
.claude/references/
├── linear-typography.md      # what Linear teaches about display type
├── stripe-density.md         # how Stripe handles complex form data
├── vercel-templates.md       # production patterns for Next.js apps
└── apple-hig-motion.md       # motion principles from Apple's HIG
```

Each file:

```markdown
# <Source name>

**Screenshot**: <inline image or link>

**What I'm learning from this**:
<One paragraph. Be specific. "Their type scale is X/Y/Z" beats "good
typography". Name the specific decision you're borrowing.>

**What I'm NOT taking from this**:
<Optional. Sometimes the contrast helps — "their density is great but
their illustration style is wrong for our voice".>
```

## Where to source references

See `docs/HOW_TO_DESIGN.md` in atom for the full list. Quick links:

- [Mobbin](https://mobbin.com) — categorised app screenshots
- [Linear's blog](https://linear.app/blog) — exemplary design + writing
- [Vercel templates](https://vercel.com/templates) — Next.js production
- [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design](https://m3.material.io/)

## When to add a reference

When the user asks "make this feel more like X", check this folder for
X first. If it's not here, add it before starting design work.

When you make a design decision that surprises future-you, document the
reference that influenced it. Future-you (or future-Claude) reads
references/ to understand WHY the design is the way it is.
