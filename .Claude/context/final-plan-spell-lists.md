# Final Implementation Plan: Saved Spell Lists

## Summary

Add client-only saved spell list management to the spell compendium. Users create/rename/delete named spell lists persisted via Zustand + IndexedDB. A bookmark toggle on each SpellCard adds/removes spells from the active list. When a list is active (`?list=<id>`), it acts as a scope pre-filter BEFORE the existing filter pipeline. Home page spell widget shows list chips.

## Key Architecture Decisions (from 4 reviews)

1. **DO NOT modify SpellFilters/parseSpellFilters/filterSpells** — list is a scope pre-filter at page level
2. **SpellListToggle owns its own store subscription** — no prop threading through SpellCard
3. **Domain type in lib/domain/saved-spell-list.ts** — not in store layer
4. **Named SavedSpellList** — avoids D&D "spell list" concept collision
5. **"Reset filters" does NOT clear active list** — list is context, not a filter
6. **Stale list IDs gracefully cleared** from URL
7. **44px touch targets, keyboard-accessible bookmark, popover focus management**

## Tasks

### Task 1: SavedSpellList Domain Type + Store [PARALLEL]

- lib/domain/saved-spell-list.ts (new)
- lib/store/useSavedSpellListStore.ts (new)
- tests/saved-spell-list-store.test.ts (new)

### Task 2: WidgetIntent Extension [PARALLEL]

- components/tool-widget-card/types.ts (modify)
- components/tool-widget-card/utils/navigation.ts (modify)

### Task 3: Spell Page Integration [SEQUENTIAL: after 1+2]

- page/spells/components/spell-list-selector/ (new)
- page/spells/components/spell-results-summary/ (modify)
- app/spells/page.tsx (modify)

### Task 4: SpellCard Bookmark Toggle [SEQUENTIAL: after 1]

- page/spells/components/spell-card/components/spell-list-toggle/ (new)
- page/spells/components/spell-card/spell-card.tsx (modify)

### Task 5: Home Widget List Chips [SEQUENTIAL: after 1+2]

- app/page.tsx (modify)

### Task 6: Filter Composition Tests [SEQUENTIAL: after 1]

- tests/spell-list-filter-composition.test.ts (new)

## Merge Order

1 → 2 → 4 → 6 → 3 → 5

## Validation

npm run build && npm run test && npm run lint
