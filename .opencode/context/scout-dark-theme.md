# Scout Context: Dark Theme + Typography Visual Identity

## Project Overview
- **Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Framer Motion, TypeScript
- **Project root:** /Users/cunningjams/git/dnd.tools

## Key Files

### Theming System
- `app/globals.css` — ALL design tokens (`:root` custom properties), ALL semantic utility classes, body styling. Single source of truth for visual identity.
- `app/layout.tsx` — Root layout. `<html lang="en"><body className="antialiased">` wrapping Providers, RouteTransitionProvider, app-shell div, GlobalNav.
- No tailwind config file — uses Tailwind v4 CSS-first config via `@theme inline` block in globals.css.
- `postcss.config.mjs` — just loads `@tailwindcss/postcss`.

### Current Token Values (Light Parchment Theme)
```css
:root {
  color-scheme: light;
  --color-canvas: #f6f3ea;          /* Page background (cream/parchment) */
  --color-surface: #fffdfa;          /* Input/form backgrounds */
  --color-surface-elevated: #ffffff;  /* Card backgrounds */
  --color-border-subtle: #d7d0c1;    /* Default borders */
  --color-border-strong: #7f6f55;    /* Hover/emphasis borders */
  --color-text-primary: #1f1a14;     /* Primary text (dark brown) */
  --color-text-secondary: #5a4b36;   /* Secondary text */
  --color-text-muted: #7b6a50;       /* Tertiary text */
  --color-accent: #1f6f66;           /* Primary accent (teal) - used for active filters, admin buttons */
  --color-accent-contrast: #f7fffd;  /* Text on accent bg */
  --color-focus-ring: #ba5c12;       /* Focus ring / active nav (burnt orange) */
  --radius-sm: 0.5rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.25rem;
  --space-page-x: clamp(1rem, 3vw, 2rem);
  --space-page-y: clamp(1.5rem, 4vw, 2.5rem);
  --motion-fast: 140ms;
  --motion-base: 220ms;
}
```

### Current Font Configuration
- Body font: `"Spectral", "Iowan Old Style", "Palatino Linotype", serif` — ALL serif, no sans-serif
- No `next/font` usage, no @font-face, no web font loading
- Spectral is referenced but not loaded (relies on system install)
- No separate heading vs body font distinction

### Semantic Utility Classes (all in globals.css)
- `.app-shell` — max-width container with responsive padding
- `.surface-card` — elevated card with bg, border, border-radius, box-shadow
- `.input-field` — form input with transitions (+ ::placeholder, :focus-visible)
- `.filter-chip` — pill-shaped filter button (+ :hover, [data-active])
- `.filter-logic-trigger` — square icon button for filter settings
- `.filter-logic-popover` / `.filter-logic-popover-panel` — popover container
- `.text-muted`, `.text-secondary` — color helpers
- `.typography-h1` through `.typography-kicker` — typography scale (6 levels)
- `.site-title`, `.site-nav-link` — navigation elements
- `.admin-button`, `.admin-button-secondary` — button styles
- `.admin-textarea` — textarea style

### Tailwind Bridge
The `@theme inline` block exposes the 11 color tokens to Tailwind, enabling `bg-canvas`, `text-text-primary`, `border-border-subtle`, etc.

### Component Token Usage Patterns
1. **Semantic classes + Tailwind layout:** Most components (e.g., `surface-card block cursor-pointer p-6`)
2. **Tailwind arbitrary values referencing vars:** Used in spell-card.tsx and monster-card.tsx (e.g., `border-[color:var(--color-border-subtle)]`)
3. **Raw var() in globals.css:** Semantic classes consume tokens via var()

### Known Hardcoded Colors
1. `components/filter-group/filter-group.tsx` line 57: `border-[#eee]` — should use token
2. `globals.css` body background: hardcoded RGB gradients
3. `globals.css` box-shadows: hardcoded RGB values (derived from tokens but not referenced)

### Body Background (Current)
```css
body {
  background:
    radial-gradient(circle at 15% 10%, rgb(255 255 255 / 50%) 0%, rgb(255 255 255 / 0%) 40%),
    radial-gradient(circle at 80% 15%, rgb(31 111 102 / 11%) 0%, rgb(31 111 102 / 0%) 45%),
    var(--color-canvas);
}
```

### Files That Reference Tokens via Tailwind Arbitrary Values
- `page/spells/components/spell-card/spell-card.tsx` — uses `border-[color:var(--color-border-subtle)]`, `rounded-[var(--radius-sm)]`
- `page/monsters/components/monster-card/monster-card.tsx` — same pattern
- `page/monsters/components/monster-card/components/named-text-section/named-text-section.tsx` — same pattern

### Pages
- Home `/` — ToolWidgetCards with search/filter intent handoff
- `/spells` — Compendium with FilterGroups, SpellCards
- `/monsters` — Compendium with FilterGroups, MonsterCards
- `/admin/spells/new`, `/admin/spells/[id]` — Admin editors
- `/admin/monsters/new`, `/admin/monsters/[id]` — Admin editors
