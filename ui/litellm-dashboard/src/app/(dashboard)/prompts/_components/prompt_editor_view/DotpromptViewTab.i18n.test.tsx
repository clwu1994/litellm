import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/i18n/bootstrapI18n";
import { cleanup, renderWithProviders, screen } from "@/../tests/test-utils";

import DotpromptViewTab from "./DotpromptViewTab";

const prompt = {
  name: "welcome",
  model: "gpt-4o",
  config: { temperature: 1 },
  tools: [],
  developerMessage: "",
  messages: [{ role: "user", content: "Hello" }],
  environment: "development",
};

describe("DotpromptViewTab Chinese copy", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese chrome around the untranslated dotprompt content", () => {
    renderWithProviders(<DotpromptViewTab prompt={prompt} />);

    expect(screen.getByText("生成的 .prompt 文件")).toBeInTheDocument();
    expect(screen.queryByText("Generated .prompt file")).not.toBeInTheDocument();
    expect(screen.getByText("这是将保存到数据库的 dotprompt 格式")).toBeInTheDocument();
    expect(
      screen.queryByText("This is the dotprompt format that will be saved to the database"),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/model: gpt-4o/)).toBeInTheDocument();
    expect(screen.getByText(/User: Hello/)).toBeInTheDocument();
  });

  it("keeps the English chrome byte-identical", async () => {
    await i18n.changeLanguage("en");
    renderWithProviders(<DotpromptViewTab prompt={prompt} />);

    expect(screen.getByText("Generated .prompt file")).toBeInTheDocument();
    expect(screen.getByText("This is the dotprompt format that will be saved to the database")).toBeInTheDocument();
  });
});
