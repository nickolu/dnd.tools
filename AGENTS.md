# AGENTS.md

This file defines project-level guidance for agents working in this repository.

## Purpose

Build and evolve `dnd.tools` with a modular, route-driven UI focused first on spells and monsters, while keeping architecture extensible for future tools.

## Core Product Priorities

1. Preserve route-based UX and browser navigation semantics.
2. Keep UI state transitions seamless between home widgets and tool pages.
3. Favor modular code organization with explicit boundaries over ad hoc abstractions.
4. Optimize for maintainability and predictable extension to new tool domains.

## UI Architecture Rules

1. Theme and styling:
   - Use semantic design tokens only in React components.
   - Do not reference primitive tokens directly in component files.
   - Keep semantic token definitions centralized and reusable.
   - Use semantic typography classes in JSX (`typography-h1`, `typography-h2`, `typography-h3`, `typography-body`, `typography-body-sm`, `typography-kicker`) instead of raw size/weight utilities.
2. Components:
   - Use `shadcn` to generate component scaffolding; do not import remote shadcn component packages.
   - Wrap or adapt generated components to consume project semantic tokens.
   - Promote reusable interaction patterns to shared components once a second consumer is expected (example: shared `FilterGroup` for spells and monsters).
3. Navigation and transitions:
   - Home page includes global navigation plus tool widgets (spells, monsters).
   - Each widget behaves as a full-width interactive card with title, search input, and filter controls.
   - Clicking a widget expands into the corresponding page transition (Framer Motion).
   - If the search input initiated the action, keep input focus in the destination page.
   - If a filter button initiated the action, preserve/activate that filter in the destination page.
   - Route transitions must preserve browser back/forward behavior.
4. Filtering behavior on tool pages:
   - Default (no criteria): show all entities.
   - Any active criteria: show only matching entities.

## Repository Organization Rules

1. Shared components live under `/components` and always use folder-based component structure:
   - `index.ts` (public export)
   - `constants.ts`
   - `types.ts`
   - `hooks/`
   - `utils/`
   - `components/` (child components with same pattern)
2. Page-specific implementation is colocated under `/page/<page-name>`:
   - `constants.ts`
   - `types.ts`
   - `components/` (same folder pattern)
3. Prefer colocating logic with a page first; only lift code to shared folders when reused by multiple pages.
4. Prefer duplication over premature abstraction when a pattern is not yet stable.
5. Place filtering/sorting/query-state logic in dedicated hooks or helpers, not inline in rendering components.

## State and Data Flow Guidance

1. Use route URL/search params as canonical state for shareable page filters.
2. Keep transient interaction state (for animation handoff/focus intent) explicit and minimal.
3. Separate concerns:
   - Data fetching and caching in query hooks.
   - Filter transformation in pure helpers.
   - UI interaction state in page/widget hooks.

## Implementation Standards

1. TypeScript-first with explicit types for public APIs of components/hooks/helpers.
2. Keep components focused and small; extract child components when rendering logic grows.
3. Add tests for non-trivial filtering and routing handoff behavior.
4. Avoid broad refactors unrelated to the current vertical slice.

## Delivery Expectations

1. Build in vertical slices:
   - Theme/tokens foundation
   - Shared shell/navigation
   - Home widgets and transition handoff
   - Tool pages and filtering
   - Hardening/tests/accessibility
2. At each slice:
   - Ensure lint/typecheck/tests pass.
   - Verify keyboard accessibility and back-button behavior.
   - Document assumptions and follow-up tasks in `docs/`.

## UI Learnings (Current Implementation)

1. Filter button groups with many options should prefer horizontal scrolling rows (`overflow-x-auto`) to avoid excessive vertical growth.
2. High-density groups (for example `duration` and `classes` in spells) can intentionally take full row width while other groups share rows in wrapping flex layouts.
3. URL query params remain the source of truth for filter state, while UI layout optimizations should not change filter semantics.
