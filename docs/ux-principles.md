# UX Principles & Interaction Models

## Audience

A small group (2-5 people) of D&D players and DMs who need a fast, reliable reference tool. Used equally for mid-session lookups (phone at the table) and session prep (laptop). This is a personal tool, not a public product.

---

## Core Principles

### 1. Speed-to-answer above all else

Every interaction minimizes the time between "I need to know X" and seeing the answer. This drives search prominence, keyboard shortcuts, data density, and loading strategy. A DM mid-combat should reach a stat block in under 3 seconds.

**Implications:**

- Command palette (Cmd+K) is the fastest path to any entity.
- Data is cached aggressively client-side so repeat visits are instant.
- Search is fuzzy and fast, not paginated.
- Mobile search is a single tap from any page.

### 2. Dark, atmospheric, modern

The visual language is a modern dark UI with warm accent tones. It feels like a high-quality instrument with atmosphere — not a themed novelty or a generic utility. Serif headings give character; sans-serif body text keeps everything readable.

**What this is:** Beautifully crafted tool with warmth.
**What this is not:** Fantasy-themed decoration or a generic Bootstrap app.

### 3. Progressive disclosure of complexity

Show the most useful controls first. Filters are organized by importance with the ability to hide rarely-used ones. Detail is always available but never forced. The interface should feel simple on first glance but powerful when explored.

**Implications:**

- Filters are user-configurable: reorderable, with a visible set and a hidden set.
- Advanced filter settings (AND/OR logic, match modes) are behind a settings affordance.
- The home page provides quick entry points without requiring knowledge of the filter system.

### 4. Keyboard-first, touch-capable

Cmd+K is the primary entry point for power users. Every common action has a keyboard path. But the interface must also work flawlessly on a phone held in one hand at a game table — touch targets are generous, scrolling is natural, and the layout adapts meaningfully.

**Implications:**

- Command palette is the centerpiece interaction on desktop.
- On mobile, search is a full-screen overlay triggered by a prominent search icon.
- Touch targets are minimum 44px.
- Filter interactions are optimized for both click and tap.

### 5. URL as the source of truth

Every meaningful state — active filters, search queries, selected entities — is encoded in the URL. If you can see it, you can link to it.

**Implications:**

- Filter state lives in URL search params.
- Standalone entity pages have clean, shareable slugs (/spells/fireball).
- Browser back/forward works predictably across all state transitions.
- Embed routes exist for iframe integration.

### 6. Personal and configurable

Users can reorder filters, hide the ones they don't use, and the tool remembers preferences. Configuration is per-user and persisted to localStorage.

---

## Visual Design Direction

