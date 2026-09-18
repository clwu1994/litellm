# LiteLLM i18n Phase 1: shell (sidebar + login) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard shell visibly Chinese: the left navigation and the login surface, so switching the language changes far more than the two account-menu strings Phase 0 covered.

**Architecture:** Phase 0 already built the mechanism (`src/i18n/` config, resources, synchronous i18next init, `useLocale`, `LocaleProvider`, the global `Accept-Language` fetch wrapper, key-parity and glossary tests). Phase 1 adds no new machinery. Each task extracts one file area's hardcoded strings into a new namespace under `src/i18n/locales/{zh,en}/`, replaces the literals with `t()` calls, and keeps the two existing catalog tests green.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)
Phase 0 plan: `docs/superpowers/plans/2026-09-14-litellm-i18n-phase0-dashboard.md`

## Global Constraints

- The catalog tests are the contract and must stay green: `src/i18n/localeParity.test.ts` (zh and en define identical keys, no empty values) and `src/i18n/glossary.test.ts` (`i18n/glossary.json` terms stay English in Chinese strings)
- The jsdom suite is pinned to English in `tests/setupTests.ts`, so existing assertions on English copy keep working. Do not weaken that pin and do not rewrite English assertions into Chinese ones
- Keys are semantic, never the English text: `nav.keys`, `nav.section.accessControl`, not `nav."Virtual Keys"`
- Section headings that are uppercase in English (`ACCESS CONTROL`) stay uppercase in English and become the natural Chinese heading in Chinese; do not uppercase Chinese
- Chinese must read like something a Chinese-speaking engineer would write. Technical terms follow `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP`, and product or vendor names stay English
- No `any`; the repo sits exactly at its `local/no-large-inline-object-arg` ceiling of 551, so no new large inline object literal arguments
- Do not edit `eslint-budgets.json` or `eslint-suppressions.json`
- `npx prettier --check` and `npx eslint` must be clean on every changed file
- Conventional commits, no attribution trailers

---

### Task 1: Left navigation

**Files:**
- Create: `ui/litellm-dashboard/src/i18n/locales/zh/nav.json`
- Create: `ui/litellm-dashboard/src/i18n/locales/en/nav.json`
- Modify: `ui/litellm-dashboard/src/i18n/resources.ts` (register the namespace)
- Modify: `ui/litellm-dashboard/src/components/leftnav.tsx`
- Test: `ui/litellm-dashboard/src/components/leftnav.test.tsx` (create if absent; otherwise extend)

**Interfaces:**
- Consumes: `useTranslation` from `react-i18next`; the Phase 0 catalogs and tests
- Produces: the `nav` namespace, whose keys later tasks must not rename

- [ ] **Step 1: Inventory the strings**

List every user-facing literal in `leftnav.tsx`: navigation labels, section headings, `aria-label`s, `title`s, and the collapse/expand controls. Record them before editing. Ignore class names, keys, route paths, and `data-*` values.

- [ ] **Step 2: Write the two catalogs**

Create `nav.json` for both locales with identical key sets. Use semantic keys grouped by section, for example `nav.section.accessControl`, `nav.keys`, `nav.teams`, `nav.logs`, `nav.collapseSidebar`, `nav.expandSidebar`.

- [ ] **Step 3: Register the namespace**

Add `nav` to `resources.ts` for both locales. Do not change `defaultNS`; components that need it pass the namespace explicitly, `useTranslation("nav")`.

- [ ] **Step 4: Replace the literals**

In `leftnav.tsx`, call `const { t } = useTranslation("nav")` and replace each literal with `t(...)`. Do not reword, reorder, or restyle anything else in that file.

- [ ] **Step 5: Add a behavioral test**

Assert what a user perceives: with the locale set to `zh`, the rendered navigation contains the Chinese labels for at least three distinct entries and does not contain their English originals; with the locale back to `en`, the English labels return. Set the language explicitly in the test rather than relying on the suite pin.

- [ ] **Step 6: Run the gates**

- `npx vitest run --project component src/components/leftnav.test.tsx`
- `npx vitest run --project unit src/i18n/`
- `npx eslint` and `npx prettier --check` on every changed file
- Report the pass counts and any deviation

- [ ] **Step 7: Commit**

Conventional subject, for example `feat(ui): translate the sidebar navigation`.

---

### Task 2: Login surface

**Files:**
- Create: `ui/litellm-dashboard/src/i18n/locales/{zh,en}/auth.json`
- Modify: `ui/litellm-dashboard/src/i18n/resources.ts`
- Modify: the login page and its form component (locate the real form; `src/app/login/page.tsx` is only a five-line wrapper)
- Test: the login surface's existing test file, extended

**Interfaces:**
- Consumes: the `nav` namespace pattern from Task 1
- Produces: the `auth` namespace

- [ ] **Step 1: Locate the login form component**

`src/app/login/page.tsx` is a wrapper. Find the component that renders the visible login UI and inventory its strings: headings, field labels, placeholders, button text, and error messages it renders itself (not messages that come from the proxy).

- [ ] **Step 2 to 6**

Follow Task 1's shape: catalog both locales, register the namespace, replace literals with `t()` from `useTranslation("auth")`, add a behavioral test asserting Chinese under `zh` and English under `en`, then run the same gates.

- [ ] **Step 7: Commit**

---

## Later increments (not in this plan)

Per design section 9, each remaining route area gets its own increment and plan: Virtual Keys, Teams, Users, Organizations, Budgets, Logs, Usage, Cost Tracking, Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows. Coverage is measured as the share of user-observable strings that are in a catalog, not as a key count.
