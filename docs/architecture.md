# DnD.Tools Architecture Specification

## Scope

Domain:

- Monsters
- Spells (D&D 5e 2014)

This document defines the implementation architecture and canonical data model.

## System Architecture

- Frontend: Next.js (App Router)
- API Layer: Next.js route handlers (`/app/api/...`) as the exclusive client access path
- Database: Firebase Firestore
- Server-state: TanStack React Query
- App-state: Zustand with persistence

Flow:

1. UI components use React Query hooks.
2. Hooks call internal API endpoints.
3. API handlers validate payloads and perform Firestore reads/writes.
4. React Query handles remote cache lifecycle.
5. Zustand stores UI state and persisted local preferences.

## Canonical Data Model

### Monster

Required fields:

- `id: string` (stable slug)
- `name: string`
- `nameNormalized: string` (lowercase search/sort key)
- `size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan"`
- `type: string`
- `alignment: string`
- `armorClass: string`
- `hitPoints: string`
- `speed: string`
- `abilityScores: { str: number; dex: number; con: number; int: number; wis: number; cha: number }`
- `challengeRating: string` (display form, e.g. `"1/4"`)
- `crNumeric: number` (query/sort form, e.g. `0.25`)
- `source: string`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `schemaVersion: number`

Optional fields:

- `savingThrows?: Record<string, number>`
- `skills?: Record<string, number>`
- `senses?: string`
- `passivePerception?: number`
- `languages?: string[]`
- `damageImmunities?: string[]`
- `damageResistances?: string[]`
- `conditionImmunities?: string[]`
- `spellList?: string[]`
- `spellSlots?: number[]`
- `specialAbilities?: Array<{ name: string; text: string }>`
- `actions?: Array<{ name: string; text: string; attack?: string[] }>`
- `reactions?: Array<{ name: string; text: string }>`
- `legendaryActions?: Array<{ name: string; text: string }>`
- `searchTokens?: string[]`

### Spell

Required fields:

- `id: string` (stable slug)
- `name: string`
- `nameNormalized: string` (lowercase search/sort key)
- `level: number` (0..9)
- `school: "abjuration" | "conjuration" | "divination" | "enchantment" | "evocation" | "illusion" | "necromancy" | "transmutation"`
- `castingTime: string`
- `range: string`
- `components: { verbal: boolean; somatic: boolean; material: boolean; materialText?: string }`
- `duration: string`
- `concentration: boolean`
- `ritual: boolean`
- `description: string[]`
- `classes: string[]`
- `source: string`
- `createdAt: Timestamp`
- `updatedAt: Timestamp`
- `schemaVersion: number`

Optional fields:

- `higherLevel?: string[]`
- `gpCost?: number` (integer gold-piece value)
- `tags?: string[]`
- `damage?: { type: string; diceBySlot?: Record<string, string>; cantripScaling?: Record<string, string> }`
- `save?: { ability: "str" | "dex" | "con" | "int" | "wis" | "cha"; onSuccess?: string }`
- `attackType?: "melee" | "ranged"`
- `searchTokens?: string[]`
- `publisher?: string`

## Firestore Data Layout

Collections:

- `monsters/{monsterId}`
- `spells/{spellId}`
- `meta/collections`

Governance fields on content documents:

- `createdBy: string`
- `updatedBy: string`
- `isPublished: boolean`

`meta/collections` document fields:

- `monstersVersion: number`
- `spellsVersion: number`
- `updatedAt: Timestamp`

## API Contract

Endpoints:

- `GET /api/monsters`
- `GET /api/monsters/:id`
- `POST /api/monsters`
- `PUT /api/monsters/:id`
- `GET /api/spells`
- `GET /api/spells/:id`
- `POST /api/spells`
- `PUT /api/spells/:id`
- `GET /api/meta/version`

API requirements:

- Runtime validation for every request body and response shape
- Normalized error envelope with explicit codes
- Authenticated, role-based authorization for write endpoints

## Indexing Strategy

Monsters:

- Single-field: `nameNormalized`, `crNumeric`, `type`, `source`
- Composite: `source + crNumeric`, `type + crNumeric`

Spells:

- Single-field: `nameNormalized`, `level`, `school`, `gpCost`, `source`
- Array index: `classes`
- Composite: `level + school`, `classes + level`

## Caching and State

TanStack React Query:

- Source of truth for remote collections
- Full collection fetch at app load for monsters and spells
- Defaults:
  - `staleTime: 24h`
  - `gcTime: 7d`
  - `refetchOnWindowFocus: false`

Zustand:

- Persisted UI state (filters, sorting, selected entities)
- Persisted storage backend: IndexedDB

Cache invalidation:

- Client reads `GET /api/meta/version` at startup
- Full collection refetch only when corresponding version changed
- `POST/PUT` endpoints bump relevant collection version

## Security

- Read access: public
- Write access: admin/editor role only
- Enforcement at both layers:
  - API authorization checks
  - Firestore security rules

## Operational Requirements

- Seed/import scripts for monsters and spells with idempotent upsert by `id`
- Schema migrations keyed by `schemaVersion`
- API logging for write operations
- Error tracking for query/mutation failures
- Automated tests:
  - API contract tests
  - Firestore rules tests

## Repository Structure

- `app/api/monsters/route.ts`
- `app/api/monsters/[id]/route.ts`
- `app/api/spells/route.ts`
- `app/api/spells/[id]/route.ts`
- `app/api/meta/version/route.ts`
- `lib/domain/monster.schema.ts`
- `lib/domain/spell.schema.ts`
- `lib/api/client.ts`
- `lib/store/useCompendiumStore.ts`
- `lib/query/keys.ts`
- `lib/query/hooks/useMonsters.ts`
- `lib/query/hooks/useSpells.ts`
