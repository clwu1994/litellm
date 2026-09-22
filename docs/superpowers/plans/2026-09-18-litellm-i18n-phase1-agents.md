# LiteLLM i18n Phase 1: Agents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Agents route area Chinese. Roughly 157 candidate literals across 12 production files, split into two tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: one new namespace `agents`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

The increment covers `src/app/(dashboard)/agents/**`. The route embeds `src/components/mcp_server_management/MCPServerSelector` and `MCPToolPermissions`, `src/components/guardrails/GuardrailSelector`, and `src/components/templates/key_info_view`; those belong to the MCP Servers, Guardrails and `components/templates` increments. **Sequence this increment after MCP Servers** so those selectors are already translated; if any still renders English here, report it as a gap with the import path rather than translating it in this plan. Agent names, model names, tool names, MCP server names and code samples are data.

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

### Task 1: The agent list, table and info view

**Files:** `_components/agent_info.tsx` (~42), `AgentsTableColumns.tsx` (~11), `AgentsPanel.tsx` (~5), `AgentsTable.tsx` (~4), `agent_virtual_keys.tsx` (~3), `agent_cost_view.tsx` (~1), `page.tsx`, plus the list files
**Produces:** the `agents` namespace (Task 2 extends it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`agents.table.*`, `agents.info.*`, `agents.keys.*`, `agents.cost.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("agents")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: The agent forms and discovery

**Files:** `_components/add_agent_form.tsx` (~35), `agent_config.ts` (~29), `agent_card_discovery.tsx` (~14), `agent_form_fields.tsx` (~9), `dynamic_agent_form_fields.tsx` (~3), `AgentFormKit.tsx` (~1), `cost_config_fields.tsx`, `agent_type_utils.ts`, `agent_discovery_utils.ts`, plus every remaining file in the route
- [ ] Same shape, extending `agents` under `agents.form.*`, `agents.discovery.*`, `agents.costConfig.*`. `agent_config.ts`, `agent_type_utils.ts` and `agent_discovery_utils.ts` are data or logic modules: store keys and resolve at render, or return keys or take a `t`. Sweep the whole `agents/` tree afterwards and report any file deliberately skipped with importer evidence, plus the increment's final per-key coverage count.

---

## Later increments

Settings, Workflows, the `components (root)` tree, `components/permissions`, `components/templates`, and the remaining small route areas (Router Settings, Transform Request, UI Theme, API Reference, old-usage, Memory, Admin Panel, Skills).
