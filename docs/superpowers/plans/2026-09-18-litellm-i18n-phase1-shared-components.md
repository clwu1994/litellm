# LiteLLM i18n Phase 1: Shared Components Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the shared component library Chinese. This is the cross-cutting increment every earlier route-area ledger deferred: `DataTable` renders "Filters", "Clear all", "Columns", "Refresh" and "No results" on every list view, `DeleteResourceModal` renders hardcoded confirm/cancel captions, `ModelSelect` and the budget-duration dropdown are English, and `common_components/*` holds another ~90 literals used across keys, teams, users, organizations, budgets and models. Until this lands, every already-translated page is partially English.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: extend the existing `common` namespace, both locales, semantic keys, `t()` at render sites, helpers take a `t`, module-level label data stores keys resolved at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

The increment covers three trees:

- `src/components/shared/**` (DataTable, `table_cells`, `form`, `charts`, `MultiSelect`, the `*Select` family, `PageHeader`, `PaginationStatusAlerts`, `SavingsTiles`, `CreatedKeyDisplay`, `InheritedBudgetHint`, `advanced_date_picker`, `numerical_input`)
- `src/components/common_components/**` (including `Filters/*`, `budget_duration_dropdown.tsx`, `DeleteResourceModal.tsx`, `MemberTable`, `KeyLifecycleSettings`, `AutoRotationView`, `ModelAliasManager`, `MetadataKeyValueFields`, `user_search_modal`, `RouterSettings*`, `check_openapi_schema`, `formRules`)
- `src/components/ModelSelect/**`

Approximate candidate counts measured by a broad grep (JSX text plus `placeholder`/`title`/`aria-label`/`label`/`description`/`message` props and object literals): `shared` ~62 across 22 files, `common_components` ~91 across 28 files, `ModelSelect` ~7 in 1 file. Treat these as lower bounds; the implementer re-inventories each task's files.

**Cross-file ripple:** `getBudgetDurationLabel` in `src/components/common_components/budget_duration_dropdown.tsx` returns English labels (`"daily"`, `"weekly"`, ...) and has consumers beyond the dropdown, including `src/app/(dashboard)/budgets/_components/BudgetTableColumns.tsx`, `src/app/(dashboard)/users/_components/view_users/user_info_view.tsx`, `src/components/Teams.tsx` and `src/components/TeamSSOSettings.tsx`. Its locale-invariant test assertion currently pins `"weekly"` and must flip to the Chinese label, because the value is now locale-dependent. That flip is required, not a weakening; record it in the report.

**Callers that pass English explicitly are out of scope here.** `src/app/(dashboard)/memory/_components/MemoryTable.tsx` and `src/app/(dashboard)/workflows/WorkflowRuns.tsx` pass `searchPlaceholder="..."` in English; those files belong to their own route-area increments. This increment only guarantees the shared components' own defaults are Chinese. Do not translate another route's file in this increment.

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English. **Model names, provider names, API route strings, request and response field names, and code samples are data: leave them English**
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy, and English output must be byte-identical for every value that was already English.** This went wrong three times in this series, once by rewriting an existing test to compute its expectation from the same catalog key the component reads. Never adjust an existing assertion to fit a change, and never derive a test expectation from the catalog when it should pin a literal. The one sanctioned exception is the `getBudgetDurationLabel` locale-invariant assertion described above
- **A default prop keeps its exact English text in `en` and its type and default semantics unchanged**; only the source of the value changes, from a literal to `t(...)`
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

### Task 1: DataTable core

**Files:** `src/components/shared/DataTable/DataTable.tsx` (`No results`), `DataTableToolbar.tsx` (`Search`, `Remove {label} filter`, `Refresh`, `Columns`), `DataTableFilterDrawer.tsx` (`Filters`, `Apply Filters`, `Reset`), `DataTablePagination.tsx`, `DataTableViewOptions.tsx`, `DataTableSortHeader.tsx`, `DataTableSelectionColumn.tsx`, `types.ts`, plus every remaining file in the `DataTable/` directory
**Produces:** the `common.dataTable.*` key group (Tasks 2 and 3 extend `common`; never rename a key)

