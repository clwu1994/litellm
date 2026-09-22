# LiteLLM i18n Phase 1: Component trees Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Translate the remaining component trees under `src/components/` that the route-area increments do not own. Roughly 1,400 candidate literals, split into tasks by tree. Each task owns one or two trees and one namespace (or extends an existing one where the tree is clearly part of that area).

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: one namespace per area, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

This increment covers the component trees that no route-area increment owns. Some are rendered by several routes, so the task that owns the tree also owns the namespace. `src/components/{shared,common_components,ModelSelect}` belong to the shared-components increment; `add_model`, `model_dashboard`, `edit_auto_router`, `model_add`, `model_info_view` to Models; `mcp_tools`, `mcp_server_management` to MCP Servers; `agent_management` to Agents; `skills`, `search_tools`, `tag_management`, `vector_store_management`, `GuardrailsMonitor` to their route increments. Do not duplicate those.

**Before finalizing a task's file list, verify the render graph with a grep covering relative and aliased imports**, and record each tree's namespace decision in the report.

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

### Task 1: Settings, part 1 (Admin Settings)

**Namespace:** `settings` (new). **Files:** `src/components/Settings/AdminSettings/**`, including `SSOSettings/**`, `UISettings/**`, `LoggingSettings/**`, `PluginSettings/**`, `UserBannerSettings/**`, `HashicorpVault/**`, `CyberArk/**`, `MCPSemanticFilterSettings/**`, `MCPToolSearchSettings/**` and siblings

### Task 2: Settings, part 2 (Router, Logging and Alerts, remaining panels)

**Namespace:** `settings` (extends Task 1; never rename a key). **Files:** the rest of `src/components/Settings/**`

### Task 3: AI Hub and public model hub

**Namespace:** `modelHub` (new). **Files:** `src/components/AIHub/**` (`ModelHubTable.tsx` and siblings), `src/components/public_model_hub.tsx`, `src/components/PublicModelHubTableColumns.tsx`, `src/components/publicModelHub/**`. Model and provider descriptions that come from the data source stay English.

### Task 4: Key and user templates

**Namespace:** `templates` (new). **Files:** `src/components/templates/**` (`key_info_view.tsx`, `key_edit_view.tsx`, `KeyInfoHeader.tsx` and siblings), `src/components/organisms/**`, `src/components/key_team_helpers/**` (user-facing copy only), `src/components/CreateUserButton.tsx`, `src/components/bulk_create_users_button.tsx`. If a helper is shared logic, return keys or take a `t`.

### Task 5: Organizations and Teams components

**Namespace:** `organizations` (extends the existing namespace) and `teams` (extends the existing namespace). **Files:** `src/components/organization/**`, `src/components/TeamsPage/**`, `src/components/team/**`, `src/components/DeletedTeamsPage/**`, `src/components/DeletedKeysPage/**`, `src/components/TeamSSOSettings.tsx`. Reuse the existing namespaces; never rename a key.

### Task 6: The `/chat` route's components and the chat_ui gaps

**Namespace:** `chat` (new). **Files:** `src/components/chat/**` (`KeysPanel.tsx`, `LogsPanel.tsx` and siblings), plus the playground-ledger gaps in `src/components/chat_ui/**` (`ReasoningContent`, `MCPEventsDisplay`, `ResponseMetrics`) which extend `playground` rather than `chat`.

### Task 7: Tool policies, routing groups and the remaining small trees

**Namespace:** per tree, extending the closest existing area namespace. **Files:** `src/components/ToolPolicies/**`, `src/components/routing_groups/**`, `src/components/router_settings/**`, `src/components/CloudZeroCostTracking/**`, `src/components/claude_code_plugins/**`, `src/components/permissions/**`, `src/components/alerting/**`, `src/components/email_events/**`, `src/components/EntityUsageExport/**`, `src/components/ui/**` (user-facing copy only, including the sr-only `Close` in `src/components/ui/dialog.tsx`), `src/components/DeprecationBanner.tsx` (English end to end; seven route importers, including Prompts, Memory, Playground, API Reference, Workflows, old-usage and MCP Servers), `src/components/SidebarAccountMenu/**` (including the carried-forward `Thanks for using LiteLLM!`), and the remaining root-level `src/components/*.tsx` files (`settings.tsx`, `user_agent_activity.tsx`, `ToolDetail.tsx`, `callback_info_helpers.tsx`, `vector_store_providers.tsx`, `object_permissions_view.tsx`, `logging_settings_view.tsx`, `email_settings.tsx`, `price_data_reload.tsx`, `route_preview.tsx`, `add_pass_through.tsx`, `pass_through_info.tsx`, `per_user_usage.tsx`, `SSOModals.tsx`, `LicenseExpiryBanner.tsx`, `SidebarUsageCard.tsx`, `GuardrailSettingsView.tsx`, `activity_metrics.tsx`, `cloudzero_export_modal.tsx`)

### Task 8: Library-level user-facing copy (`src/lib`, `src/utils`)

**Namespace:** `errors` (new) or `common` where the copy is generic. **Files:** `src/lib/toast.ts` (hardcoded English titles `"Error"`, `"Access Denied"` and siblings at `:31-49,124-129`, so every failure toast in the dashboard currently shows an English title above a Chinese description; surfaced by the Policies Task 2 review), plus any other `src/lib/**` or `src/utils/**` module that builds user-facing copy (`formatTime`/`toLocaleString` date-formatting helpers are the recorded browser-locale-vs-app-locale follow-up, not this task). `toast.ts` is not a React module, so it must take a `t` or a key and resolve at the call site rather than reading the singleton.

---

Each task follows the same steps:

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern. Register any new namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("<namespace>")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the tree's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.
- [ ] Sweep the tree at the end and report any file deliberately skipped with importer evidence, plus the increment's per-key coverage count.

---

## Closing the phase

When every task above and every route-area increment has landed, run a repo-wide sweep for remaining user-facing English in `ui/litellm-dashboard/src`, reconcile it against the Phase 0 inventory (`docs/i18n/inventory-ui-strings.md`), and record the final coverage number before declaring Phase 1 complete.
