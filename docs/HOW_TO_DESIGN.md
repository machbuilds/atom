# HOW_TO_DESIGN.md

The design decision flow that consistently produces a coherent UI.
Five steps: capture, distill, encode, build, document.

## Step 1 — Capture references

Before designing anything, gather references from apps you admire. Aim
for 5-10 sources covering different aspects:
- Typography & hierarchy (one app you respect for word density)
- Color (one app you respect for palette)
- Motion (one app with motion that supports rather than distracts)
- Density / information layout (one app that handles complex data well)
- Brand voice match (one app whose feel matches what you're building)

Drop one screenshot per source into `.claude/references/<topic>.md` (or
similar) with a paragraph on what specifically you're learning from it.
Don't paste a whole app — paste the moment that taught you something.

**Where to source references:**
- [Mobbin](https://mobbin.com) — categorised mobile app screenshots
- [Dribbble](https://dribbble.com) — concept work, often impractical but
  good for atmosphere
- [Behance](https://behance.net) — case studies, branding work
- [Linear's blog](https://linear.app/blog) — exemplary product writing +
  visual design
- [Vercel Templates](https://vercel.com/templates) — production patterns
  for Next.js apps
- Apple's [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
  — when designing for iOS or polish-heavy contexts
- [Material Design](https://m3.material.io/) — when designing for
  Android or systematising at scale
- App Store screenshots — pull from real shipped apps, not concepts

## Step 2 — Distill the design system

From the references, extract:
- **Typography**: 2 typefaces max (one for display, one for body). Type
  scale (5-7 sizes max). Weights you'll actually use. Letter spacing
  rules for display vs body.
- **Color palette**: a small set (~10 colors). Name them by role (`bg`,
  `bg-card`, `ink`, `ink-dim`, `accent`, `accent-soft`) not by hue
  (`blue-500`). Roles survive theme changes; hues don't.
- **Spacing scale**: 4px or 8px base. 6-8 increments (`xs`, `sm`, `md`,
  `lg`, `xl`, `2xl`).
- **Border radius**: 3-4 increments tied to component scale.
- **Motion**: 2-3 named easings, 2-3 named durations. Transitions never
  exceed 400ms. Don't motion for the sake of motion.
- **Elevation / shadows**: 3-4 named levels. Or skip shadows entirely
  if the design doesn't need them.

Write this in `docs/DESIGN.md` (or similar) in the project. One page.

## Step 3 — Encode in tokens, never hardcode values

**Tailwind**: encode the system in `tailwind.config.ts` as named tokens.
Component code references `text-ink`, `bg-bg-card`, `ring-fg/10` —
never `text-slate-400` or `bg-[#0a0a0a]`. Hardcoded values create silent
drift; tokens get changed in one place.

**CSS modules / styled-components / vanilla CSS**: same idea. Define
custom properties (CSS variables) once, reference them everywhere.

If you find yourself writing a hex code in a component, stop. Add it to
the token system first.

## Step 4 — Component-first, atomic to molecular

Build atoms before molecules before organisms:
1. **Atoms**: button, input, badge, avatar, icon. The smallest reusable
   units. Each gets a Storybook story showing every state.
2. **Molecules**: toolbar, card, list-item, form-field. Composes atoms.
   Each story covers the realistic data shapes (empty, loading, error,
   populated).
3. **Organisms**: a full feature surface like a hero section, a
   leaderboard, a checkout form. Composes molecules.
4. **Pages**: composes organisms. Should be relatively thin.

Stories ship with every component. They're not optional. Storybook is
where you spot-check responsive behaviour, fixture-driven states, and
edge cases without booting the whole app.

## Step 5 — Document the decision

In `docs/DESIGN.md`, write down:
- Why these references? (one paragraph)
- Why this typography pairing? (one paragraph — reading it later, you'll
  thank yourself)
- Why this color palette? What did you reject and why?
- The one or two design rules you absolutely will not break (e.g.,
  "primary CTA is always the gradient brand button — no exceptions")

Reference this doc from `CLAUDE.md`'s design section.

## Common mistakes

- **Designing the homepage first.** Build atoms first. The homepage is
  an organism that depends on every other component existing.
- **Picking colors by hue, not role.** When dark mode lands or theme
  changes, hue-named tokens break.
- **More than 2 typefaces.** Cognitive load on the user, maintenance
  cost on you. Two is plenty.
- **Motion that doesn't earn its keep.** If a motion can be removed
  and the UX doesn't suffer, remove it.
- **Skipping Storybook because "I'll add it later".** Later means never.
  Stories accumulate as you build, not after.

## When you're stuck

Look at the references. Pick the one you most want this product to feel
like. Strip away everything that doesn't match that feel. The product
gets clearer when you decide what it isn't.
