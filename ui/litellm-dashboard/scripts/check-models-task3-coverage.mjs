#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DASHBOARD = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = resolve(DASHBOARD, "../..");
const BASE_COMMIT = "f104ad5a16";

const SOURCE_TESTS = {
  "src/components/ModelInfoEditForm.tsx": ["src/components/ModelInfoEditForm.i18n.test.tsx"],
  "src/components/model_info_view.tsx": ["src/components/model_info_view.i18n.test.tsx"],
  "src/components/model_dashboard/HealthChecksTableColumns.tsx": [
    "src/components/model_dashboard/HealthChecksTable.i18n.test.tsx",
  ],
  "src/components/edit_auto_router/edit_auto_router_modal.tsx": [
    "src/components/edit_auto_router/edit_auto_router_modal.i18n.test.tsx",
  ],
  "src/components/model_dashboard/HealthCheckComponent.tsx": [
    "src/components/model_dashboard/HealthCheckComponent.i18n.test.tsx",
  ],
  "src/components/model_add/CredentialsPanel.tsx": ["src/components/model_add/CredentialsPanel.i18n.test.tsx"],
  "src/components/add_model/cache_control_settings.tsx": [
    "src/components/add_model/cache_control_settings.i18n.test.tsx",
  ],
  "src/components/update_model_credentials_modal.tsx": ["src/components/update_model_credentials_modal.i18n.test.tsx"],
  "src/components/model_add/CredentialModal.tsx": ["src/components/model_add/CredentialModal.i18n.test.tsx"],
  "src/components/model_dashboard/ModelSettingsModal/ModelSettingsModal.tsx": [
    "src/components/model_dashboard/ModelSettingsModal/ModelSettingsModal.i18n.test.tsx",
  ],
  "src/components/model_add/CredentialsTableColumns.tsx": ["src/components/model_add/CredentialsTable.i18n.test.tsx"],
  "src/components/model_add/CredentialsTable.tsx": ["src/components/model_add/CredentialsTable.i18n.test.tsx"],
  "src/components/edit_auto_router/editAutoRouterFormSchema.ts": [
    "src/components/edit_auto_router/edit_auto_router_modal.i18n.test.tsx",
  ],
  "src/components/model_add/reuse_credentials.tsx": ["src/components/model_add/reuse_credentials.i18n.test.tsx"],
  "src/components/model_dashboard/HealthChecksTable.tsx": [
    "src/components/model_dashboard/HealthChecksTable.i18n.test.tsx",
  ],
};

const STUB_ONLY_TESTS = {
  "modelInfo.toastInvalidParamsJson": ["src/components/model_info_view.invalidParams.i18n.test.tsx"],
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

// A key counts only when its own component's test asserts the complete value: an exact quoted
// literal, a fully anchored {{...}} template, or a quoted literal that the render site concatenates
// the value into at one edge (e.g. "创建时间 Jan 1, 2024"). Interior substrings do not count.
const assertsCompleteLiteral = (value, testText) => {
  if (value.includes("{{")) {
    const pattern = `"${value
      .split(/\{\{[^}]*\}\}/)
      .map(escape)
      .join('[^"]*')}"`;
    return new RegExp(pattern).test(testText);
  }
  return (
    testText.includes(`"${value}"`) ||
    new RegExp(`"${escape(value)}${NON_HAN}`).test(testText) ||
    new RegExp(`${NON_HAN}${escape(value)}"`).test(testText)
  );
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
for (const file of [...Object.values(SOURCE_TESTS).flat(), ...Object.values(STUB_ONLY_TESTS).flat()]) {
  if (!testText.has(file)) testText.set(file, readFileSync(join(DASHBOARD, file), "utf8"));
}

const renderersOf = (key) => sources.filter(([, text]) => text.includes(`"${key}"`)).map(([path]) => path);
const testsFor = (key) => [...new Set(renderersOf(key).flatMap((source) => SOURCE_TESTS[source] ?? []))];
const isCovered = (key, tests) => tests.some((file) => assertsCompleteLiteral(chinese[key], testText.get(file) ?? ""));

const userReachable = [];
const stubOnly = [];
const uncovered = [];
for (const key of newKeys) {
  if (STUB_ONLY_TESTS[key]) {
    stubOnly.push([key, isCovered(key, STUB_ONLY_TESTS[key])]);
    continue;
  }
  const tests = testsFor(key);
  if (tests.length > 0 && isCovered(key, tests)) userReachable.push(key);
  else uncovered.push([key, tests]);
}

const lines = [
  `new keys: ${newKeys.length}`,
  `user-reachable covered: ${userReachable.length}`,
  `stub-only: ${stubOnly.length}`,
  `uncovered: ${uncovered.length}`,
  ...uncovered.map(([key, tests]) => `  UNCOVERED ${key} -> ${tests.join(", ") || "no test mapped"}`),
];
process.stdout.write(`${lines.join("\n")}\n`);
process.exit(uncovered.length === 0 && stubOnly.every(([, covered]) => covered) ? 0 : 1);
