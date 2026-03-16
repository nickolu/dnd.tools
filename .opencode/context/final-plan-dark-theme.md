# Final Implementation Plan: Dark Theme + Typography Visual Identity

## Summary
Transform dnd.tools from its light parchment theme to a dark, atmospheric visual identity. This involves: replacing all 11 color tokens with dark-first values (warm undertones), swapping the body font to Geist Sans (sans-serif) while keeping Spectral for headings (serif), swapping accent roles (amber/gold for active states, teal for focus/interactive), adjusting card styling to use border/opacity instead of shadows, and fixing pre-existing bugs (broken hover classes, hardcoded colors).

## Changes from Original Plan
- **Font variable cycle fixed**: Original plan had `--font-heading: var(--font-heading)` self-reference. Now uses `--font-spectral` as the next/font CSS variable name, mapped to `--font-heading` in `:root`.
- **Spectral display swap added**: Added `display: 'swap'` to Spectral config to prevent FOIT on slow connections.
- **Muted text contrast fixed**: `--color-text-muted` changed from `#6b6058` (~2.8:1) to `#8a7e72` (~4.6:1) to pass WCAG AA.
- **Focus ring glow token added**: Hardcoded `rgb(186 92 18 / 24%)` replaced with `--color-focus-ring-glow` token.
- **Pre-existing `hover:text-primary` bug fixed**: 3 component files fixed to use `hover:text-text-primary`.
- **Filter-group border fix improved**: Uses `border border-[color:var(--color-border-subtle)]` pattern, fixes invalid `border-1` to `border`.
- **Rejected overengineering**: No `[data-theme="light"]` infrastructure, no `--color-active-indicator` alias, no `color-mix()` gradients, no `[data-interactive]` scoping for card hover.

## Execution Tasks

### Task 1: Dark Theme Core — Fonts, Tokens, Semantic Classes [PARALLEL]
- **Complexity**: medium
- **Files**: `package.json`, `app/layout.tsx`, `app/globals.css`

#### 1a. Install Geist Sans font
Run `npm install geist`.

#### 1b. Configure fonts in `app/layout.tsx`
Add imports:
```typescript
import { GeistSans } from "geist/font/sans";
import { Spectral } from "next/font/google";
```

Configure Spectral:
```typescript
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-spectral",
  display: "swap",
});
```

Update `<html>`:
```tsx
<html lang="en" className={`${GeistSans.variable} ${spectral.variable}`}>
```

Add comment above font configs:
```typescript
/**
 * Font variable contract:
 * - GeistSans injects --font-geist-sans on <html>
 * - Spectral injects --font-spectral on <html>
 * - globals.css maps these to --font-body and --font-heading semantic tokens
 */
```

#### 1c. Update `:root` tokens in `app/globals.css`
Replace entire `:root` block:
```css
:root {
  color-scheme: dark;
  --color-canvas: #0f0d0b;
  --color-surface: #1a1714;
  --color-surface-elevated: #221f1b;
  --color-border-subtle: rgba(255, 255, 255, 0.08);
  --color-border-strong: rgba(255, 255, 255, 0.18);
  --color-text-primary: #e8e2d9;
  --color-text-secondary: #9a8e7f;
  --color-text-muted: #8a7e72;
  --color-accent: #d4a041;
  --color-accent-contrast: #1a1714;
  --color-focus-ring: #2d8a7e;
  --color-focus-ring-glow: rgba(45, 138, 126, 0.24);
  --font-body: var(--font-geist-sans), system-ui, sans-serif;
  --font-heading: var(--font-spectral), "Iowan Old Style", "Palatino Linotype", Georgia, serif;
  --radius-sm: 0.5rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.25rem;
  --space-page-x: clamp(1rem, 3vw, 2rem);
  --space-page-y: clamp(1.5rem, 4vw, 2.5rem);
  --motion-fast: 140ms;
  --motion-base: 220ms;
}
```

