# Scout Context: Saved Spell Lists Feature

## Project Overview

- Next.js App Router project (Next 16, React 19)
- D&D reference tool for 2-5 players/DMs
- Dark-first aesthetic with semantic design tokens
- Route-driven architecture with URL as source of truth for filter state

## Current Architecture

### Routing

- `/` — Home with ToolWidgetCard widgets (spells, monsters)
- `/spells` — Spell compendium with filters, search, card grid
- `/monsters` — Monster compendium (same pattern)
- `/spells/:slug`, `/monsters/:slug` — Standalone entity pages
- `/embed/spells/:slug`, `/embed/monsters/:slug` — Embed views

### State Management

- **URL search params**: Canonical filter/search state
- **React Query**: Remote data fetching with aggressive caching (24h stale, 7d gc)
- **IndexedDB via idb-keyval**: Client-side spell/monster data cache, Zustand store persistence
- **localStorage**: Filter expansion states, persisted filter query params
- **Zustand (useCompendiumStore)**: UI state — selected entity IDs, search strings, sort config. Persisted to IndexedDB.

### Spell Data Flow

- `useSpells` hook → React Query → `/api/spells` → Firestore → cached in IndexedDB
- Filtering: `useSpellFilters` parses URL params, `filterSpells` applies criteria
- Filter UI: `FilterGroup` components with `FilterLogicPopover` for AND/OR/selection modes
- Spell cards: `SpellCard` component with inline admin edit capability

### Component Patterns

- Folder-based: `components/<name>/` with index.ts, types.ts, constants.ts, hooks/, components/
- Page-local: `page/<page-name>/` with same structure
- Shared: FilterGroup, FilterLogicPopover, ToolWidgetCard, CopyVisibleNamesAction, SpellCard

### Design System

- Semantic tokens in globals.css (--color-canvas, --color-surface-elevated, --color-border-\*, etc.)
- CSS utility classes: surface-card, input-field, filter-chip, admin-button, typography-\*
- Fonts: GeistSans (body), Spectral (headings)

## UX Principles (from docs/ux-principles.md)

1. Speed-to-answer above all else
2. Dark, atmospheric, modern
3. Progressive disclosure of complexity
4. Keyboard-first, touch-capable
5. URL as source of truth
6. Personal and configurable

### Explicit Future Mention

> "Spell lists: Players curate personal spell lists referencing the spells compendium."
> "Character tools: Spell slot tracking, prepared spell management. Builds on spell list infrastructure."

## Key Considerations for Spell Lists

- Client-only persistence is appropriate (2-5 users, personal tool)
- Must integrate with existing spell data (reference by ID)
- Should respect URL-as-truth principle for active list selection
- Must work on both mobile (phone at table) and desktop (session prep)
- Progressive disclosure: simple creation, power features on exploration
- Zustand + IndexedDB persistence pattern already established
- Consider how lists interact with existing filter/search on /spells page
