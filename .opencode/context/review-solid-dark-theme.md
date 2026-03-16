# SOLID Review — Dark Theme

## Verdict: APPROVE WITH CHANGES

### Issues Found
1. **MAJOR (OCP)** — Mutating `:root` directly with no extension point for future light mode. Should establish `[data-theme="light"]` override block structure now.
2. **MAJOR (SRP)** — Implicit layout.tsx ↔ globals.css font variable contract needs documentation.
3. **MINOR (SRP)** — Hardcoded RGB values in box-shadows should become shadow tokens (`--shadow-focus-ring`, etc.) for theme-switchability.
4. **MINOR (OCP)** — Consider `--color-active-indicator` semantic alias for nav active state distinct from `--color-accent`.
5. **MINOR (ISP)** — Hardcoded color audit incomplete — globals.css RGB values addressed vaguely.

### Recommendations
- Preserve light-mode values in commented `[data-theme="light"]` block.
- Introduce shadow tokens to eliminate hardcoded rgb() values.
- Add font contract comment in globals.css.
- Consider `--color-active-indicator` token (low priority, TODO comment sufficient).