- [ ] Inventory every user-facing literal in the `DataTable/` tree, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`common.dataTable.toolbar.*`, `common.dataTable.filters.*`, `common.dataTable.pagination.*`, `common.dataTable.empty.*`).
- [ ] Replace literals and default props with `t()` from `useTranslation("common")`; change nothing else. `DataTableToolbar`'s `searchPlaceholder` and `DataTableFilterDrawer`'s `title` / `applyLabel` / `resetLabel` stay overridable props whose defaults become translated.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`. The existing `DataTableToolbar.test.tsx`, `DataTableFilterDrawer.test.tsx`, `DataTablePagination.test.tsx`, `DataTable.test.tsx` and `DataTableRowSelection.test.tsx` run under the en-pinned suite and must stay green unchanged.
- [ ] Gates: the `DataTable/` tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: Filters, selectors and the budget-duration helper

**Files:** `src/components/common_components/Filters/FiltersButton.tsx`, `Filters/ResetFiltersButton.tsx`, `src/components/shared/MultiSelect.tsx`, `PaginatedMultiSelect.tsx`, `PaginatedSearchSelect.tsx`, `SearchSelect.tsx`, `src/components/ModelSelect/ModelSelect.tsx`, `src/components/common_components/ModelSelector.tsx`, `team_multi_select.tsx`, `team_dropdown.tsx`, `ProjectDropdown.tsx`, `OrganizationDropdown.tsx`, `AccessGroupSelector.tsx`, `PassThroughRoutesSelector.tsx`, `DeleteResourceModal.tsx`, `budget_duration_dropdown.tsx`, plus the remaining selector and filter files in both trees
- [ ] Same shape, extending `common` under `common.filters.*`, `common.select.*`, `common.deleteModal.*`, `common.budgetDuration.*`. The select primitives' placeholder text is copy; option values stay raw.
- [ ] `getBudgetDurationLabel` takes a `t` (or returns a key-plus-values contract) and resolves at render; update every consumer and flip the locale-invariant assertion as described in the scope note. Sweep all consumers and report each one.
- [ ] Sweep both trees afterwards and report any file deliberately skipped with importer evidence.

### Task 3: The remaining shared and common components

**Files:** `src/components/shared/table_cells/*` (including `models_cell.tsx`, `UserPopoverCell.tsx`), `advanced_date_picker.tsx`, `numerical_input.tsx`, `charts/*`, `PageHeader.tsx`, `PaginationStatusAlerts.tsx`, `SavingsTiles.tsx`, `CreatedKeyDisplay.tsx`, `InheritedBudgetHint.tsx`, `AdminOnlyNotice.tsx`, `src/components/common_components/MemberTable.tsx`, `KeyLifecycleSettings.tsx`, `AutoRotationView.tsx`, `ModelAliasManager.tsx`, `user_search_modal.tsx`, `MetadataKeyValueFields.tsx`, `check_openapi_schema.tsx`, `formRules.ts`, `RouterSettingsSummary.tsx`, `RouterSettingsAccordion.tsx`, `simple_table.tsx`, `UserDropdown.tsx`, `NewBadge.tsx`, `LoadingScreen.tsx`, `DefaultProxyAdminTag.tsx`, `PremiumLoggingSettings.tsx`, `RateLimitTypeFormItem.tsx`, plus every remaining production file in both trees
- [ ] Same shape, extending `common`. Helper modules (`formRules.ts`, `check_openapi_schema.tsx`) return keys or take a `t`; do not resolve with the singleton.
- [ ] Sweep `src/components/shared/**`, `src/components/common_components/**` and `src/components/ModelSelect/**` at the end and report every remaining file that still holds user-facing English, with importer evidence for each deliberate skip. Report the final per-key coverage count for the increment.

---

## Later increments

Settings, MCP Servers, Prompts, Agents, Workflows, and the remaining Wave 2 route areas (Policies, Vector Stores, Cost Optimization, Prompts, Search Tools, Projects, Guardrails Monitor, Caching, Access Groups, Tag Management, Workflows, Router Settings, Transform Request).
