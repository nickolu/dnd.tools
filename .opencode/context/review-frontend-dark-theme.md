# Frontend Review — Dark Theme

## Verdict: APPROVE WITH CHANGES

### Critical Issues
1. **`--font-heading` CSS variable self-reference cycle** — next/font injects `--font-heading` on `<html>`, then `:root` overrides it with `var(--font-heading)`. Fix: use `--font-spectral` as the source variable, map to `--font-heading` in `:root`.
2. **`--color-text-muted` (#6b6058) fails WCAG AA** — ~2.8:1 contrast on dark surfaces. Needs to be lighter, suggest `#8a7e72` (~4.6:1).

### Major Issues
3. **`hover:text-primary` is broken** in named-text-section.tsx, spell-card.tsx, monster-card.tsx — should be `hover:text-text-primary` per Tailwind theme bridge.
4. **Task 5 border fix** — `border-border-subtle` may not work with rgba values in @theme inline. Use `border-[color:var(--color-border-subtle)]` pattern. Also `border-1` → `border`.
5. **Spectral needs `display: 'swap'`** — default `'optional'` can cause headings to never swap on slow connections.

### Minor Issues
6. Focus ring glow shadows still hardcoded — suggest `--color-focus-ring-glow` token.
7. Body gradient hardcodes RGB — suggest `color-mix()` for token-driven gradients.
8. `.surface-card:hover` applies to non-interactive cards — scope to `[role="button"]` or `[data-interactive]`.

### Key Recommendations
- R1: Use `--font-spectral` as next/font variable, map to `--font-heading` in :root
- R2: Lighten `--color-text-muted` to `#8a7e72` for WCAG AA
- R3: Fix `hover:text-primary` → `hover:text-text-primary` (3 files)
- R4: Fix filter-group border to `border border-[color:var(--color-border-subtle)]`
- R5: Add `display: 'swap'` to Spectral config
- R6: Add `--color-focus-ring-glow` token
- R7: Scope card hover to interactive cards only
- R8: Use `color-mix()` for body gradient (token-driven)
