# LiteLLM i18n Phase 1: Vector Stores Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Vector Stores route area Chinese. Roughly 132 candidate literals across 14 production files, split into three tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: one new namespace `vectorStores`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

The increment covers `src/app/(dashboard)/vector-stores/**` plus `src/components/vector_store_management/VectorStoreSelector.tsx` (the route imports it; the sibling `types.tsx` is data). It renders the shared components (`DataTable`, `Alert`, `DeleteResourceModal`, `FormField`, `table_cells`), which the shared-components increment owns; do not translate a shared component here. `@/components/llm_calls/fetch_models` and `@/components/provider_info_helpers` are imported for behavior, not copy; if a string from one of them reaches this page's DOM, report it as a gap with the import path.

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English. **Model names, provider names, API route strings, request and response field names, and code samples are data: leave them English**
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy, and English output must be byte-identical for every value that was already English.** Never adjust an existing assertion to fit a change, and never derive a test expectation from the catalog when it should pin a literal
- **An absence assertion is only meaningful while the element under test is mounted.** For tooltip, popover, dialog or portal content it must sit inside the same open state as the positive assertion
- **The per-key coverage check must tie each key to its own assertion.** Searching for the text anywhere lets a duplicate value mask an unrendered key
- **In a language with a single plural category, non-`other` leaves are dead copy.** Chinese only has `other`, so `_one` is never resolved under `zh`
- **Do not store translated strings as data or grouping keys**; a runtime language switch would split groups and leave stale translations
- Raw wire values rendered as user copy must be aliased, with the aliased `en` equal to the raw value
- **Do not decide reachability from a TypeScript type.** Prove it against what produces the data
- Prove a skipped file is dead by grepping its importers
- If you change an existing test or a test double, say why and confirm the assertion did not weaken
- Behavioral coverage must be **discriminating**: assert the Chinese present and the English original absent wherever the values differ, individually rather than by a count or a substring regex. Do not add a key that cannot reach the DOM
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: The vector-store list, tables and info view

**Files:** `_components/index.tsx` (~10), `VectorStoreTable.tsx` (~2), `VectorStoreTableColumns.tsx` (~12), `vector_store_info.tsx` (~22), `DocumentsTable.tsx` (~2), `DocumentsTableColumns.tsx` (~10), `IndexesTab.tsx` (~3), `IndexesTable.tsx` (~2), `IndexesTableColumns.tsx` (~5), `src/components/vector_store_management/VectorStoreSelector.tsx` (~1)
**Produces:** the `vectorStores` namespace (Tasks 2 and 3 extend it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`vectorStores.table.*`, `vectorStores.info.*`, `vectorStores.documents.*`, `vectorStores.indexes.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("vectorStores")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: The create and edit forms

**Files:** `_components/VectorStoreForm.tsx` (~24), `CreateVectorStore.tsx` (~15), `S3VectorsConfig.tsx` (~9), plus the remaining form files
- [ ] Same shape, extending `vectorStores` under `vectorStores.form.*`, `vectorStores.s3.*`. Provider names, field names and API route strings stay English.

### Task 3: The test surfaces and the route page

**Files:** `_components/TestVectorStoreTab.tsx` (~6), `VectorStoreTester.tsx` (~10), `page.tsx`, plus every remaining file in the route
- [ ] Same shape, extending `vectorStores`. Sweep the whole `vector-stores/` tree afterwards and report any file deliberately skipped with importer evidence, plus the increment's final per-key coverage count.

---

## Later increments

Settings, MCP Servers, Prompts, Agents, Workflows, and the remaining Wave 2 route areas (Prompts, Search Tools, Projects, Guardrails Monitor, Caching, Access Groups, Tag Management, Router Settings, Transform Request).
