# LiteLLM i18n Phase 1: Wave 2 configuration surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make six remaining Wave 2 route areas Chinese: Search Tools, Projects, Guardrails Monitor, Caching, Access Groups and Tag Management. Roughly 429 candidate literals across 45 production files, one task per area, each producing its own namespace.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: one namespace per area, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

Each task owns exactly one route directory and its own namespace. Tasks are independent and touch disjoint files; execute them one at a time, never two implementers in parallel. Every task renders the shared components, which the shared-components increment owns; do not translate a shared component here, and report any shared English that still reaches the page.

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

### Task 1: Search Tools (`searchTools`)

**Files:** `src/app/(dashboard)/search-tools/_components/SearchTools.tsx` (~18), `SearchToolTester.tsx` (~11), `SearchToolTableColumns.tsx` (~10), `CreateSearchTools.tsx` (~10), `SearchConnectionTest.tsx` (~9), `SearchToolView.tsx` (~7), `SearchToolTable.tsx` (~2), plus the route page

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern. Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("searchTools")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: Projects (`projects`)

**Files:** `src/app/(dashboard)/projects/_components/ProjectModals/ProjectBaseForm.tsx` (~28), `ProjectDetailsPage.tsx` (~20), `ProjectsTableColumns.tsx` (~6), `ProjectsPage.tsx` (~4), `ProjectKeysTableColumns.tsx` (~4), `ProjectKeysSection.tsx` (~3), `ProjectModals/projectFormSchema.ts` (~2), `ProjectModals/EditProjectModal.tsx` (~2), `ProjectModals/CreateProjectModal.tsx` (~2), `ProjectKeysTable.tsx` (~2)
- [ ] Same shape as Task 1 with namespace `projects`. `projectFormSchema.ts` is a validation module: return keys or take a `t`, and a message that reaches the DOM gets a key-plus-values contract.

### Task 3: Guardrails Monitor (`guardrailsMonitor`)

**Files:** `src/app/(dashboard)/guardrails-monitor/_components/GuardrailConfig.tsx` (~26), `GuardrailsOverview.tsx` (~18), `GuardrailUsageBreakdown.tsx` (~11), `GuardrailDetail.tsx` (~9), `EvaluationSettingsModal.tsx` (~7), `ScoreChart.tsx` (~2)
- [ ] Same shape with namespace `guardrailsMonitor`. This route is distinct from the already-translated `guardrails` area; do not reuse or rename its keys, and do not edit `guardrails` files.

### Task 4: Caching (`caching`)

**Files:** `src/app/(dashboard)/caching/_components/cache_settings/cacheSettingsFields.ts` (~23), `cache_dashboard.tsx` (~18), `cache_health.tsx` (~16), `cache_settings/index.tsx` (~11), `coordination_redis_settings/coordinationRedisFields.ts` (~10), `coordination_redis_settings/index.tsx` (~7), `coordination_redis_settings/coordinationRedisUtils.ts` (~4), `cache_settings/CacheFormField.tsx` (~3), `ErrorDrilldown.tsx` (~2), `cache_settings/RedisTypeSelector.tsx` (~1), `coordination_redis_settings/CoordinationRedisTypeSelector.tsx` (~1)
- [ ] Same shape with namespace `caching`. `cacheSettingsFields.ts`, `coordinationRedisFields.ts` and `coordinationRedisUtils.ts` are field-data modules: store keys and resolve at render; field names and Redis option values stay raw.

### Task 5: Access Groups (`accessGroups`)

**Files:** `src/app/(dashboard)/access-groups/_components/AccessGroupsDetailsPage.tsx` (~18), `access-group-create/AccessGroupCreateDialog.tsx` (~17), `AccessGroupsModal/AccessGroupBaseForm.tsx` (~13), `AccessGroupsTableColumns.tsx` (~10), `AccessGroupsPage.tsx` (~8), `AccessGroupsModal/AccessGroupEditModal.tsx` (~3)
- [ ] Same shape with namespace `accessGroups`.

### Task 6: Tag Management (`tagManagement`)

**Files:** `src/app/(dashboard)/tag-management/_components/tag_info.tsx` (~26), `tagTableColumns.tsx` (~9), `index.tsx` (~7), `components/CreateTagModal.tsx` (~7), `TagTable.tsx` (~2)
- [ ] Same shape with namespace `tagManagement`. This route renders `budget_duration_dropdown` from the shared-components increment; if its labels are still English, report it as a shared gap rather than translating it here.

---

## Later increments

Router Settings, Transform Request, UI Theme, API Reference, old-usage, Memory, Workflows, Admin Panel, Skills, Agents, MCP Servers, Settings, the `components (root)` tree, `components/permissions`, `components/templates`, and the `/chat` route's own components.
