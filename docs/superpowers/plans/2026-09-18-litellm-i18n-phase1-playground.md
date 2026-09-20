# LiteLLM i18n Phase 1: Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Playground area Chinese. Roughly 250 literals across 43 files, split into three tasks by surface.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-guardrails.md` and `...-cost-tracking.md`: one namespace `playground`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English. **Model names, provider names, API route strings such as `/v1/chat/completions`, request and response field names, and code samples are data: leave them English**
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy, and English output must be byte-identical for every value that was already English.** Two increments in this series had to be sent back for this, once because an implementer changed English output and then rewrote the existing test expectations to match. Do not adjust an existing assertion to fit a change
- Raw wire values rendered as user copy must be aliased, with the aliased `en` equal to the raw value
- **Do not decide reachability from a TypeScript type.** Prove it against what produces the data
- **An absence assertion is only meaningful while the element is under test is mounted.** For tooltip, popover or portal content, it must sit inside the same open state as the positive assertion, otherwise it passes vacuously in both locales and hides a missing translation
- Prove a skipped file is dead by grepping its importers
- If you change an existing test or a test double, say why and confirm the assertion did not weaken
- Behavioral coverage must be **discriminating**: assert the Chinese present and the English original absent wherever the values differ, individually rather than by a count or a substring regex. Do not add a key that cannot reach the DOM
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: Chat UI

**Files:** `components/chat_ui/ChatUI.tsx` (~65), `AgentBuilderView.tsx` (~29), `RealtimePlayground.tsx` (~15), `AdditionalModelSettings.tsx` (~11), `SessionManagement.tsx` (~9), `ChatComposer.tsx` (~5), plus the remaining `chat_ui/` files
**Produces:** the `playground` namespace (Tasks 2 and 3 extend it; never rename a key)

- [ ] Inventory every user-facing literal, including `aria-label`s and `title`s. Data and logic modules store keys and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`playground.chat.*`, `playground.settings.*`, `playground.sessions.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("playground")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

### Task 2: Compliance and compare UI

**Files:** `components/complianceUI/ComplianceUI.tsx` (~44), `components/compareUI/CompareUI.tsx` (~18), `compareUI/endpoint_config.ts` (~9), `compareUI/components/ComparisonPanel.tsx` (~9), `compareUI/components/MessageDisplay.tsx` (~5), plus the remaining files in both trees
- [ ] Same shape, extending `playground`. `endpoint_config.ts` is a data module: store keys there and resolve at render. API route strings and request field names stay English.

### Task 3: API call modules and the remaining route files

**Files:** `llm_calls/*` (including `a2a_send_message.tsx`, `embeddings_api.tsx`, `image_generation.tsx`, `audio_speech.tsx`, `audio_transcriptions.tsx`, `anthropic_messages.tsx`, `interactions_api.tsx`, `fetch_agents.tsx`, and siblings), plus every remaining file in the route that still holds a user-facing literal
- [ ] Same shape, extending `playground`. Sweep the whole `playground/` tree afterwards and report any file deliberately skipped with its importer evidence. Request payloads, API paths and code samples stay English.

---

## Later increments

Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows, plus the shared-components increment and the `/chat` route's own components under `src/components/chat` (~65 literals, a separate route from the Playground).
