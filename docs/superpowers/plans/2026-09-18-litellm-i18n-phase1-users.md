# LiteLLM i18n Phase 1: Users Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Users area Chinese. Split into two tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-virtual-keys.md` and `...-teams.md`: one namespace `users`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper; take a `t`, and add it to memo deps
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy.** A Teams task smuggled in `precision="date"` on a date cell and it reached review; do not repeat that. If you believe a non-copy change is needed, say so in your report instead of making it
- Prove a skipped file is dead by grepping its importers
- If you change an existing test, say why and confirm the assertion did not weaken
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean; conventional commits, no attribution trailers

---

### Task 1: Users list and detail

**Files:** `src/app/(dashboard)/users/_components/view_users.tsx`, `view_users/UsersTable.tsx`, `view_users/UsersTableColumns.tsx`, `view_users/user_info_view.tsx`, `user_edit_view.tsx`, `index.tsx`, `page.tsx`
**Produces:** the `users` namespace (Task 2 extends it; never rename a key)

- [ ] Inventory every user-facing literal: headings, table columns, filter labels, buttons, tooltips, `aria-label`s, `title`s, empty states, confirmations, client-rendered validation.
- [ ] Catalog both locales, identical key sets, grouped by concern (`users.table.*`, `users.info.*`, `users.actions.*`, `users.empty.*`).
- [ ] Register `users` in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("users")`; change nothing else.
- [ ] Behavioral coverage: under `zh` at least three distinct Chinese labels render and not their English originals; under `en` the English returns. Set the language explicitly.
- [ ] Gates: the touched files' tests, `npx vitest run --project unit src/i18n/`, eslint, prettier. Commit.

### Task 2: Bulk edit and default user settings

**Files:** `src/app/(dashboard)/users/_components/BulkEditUsers.tsx`, `default-user-settings/DefaultUserSettingsForm.tsx`, `default-user-settings/schema.ts`, `default-user-settings/mapper.ts`
- [ ] Same shape, extending `users`. `schema.ts` and `mapper.ts` are logic modules: store keys there and resolve at render, as Teams did for permission descriptions. A zod message must not be built by calling the i18n singleton; make the schema a factory that takes `t`, the way Teams Task 1 did.

---

## Later increments

Organizations, Budgets, Logs, Usage, Cost Tracking, Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows.
