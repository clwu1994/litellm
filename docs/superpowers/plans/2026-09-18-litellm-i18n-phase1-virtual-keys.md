# LiteLLM i18n Phase 1: Virtual Keys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Virtual Keys area Chinese: the keys table, its columns, and the dashboard wrapper.

**Architecture:** No new machinery. Phase 1 Tasks 1 to 3 established the pattern: extract literals into a namespace under `src/i18n/locales/{zh,en}/`, register it in `resources.ts`, extend the `CustomTypeOptions` augmentation, replace literals with `t()`, and keep the two catalog contract tests green.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Shell plan for the established pattern: `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-shell.md`
Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

- `src/i18n/localeParity.test.ts` (identical keys, no empty values) and `src/i18n/glossary.test.ts` stay green
- The jsdom suite is pinned to English in `tests/setupTests.ts`; do not weaken that pin and do not rewrite English assertions into Chinese
- Keys are semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag; it cannot hold children and the text silently leaves the element
- Never resolve translations with the global i18n singleton inside non-rendering helpers; take a `t` or let the component subscribe
- In tests, call `cleanup()` before restoring the language in `afterEach`
- No `any`; no new large inline object literal arguments (the repo sits exactly at its `local/no-large-inline-object-arg` ceiling of 551)
- Do not edit `eslint-budgets.json`, `eslint-suppressions.json`, or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean on every changed file
- Conventional commits, no attribution trailers

---

### Task 1: Virtual Keys area

**Files:**
- Create: `ui/litellm-dashboard/src/i18n/locales/zh/keys.json`, `.../en/keys.json`
- Modify: `ui/litellm-dashboard/src/i18n/resources.ts`, `.../src/i18n/i18next.d.ts`
- Modify: `ui/litellm-dashboard/src/components/VirtualKeysPage/VirtualKeysTable.tsx`
- Modify: `ui/litellm-dashboard/src/components/VirtualKeysPage/keyTableColumns.tsx`
- Modify: `ui/litellm-dashboard/src/app/(dashboard)/api-keys/ApiKeysDashboard.tsx`
- Test: the existing tests for those files, extended

**Interfaces:**
- Consumes: the established Phase 1 pattern
- Produces: the `keys` namespace

- [ ] **Step 1: Inventory** every user-facing literal in the three files: table headers, filter labels, button copy, placeholders, `aria-label`s, `title`s, empty states, tooltips, and client-rendered validation or confirmation copy. Ignore class names, route paths, React keys, and `data-*` values.
- [ ] **Step 2: Catalog** both locales with identical key sets, semantic keys grouped by concern (`keys.table.header`, `keys.actions.create`, `keys.empty.none`). Keep `Virtual Key` and `API Key` English in the Chinese values.
- [ ] **Step 3: Register** the namespace in `resources.ts` and add `keys: typeof zhKeys` to the augmentation.
- [ ] **Step 4: Replace** each literal with `t(...)` from `useTranslation("keys")`. Change nothing else: no reordering, no restyling, no reworded English.
- [ ] **Step 5: Cover** behaviorally: under `zh` the table renders at least three distinct Chinese labels and not their English originals; under `en` the English returns. Set the language explicitly.
- [ ] **Step 6: Gates** — run the area's component tests, `npx vitest run --project unit src/i18n/`, `npx eslint`, `npx prettier --check` on every changed file. Report counts.
- [ ] **Step 7: Commit** with a conventional subject.

---

## Later increments

Teams, Users, Organizations, Budgets, Logs, Usage, Cost Tracking, Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows. Each gets its own plan. Coverage is the share of user-observable strings in a catalog, not a key count.
