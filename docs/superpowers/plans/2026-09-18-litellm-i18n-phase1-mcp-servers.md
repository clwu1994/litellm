# LiteLLM i18n Phase 1: MCP Servers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the MCP Servers route area Chinese. Roughly 492 candidate literals across 42 production files plus the `src/components/mcp_tools` tree it renders, split into four tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-models.md`: one new namespace `mcpServers`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Scope note

The increment covers `src/app/(dashboard)/mcp-servers/**` and the component trees that route renders: `src/components/mcp_tools/**` (ByokCredentialModal, McpCrudPermissionPanel, types is data), and the `MCP*` panels under `src/components/Settings/AdminSettings/` that this route embeds. Verify the render graph with a grep covering relative and aliased imports before finalizing each task's file list.

**`MCP` stays English** per the glossary, as do transport names (`stdio`, `sse`, `http`), auth method identifiers, tool names, JSON schemas and code samples. `DeprecationBanner` is a shared component and belongs to the `components (root)` increment; if it still renders English here, report it as a gap rather than translating it in this plan.

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

### Task 1: Server list, cards, view and connection status

**Files:** `_components/mcp_servers.tsx` (~26), `mcp_server_view.tsx` (~30), `MCPServerCard.tsx` (~14), `mcp_connection_status.tsx` (~13), `MCPLogoSelector.tsx` (~4), `mcp_discovery.tsx` (~4), `ImportMCPServers.tsx` (~9), `page.tsx`, plus the list and table files
**Produces:** the `mcpServers` namespace (Tasks 2-4 extend it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`mcpServers.list.*`, `mcpServers.card.*`, `mcpServers.view.*`, `mcpServers.import.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("mcpServers")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: The create and edit forms

**Files:** `_components/CreateMCPServer.tsx` (~18), `mcp_server_edit.tsx` (~31), `mcp_connect.tsx` (~43), `StdioConfiguration.tsx`, `MCPNetworkSettings.tsx` (~7), `MCPStandardsSettings.tsx` (~14), `McpFormTestHarness.tsx`, `mcpFormStore.ts`, `mcpFieldRules.ts`, plus the remaining form files
- [ ] Same shape, extending `mcpServers` under `mcpServers.form.*`, `mcpServers.network.*`, `mcpServers.standards.*`. `mcpFieldRules.ts` and `mcpFormStore.ts` are logic modules: return keys or take a `t`.

### Task 3: The auth and credential field sections

**Files:** `_components/OAuthFormFields.tsx` (~31), `IdJagFormFields.tsx` (~24), `AwsSigV4Fields.tsx` (~20), `TokenExchangeFormFields.tsx` (~15), `EnvVarsSection.tsx` (~12), `OpenApiByokFields.tsx` (~6), `UserEnvVarsModal.tsx` (~6), `OpenAPIQuickPicker.tsx`, `OpenAPIFormSection.tsx`, `DcrBridgeToggle.tsx`, `TokenEndpointAuthMethodField.tsx` (~3), `PassthroughAuthorizeSection.tsx` (~3), `UpstreamTokenHeaderField.tsx` (~2), `TruePassthroughWarning.tsx`, plus the remaining auth files
- [ ] Same shape, extending `mcpServers`. Auth method identifiers, header names and env var names stay raw.

### Task 4: Tools, toolsets, submissions, permissions and the `mcp_tools` tree

**Files:** `_components/mcp_tools.tsx` (~16), `mcp_tool_configuration.tsx` (~21), `ToolTestPanel.tsx` (~20), `MCPToolsetsTab.tsx` (~19), `MCPSubmissionsTab.tsx` (~18), `MCPPermissionManagement.tsx` (~16), `MCPToolsetTableColumns.tsx` (~11), `mcp_server_cost_config.tsx` (~10), `mcp_server_cost_display.tsx` (~3), `ToolArgumentsForm.tsx` (~6), `editToolPreview.ts`, `editServerPayload.differential.cases.ts`, plus `src/components/mcp_tools/**` (ByokCredentialModal, McpCrudPermissionPanel). **Also, assigned by Task 1's report:** `_components/importConnectorConfig.ts` (English parse-error copy rendered in the import dialog's Alert; reachable, not dead, and its existing `importConnectorConfig.test.ts` pins the English strings, so if you change the helper's contract say why and confirm the assertion did not weaken), and the `MCP*` panels this route embeds under `src/components/Settings/AdminSettings/` (`MCPSemanticFilterSettings`, `MCPToolSearchSettings`).
- [ ] Same shape, extending `mcpServers`. Sweep the whole `mcp-servers/`, `mcp_tools/` and embedded `Settings/AdminSettings/MCP*` trees afterwards and report any file deliberately skipped with importer evidence, plus the increment's final per-key coverage count.

---

## Later increments

Settings, Agents, Workflows, the `components (root)` tree, `components/permissions`, `components/templates`, and the remaining small route areas (Router Settings, Transform Request, UI Theme, API Reference, old-usage, Memory, Admin Panel, Skills).
