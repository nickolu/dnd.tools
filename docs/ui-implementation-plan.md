# UI Implementation Plan (Spells + Monsters First)

## Scope

Implement a modular, extensible UI foundation for `dnd.tools` with:

1. Theme-controlled design system via semantic tokens.
2. Generated `shadcn` UI components integrated into local codebase.
3. Home page widgets for spells and monsters with seamless animated expansion.
4. Route-based tool pages with filter-aware default/all-items behavior.
5. Structure that scales cleanly to future tools.

## Key Decisions

1. Use App Router page routes for spells/monsters pages, not SPA-only conditional rendering.
2. Use URL search params as canonical filter state to preserve deep links and browser history.
3. Use Framer Motion shared-layout or transition handoff model for widget-to-page continuity.
4. Keep widget intent (input-focus/filter-activation) in navigation payload/query params to rehydrate destination state.

## Target Information Architecture

1. Global:
   - `app/layout.tsx`: app shell + providers
   - shared navigation component under `/components`
2. Home:
   - `app/page.tsx` renders tool widgets (spells + monsters)
3. Tool pages:
   - `app/spells/page.tsx`
   - `app/monsters/page.tsx`
4. Page-local modules under `/page/<page-name>` to keep behavior colocated.

## File/Folder Plan

1. Shared (`/components`)
   - `components/global-nav/index.ts`
   - `components/tool-widget-card/index.ts`
   - `components/tool-widget-card/constants.ts`
   - `components/tool-widget-card/types.ts`
   - `components/tool-widget-card/hooks/useWidgetIntent.ts`
   - `components/tool-widget-card/utils/navigation.ts`
2. Spells page modules (`/page/spells`)
   - `page/spells/constants.ts`
   - `page/spells/types.ts`
   - `page/spells/hooks/useSpellFilters.ts`
   - `page/spells/utils/filterSpells.ts`
   - `page/spells/components/...`
3. Monsters page modules (`/page/monsters`)
   - `page/monsters/constants.ts`
   - `page/monsters/types.ts`
   - `page/monsters/hooks/useMonsterFilters.ts`
   - `page/monsters/utils/filterMonsters.ts`
   - `page/monsters/components/...`
4. Theme/tokens
   - semantic token definitions in global styles and/or typed token map module.
5. `shadcn` generated local components
   - `components/ui/*` (generated files committed to repo; adapted to semantic tokens).

## Execution Phases

### Phase 1: Design System Foundation

1. Establish semantic token contract (colors, surface, text, border, focus, spacing, radius, motion).
2. Map tokens in CSS variables and ensure components consume semantic names only.
3. Validate no direct primitive token usage in React components.

Deliverable:

- Working tokenized baseline styles in `app/globals.css` (or equivalent) and usage conventions documented.

### Phase 2: UI Component Baseline

1. Initialize `shadcn` in repo and generate required primitives:
   - button, input, card, badge/chip, separator, skeleton (as needed)
2. Normalize generated components to use semantic tokens and project class conventions.
3. Add shared `GlobalNav` component.

Deliverable:

- Reusable local UI primitives and global nav rendered in app shell.

### Phase 3: Home Widgets (Spells + Monsters)

1. Build `ToolWidgetCard` shared component:
   - full-width rounded card
   - title
   - search input
   - filter buttons
2. Implement intent-aware interactions:
   - card click -> navigate and expand transition
   - input-origin activation -> propagate focus intent
   - filter-origin activation (mouse/keyboard) -> propagate selected filter
3. Integrate Framer Motion for expansion animation from widget to route destination.

Deliverable:

- Home page with two interactive widgets, each transitioning to its page while preserving intent.

### Phase 4: Tool Pages + Filtering Behavior

1. Create route pages:
   - `app/spells/page.tsx`
   - `app/monsters/page.tsx`
2. Implement page-local hooks/helpers:
   - parse URL params
   - derive active criteria
   - apply filters
3. Enforce expected behavior:
   - no active criteria -> show all items
   - active criteria -> show only matches
4. Ensure destination page restores:
   - input focus (when requested)
   - filter selection (when requested)

Deliverable:

- Fully functional spells/monsters pages with deterministic filtering and restored interaction context.

### Phase 5: Hardening and QA

1. Add tests:
   - filter helper unit tests
   - hook tests for query param parsing
   - minimal interaction tests for intent propagation
2. Accessibility pass:
   - keyboard activation parity on filters/widgets
   - focus visibility and management
3. Verify routing:
   - browser back/forward works across widget->page transitions
   - URL remains source of truth for filters

Deliverable:

- Stable, accessible UI slice ready for extension.

## Implementation Notes

1. Framer Motion route transitions in App Router may require shared layout IDs and careful client component boundaries.
2. Keep animation wrappers isolated so tool content stays mostly server-compatible where practical.
3. If transition state cannot safely live in ephemeral memory, encode handoff intent in URL params.

## Extension Strategy for Future Tools

1. Add new tool config entry (route/title/filter schema) rather than cloning page internals blindly.
2. Reuse shared widget shell and navigation patterns.
3. Keep domain-specific filter logic local to each page module.
4. Promote logic to shared only after at least two concrete consumers.

## Definition of Done for Initial UI Milestone

1. Semantic-token-driven UI is enforced in components.
2. `shadcn` components are generated and committed locally.
3. Home contains spells + monsters widgets with animated expansion.
4. Destination pages honor filter defaults and criteria filtering rules.
5. Input/filter intent survives transition and is visible on destination.
6. Back button returns users to prior UI state predictably.
7. Lint/typecheck/tests pass for touched areas.
