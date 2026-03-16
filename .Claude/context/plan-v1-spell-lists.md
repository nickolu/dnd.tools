# Implementation Plan: Saved Spell Lists

## Feature Summary

Users can create, manage, and activate personal spell lists from within the `/spells` compendium page. An active list filters the spell grid to show only list members, composable with all existing filters/search. Lists are client-only, persisted via Zustand + IndexedDB.

## Architecture Decisions

1. **Storage**: New Zustand store (`useSpellListStore`) with IndexedDB persistence via the existing `idb-keyval` + `zustand/middleware/persist` pattern (mirrors `useCompendiumStore`).
2. **URL integration**: Active list encoded as `?list=<list-id>` query param. This is read by `useSpellFilters` and applied as a pre-filter before other criteria.
3. **No server-side storage**: Client-only for this personal tool (2-5 users). No API routes needed.
4. **Component ownership**: All spell-list UI lives under `page/spells/` (page-local) since there's no second consumer yet. Only the store goes in `lib/store/` (shared infrastructure pattern).

## Data Model

```typescript
type SpellList = {
  id: string; // nanoid or crypto.randomUUID()
  name: string; // user-provided, e.g. "Prepared Spells"
  spellIds: string[]; // references to Spell.id
  createdAt: number; // Date.now() timestamp
  updatedAt: number; // Date.now() timestamp
};

type SpellListStore = {
  lists: SpellList[];
  // Actions
  createList: (name: string) => SpellList;
  deleteList: (listId: string) => void;
  renameList: (listId: string, name: string) => void;
  addSpellToList: (listId: string, spellId: string) => void;
  removeSpellFromList: (listId: string, spellId: string) => void;
  toggleSpellInList: (listId: string, spellId: string) => void;
};
```

## Task Breakdown

### Task 1: Spell List Store [PARALLEL]

**Files:**

- `lib/store/useSpellListStore.ts` (new)
- `lib/store/spell-list-types.ts` (new)
- `tests/spell-list-store.test.ts` (new)

**Details:**

- Create `SpellList` type and `SpellListStore` type in `spell-list-types.ts`
- Create Zustand store with IndexedDB persistence following `useCompendiumStore` pattern exactly
- Use `crypto.randomUUID()` for list IDs (available in all modern browsers)
- Store actions: `createList`, `deleteList`, `renameList`, `addSpellToList`, `removeSpellFromList`, `toggleSpellInList`
- `partialize` the persisted state to exclude functions
- Write tests covering: create, delete, rename, add/remove/toggle spell, duplicate prevention

### Task 2: Integrate List Filter into Spell Filtering Pipeline [PARALLEL]

**Files:**

- `page/spells/constants.ts` (modify — add `SPELL_LIST_QUERY_PARAM`)
- `page/spells/hooks/useSpellFilters.ts` (modify — parse `list` param, pre-filter spells)
- `app/spells/page.tsx` (modify — add `list` to `SPELL_PERSISTED_QUERY_KEYS`)
- `tests/filter-spells.test.ts` (modify — add list filter test cases)

**Details:**

- Add `SPELL_LIST_QUERY_PARAM = "list"` to constants
- In `parseSpellFilters`, extract the `list` query param value (string | null)
- Add `listId: string | null` to `SpellFilters` type
- In `useSpellFilters`, accept an optional `activeListSpellIds: Set<string> | null` parameter or resolve it internally
- The list filter is applied as a pre-filter: if a list is active, only spells whose IDs are in the list pass through before other filters run
- Add `"list"` to `SPELL_PERSISTED_QUERY_KEYS` so the active list persists across sessions

### Task 3: Spell List Selector UI (Toolbar) [SEQUENTIAL: after Task 1 + 2]

**Files:**

- `page/spells/components/spell-list-selector/` (new folder)
  - `index.ts`
  - `spell-list-selector.tsx`
  - `types.ts`
- `page/spells/components/index.ts` (modify — add export)
- `app/spells/page.tsx` (modify — wire into toolbar)

**Details:**

