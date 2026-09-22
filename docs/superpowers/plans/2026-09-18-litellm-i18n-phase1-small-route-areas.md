# LiteLLM i18n Phase 1: Small route areas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make nine small remaining route areas Chinese, one task per area, each with its own namespace: Router Settings, Transform Request, UI Theme, API Reference, old-usage, Memory, Workflows, Admin Panel and Skills. Roughly 187 candidate literals across 21 production files.

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

### Task 1: Router Settings (`routerSettings`)

**Files:** `src/app/(dashboard)/router-settings/**` (~17), plus the route page

### Task 2: Transform Request (`transformRequest`)

**Files:** `src/app/(dashboard)/transform-request/**` (~11), plus the route page

### Task 3: UI Theme (`uiTheme`)

**Files:** `src/app/(dashboard)/ui-theme/**` (~8), plus the route page

### Task 4: API Reference (`apiReference`)

**Files:** `src/app/(dashboard)/api-reference/**` (~6), plus the route page. API paths, method names and code samples stay English.

### Task 5: old-usage (`oldUsage`)

**Files:** `src/app/(dashboard)/old-usage/_components/usage.tsx` (~30), plus the route page. Check whether this route is still reachable before translating it; if it is dead, prove it by grepping its importers and report that instead of adding keys.

### Task 6: Memory (`memory`)

**Files:** `src/app/(dashboard)/memory/_components/MemoryTableColumns.tsx` (~10), `MemoryView.tsx` (~8), `MemoryEditModal.tsx` (~5), `MemoryDetailDrawer.tsx` (~5), `MemoryTable.tsx` (~1). `MemoryTable.tsx` passes an English `searchPlaceholder` to the shared `DataTableToolbar`; that caller is in scope here and becomes translated.

### Task 7: Workflows (`workflows`)

**Files:** `src/app/(dashboard)/workflows/WorkflowRuns.tsx` (~27), plus the route page. This file passes English `searchPlaceholder` and filter labels to the shared DataTable components; those callers are in scope here and become translated.

### Task 8: Admin Panel (`adminPanel`)

**Files:** `src/app/(dashboard)/admin-panel/_components/AdminPanel.tsx` (~25), plus the route page

### Task 9: Skills (`skills`)

**Files:** `src/app/(dashboard)/skills/_components/add_plugin_form.tsx` (~14), `PluginTableColumns.tsx` (~10), `ClaudeCodePluginsPanel.tsx` (~6), `PluginTable.tsx` (~2), plus the route page

---

Each task follows the same steps:

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern. Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("<namespace>")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.
- [ ] Sweep the area at the end and report any file deliberately skipped with importer evidence, plus the increment's per-key coverage count.

---

## Later increments

Settings, the `components (root)` tree, `components/permissions`, `components/templates`, `components/organizations`, `components/team`, `components/view_logs`, `components/EntityUsageExport`, `components/CloudZeroCostTracking`, `components/PassThroughSettings`, `components/routing_groups`, `components/router_settings`, `components/email_events`, and the `/chat` route's own components.