Add `--color-focus-ring-glow` to `@theme inline`:
```css
@theme inline {
  --color-canvas: var(--color-canvas);
  --color-surface: var(--color-surface);
  --color-surface-elevated: var(--color-surface-elevated);
  --color-border-subtle: var(--color-border-subtle);
  --color-border-strong: var(--color-border-strong);
  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-muted: var(--color-text-muted);
  --color-accent: var(--color-accent);
  --color-accent-contrast: var(--color-accent-contrast);
  --color-focus-ring: var(--color-focus-ring);
  --color-focus-ring-glow: var(--color-focus-ring-glow);
}
```

#### 1d. Update body styles
Replace body rule:
```css
body {
  background:
    radial-gradient(circle at 15% 10%, rgba(212, 160, 65, 0.04) 0%, rgba(212, 160, 65, 0) 40%),
    radial-gradient(circle at 80% 15%, rgba(45, 138, 126, 0.06) 0%, rgba(45, 138, 126, 0) 45%),
    var(--color-canvas);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  min-height: 100vh;
  text-rendering: optimizeLegibility;
}
```

#### 1e. Add font-family to heading classes
Add `font-family: var(--font-heading);` to: `.typography-h1`, `.typography-h2`, `.typography-h3`, `.site-title`

#### 1f. Update `.surface-card`
```css
.surface-card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  transition: border-color var(--motion-fast) ease;
}
```
(box-shadow removed, transition added)

#### 1g. Fix focus ring shadows
`.input-field:focus-visible`:
```css
.input-field:focus-visible {
  border-color: var(--color-focus-ring);
  box-shadow: 0 0 0 3px var(--color-focus-ring-glow);
  outline: none;
}
```

`.admin-textarea:focus-visible`:
```css
.admin-textarea:focus-visible {
  border-color: var(--color-focus-ring);
  box-shadow: 0 0 0 3px var(--color-focus-ring-glow);
  outline: none;
}
```

#### 1h. Accent role swap for nav active state
`.site-nav-link[data-active="true"]` — change `border-color: var(--color-focus-ring)` to `border-color: var(--color-accent)`

---

### Task 2: Fix Hardcoded Colors and Broken Hover Classes [PARALLEL]
- **Complexity**: trivial
- **Files**:
  - `components/filter-group/filter-group.tsx`
  - `page/spells/components/spell-card/spell-card.tsx`
  - `page/monsters/components/monster-card/monster-card.tsx`
  - `page/monsters/components/monster-card/components/named-text-section/named-text-section.tsx`

#### 2a. Fix filter-group.tsx border
Line 57: Change `border-1 border-[#eee]` to `border border-[color:var(--color-border-subtle)]`

#### 2b. Fix hover:text-primary in 3 files
- `spell-card.tsx` line 526: `hover:text-primary` → `hover:text-text-primary`
- `monster-card.tsx` line 702: `hover:text-primary` → `hover:text-text-primary`
- `named-text-section.tsx` line 33: `hover:text-primary` → `hover:text-text-primary`

---

## Merge Order
1. Tasks 1 and 2 run in parallel on separate worktrees.
2. Merge Task 2 first (smaller, lower risk).
3. Merge Task 1 second (main theme change).
4. No ordering dependency — they touch completely different files.

## Validation
After merge, run:
- `npm run build`
- `npm run lint` (if available)
- `npm run test` (if available)

## PR Template
**Title:** feat: dark atmospheric theme with dual-font typography

**Body:**
Transforms the visual identity from light parchment to a dark, atmospheric design with warm undertones.

### What changed
- **Color palette** — All 11 design tokens updated to dark-first values
- **Typography** — Body: Geist Sans (sans-serif). Headings: Spectral (serif). Loaded via next/font.
- **Card styling** — Removed box-shadows, elevation via border opacity
- **Bug fixes**: Fixed hover:text-primary (3 files), hardcoded border color (filter-group), hardcoded focus ring RGB values
