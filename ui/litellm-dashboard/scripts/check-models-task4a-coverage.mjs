#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DASHBOARD = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(DASHBOARD, "../..");
const BASE_COMMIT = "8163047e97";

const SOURCE_TESTS = {
  "src/components/add_model/AddModelForm.tsx": ["src/components/add_model/AddModelForm.i18n.test.tsx"],
  "src/components/add_model/add_model_modes.tsx": ["src/components/add_model/AddModelForm.i18n.test.tsx"],
  "src/components/add_model/advanced_settings.tsx": ["src/components/add_model/advanced_settings.i18n.test.tsx"],
  "src/components/add_model/provider_specific_fields.tsx": [
    "src/components/add_model/provider_specific_fields.i18n.test.tsx",
  ],
  "src/components/add_model/litellm_model_name.tsx": ["src/components/add_model/litellm_model_name.i18n.test.tsx"],
  "src/components/add_model/conditional_public_model_name.tsx": [
    "src/components/add_model/conditional_public_model_name.i18n.test.tsx",
  ],
  "src/components/add_model/model_connection_test.tsx": [
    "src/components/add_model/model_connection_test.i18n.test.tsx",
  ],
  "src/components/add_model/AccessGroupTagsCombobox.tsx": [
    "src/components/add_model/AccessGroupTagsCombobox.i18n.test.tsx",
  ],
  "src/components/add_model/handle_add_model_submit.tsx": [
    "src/components/add_model/handle_add_model_submit.i18n.test.tsx",
  ],
  "src/components/add_model/cache_control_settings.tsx": [
    "src/components/add_model/cache_control_settings.i18n.test.tsx",
  ],
  "src/utils/ptuValidation.ts": ["src/components/add_model/advanced_settings.i18n.test.tsx"],
  "src/components/add_model/ComplexityRouterConfig.tsx": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/ComplexityRouterConfigSections.tsx": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/complexity_router_metadata.ts": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/TierConfigIntro.tsx": ["src/components/add_model/ComplexityRouterConfig.i18n.test.tsx"],
  "src/components/add_model/TierModelEffortRows.tsx": ["src/components/add_model/ComplexityRouterConfig.i18n.test.tsx"],
  "src/components/add_model/NonReasoningTierToggle.tsx": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/ModalityRoutingControls.tsx": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/ContextWindowEscalationConfig.tsx": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/ResponseFormatControls.tsx": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/tier_rows.ts": ["src/components/add_model/ComplexityRouterConfig.i18n.test.tsx"],
  "src/components/add_model/complexity_router_tiers.ts": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/build_complexity_router_config.ts": [
    "src/components/add_model/ComplexityRouterConfig.i18n.test.tsx",
  ],
  "src/components/add_model/ClassificationMethodConfig.tsx": [
    "src/components/add_model/autoRouterClassifier.i18n.test.tsx",
  ],
  "src/components/add_model/OpeningPromptEditor.tsx": ["src/components/add_model/autoRouterClassifier.i18n.test.tsx"],
  "src/components/add_model/ClassifierPromptEditor.tsx": [
    "src/components/add_model/autoRouterClassifier.i18n.test.tsx",
  ],
  "src/components/add_model/ClassifierReasoningEffortSelect.tsx": [
    "src/components/add_model/autoRouterClassifier.i18n.test.tsx",
  ],
  "src/components/add_model/ClassifierCircuitBreakerConfig.tsx": [
    "src/components/add_model/autoRouterClassifier.i18n.test.tsx",
  ],
  "src/components/add_model/ClassifierVisionConfig.tsx": [
    "src/components/add_model/autoRouterClassifier.i18n.test.tsx",
  ],
  "src/components/add_model/ModelChoiceCombobox.tsx": ["src/components/add_model/autoRouterClassifier.i18n.test.tsx"],
  "src/components/add_model/add_auto_router_tab.tsx": ["src/components/add_model/add_auto_router_tab.test.tsx"],
  "src/components/add_model/RouterConfigBuilder.tsx": ["src/components/add_model/autoRouterSetup.i18n.test.tsx"],
  "src/components/add_model/HeuristicScoringConfig.tsx": ["src/components/add_model/autoRouterSetup.i18n.test.tsx"],
  "src/components/add_model/heuristic_scoring_knobs.ts": ["src/components/add_model/autoRouterSetup.i18n.test.tsx"],
  "src/components/add_model/CustomDimensionRows.tsx": ["src/components/add_model/autoRouterSetup.i18n.test.tsx"],
  "src/components/add_model/custom_dimensions.ts": ["src/components/add_model/autoRouterSetup.i18n.test.tsx"],
  "src/components/add_model/handle_add_auto_router_submit.tsx": [
    "src/components/add_model/autoRouterSetup.i18n.test.tsx",
  ],
  "src/components/add_model/KeywordTierRules.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/components/add_model/SemanticKeywordMatching.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/components/add_model/StallEscalationConfig.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/components/add_model/AdaptiveRoutingConfig.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/components/add_model/AffinityControls.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/components/add_model/CompressionControls.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/components/add_model/EscalationKeywords.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/components/add_model/auto_router_connection_test.tsx": [
    "src/components/add_model/autoRouterMatching.i18n.test.tsx",
  ],
  "src/components/add_model/AutoRouterRoutingTest.tsx": ["src/components/add_model/autoRouterMatching.i18n.test.tsx"],
  "src/lib/autorouter_presets.ts": ["src/components/add_model/autoRouterSetup.i18n.test.tsx"],
};

