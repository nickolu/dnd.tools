# GPT Review — Dark Theme

## Verdict: NEEDS REVISION

### Issues Found
1. **CRITICAL** — Task 1's font token plan has a self-referential CSS variable: `--font-heading: var(--font-heading), ...` will invalidate. Also assumes `--font-geist-sans` exists without defining it.
2. **MAJOR** — Task 3 is too narrow. Only changes `.site-nav-link[data-active]` but doesn't audit all accent/focus-ring usages across semantic classes.
3. **MAJOR** — No explicit contrast/accessibility validation step. Proposed dark tokens risky for muted text, placeholders. Removing card shadows with faint borders is a visibility concern.
4. **MAJOR** — `color-scheme: dark` changes native form controls (inputs, selects, textareas). No QA step for this.
5. **MINOR** — Missing final validation/testing step (typecheck/lint/build).

### Suggestions
- Use distinct font-source variables (`--font-spectral`, `--font-geist-sans`), then map semantic tokens from those.
- Expand Task 3 into explicit audit of every semantic class using `--color-accent` or `--color-focus-ring`.
- Add contrast pass for text levels against dark surfaces.
- Add QA for native form controls after color-scheme change.
- Add hardening step: build, lint, keyboard focus review, visual QA.
