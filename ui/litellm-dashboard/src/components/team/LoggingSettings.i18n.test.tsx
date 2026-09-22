import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import LoggingSettings from "./LoggingSettings";

const DESCRIPTIONS: Array<{ id: string; name: string; zh: string; en: string }> = [
  { id: "arize", name: "Arize", zh: "Arize 日志集成", en: "Arize Logging Integration" },
  { id: "braintrust", name: "Braintrust", zh: "Braintrust 日志集成", en: "Braintrust Logging Integration" },
  {
    id: "custom_callback_api",
    name: "Custom Callback API",
    zh: "自定义回调 API 日志集成",
    en: "Custom Callback API Logging Integration",
  },
  { id: "galileo", name: "Galileo", zh: "Galileo AI 可观测性集成", en: "Galileo AI Observability Integration" },
  { id: "datadog", name: "Datadog", zh: "Datadog 日志集成", en: "Datadog Logging Integration" },
  { id: "newrelic", name: "New Relic", zh: "New Relic 日志集成", en: "New Relic Logging Integration" },
  { id: "lago", name: "Lago", zh: "Lago 计费日志集成", en: "Lago Billing Logging Integration" },
  { id: "langfuse", name: "Langfuse", zh: "Langfuse v2 日志集成", en: "Langfuse v2 Logging Integration" },
  {
    id: "langfuse_otel",
    name: "Langfuse OTEL",
    zh: "Langfuse v3 OTEL 日志集成",
    en: "Langfuse v3 OTEL Logging Integration",
  },
  { id: "langsmith", name: "LangSmith", zh: "Langsmith 日志集成", en: "Langsmith Logging Integration" },
  { id: "openmeter", name: "OpenMeter", zh: "OpenMeter 日志集成", en: "OpenMeter Logging Integration" },
  { id: "otel", name: "Open Telemetry", zh: "OpenTelemetry 日志集成", en: "OpenTelemetry Logging Integration" },
  { id: "pointfive", name: "PointFive", zh: "PointFive 日志集成", en: "PointFive Logging Integration" },
  { id: "s3", name: "S3", zh: "S3 存储桶（AWS）日志集成", en: "S3 Bucket (AWS) Logging Integration" },
  { id: "SQS", name: "SQS", zh: "SQS 队列（AWS）日志集成", en: "SQS Queue (AWS) Logging Integration" },
];

describe("LoggingSettings callback descriptions Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it.each(DESCRIPTIONS)("renders the $id callback description in Chinese", async ({ name, zh, en }) => {
    const user = userEvent.setup();
    renderWithProviders(<LoggingSettings value={[]} onChange={vi.fn()} disabledCallbacks={[]} />);

    await user.click(screen.getByRole("combobox"));
    const option = await screen.findByRole("option", {
      name: (_n, element) => element?.textContent?.endsWith(name) === true,
    });
    await user.hover(within(option).getByText(name, { exact: false }));

    expect(await screen.findByText(zh)).toBeInTheDocument();
    expect(screen.queryByText(en)).not.toBeInTheDocument();
  });
});
