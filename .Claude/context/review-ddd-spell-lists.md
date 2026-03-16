# DDD Review - Spell Lists

## Verdict: APPROVE WITH CHANGES

### Major Issues

1. Domain types in wrong layer - SpellList should be in lib/domain/, not lib/store/
2. listId in SpellFilters conflates compendium query with personal list membership

### Minor Issues

3. Naming collision with Monster.spellList - use SavedSpellList or UserSpellList
4. spellIds is implementation detail - consider spells or entries
5. Aggregate invariants in store, not domain - add pure domain helpers
6. Home widget uses string-encoded compound key - add first-class intent target
7. No SpellListId branded type for future safety

### Key Recommendations

- Create lib/domain/spell-list.ts for domain type
- Keep SpellFilters pure, pass list membership separately
- Name type to avoid D&D "spell list" concept collision
- Add pure domain helpers for invariant-bearing mutations
