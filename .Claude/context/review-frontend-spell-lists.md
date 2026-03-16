# Frontend Review - Spell Lists

## Verdict: APPROVE WITH CHANGES

### Major Issues

1. .spell-list-toggle touch target undersized (32px vs 44px required)
2. Popover focus management underspecified (focus on open, return on close, aria-haspopup)
3. Bookmark toggle visibility via opacity alone breaks keyboard access

### Minor Issues

4. filter-chip touch targets undersized for new mobile surfaces
5. SpellCard re-render risk from bookmark toggles (300+ cards)
6. Inline onSpellUpdated callback (pre-existing, fix while file is open)
7. Home widget needs new WidgetIntent target, not string hack
8. Delete confirmation needs keyboard path
9. Popover z-index should match existing (20)

### Key Recommendations

- SpellListToggle owns its own store subscription (per-card selector)
- Don't clear active list on "Reset filters"
- Rename flow: visible affordance, not just double-click
- Add scale transform for bookmark tactile feedback
- SpellResultsSummary props remain optional for backward compat
