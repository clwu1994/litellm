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
  "src/utils/ptuValidation.ts": ["src/components/add_model/advanced_settings.i18n.test.tsx"],
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
const testText = new Map();
for (const file of Object.values(SOURCE_TESTS).flat()) {
  if (!testText.has(file)) testText.set(file, readFileSync(join(DASHBOARD, file), "utf8"));
}

const renderersOf = (key) => sources.filter(([, text]) => text.includes(`"${key}"`)).map(([path]) => path);
const testsFor = (key) => [...new Set(renderersOf(key).flatMap((source) => SOURCE_TESTS[source] ?? []))];
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
