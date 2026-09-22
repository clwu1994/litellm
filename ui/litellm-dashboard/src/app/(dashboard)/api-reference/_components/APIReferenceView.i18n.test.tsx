import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cleanup, renderWithProviders, screen, within } from "@/../tests/test-utils";
import i18n from "@/i18n/bootstrapI18n";

import APIReferenceView from "./APIReferenceView";

vi.mock("@/components/CodeBlock", () => ({
  __esModule: true,
  default: ({ code }: { code: string }) => <pre data-testid="api-reference-code-block">{code}</pre>,
}));

const renderView = () =>
  renderWithProviders(<APIReferenceView proxySettings={{ PROXY_BASE_URL: "https://proxy.litellm.test" }} />);

describe("APIReferenceView Chinese copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("zh");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("renders the Chinese heading and blurb and hides the English originals", () => {
    renderView();

    expect(screen.getByRole("heading", { level: 1, name: "OpenAI 兼容代理：API 参考" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { level: 1, name: "OpenAI Compatible Proxy: API Reference" }),
    ).not.toBeInTheDocument();

    expect(
      screen.getByText(
        "LiteLLM 与 OpenAI 兼容。这意味着你的 API Key 可与 OpenAI SDK 配合使用。只需替换 base_url，使其指向你的 litellm 代理。示例如下",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        "LiteLLM is OpenAI Compatible. This means your API Key works with the OpenAI SDK. Just replace the base_url to point to your litellm proxy. Example Below",
      ),
    ).not.toBeInTheDocument();
  });

  it("keeps the three SDK tab labels, which are product names", () => {
    renderView();

    expect(screen.getByRole("tab", { name: "OpenAI Python SDK" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "LlamaIndex" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Langchain Py" })).toBeInTheDocument();
  });

  it("renders the Chinese docs link copy and hides the English originals", () => {
    renderView();

    const docsLink = screen.getByRole("link", { name: /API 参考文档/ });
    expect(within(docsLink).getByText("API 参考文档")).toBeInTheDocument();
    expect(within(docsLink).getByText("（在新标签页中打开）")).toBeInTheDocument();
    expect(docsLink).toHaveAttribute("title", "在新标签页中打开文档");
    expect(docsLink).toHaveAttribute("href", "https://docs.litellm.ai/docs/proxy/user_keys");

    expect(screen.queryByRole("link", { name: /API Reference Docs/ })).not.toBeInTheDocument();
    expect(within(docsLink).queryByText("API Reference Docs")).not.toBeInTheDocument();
    expect(within(docsLink).queryByText("(opens in a new tab)")).not.toBeInTheDocument();
    expect(docsLink).not.toHaveAttribute("title", "Open documentation in a new tab");
  });
});

describe("APIReferenceView English copy", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  it("keeps every original English string byte-identical", () => {
    renderView();

    expect(
      screen.getByRole("heading", { level: 1, name: "OpenAI Compatible Proxy: API Reference" }),
    ).toBeInTheDocument();
    const blurb = screen.getByText(
      "LiteLLM is OpenAI Compatible. This means your API Key works with the OpenAI SDK. Just replace the base_url to point to your litellm proxy. Example Below",
    );
    expect(blurb).toHaveTextContent(
      "LiteLLM is OpenAI Compatible. This means your API Key works with the OpenAI SDK. Just replace the base_url to point to your litellm proxy. Example Below ",
      { normalizeWhitespace: false },
    );

    expect(screen.getByRole("tab", { name: "OpenAI Python SDK" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "LlamaIndex" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Langchain Py" })).toBeInTheDocument();

    const docsLink = screen.getByRole("link", { name: /API Reference Docs/ });
    expect(within(docsLink).getByText("API Reference Docs")).toBeInTheDocument();
    expect(within(docsLink).getByText("(opens in a new tab)")).toBeInTheDocument();
    expect(docsLink).toHaveAttribute("title", "Open documentation in a new tab");
  });
});
