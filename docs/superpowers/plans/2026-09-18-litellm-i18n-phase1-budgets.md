# LiteLLM i18n Phase 1: Budgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Budgets area Chinese. One task.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-organizations.md` and `...-users.md`: one namespace `budgets`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

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
- Behavioral coverage must be **discriminating**: assert the Chinese is present and, where it differs, that the English original is absent. An assertion that passes in both locales is worthless, and a previous task had to be sent back for covering only 13 of 31 keys
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: Budgets area

**Files:** `_components/BudgetTable.tsx` (~20), `_components/BudgetTableColumns.tsx` (~14), `_components/edit_budget_modal.tsx` (~11), `_components/budget_modal.tsx` (~11), `_components/budget_panel.tsx` (~7), and the logic modules `_components/constants.ts`, `_components/budgetPrecision.ts`, `page.tsx`
**Produces:** the `budgets` namespace

- [ ] Inventory every user-facing literal: table columns, field labels, buttons, tooltips, `aria-label`s, `title`s, placeholders, empty states, confirmations, client-rendered validation, and any copy in `constants.ts`.
- [ ] Catalog both locales with identical key sets, grouped by concern (`budgets.table.*`, `budgets.form.*`, `budgets.empty.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("budgets")`. `constants.ts` and `budgetPrecision.ts` are data or logic modules: store keys and resolve at render, do not translate inside them.
- [ ] Behavioral coverage: **every** key that reaches the DOM must have a discriminating assertion under `zh`, not a sample. Set the language explicitly.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit.

---

## Later increments

Logs, Usage, Cost Tracking, Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows, plus the shared-components increment.
