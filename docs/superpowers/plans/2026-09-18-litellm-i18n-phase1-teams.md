# LiteLLM i18n Phase 1: Teams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the Teams area Chinese. It is the largest route area so far, so it is split into three tasks by surface rather than done in one pass.

**Architecture:** No new machinery. Follow the worked example in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-virtual-keys.md` (Virtual Keys, reviewed clean first time): one namespace `teams`, both locales, semantic keys, `t()` at render sites, helpers take a `t`.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

Identical to the Virtual Keys plan. Restated because each task must satisfy them:

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton inside non-rendering helpers; take a `t` or let the component subscribe
- `cleanup()` before restoring the language in `afterEach`
- Prove a skipped file is dead by grepping its importers; `navbar.tsx` looked legacy and was live
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean on every changed file; conventional commits, no attribution trailers

---

### Task 1: Team detail view

**Files:** `src/components/team/TeamInfo.tsx` (~118 literals), `src/components/Teams.tsx`, `src/app/(dashboard)/teams/page.tsx`
**Produces:** the `teams` namespace (later tasks extend it, never rename it)

- [ ] Inventory every user-facing literal: field labels, section headings, buttons, tabs, tooltips, `aria-label`s, `title`s, empty states, confirmations, and client-rendered validation copy.
- [ ] Catalog both locales with identical key sets, grouped by concern (`teams.info.field.*`, `teams.tabs.*`, `teams.actions.*`, `teams.empty.*`).
- [ ] Register `teams` in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("teams")`; change nothing else.
- [ ] Behavioral coverage: under `zh` at least three distinct Chinese labels render and not their English originals; under `en` the English returns. Set the language explicitly.
- [ ] Gates: the touched files' tests, `npx vitest run --project unit src/i18n/`, eslint, prettier. Commit.

### Task 2: Members and permissions

**Files:** `src/components/team/TeamMemberTab.tsx`, `MyUserTab.tsx`, `EditMembership.tsx`, `member_permissions.tsx`, `permission_definitions.tsx`, `useMyTeamMember.ts`
- [ ] Same shape as Task 1, extending `teams`. The permission labels in `permission_definitions.tsx` and `member_permissions.tsx` are data, so store keys there and resolve at render rather than translating inside the data module.

### Task 3: Team settings and tables

**Files:** `src/components/team/LoggingSettings.tsx`, `GuardrailsSelect.tsx`, `TeamVirtualKeysTable.tsx`, `AvailableTeamsTable.tsx`, `AvailableTeamsTableColumns.tsx`, `AvailableTeamsPanel.tsx`, `tabVisibilityUtils.ts`, `teamModelAccess.ts`
- [ ] Same shape, extending `teams`. `tabVisibilityUtils.ts` and `teamModelAccess.ts` are data or logic modules: store keys and resolve at render.

---

## Later increments

Users, Organizations, Budgets, Logs, Usage, Cost Tracking, Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows.
