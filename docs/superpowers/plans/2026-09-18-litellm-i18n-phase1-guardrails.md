# LiteLLM i18n Phase 1: Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Guardrails area Chinese. It is the largest area so far (39 files, 700+ candidate literals), so it is split into four tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-cost-tracking.md` and `...-logs.md`: one namespace `guardrails`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`. `Guardrail` and `Guardrails` are product terms: keep them English in Chinese strings, matching the already-translated `logs.guardrail.*` keys
- **Provider names, vendor names, model names, guardrail type identifiers, endpoint identifiers, entity types and payload keys are data: leave them English.** The garden data file is mostly provider metadata; triage it deliberately rather than translating everything
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy.** A Teams task smuggled `precision="date"` onto a date cell and it reached review; do not repeat that. If a non-copy change seems needed, report it instead of making it
- **Do not decide reachability from a TypeScript type.** Prove it against what produces the data, as one increment did successfully and another failed to
- **Raw wire values rendered as user copy must be aliased**, not left English: a status word in a badge is copy, not data. Two increments had to be sent back for this
- Prove a skipped file is dead by grepping its importers
- If you change an existing test or a test double, say why and confirm the assertion did not weaken
- Behavioral coverage must be **discriminating**: assert the Chinese present and the English original absent wherever the values differ. Do not add a key that cannot reach the DOM. Where a map or table drives options, assert its length against the source
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: Guardrail list, info and add/edit form

**Files:** `_components/guardrailTableColumns.tsx` (~19), `_components/guardrail_info.tsx` (~44), `_components/guardrail_info_helpers.tsx` (~36), `_components/add_guardrail_form.tsx` (~52), plus the route's list and detail entry points
**Produces:** the `guardrails` namespace (Tasks 2 to 4 extend it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. `guardrail_info_helpers.tsx` is a helper module: take a `t`.
- [ ] Catalog both locales with identical key sets, grouped by concern (`guardrails.table.*`, `guardrails.info.*`, `guardrails.form.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("guardrails")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: Guardrail garden

**Files:** `_components/guardrail_garden_data.ts` (~204), `_components/guardrail_garden_configs.ts` (~85), `_components/guardrail_garden_detail.tsx` (~28), plus the garden list view
- [ ] Same shape, extending `guardrails`. **Triage the two data files first**: provider and vendor names, guardrail type identifiers and endpoint identifiers are data and stay English; display names, descriptions, category labels and feature copy are chrome. Report the split explicitly with counts, since this is where a careless pass would translate a provider name or leave a description English.

### Task 3: Configuration editors

**Files:** `_components/content_filter/ContentFilterConfiguration.tsx` (~36), `_components/custom_code/CustomCodeModal.tsx` (~71), `_components/llm_judge/LLMJudgeFields.tsx` (~17), `_components/tool_permission/ToolPermissionRulesEditor.tsx` (~19), plus sibling editor files
- [ ] Same shape, extending `guardrails`. Editor field labels and help text are chrome; code samples, JSON keys and regex examples are data.

### Task 4: Team guardrails and remaining surfaces

**Files:** `_components/TeamGuardrailsTab.tsx` (~80), plus the remaining files in the tree
- [ ] Same shape, extending `guardrails`. Sweep the whole `guardrails/` tree afterwards and report any file deliberately skipped with its importer evidence.

---

## Later increments

Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows, plus the shared-components increment.
