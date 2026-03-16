# GPT Review - Spell Lists

## Verdict: NEEDS REVISION

### Major Issues

1. Missing behavior for invalid/not-yet-hydrated `?list=` params
2. Task 5 ignores ToolWidgetCard API constraints - can't produce `/spells?list=<id>` without shared API change
3. List filter must not participate in existing global OR/AND matching - must be explicit pre-filter
4. Test scope too narrow - only store CRUD, missing filter composition tests

### Minor Issues

5. Store semantics underspecified (trim names, idempotent add, safe no-op for missing IDs)
6. Persistence failure handling unspecified
7. Bookmark accessibility incomplete - "visible on hover" insufficient for keyboard users

### Key Recommendations

- Add explicit hydration/missing-list behavior
- Implement list as separate pre-filter, not inside SpellFilters
- Extend ToolWidgetCard API or render list chips separately
- Add cleanup behavior for deleting active list
- Expand test coverage