| Attribute            | Direction                                                                    |
| -------------------- | ---------------------------------------------------------------------------- |
| **Mode**             | Dark-first (light mode as a secondary option later)                          |
| **Background**       | Near-black with subtle warm undertone (not pure #000)                        |
| **Surfaces**         | Layered dark grays with subtle elevation via opacity and border, not shadows |
| **Accent primary**   | Warm amber/gold for active states, selected filters, highlights              |
| **Accent secondary** | Deep teal for links, interactive elements, hover states                      |
| **Text primary**     | Off-white                                                                    |
| **Text secondary**   | Warm gray                                                                    |
| **Headings**         | Serif font for entity names and page titles                                  |
| **Body text**        | Clean sans-serif (Inter, Geist, or similar)                                  |
| **Borders**          | Subtle, semi-transparent white borders for card edges                        |
| **Motion**           | Restrained — quick transitions (140-220ms), no decorative animation          |
| **Cards**            | Slightly elevated dark surfaces with warm border accent on hover             |

---

## Interaction Models

### Navigation Structure

```
                    ┌─────────────────────────┐
                    │      Command Palette     │
                    │   (Cmd+K / tap search)   │
                    │  Entity search by name   │
                    └──────────┬──────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                   │
     ┌──────┴──────┐   ┌──────┴──────┐    ┌──────┴──────┐
     │   Home (/)   │   │  /spells    │    │  /monsters  │
     │  Tool cards  │   │  Compendium │    │  Compendium │
     │  Quick entry │   │  + filters  │    │  + filters  │
     └─────────────┘   └──────┬──────┘    └──────┬──────┘
                               │                   │
                       ┌──────┴──────┐    ┌──────┴──────────┐
                       │/spells/:slug│    │/monsters/:slug   │
                       │ Standalone  │    │  Standalone      │
                       │ entity page │    │  entity page     │
                       └──────┬──────┘    └──────┬──────────┘
                              │                   │
                       ┌──────┴──────┐    ┌──────┴──────────┐
                       │/embed/spells│    │/embed/monsters   │
                       │  /:slug     │    │   /:slug         │
                       │ Embed view  │    │  Embed view      │
                       └─────────────┘    └─────────────────┘
```

- **Home (/):** Entry point with interactive tool widget cards. Cards provide search input and filter chip previews, navigating to compendium pages with intent.
- **Compendium pages:** Workhorse views with card grids and filter controls. All filter state in URL params.
- **Standalone entity pages (/spells/:slug, /monsters/:slug):** Single entity in a clean, shareable layout with back link and copy/share actions.
- **Embed routes (/embed/spells/:slug, /embed/monsters/:slug):** Chrome-free entity card for iframe embedding in Notion or similar tools.

### Command Palette

```
┌───────────────────────────────────────┐
│ Search spells, monsters...            │
├───────────────────────────────────────┤
│ Spells                                │
│   Fireball               3rd Evoc.    │
│   Fire Bolt              Cantrip      │
│   Fire Shield            4th Evoc.    │
│                                       │
│ Monsters                              │
│   Fire Elemental         CR 5         │
│   Fire Giant             CR 9         │
├───────────────────────────────────────┤
│ ↑↓ Navigate  ⏎ Open  esc Close       │
└───────────────────────────────────────┘
```

- **Trigger:** Cmd+K on desktop. Prominent search icon in header on mobile.
- **Scope:** Searches across all loaded entity types simultaneously.
- **Results:** Grouped by type with key metadata inline.
- **Keyboard:** Arrow keys navigate, Enter opens standalone entity page, Escape dismisses.
- **Mobile:** Full-screen overlay with touch-friendly result rows.
- **Future:** New compendiums automatically appear in results under their type heading.

### Filter Model

```
┌──────────────────────────────────────────────────────┐
│ Search                                       [⌘K]   │
├──────────────────────────────────────────────────────┤
│ ▸ Level  ▸ School  ▸ Classes  ▸ Source    [+ More]   │
├──────────────────────────────────────────────────────┤
│ Active: Level 3 ×  School: Evocation ×               │
│ Showing 12 of 319 spells                             │
├──────────────────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────┐                       │
│ │ Spell Card │  │ Spell Card │                       │
│ └────────────┘  └────────────┘                       │
└──────────────────────────────────────────────────────┘
```

**Visible vs. hidden filters:**

- **Visible filters:** User's curated set shown in the filter bar. Default order by importance (Level, School, Classes for spells; Size, Type, CR for monsters).
- **Hidden filters ("+More" tray):** All remaining filters. Accessed via "+More" button.
- Users can reorder visible filters by dragging, and move filters between visible/hidden sets.
- Preferences persist to localStorage.

**Active filter pills:**

- Dismissible pills below the filter bar when filters are active.
- One-click removal of individual filters.
- "Clear all" action when multiple are active.

**Filter logic settings:**

- AND/OR across groups, single/multi-select per group, AND/OR within groups, text search scope — accessible via settings icon on filter bar (power-user control, not prominent).

### Responsive Behavior

**Desktop (>1024px):**

- Full filter bar with visible filter groups expanded.
- Two-column card grid.
- Command palette as centered modal overlay.

**Tablet (768-1024px):**

- Filter bar with horizontally scrollable filter chips.
- Single or two-column grid depending on orientation.
- Command palette as centered overlay.

**Phone (<768px):**

- Filters behind a "Filters" button opening a bottom sheet.
- Single-column card stack.
- Command palette as full-screen overlay.
- Touch targets minimum 44px.
- Prominent search icon in header.
- Sticky header with page title and search access.

---

## Entity Standalone Pages

Clean single-entity layout, centered, with back navigation and share/copy actions. Same card component used in compendium grids — no separate "detail" design to maintain. Embed route strips all chrome — just the card with minimal padding.

---

## Home Page

Retains its role as visual entry point with tool widget cards. Each card displays the tool name, entity count, a search input (navigates with focus intent), and filter chip previews (navigate with filter intent). Animated expansion into the destination page. New tools add new widget cards as they are built.

---

## Future Extensibility

- **More compendiums** (items, feats, classes, races): Same compendium page pattern; entities appear in command palette search grouped by type.
- **Spell lists:** Players curate personal spell lists referencing the spells compendium.
- **Character tools:** Spell slot tracking, prepared spell management. Builds on spell list infrastructure.
- **Embeddable cards:** Standalone and embed routes provide the foundation for Notion integration and link sharing.

---

## Decision Log

| Decision                              | Rationale                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Dark mode first                       | Matches atmospheric direction; reduces eye strain during long sessions      |
| Serif headings + sans body            | Entity names get character; UI text stays clean and scannable               |
| Command palette for search only       | Keep scope focused; navigation is simple enough without it                  |
| Full cards (not list+detail panel)    | Card format already works well; no second "detail" view to maintain         |
| User-configurable filter order        | Personal tool — optimize for each user's workflow, not a generic default    |
| Filters behind bottom sheet on mobile | Phone screen real estate too precious for persistent filter bars            |
| URL as source of truth for filters    | Enables sharing, deep-linking, back/forward; established pattern that works |
| Standalone entity pages with slugs    | Required for Notion embedding and link sharing use case                     |
| Embed routes as separate paths        | Keeps embedding logic isolated; no conditional chrome hiding in main pages  |