const flatten = (node, prefix = "") =>
  Object.entries(node).flatMap(([key, value]) =>
    value !== null && typeof value === "object"
      ? flatten(value, prefix ? `${prefix}.${key}` : key)
      : [[prefix ? `${prefix}.${key}` : key, value]],
  );

const productionSources = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "__mocks__" ? [] : productionSources(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.|\.test-d\.|\.d\.ts$/.test(entry.name) ? [path] : [];
  });

const NON_HAN = "[^\\u4e00-\\u9fff]";
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TAG = /<[^>]+>/g;

// A key counts only when the test for the component that renders it asserts the complete value:
// an exact quoted literal (either quote style), a fully anchored {{...}} template, or, for a
// react-i18next <Trans> value, the tag-stripped complete sentence. Interior substrings do not count.
const assertsCompleteLiteral = (value, testText) => {
  if (value.includes("{{")) {
    const segments = value.split(/\{\{[^}]*\}\}/).map(escape);
    return new RegExp(`["']${segments.join(`[^"']*`)}["']`).test(testText);
  }
  if (TAG.test(value)) {
    const stripped = value.replace(TAG, "");
    return testText.includes(`"${stripped}"`) || testText.includes(`'${stripped}'`);
  }
  const quoted = testText.includes(`"${value}"`) || testText.includes(`'${value}'`);
  const atLeadingEdge = new RegExp(`"${escape(value)}${NON_HAN}`).test(testText);
  const atTrailingEdge = new RegExp(`${NON_HAN}${escape(value)}"`).test(testText);
  return quoted || atLeadingEdge || atTrailingEdge;
};

const baseline = JSON.parse(
  execFileSync("git", ["-C", REPO, "show", `${BASE_COMMIT}:ui/litellm-dashboard/src/i18n/locales/en/models.json`], {
    encoding: "utf8",
  }),
);
const english = JSON.parse(readFileSync(join(DASHBOARD, "src/i18n/locales/en/models.json"), "utf8"));
const chinese = Object.fromEntries(
  flatten(JSON.parse(readFileSync(join(DASHBOARD, "src/i18n/locales/zh/models.json"), "utf8"))),
);
const baselineKeys = new Set(flatten(baseline).map(([key]) => key));
const newKeys = flatten(english)
  .map(([key]) => key)
  .filter((key) => !baselineKeys.has(key));

const sources = productionSources(join(DASHBOARD, "src")).map((path) => [
  relative(DASHBOARD, path),
  readFileSync(path, "utf8"),
]);

const ASSERTION_TOKEN = /expect\w*\s*\(|(?:get|find|query)(?:All)?By[A-Z]\w*|within\s*\(|to[A-Z]\w*\(/;
const IDENTIFIER = /[A-Za-z_$][\w$]*/g;
const TEST_START = /^\s*(?:it|test)(?:\.\w+)?\s*\(/;

// A literal counts only when it sits in a test case that performs an assertion, or in a module-level
// const that such a test references. Comments are dropped first, so commented-out copy cannot be
// credited. This stays a lexical check: it does not prove the assertion executes.
const assertedText = (source) => {
  const lines = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((line) => line.replace(/(^|[^:])\/\/.*$/, "$1"));
  const starts = lines.flatMap((line, index) => (TEST_START.test(line) ? [index] : []));
  const segments = starts.map((start, position) => lines.slice(start, starts[position + 1] ?? lines.length));
  const asserting = segments.filter((segment) => segment.some((line) => ASSERTION_TOKEN.test(line))).flat();
  const referenced = new Set(asserting.flatMap((line) => line.match(IDENTIFIER) ?? []));
  const testRanges = starts.map((start, position) => [start, starts[position + 1] ?? lines.length]);
  const declarations = lines.filter((line, index) => {
    if (testRanges.some(([start, end]) => index >= start && index < end)) return false;
    const declared = /(?:const|let|var)\s+([A-Za-z_$][\w$]*)/.exec(line);
    return declared !== null && referenced.has(declared[1]);
  });
  return [...asserting, ...declarations].join("\n");
};

const CONTRACT_TEST = "src/components/add_model/autoRouterContractMessages.i18n.test.tsx";
const contractKeys = new Set(
  [...readFileSync(join(DASHBOARD, CONTRACT_TEST), "utf8").matchAll(/"([^"]*autoRouterConfig\.[^"]+)"/g)].map(
    (match) => match[1],
  ),
);

const testText = new Map();
for (const file of [...Object.values(SOURCE_TESTS).flat(), CONTRACT_TEST]) {
  if (!testText.has(file)) testText.set(file, assertedText(readFileSync(join(DASHBOARD, file), "utf8")));
}

const renderersOf = (key) => sources.filter(([, text]) => text.includes(`"${key}"`)).map(([path]) => path);
const testsFor = (key) =>
  contractKeys.has(key)
    ? [CONTRACT_TEST]
    : [...new Set(renderersOf(key).flatMap((source) => SOURCE_TESTS[source] ?? []))];
const isCovered = (key, tests) =>
  tests.length > 0 && tests.every((file) => assertsCompleteLiteral(chinese[key], testText.get(file) ?? ""));

const covered = [];
const uncovered = [];
for (const key of newKeys) {
  const tests = testsFor(key);
  if (isCovered(key, tests)) covered.push(key);
  else uncovered.push([key, tests]);
}

const lines = [
  `new keys: ${newKeys.length}`,
  `covered: ${covered.length}`,
  `uncovered: ${uncovered.length}`,
  ...uncovered.map(([key, tests]) => `  UNCOVERED ${key} -> ${tests.join(", ") || "no test mapped"}`),
];
process.stdout.write(`${lines.join("\n")}\n`);
process.exit(uncovered.length === 0 ? 0 : 1);
