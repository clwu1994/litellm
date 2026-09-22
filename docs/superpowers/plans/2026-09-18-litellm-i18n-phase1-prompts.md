# LiteLLM i18n Phase 1: Prompts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Prompts route area Chinese. Roughly 128 candidate literals across 22 production files, split into three tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: one new namespace `prompts`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

The increment covers `src/app/(dashboard)/prompts/**`. It renders the shared components (`DataTable`, `Alert`, `FormField`, `table_cells`, `DeleteResourceModal`), which the shared-components increment owns; do not translate a shared component here. `prompt_utils.tsx` and `prompt_editor_view/utils.ts` are logic modules: they return keys or take a `t`. **Prompt content, message bodies, variable names, model names, tool schemas and code samples are data and stay English.**

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

### Task 1: The prompt list, info view and prompt forms

**Files:** `_components/index.tsx` (~8), `PromptTable.tsx` (~2), `PromptTableColumns.tsx` (~11), `prompt_info.tsx` (~27), `prompt_utils.tsx`, `add_prompt_form.tsx` (~9), `tool_modal.tsx` (~5), `variable_textarea.tsx` (~5)
**Produces:** the `prompts` namespace (Tasks 2 and 3 extend it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`prompts.table.*`, `prompts.info.*`, `prompts.form.*`, `prompts.tools.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("prompts")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: The prompt editor

**Files:** `_components/prompt_editor_view/index.tsx` (~2), `PromptEditorHeader.tsx` (~9), `PromptMessagesCard.tsx` (~8), `DeveloperMessageCard.tsx` (~3), `ModelConfigCard.tsx` (~4), `ToolsCard.tsx` (~4), `PromptCodeSnippets.tsx` (~10), `PublishModal.tsx` (~6), `VersionHistorySidePanel.tsx` (~6), `DotpromptViewTab.tsx` (~2), `utils.ts`
- [ ] Same shape, extending `prompts` under `prompts.editor.*`, `prompts.publish.*`, `prompts.versions.*`. Code snippets and dotprompt content stay English; UI chrome around them is copy.

### Task 3: The conversation panel and the route page

**Files:** `_components/prompt_editor_view/conversation_panel/EmptyState.tsx`, `index.tsx` (~1), `MessageBubble.tsx`, `MessageInput.tsx` (~3), `MessageList.tsx` (~1), `VariableInput.tsx` (~1), `VariableWarning.tsx` (~1), `useConversation.ts`, `types.ts`, `page.tsx`, plus every remaining file in the route
- [ ] Same shape, extending `prompts`. Sweep the whole `prompts/` tree afterwards and report any file deliberately skipped with importer evidence, plus the increment's final per-key coverage count.

---

## Later increments

Settings, MCP Servers, Agents, Workflows, and the remaining Wave 2 route areas (Search Tools, Projects, Guardrails Monitor, Caching, Access Groups, Tag Management, Router Settings, Transform Request).
