# LiteLLM i18n Phase 1: Policies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Policies route area Chinese. Roughly 265 candidate literals across 17 production files, split into three tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: one new namespace `policies`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

The increment covers `src/app/(dashboard)/policies/**`. The route imports only types from `src/components/policies/*` (`PolicySelector.tsx` is not rendered by this route) and renders the shared components (`DataTable`, `Alert`, `MultiSelect`, `SearchSelect`, `DeleteResourceModal`, `FormField`, `table_cells`), which the shared-components increment owns. Do not translate a shared component here; if one still renders English after the shared-components increment, report it as a gap.

`guardrail_selection_modal.tsx` already reads `guardrails`; its remaining English is in scope and extends `policies` where the copy is policy-specific.

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

### Task 1: The policy list, tables and info view

**Files:** `_components/index.tsx` (~27), `PolicyTable.tsx` (~2), `PolicyTableColumns.tsx` (~12), `policy_info.tsx` (~21), `policy_templates.tsx` (~9), `AttachmentTable.tsx` (~2), `AttachmentTableColumns.tsx` (~13)
**Produces:** the `policies` namespace (Tasks 2 and 3 extend it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`policies.table.*`, `policies.templates.*`, `policies.info.*`, `policies.attachments.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("policies")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: The policy and attachment forms

**Files:** `_components/add_policy_form.tsx` (~26), `add_attachment_form.tsx` (~20), `build_attachment_data.ts`, `scope_validation.ts`, `template_parameter_modal.tsx` (~12), `TokenSelect.tsx` (~2), plus the remaining form files
- [ ] Same shape, extending `policies` under `policies.form.*`, `policies.attachmentForm.*`, `policies.validation.*`. `scope_validation.ts` and `build_attachment_data.ts` are logic modules: return keys or take a `t`; a validation message that reaches the DOM gets a key plus values contract.

### Task 3: AI suggestion, impact preview, pipeline builder and the test panel

**Files:** `_components/pipeline_flow_builder.tsx` (~49), `ai_suggestion_modal.tsx` (~30), `policy_test_panel.tsx` (~21), `guardrail_selection_modal.tsx` (~8 remaining), `impact_popover.tsx` (~7), `impact_preview_alert.tsx` (~4), `page.tsx`, plus every remaining file in the route
- [ ] Same shape, extending `policies`. Sweep the whole `policies/` tree afterwards and report any file deliberately skipped with importer evidence, plus the increment's final per-key coverage count.

---

## Later increments

Settings, MCP Servers, Prompts, Agents, Workflows, and the remaining Wave 2 route areas (Vector Stores, Prompts, Search Tools, Projects, Guardrails Monitor, Caching, Access Groups, Tag Management, Router Settings, Transform Request).
