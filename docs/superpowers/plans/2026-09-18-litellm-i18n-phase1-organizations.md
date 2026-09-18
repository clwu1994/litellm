# LiteLLM i18n Phase 1: Organizations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Organizations area Chinese. Small enough to be one task.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-users.md` and `...-teams.md`: one namespace `organizations`, both locales, semantic keys, `t()` at render sites, helpers take a `t`.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy.** A Teams task smuggled `precision="date"` onto a date cell and it reached review; do not repeat that. If a non-copy change seems needed, report it instead of making it
- Prove a skipped file is dead by grepping its importers
- If you change an existing test, say why and confirm the assertion did not weaken
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: Organizations area

**Files:** `src/app/(dashboard)/organizations/OrganizationFilters.tsx`, `_components/OrganizationsTableColumns.tsx`, `_components/OrganizationsTable.tsx`, `_components/OrganizationsPanel.tsx`, `page.tsx`
**Produces:** the `organizations` namespace

- [ ] Inventory every user-facing literal: table columns, filter labels, buttons, tooltips, `aria-label`s, `title`s, placeholders, empty states, confirmations, client-rendered validation.
- [ ] Catalog both locales with identical key sets, grouped by concern (`organizations.table.*`, `organizations.filters.*`, `organizations.empty.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("organizations")`; change nothing else.
- [ ] Behavioral coverage: under `zh` at least three distinct Chinese labels render and not their English originals; under `en` the English returns. Set the language explicitly.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit.

---

## Later increments

Budgets, Logs, Usage, Cost Tracking, Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows, plus the shared `DataTableToolbar` and `ModelSelect`.