- Dropdown/popover component placed in the toolbar row, between search input and FilterLogicPopover
- Shows: current list name (or "All spells" when no list active), dropdown chevron
- Popover contents:
  - "All spells" option (clears `list` param)
  - Divider
  - Each saved list with name and spell count
  - Divider
  - "New list" button with inline text input
- Clicking a list name sets `?list=<id>` in the URL
- "New list" flow: click button → inline input appears → type name → Enter to create → auto-selects the new list
- Rename: double-click or long-press on list name → inline edit
- Delete: small × icon per list, with brief confirmation ("Are you sure?" inline, not a modal)
- Uses semantic tokens: `surface-card` for popover panel, `filter-chip` styling for list items, `input-field` for inline input
- Keyboard: Escape closes popover, arrow keys navigate list items, Enter selects

### Task 4: Add-to-List Affordance on SpellCard [SEQUENTIAL: after Task 1 + 2]

**Files:**

- `page/spells/components/spell-card/spell-card.tsx` (modify)
- `page/spells/components/spell-card/types.ts` (modify)
- `page/spells/components/spell-card/components/spell-list-toggle/` (new folder)
  - `index.ts`
  - `spell-list-toggle.tsx`

**Details:**

- Small bookmark icon button in the SpellCard header, next to the existing admin edit button
- Only visible when a list is active (`activeListId` prop is non-null)
- States:
  - Spell is in list → filled bookmark icon, accent color
  - Spell is not in list → outline bookmark icon, muted color
- Click toggles the spell in/out of the active list (calls `toggleSpellInList` from store)
- On desktop: visible on card hover (opacity transition), always visible if spell is in list
- On mobile: always visible (no hover state available)
- Touch target: minimum 44px (per UX principles)
- Aria: `aria-label="Add [spell name] to [list name]"` / `"Remove [spell name] from [list name]"`

### Task 5: Home Widget Integration [SEQUENTIAL: after Task 1]

**Files:**

- `app/page.tsx` (modify)

**Details:**

- Below the existing `SPELL_WIDGET_FILTERS` filter chips, add a "My Lists" row showing saved list names as FilterChip-styled elements
- Only render if the user has at least one saved list (progressive disclosure)
- Each chip navigates to `/spells?list=<id>` using the same `navigateWithIntent` pattern
- Use a new intent target type or encode as a special filter intent: `{ target: "filter", filterId: "list:<list-id>" }`
- On the spells page, handle `intent=filter&filter=list:<id>` by setting the `list` query param

### Task 6: SpellResultsSummary Update [SEQUENTIAL: after Task 2]

**Files:**

- `page/spells/components/spell-results-summary/` (modify)
- `app/spells/page.tsx` (modify — pass list context)

**Details:**

- When a list is active, update the results summary to show context: e.g., "Showing 8 of 12 in Prepared Spells (319 total)"
- Accept `activeListName` and `activeListCount` optional props

## CSS/Token Additions

Add to `app/globals.css`:

```css
.spell-list-toggle {
  align-items: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  cursor: pointer;
  display: inline-flex;
  height: 2rem;
  justify-content: center;
  transition:
    color var(--motion-fast) ease,
    opacity var(--motion-fast) ease;
  width: 2rem;
}

.spell-list-toggle:hover {
  color: var(--color-accent);
}

.spell-list-toggle[data-active="true"] {
  color: var(--color-accent);
}
```

## Merge Order

1. Task 1 (store) and Task 2 (filter pipeline) can run in parallel
2. Tasks 3, 4, 5, 6 depend on 1+2 and can run in parallel with each other
3. Final integration pass: verify all pieces compose correctly

## Validation

- `npm run test` — all existing tests pass + new store tests pass
- `npm run build` — TypeScript compiles cleanly
- `npm run lint` — no lint errors
- Manual verification: create list, add spells, activate list, compose with filters, navigate away and back, browser back/forward

## Open Questions

None — all key UX decisions have been confirmed by the user:

- One active list at a time
- "All spells" default when no list selected
- Bookmark icon on SpellCard header
- No manual ordering (alphabetical)
- Home widget integration with list chips
