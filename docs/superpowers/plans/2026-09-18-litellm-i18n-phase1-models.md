# LiteLLM i18n Phase 1: Models and Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Models and Endpoints area Chinese. Roughly 200 literals across 27 files, split into two tasks.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-playground.md` and `...-guardrails.md`: one namespace `models`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

The increment covers `src/app/(dashboard)/models-and-endpoints/` **and the component trees that route renders**, which the original version of this note wrongly excluded. The route imports them by alias, verified by grep:

- `panels/AddModelPanel.tsx` -> `@/components/add_model/AddModelForm`, `@/components/add_model/handle_add_model_submit`
- `panels/LlmCredentialsPanel.tsx` -> `@/components/model_add/CredentialsPanel`
- `panels/HealthStatusPanel.tsx` -> `@/components/model_dashboard/HealthCheckComponent`
- `components/AllModelsTab.tsx` -> `@/components/model_dashboard/ModelSettingsModal/ModelSettingsModal`
- `components/ModelsTableColumns.tsx` and `AllModelsTable.tsx` -> `@/components/model_dashboard/types`
- `components/AutoRouters/autoRouterRows.ts` -> `@/components/add_model/auto_router_strategies`, `@/components/add_model/complexity_router_tiers`
- `components/AutoRouters/AutoRoutersPanel.tsx` -> `@/components/add_model/add_auto_router_tab`

So `add_model` (~138 literals), `model_dashboard` (~15), `model_add` (~12) and `model_info_view.tsx` / `ModelInfoEditForm.tsx` (~23) are part of this increment, not later work. Leaving them English would make the Models page half-Chinese, which is the failure that got the Budgets increment sent back. Task 3 below covers them.

Process note: the controller's first grep missed these because the pattern only matched a narrow alias form; the implementer's own check found them and corrected the scope. Verify scope claims with a grep that covers relative and aliased imports.

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English. **Model names, provider names, API route strings, request and response field names, and code samples are data: leave them English**
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy, and English output must be byte-identical for every value that was already English.** This went wrong three times in this series, once by rewriting an existing test to compute its expectation from the same catalog key the component reads. Never adjust an existing assertion to fit a change, and never derive a test expectation from the catalog when it should pin a literal
- **An absence assertion is only meaningful while the element under test is mounted.** For tooltip, popover, dialog or portal content it must sit inside the same open state as the positive assertion
- **The per-key coverage check must tie each key to its own assertion.** Searching for the text anywhere lets a duplicate value mask an unrendered key
- **In a language with a single plural category, non-`other` leaves are dead copy.** Chinese only has `other`, so `_one` is never resolved under `zh`; assert such a leaf under the locale that selects it or record it as unreachable, and derive the category from `Intl.PluralRules(i18n.language)`
- **Do not store translated strings as data or grouping keys**; a runtime language switch would split groups and leave stale translations
- Raw wire values rendered as user copy must be aliased, with the aliased `en` equal to the raw value
- **Do not decide reachability from a TypeScript type.** Prove it against what produces the data
- Prove a skipped file is dead by grepping its importers
- If you change an existing test or a test double, say why and confirm the assertion did not weaken
- Behavioral coverage must be **discriminating**: assert the Chinese present and the English original absent wherever the values differ, individually rather than by a count or a substring regex. Do not add a key that cannot reach the DOM
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: Models table and tabs

**Files:** `components/ModelsTableColumns.tsx` (~38), `components/AllModelsTable.tsx` (~21), `page.tsx` (~16), `components/AllModelsTab.tsx` (~14), `panels/AllModelsPanel.tsx`, plus the remaining list and tab files
**Produces:** the `models` namespace (Task 2 extends it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`models.table.*`, `models.tabs.*`, `models.empty.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("models")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: Retry settings, price data, auto routers and access-group budgets

**Files:** `components/ModelRetrySettingsTab.tsx` (~11), `components/AccessGroupBudgetColumns.tsx` (~14), `components/AutoRouters/AutoRoutersTableColumns.tsx` (~10), `AutoRouters/autoRouterRows.ts` (~8), `AutoRouters/AutoRoutersPanel.tsx` (~6), `panels/AccessGroupBudgetsPanel.tsx` (~5), `components/AccessGroupBudgetModal.tsx`, `components/PriceDataManagementTab.tsx`, plus every remaining file in the route tree
- [ ] Same shape, extending `models`. `autoRouterRows.ts` is a data module: store keys there and resolve at render. Sweep the whole route tree afterwards and report any file deliberately skipped with importer evidence.

### Task 3: The model component trees the route renders

**Files:** `src/components/add_model/*` (~138 literals), `src/components/model_dashboard/*` (~15), `src/components/model_add/*` (~12), `src/components/model_info_view.tsx` and `src/components/ModelInfoEditForm.tsx` (~23)

- [ ] Same shape, extending `models`. **This task exists because these trees render inside the Models page**: until it lands, the add-model form, the credentials panel, the health panel and the model settings modal are English inside an otherwise Chinese page. Sweep all four trees and report any file deliberately skipped with importer evidence.

### Task 4: The `add_model` tree (deferred, increment NOT closed until it lands)

**Files:** `src/components/add_model/*` — 54 production files, 523-585 user-facing sites

**Why this is its own task and not a fix round:** the plan's ~138-site estimate for this tree was wrong by roughly 4x. The reviewer measured 54 production files and 523 prose sites independently, and confirmed the structural difficulty is real: `TIER_DESCRIPTIONS`, `CLASSIFICATION_RUBRIC_DESCRIPTIONS`, `GROUPS` and `TEST_MODES` are module-level data consumed by logic (one comparison reads `TIER_DESCRIPTIONS[tier].label`), and the `getTierLabelsError` / `getMissingTiersError` / `getPlanModeTierError` / `customDimensionsError` family returns English strings that need `{key, values}` contracts. That is ~500-600 sites, ~500-600 per-key assertions, and contract changes across about ten logic modules plus their existing unit tests. `AUTO_ROUTER_MODES` is genuinely dead and can be deleted.

**Known gap until this lands:** `page.tsx` renders `AddModelPanel`, which renders `AddModelForm`, and `AutoRoutersPanel` pulls in `add_auto_router_tab`. The Add Model tab is admin-gated, so a non-admin sees a fully Chinese page, but an admin sees a Chinese tab label over an entirely English form. The Models page is therefore knowingly half-Chinese for admins, and this increment is not complete until this task lands.

- [ ] Translate `add_model/*` into `models` keys, converting the module-level label data and the error-returning helpers to key-plus-values contracts resolved at render.
- [ ] Every key that reaches the DOM gets its own discriminating assertion; the increment's bar is not lowered for this task.

---

## Later increments

Settings, MCP Servers, Prompts, Agents, Workflows, plus the shared-components increment.
