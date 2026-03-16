# Implementation Plan: Dark Theme + Typography Visual Identity

## Feature Request
Transform the app from its current light parchment theme to a dark, atmospheric, modern visual identity as described in docs/ux-principles.md. This includes:
1. Dark-first color scheme with warm undertones
2. Sans-serif body text (Geist Sans) + serif headings (Spectral)
3. Accent role swap: amber/gold for active states, teal for interactive/focus
4. Card styling adjustments: elevation via border/opacity not shadows

## Decision Record
- **Body font:** Geist Sans (via `geist` npm package)
- **Heading font:** Spectral (via `next/font/google`)
- **Accent primary:** Warm amber/gold (#d4a041) for active states, selections, highlights
- **Accent secondary:** Deep teal (#2d8a7e) for links, interactive elements, focus rings
- **Active nav indicator:** Uses amber/gold (consistent with "active state" semantic)
- **Scope:** All pages including admin

---

## Task 1: Typography — Install fonts and configure next/font
**Type:** Code change
**Files:** `package.json`, `app/layout.tsx`, `app/globals.css`

### Steps:
1. Install `geist` npm package (provides GeistSans and GeistMono as next/font compatible)
2. In `app/layout.tsx`:
   - Import `GeistSans` from `geist/font/sans`
   - Import `Spectral` from `next/font/google`
   - Configure Spectral with weights [400, 600, 700], subsets ['latin'], variable: '--font-heading'
   - Apply CSS variable classes to `<html>`: `className={`${GeistSans.variable} ${spectral.variable}`}`
3. In `app/globals.css` `:root`:
   - Add `--font-body: var(--font-geist-sans), system-ui, sans-serif;`
   - Add `--font-heading: var(--font-heading), "Iowan Old Style", "Palatino Linotype", Georgia, serif;`
   - Note: GeistSans from the `geist` package uses the CSS variable `--font-geist-sans` automatically
4. In `app/globals.css` body rule:
   - Change `font-family` to `var(--font-body)`
5. In `app/globals.css` heading classes:
   - Add `font-family: var(--font-heading);` to `.typography-h1`, `.typography-h2`, `.typography-h3`
   - Add `font-family: var(--font-heading);` to `.site-title`

---

## Task 2: Dark Color Palette — Swap all token values
**Type:** Code change  
**Files:** `app/globals.css`

### Steps:
1. Change `color-scheme: light` to `color-scheme: dark`
2. Replace `:root` color token values:

| Token | Old Value | New Value |
|---|---|---|
| `--color-canvas` | `#f6f3ea` | `#0f0d0b` |
| `--color-surface` | `#fffdfa` | `#1a1714` |
| `--color-surface-elevated` | `#ffffff` | `#221f1b` |
| `--color-border-subtle` | `#d7d0c1` | `rgba(255, 255, 255, 0.08)` |
| `--color-border-strong` | `#7f6f55` | `rgba(255, 255, 255, 0.18)` |
| `--color-text-primary` | `#1f1a14` | `#e8e2d9` |
| `--color-text-secondary` | `#5a4b36` | `#9a8e7f` |
| `--color-text-muted` | `#7b6a50` | `#6b6058` |
| `--color-accent` | `#1f6f66` | `#d4a041` |
| `--color-accent-contrast` | `#f7fffd` | `#1a1714` |
| `--color-focus-ring` | `#ba5c12` | `#2d8a7e` |

3. Rework body background gradient for dark theme:
```css
body {
  background:
    radial-gradient(circle at 15% 10%, rgba(212, 160, 65, 0.04) 0%, rgba(212, 160, 65, 0) 40%),
    radial-gradient(circle at 80% 15%, rgba(45, 138, 126, 0.06) 0%, rgba(45, 138, 126, 0) 45%),
    var(--color-canvas);
}
```

4. Fix hardcoded RGB values in box-shadows and focus rings:
   - `.surface-card` box-shadow uses `rgb(31 26 20 / 4%)` — will be removed (see Task 4)
   - `.input-field:focus-visible` box-shadow uses `rgb(186 92 18 / 24%)` — change to `rgba(45, 138, 126, 0.24)` (teal-based, matching new focus-ring)
   - `.admin-textarea:focus-visible` same fix

---

## Task 3: Accent Role Swap — Update semantic class accent references
**Type:** Code change
**Files:** `app/globals.css`

### Steps:
The token values themselves handle most of the swap (--color-accent is now amber, --color-focus-ring is now teal). But we need to update one semantic class where the role mapping should change:

1. `.site-nav-link[data-active="true"]` — change `border-color: var(--color-focus-ring)` to `border-color: var(--color-accent)` (active nav uses amber, not teal)

All other references are already correct after the value swap:
- `.filter-chip[data-active]` uses `--color-accent` (now amber) ✓
- `.input-field:focus-visible` uses `--color-focus-ring` (now teal) ✓
- `.filter-logic-trigger[data-open]` uses `--color-focus-ring` (now teal) ✓
- `.admin-button` uses `--color-accent` (now amber) ✓
- `.admin-button-secondary[data-active]` uses `--color-accent` (now amber) ✓

---

## Task 4: Surface/Card Adjustments
**Type:** Code change
**Files:** `app/globals.css`

### Steps:
1. Remove `box-shadow` from `.surface-card` (spec says elevation via opacity and border, not shadows)
2. Add `.surface-card` transition for border-color: `transition: border-color var(--motion-fast) ease;`
3. Add `.surface-card:hover` with warm border accent:
```css
.surface-card:hover {
  border-color: var(--color-border-strong);
}
```

---

## Task 5: Fix Hardcoded Colors
**Type:** Trivial fix
**Files:** `components/filter-group/filter-group.tsx`

### Steps:
1. Replace `border-[#eee]` with `border-border-subtle` (Tailwind class using the token)

---

## Execution Strategy

Tasks 1-4 all modify `app/globals.css` and are closely interdependent. Task 1 also modifies `app/layout.tsx` and `package.json`. Task 5 is independent.

**Recommended approach:**
- **[PARALLEL GROUP A]:** Task 5 (fix hardcode in filter-group.tsx) — independent, trivial
- **[PARALLEL GROUP A]:** Tasks 1+2+3+4 combined as a single execution unit — they all center on globals.css and layout.tsx, with heavy overlap

This is effectively **2 parallel tasks**: one trivial (hardcode fix) and one substantial (theme overhaul in globals.css + layout.tsx).

## Validation
- `npm run build` — ensure no build errors
- `npm run lint` — ensure no lint errors  
- Visual inspection of all pages (Home, Spells, Monsters, Admin)
- Verify focus ring contrast against dark backgrounds
- Verify text contrast ratios
