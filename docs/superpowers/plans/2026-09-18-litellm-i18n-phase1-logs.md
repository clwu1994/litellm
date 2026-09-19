# LiteLLM i18n Phase 1: Logs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Logs area Chinese. It is the largest area so far (roughly 399 literals across 40+ files), so it is split into four tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-budgets.md` and `...-organizations.md`: one namespace `logs`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English. Log payload keys, JSON field names, and model names are data, not copy: leave them English
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy.** A Teams task smuggled `precision="date"` onto a date cell and it reached review; do not repeat that. If a non-copy change seems needed, report it instead of making it
- Prove a skipped file is dead by grepping its importers
- If you change an existing test, say why and confirm the assertion did not weaken
- Behavioral coverage must be **discriminating**: assert the Chinese is present and the English original absent wherever the values differ. An assertion that passes in both locales is worthless. A previous task was sent back for covering only 13 of 31 keys, and a later one shipped five English strings behind a green suite
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: Request logs surface

**Files:** `src/components/view_logs/RequestLogsTable.tsx`, `RequestLogsTableColumns.tsx`, `RequestLogsFilters.tsx`, `RequestLogsPanel.tsx`, `LogsTableToolbar.tsx`, `log_filter_logic.tsx`, `columns.tsx`, `constants.ts`, `logs_utils.tsx`, `TypeBadges.tsx`, `index.tsx`, and `src/app/(dashboard)/logs/page.tsx`
**Produces:** the `logs` namespace (Tasks 2 to 4 extend it; never rename a key)

- [ ] Inventory every user-facing literal. `log_filter_logic.tsx`, `constants.ts`, `columns.tsx` and `logs_utils.tsx` are data or logic modules: store keys there and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`logs.request.table.*`, `logs.request.filters.*`, `logs.empty.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("logs")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit.

### Task 2: Audit logs

**Files:** `AuditLogsTable.tsx`, `AuditLogsTableColumns.tsx`, `AuditLogsPanel.tsx`, `AuditLogDrawer/AuditLogDrawer.tsx`
- [ ] Same shape, extending `logs`. Audit log action names and field names are data: leave them English, translate only the surrounding chrome.

### Task 3: Log detail drawer

**Files:** `LogDetailsDrawer/LogDetailContent.tsx`, `RoutingDecisionCard.tsx`, `RealtimePrettyView.tsx`, `DrawerHeader.tsx`, `SectionHeader.tsx`, `SidebarToggle.tsx`, `InputCard.tsx`, `OutputCard.tsx`, `JsonViewer.tsx`, `TruncatedValue.tsx`, `ClassifierAuditView.tsx`, `LogDetailsDrawer.tsx`, `constants.ts`, `prettyMessagesUtils.ts`, plus the live drawer chrome the original inventory missed: `CollapsibleMessage.tsx`, `HistoryTree.tsx`, `SimpleToolCallBlock.tsx`, `TokenFlow.tsx`, `ClassifyTag.tsx`, and `LogDetailsDrawer/utils.ts` (Task 3 was executed with these six included, since leaving them English would have left the drawer half-Chinese)
- [ ] Same shape, extending `logs`. `prettyMessagesUtils.ts` and `constants.ts` are data or logic modules: store keys and resolve at render.

### Task 4: Guardrail, eval, tools and vector-store viewers

**Files:** `GuardrailViewer/BedrockGuardrailDetails.tsx`, `GuardrailViewer.tsx`, `CompliancePanel.tsx`, `ContentFilterDetails.tsx`, `PresidioDetectedEntities.tsx`, `EvalViewer/EvalViewer.tsx`, `ToolsSection/*`, `VectorStoreViewer.tsx`, `CostBreakdownViewer.tsx`, `ConfigInfoMessage.tsx`, `batchLogUtils.ts`, `logDetailRouting.ts`, `view_logs/utils.ts` (not `LogDetailsDrawer/utils.ts`, which Task 3 already translated, nor `ToolsSection/utils.ts`, which this task covers separately)
- [ ] Same shape, extending `logs`. Guardrail names, entity types and tool names are data: leave them English.

---

## Later increments

Usage, Cost Tracking, Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows, plus the shared-components increment.
