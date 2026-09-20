# LiteLLM i18n Phase 1: Cost Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Make the Cost Tracking area Chinese. Roughly 150 literals across 16 files, so it is scoped as one task.

**Architecture:** No new machinery. Follow the worked examples in `docs/superpowers/plans/2026-09-18-litellm-i18n-phase1-usage.md` and `...-logs.md`: one namespace `costTracking`, both locales, semantic keys, `t()` at render sites, helpers take a `t`, data modules store keys and resolve at render.

**Tech Stack:** Next.js 16 (static export), React 19, TypeScript 5.9, i18next 26.4.2, react-i18next 17.0.13, vitest 4.

Design reference: `docs/superpowers/specs/2026-09-14-litellm-i18n-design.md` (sections 5, 6.7, 9)

## Global Constraints

- `src/i18n/localeParity.test.ts` and `src/i18n/glossary.test.ts` stay green; keys semantic, never the English text
- Chinese follows `i18n/glossary.json`: `API Key`, `Virtual Key`, `Token`, `Endpoint`, `Base URL`, `Webhook`, `SDK`, `JWT`, `SSO`, `OAuth`, `MCP` and product or vendor names stay English. **Model names, provider names, router and benchmark identifiers, metric field names and payload keys are data: leave them English**
- Never use a void HTML element (`link`, `br`, `img`, `input`, `hr`, `meta`) as a react-i18next `<Trans>` tag
- Never resolve translations with the global i18n singleton in a non-rendering helper or an effect; take a `t`, and add it to memo **and effect** dependency arrays
- `cleanup()` before restoring the language in `afterEach`
- **Change nothing but the copy.** A Teams task smuggled `precision="date"` onto a date cell and it reached review; do not repeat that. If a non-copy change seems needed, report it instead of making it
- **Do not decide reachability from a TypeScript type.** A Logs task removed a key arguing from a frontend union, and the value turned out to be reachable at runtime from the backend, shipping an English string on the Chinese page. Prove unreachability against what produces the data
- Prove a skipped file is dead by grepping its importers
- If you change an existing test or a test double, say why and confirm the assertion did not weaken
- Behavioral coverage must be **discriminating**: assert the Chinese present and the English original absent wherever the values differ. Do not add a key that cannot reach the DOM. Where a map or table drives options, assert its length against the source so deleting an entry cannot silently drop coverage
- No `any`; no new large inline object literal arguments (ceiling 551); do not edit the budget files or commit `tsconfig.tsbuildinfo`
- `npx eslint` and `npx prettier --check` clean with **no new warning of any kind**; conventional commits, no attribution trailers

---

### Task 1: Cost Tracking area

**Files:** everything under `src/app/(dashboard)/cost-optimization/` that holds user-facing literals, notably `_components/ShadowEvalStartForm.tsx` (~28), `ShadowEvalSection.tsx` (~22), `AutoRouterBenchmarksTab.tsx` (~21), `PromptCompressionTab.tsx` (~14), `UsageTab.tsx` (~9), `costOptimizationUtils.ts` (~8), `CacheLeakageCard.tsx` (~8), `autoRouterBenchmarks.ts` (~7), `useShadowEval.ts` (~4), plus the remaining files in the tree.
**Produces:** the `costTracking` namespace

- [ ] Inventory every user-facing literal across the whole tree, including `aria-label`s and `title`s. `costOptimizationUtils.ts`, `autoRouterBenchmarks.ts` and `useShadowEval.ts` are data or logic modules: store keys there and resolve at render.
- [ ] Catalog both locales with identical key sets, grouped by concern (`costTracking.shadowEval.*`, `costTracking.benchmarks.*`, `costTracking.compression.*`, `costTracking.empty.*`).
- [ ] Register the namespace in `resources.ts` and the augmentation.
- [ ] Replace literals with `t()` from `useTranslation("costTracking")`; change nothing else.
- [ ] Behavioral coverage: every key that reaches the DOM must have a discriminating assertion under `zh`.
- [ ] Gates: the area's tests, `npx vitest run --project unit src/i18n/`, eslint with before/after warning counts, prettier. Commit and push.

---

## Later increments

Guardrails, Playground, Models and Endpoints, Settings, MCP Servers, Prompts, Agents, Workflows, plus the shared-components increment.
